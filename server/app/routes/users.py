
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import bcrypt
import pandas as pd
from io import BytesIO
from datetime import datetime
from voice.voice_analyzer import VoiceAnalyzer
import shutil


router = APIRouter()
analyzer = VoiceAnalyzer()


@router.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyzer.analyze_audio(temp_path)
    return result



class UserCreate(BaseModel):
    role: str = Field(..., pattern=r'^(student|teacher|administrator)$')  # Updated to pattern (raw string for regex)
    college_name: str
    department_name: Optional[str] = None  # Required for student/teacher
    full_name: Optional[str] = None  # Required for student
    username: str
    password: str

    @field_validator('department_name', mode='before')  # v2: Use field_validator with mode
    @classmethod
    def validate_department(cls, v, info):
        if info.data.get('role') in ['student', 'teacher'] and not v:
            raise ValueError('department_name is required for student or teacher')
        return v

    @field_validator('full_name', mode='before')  # v2: Use field_validator with mode
    @classmethod
    def validate_full_name(cls, v, info):
        if info.data.get('role') == 'student' and not v:
            raise ValueError('full_name is required for student')
        return v



# Role mapping to role_id (assume roles table is populated)
ROLE_MAP = {
    'super_admin': 1,
    'admin': 2,
    'administrator': 3,
    'teacher': 4,
    'student': 5
}


