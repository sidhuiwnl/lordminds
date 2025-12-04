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
    test_type: str = Form(...),
    file: UploadFile = File(...),

    college_id: int = Form(None),
    department_id: int = Form(None),
    assignment_number: str = Form(None),
    assignment_topic: str = Form(None),
    start_date: str = Form(None),
    end_date: str = Form(None),

    topic_name: str = Form(None),
    sub_topic_name: str = Form(None),
    file_name: str = Form(None),
):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Only Excel files allowed")

    unique_id = str(uuid.uuid4())
    saved_filename = f"{unique_id}{os.path.splitext(file.filename)[1]}"
    save_folder = os.path.join(UPLOAD_DIR, test_type)
    os.makedirs(save_folder, exist_ok=True)
    file_path = os.path.join(save_folder, saved_filename)

    async with aiofiles.open(file_path, "wb") as out:
        while data := await file.read(1024 * 1024):
            await out.write(data)
    end_date = end_date or None
    start_date = start_date or None

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # CREATE ASSIGNMENT
                if test_type == "assignment":
                    if not all([college_id, department_id, assignment_number, assignment_topic]):
                        raise HTTPException(400, "Missing required assignment fields")
                    

                    cursor.execute("""
                        INSERT INTO assignments
                        (assignment_number, assignment_topic, college_id, department_id, start_date,
                         end_date, file_name, file_path, created_at, updated_at)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                    """, (
                        assignment_number, assignment_topic, college_id, department_id,
                        start_date, end_date, file.filename, file_path
                    ))
                    ref_id = cursor.lastrowid
                    test_scope = "assignment"

                # CREATE SUBTOPIC TEST
                elif test_type == "sub_topic":
                    cursor.execute("SELECT topic_id FROM topics WHERE topic_name=%s", (topic_name,))
                    topic = cursor.fetchone()
                    if not topic:
                        raise HTTPException(400, "Topic not found")

                    topic_id = topic["topic_id"]

                    cursor.execute("""
                        INSERT INTO sub_topics
                        (topic_id, sub_topic_name, file_name, test_file, created_at, updated_at)
                        VALUES (%s,%s,%s,%s,NOW(),NOW())
                    """, (topic_id, sub_topic_name, file.filename, file_path))

                    ref_id = cursor.lastrowid
                    test_scope = "sub_topic"

                # Parse Excel
                df = pd.read_excel(file_path)
                df = normalize_columns(df)

                if "question_type" not in df.columns or "question_text" not in df.columns:
                    raise HTTPException(400, "Excel missing Question_Type or Question_Text")

                question_rows = []
                question_type_cache = {}

                for idx, row in df.iterrows():
                    if pd.isna(row.get("question_type")):
                        continue

                    q_type = str(row.get("question_type")).strip().lower()

                    if q_type not in question_type_cache:
                        cursor.execute("SELECT question_type_id FROM question_type WHERE question_type=%s", (q_type,))
                        qt = cursor.fetchone()
                        if not qt:
                            raise HTTPException(400, f"Invalid question type: {q_type}")
                        question_type_cache[q_type] = qt["question_type_id"]

                    qd = build_question_json(row, q_type)

                    question_rows.append((
                        test_scope,
                        ref_id,
                        question_type_cache[q_type],
                        row.get("question_text"),
                        json.dumps(qd),
                        float(row.get("marks", 1)),
                        int(row.get("order_no", idx + 1)),
                    ))

                cursor.executemany("""
                    INSERT INTO questions
                    (test_scope,reference_id,question_type_id,question_text,question_data,
                     marks,order_no,created_at,updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                """, question_rows)
                conn.commit()

        return {"status": "success", "message": "Test created", "reference_id": ref_id}

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(500, f"Error: {str(e)}")







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

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(400, "Only Excel files allowed")

    # Save file
    unique_id = str(uuid.uuid4())
    saved_filename = f"{unique_id}{os.path.splitext(file.filename)[1]}"
    folder = os.path.join(UPLOAD_DIR, "assignment")
    os.makedirs(folder, exist_ok=True)
    new_file_path = os.path.join(folder, saved_filename)

    async with aiofiles.open(new_file_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            await out.write(chunk)

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Delete old file
                cursor.execute("SELECT file_path FROM assignments WHERE assignment_id=%s", (assignment_id,))
                data = cursor.fetchone()
                if not data:
                    raise HTTPException(404, "Assignment not found")

                if data["file_path"] and os.path.exists(data["file_path"]):
                    os.remove(data["file_path"])

                # Delete old questions
                cursor.execute("DELETE FROM questions WHERE test_scope='assignment' AND reference_id=%s", (assignment_id,))
                conn.commit()

        # Parse Excel
        df = pd.read_excel(new_file_path)
        df = normalize_columns(df)

        question_rows = []

        with get_db() as conn:
            with conn.cursor() as cursor:

                qt_cache = {}

                for idx, row in df.iterrows():
                    q_type = str(row.get("question_type")).strip().lower()

                    if q_type not in qt_cache:
                        cursor.execute("SELECT question_type_id FROM question_type WHERE question_type=%s", (q_type,))
                        qt = cursor.fetchone()
                        if not qt:
                            raise HTTPException(400, f"Invalid question type: {q_type}")
                        qt_cache[q_type] = qt["question_type_id"]

                    qd = build_question_json(row, q_type)

                    question_rows.append((
                        "assignment",
                        assignment_id,
                        qt_cache[q_type],
                        row.get("question_text"),
                        json.dumps(qd),
                        float(row.get("marks", 1)),
                        int(row.get("order_no", idx + 1)),
                    ))

                cursor.executemany("""
                    INSERT INTO questions
                    (test_scope,reference_id,question_type_id,question_text,question_data,
                     marks,order_no,created_at,updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                """, question_rows)

                cursor.execute("""
                    UPDATE assignments
                    SET file_name=%s, file_path=%s, updated_at=NOW()
                    WHERE assignment_id=%s
                """, (file.filename, new_file_path, assignment_id))

                conn.commit()

        return {"status": "success", "message": "Assignment updated", "questions": len(question_rows)}

    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")

    



@router.delete("/delete/{assignment_id}")
async def delete_assignment(assignment_id: int):
    """
    Delete an assignment completely:
    - Removes from DB
    - Deletes related questions
    - Deletes uploaded file from disk (if exists)
    """
    conn = None
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # ✅ Step 1: Get assignment info (to delete file)
                cursor.execute(
                    "SELECT file_path, file_name, assignment_number FROM assignments WHERE assignment_id = %s",
                    (assignment_id,)
                )
                assignment = cursor.fetchone()

                if not assignment:
                    raise HTTPException(status_code=404, detail="Assignment not found")

                file_path = assignment.get("file_path")
                file_name = assignment.get("file_name")
                assignment_number = assignment.get("assignment_number")

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
                
                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="Assignment not found or already deleted")
                
                conn.commit()

        # ✅ Step 4: Delete file (after DB commit)
        file_deleted = False
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                file_deleted = True
            except Exception as file_err:
                print(f"⚠️ Warning: Could not delete file {file_path}: {file_err}")
                # Don't fail the whole request if file deletion fails

        return {
            "status": "success",
            "message": (
                f"Assignment '{assignment_number}' (ID: {assignment_id}) deleted successfully!"
            ),
            "deleted_assignment": {
                "assignment_id": assignment_id,
                "assignment_number": assignment_number,
                "file_name": file_name
            },
            "deleted_questions": questions_deleted,
            "file_deleted": file_deleted,
        }

    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print("❌ Error deleting assignment:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")





