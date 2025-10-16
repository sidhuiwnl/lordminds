import os
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
    department_id: int = Form(...),
    file: UploadFile = File(...),

    # Assignment fields
    assignment_number: str = Form(None),
    assignment_topic: str = Form(None),
    total_marks: float = Form(100),
    passing_marks: float = Form(40),
    start_date: datetime = Form(None),
    end_date: datetime = Form(None),

    # Subtopic fields
    topic_name: str = Form(None),
    sub_topic_name: str = Form(None),
    no_of_sub_topics: int = Form(None),
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
                # ✅ Step 2: Validate department
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id=%s",
                    (department_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Department not found.")

                # ✅ Step 3: Handle Assignment creation
                if test_type == "assignment":
                    if not (assignment_number and assignment_topic and start_date and end_date):
                        raise HTTPException(status_code=400, detail="Missing required assignment fields.")

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

                # ✅ Step 4: Handle Subtopic creation
                elif test_type == "sub_topic":
                    if not (topic_name and sub_topic_name):
                        raise HTTPException(status_code=400, detail="Missing topic_name or sub_topic_name.")

                    # Validate topic & subtopic
                    cursor.execute(
                        "SELECT topic_id FROM topics WHERE department_id=%s AND topic_name=%s AND is_active=TRUE",
                        (department_id, topic_name),
                    )
                    topic = cursor.fetchone()
                    if not topic:
                        raise HTTPException(status_code=400, detail="Topic not found.")
                    topic_id = topic["topic_id"]

                    cursor.execute(
                        "SELECT sub_topic_id FROM sub_topics WHERE topic_id=%s AND sub_topic_name=%s AND is_active=TRUE",
                        (topic_id, sub_topic_name),
                    )
                    cursor.execute(
                        "SELECT sub_topic_id FROM sub_topics WHERE topic_id=%s AND sub_topic_name=%s AND is_active=TRUE",
                        (topic_id, sub_topic_name),
                    )
                    sub_topic = cursor.fetchone()

                    if sub_topic:
                        # If exists, optionally update test_file
                        ref_id = sub_topic["sub_topic_id"]
                        cursor.execute(
                            "UPDATE sub_topics SET test_file=%s, updated_at=NOW() WHERE sub_topic_id=%s",
                            (file.filename, ref_id),
                        )
                    else:
                        # Insert new subtopic
                        cursor.execute(
                            """
                            INSERT INTO sub_topics
                            (topic_id, sub_topic_name, file_name, test_file, is_active, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, TRUE, NOW(), NOW())
                            """,
                            (topic_id, sub_topic_name, file_name or file.filename, file.filename),
                        )
                        conn.commit()
                        ref_id = cursor.lastrowid

                    test_scope = "sub_topic"

                else:
                    raise HTTPException(status_code=400, detail="Invalid test_type. Must be 'assignment' or 'sub_topic'.")

        # ✅ Step 5: Parse Excel after DB insert (outside transaction for I/O)
        df = pd.read_excel(file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded Excel file is empty or invalid.")

        # ✅ Step 6: Build question data for bulk insert
        question_rows = []
        with get_db() as conn:
            with conn.cursor() as cursor:
                for index, row in df.iterrows():
                    q_type = str(row["Question_Type"]).strip().lower()

                    cursor.execute(
                        "SELECT question_type_id FROM question_type WHERE question_type=%s",
                        (q_type,),
                    )
                    q_type_row = cursor.fetchone()
                    if not q_type_row:
                        raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                    q_type_id = q_type_row["question_type_id"]

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

                # ✅ Step 7: Bulk insert
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
