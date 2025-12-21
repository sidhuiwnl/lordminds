from datetime import datetime
from typing import List
from fastapi import APIRouter, Form, HTTPException
from pydantic import BaseModel
from config.database import get_db

router = APIRouter()

@router.get("/topic-subtopic")
async def get_topic_subtopic(department_id : int):
    """Fetch topics and their subtopics for a given department"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Fetch topics
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number 
                    FROM topics 
                    WHERE department_id = %s AND is_active = TRUE
                    ORDER BY topic_number
                """, (department_id,))
                topics = cursor.fetchall()

                # For each topic, fetch its subtopics
                for topic in topics:
                    cursor.execute("""
                        SELECT sub_topic_id, sub_topic_name, sub_topic_order, overview_video_url, file_name,
                               CASE 
                                   WHEN overview_content IS NOT NULL 
                                   THEN TRUE 
                                   ELSE FALSE 
                               END as has_document,
                               is_active, created_at
                        FROM sub_topics 
                        WHERE topic_id = %s AND is_active = TRUE
                        ORDER BY sub_topic_order
                    """, (topic['topic_id'],))
                    subtopics = cursor.fetchall()
                    topic['sub_topics'] = subtopics

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")
    



@router.get("/get-topic-with-subtopics")
async def get_topic_with_subtopics():
    """Fetch all topics with their subtopics and question counts (global topics)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Fetch all active topics (global - no department/college context)
                cursor.execute("""
                    SELECT 
                        topic_id, 
                        topic_name, 
                        topic_number
                    FROM topics 
                    WHERE is_active = TRUE
                    ORDER BY topic_number
                """)
                topics = cursor.fetchall()
                
                if not topics:
                    return {"status": "success", "count": 0, "data": []}

                topic_ids = [t['topic_id'] for t in topics]

                # 2️⃣ Fetch all subtopics for these topics
                cursor.execute(f"""
                    SELECT 
                        sub_topic_id, 
                        topic_id, 
                        sub_topic_name, 
                        sub_topic_order, 
                        overview_video_url,
                        file_name, 
                        test_file,
                        CASE 
                            WHEN overview_content IS NOT NULL AND LENGTH(TRIM(overview_content)) > 0 
                            THEN TRUE 
                            ELSE FALSE 
                        END as has_document
                    FROM sub_topics
                    WHERE topic_id IN ({','.join(['%s']*len(topic_ids))}) 
                    AND is_active = TRUE
                    ORDER BY topic_id, sub_topic_order
                """, tuple(topic_ids))
                subtopics_all = cursor.fetchall()

                # 3️⃣ Fetch question counts for subtopics
                question_counts = {}
                if subtopics_all:
                    subtopic_ids = [st['sub_topic_id'] for st in subtopics_all]
                    
                    cursor.execute(f"""
                        SELECT 
                            reference_id, 
                            COUNT(*) as total_questions,
                            SUM(marks) as total_marks
                        FROM questions
                        WHERE test_scope = 'sub_topic' 
                        AND reference_id IN ({','.join(['%s']*len(subtopic_ids))})
                        GROUP BY reference_id
                    """, tuple(subtopic_ids))
                    
                    for row in cursor.fetchall():
                        question_counts[row['reference_id']] = {
                            'total_questions': row['total_questions'],
                            'total_marks': row['total_marks'] or 0
                        }

                # 4️⃣ Map subtopics to topics
                topic_dict = {}
                for topic in topics:
                    topic_dict[topic['topic_id']] = {
                        **topic,
                        'sub_topics': [],
                        'total_questions': 0,
                        'total_marks': 0,
                        'sub_topics_count': 0
                    }

                for st in subtopics_all:
                    question_info = question_counts.get(st['sub_topic_id'], {'total_questions': 0, 'total_marks': 0})
                    
                    subtopic_data = {
                        **st,
                        'total_questions': question_info['total_questions'],
                        'total_marks': question_info['total_marks']
                    }
                    
                    topic_dict[st['topic_id']]['sub_topics'].append(subtopic_data)

                # 5️⃣ Calculate totals
                for topic in topic_dict.values():
                    topic['total_questions'] = sum(st['total_questions'] for st in topic['sub_topics'])
                    topic['total_marks'] = sum(st['total_marks'] for st in topic['sub_topics'])
                    topic['sub_topics_count'] = len(topic['sub_topics'])

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": list(topic_dict.values())
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")



@router.get("/all-topics")
async def get_all_topics():
    """Fetch all active global topics (no department association)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number
                    FROM topics 
                    WHERE is_active = TRUE
                    ORDER BY topic_name
                """)
                topics = cursor.fetchall()
                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics: {str(e)}")
    


class AssignTopicsRequest(BaseModel):
    college_id: int
    department_id: int
    topic_ids: list[int]


@router.post("/assign-topics")
async def assign_topics_to_college_department(payload: AssignTopicsRequest):
    """
    Assign topics to a college + department
    using topic_college_department mapping table
    """

    assigned = 0
    skipped = []

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate college
                cursor.execute(
                    "SELECT college_id FROM colleges WHERE college_id = %s AND is_active = 1",
                    (payload.college_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="College not found")

                # 2️⃣ Validate department
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id = %s AND is_active = 1",
                    (payload.department_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Department not found")

                # 3️⃣ Assign topics
                for topic_id in payload.topic_ids:

                    # Validate topic
                    cursor.execute(
                        "SELECT topic_id FROM topics WHERE topic_id = %s AND is_active = 1",
                        (topic_id,)
                    )
                    if not cursor.fetchone():
                        skipped.append(topic_id)
                        continue

                    # Insert or reactivate assignment
                    cursor.execute(
                        """
                        INSERT INTO topic_college_department
                            (topic_id, college_id, department_id, is_active)
                        VALUES (%s, %s, %s, 1)
                        ON DUPLICATE KEY UPDATE
                            is_active = 1,
                            assigned_at = CURRENT_TIMESTAMP
                        """,
                        (topic_id, payload.college_id, payload.department_id)
                    )
                    assigned += 1

                conn.commit()

                return {
                    "status": "success",
                    "assigned_count": assigned,
                    "skipped_topic_ids": skipped
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error assigning topics: {str(e)}"
        )




# @router.post("/assign-topics")
# async def assign_topics_to_college_department(payload: AssignTopicsRequest):
#     """
#     Create topics for a specific college + department.
#     Topics are fully isolated per college + department.
#     """
#     try:
#         with get_db() as conn:
#             with conn.cursor() as cursor:

