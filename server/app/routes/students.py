from datetime import datetime
from decimal import Decimal
import json
import os
from typing import Any, Dict, List, Optional
from uuid import uuid4
import bcrypt
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from pydantic import BaseModel
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
#     Store subtopic marks (ONE ATTEMPT ONLY).
#     After first submission:
#       - Student CANNOT retake again
#       - is_completed = TRUE always (even if failed)
#     """
#     try:
#         with get_db() as conn:
#             with conn.cursor() as cursor:
#                 student_id = marks_data["student_id"]
#                 sub_topic_id = marks_data["sub_topic_id"]
#                 marks_obtained = marks_data["marks_obtained"]
#                 max_marks = marks_data["max_marks"]

#                 # 1️⃣ Validate required data
#                 if not all([student_id, sub_topic_id, marks_obtained is not None, max_marks]):
#                     raise HTTPException(status_code=400, detail="Missing required fields")

#                 if marks_obtained < 0 or max_marks <= 0:
#                     raise HTTPException(status_code=400, detail="Invalid marks values")

#                 # 2️⃣ Verify student exists + active
#                 cursor.execute("""
#                     SELECT user_id FROM users 
#                     WHERE user_id = %s AND role_id = 5 AND is_active = TRUE
#                 """, (student_id,))
#                 if not cursor.fetchone():
#                     raise HTTPException(status_code=404, detail="Student not found or inactive")

#                 # 3️⃣ Verify subtopic exists
#                 cursor.execute("""
#                     SELECT sub_topic_id, topic_id 
#                     FROM sub_topics 
#                     WHERE sub_topic_id = %s AND is_active = TRUE
#                 """, (sub_topic_id,))
#                 subtopic = cursor.fetchone()
#                 if not subtopic:
#                     raise HTTPException(status_code=404, detail="Subtopic not found or inactive")

#                 # 4️⃣ Check if student already completed this test (BLOCK RETAKE)
#                 cursor.execute("""
#                     SELECT attempt_id, obtained_marks 
#                     FROM student_test_attempts
#                     WHERE student_id = %s
#                       AND test_scope = 'sub_topic'
#                       AND reference_id = %s
#                       AND is_completed = TRUE
#                 """, (student_id, sub_topic_id))

#                 existing_attempt = cursor.fetchone()
#                 if existing_attempt:
#                     return {
#                         "status": "success",
#                         "already_completed": True,
#                         "message": "You already completed this test. Retake is not allowed.",
#                         "data": {
#                             "previous_score": float(existing_attempt["obtained_marks"])
#                         }
#                     }

#                 # 5️⃣ Score calculations
#                 percentage = (marks_obtained / max_marks) * 100
#                 is_passed = percentage >= 40  # Passing threshold

#                 # 6️⃣ Store subtopic marks (first attempt only)
#                 cursor.execute("""
#                     INSERT INTO sub_topic_marks 
#                     (student_id, sub_topic_id, marks_obtained, max_marks, percentage, is_passed, attempted_at)
#                     VALUES (%s, %s, %s, %s, %s, %s, NOW())
#                 """, (
#                     student_id,
#                     sub_topic_id,
#                     marks_obtained,
#                     max_marks,
#                     percentage,
#                     is_passed
#                 ))

#                 # 7️⃣ Store test attempt (BLOCK ALL FUTURE ATTEMPTS)
#                 cursor.execute("""
#                     INSERT INTO student_test_attempts
#                     (student_id, test_scope, reference_id, is_completed,
#                      obtained_marks, total_marks, percentage, is_passed, completed_at)
#                     VALUES (%s, 'sub_topic', %s, TRUE, %s, %s, %s, %s, NOW())
#                 """, (
#                     student_id,
#                     sub_topic_id,
#                     marks_obtained,
#                     max_marks,
#                     percentage,
#                     is_passed
#                 ))

#                 # 8️⃣ Update subtopic-level progress (ALWAYS mark as completed)
#                 cursor.execute("""
#                     INSERT INTO student_subtopic_progress 
#                     (student_id, sub_topic_id, is_completed, score, last_accessed)
#                     VALUES (%s, %s, TRUE, %s, NOW())
#                     ON DUPLICATE KEY UPDATE
#                         is_completed = TRUE,
#                         score = VALUES(score),
#                         last_accessed = NOW()
#                 """, (
#                     student_id,
#                     sub_topic_id,
#                     marks_obtained
#                 ))

#                 conn.commit()

#                 return {
#                     "status": "success",
#                     "already_completed": False,
#                     "message": "Marks stored. Test marked as completed.",
#                     "data": {
#                         "sub_topic_id": sub_topic_id,
#                         "marks_obtained": marks_obtained,
#                         "max_marks": max_marks,
#                         "percentage": round(percentage, 2),
#                         "is_passed": is_passed,
#                         "completion_status": "completed"
#                     }
#                 }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error storing marks: {str(e)}")


