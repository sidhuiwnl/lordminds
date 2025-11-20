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



# @router.post("/store-marks")
# async def store_marks(marks_data: dict):
#     """
#     Store marks obtained by student in sub_topic_marks table
#     """
#     try:
#         with get_db() as conn:
#             with conn.cursor() as cursor:
#                 cursor.execute("""
#                     INSERT INTO sub_topic_marks 
#                     (student_id, sub_topic_id, marks_obtained, max_marks, attempted_at)
#                     VALUES (%s, %s, %s, %s, NOW())
#                 """, (
#                     marks_data["student_id"],
#                     marks_data["sub_topic_id"], 
#                     marks_data["marks_obtained"],
#                     marks_data["max_marks"]
#                 ))
#                 conn.commit()
                
#         return {"status": "success", "message": "Marks stored successfully"}
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error storing marks: {str(e)}")
    
    

@router.post("/store-marks")
async def store_marks(marks_data: dict):
    """
    Store subtopic marks and mark test as completed with enhanced validation
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                student_id = marks_data["student_id"]
                sub_topic_id = marks_data["sub_topic_id"]
                marks_obtained = marks_data["marks_obtained"]
                max_marks = marks_data["max_marks"]

                # 1. Validate input data
                if not all([student_id, sub_topic_id, marks_obtained is not None, max_marks]):
                    raise HTTPException(status_code=400, detail="Missing required fields")
                
                if marks_obtained < 0 or max_marks <= 0:
                    raise HTTPException(status_code=400, detail="Invalid marks values")

                # 2. Verify student exists and is active
                cursor.execute("""
                    SELECT user_id, role_id FROM users 
                    WHERE user_id = %s AND role_id = 5 AND is_active = TRUE
                """, (student_id,))
                
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Student not found or not authorized")

                # 3. Verify subtopic exists and is active
                cursor.execute("""
                    SELECT sub_topic_id, topic_id FROM sub_topics 
                    WHERE sub_topic_id = %s AND is_active = TRUE
                """, (sub_topic_id,))
                
                subtopic = cursor.fetchone()
                if not subtopic:
                    raise HTTPException(status_code=404, detail="Subtopic not found or inactive")

                # 4. Check if student has access to this subtopic's topic
                cursor.execute("""
                    SELECT 1 FROM users u
                    INNER JOIN topics t ON u.department_id = t.department_id
                    WHERE u.user_id = %s AND t.topic_id = %s
                """, (student_id, subtopic['topic_id']))
                
                if not cursor.fetchone():
                    raise HTTPException(status_code=403, detail="Student doesn't have access to this subtopic")

                # 5. Check if already completed (prevent re-attempts)
                cursor.execute("""
                    SELECT attempt_id, obtained_marks FROM student_test_attempts 
                    WHERE student_id = %s 
                    AND test_scope = 'sub_topic' 
                    AND reference_id = %s 
                    AND is_completed = TRUE
                """, (student_id, sub_topic_id))
                
                existing_attempt = cursor.fetchone()
                if existing_attempt:
                    return {
                        "status": "success", 
                        "message": "Subtopic test already completed",
                        "data": {
                            "previous_score": float(existing_attempt['obtained_marks']),
                            "already_completed": True
                        }
                    }

                # 6. Calculate percentage and passing status
                percentage = (marks_obtained / max_marks) * 100 if max_marks > 0 else 0
                is_passed = percentage >= 40  # 40% passing threshold

                # 7. Store in sub_topic_marks
                cursor.execute("""
                    INSERT INTO sub_topic_marks 
                    (student_id, sub_topic_id, marks_obtained, max_marks, percentage, is_passed, attempted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    marks_obtained = VALUES(marks_obtained),
                    max_marks = VALUES(max_marks),
                    percentage = VALUES(percentage),
                    is_passed = VALUES(is_passed),
                    attempted_at = NOW()
                """, (
                    student_id,
                    sub_topic_id, 
                    marks_obtained,
                    max_marks,
                    percentage,
                    is_passed
                ))

                # 8. Mark as completed in test attempts
                cursor.execute("""
                    INSERT INTO student_test_attempts 
                    (student_id, test_scope, reference_id, is_completed, 
                     obtained_marks, total_marks, percentage, is_passed, completed_at)
                    VALUES (%s, 'sub_topic', %s, TRUE, %s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    is_completed = TRUE,
                    obtained_marks = VALUES(obtained_marks),
                    total_marks = VALUES(total_marks),
                    percentage = VALUES(percentage),
                    is_passed = VALUES(is_passed),
                    completed_at = NOW()
                """, (
                    student_id,
                    sub_topic_id,
                    marks_obtained,
                    max_marks,
                    percentage,
                    is_passed
                ))

                # 9. Update student subtopic progress (if you have this table)
                cursor.execute("""
                    INSERT INTO student_subtopic_progress 
                    (student_id, sub_topic_id, is_completed, score, last_accessed)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    is_completed = VALUES(is_completed),
                    score = VALUES(score),
                    last_accessed = NOW()
                """, (
                    student_id,
                    sub_topic_id,
                    is_passed,  # Consider completed only if passed
                    marks_obtained
                ))

                conn.commit()

                return {
                    "status": "success", 
                    "message": "Subtopic marks stored and marked as completed",
                    "data": {
                        "sub_topic_id": sub_topic_id,
                        "marks_obtained": marks_obtained,
                        "max_marks": max_marks,
                        "percentage": round(percentage, 2),
                        "is_passed": is_passed,
                        "completion_status": "completed" if is_passed else "failed"
                    }
                }
        
    except HTTPException:
        raise
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

    

@router.get("/{user_id}/test-attempt-status/{test_scope}/{reference_id}")
async def get_test_attempt_status(user_id: int, test_scope: str, reference_id: int):
    """Check if student has already attempted this test"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Verify user is a student
                cursor.execute("""
                    SELECT user_id, role_id 
                    FROM users 
                    WHERE user_id = %s AND role_id = 5 AND is_active = TRUE
                """, (user_id,))
                
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=403, detail="Access denied. User is not a student.")
                
                # Check if test already completed
                cursor.execute("""
                    SELECT attempt_id, is_completed, obtained_marks, total_marks,
                           started_at, completed_at, attempt_number
                    FROM student_test_attempts
                    WHERE student_id = %s 
                      AND test_scope = %s 
                      AND reference_id = %s
                      AND is_completed = TRUE
                    ORDER BY attempt_number DESC
                    LIMIT 1
                """, (user_id, test_scope, reference_id))
                
                attempt = cursor.fetchone()
                
                return {
                    "status": "success",
                    "data": {
                        "has_completed": attempt is not None,
                        "attempt_data": attempt
                    }
                }
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking attempt status: {str(e)}")


# @router.post("/store-assignment-marks")
# async def store_assignment_marks(marks_data: dict):
#     """
#     Store marks obtained by student in assignment_marks table.
#     """
#     try:
#         with get_db() as conn:
#             with conn.cursor() as cursor:
#                 cursor.execute("""
#                     INSERT INTO assignment_marks 
#                     (student_id, assignment_id, marks_obtained, max_marks, graded_at)
#                     VALUES (%s, %s, %s, %s, NOW())
#                 """, (
#                     marks_data["student_id"],
#                     marks_data["assignment_id"],
#                     marks_data["marks_obtained"],
#                     marks_data["max_marks"]
#                 ))
#                 conn.commit()
                
#         return {"status": "success", "message": "Assignment marks stored successfully"}
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error storing assignment marks: {str(e)}")



@router.post("/store-assignment-marks")
async def store_assignment_marks(marks_data: dict):
    """
    Store assignment marks and mark test as completed
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Check if already completed
                cursor.execute("""
                    SELECT attempt_id FROM student_test_attempts 
                    WHERE student_id = %s 
                    AND test_scope = 'assignment' 
                    AND reference_id = %s 
                    AND is_completed = TRUE
                """, (marks_data["student_id"], marks_data["assignment_id"]))
                
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Assignment already completed")
                
                # Store in assignment_marks
                cursor.execute("""
                    INSERT INTO assignment_marks 
                    (student_id, assignment_id, marks_obtained, max_marks, graded_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    marks_obtained = VALUES(marks_obtained),
                    max_marks = VALUES(max_marks),
                    graded_at = NOW()
                """, (
                    marks_data["student_id"],
                    marks_data["assignment_id"],
                    marks_data["marks_obtained"],
                    marks_data["max_marks"]
                ))
                
                # Mark as completed in test attempts
                cursor.execute("""
                    INSERT INTO student_test_attempts 
                    (student_id, test_scope, reference_id, is_completed, 
                     obtained_marks, total_marks, completed_at)
                    VALUES (%s, 'assignment', %s, TRUE, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                    is_completed = TRUE,
                    obtained_marks = VALUES(obtained_marks),
                    total_marks = VALUES(total_marks),
                    completed_at = NOW()
                """, (
                    marks_data["student_id"],
                    marks_data["assignment_id"],
                    marks_data["marks_obtained"],
                    marks_data["max_marks"]
                ))
                
                conn.commit()
                
        return {"status": "success", "message": "Assignment marks stored and marked as completed"}
        
    except HTTPException:
        raise
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

                # Soft delete (set is_active = 0)
                cursor.execute(
                    "UPDATE users SET is_active = 0 WHERE user_id = %s AND role_id = 5",
                    (user_id,)
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"Student '{student['full_name']}' deactivated successfully",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deactivating student: {str(e)}")