import os
import traceback
import uuid
import json
import aiofiles
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db

router = APIRouter()

# Directory setup
UPLOAD_DIR = "uploads/tests"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/create", status_code=201)
async def create_test(
    test_type: str = Form(...),  # 'assignment' or 'sub_topic'
    
    # Common fields
    file: UploadFile = File(...),

    # Assignment fields
    department_id: int = Form(None),
    assignment_number: str = Form(None),
    assignment_topic: str = Form(None),
    total_marks: float = Form(100),
    passing_marks: float = Form(40),
    start_date: datetime = Form(None),
    end_date: datetime = Form(None),

    # Subtopic fields
    topic_name: str = Form(None),
    sub_topic_name: str = Form(None),
    file_name: str = Form(None),
):
    """Create assignment or subtopic test — optimized for speed."""

    # Validate file
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx/.xls) files are allowed.")

    # ✅ Step 1: Save uploaded file asynchronously
    unique_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{unique_id}{file_extension}"
    save_folder = os.path.join(UPLOAD_DIR, test_type)
    os.makedirs(save_folder, exist_ok=True)
    file_path = os.path.join(save_folder, saved_filename)

    async with aiofiles.open(file_path, "wb") as out_file:
        while content := await file.read(1024 * 1024):  # 1MB chunks
            await out_file.write(content)

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # ------------------------------
                # Step 2: Assignment validations
                # ------------------------------
                if test_type == "assignment":
                    if not department_id:
                        raise HTTPException(status_code=400, detail="department_id is required for assignments.")

                    cursor.execute(
                        "SELECT department_id FROM departments WHERE department_id=%s",
                        (department_id,)
                    )
                    if not cursor.fetchone():
                        raise HTTPException(status_code=400, detail="Department not found.")

                    if not (assignment_number and assignment_topic and start_date and end_date):
                        raise HTTPException(status_code=400, detail="Missing required assignment fields.")

                    # Insert assignment
                    cursor.execute(
                        """
                        INSERT INTO assignments
                        (assignment_number, assignment_topic, department_id, total_marks, passing_marks,
                         start_date, end_date, file_name, file_path, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """,
                        (
                            assignment_number,
                            assignment_topic,
                            department_id,
                            total_marks,
                            passing_marks,
                            start_date.strftime("%Y-%m-%d %H:%M:%S"),
                            end_date.strftime("%Y-%m-%d %H:%M:%S"),
                            file.filename,
                            file_path,
                        ),
                    )
                    conn.commit()
                    ref_id = cursor.lastrowid
                    test_scope = "assignment"

                # ------------------------------
                # Step 3: Subtopic validations
                # ------------------------------
                elif test_type == "sub_topic":
                    if not (topic_name and sub_topic_name):
                        raise HTTPException(status_code=400, detail="Missing topic_name or sub_topic_name.")

                    # Get topic_id by topic_name
                    cursor.execute(
                        "SELECT topic_id FROM topics WHERE topic_name=%s AND is_active=TRUE",
                        (topic_name,)
                    )
                    topic = cursor.fetchone()
                    if not topic:
                        raise HTTPException(status_code=400, detail="Topic not found.")
                    topic_id = topic["topic_id"]

                    # Check if sub_topic exists
                    cursor.execute(
                        "SELECT sub_topic_id FROM sub_topics WHERE topic_id=%s AND sub_topic_name=%s AND is_active=TRUE",
                        (topic_id, sub_topic_name)
                    )
                    sub_topic = cursor.fetchone()

                    if sub_topic:
                        # Update test_file
                        ref_id = sub_topic["sub_topic_id"]
                        cursor.execute(
                            """
                            UPDATE sub_topics 
                            SET file_name=%s, test_file=%s, updated_at=NOW()
                            WHERE sub_topic_id=%s
                            """,
                            (file.filename, file_path, ref_id)
                        )
                        conn.commit()
                    else:
                        cursor.execute(
                            """
                            INSERT INTO sub_topics
                            (topic_id, sub_topic_name, file_name, test_file, is_active, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, TRUE, NOW(), NOW())
                            """,
                            (topic_id, sub_topic_name, file.filename, file_path)
                        )
                        conn.commit()
                        ref_id = cursor.lastrowid

                    test_scope = "sub_topic"

                else:
                    raise HTTPException(status_code=400, detail="Invalid test_type. Must be 'assignment' or 'sub_topic'.")

        # ------------------------------
        # Step 4: Parse Excel for questions
        # ------------------------------
        df = pd.read_excel(file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded Excel file is empty or invalid.")

        # ------------------------------
        # Step 5: Prepare question rows
        # ------------------------------
        question_rows = []
        with get_db() as conn:
            with conn.cursor() as cursor:
                for index, row in df.iterrows():
                    q_type = str(row["Question_Type"]).strip().lower()

                    cursor.execute(
                        "SELECT question_type_id FROM question_type WHERE question_type=%s",
                        (q_type,)
                    )
                    q_type_row = cursor.fetchone()
                    if not q_type_row:
                        raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                    q_type_id = q_type_row["question_type_id"]

                    # Build question data JSON
                    qd = {}
                    if q_type == "mcq":
                        qd = {
                            "options": [row.get("Option_A"), row.get("Option_B"), row.get("Option_C"), row.get("Option_D")],
                            "correct_answer": row.get("Correct_Answer"),
                        }
                    elif q_type == "fill_blank":
                        qd = {
                            "sentence": row.get("Question_Text"),
                            "correct_answers": [x.strip() for x in str(row.get("Correct_Answer", "")).split(",")],
                        }
                    elif q_type == "match":
                        qd = {
                            "column_a": str(row.get("Option_A", "")).split(";"),
                            "column_b": str(row.get("Option_B", "")).split(";"),
                            "correct_pairs": dict(
                                pair.split("-") for pair in str(row.get("Correct_Answer", "")).split(",") if "-" in pair
                            ),
                        }
                    elif q_type == "own_response":
                        qd = {"expected_keywords": str(row.get("Extra_Data", "")).split(",")}
                    elif q_type == "true_false":
                        qd = {
                            "statement": row.get("Question_Text"),
                            "correct_answer": str(row.get("Correct_Answer")).lower() in ["true", "1"],
                        }
                    elif q_type == "one_word":
                        qd = {
                            "definition": row.get("Question_Text"),
                            "correct_answer": row.get("Correct_Answer"),
                        }

                    question_rows.append(
                        (
                            test_scope,
                            ref_id,
                            q_type_id,
                            row.get("Question_Text"),
                            json.dumps(qd),
                            row.get("Marks", 1),
                            row.get("Order_No", index + 1),
                        )
                    )

                # ------------------------------
                # Step 6: Bulk insert questions
                # ------------------------------
                cursor.executemany(
                    """
                    INSERT INTO questions
                    (test_scope, reference_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    question_rows,
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"{test_scope.capitalize()} created successfully with {len(question_rows)} questions.",
            "reference_id": ref_id,
            "file_info": {
                "original_name": file.filename,
                "saved_as": saved_filename,
                "path": file_path,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating test: {str(e)}")



@router.post("/start/{user_id}")
async def start_session(user_id: int):
    """
    Start a session for a user when they begin a test.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO user_sessions (user_id, start_time)
                    VALUES (%s, %s)
                """, (user_id, datetime.now()))
                conn.commit()

                session_id = cursor.lastrowid

                return {
                    "status": "success",
                    "message": "Session started successfully",
                    "session_id": session_id
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")
    

@router.put("/end/{session_id}")
async def end_session(session_id: int):
    """
    End a user's active session (calculate duration automatically).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Ensure the session exists and is not already ended
                cursor.execute("""
                    SELECT * FROM user_sessions 
                    WHERE id = %s AND end_time IS NULL
                """, (session_id,))
                session = cursor.fetchone()

                if not session:
                    raise HTTPException(status_code=404, detail="Session not found or already ended")

                # End session
                cursor.execute("""
                    UPDATE user_sessions
                    SET end_time = %s
                    WHERE id = %s
                """, (datetime.now(), session_id))
                conn.commit()

                return {
                    "status": "success",
                    "message": "Session ended successfully"
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")    
    



@router.put("/update-file/{assignment_id}")
async def update_assignment_file(assignment_id: int, file: UploadFile = File(...)):
    """
    Update an existing assignment's question file.
    - Deletes the old file from disk
    - Deletes existing questions
    - Parses the new Excel file and re-inserts questions
    """
    # ✅ Step 1: Validate file type
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx/.xls) files are allowed.")

    try:
        # ✅ Step 2: Get assignment info (to remove old file)
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT file_path, file_name FROM assignments WHERE assignment_id = %s",
                    (assignment_id,)
                )
                assignment = cursor.fetchone()

                if not assignment:
                    raise HTTPException(status_code=404, detail="Assignment not found.")

                old_file_path = assignment.get("file_path")

                # ✅ Step 3: Delete old file (if exists)
                if old_file_path and os.path.exists(old_file_path):
                    os.remove(old_file_path)

        # ✅ Step 4: Save new file
        unique_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        saved_filename = f"{unique_id}{file_extension}"
        save_folder = os.path.join(UPLOAD_DIR, "assignment")
        os.makedirs(save_folder, exist_ok=True)
        new_file_path = os.path.join(save_folder, saved_filename)

        async with aiofiles.open(new_file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)

        # ✅ Step 5: Parse Excel
        df = pd.read_excel(new_file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded Excel file is empty or invalid.")

        # ✅ Step 6: Remove existing questions for this assignment
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM questions WHERE test_scope='assignment' AND reference_id=%s",
                    (assignment_id,)
                )
                conn.commit()

        # ✅ Step 7: Re-insert questions
        question_rows = []
        with get_db() as conn:
            with conn.cursor() as cursor:
                for index, row in df.iterrows():
                    q_type = str(row["Question_Type"]).strip().lower()

                    cursor.execute(
                        "SELECT question_type_id FROM question_type WHERE question_type=%s",
                        (q_type,)
                    )
                    q_type_row = cursor.fetchone()
                    if not q_type_row:
                        raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                    q_type_id = q_type_row["question_type_id"]

                    qd = {}
                    if q_type == "mcq":
                        qd = {
                            "options": [
                                row.get("Option_A"),
                                row.get("Option_B"),
                                row.get("Option_C"),
                                row.get("Option_D")
                            ],
                            "correct_answer": row.get("Correct_Answer"),
                        }
                    elif q_type == "fill_blank":
                        qd = {
                            "sentence": row.get("Question_Text"),
                            "correct_answers": [
                                x.strip() for x in str(row.get("Correct_Answer", "")).split(",")
                            ],
                        }
                    elif q_type == "match":
                        qd = {
                            "column_a": str(row.get("Option_A", "")).split(";"),
                            "column_b": str(row.get("Option_B", "")).split(";"),
                            "correct_pairs": dict(
                                pair.split("-") for pair in str(row.get("Correct_Answer", "")).split(",") if "-" in pair
                            ),
                        }
                    elif q_type == "own_response":
                        qd = {"expected_keywords": str(row.get("Extra_Data", "")).split(",")}
                    elif q_type == "true_false":
                        qd = {
                            "statement": row.get("Question_Text"),
                            "correct_answer": str(row.get("Correct_Answer")).lower() in ["true", "1"],
                        }
                    elif q_type == "one_word":
                        qd = {
                            "definition": row.get("Question_Text"),
                            "correct_answer": row.get("Correct_Answer"),
                        }

                    question_rows.append(
                        (
                            "assignment",
                            assignment_id,
                            q_type_id,
                            row.get("Question_Text"),
                            json.dumps(qd),
                            row.get("Marks", 1),
                            row.get("Order_No", index + 1),
                        )
                    )

                cursor.executemany(
                    """
                    INSERT INTO questions
                    (test_scope, reference_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    question_rows,
                )

                # ✅ Step 8: Update file info in assignments table
                cursor.execute(
                    """
                    UPDATE assignments
                    SET file_name=%s, file_path=%s, updated_at=NOW()
                    WHERE assignment_id=%s
                    """,
                    (file.filename, new_file_path, assignment_id),
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"Assignment file updated successfully with {len(question_rows)} new questions.",
            "assignment_id": assignment_id,
            "file_info": {
                "original_name": file.filename,
                "saved_as": saved_filename,
                "path": new_file_path,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print("Error updating assignment file:", e)
        raise HTTPException(status_code=500, detail=f"Error updating assignment file: {str(e)}")

    


@router.delete("/delete/{assignment_id}")
async def delete_assignment(assignment_id: int):
    """
    Delete an assignment completely:
    - Removes from DB
    - Deletes related questions
    - Deletes uploaded file from disk (if exists)
    """
    try:
        with get_db() as conn:
            with conn.cursor(dictionary=True) as cursor:
                # ✅ Step 1: Get assignment info (to delete file)
                cursor.execute(
                    "SELECT file_path, file_name FROM assignments WHERE assignment_id = %s",
                    (assignment_id,)
                )
                assignment = cursor.fetchone()

                if not assignment:
                    raise HTTPException(status_code=404, detail="Assignment not found")

                file_path = assignment.get("file_path")
                file_name = assignment.get("file_name")

                # ✅ Step 2: Delete related questions first
                cursor.execute(
                    "DELETE FROM questions WHERE test_scope = 'assignment' AND reference_id = %s",
                    (assignment_id,)
                )
                questions_deleted = cursor.rowcount

                # ✅ Step 3: Delete assignment record
                cursor.execute(
                    "DELETE FROM assignments WHERE assignment_id = %s",
                    (assignment_id,)
                )
                conn.commit()

        # ✅ Step 4: Delete file (after DB commit)
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as file_err:
                print(f"⚠️ Warning: Could not delete file {file_path}: {file_err}")

        elif file_path:
            # Optional: handle relative path case
            alt_path = os.path.join("uploads/tests/assignment", os.path.basename(file_path))
            if os.path.exists(alt_path):
                try:
                    os.remove(alt_path)
                except Exception as file_err:
                    print(f"⚠️ Warning: Could not delete alternate file {alt_path}: {file_err}")

        return {
            "status": "success",
            "message": (
                f"Assignment ID {assignment_id} deleted successfully! "
                f"Removed {questions_deleted} related questions."
            ),
            "deleted_questions": questions_deleted,
            "deleted_file": file_name or None,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error deleting assignment:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")





@router.put("/update-file/subtopic/{sub_topic_id}")
async def update_subtopic_file(sub_topic_id: int, file: UploadFile = File(...)):
    """
    Update an existing subtopic's question file.
    - Deletes old file from disk
    - Deletes existing questions for that subtopic
    - Parses new Excel file and re-inserts questions
    """
    # ✅ Step 1: Validate file type
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx/.xls) files are allowed.")

    try:
        # ✅ Step 2: Get subtopic info (for deleting old file)
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT test_file, file_name FROM sub_topics WHERE sub_topic_id = %s",
                    (sub_topic_id,)
                )
                sub_topic = cursor.fetchone()

                if not sub_topic:
                    raise HTTPException(status_code=404, detail="Subtopic not found.")

                old_file_path = sub_topic.get("test_file")

                # ✅ Step 3: Delete old file if exists
                if old_file_path and os.path.exists(old_file_path):
                    os.remove(old_file_path)

        # ✅ Step 4: Save new file
        unique_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        saved_filename = f"{unique_id}{file_extension}"
        save_folder = os.path.join(UPLOAD_DIR, "sub_topic")
        os.makedirs(save_folder, exist_ok=True)
        new_file_path = os.path.join(save_folder, saved_filename)

        async with aiofiles.open(new_file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                await out_file.write(chunk)

        # ✅ Step 5: Parse Excel for new questions
        df = pd.read_excel(new_file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded Excel file is empty or invalid.")

        # ✅ Step 6: Delete existing questions linked to this subtopic
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM questions WHERE test_scope='sub_topic' AND reference_id=%s",
                    (sub_topic_id,),
                )
                conn.commit()

        # ✅ Step 7: Insert parsed questions
        question_rows = []
        with get_db() as conn:
            with conn.cursor() as cursor:
                for index, row in df.iterrows():
                    q_type = str(row["Question_Type"]).strip().lower()

                    cursor.execute(
                        "SELECT question_type_id FROM question_type WHERE question_type=%s",
                        (q_type,)
                    )
                    q_type_row = cursor.fetchone()
                    if not q_type_row:
                        raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                    q_type_id = q_type_row["question_type_id"]

                    # Build question_data JSON structure
                    qd = {}
                    if q_type == "mcq":
                        qd = {
                            "options": [
                                row.get("Option_A"),
                                row.get("Option_B"),
                                row.get("Option_C"),
                                row.get("Option_D")
                            ],
                            "correct_answer": row.get("Correct_Answer"),
                        }
                    elif q_type == "fill_blank":
                        qd = {
                            "sentence": row.get("Question_Text"),
                            "correct_answers": [
                                x.strip() for x in str(row.get("Correct_Answer", "")).split(",")
                            ],
                        }
                    elif q_type == "match":
                        qd = {
                            "column_a": str(row.get("Option_A", "")).split(";"),
                            "column_b": str(row.get("Option_B", "")).split(";"),
                            "correct_pairs": dict(
                                pair.split("-") for pair in str(row.get("Correct_Answer", "")).split(",") if "-" in pair
                            ),
                        }
                    elif q_type == "own_response":
                        qd = {"expected_keywords": str(row.get("Extra_Data", "")).split(",")}
                    elif q_type == "true_false":
                        qd = {
                            "statement": row.get("Question_Text"),
                            "correct_answer": str(row.get("Correct_Answer")).lower() in ["true", "1"],
                        }
                    elif q_type == "one_word":
                        qd = {
                            "definition": row.get("Question_Text"),
                            "correct_answer": row.get("Correct_Answer"),
                        }

                    question_rows.append(
                        (
                            "sub_topic",
                            sub_topic_id,
                            q_type_id,
                            row.get("Question_Text"),
                            json.dumps(qd),
                            row.get("Marks", 1),
                            row.get("Order_No", index + 1),
                        )
                    )

                # Bulk insert all questions
                cursor.executemany(
                    """
                    INSERT INTO questions
                    (test_scope, reference_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    question_rows,
                )

                # ✅ Step 8: Update file info in sub_topics
                cursor.execute(
                    """
                    UPDATE sub_topics
                    SET file_name=%s, test_file=%s, updated_at=NOW()
                    WHERE sub_topic_id=%s
                    """,
                    (file.filename, new_file_path, sub_topic_id),
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"Subtopic file updated successfully with {len(question_rows)} new questions.",
            "sub_topic_id": sub_topic_id,
            "file_info": {
                "original_name": file.filename,
                "saved_as": saved_filename,
                "path": new_file_path,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error updating subtopic file:", e)
        raise HTTPException(status_code=500, detail=f"Error updating subtopic file: {str(e)}")