@router.post("/store-marks")
async def store_marks(marks_data: Dict[str, Any]):
    """
    Store subtopic marks (ONE ATTEMPT ONLY).
    After first submission:
      - Student CANNOT retake again
      - is_completed = TRUE always (even if failed)
    """
    try:
        # basic input extraction
        student_id = marks_data.get("student_id")
        sub_topic_id = marks_data.get("sub_topic_id")
        marks_obtained = marks_data.get("marks_obtained")
        max_marks = marks_data.get("max_marks")

        # 1️⃣ Validate required data
        if not all([student_id, sub_topic_id]) or marks_obtained is None or max_marks is None:
            raise HTTPException(status_code=400, detail="Missing required fields")

        try:
            marks_obtained = float(marks_obtained)
            max_marks = float(max_marks)
        except Exception:
            raise HTTPException(status_code=400, detail="marks_obtained and max_marks must be numeric")

        if marks_obtained < 0 or max_marks <= 0:
            raise HTTPException(status_code=400, detail="Invalid marks values")

        # compute percentage and pass/fail (used in response only)
        percentage = (marks_obtained / max_marks) * 100
        is_passed = percentage >= 40.0

        with get_db() as conn:
            with conn.cursor() as cursor:
                # 2️⃣ Verify student exists + active (role_id = 5)
                cursor.execute("""
                    SELECT user_id, college_id, department_id
                    FROM users
                    WHERE user_id = %s AND role_id = 5 AND is_active = TRUE
                    """, (student_id,))
                user_row = cursor.fetchone()
                if not user_row:
                    raise HTTPException(status_code=404, detail="Student not found or inactive")

                # fetch college/department from user_row
                college_id = user_row.get("college_id")
                department_id = user_row.get("department_id")

                # 3️⃣ Verify subtopic exists and retrieve topic_id
                cursor.execute("""
                    SELECT sub_topic_id, topic_id
                    FROM sub_topics
                    WHERE sub_topic_id = %s AND is_active = TRUE
                """, (sub_topic_id,))
                subtopic = cursor.fetchone()
                if not subtopic:
                    raise HTTPException(status_code=404, detail="Subtopic not found or inactive")

                topic_id = subtopic.get("topic_id")

                # 4️⃣ Check if student already completed this test (BLOCK RETAKE)
                cursor.execute("""
                    SELECT attempt_id, obtained_marks
                    FROM student_test_attempts
                    WHERE student_id = %s
                      AND test_scope = 'sub_topic'
                      AND reference_id = %s
                      AND is_completed = TRUE
                    LIMIT 1
                """, (student_id, sub_topic_id))

                existing_attempt = cursor.fetchone()
                if existing_attempt:
                    prev_score = existing_attempt.get("obtained_marks")
                    return {
                        "status": "success",
                        "already_completed": True,
                        "message": "You already completed this test. Retake is not allowed.",
                        "data": {
                            "previous_score": float(prev_score) if prev_score is not None else None
                        }
                    }

                # 5️⃣ Insert into sub_topic_marks (use topic_id, college_id, department_id)
                cursor.execute("""
                    INSERT INTO sub_topic_marks
                    (student_id, sub_topic_id, topic_id, college_id, department_id,
                     marks_obtained, max_marks, attempted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                """, (
                    student_id,
                    sub_topic_id,
                    topic_id,
                    college_id,
                    department_id,
                    Decimal(str(marks_obtained)),
                    Decimal(str(max_marks))
                ))

                # 6️⃣ Insert into student_test_attempts (first attempt, completed)
                # attempt_number = 1 (since retake blocked), is_completed = 1, completed_at = NOW()
                cursor.execute("""
                    INSERT INTO student_test_attempts
                    (student_id, test_scope, reference_id, attempt_number, is_completed,
                     total_marks, obtained_marks, started_at, completed_at, time_spent_minutes)
                    VALUES (%s, 'sub_topic', %s, %s, %s, %s, %s, NULL, NOW(), %s)
                """, (
                    student_id,
                    sub_topic_id,
                    1,                      # attempt_number
                    1,                      # is_completed (tinyint)
                    Decimal(str(max_marks)),
                    Decimal(str(marks_obtained)),
                    None                    # time_spent_minutes (optional)
                ))

                # 7️⃣ Upsert student_subtopic_progress (mark completed regardless of pass/fail)
                cursor.execute("""
                    INSERT INTO student_subtopic_progress
                    (student_id, topic_id, sub_topic_id, is_completed, score, time_spent_minutes, last_accessed)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                      is_completed = VALUES(is_completed),
                      score = VALUES(score),
                      time_spent_minutes = COALESCE(VALUES(time_spent_minutes), time_spent_minutes),
                      last_accessed = NOW()
                """, (
                    student_id,
                    topic_id,
                    sub_topic_id,
                    1,                          # is_completed = TRUE
                    Decimal(str(marks_obtained)), # store raw score (marks_obtained)
                    None
                ))

                # 8️⃣ Recompute and upsert topic-level progress in student_topic_progress
                # a) completed_sub_topics (distinct sub_topic_id entries for this student & topic)
                cursor.execute("""
                    SELECT COUNT(DISTINCT sub_topic_id) AS completed_sub_topics
                    FROM sub_topic_marks
                    WHERE student_id = %s AND topic_id = %s
                """, (student_id, topic_id))
                completed_row = cursor.fetchone()
                completed_sub_topics = int(completed_row.get("completed_sub_topics") or 0)

                # b) total_sub_topics for the topic (active ones)
                cursor.execute("""
                    SELECT COUNT(*) AS total_sub_topics
                    FROM sub_topics
                    WHERE topic_id = %s AND is_active = TRUE
                """, (topic_id,))
                total_row = cursor.fetchone()
                total_sub_topics = int(total_row.get("total_sub_topics") or 0)

                # c) average_score across this student's sub_topic_marks for the topic (percent)
                cursor.execute("""
                    SELECT AVG((marks_obtained / NULLIF(max_marks,0)) * 100) AS avg_percent
                    FROM sub_topic_marks
                    WHERE student_id = %s AND topic_id = %s
                """, (student_id, topic_id))
                avg_row = cursor.fetchone()
                average_score = float(avg_row.get("avg_percent") or 0.0)

                # safe compute progress_percent
                progress_percent = (completed_sub_topics / total_sub_topics * 100.0) if total_sub_topics else 0.0

                # map progress_percent to status (adjust mapping as needed)
                if progress_percent == 0:
                    status = 'Not Started'
                elif progress_percent < 50:
                    status = 'Learning Now'
                elif progress_percent < 100:
                    status = 'Ongoing'
                else:
                    status = 'Completed'

                # upsert into student_topic_progress
                cursor.execute("""
                    INSERT INTO student_topic_progress
                    (student_id, topic_id, completed_sub_topics, total_sub_topics, progress_percent, average_score, status, last_updated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                        completed_sub_topics = VALUES(completed_sub_topics),
                        total_sub_topics = VALUES(total_sub_topics),
                        progress_percent = VALUES(progress_percent),
                        average_score = VALUES(average_score),
                        status = VALUES(status),
                        last_updated = NOW()
                """, (
                    student_id,
                    topic_id,
                    completed_sub_topics,
                    total_sub_topics,
                    Decimal(str(round(progress_percent, 2))),
                    Decimal(str(round(average_score, 2))),
                    status
                ))

                # commit transaction
                conn.commit()

                # return success response (include computed percentage & pass/fail)
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
                        "completion_status": "completed",
                        "topic_progress": {
                            "topic_id": topic_id,
                            "completed_sub_topics": completed_sub_topics,
                            "total_sub_topics": total_sub_topics,
                            "progress_percent": round(progress_percent, 2),
                            "average_score_percent": round(average_score, 2),
                            "status": status
                        }
                    }
                }

    except HTTPException:
        # re-raise to let FastAPI handle
        raise
    except Exception as e:
        # unexpected errors -> 500
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
      - Student CANNOT retake
      - is_completed = TRUE always
    """

    try:
        student_id = marks_data["student_id"]
        assignment_id = marks_data["assignment_id"]
        marks_obtained = marks_data["marks_obtained"]
        max_marks = marks_data["max_marks"]

        # Validation
        if not all([student_id, assignment_id, max_marks]) or marks_obtained is None:
            raise HTTPException(status_code=400, detail="Missing required fields")

        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Prevent retake
                cursor.execute("""
                    SELECT obtained_marks
                    FROM student_test_attempts
                    WHERE student_id = %s
                      AND reference_id = %s
                      AND test_scope = 'assignment'
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

                # 2️⃣ Insert marks (NO percentage)
                cursor.execute("""
                    INSERT INTO assignment_marks 
                    (student_id, assignment_id, marks_obtained, max_marks, graded_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE
                        marks_obtained = VALUES(marks_obtained),
                        max_marks = VALUES(max_marks),
                        graded_at = NOW()
                """, (
                    student_id,
                    assignment_id,
                    marks_obtained,
                    max_marks
                ))

                # 3️⃣ Create test attempt entry (NO percentage, NO is_passed)
                cursor.execute("""
                    INSERT INTO student_test_attempts
                    (student_id, test_scope, reference_id,
                     attempt_number, is_completed,
                     obtained_marks, total_marks,
                     completed_at, time_spent_minutes)
                    VALUES (%s, 'assignment', %s,
                            1, TRUE,
                            %s, %s,
                            NOW(), NULL)
                    ON DUPLICATE KEY UPDATE
                        is_completed = TRUE,
                        obtained_marks = VALUES(obtained_marks),
                        total_marks = VALUES(total_marks),
                        completed_at = NOW()
                """, (
                    student_id,
                    assignment_id,
                    marks_obtained,
                    max_marks
                ))

                conn.commit()

        return {
            "status": "success",
            "already_completed": False,
            "message": "Assignment submitted successfully.",
            "data": {
                "marks_obtained": marks_obtained,
                "max_marks": max_marks
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
    Return ONLY:
    - Questions
    - Options
    - Correct Answer
    No marks, no percentage, no attempt details.
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

                # 2️⃣ Ensure test was completed
                cursor.execute("""
                    SELECT attempt_id
                    FROM student_test_attempts
                    WHERE student_id = %s 
                      AND reference_id = %s 
                      AND test_scope = 'sub_topic'
                      AND is_completed = TRUE
                    LIMIT 1
                """, (student_id, sub_topic_id))

                attempt = cursor.fetchone()

                if not attempt:
                    raise HTTPException(
                        status_code=403,
                        detail="Test not completed. Student cannot view the test."
                    )

                # 3️⃣ Fetch MCQ questions from `questions` table
                cursor.execute("""
                    SELECT 
                        question_id,
                        question_text,
                        question_data
                    FROM questions
                    WHERE reference_id = %s
                      AND test_scope = 'sub_topic'
                      AND is_active = 1
                    ORDER BY order_no ASC
                """, (sub_topic_id,))

                rows = cursor.fetchall()

                questions = []

                for q in rows:
                    # Parse question_data JSON
                    try:
                        data = json.loads(q["question_data"]) if q["question_data"] else {}
                    except Exception:
                        data = {}

                    questions.append({
                        "question_id": q["question_id"],
                        "question": q["question_text"],
                        "options": data.get("options", []),
                        "correct_answer": data.get("correct_answer")
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



class ProfileData(BaseModel):
    user_id: int
    dob: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    resume_path: Optional[str] = None    # path returned after file upload
    skills: Optional[List[str]] = []


@router.post("/profile")
async def save_student_profile(data: ProfileData):

    if not data.user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Insert or update student_profile
                profile_query = """
                    INSERT INTO student_profile 
                        (user_id, dob, mobile, github_url, linkedin_url, resume_path, is_onboarded)
                    VALUES (%s, %s, %s, %s, %s, %s, 1)
                    ON DUPLICATE KEY UPDATE
                        dob = VALUES(dob),
                        mobile = VALUES(mobile),
                        github_url = VALUES(github_url),
                        linkedin_url = VALUES(linkedin_url),
                        resume_path = VALUES(resume_path),
                        is_onboarded = 1
                """

                cursor.execute(
                    profile_query,
                    [
                        data.user_id,
                        data.dob,
                        data.mobile,
                        data.github,
                        data.linkedin,
                        data.resume_path,
                    ]
                )

                # 2️⃣ Update email in users table
                cursor.execute(
                    "UPDATE users SET email = %s WHERE user_id = %s",
                    (data.email, data.user_id)
                )

                # 3️⃣ Delete old skills
                cursor.execute(
                    "DELETE FROM student_skills WHERE user_id = %s",
                    (data.user_id,)
                )

                # 4️⃣ Insert new skills
                if data.skills and len(data.skills) > 0:
                    skills = [(data.user_id, skill) for skill in data.skills]

                    cursor.executemany(
                        "INSERT INTO student_skills (user_id, skill_name) VALUES (%s, %s)",
                        skills
                    )

            conn.commit()

        return {
            "status": "success",
            "message": "Profile updated successfully"
        }

    except Exception as e:
        print("Error saving student profile:", e)
        raise HTTPException(status_code=500, detail="Server error")



@router.post("/upload/resume")
async def upload_resume(file: UploadFile):
    # Create folders automatically if missing
    upload_dir = "uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid4()}_{file.filename}"
    save_path = os.path.join(upload_dir, filename)

    # Write file
    with open(save_path, "wb") as f:
        f.write(await file.read())

    return {"file_path": save_path}


@router.get("/{user_id}/is-onboarded")
async def check_onboarded(user_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                cursor.execute(
                    "SELECT 1 FROM student_profile WHERE user_id = %s",
                    (user_id,)
                )

                profile_exists = cursor.fetchone()  # ❗ NO await

        return {
            "is_onboarded": True if profile_exists else False
        }

    except Exception as e:
        print("Error checking onboarding:", e)
        raise HTTPException(status_code=500, detail="Server error")
