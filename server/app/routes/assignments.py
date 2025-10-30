import os
import uuid
import json
import aiofiles
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db

router = APIRouter()

# ✅ Directory setup
UPLOAD_DIR = "uploads/assignments"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", status_code=201)
async def upload_assignment(
    department_id: int = Form(...),
    assignment_number: str = Form(...),
    assignment_topic: str = Form(...),
    start_date: datetime = Form(...),
    end_date: datetime = Form(...),
    file: UploadFile = File(...)
):
    """Optimized Assignment Upload"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx/.xls) files allowed")

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Validate department
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id = %s",
                    (department_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Department not found")

                # 2️⃣ Create assignment record first
                cursor.execute(
                    """
                    INSERT INTO assignments
                    (assignment_number, assignment_topic, department_id, start_date, end_date, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    (
                        assignment_number,
                        assignment_topic,
                        department_id,
                        start_date.strftime("%Y-%m-%d %H:%M:%S"),
                        end_date.strftime("%Y-%m-%d %H:%M:%S"),
                    ),
                )
                conn.commit()
                assignment_id = cursor.lastrowid

                # 3️⃣ Create assignment folder
                assignment_folder = os.path.join(UPLOAD_DIR, str(assignment_id))
                os.makedirs(assignment_folder, exist_ok=True)

                # 4️⃣ Generate unique filename and save file asynchronously
                file_extension = os.path.splitext(file.filename)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = os.path.join(assignment_folder, unique_filename)

                async with aiofiles.open(file_path, "wb") as out_file:
                    while content := await file.read(1024 * 1024):  # Stream 1MB chunks
                        await out_file.write(content)

                # 5️⃣ Update assignment with file info
                cursor.execute(
                    """
                    UPDATE assignments 
                    SET file_name = %s, file_path = %s 
                    WHERE assignment_id = %s
                    """,
                    (file.filename, file_path, assignment_id),
                )
                conn.commit()

        # ✅ Read Excel after closing DB connection (avoid blocking)
        df = pd.read_excel(file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded Excel file is empty")

        # ✅ Process & prepare questions
        question_rows = []
        with get_db() as conn:
            with conn.cursor() as cursor:
                for index, row in df.iterrows():
                    q_type = str(row["Question_Type"]).strip().lower()

                    # Fetch question type ID
                    cursor.execute(
                        "SELECT question_type_id FROM question_type WHERE question_type = %s",
                        (q_type,),
                    )
                    q_type_row = cursor.fetchone()
                    if not q_type_row:
                        raise HTTPException(status_code=400, detail=f"Invalid question type: {q_type}")
                    question_type_id = q_type_row["question_type_id"]

                    # Build question_data once
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
                            assignment_id,
                            question_type_id,
                            row.get("Question_Text"),
                            json.dumps(qd),
                            row.get("Marks", 1),
                            row.get("Order_No", index + 1),
                        )
                    )

                # ✅ Bulk insert for speed
                cursor.executemany(
                    """
                    INSERT INTO questions
                    (assignment_id, question_type_id, question_text, question_data, marks, order_no, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """,
                    question_rows,
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"Assignment #{assignment_id} created with {len(question_rows)} questions",
            "assignment_id": assignment_id,
            "file_info": {
                "original_name": file.filename,
                "saved_as": unique_filename,
                "folder": f"/uploads/assignments/{assignment_id}",
                "download_url": f"/uploads/assignments/{assignment_id}/{unique_filename}",
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/get-all")
async def get_assignments():
    """Get all assignments with file info"""
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
                return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/get/{assignment_id}/questions")
async def get_assignment_questions(assignment_id: int):
    """Get questions for a specific assignment"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM questions
                    WHERE test_scope = 'assignment' AND reference_id = %s
                    ORDER BY order_no
                """, (assignment_id,))
                questions = cursor.fetchall()

                # Parse JSON data
                for question in questions:
                    if question['question_data']:
                        question['question_data'] = json.loads(question['question_data'])

                return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")



@router.get("/assignment-marks")
async def get_assignment_marks():
    """Fetch total marks obtained for each student across all assignments"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        SUM(am.marks_obtained) AS total_marks_obtained,
                        SUM(am.max_marks) AS total_max_marks
                    FROM assignment_marks am
                    JOIN users u ON am.student_id = u.user_id
                    GROUP BY u.user_id, u.username
                    ORDER BY total_marks_obtained DESC
                """
                cursor.execute(query)
                data = cursor.fetchall()

                # Format result
                result = [
                    {
                        "student_name": row["student_name"],
                        "total_marks_obtained": row["total_marks_obtained"],
                        "total_max_marks": row["total_max_marks"],
                        "average_percentage": round(
                            (row["total_marks_obtained"] / row["total_max_marks"]) * 100, 2
                        ) if row["total_max_marks"] else 0
                    }
                    for row in data
                ]

                return {
                    "status": "success",
                    "count": len(result),
                    "data": result
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching total assignment marks: {str(e)}"
        )

    

@router.get("/topic-averages")
async def get_topic_average_marks():
    """
    Fetch student-wise topic average marks 
    (aggregating all sub-topic marks under each topic)
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        u.username AS student_name,
                        t.topic_name AS topic_name,
                        ROUND(SUM(stm.marks_obtained) / SUM(stm.max_marks) * 100, 2) AS average_percentage,
                        SUM(stm.marks_obtained) AS total_obtained,
                        SUM(stm.max_marks) AS total_max
                    FROM sub_topic_marks stm
                    JOIN users u ON stm.student_id = u.user_id
                    JOIN sub_topics st ON stm.sub_topic_id = st.sub_topic_id
                    JOIN topics t ON st.topic_id = t.topic_id
                    GROUP BY u.username, t.topic_name
                    ORDER BY u.username, t.topic_name
                """
                cursor.execute(query)
                results = cursor.fetchall()

                # Group by student
                student_data = {}
                for row in results:
                    name = row["student_name"]
                    if name not in student_data:
                        student_data[name] = {
                            "student_name": name,
                            "topics": []
                        }
                    student_data[name]["topics"].append({
                        "topic_name": row["topic_name"],
                        "total_obtained": float(row["total_obtained"]),
                        "total_max": float(row["total_max"]),
                        "average_percentage": float(row["average_percentage"])
                    })

                return {
                    "status": "success",
                    "count": len(student_data),
                    "data": list(student_data.values())
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topic averages: {str(e)}")