@router.put("/update-file/subtopic/{sub_topic_id}")
async def update_subtopic_file(sub_topic_id: int, file: UploadFile = File(...)):

    if not file.filename.endswith((".xlsx",".xls")):
        raise HTTPException(400, "Only Excel allowed")

    unique_id = str(uuid.uuid4())
    saved_filename = f"{unique_id}{os.path.splitext(file.filename)[1]}"
    folder = os.path.join(UPLOAD_DIR, "sub_topic")
    os.makedirs(folder, exist_ok=True)
    new_file_path = os.path.join(folder, saved_filename)

    async with aiofiles.open(new_file_path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            await out.write(chunk)

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                cursor.execute("SELECT test_file FROM sub_topics WHERE sub_topic_id=%s", (sub_topic_id,))
                subtopic = cursor.fetchone()
                if not subtopic:
                    raise HTTPException(404, "Subtopic not found")

                if subtopic["test_file"] and os.path.exists(subtopic["test_file"]):
                    os.remove(subtopic["test_file"])

                cursor.execute("DELETE FROM questions WHERE test_scope='sub_topic' AND reference_id=%s", (sub_topic_id,))
                conn.commit()

        df = pd.read_excel(new_file_path)
        df = normalize_columns(df)

        question_rows = []

        with get_db() as conn:
            with conn.cursor() as cursor:

                qt_cache = {}

                for idx, row in df.iterrows():
                    q_type = str(row.get("question_type")).strip().lower()

                    if q_type not in qt_cache:
                        cursor.execute("SELECT question_type_id FROM question_type WHERE question_type=%s", (q_type,))
                        qt = cursor.fetchone()
                        if not qt:
                            raise HTTPException(400, f"Invalid question type: {q_type}")
                        qt_cache[q_type] = qt["question_type_id"]

                    qd = build_question_json(row, q_type)

                    question_rows.append((
                        "sub_topic",
                        sub_topic_id,
                        qt_cache[q_type],
                        row.get("question_text"),
                        json.dumps(qd),
                        float(row.get("marks", 1)),
                        int(row.get("order_no", idx + 1)),
                    ))

                cursor.executemany("""
                    INSERT INTO questions
                    (test_scope,reference_id,question_type_id,question_text,question_data,
                     marks,order_no,created_at,updated_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,NOW(),NOW())
                """, question_rows)

                cursor.execute("""
                    UPDATE sub_topics
                    SET file_name=%s, test_file=%s, updated_at=NOW()
                    WHERE sub_topic_id=%s
                """, (file.filename, new_file_path, sub_topic_id))

                conn.commit()

        return {"status": "success", "message": "Subtopic updated", "questions": len(question_rows)}

    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")










def normalize_columns(df):
    """Normalize Excel columns to lowercase to avoid key errors."""
    df.columns = [col.strip().lower() for col in df.columns]
    return df





def build_question_json(row, q_type):
    """
    Build question_data JSON from Excel row.
    Supports:
      - mcq
      - true_false
      - fill_blank
      - pronunciation
      - match_following   ← NEW & PERFECT (uses Option_A-D + Extra_1)
      - one_word
      - own_response
    """
    q_type = q_type.lower().strip()

    # Helper: extract non-empty options
    def get_options():
        opts = []
        for col in ["option_a", "option_b", "option_c", "option_d"]:
            val = str(row.get(col) or "").strip()
            if val and val.lower() not in ["nan", "none"]:
                opts.append(val)
        return opts

    # ──────────────────────────────────────────────────────────────
    # 1. MCQ
    # ──────────────────────────────────────────────────────────────
    if q_type == "mcq":
        return {
            "options": get_options(),
            "correct_answer": str(row.get("Correct_Answer") or "").strip()
        }

    # ──────────────────────────────────────────────────────────────
    # 2. TRUE / FALSE
    # ──────────────────────────────────────────────────────────────
    if q_type == "true_false":
        correct = str(row.get("Correct_Answer") or "").strip().lower()
        return {
            "options": get_options(),  # usually ["True", "False"]
            "correct_answer": correct if correct in ["true", "false"] else "false"
        }

    # ──────────────────────────────────────────────────────────────
    # 3. FILL IN THE BLANKS
    # ──────────────────────────────────────────────────────────────
    if q_type == "fill_blank":
        answers = [a.strip() for a in str(row.get("Correct_Answer") or "").split(",") if a.strip()]
        return {
            "correct_answers": answers  # e.g. ["grammar", "vocabulary"]
        }

    # ──────────────────────────────────────────────────────────────
    # 4. PRONUNCIATION
    # ──────────────────────────────────────────────────────────────
    if q_type == "pronunciation":
        word = str(row.get("Correct_Answer") or row.get("Pronunciation_Word") or "").strip()
        return {
            "correct_answer": word
        }

    # ──────────────────────────────────────────────────────────────
    # 5. MATCH THE FOLLOWING ← THIS IS THE ONE YOU WANT
    # ──────────────────────────────────────────────────────────────
    if q_type == "match":
        left_items = get_options()  # Now works with Option_A, Option A, etc.

        # RIGHT COLUMN: Accept Column2 → becomes extra_1
        right_text = str(row.get("column2") or "").strip()
        right_items = [item.strip() for item in right_text.split(",") if item.strip()]

        if len(left_items) == 0:
            raise ValueError("Match the following: No items found in left column (Option_A–D)")
        if len(right_items) == 0:
            raise ValueError("Match the following: Right column is empty! Use 'Column2' or 'Extra_1' with comma-separated values")

        if len(right_items) != len(left_items):
            raise ValueError(f"Match the following: Left has {len(left_items)} items, Right has {len(right_items)} — must be equal!")

        pairing_str = str(row.get("correct_answer") or "").strip().upper()
        pairing_list = [p.strip() for p in pairing_str.split(",") if p.strip()]

        if len(pairing_list) != len(left_items):
            raise ValueError(f"Correct_Answer must have {len(left_items)} items (e.g. B,A,D,C)")

        matches = {}
        for i, target in enumerate(pairing_list):
            left_letter = chr(65 + i)  # A, B, C, D
            if target.isalpha() and len(target) == 1:
                idx = ord(target) - 65
                if 0 <= idx < len(right_items):
                    matches[left_letter] = str(idx + 1)

        return {
            "left": left_items,
            "right": right_items,
            "matches": matches
        }

    # ──────────────────────────────────────────────────────────────
    # 6. ONE WORD ANSWER
    # ──────────────────────────────────────────────────────────────
    if q_type == "one_word":
        return {
            "correct_answer": str(row.get("Correct_Answer") or "").strip()
        }

    # ──────────────────────────────────────────────────────────────
    # 7. OWN RESPONSE (open-ended with keywords)
    # ──────────────────────────────────────────────────────────────
    if q_type == "own_response":
        keywords = [k.strip() for k in str(row.get("Extra_1") or "").split(",") if k.strip()]
        return {
            "expected_keywords": keywords
        }

    # ──────────────────────────────────────────────────────────────
    # Fallback
    # ──────────────────────────────────────────────────────────────
    return {}