from datetime import datetime
from typing import Optional
import bcrypt
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db


router = APIRouter()

@router.get("/department/{college_id}/{department_id}/topic/{topic_id}/progress")
async def get_specific_topic_progress(college_id: int, department_id: int, topic_id: int):
    """
    Fetch average progress and score for a specific topic 
    under a department in a college using department_topic_map.
    """
    try:
        with get_db() as conn:
            with conn.cursor(dictionary=True) as cursor:
                query = """
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        COUNT(stp.student_id) AS total_students,
                        ROUND(AVG(stp.progress_percent), 2) AS avg_progress_percent,
                        ROUND(AVG(stp.average_score), 2) AS avg_score,
                        SUM(CASE WHEN stp.status = 'Completed' THEN 1 ELSE 0 END) AS completed_students,
                        SUM(CASE WHEN stp.status = 'Not Started' THEN 1 ELSE 0 END) AS not_started_students
                    FROM department_topic_map dtm
                    INNER JOIN topics t 
                        ON dtm.topic_id = t.topic_id
                    INNER JOIN departments d 
                        ON dtm.department_id = d.department_id
                    INNER JOIN college_departments cd 
                        ON d.department_id = cd.department_id
                    INNER JOIN colleges c 
                        ON cd.college_id = c.college_id
                    LEFT JOIN student_topic_progress stp 
                        ON t.topic_id = stp.topic_id
                    WHERE dtm.department_id = %s
                      AND cd.college_id = %s
                      AND t.topic_id = %s
                      AND t.is_active = 1
                    GROUP BY t.topic_id, t.topic_name
                    LIMIT 1
                """

                cursor.execute(query, (department_id, college_id, topic_id))
                topic = cursor.fetchone()

                if not topic:
                    raise HTTPException(status_code=404, detail="No data found for this topic")

                return {
                    "status": "success",
                    "data": topic
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topic progress: {str(e)}")



@router.post("/store-marks")
async def store_marks(marks_data: dict):
    """
    Store marks obtained by student in sub_topic_marks table
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO sub_topic_marks 
                    (student_id, sub_topic_id, marks_obtained, max_marks, attempted_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (
                    marks_data["student_id"],
                    marks_data["sub_topic_id"], 
                    marks_data["marks_obtained"],
                    marks_data["max_marks"]
                ))
                conn.commit()
                
        return {"status": "success", "message": "Marks stored successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing marks: {str(e)}")
    
    
    
#To calcualte the progress and best score for each subtopic and topic level, use the below code
    
# @router.post("/store-marks")
# async def store_marks(marks_data: dict):
#     """
#     ✅ Store marks for a student's subtopic test.
#     - Records each attempt in sub_topic_marks.
#     - Tracks best score and completion in student_subtopic_progress.
#     - Recalculates overall topic progress (completion % and avg score).
#     """
#     try:
#         with get_db() as conn:
#             with conn.cursor(dictionary=True) as cursor:
#                 # 1️⃣ Extract required fields from frontend payload
#                 student_id = marks_data["student_id"]
#                 sub_topic_id = marks_data["sub_topic_id"]
#                 marks_obtained = marks_data["marks_obtained"]
#                 max_marks = marks_data["max_marks"]

#                 # 2️⃣ Insert new attempt into sub_topic_marks
#                 cursor.execute("""
#                     INSERT INTO sub_topic_marks 
#                     (student_id, sub_topic_id, marks_obtained, max_marks, attempted_at)
#                     VALUES (%s, %s, %s, %s, NOW())
#                 """, (student_id, sub_topic_id, marks_obtained, max_marks))

#                 # 3️⃣ Find the best score (highest marks) for this subtopic
#                 cursor.execute("""
#                     SELECT MAX(marks_obtained) AS best_marks 
#                     FROM sub_topic_marks
#                     WHERE student_id = %s AND sub_topic_id = %s
#                 """, (student_id, sub_topic_id))
#                 best_attempt = cursor.fetchone()
#                 best_score = best_attempt["best_marks"] if best_attempt and best_attempt["best_marks"] else 0

#                 # 4️⃣ Compute percentage and completion status
#                 score_percentage = (best_score / max_marks * 100) if max_marks > 0 else 0
#                 is_completed = 1 if score_percentage >= 40 else 0  # Threshold = 40%

#                 # 5️⃣ Identify parent topic_id for this subtopic
#                 cursor.execute("""
#                     SELECT topic_id FROM sub_topics WHERE sub_topic_id = %s
#                 """, (sub_topic_id,))
#                 topic_result = cursor.fetchone()
#                 if not topic_result:
#                     raise HTTPException(status_code=404, detail="Sub-topic not found")
#                 topic_id = topic_result["topic_id"]

#                 # 6️⃣ Insert or update student's progress for this subtopic
#                 cursor.execute("""
#                     INSERT INTO student_subtopic_progress 
#                     (student_id, topic_id, sub_topic_id, is_completed, score, last_accessed)
#                     VALUES (%s, %s, %s, %s, %s, NOW())
#                     ON DUPLICATE KEY UPDATE
#                         is_completed = VALUES(is_completed),
#                         score = VALUES(score),
#                         last_accessed = NOW();
#                 """, (student_id, topic_id, sub_topic_id, is_completed, score_percentage))

#                 # 7️⃣ Recalculate topic-level progress (for analytics)
#                 cursor.execute("""
#                     SELECT 
#                         COUNT(*) AS total_sub_topics,
#                         SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) AS completed_sub_topics,
#                         ROUND(AVG(score), 2) AS avg_score
#                     FROM student_subtopic_progress
#                     WHERE student_id = %s AND topic_id = %s
#                 """, (student_id, topic_id))
#                 topic_progress = cursor.fetchone()

#                 conn.commit()

#                 # 8️⃣ Return complete result
#                 return {
#                     "status": "success",
#                     "message": "Marks stored and progress updated successfully",
#                     "data": {
#                         "marks_obtained": marks_obtained,
#                         "max_marks": max_marks,
#                         "best_score": best_score,
#                         "score_percentage": round(score_percentage, 2),
#                         "is_completed": bool(is_completed),
#                         "topic_progress": {
#                             "total_sub_topics": topic_progress["total_sub_topics"],
#                             "completed_sub_topics": topic_progress["completed_sub_topics"],
#                             "average_score": topic_progress["avg_score"],
#                         },
#                     },
#                 }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error storing marks: {str(e)}")

    



@router.post("/store-assignment-marks")
async def store_assignment_marks(marks_data: dict):
    """
    Store marks obtained by student in assignment_marks table.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO assignment_marks 
                    (student_id, assignment_id, marks_obtained, max_marks, graded_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (
                    marks_data["student_id"],
                    marks_data["assignment_id"],
                    marks_data["marks_obtained"],
                    marks_data["max_marks"]
                ))
                conn.commit()
                
        return {"status": "success", "message": "Assignment marks stored successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing assignment marks: {str(e)}")

    


@router.put("/update/{user_id}")
async def update_student(
    user_id: int,
    full_name: Optional[str] = Form(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Verify the user is a student
                cursor.execute(
                    "SELECT * FROM users WHERE user_id = %s AND role_id = 5", (user_id,)
                )
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="Student not found")

                updates = []
                values = []

                if full_name:
                    updates.append("full_name = %s")
                    values.append(full_name)

                if username:
                    updates.append("username = %s")
                    values.append(username)

                if password:
                    # Hash password before storing
                    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
                    updates.append("password_hash = %s")
                    values.append(hashed_pw.decode("utf-8"))

                if not updates:
                    return {"status": "fail", "detail": "No fields to update"}

                values.append(user_id)

                query = f"""
                    UPDATE users
                    SET {', '.join(updates)}, updated_at = NOW()
                    WHERE user_id = %s AND role_id = 5
                """
                cursor.execute(query, values)
                conn.commit()

                # Fetch updated data
                cursor.execute(
                    "SELECT user_id, username, full_name, college_id, department_id, created_at FROM users WHERE user_id = %s",
                    (user_id,),
                )
                updated_user = cursor.fetchone()

        return {
            "status": "success",
            "message": "Student updated successfully",
            "student": updated_user,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating student: {str(e)}")    


@router.delete("/delete/{user_id}")
async def delete_student(user_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Verify user exists and is a student
                cursor.execute(
                    "SELECT full_name FROM users WHERE user_id = %s AND role_id = 5",
                    (user_id,),
                )
                student = cursor.fetchone()

                if not student:
                    raise HTTPException(status_code=404, detail="Student not found")

                try:
                    cursor.execute("DELETE FROM users WHERE user_id = %s AND role_id = 5", (user_id,))
                    conn.commit()
                except Exception as e:
                    if "1451" in str(e):  # Foreign key constraint error
                        raise HTTPException(
                            status_code=400,
                            detail="Cannot delete student because related records exist.",
                        )
                    raise

        return {
            "status": "success",
            "message": f"Student '{student['full_name']}' deleted successfully",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting student: {str(e)}")
