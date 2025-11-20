from datetime import datetime
from typing import Optional
import bcrypt
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db


router = APIRouter()

@router.get("/department/{college_id}/{department_id}/topics-progress")
async def get_department_topics_average_progress(college_id: int, department_id: int):
    """
    Fetch average progress and score for all topics under a specific department of a college.
    Each topic shows overall completion percentage and average marks across all students.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                    t.topic_id,
                    t.topic_name,
                    COUNT(stp.student_id) AS total_students,
                    ROUND(AVG(stp.progress_percent), 2) AS avg_progress_percent,
                    ROUND(AVG(stp.average_score), 2) AS avg_score,
                    SUM(CASE WHEN stp.status = 'Completed' THEN 1 ELSE 0 END) AS completed_students,
                    SUM(CASE WHEN stp.status = 'Not Started' THEN 1 ELSE 0 END) AS not_started_students
                FROM topics t
                LEFT JOIN student_topic_progress stp 
                    ON t.topic_id = stp.topic_id
                INNER JOIN departments d 
                    ON t.department_id = d.department_id
                INNER JOIN college_departments cd 
                    ON d.department_id = cd.department_id
                INNER JOIN colleges c 
                    ON cd.college_id = c.college_id
                WHERE cd.department_id = %s AND cd.college_id = %s
                GROUP BY t.topic_id, t.topic_name
                ORDER BY t.topic_name ASC
                """

                cursor.execute(query, (department_id, college_id))
                topics = cursor.fetchall()

                if not topics:
                    raise HTTPException(status_code=404, detail="No topics found for this department")

                return {
                    "status": "success",
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topic progress: {str(e)}")
    




@router.get("/teacher-details/{user_id}")
async def get_teacher_details(user_id: int):
    """
    Fetch an ACTIVE teacher's basic details with their college information.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                query = """
                    SELECT 
                        u.user_id,
                        u.username,
                        u.full_name,
                        c.college_id,
                        c.name AS college_name
                    FROM users u
                    JOIN colleges c ON u.college_id = c.college_id
                    WHERE u.user_id = %s
                      AND u.role_id = 4       -- assuming 4 = teacher role (you can change)
                      AND u.is_active = 1
                """

                cursor.execute(query, (user_id,))
                teacher_details = cursor.fetchone()

                if not teacher_details:
                    raise HTTPException(
                        status_code=404,
                        detail="Active teacher not found"
                    )

                return {
                    "status": "success",
                    "data": teacher_details
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching teacher details: {str(e)}"
        )




@router.get("/{topic_id}/overall-student-topic")
async def get_student_average_for_topic(topic_id: int):
    """
    Fetch all ACTIVE students' average score for a particular topic.
    Aggregates all sub-topic marks for that topic.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                
                # Step 1: Check if topic has subtopics
                cursor.execute(
                    "SELECT COUNT(*) AS subtopic_count FROM sub_topics WHERE topic_id = %s",
                    (topic_id,)
                )
                result = cursor.fetchone()
                count = result["subtopic_count"] if result else 0

                if count == 0:
                    return {"status": "error", "message": f"No subtopics found for topic_id={topic_id}"}

                # Step 2: Fetch aggregated averages for ACTIVE students only
                query = """
                    SELECT 
                        u.username AS student_name,
                        ROUND(SUM(stm.marks_obtained) / SUM(stm.max_marks) * 100, 2) AS average_score
                    FROM sub_topic_marks stm
                    JOIN sub_topics st ON st.sub_topic_id = stm.sub_topic_id
                    JOIN users u ON u.user_id = stm.student_id
                    WHERE st.topic_id = %s
                      AND u.role_id = 5           -- student role
                      AND u.is_active = 1         -- only active students
                    GROUP BY u.user_id, u.username
                    ORDER BY average_score DESC;
                """

                cursor.execute(query, (topic_id,))
                results = cursor.fetchall()

                if not results:
                    return {
                        "status": "error",
                        "message": f"No marks found for topic_id={topic_id}"
                    }

                data = [
                    {
                        "student_name": row["student_name"],
                        "average_score": float(row["average_score"]) if row["average_score"] is not None else 0.0
                    }
                    for row in results
                ]

        return {"status": "success", "data": data}

    except Exception as e:
        print("🔥 SQL Error in get_student_average_for_topic:", type(e), e)
        return {"status": "error", "message": str(e)}





@router.put("/update/{user_id}")
async def update_teacher(
    user_id: int,
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Verify user is a teacher
                cursor.execute(
                    "SELECT * FROM users WHERE user_id = %s AND role_id = 4", (user_id,)
                )
                teacher = cursor.fetchone()
                if not teacher:
                    raise HTTPException(status_code=404, detail="Teacher not found")

                updates = []
                values = []

                if username:
                    updates.append("username = %s")
                    values.append(username)

                if password:
                    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
                    updates.append("password_hash = %s")
                    values.append(hashed_pw.decode("utf-8"))

                if not updates:
                    return {"status": "fail", "detail": "No fields to update"}

                values.append(user_id)
                query = f"""
                    UPDATE users
                    SET {', '.join(updates)}, updated_at = NOW()
                    WHERE user_id = %s AND role_id = 4
                """
                cursor.execute(query, values)
                conn.commit()

                # Fetch updated data
                cursor.execute(
                    "SELECT user_id, username, full_name, college_id, department_id, created_at FROM users WHERE user_id = %s",
                    (user_id,),
                )
                updated_teacher = cursor.fetchone()

        return {
            "status": "success",
            "message": "Teacher updated successfully",
            "teacher": updated_teacher,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating teacher: {str(e)}")
    


@router.delete("/delete/{user_id}")
async def delete_teacher(user_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                
                # Check if teacher exists and is role_id = 4
                cursor.execute(
                    "SELECT full_name FROM users WHERE user_id = %s AND role_id = 4",
                    (user_id,),
                )
                teacher = cursor.fetchone()

                if not teacher:
                    raise HTTPException(status_code=404, detail="Teacher not found")

                # Soft delete → set is_active = 0
                cursor.execute(
                    "UPDATE users SET is_active = 0 WHERE user_id = %s AND role_id = 4",
                    (user_id,)
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"Teacher '{teacher['full_name']}' deactivated successfully",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error deactivating teacher: {str(e)}"
        )