@router.post("/")
async def create_user(user_data: UserCreate):
    """Create a single user based on role type"""
    conn = None
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Step 1: Lookup college_id
                cursor.execute("SELECT college_id FROM colleges WHERE name = %s", (user_data.college_name,))
                college_res = cursor.fetchone()
                if not college_res:
                    raise HTTPException(status_code=400, detail=f"College '{user_data.college_name}' not found")
                college_id = college_res['college_id']

                # Step 2: Lookup department_id via college_departments mapping
                department_id = None
                if user_data.department_name:
                    cursor.execute("""
                        SELECT d.department_id
                        FROM departments d
                        JOIN college_departments cd ON cd.department_id = d.department_id
                        WHERE d.department_name = %s AND cd.college_id = %s
                    """, (user_data.department_name, college_id))
                    dept_res = cursor.fetchone()
                    if not dept_res:
                        raise HTTPException(status_code=400, detail=f"Department '{user_data.department_name}' not found for college '{user_data.college_name}'")
                    department_id = dept_res['department_id']

                # Step 3: Check username uniqueness
                cursor.execute("SELECT user_id FROM users WHERE username = %s", (user_data.username,))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail=f"Username '{user_data.username}' already exists")

                # Step 4: Get role_id
                role_id = ROLE_MAP.get(user_data.role)
                if not role_id:
                    raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")

                # Step 5: Hash password
                password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

                # Step 6: Insert user
                cursor.execute("""
                    INSERT INTO users (username, password_hash, full_name, college_id, department_id, role_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, (user_data.username, password_hash, user_data.full_name, college_id, department_id, role_id))

                conn.commit()
                return {
                    "status": "success",
                    "message": "User created successfully",
                    "data": {
                        "username": user_data.username,
                        "role": user_data.role
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

    



@router.post("/bulk")
async def bulk_create_users(file: UploadFile = File(...), role: str = Form(...)):
    if role != 'student':
        raise HTTPException(status_code=400, detail="Bulk creation only supported for 'student' role")

    conn = None
    try:
        content = await file.read()
        df = pd.read_excel(BytesIO(content))

        required_cols = ['college_name', 'department_name', 'full_name', 'username', 'password']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail=f"Excel must contain: {', '.join(required_cols)}")

        role_id = ROLE_MAP.get(role)
        valid_rows = []
        errors = []

        insert_query = """
            INSERT INTO users (username, password_hash, full_name, college_id, department_id, role_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        placeholder_count = insert_query.count('%s')  # 7

        with get_db() as conn:
            with conn.cursor() as cursor:
                for idx, row in df.iterrows():
                    try:
                        # College lookup
                        cursor.execute("SELECT college_id FROM colleges WHERE name = %s", (row['college_name'],))
                        college_res = cursor.fetchone()
                        if not college_res:
                            errors.append(f"Row {idx+1}: Invalid college '{row['college_name']}'")
                            continue
                        college_id = college_res['college_id']

                        # Department lookup via college_departments
                        cursor.execute("""
                            SELECT d.department_id
                            FROM departments d
                            JOIN college_departments cd ON cd.department_id = d.department_id
                            WHERE d.department_name = %s AND cd.college_id = %s
                        """, (row['department_name'], college_id))
                        dept_res = cursor.fetchone()
                        if not dept_res:
                            errors.append(f"Row {idx+1}: Invalid dept '{row['department_name']}' for college")
                            continue
                        dept_id = dept_res['department_id']

                        # Username uniqueness
                        cursor.execute("SELECT user_id FROM users WHERE username = %s", (row['username'],))
                        if cursor.fetchone():
                            errors.append(f"Row {idx+1}: Duplicate username '{row['username']}'")
                            continue

                        # Hash password
                        password_hash = bcrypt.hashpw(str(row['password']).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

                        # Append row args + timestamp
                        full_row = (
                            row['username'],
                            password_hash,
                            row['full_name'],
                            college_id,
                            dept_id,
                            role_id,
                            datetime.now()
                        )
                        valid_rows.append(full_row)

                    except Exception as row_err:
                        errors.append(f"Row {idx+1}: {str(row_err)}")

                if valid_rows:
                    conn.begin()
                    cursor.executemany(insert_query, valid_rows)
                    conn.commit()

                return {
                    "status": "partial" if errors else "success",
                    "message": f"Processed {len(valid_rows)}/{len(df)} rows: {len(errors)} errors",
                    "count": len(valid_rows),
                    "errors": errors,
                    "data": {"processed_rows": len(valid_rows)}
                }

    except HTTPException:
        raise
    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Error in bulk user creation: {str(e)}")


@router.post("/login")
async def login(username: str = Form(...), password: str = Form(...)):
    """Authenticate user and return basic info"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT u.user_id, u.username, u.password_hash, r.name
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    WHERE u.username = %s
                """, (username,))
                user = cursor.fetchone()
                if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                    raise HTTPException(status_code=401, detail="Invalid username or password")

                return {
                    "status": "success",
                    "message": "Login successful",
                    "data": {
                        "user_id": user['user_id'],
                        "username": user['username'],
                        "role": user['name']
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")


@router.get("/{user_id}")
async def get_user(user_id: int):
    """Fetch user details by user_id"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * from users u
                    WHERE u.user_id = %s
                """, (user_id,))
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

                return {
                    "status": "success",
                    "data": user
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user {user_id}: {str(e)}")



@router.get("/colleges/{college_id}/departments/{department_id}/assignments")
async def get_assignments_by_department(college_id: int, department_id: int):
    """Fetch assignments for a given department within a specific college"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Ensure the department belongs to this college
                cursor.execute("""
                    SELECT 1
                    FROM college_departments
                    WHERE college_id = %s AND department_id = %s
                """, (college_id, department_id))
                
                relation = cursor.fetchone()
                if not relation:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Department {department_id} does not belong to College {college_id}"
                    )

                # Fetch assignments for that department
                cursor.execute("""
                    SELECT 
                        a.assignment_id,
                        a.assignment_topic,
                        a.description,
                        a.end_date,
                        d.department_name,
                        c.name AS college_name
                    FROM assignments a
                    JOIN departments d ON a.department_id = d.department_id
                    JOIN college_departments cd ON d.department_id = cd.department_id
                    JOIN colleges c ON cd.college_id = c.college_id
                    WHERE d.department_id = %s AND c.college_id = %s
                    ORDER BY a.end_date DESC
                """, (department_id, college_id))

                assignments = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(assignments),
                    "data": assignments
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching assignments for department {department_id} in college {college_id}: {str(e)}"
        )



@router.get("/colleges/{college_id}/departments/{department_id}/topics")
async def get_topics_by_college_and_department(college_id: int, department_id: int):
    """
    Fetch all active topics for a given department in a specific college.
    Includes department and topic details.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                  SELECT 
                    t.topic_id,
                    t.topic_name,
                    t.total_sub_topics,
                    d.department_name,
                    c.name AS college_name
                FROM topics t
                INNER JOIN departments d ON t.department_id = d.department_id
                INNER JOIN college_departments cd ON d.department_id = cd.department_id
                INNER JOIN colleges c ON cd.college_id = c.college_id
                WHERE d.department_id = %s
                AND c.college_id = %s
                AND t.is_active = 1
                """, (department_id, college_id))

                topics = cursor.fetchall()

               
                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching topics for department {department_id} in college {college_id}: {str(e)}"
        )
    
@router.get("/{topic_id}/subtopics")
async def get_subtopics_by_topic(topic_id: int):
    """Fetch all active subtopics for a given topic"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        sub_topic_id,
                        sub_topic_name,
                        sub_topic_order,
                        overview_video_url,
                        file_name,
                        CASE 
                            WHEN overview_content IS NOT NULL 
                            THEN TRUE 
                            ELSE FALSE 
                        END as has_document,
                        is_active,
                        created_at
                    FROM sub_topics 
                    WHERE topic_id = %s AND is_active = TRUE
                    ORDER BY sub_topic_order
                """, (topic_id,))
                subtopics = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(subtopics),
                    "data": subtopics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching subtopics for topic {topic_id}: {str(e)}")    
    

@router.get("/subtopic/{sub_topic_id}")
async def get_subtopic_details(sub_topic_id: int):
    """Fetch details of a specific subtopic by its ID"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        sub_topic_id,
                        sub_topic_name,
                        sub_topic_order,
                        overview_video_url,
                        overview_content,       
                        file_name,
                        CASE 
                            WHEN overview_content IS NOT NULL 
                            THEN TRUE 
                            ELSE FALSE 
                        END as has_document,
                        is_active,
                        created_at
                    FROM sub_topics 
                    WHERE sub_topic_id = %s AND is_active = TRUE
                """, (sub_topic_id,))
                subtopic = cursor.fetchone()

                if not subtopic:
                    raise HTTPException(status_code=404, detail=f"Subtopic with ID {sub_topic_id} not found")

                return {
                    "status": "success",
                    "data": subtopic
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching subtopic {sub_topic_id}: {str(e)}")  
      
    

@router.get("/subtopic/{sub_topic_id}/questions")
async def get_questions_by_subtopic(sub_topic_id: int):
    """Fetch all active questions for a given subtopic"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        question_id,
                        question_text,
                        question_data,
                        marks,
                        order_no,
                        created_at
                    FROM questions 
                    WHERE test_scope = 'sub_topic' 
                      AND reference_id = %s
                """, (sub_topic_id,))
                
                # Fetch all results directly as list of dicts
                questions = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(questions),
                    "data": questions
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching questions for subtopic {sub_topic_id}: {str(e)}"
        )