#                 # 1️⃣ Get college ID
#                 cursor.execute("""
#                     SELECT college_id 
#                     FROM colleges 
#                     WHERE name = %s AND is_active = 1
#                 """, (payload.college_name,))
#                 college = cursor.fetchone()

#                 if not college:
#                     raise HTTPException(status_code=404, detail="College not found")

#                 college_id = college["college_id"]

#                 # 2️⃣ Get department ID (must belong to this college)
#                 cursor.execute("""
#                     SELECT department_id
#                     FROM departments
#                     WHERE department_name = %s
#                       AND college_id = %s
#                       AND is_active = 1
#                 """, (payload.department_name, college_id))

#                 department = cursor.fetchone()

#                 if not department:
#                     raise HTTPException(
#                         status_code=404,
#                         detail=f"Department '{payload.department_name}' not found under '{payload.college_name}'"
#                     )

#                 department_id = department["department_id"]

#                 assigned_topics = []
#                 skipped_topics = []

#                 # 3️⃣ Insert or skip topics
#                 for topic_name in payload.topics:

#                     # Check if topic exists
#                     cursor.execute("""
#                         SELECT topic_id 
#                         FROM topics
#                         WHERE topic_name = %s
#                           AND college_id = %s
#                           AND department_id = %s
#                     """, (topic_name, college_id, department_id))

#                     exists = cursor.fetchone()

#                     if exists:
#                         skipped_topics.append(topic_name)
#                         continue

#                     # Insert new topic
#                     cursor.execute("""
#                         INSERT INTO topics 
#                         (topic_name, topic_number, total_sub_topics, college_id, department_id, is_active, created_at, updated_at)
#                         VALUES (%s, NULL, 0, %s, %s, 1, NOW(), NOW())
#                     """, (topic_name, college_id, department_id))

#                     assigned_topics.append(topic_name)

#                 conn.commit()

#                 return {
#                     "status": "success",
#                     "message": f"Assigned {len(assigned_topics)} topic(s) to {payload.department_name} at {payload.college_name}",
#                     "created_topics": assigned_topics,
#                     "skipped_topics": skipped_topics,
#                     "college_id": college_id,
#                     "department_id": department_id
#                 }

