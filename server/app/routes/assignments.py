import os
import uuid
import json
import aiofiles
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db

router = APIRouter()


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





@router.get("/assignment-marks/{college_id}/{department_id}")
async def get_assignment_marks(college_id: int, department_id: int):
    """
    Fetch total assignment marks for each student filtered by
    specific college and department. Uses assignments table 
    (which stores the correct college_id + department_id).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                query = """
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,
                        d.department_name,
                        SUM(am.marks_obtained) AS total_marks_obtained,
                        SUM(am.max_marks) AS total_max_marks
                    FROM assignment_marks am
                    JOIN assignments a 
                        ON am.assignment_id = a.assignment_id
                    JOIN users u 
                        ON am.student_id = u.user_id
                    JOIN departments d 
                        ON u.department_id = d.department_id
                    WHERE a.college_id = %s
                      AND a.department_id = %s
                    GROUP BY 
                        u.user_id, u.username, u.full_name, d.department_name
                    ORDER BY 
                        total_marks_obtained DESC
                """

                cursor.execute(query, (college_id, department_id))
                rows = cursor.fetchall()

                result = [
                    {
                        "student_id": row["user_id"],
                        "student_name": row["student_name"],
                        "full_name": row["full_name"],
                        "department_name": row["department_name"],
                        "total_marks_obtained": float(row["total_marks_obtained"]),
                        "total_max_marks": float(row["total_max_marks"]),
                        "average_percentage": round(
                            (row["total_marks_obtained"] / row["total_max_marks"]) * 100, 2
                        ) if row["total_max_marks"] else 0
                    }
                    for row in rows
                ]

                return {
                    "status": "success",
                    "college_id": college_id,
                    "department_id": department_id,
                    "count": len(result),
                    "data": result
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching total assignment marks: {str(e)}"
        )

    
@router.get("/topic-averages/{college_id}/{department_id}")
async def get_topic_average_marks(college_id: int, department_id: int):
    """
    Fetch student-wise topic-wise average marks for a specific 
    college and department. Topics belong directly to the given 
    college_id + department_id (Option-A model).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate department exists under this college
                cursor.execute("""
                    SELECT d.department_name
                    FROM departments d
                    JOIN college_departments cd 
                        ON cd.department_id = d.department_id
                    WHERE d.department_id = %s
                      AND cd.college_id = %s
                      AND d.is_active = 1
                """, (department_id, college_id))

                department = cursor.fetchone()

                if not department:
                    raise HTTPException(
                        status_code=404,
                        detail="Department not found for this college."
                    )

                # 2️⃣ FINAL QUERY USING NEW TABLE STRUCTURE (NO mapping table)
                query = """
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,

                        t.topic_id,
                        t.topic_name,

                        ROUND(SUM(stm.marks_obtained) / SUM(stm.max_marks) * 100, 2) AS average_percentage,
                        SUM(stm.marks_obtained) AS total_obtained,
                        SUM(stm.max_marks) AS total_max

                    FROM sub_topic_marks stm

                    JOIN users u 
                        ON stm.student_id = u.user_id

                    JOIN departments d
                        ON u.department_id = d.department_id

                    JOIN sub_topics st 
                        ON stm.sub_topic_id = st.sub_topic_id

                    JOIN topics t 
                        ON st.topic_id = t.topic_id
                       AND t.college_id = %s        -- IMPORTANT
                       AND t.department_id = %s     -- IMPORTANT

                    WHERE stm.marks_obtained IS NOT NULL
                      AND stm.max_marks > 0
                      AND u.department_id = %s

                    GROUP BY 
                        u.user_id, 
                        u.username, 
                        u.full_name,
                        t.topic_id,
                        t.topic_name

                    HAVING total_max > 0

                    ORDER BY 
                        u.username,
                        t.topic_name;
                """

                cursor.execute(query, (college_id, department_id, department_id))
                rows = cursor.fetchall()

                # 3️⃣ Group result by student
                student_map = {}

                for r in rows:
                    uid = r["user_id"]

                    if uid not in student_map:
                        student_map[uid] = {
                            "student_id": uid,
                            "student_name": r["student_name"],
                            "full_name": r["full_name"],
                            "topics": []
                        }

                    student_map[uid]["topics"].append({
                        "topic_id": r["topic_id"],
                        "topic_name": r["topic_name"],
                        "average_percentage": float(r["average_percentage"]),
                        "total_obtained": float(r["total_obtained"]),
                        "total_max": float(r["total_max"]),
                    })

                final = list(student_map.values())

                return {
                    "status": "success",
                    "college_id": college_id,
                    "department_id": department_id,
                    "department_name": department["department_name"],
                    "student_count": len(final),
                    "data": final
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topic averages: {str(e)}"
        )



