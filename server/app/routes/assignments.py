from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db
import pandas as pd
import json
from datetime import datetime

router = APIRouter()

@router.post("/upload", status_code=201)
async def upload_assignment(
    department_id: int = Form(...),
    assignment_number: str = Form(...),
    assignment_topic: str = Form(...),
    start_date: datetime = Form(...),
    end_date: datetime = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload an assignment with its Excel file.
    Steps:
    1. Validate department exists
    2. Create assignment record
    3. Parse Excel file (questions)
    4. Insert all questions linked to the new assignment
    """

    # ✅ Basic file validation
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx/.xls) files are allowed.")

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Verify department
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id = %s",
                    (department_id,)
                )
                dept = cursor.fetchone()
                if not dept:
                    raise HTTPException(status_code=400, detail="Department not found")

                # 2️⃣ Create assignment
                insert_assignment = """
                    INSERT INTO assignments
                    (assignment_number, assignment_topic, department_id, start_date, end_date, file_name, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                cursor.execute(insert_assignment, (
                    assignment_number,
                    assignment_topic,
                    department_id,
                    start_date.strftime("%Y-%m-%d %H:%M:%S"),
                    end_date.strftime("%Y-%m-%d %H:%M:%S"),
                    file.filename
                ))
                conn.commit()
                assignment_id = cursor.lastrowid

                # 3️⃣ Parse Excel
                content = await file.read()
                df = pd.read_excel(content)
                inserted_count = 0

                for _, row in df.iterrows():
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

                    # 4️⃣ Insert each question
                    insert_question = """
                        INSERT INTO questions
                        (assignment_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """
                    cursor.execute(insert_question, (
                        assignment_id,
                        question_type_id,
                        row.get("Question_Text"),
                        json.dumps(question_data),
                        row.get("Marks", 1),
                        row.get("Order_No", 1)
                    ))
                    inserted_count += 1

                conn.commit()

                return {
                    "status": "success",
                    "message": f"Assignment created successfully with {inserted_count} questions.",
                    "assignment_id": assignment_id
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating assignment: {str(e)}")



@router.get("/")
async def get_assignments():
    """Get all assignments with department names, ordered by latest first"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        a.assignment_id,
                        a.assignment_number,
                        a.assignment_topic,
                        a.start_date,
                        a.end_date,
                        a.file_name,
                        d.department_name
                    FROM assignments a
                    JOIN departments d ON a.department_id = d.department_id
                    ORDER BY a.created_at DESC
                """)
                
                assignments = cursor.fetchall()
                return assignments
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