#     except HTTPException:
#         raise

#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Unexpected error: {str(e)}"
#         )


# @router.get("/{user_id}/subtopics")
# async def get_user_subtopics(user_id: int):
#     """Fetch subtopics for the department of the given user"""
#     try:
#         with get_db() as conn:
#             with conn.cursor() as cursor:
#                 # 1️⃣ Get user's department_id
#                 cursor.execute("""
#                     SELECT department_id 
#                     FROM users 
#                     WHERE user_id = %s AND is_active = TRUE
#                 """, (user_id,))
#                 user = cursor.fetchone()
#                 if not user:
#                     raise HTTPException(status_code=404, detail="User not found")
#                 department_id = user['department_id']

#                 # 2️⃣ Fetch topics for the department
#                 cursor.execute("""
#                     SELECT topic_id, topic_name, topic_number 
#                     FROM topics 
#                     WHERE department_id = %s AND is_active = TRUE
#                     ORDER BY topic_number
#                 """, (department_id,))
#                 topics = cursor.fetchall()
#                 topic_ids = [t['topic_id'] for t in topics]

#                 if not topic_ids:
#                     return {"status": "success", "count": 0, "data": []}

#                 # 3️⃣ Fetch subtopics for these topics
#                 cursor.execute(f"""
#                     SELECT sub_topic_id, topic_id, sub_topic_name, sub_topic_order, overview_video_url,
#                            file_name, test_file,
#                            CASE WHEN overview_content IS NOT NULL THEN TRUE ELSE FALSE END as has_document,
#                            is_active, created_at
#                     FROM sub_topics
#                     WHERE topic_id IN ({','.join(['%s']*len(topic_ids))}) AND is_active = TRUE
#                     ORDER BY sub_topic_order
#                 """, tuple(topic_ids))
#                 subtopics_all = cursor.fetchall()

#                 # 4️⃣ Map subtopics to their topics
#                 topic_dict = {t['topic_id']: t for t in topics}
#                 for st in subtopics_all:
#                     topic_dict[st['topic_id']].setdefault('sub_topics', []).append(st)

#                 return {
#                     "status": "success",
#                     "count": len(topics),
#                     "data": list(topic_dict.values())
#                 }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error fetching subtopics for user: {str(e)}")   
# 
#  