@router.get("/total-duration/{department_id}")
async def get_total_session_duration(department_id: int = None):
    """
    Fetch total session duration spent by each student in hours,
    optionally filtered by department.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Base query
                query = """
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,
                        d.department_name,
                        COALESCE(SUM(us.duration_seconds), 0) AS total_duration_seconds
                    FROM user_sessions us
                    JOIN users u ON us.user_id = u.user_id
                    JOIN departments d ON u.department_id = d.department_id
                """

                params = []
                if department_id:
                    query += " WHERE u.department_id = %s"
                    params.append(department_id)

                query += """
                    GROUP BY u.user_id, u.username, d.department_name
                    ORDER BY total_duration_seconds DESC
                """

                cursor.execute(query, tuple(params))
                data = cursor.fetchall()

                result = []
                for row in data:
                    total_seconds = int(row["total_duration_seconds"] or 0)
                    total_hours = round(total_seconds / 3600, 2)
                    result.append({
                        "student_name": row["student_name"],
                        "full_name": row["full_name"],
                        "department_name": row["department_name"],
                        "total_duration_hours": total_hours
                    })

                return {
                    "status": "success",
                    "count": len(result),
                    "data": result
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching total session duration: {str(e)}"
        )
    

@router.get("/overall-report/{department_id}")
async def get_overall_report(department_id: int = None):
    """
    Fetch overall report combining assignment marks, topic averages,
    session durations, and last login — optionally filtered by department.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:  # ✅ use dictionary=True
                params = []

                # -------------------------------
                # 1️⃣ Fetch assignment marks (including last_login)
                # -------------------------------
                assignment_query = """
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,
                        d.department_name,
                        u.last_login,  -- ✅ Added
                        SUM(am.marks_obtained) AS total_assignment_marks,
                        SUM(am.max_marks) AS total_assignment_max
                    FROM assignment_marks am
                    JOIN users u ON am.student_id = u.user_id
                    JOIN departments d ON u.department_id = d.department_id
                """

                if department_id:
                    assignment_query += " WHERE u.department_id = %s"
                    params.append(department_id)

                assignment_query += " GROUP BY u.user_id, u.username, d.department_name, u.last_login"
                cursor.execute(assignment_query, tuple(params))
                assignment_data = cursor.fetchall()

                # -------------------------------
                # 2️⃣ Fetch topic averages
                # -------------------------------
                topic_query = """
                    SELECT 
                        u.user_id,
                        ROUND(SUM(stm.marks_obtained) / SUM(stm.max_marks) * 100, 2) AS topic_average_percentage
                    FROM sub_topic_marks stm
                    JOIN users u ON stm.student_id = u.user_id
                """

                if department_id:
                    topic_query += " WHERE u.department_id = %s"

                topic_query += " GROUP BY u.user_id"
                cursor.execute(topic_query, (department_id,) if department_id else ())
                topic_data = {
                    row["user_id"]: row["topic_average_percentage"] for row in cursor.fetchall()
                }

                # -------------------------------
                # 3️⃣ Fetch total session durations
                # -------------------------------
                session_query = """
                    SELECT 
                        u.user_id,
                        COALESCE(SUM(us.duration_seconds), 0) AS total_duration_seconds
                    FROM user_sessions us
                    JOIN users u ON us.user_id = u.user_id
                """

                if department_id:
                    session_query += " WHERE u.department_id = %s"

                session_query += " GROUP BY u.user_id"
                cursor.execute(session_query, (department_id,) if department_id else ())
                session_data = {
                    row["user_id"]: row["total_duration_seconds"] for row in cursor.fetchall()
                }

                # -------------------------------
                # 4️⃣ Combine all data
                # -------------------------------
                overall_report = []
                for row in assignment_data:
                    user_id = row["user_id"]
                    total_marks = row["total_assignment_marks"] or 0
                    max_marks = row["total_assignment_max"] or 0
                    percentage = round((total_marks / max_marks) * 100, 2) if max_marks > 0 else 0

                    topic_avg = topic_data.get(user_id, 0)
                    total_seconds = int(session_data.get(user_id, 0))
                    total_hours = round(total_seconds / 3600, 2)

                    # ✅ Format last login from users table
                    last_login = (
                        row["last_login"].strftime("%d/%m/%y - %I:%M %p")
                        if row["last_login"]
                        else "No Login"
                    )

                    overall_report.append({
                        "student_name": row["student_name"],
                        "full_name": row["full_name"],
                        "department_name": row["department_name"],
                        "assignment_percentage": percentage,
                        "topic_average_percentage": topic_avg,
                        "total_session_hours": total_hours,
                        "last_login": last_login  # ✅ included
                    })

                # Sort by performance
                overall_report.sort(key=lambda x: x["assignment_percentage"], reverse=True)

                return {
                    "status": "success",
                    "count": len(overall_report),
                    "data": overall_report
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching overall report: {str(e)}"
        )
