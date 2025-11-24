from datetime import datetime
import json
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
    Store subtopic marks (ONE ATTEMPT ONLY).
    After first submission:
      - Student CANNOT retake again
      - is_completed = TRUE always (even if failed)
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                student_id = marks_data["student_id"]
                sub_topic_id = marks_data["sub_topic_id"]
                marks_obtained = marks_data["marks_obtained"]
                max_marks = marks_data["max_marks"]

                # 1️⃣ Validate required data
                if not all([student_id, sub_topic_id, marks_obtained is not None, max_marks]):
                    raise HTTPException(status_code=400, detail="Missing required fields")

                if marks_obtained < 0 or max_marks <= 0:
                    raise HTTPException(status_code=400, detail="Invalid marks values")

                # 2️⃣ Verify student exists + active
                cursor.execute("""
                    SELECT user_id FROM users 
                    WHERE user_id = %s AND role_id = 5 AND is_active = TRUE
                """, (student_id,))
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Student not found or inactive")

                # 3️⃣ Verify subtopic exists
                cursor.execute("""
                    SELECT sub_topic_id, topic_id 
                    FROM sub_topics 
                    WHERE sub_topic_id = %s AND is_active = TRUE
                """, (sub_topic_id,))
                subtopic = cursor.fetchone()
                if not subtopic:
                    raise HTTPException(status_code=404, detail="Subtopic not found or inactive")

                # 4️⃣ Check if student already completed this test (BLOCK RETAKE)
                cursor.execute("""
                    SELECT attempt_id, obtained_marks 
                    FROM student_test_attempts
                    WHERE student_id = %s
                      AND test_scope = 'sub_topic'
                      AND reference_id = %s
                      AND is_completed = TRUE
                """, (student_id, sub_topic_id))

                existing_attempt = cursor.fetchone()
                if existing_attempt:
                    return {
                        "status": "success",
                        "already_completed": True,
                        "message": "You already completed this test. Retake is not allowed.",
                        "data": {
                            "previous_score": float(existing_attempt["obtained_marks"])
                        }
                    }

                # 5️⃣ Score calculations
                percentage = (marks_obtained / max_marks) * 100
                is_passed = percentage >= 40  # Passing threshold

                # 6️⃣ Store subtopic marks (first attempt only)
                cursor.execute("""
                    INSERT INTO sub_topic_marks 
                    (student_id, sub_topic_id, marks_obtained, max_marks, percentage, is_passed, attempted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """, (
                    student_id,
                    sub_topic_id,
                    marks_obtained,
                    max_marks,
                    percentage,
                    is_passed
                ))

                # 7️⃣ Store test attempt (BLOCK ALL FUTURE ATTEMPTS)
                cursor.execute("""
                    INSERT INTO student_test_attempts
                    (student_id, test_scope, reference_id, is_completed,
                     obtained_marks, total_marks, percentage, is_passed, completed_at)
                    VALUES (%s, 'sub_topic', %s, TRUE, %s, %s, %s, %s, NOW())
                """, (
                    student_id,
                    sub_topic_id,
                    marks_obtained,
                    max_marks,
                    percentage,
                    is_passed
                ))

                # 8️⃣ Update subtopic-level progress (ALWAYS mark as completed)
                cursor.execute("""
                    INSERT INTO student_subtopic_progress 
                    (student_id, sub_topic_id, is_completed, score, last_accessed)
                    VALUES (%s, %s, TRUE, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                        is_completed = TRUE,
                        score = VALUES(score),
                        last_accessed = NOW()
                """, (
                    student_id,
                    sub_topic_id,
                    marks_obtained
                ))

                conn.commit()

                return {
                    "status": "success",
                    "already_completed": False,
                    "message": "Marks stored. Test marked as completed.",
                    "data": {
                        "sub_topic_id": sub_topic_id,
                        "marks_obtained": marks_obtained,
                        "max_marks": max_marks,
                        "percentage": round(percentage, 2),
                        "is_passed": is_passed,
                        "completion_status": "completed"
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing marks: {str(e)}")


    

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



@router.post("/store-assignment-marks")
async def store_assignment_marks(marks_data: dict):
    """
    Store assignment marks (ONE ATTEMPT ONLY).
    After first submission:
      - Student CANNOT retake again
      - is_completed = TRUE always
    """
    try:
        student_id = marks_data["student_id"]
        assignment_id = marks_data["assignment_id"]
        marks_obtained = marks_data["marks_obtained"]
        max_marks = marks_data["max_marks"]

        # 1️⃣ Validation
        if not all([student_id, assignment_id, max_marks]) or marks_obtained is None:
            raise HTTPException(status_code=400, detail="Missing required fields")

        with get_db() as conn:
            with conn.cursor() as cursor:

                # 2️⃣ Check if assignment already completed
                cursor.execute("""
                    SELECT obtained_marks
                    FROM student_test_attempts
                    WHERE student_id = %s
                      AND test_scope = 'assignment'
                      AND reference_id = %s
                      AND is_completed = TRUE
                """, (student_id, assignment_id))

                existing = cursor.fetchone()
                if existing:
                    return {
                        "status": "success",
                        "already_completed": True,
                        "message": "You have already completed this assignment.",
                        "data": {
                            "previous_score": float(existing["obtained_marks"])
                        }
                    }

                # 3️⃣ Store marks in assignment_marks
                cursor.execute("""
                    INSERT INTO assignment_marks 
                    (student_id, assignment_id, marks_obtained, max_marks, graded_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                        marks_obtained = VALUES(marks_obtained),
                        max_marks = VALUES(max_marks),
                        graded_at = NOW()
                """, (
                    student_id, assignment_id,
                    marks_obtained, max_marks
                ))

                # 4️⃣ Mark test as completed
                cursor.execute("""
                    INSERT INTO student_test_attempts
                    (student_id, test_scope, reference_id, is_completed,
                     obtained_marks, total_marks, percentage, is_passed, completed_at)
                    VALUES (%s, 'assignment', %s, TRUE, %s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                        is_completed = TRUE,
                        obtained_marks = VALUES(obtained_marks),
                        total_marks = VALUES(total_marks),
                        percentage = VALUES(percentage),
                        is_passed = VALUES(is_passed),
                        completed_at = NOW()
                """, (
                    student_id,
                    assignment_id,
                    marks_obtained,
                    max_marks,
                    (marks_obtained / max_marks) * 100,
                    (marks_obtained / max_marks) * 100 >= 40
                ))

                conn.commit()

        return {
            "status": "success",
            "already_completed": False,
            "message": "Assignment submitted successfully.",
            "data": {
                "marks_obtained": marks_obtained,
                "max_marks": max_marks,
                "percentage": round((marks_obtained / max_marks) * 100, 2),
                "is_passed": (marks_obtained / max_marks) * 100 >= 40
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error storing assignment marks: {str(e)}"
        )


    


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
    

@router.get("/subtopic/{sub_topic_id}/view/{student_id}")
async def view_completed_subtopic_test(sub_topic_id: int, student_id: int):
    """
    Returns ONLY:
    - Questions
    - Options
    - Correct Answer
    NO marks, NO percentage, NO attempts.
    """

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate subtopic exists
                cursor.execute("""
                    SELECT sub_topic_id 
                    FROM sub_topics
                    WHERE sub_topic_id = %s AND is_active = 1
                """, (sub_topic_id,))
                subtopic = cursor.fetchone()

                if not subtopic:
                    raise HTTPException(
                        status_code=404,
                        detail="Subtopic not found"
                    )

                # 2️⃣ Ensure student has already completed the test (important!)
                cursor.execute("""
                    SELECT is_completed
                    FROM student_test_attempts
                    WHERE student_id = %s 
                      AND reference_id = %s 
                      AND test_scope = 'sub_topic'
                      AND is_completed = TRUE
                """, (student_id, sub_topic_id))

                attempt = cursor.fetchone()

                if not attempt:
                    raise HTTPException(
                        status_code=403,
                        detail="Test not completed. Student cannot view test."
                    )

                # 3️⃣ Fetch MCQ questions
                cursor.execute("""
                    SELECT 
                        question,
                        option_a,
                        option_b,
                        option_c,
                        option_d,
                        correct_answer
                    FROM mcq_questions
                    WHERE sub_topic_id = %s
                    ORDER BY id ASC
                """, (sub_topic_id,))

                rows = cursor.fetchall()

                questions = []
                for q in rows:
                    questions.append({
                        "question": q["question"],
                        "options": [
                            q["option_a"],
                            q["option_b"],
                            q["option_c"],
                            q["option_d"]
                        ],
                        "correct_answer": q["correct_answer"]
                    })

                return {
                    "status": "success",
                    "data": {
                        "sub_topic_id": sub_topic_id,
                        "questions": questions
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching completed test: {str(e)}"
        )




@router.get("/assignment/{assignment_id}/answers/{student_id}")
async def view_assignment_answers_only(assignment_id: int, student_id: int):
    """
    Return ONLY questions + options + correct answer
    Student must have completed the assignment.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate that student finished the assignment
                cursor.execute("""
                    SELECT 1
                    FROM student_test_attempts
                    WHERE student_id = %s
                      AND test_scope = 'assignment'
                      AND reference_id = %s
                      AND is_completed = TRUE
                """, (student_id, assignment_id))

                attempt = cursor.fetchone()

                if not attempt:
                    raise HTTPException(
                        status_code=403,
                        detail="Test not completed. Student cannot view answers."
                    )

                # 2️⃣ Fetch all questions (only needed fields)
                cursor.execute("""
                    SELECT 
                        question_id,
                        question_text,
                        question_data
                    FROM questions
                    WHERE test_scope = 'assignment'
                      AND reference_id = %s
                    ORDER BY order_no ASC
                """, (assignment_id,))

                questions = cursor.fetchall()

                # Parse JSON question_data
                cleaned_questions = []
                for q in questions:
                    qd = q["question_data"]
                    if isinstance(qd, str):
                        qd = json.loads(qd)

                    cleaned_questions.append({
                        "question_id": q["question_id"],
                        "question": q["question_text"],
                        "options": qd.get("options", []),
                        "correct_answer": qd.get("correct_answer")
                    })

                # 3️⃣ Return only required fields
                return {
                    "status": "success",
                    "data": cleaned_questions
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching assignment answers: {str(e)}"
        )