@router.get("/{user_id}/subtopics")
async def get_user_subtopics(user_id: int):
    """
    Fetch ALL topics + subtopics + progress for a student
    using NEW schema:
    topics (global)
    topic_college_department (mapping)
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate user
                cursor.execute("""
                    SELECT user_id, college_id, department_id
                    FROM users
                    WHERE user_id = %s
                      AND is_active = 1
                """, (user_id,))
                user = cursor.fetchone()

                if not user:
                    raise HTTPException(status_code=404, detail="User not found or inactive")

                college_id = user["college_id"]
                department_id = user["department_id"]

                # 2️⃣ Fetch ACTIVE topics via mapping table
                cursor.execute("""
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        t.topic_number
                    FROM topic_college_department tcd
                    JOIN topics t 
                        ON t.topic_id = tcd.topic_id
                    WHERE tcd.college_id = %s
                      AND tcd.department_id = %s
                      AND tcd.is_active = 1
                      AND t.is_active = 1
                    ORDER BY CAST(t.topic_number AS UNSIGNED), t.topic_name
                """, (college_id, department_id))

                topics = cursor.fetchall()
                if not topics:
                    return {
                        "status": "success",
                        "count": 0,
                        "data": []
                    }

                topic_ids = [t["topic_id"] for t in topics]

                # 3️⃣ Fetch ACTIVE sub-topics
                cursor.execute(
                    f"""
                    SELECT 
                        sub_topic_id,
                        topic_id,
                        sub_topic_name,
                        sub_topic_order,
                        overview_video_url,
                        file_name,
                        test_file,
                        CASE 
                            WHEN overview_content IS NOT NULL THEN TRUE 
                            ELSE FALSE 
                        END AS has_document,
                        created_at
                    FROM sub_topics
                    WHERE topic_id IN ({",".join(["%s"] * len(topic_ids))})
                      AND is_active = 1
                    ORDER BY sub_topic_order
                    """,
                    tuple(topic_ids)
                )

                subtopics = cursor.fetchall()
                if not subtopics:
                    return {
                        "status": "success",
                        "count": len(topics),
                        "data": []
                    }

                subtopic_ids = [s["sub_topic_id"] for s in subtopics]

                # 4️⃣ Fetch student progress
                cursor.execute(
                    f"""
                    SELECT 
                        sub_topic_id,
                        is_completed,
                        COALESCE(score, 0) AS score,
                        COALESCE(time_spent_minutes, 0) AS time_spent_minutes,
                        last_accessed
                    FROM student_subtopic_progress
                    WHERE student_id = %s
                      AND sub_topic_id IN ({",".join(["%s"] * len(subtopic_ids))})
                    """,
                    (user_id, *subtopic_ids)
                )

                progress_rows = cursor.fetchall()
                progress_map = {p["sub_topic_id"]: p for p in progress_rows}

                # 5️⃣ Build topic → sub-topic structure
                topic_map = {
                    t["topic_id"]: {
                        "topic_id": t["topic_id"],
                        "topic_name": t["topic_name"],
                        "topic_number": t["topic_number"],
                        "progress_percent": 0,
                        "sub_topics": []
                    }
                    for t in topics
                }

                for st in subtopics:
                    progress = progress_map.get(st["sub_topic_id"])

                    st["progress"] = {
                        "completion_percent": 100 if progress and progress["is_completed"] else 0,
                        "is_completed": bool(progress and progress["is_completed"]),
                        "score": progress["score"] if progress else 0,
                        "time_spent_minutes": progress["time_spent_minutes"] if progress else 0,
                        "last_accessed": progress["last_accessed"] if progress else None
                    }

                    topic_map[st["topic_id"]]["sub_topics"].append(st)

                # 6️⃣ Topic-level progress %
                for topic in topic_map.values():
                    subs = topic["sub_topics"]
                    if subs:
                        completed = sum(
                            1 for s in subs if s["progress"]["is_completed"]
                        )
                        topic["progress_percent"] = round(
                            (completed / len(subs)) * 100, 2
                        )

                return {
                    "status": "success",
                    "count": len(topic_map),
                    "data": list(topic_map.values())
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching subtopic progress: {str(e)}"
        )
    



@router.get("/{user_id}/subtopics/{topic_id}")
async def get_user_subtopics_by_topic(user_id: int, topic_id: int):
    """
    Fetch subtopics + progress for a specific topic for a user.
    NEW SCHEMA:
    - topics are GLOBAL
    - access controlled via topic_college_department
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate user (active)
                cursor.execute("""
                    SELECT user_id, college_id, department_id
                    FROM users
                    WHERE user_id = %s
                      AND is_active = 1
                """, (user_id,))
                user = cursor.fetchone()

                if not user:
                    raise HTTPException(
                        status_code=404,
                        detail="User not found or inactive"
                    )

                college_id = user["college_id"]
                department_id = user["department_id"]

                # 2️⃣ Validate topic access via mapping table
                cursor.execute("""
                    SELECT
                        t.topic_id,
                        t.topic_name,
                        t.topic_number,
                        t.total_sub_topics
                    FROM topic_college_department tcd
                    JOIN topics t
                        ON t.topic_id = tcd.topic_id
                       AND t.is_active = 1
                    WHERE tcd.topic_id = %s
                      AND tcd.college_id = %s
                      AND tcd.department_id = %s
                      AND tcd.is_active = 1
                """, (topic_id, college_id, department_id))

                topic = cursor.fetchone()

                if not topic:
                    raise HTTPException(
                        status_code=403,
                        detail="User does not have access to this topic"
                    )

                # 3️⃣ Fetch active subtopics for this topic
                cursor.execute("""
                    SELECT 
                        sub_topic_id,
                        topic_id,
                        sub_topic_name,
                        sub_topic_order,
                        overview_video_url,
                        file_name,
                        test_file,
                        CASE 
                            WHEN overview_content IS NOT NULL THEN TRUE 
                            ELSE FALSE 
                        END AS has_document,
                        created_at
                    FROM sub_topics
                    WHERE topic_id = %s
                      AND is_active = 1
                    ORDER BY sub_topic_order
                """, (topic_id,))
                subtopics = cursor.fetchall()

                if not subtopics:
                    return {
                        "status": "success",
                        "data": {
                            **topic,
                            "sub_topics": [],
                            "progress_percent": 0
                        }
                    }

                # 4️⃣ Fetch progress for user on these subtopics
                subtopic_ids = [s["sub_topic_id"] for s in subtopics]

                cursor.execute(
                    f"""
                    SELECT 
                        sub_topic_id,
                        is_completed,
                        COALESCE(score, 0) AS score,
                        COALESCE(time_spent_minutes, 0) AS time_spent_minutes,
                        last_accessed
                    FROM student_subtopic_progress
                    WHERE student_id = %s
                      AND sub_topic_id IN ({",".join(["%s"] * len(subtopic_ids))})
                    """,
                    (user_id, *subtopic_ids)
                )

                progress_map = {
                    p["sub_topic_id"]: p
                    for p in cursor.fetchall()
                }

                # 5️⃣ Attach progress to subtopics
                for st in subtopics:
                    p = progress_map.get(st["sub_topic_id"])
                    st["progress"] = {
                        "completion_percent": 100 if p and p["is_completed"] else 0,
                        "is_completed": bool(p and p["is_completed"]),
                        "score": p["score"] if p else 0,
                        "time_spent_minutes": p["time_spent_minutes"] if p else 0,
                        "last_accessed": p["last_accessed"] if p else None
                    }

                # 6️⃣ Topic-level progress
                completed = sum(
                    1 for s in subtopics if s["progress"]["is_completed"]
                )
                total = len(subtopics)
                progress_percent = round(
                    (completed / total) * 100, 2
                ) if total > 0 else 0

                # 7️⃣ Final response
                return {
                    "status": "success",
                    "data": {
                        **topic,
                        "sub_topics": subtopics,
                        "progress_percent": progress_percent
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching subtopic progress: {str(e)}"
        )



class TopicCreate(BaseModel):
    topic_name: str

@router.post("/create-topic")
async def create_topic(data: TopicCreate):
    """Create a new topic (only topic_name)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO topics (topic_name, is_active, created_at)
                    VALUES (%s, TRUE, CURRENT_TIMESTAMP)
                """, (data.topic_name,))
                conn.commit()
                return {
                    "status": "success",
                    "message": f"Topic '{data.topic_name}' created successfully."
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating topic: {str(e)}")
    




@router.get("/overall-report/{college_id}/{department_id}")
async def get_overall_report(college_id: int, department_id: int):
    """
    Fetch overall average marks across all topics for each STUDENT ONLY
    in a given college and department.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                query = """
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,
                        u.last_login,
                        
                        -- Total obtained marks (subtopics + assignments)
                        (
                            COALESCE(SUM(stm.marks_obtained), 0) +
                            COALESCE(SUM(am.marks_obtained), 0)
                        ) AS total_obtained,

                        -- Total maximum marks
                        (
                            COALESCE(SUM(stm.max_marks), 0) +
                            COALESCE(SUM(am.max_marks), 0)
                        ) AS total_max,

                        -- Final percentage
                        ROUND(
                            (
                                COALESCE(SUM(stm.marks_obtained), 0) +
                                COALESCE(SUM(am.marks_obtained), 0)
                            ) /
                            NULLIF(
                                (
                                    COALESCE(SUM(stm.max_marks), 0) +
                                    COALESCE(SUM(am.max_marks), 0)
                                ), 0
                            ) * 100, 
                            2
                        ) AS overall_percentage
                    FROM users u
                    LEFT JOIN sub_topic_marks stm 
                        ON stm.student_id = u.user_id  
                        AND stm.college_id = %s
                        AND stm.department_id = %s
                    LEFT JOIN assignment_marks am 
                        ON am.student_id = u.user_id
                    LEFT JOIN assignments a
                        ON a.assignment_id = am.assignment_id
                        AND a.college_id = %s
                        AND a.department_id = %s
                    WHERE u.college_id = %s 
                      AND u.department_id = %s
                      AND u.role_id = '5' 
                      AND u.is_active = 1
                    GROUP BY u.user_id, u.username, u.full_name, u.last_login
                    ORDER BY u.username ASC;
                """

                cursor.execute(query, (
                    college_id, department_id,
                    college_id, department_id,
                    college_id, department_id
                ))

                rows = cursor.fetchall()

                return {"status": "success", "data": rows}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overall report: {str(e)}")



@router.get("/topic-with-department")
async def get_topics_with_department_detailed():
    """
    Fetch topics with detailed status information
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                query = """
                    SELECT
                        t.topic_id,
                        t.topic_name,
                        t.topic_number,
                        t.total_sub_topics,
                        t.is_active AS topic_active,
                        
                        c.college_id,
                        c.name AS college_name,
                        c.is_active AS college_active,
                        
                        d.department_id,
                        d.department_name,
                        d.is_active AS department_active,
                        
                        tcd.is_active AS mapping_active,
                        tcd.assigned_at,
                        
                        -- Overall status
                        CASE 
                            WHEN t.is_active = TRUE 
                                 AND c.is_active = TRUE 
                                 AND d.is_active = TRUE 
                                 AND tcd.is_active = TRUE 
                            THEN 'ACTIVE'
                            ELSE 'INACTIVE'
                        END AS overall_status
                    FROM topic_college_department tcd
                    JOIN topics t ON t.topic_id = tcd.topic_id
                    JOIN colleges c ON c.college_id = tcd.college_id
                    JOIN departments d ON d.department_id = tcd.department_id
                    ORDER BY c.name, d.department_name, t.topic_name
                """

                cursor.execute(query)
                rows = cursor.fetchall()
                
                # Separate active and inactive
                active_rows = [row for row in rows if row["overall_status"] == "ACTIVE"]
                
                return {
                    "status": "success",
                    "active_count": len(active_rows),
                    "total_count": len(rows),
                    "data": active_rows,  # Return only active ones
                    "inactive_count": len(rows) - len(active_rows)
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topics: {str(e)}"
        )
    



@router.put("/update/{topic_id}")
async def update_topic_assignment(
    topic_id: int,
    college_id: int = Form(...),
    department_id: int = Form(...),
    new_topic_name: str = Form(...)
):
    try:
        with get_db() as conn, conn.cursor() as cursor:

            # Check mapping
            cursor.execute("""
                SELECT cdt.college_id, cdt.department_id, t.topic_name
                FROM college_department_topics cdt
                JOIN topics t ON cdt.topic_id = t.topic_id
                WHERE cdt.college_id = %s
                  AND cdt.department_id = %s
                  AND cdt.topic_id = %s
            """, (college_id, department_id, topic_id))
            
            current_mapping = cursor.fetchone()
            if not current_mapping:
                raise HTTPException(
                    status_code=404,
                    detail="Mapping not found for this college, department, and topic"
                )

            # Find new topic
            cursor.execute("""
                SELECT topic_id 
                FROM topics 
                WHERE topic_name = %s AND is_active = TRUE
            """, (new_topic_name,))
            new_topic = cursor.fetchone()
            if not new_topic:
                raise HTTPException(status_code=404, detail="New topic not found")

            new_topic_id = new_topic["topic_id"]

            # Prevent duplicate assignment
            cursor.execute("""
                SELECT 1 
                FROM college_department_topics
                WHERE college_id = %s AND department_id = %s AND topic_id = %s
            """, (college_id, department_id, new_topic_id))
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Topic already assigned to this college and department"
                )

            # Update
            cursor.execute("""
                UPDATE college_department_topics
                SET topic_id = %s, created_at = NOW()
                WHERE college_id = %s AND department_id = %s AND topic_id = %s
            """, (new_topic_id, college_id, department_id, topic_id))

            conn.commit()

            return {"status": "success", "message": "Topic updated"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )

    
    
@router.delete("/delete/{topic_id}")
async def delete_topic(topic_id: int):
    """Soft delete a topic by setting is_active = 0"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1. Check if topic exists and get its current state
                cursor.execute("""
                    SELECT topic_id, topic_name, is_active
                    FROM topics 
                    WHERE topic_id = %s
                """, (topic_id,))
                
                topic = cursor.fetchone()

                if not topic:
                    raise HTTPException(status_code=404, detail="Topic not found")

                if topic["is_active"] == 0:
                    raise HTTPException(status_code=400, detail="Topic is already inactive")

                # 2. Soft delete → mark inactive
                cursor.execute("""
                    UPDATE topics 
                    SET is_active = 0 
                    WHERE topic_id = %s
                """, (topic_id,))
                
                conn.commit()

                return {
                    "status": "success",
                    "message": f"Topic '{topic['topic_name']}' marked as inactive successfully"
                }

    except HTTPException:
        raise
    except Exception as e:
        print("🔥 Error soft deleting topic:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
