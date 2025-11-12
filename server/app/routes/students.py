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
    under a department in a college.
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
                    WHERE cd.department_id = %s 
                      AND cd.college_id = %s 
                      AND t.topic_id = %s
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
