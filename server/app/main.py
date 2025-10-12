from fastapi import FastAPI,HTTPException,Form,File,UploadFile
from config.database import get_db
import json
from datetime import datetime
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="LordMind API",
    description="Educational Management System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():

    return {
        "message": "API is connected and running!",
        "status": "success",
        "version": "1.0.0"
    }


@app.get("/db")
async def get_question_types():

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM question_type")
                question_types = cursor.fetchall()

                return {
                    "status": "success",
                    "message": "Data fetched successfully",
                    "total_records": len(question_types),
                    "data": question_types
                }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

@app.post("/assignments/upload", status_code=201)
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




@app.get("/assignments/")
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




@app.post("/tests/create", status_code=201)
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


@app.post("/overviews/upload", status_code=201)
async def upload_overview(
    department_id: int = Form(...),
    topic_name: str = Form(...),
    sub_topic_name: str = Form(...),
    no_of_sub_topics: int = Form(...),
    video_link: str = Form(None),  # Optional
    file_name : str = Form(None), # Optional - filename from frontend
    overview_content: str = Form(None)  # Optional - longtext from frontend
):
    """
    Upload an overview with video link and/or document content.
    Steps:
    1. Validate department exists
    2. Create or get topic
    3. Create sub-topic with video link and document content
    """

    # ✅ Validate at least one content type is provided
    if not video_link and not overview_content:
        raise HTTPException(
            status_code=400, 
            detail="At least one of video_link or overview_content must be provided."
        )

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Verify department exists
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id = %s",
                    (department_id,)
                )
                dept = cursor.fetchone()
                if not dept:
                    raise HTTPException(status_code=400, detail="Department not found")

                # 2️⃣ Check if topic exists, if not create it
                cursor.execute(
                    """SELECT topic_id FROM topics 
                       WHERE department_id = %s AND topic_name = %s AND is_active = TRUE""",
                    (department_id, topic_name)
                )
                topic = cursor.fetchone()
                
                if topic:
                    topic_id = topic['topic_id']
                    # Update total_sub_topics if needed
                    cursor.execute(
                        """UPDATE topics 
                           SET total_sub_topics = %s, updated_at = NOW()
                           WHERE topic_id = %s""",
                        (no_of_sub_topics, topic_id)
                    )
                else:
                    # Create new topic
                    insert_topic = """
                        INSERT INTO topics
                        (department_id, topic_name, total_sub_topics, created_at, updated_at)
                        VALUES (%s, %s, %s, NOW(), NOW())
                    """
                    cursor.execute(insert_topic, (department_id, topic_name, no_of_sub_topics))
                    topic_id = cursor.lastrowid

                # 3️⃣ Get the next sub_topic_order for this topic
                cursor.execute(
                    """SELECT COALESCE(MAX(sub_topic_order), 0) + 1 as next_order
                       FROM sub_topics WHERE topic_id = %s""",
                    (topic_id,)
                )
                next_order = cursor.fetchone()['next_order']

                # 4️⃣ Create sub-topic
                insert_sub_topic = """
                    INSERT INTO sub_topics
                    (topic_id, sub_topic_name, sub_topic_order, overview_video_url,file_name, 
                     overview_content, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                cursor.execute(insert_sub_topic, (
                    topic_id,
                    sub_topic_name,
                    next_order,
                    video_link,
                    file_name,
                    overview_content
                ))
                sub_topic_id = cursor.lastrowid

                conn.commit()

                return {
                    "status": "success",
                    "message": "Overview created successfully.",
                    "topic_id": topic_id,
                    "sub_topic_id": sub_topic_id,
                    "sub_topic_order": next_order
                }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating overview: {str(e)}")



@app.get("/overviews")
async def get_all_overviews(
    department_id: int = None,
    topic_id: int = None,
    is_active: bool = True
):
    """
    Retrieve all overviews with filtering options.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        t.topic_number,
                        t.total_sub_topics,
                        t.department_id,
                        d.department_name,
                        st.sub_topic_id,
                        st.sub_topic_name,
                        st.sub_topic_order,
                        st.overview_video_url,
                        st.file_name,
                        CASE 
                            WHEN st.overview_content IS NOT NULL 
                            THEN TRUE 
                            ELSE FALSE 
                        END as has_document,
                        st.is_active as sub_topic_active,
                        st.created_at as sub_topic_created_at
                    FROM topics t
                    INNER JOIN departments d ON t.department_id = d.department_id
                    LEFT JOIN sub_topics st ON t.topic_id = st.topic_id
                    WHERE t.is_active = %s
                """
                params = [is_active]

                if department_id:
                    query += " AND t.department_id = %s"
                    params.append(department_id)

                if topic_id:
                    query += " AND t.topic_id = %s"
                    params.append(topic_id)

                query += " ORDER BY t.topic_id, st.sub_topic_order"

                cursor.execute(query, params)
                results = cursor.fetchall()

                # Group by topics
                topics_dict = {}
                for row in results:
                    topic_id = row['topic_id']
                    
                    if topic_id not in topics_dict:
                        topics_dict[topic_id] = {
                            "topic_id": topic_id,
                            "topic_name": row['topic_name'],
                            "topic_number": row['topic_number'],
                            "total_sub_topics": row['total_sub_topics'],
                            "department_id": row['department_id'],
                            "department_name": row['department_name'],
                            "sub_topics": []
                        }
                    
                    if row['sub_topic_id']:
                        topics_dict[topic_id]['sub_topics'].append({
                            "sub_topic_id": row['sub_topic_id'],
                            "sub_topic_name": row['sub_topic_name'],
                            "sub_topic_order": row['sub_topic_order'],
                            "overview_video_url": row['overview_video_url'],
                            "file_name": row['file_name'],
                            "has_document": row['has_document'],
                            "is_active": row['sub_topic_active'],
                            "created_at": row['sub_topic_created_at']
                        })

                return {
                    "status": "success",
                    "count": len(topics_dict),
                    "data": list(topics_dict.values())
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overviews: {str(e)}")
    

@app.get("/departments")
async def get_departments():
    """Fetch all departments"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM departments ORDER BY department_name")
                departments = cursor.fetchall()
                return {
                    "status": "success",
                    "count": len(departments),
                    "data": departments
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching departments: {str(e)}")



@app.get("/questions/")
async def get_questions(assignment_id : int = None):
    """Get questions, optionally filtered by assignment_id"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                if assignment_id:
                    cursor.execute("""
                            SELECT * FROM questions 
                            WHERE assignment_id = %s
                            ORDER BY order_no
                        """, (assignment_id,))
                else:
                    cursor.execute("SELECT * FROM questions ORDER BY order_no")

                questions = cursor.fetchall()

                print(questions)

                # Parse JSON data
                for question in questions:
                    if question['question_data']:
                        question['question_data'] = json.loads(question['question_data'])

                return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/topic-subtopic")
async def get_topic_subtopic(department_id : int):
    """Fetch topics and their subtopics for a given department"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Fetch topics
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number 
                    FROM topics 
                    WHERE department_id = %s AND is_active = TRUE
                    ORDER BY topic_number
                """, (department_id,))
                topics = cursor.fetchall()

                # For each topic, fetch its subtopics
                for topic in topics:
                    cursor.execute("""
                        SELECT sub_topic_id, sub_topic_name, sub_topic_order, overview_video_url, file_name,
                               CASE 
                                   WHEN overview_content IS NOT NULL 
                                   THEN TRUE 
                                   ELSE FALSE 
                               END as has_document,
                               is_active, created_at
                        FROM sub_topics 
                        WHERE topic_id = %s AND is_active = TRUE
                        ORDER BY sub_topic_order
                    """, (topic['topic_id'],))
                    subtopics = cursor.fetchall()
                    topic['sub_topics'] = subtopics

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")


@app.get("/get-topic-with-subtpics")
async def get_topic_with_subtopics():
    """Fetch all topics with their subtopics and question counts"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Fetch all topics
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number, department_id 
                    FROM topics 
                    WHERE is_active = TRUE
                    ORDER BY topic_number
                """)
                topics = cursor.fetchall()

                # For each topic, fetch its subtopics
                for topic in topics:
                    cursor.execute("""
                        SELECT sub_topic_id, sub_topic_name, sub_topic_order, overview_video_url, file_name,
                               CASE 
                                   WHEN overview_content IS NOT NULL 
                                   THEN TRUE 
                                   ELSE FALSE 
                               END as has_document,
                               is_active, created_at
                        FROM sub_topics 
                        WHERE topic_id = %s AND is_active = TRUE
                        ORDER BY sub_topic_order
                    """, (topic['topic_id'],))
                    subtopics = cursor.fetchall()
                    
                    # For each subtopic, fetch total questions count
                    for subtopic in subtopics:
                        cursor.execute("""
                            SELECT COUNT(*) as total_questions
                            FROM questions 
                            WHERE test_scope = 'sub_topic' AND reference_id = %s
                        """, (subtopic['sub_topic_id'],))
                        question_count = cursor.fetchone()
                        subtopic['total_questions'] = question_count['total_questions']
                    
                    topic['sub_topics'] = subtopics
                    
                    # Calculate total questions for the topic (sum across subtopics)
                    topic['total_questions'] = sum(st['total_questions'] for st in subtopics)

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)