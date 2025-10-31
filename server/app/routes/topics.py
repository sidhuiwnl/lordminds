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
    """Fetch all topics with their subtopics and question counts"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Fetch all topics
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number, department_id 
                    FROM topics 
                    WHERE is_active = TRUE
                    ORDER BY topic_number
                """)
                topics = cursor.fetchall()
                topic_ids = [t['topic_id'] for t in topics]

                if not topic_ids:
                    return {"status": "success", "count": 0, "data": []}

                # 2️⃣ Fetch all subtopics for these topics
                cursor.execute(f"""
                    SELECT sub_topic_id, topic_id, sub_topic_name, sub_topic_order, overview_video_url,
                           file_name, test_file,
                           CASE WHEN overview_content IS NOT NULL THEN TRUE ELSE FALSE END as has_document,
                           is_active, created_at
                    FROM sub_topics
                    WHERE topic_id IN ({','.join(['%s']*len(topic_ids))}) AND is_active = TRUE
                    ORDER BY sub_topic_order
                """, tuple(topic_ids))
                subtopics_all = cursor.fetchall()

                subtopic_ids = [st['sub_topic_id'] for st in subtopics_all]

                # 3️⃣ Fetch question counts for all subtopics at once
                question_counts = {}
                if subtopic_ids:
                    cursor.execute(f"""
                        SELECT reference_id, COUNT(*) as total_questions
                        FROM questions
                        WHERE test_scope = 'sub_topic' AND reference_id IN ({','.join(['%s']*len(subtopic_ids))})
                        GROUP BY reference_id
                    """, tuple(subtopic_ids))
                    for row in cursor.fetchall():
                        question_counts[row['reference_id']] = row['total_questions']

                # 4️⃣ Map subtopics and counts to topics
                topic_dict = {t['topic_id']: t for t in topics}
                for st in subtopics_all:
                    st['total_questions'] = question_counts.get(st['sub_topic_id'], 0)
                    topic_dict[st['topic_id']].setdefault('sub_topics', []).append(st)

                # 5️⃣ Calculate total questions per topic
                for t in topic_dict.values():
                    t['total_questions'] = sum(st['total_questions'] for st in t.get('sub_topics', []))

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": list(topic_dict.values())
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")


@router.get("/all-topics")
async def get_all_topics():
    """Fetch all active topics"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number, department_id 
                    FROM topics 
                    WHERE is_active = TRUE
                    ORDER BY topic_number
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
    college_name: str
    department_name: str
    topics: List[str]  # List of topic names

@router.post("/assign-topics")
async def assign_topics_to_college_department(payload: AssignTopicsRequest):
    """
    Assign topics to a given college and department by updating department_id on each topic.
    Uses college_departments junction for college-dept resolution.
    """
    skipped_topics = []
    assigned_count = 0
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:  # DictCursor built-in
                # 1️⃣ Get college ID
                cursor.execute(
                    "SELECT college_id FROM colleges WHERE name = %s",
                    (payload.college_name,)
                )
                college = cursor.fetchone()
                if not college:
                    raise HTTPException(status_code=404, detail="College not found")
                college_id = college['college_id']

                # 2️⃣ Get department ID via JOIN on college_departments
                cursor.execute(
                    """
                    SELECT d.department_id 
                    FROM departments d
                    JOIN college_departments cd ON cd.department_id = d.department_id
                    WHERE d.department_name = %s AND cd.college_id = %s AND d.is_active = 1
                    """,
                    (payload.department_name, college_id)
                )
                department = cursor.fetchone()
                if not department:
                    raise HTTPException(status_code=404, detail=f"Department '{payload.department_name}' not found for college '{payload.college_name}'")
                department_id = department['department_id']

                # 3️⃣ Assign topics to the department
                for topic_name in payload.topics:
                    cursor.execute(
                        "SELECT topic_id FROM topics WHERE topic_name = %s",
                        (topic_name,)
                    )
                    topic = cursor.fetchone()
                    if not topic:
                        skipped_topics.append(topic_name)
                        continue
                    topic_id = topic['topic_id']

                    # Update (will only affect if changed)
                    cursor.execute(
                        """
                        UPDATE topics 
                        SET department_id = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE topic_id = %s
                        """,
                        (department_id, topic_id)
                    )
                    if cursor.rowcount > 0:
                        assigned_count += 1

                conn.commit()  # Explicit commit if autocommit=False

                # Informative response (no error on 0)
                message = f"Successfully assigned {assigned_count} out of {len(payload.topics)} topics to department ID {department_id}"
                if skipped_topics:
                    message += f". Skipped non-existent: {', '.join(skipped_topics)}"
                return {"status": "success", "message": message, "assigned_count": assigned_count}

    except HTTPException:
        raise
    except Exception as e:
        # Log full error for debugging (add logger if needed)
        print(f"Unexpected error in assign_topics: {str(e)}")  # Or use logging
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    

@router.get("/{user_id}/subtopics")
async def get_user_subtopics(user_id: int):
    """Fetch subtopics for the department of the given user"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Get user's department_id
                cursor.execute("""
                    SELECT department_id 
                    FROM users 
                    WHERE user_id = %s AND is_active = TRUE
                """, (user_id,))
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                department_id = user['department_id']

                # 2️⃣ Fetch topics for the department
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number 
                    FROM topics 
                    WHERE department_id = %s AND is_active = TRUE
                    ORDER BY topic_number
                """, (department_id,))
                topics = cursor.fetchall()
                topic_ids = [t['topic_id'] for t in topics]

                if not topic_ids:
                    return {"status": "success", "count": 0, "data": []}

                # 3️⃣ Fetch subtopics for these topics
                cursor.execute(f"""
                    SELECT sub_topic_id, topic_id, sub_topic_name, sub_topic_order, overview_video_url,
                           file_name, test_file,
                           CASE WHEN overview_content IS NOT NULL THEN TRUE ELSE FALSE END as has_document,
                           is_active, created_at
                    FROM sub_topics
                    WHERE topic_id IN ({','.join(['%s']*len(topic_ids))}) AND is_active = TRUE
                    ORDER BY sub_topic_order
                """, tuple(topic_ids))
                subtopics_all = cursor.fetchall()

                # 4️⃣ Map subtopics to their topics
                topic_dict = {t['topic_id']: t for t in topics}
                for st in subtopics_all:
                    topic_dict[st['topic_id']].setdefault('sub_topics', []).append(st)

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": list(topic_dict.values())
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching subtopics for user: {str(e)}")    
    

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
    Fetch overall average marks across all topics for each student
    in a given college and department.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        u.username AS student_name,
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
                            ) * 100, 2
                        ) AS overall_average
                    FROM users u
                    LEFT JOIN sub_topic_marks stm ON stm.student_id = u.user_id
                    LEFT JOIN assignment_marks am ON am.student_id = u.user_id
                    WHERE u.college_id = %s 
                      AND u.department_id = %s
                    GROUP BY u.username
                    ORDER BY u.username ASC;
                """, (college_id, department_id))

                data = cursor.fetchall()

                if not data:
                    return {"status": "error", "message": "No students found for this department"}

                return {"status": "success", "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))