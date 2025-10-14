from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db
import pandas as pd
import json
from datetime import datetime

router = APIRouter()


@router.post("/create", status_code=201)
async def create_test(
    test_type: str = Form(...),  # 'assignment' or 'sub_topic'
    
    # Common fields
    department_id: int = Form(...),
    file: UploadFile = File(...),  # Required for both, Excel file with questions
    
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
    no_of_sub_topics: int = Form(None)
):
    """
    Create either an assignment test or a subtopic test with Excel question upload.
    Steps:
    1. Validate department exists
    2. Create assignment/subtopic record
    3. Parse Excel file (questions)
    4. Insert all questions linked to the new assignment/subtopic
    """
    # Basic file validation
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx/.xls) files are allowed.")

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                if test_type == "assignment":
                    # Validate required fields
                    if not (assignment_number and assignment_topic and start_date and end_date):
                        raise HTTPException(status_code=400, detail="Missing required assignment fields.")

                    # Check department exists
                    cursor.execute(
                        "SELECT department_id FROM departments WHERE department_id=%s",
                        (department_id,)
                    )
                    dept = cursor.fetchone()
                    if not dept:
                        raise HTTPException(status_code=400, detail="Department not found.")

                    # Format dates for DB insert
                    start_date_str = start_date.strftime("%Y-%m-%d %H:%M:%S")
                    end_date_str = end_date.strftime("%Y-%m-%d %H:%M:%S")

                    # Insert assignment
                    insert_assignment = """
                        INSERT INTO assignments
                        (assignment_number, assignment_topic, department_id, total_marks, passing_marks,
                         start_date, end_date, file_name, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """
                    cursor.execute(insert_assignment, (
                        assignment_number,
                        assignment_topic,
                        department_id,
                        total_marks,
                        passing_marks,
                        start_date_str,
                        end_date_str,
                        file.filename
                    ))
                    assignment_id = cursor.lastrowid

                    # Parse Excel and insert questions
                    content = await file.read()
                    df = pd.read_excel(content)
                    inserted_count = 0

                    for index, row in df.iterrows():
                        q_type = row["Question_Type"].strip().lower()

                        # Get question_type_id from question_type table
                        cursor.execute("SELECT question_type_id FROM question_type WHERE question_type = %s", (q_type,))
                        q_type_row = cursor.fetchone()
                        if not q_type_row:
                            raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                        question_type_id = q_type_row["question_type_id"]

                        # Build question_data JSON based on type
                        question_data = {}
                        if q_type == "mcq":
                            question_data = {
                                "options": [
                                    row.get("Option_A"),
                                    row.get("Option_B"),
                                    row.get("Option_C"),
                                    row.get("Option_D")
                                ],
                                "correct_answer": row.get("Correct_Answer")
                            }
                        elif q_type == "fill_blank":
                            question_data = {
                                "sentence": row.get("Question_Text"),
                                "correct_answers": [x.strip() for x in str(row.get("Correct_Answer", "")).split(",")]
                            }
                        elif q_type == "match":
                            question_data = {
                                "column_a": str(row.get("Option_A", "")).split(";"),
                                "column_b": str(row.get("Option_B", "")).split(";"),
                                "correct_pairs": dict(
                                    [pair.split("-") for pair in str(row.get("Correct_Answer", "")).split(",")]
                                )
                            }
                        elif q_type == "own_response":
                            question_data = {
                                "expected_keywords": str(row.get("Extra_Data", "")).split(",")
                            }
                        elif q_type == "true_false":
                            question_data = {
                                "statement": row.get("Question_Text"),
                                "correct_answer": row.get("Correct_Answer") in ["True", "true", "1"]
                            }
                        elif q_type == "one_word":
                            question_data = {
                                "definition": row.get("Question_Text"),
                                "correct_answer": row.get("Correct_Answer")
                            }

                        # Insert each question using test_scope and reference_id
                        insert_question = """
                            INSERT INTO questions
                            (test_scope, reference_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """
                        cursor.execute(insert_question, (
                            'assignment',
                            assignment_id,
                            question_type_id,
                            row.get("Question_Text"),
                            json.dumps(question_data),
                            row.get("Marks", 1),
                            row.get("Order_No", index + 1)
                        ))
                        inserted_count += 1

                    conn.commit()
                    return {
                        "status": "success",
                        "message": f"Assignment test created successfully with {inserted_count} questions.",
                        "assignment_id": assignment_id
                    }

                elif test_type == "sub_topic":
                    # Validate required fields
                    if not (topic_name and sub_topic_name):
                        raise HTTPException(status_code=400, detail="Missing required subtopic fields: topic_name and sub_topic_name.")

                    # Check department exists
                    cursor.execute(
                        "SELECT department_id FROM departments WHERE department_id=%s",
                        (department_id,)
                    )
                    dept = cursor.fetchone()
                    if not dept:
                        raise HTTPException(status_code=400, detail="Department not found")

                    # Find existing topic
                    cursor.execute(
                        "SELECT topic_id FROM topics WHERE department_id=%s AND topic_name=%s AND is_active=TRUE",
                        (department_id, topic_name)
                    )
                    topic = cursor.fetchone()
                    if not topic:
                        raise HTTPException(status_code=400, detail="Topic not found.")

                    topic_id = topic['topic_id']

                    # Find existing sub_topic under the topic
                    cursor.execute(
                        "SELECT sub_topic_id FROM sub_topics WHERE topic_id=%s AND sub_topic_name=%s AND is_active=TRUE",
                        (topic_id, sub_topic_name)
                    )
                    sub_topic = cursor.fetchone()
                    if not sub_topic:
                        raise HTTPException(status_code=400, detail="Sub-topic not found.")

                    sub_topic_id = sub_topic['sub_topic_id']

                    # Parse Excel and insert questions
                    content = await file.read()
                    df = pd.read_excel(content)
                    inserted_count = 0

                    for index, row in df.iterrows():
                        q_type = row["Question_Type"].strip().lower()

                        # Get question_type_id from question_type table
                        cursor.execute("SELECT question_type_id FROM question_type WHERE question_type = %s", (q_type,))
                        q_type_row = cursor.fetchone()
                        if not q_type_row:
                            raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                        question_type_id = q_type_row["question_type_id"]

                        # Build question_data JSON based on type (same as assignment)
                        question_data = {}
                        if q_type == "mcq":
                            question_data = {
                                "options": [
                                    row.get("Option_A"),
                                    row.get("Option_B"),
                                    row.get("Option_C"),
                                    row.get("Option_D")
                                ],
                                "correct_answer": row.get("Correct_Answer")
                            }
                        elif q_type == "fill_blank":
                            question_data = {
                                "sentence": row.get("Question_Text"),
                                "correct_answers": [x.strip() for x in str(row.get("Correct_Answer", "")).split(",")]
                            }
                        elif q_type == "match":
                            question_data = {
                                "column_a": str(row.get("Option_A", "")).split(";"),
                                "column_b": str(row.get("Option_B", "")).split(";"),
                                "correct_pairs": dict(
                                    [pair.split("-") for pair in str(row.get("Correct_Answer", "")).split(",")]
                                )
                            }
                        elif q_type == "own_response":
                            question_data = {
                                "expected_keywords": str(row.get("Extra_Data", "")).split(",")
                            }
                        elif q_type == "true_false":
                            question_data = {
                                "statement": row.get("Question_Text"),
                                "correct_answer": row.get("Correct_Answer") in ["True", "true", "1"]
                            }
                        elif q_type == "one_word":
                            question_data = {
                                "definition": row.get("Question_Text"),
                                "correct_answer": row.get("Correct_Answer")
                            }

                        # Insert each question using test_scope and reference_id
                        insert_question = """
                            INSERT INTO questions
                            (test_scope, reference_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """
                        cursor.execute(insert_question, (
                            'sub_topic',
                            sub_topic_id,
                            question_type_id,
                            row.get("Question_Text"),
                            json.dumps(question_data),
                            row.get("Marks", 1),
                            row.get("Order_No", index + 1)
                        ))
                        inserted_count += 1

                    conn.commit()
                    return {
                        "status": "success",
                        "message": f"Questions added successfully to subtopic with {inserted_count} questions.",
                        "topic_id": topic_id,
                        "sub_topic_id": sub_topic_id
                    }

                else:
                    raise HTTPException(status_code=400, detail="Invalid test_type. Must be 'assignment' or 'sub_topic'.")

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating test: {str(e)}")
