
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db
from pydantic import BaseModel, Field, field_validator,EmailStr
from typing import Optional, List
import bcrypt
import pandas as pd
from io import BytesIO
from datetime import datetime
from voice.voice_analyzer import VoiceAnalyzer
import shutil
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
import secrets
import glob
import time


router = APIRouter()
analyzer = VoiceAnalyzer()
executor = ThreadPoolExecutor(max_workers=4)

UPLOAD_DIR = "uploads/profile_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def cleanup_task():
    while True:
        try:
            for file in glob.glob("temp_uploads/voice_*"):
                if os.path.exists(file) and (time.time() - os.path.getctime(file) > 3600):  # 1 hour old
                    try:
                        os.remove(file)
                        print(f"Cleaned up old file: {file}")
                    except:
                        pass
            await asyncio.sleep(600)  # Every 10 minutes
        except Exception as e:
            print(f"Cleanup error: {e}")
            await asyncio.sleep(600)


@router.on_event("startup")
async def start_cleanup():
    asyncio.create_task(cleanup_task())
    print("Auto cleanup task started (every 10 minutes)")


@router.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    temp_path = None
    try:
        # 1. Validate content type & extension
        allowed_types = {'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/flac'}
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid audio format")

        # 2. Generate secure random filename (prevents collision + attacks)
        file_extension = ".wav"  # Force .wav — your frontend sends WAV
        secure_filename = f"voice_{secrets.token_hex(12)}{file_extension}"
        temp_path = os.path.join("temp_uploads", secure_filename)

        # Ensure temp directory exists
        os.makedirs("temp_uploads", exist_ok=True)

        # 3. Save file safely
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. File size limit
        file_size = os.path.getsize(temp_path)
        if file_size > 25 * 1024 * 1024:  # 25MB max (your recordings are tiny)
            raise HTTPException(status_code=413, detail="File too large (max 25MB)")

        # 5. Run analysis with TIMEOUT (CRITICAL!)
        loop = asyncio.get_event_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(executor, analyzer.analyze_audio, temp_path),
                timeout=15.0  # Max 15 seconds per audio
            )
        except asyncio.TimeoutError:
            raise HTTPException(status_code=408, detail="Audio processing timed out")

        return {
            "status": "success",
            "data": result,
            "message": "Voice analyzed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Analyze voice error: {e}")
        raise HTTPException(status_code=500, detail="Voice analysis failed")
    
    finally:
        # Always clean up — even on crash
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass  # Never crash on cleanup


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
        if info.data.get('role') in ['student'] and not v:
            raise ValueError('department_name is required for student')
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


@router.post("/create")
async def create_user(user_data: UserCreate):
    """Create a single user based on role type"""
    conn = None
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Lookup college_id
                cursor.execute("SELECT college_id FROM colleges WHERE name = %s AND is_active = 1",
                               (user_data.college_name,))
                college_res = cursor.fetchone()

                if not college_res:
                    raise HTTPException(
                        status_code=400,
                        detail=f"College '{user_data.college_name}' not found"
                    )

                college_id = college_res["college_id"]

                # 2️⃣ Lookup department_id directly from departments table (new schema)
                department_id = None
                if user_data.department_name:
                    cursor.execute("""
                        SELECT department_id 
                        FROM departments
                        WHERE department_name = %s
                          AND college_id = %s
                          AND is_active = 1
                    """, (user_data.department_name, college_id))

                    dept_res = cursor.fetchone()

                    if not dept_res:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Department '{user_data.department_name}' not found for college '{user_data.college_name}'"
                        )

                    department_id = dept_res["department_id"]

                # 3️⃣ Check username uniqueness
                cursor.execute("SELECT user_id FROM users WHERE username = %s", (user_data.username,))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail=f"Username '{user_data.username}' already exists")

                # 4️⃣ Get role_id
                role_id = ROLE_MAP.get(user_data.role)
                if not role_id:
                    raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")

                # 5️⃣ Hash password
                password_hash = bcrypt.hashpw(
                    user_data.password.encode("utf-8"), bcrypt.gensalt()
                ).decode("utf-8")

                # 6️⃣ Insert new user
                cursor.execute("""
                    INSERT INTO users 
                    (username, password_hash, full_name, college_id, department_id, role_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, (
                    user_data.username,
                    password_hash,
                    user_data.full_name,
                    college_id,
                    department_id,
                    role_id
                ))

                conn.commit()

                return {
                    "status": "success",
                    "message": "User created successfully",
                    "data": {
                        "username": user_data.username,
                        "role": user_data.role,
                        "college_id": college_id,
                        "department_id": department_id
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        if conn:
            try: conn.rollback()
            except: pass

        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

    



@router.post("/bulk")
async def bulk_create_users(
    file: UploadFile = File(...), 
    role: str = Form(...),
    college_name: str = Form(None),
    department_name: str = Form(None)
):
    if role != 'student':
        raise HTTPException(status_code=400, detail="Bulk creation only supported for 'student' role")

    if not college_name or not department_name:
        raise HTTPException(status_code=400, detail="College name and department name are required")

    conn = None
    try:
        # Read Excel content
        content = await file.read()
        df = pd.read_excel(BytesIO(content))

        # Required columns
        required_cols = ['full_name', 'username', 'password']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(
                status_code=400,
                detail=f"Excel must contain columns: {', '.join(required_cols)}"
            )

        role_id = ROLE_MAP.get(role)
        valid_rows = []
        errors = []

        insert_query = """
            INSERT INTO users (username, password_hash, full_name, college_id, department_id, role_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        with get_db() as conn:
            with conn.cursor() as cursor:

                # Fetch college_id
                cursor.execute("SELECT college_id FROM colleges WHERE name = %s", (college_name,))
                college_res = cursor.fetchone()
                if not college_res:
                    raise HTTPException(status_code=400, detail=f"Invalid college '{college_name}'")

                college_id = college_res['college_id']

                # Fetch department_id (Scenario 1 version: using college_id column)
                cursor.execute("""
                    SELECT department_id
                    FROM departments
                    WHERE department_name = %s AND college_id = %s
                """, (department_name, college_id))

                dept_res = cursor.fetchone()
                if not dept_res:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Department '{department_name}' does not belong to college '{college_name}'"
                    )

                dept_id = dept_res['department_id']

                # Process each row
                for idx, row in df.iterrows():
                    try:
                        # Skip fully empty rows
                        if pd.isna(row['full_name']) and pd.isna(row['username']) and pd.isna(row['password']):
                            continue

                        # Detect missing fields
                        missing_fields = []
                        if pd.isna(row['full_name']):
                            missing_fields.append('full_name')
                        if pd.isna(row['username']):
                            missing_fields.append('username')
                        if pd.isna(row['password']):
                            missing_fields.append('password')

                        if missing_fields:
                            errors.append(f"Row {idx+1}: Missing required fields - {', '.join(missing_fields)}")
                            continue

                        # Username uniqueness check
                        cursor.execute("SELECT user_id FROM users WHERE username = %s", (row['username'],))
                        if cursor.fetchone():
                            errors.append(f"Row {idx+1}: Duplicate username '{row['username']}'")
                            continue

                        # Hash password
                        password_hash = bcrypt.hashpw(
                            str(row['password']).encode('utf-8'),
                            bcrypt.gensalt()
                        ).decode('utf-8')

                        valid_rows.append((
                            row['username'],
                            password_hash,
                            row['full_name'],
                            college_id,
                            dept_id,
                            role_id,
                            datetime.now()
                        ))

                    except Exception as row_err:
                        errors.append(f"Row {idx+1}: {str(row_err)}")

                # Insert valid rows
                if valid_rows:
                    conn.begin()
                    cursor.executemany(insert_query, valid_rows)
                    conn.commit()

                # SINGLE return section
                if valid_rows:
                    return {
                        "status": "partial" if errors else "success",
                        "message": f"Created {len(valid_rows)} students in {college_name} - {department_name}. {len(errors)} errors.",
                        "created_count": len(valid_rows),
                        "errors": errors,
                        "data": {
                            "college": college_name,
                            "department": department_name,
                            "processed_rows": len(valid_rows)
                        }
                    }

                else:
                    return {
                        "status": "error",
                        "message": "No valid students were created",
                        "created_count": 0,
                        "errors": errors,
                        "data": None
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
    """
    Authenticate user and validate college / department
    based on role rules.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Fetch user + role + org status
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.username,
                        u.password_hash,
                        u.is_active AS user_active,
                        u.college_id,
                        u.department_id,

                        r.name AS role,

                        c.is_active AS college_active,
                        d.is_active AS department_active

                    FROM users u
                    JOIN roles r 
                        ON u.role_id = r.role_id

                    LEFT JOIN colleges c 
                        ON u.college_id = c.college_id

                    LEFT JOIN departments d 
                        ON u.department_id = d.department_id

                    WHERE u.username = %s
                """, (username,))

                user = cursor.fetchone()

                # 2️⃣ User exists?
                if not user:
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid username or password"
                    )

                # 3️⃣ User active?
                if user["user_active"] != 1:
                    raise HTTPException(
                        status_code=403,
                        detail="User is inactive. Contact admin."
                    )

                # 4️⃣ Password check
                if not bcrypt.checkpw(
                    password.encode("utf-8"),
                    user["password_hash"].encode("utf-8")
                ):
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid username or password"
                    )

                role = user["role"].lower()

                # 5️⃣ College validation
                if role in ["administrator", "teacher", "student"]:
                    if not user["college_id"] or user["college_active"] != 1:
                        raise HTTPException(
                            status_code=403,
                            detail="Assigned college is inactive or missing."
                        )

                # 6️⃣ Department validation
                if role in ["teacher", "student"]:
                    if not user["department_id"] or user["department_active"] != 1:
                        raise HTTPException(
                            status_code=403,
                            detail="Assigned department is inactive or missing."
                        )

                # 7️⃣ Update last login
                now = datetime.now()
                cursor.execute(
                    "UPDATE users SET last_login = %s WHERE user_id = %s",
                    (now, user["user_id"])
                )
                conn.commit()

                # 8️⃣ Success response
                return {
                    "status": "success",
                    "message": "Login successful",
                    "data": {
                        "user_id": user["user_id"],
                        "username": user["username"],
                        "role": user["role"],
                        "last_login": now.strftime("%d/%m/%y - %I:%M %p")
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during login: {str(e)}"
        )



class CreateAdminUserRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    role: str  # "super_admin" or "admin"



def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")



@router.post("/create-admin")
async def create_superadmin_or_admin(payload: CreateAdminUserRequest):
    """
    Create Super Admin or Admin user
    """
    role_map = {
        "super_admin": 1,
        "admin": 2
    }

    if payload.role not in role_map:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Allowed: super_admin, admin"
        )

    role_id = role_map[payload.role]
    password_hash = hash_password(payload.password)

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Check duplicate username
                cursor.execute(
                    "SELECT user_id FROM users WHERE username = %s",
                    (payload.username,)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=409,
                        detail="Username already exists"
                    )

                cursor.execute(
                    """
                    INSERT INTO users (
                        username,
                        password_hash,
                        full_name,
                        email,
                        role_id,
                        is_active,
                        created_at,
                        updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
                    """,
                    (
                        payload.username,
                        password_hash,
                        payload.full_name,
                        payload.email,
                        role_id
                    )
                )

                conn.commit()

                return {
                    "status": "success",
                    "message": f"{payload.role.replace('_', ' ').title()} created successfully"
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating user: {str(e)}"
        )


@router.get("/{user_id}")
async def get_user(user_id: int):
    """Fetch user details by user_id (excluding deactivated users)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:  
                cursor.execute("""
                    SELECT 
                        user_id, username, full_name, created_at, updated_at, 
                        profile_image, college_id, department_id, is_active, role_id
                    FROM users 
                    WHERE user_id = %s AND is_active = 1
                """, (user_id,))
                
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail=f"Active user with ID {user_id} not found")

                return {
                    "status": "success",
                    "data": user
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user {user_id}: {str(e)}")




# @router.get("/colleges/{college_id}/departments/{department_id}/assignments")
# async def get_assignments_by_department(college_id: int, department_id: int):
#     """Fetch assignments for a given department within a specific college"""
#     try:
#         with get_db() as conn:
#             with conn.cursor() as cursor:
#                 # Ensure the department belongs to this college
#                 cursor.execute("""
#                     SELECT 1
#                     FROM college_departments
#                     WHERE college_id = %s AND department_id = %s
#                 """, (college_id, department_id))
                
#                 relation = cursor.fetchone()
#                 if not relation:
#                     raise HTTPException(
#                         status_code=404,
#                         detail=f"Department {department_id} does not belong to College {college_id}"
#                     )

#                 # Fetch assignments for that department
#                 cursor.execute("""
#                     SELECT 
#                         a.assignment_id,
#                         a.assignment_topic,
#                         a.description,
#                         a.end_date,
#                         d.department_name,
#                         c.name AS college_name
#                     FROM assignments a
#                     JOIN departments d ON a.department_id = d.department_id
#                     JOIN college_departments cd ON d.department_id = cd.department_id
#                     JOIN colleges c ON cd.college_id = c.college_id
#                     WHERE d.department_id = %s AND c.college_id = %s
#                     ORDER BY a.end_date DESC
#                 """, (department_id, college_id))

#                 assignments = cursor.fetchall()

#                 return {
#                     "status": "success",
#                     "count": len(assignments),
#                     "data": assignments
#                 }

#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error fetching assignments for department {department_id} in college {college_id}: {str(e)}"
#         )



@router.get("/colleges/{college_id}/departments/{department_id}/assignments")
async def get_assignments_by_department(
    college_id: int,
    department_id: int,
    student_id: int = None
):
    """Fetch assignments + submission + test completion status."""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate department belongs to this college
                cursor.execute("""
                    SELECT department_name
                    FROM departments
                    WHERE department_id = %s
                      AND college_id = %s
                      AND is_active = 1
                """, (department_id, college_id))

                department = cursor.fetchone()
                if not department:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Department {department_id} does not belong to College {college_id}"
                    )

                # 2️⃣ SQL for assignments + student submission + test completion
                query = """
                    SELECT 
                        a.assignment_id,
                        a.assignment_number,
                        a.assignment_topic,
                        a.description,
                        a.start_date,
                        a.end_date,
                        a.is_active,

                        d.department_name,
                        c.name AS college_name,

                        -- Time-based status
                        CASE 
                            WHEN a.is_active = 0 THEN 'inactive'
                            WHEN NOW() < a.start_date THEN 'upcoming'
                            WHEN a.end_date IS NULL THEN 'active'
                            WHEN NOW() > a.end_date THEN 'expired'
                            WHEN NOW() BETWEEN a.start_date AND a.end_date THEN 'active'
                            ELSE 'unknown'
                        END AS time_status,

                        -- Student submitted (assignment_marks)
                        CASE 
                            WHEN %s IS NOT NULL THEN
                                EXISTS (
                                    SELECT 1 
                                    FROM assignment_marks am 
                                    WHERE am.assignment_id = a.assignment_id
                                      AND am.student_id = %s
                                )
                            ELSE NULL
                        END AS student_has_submitted,

                        -- Student score
                        CASE 
                            WHEN %s IS NOT NULL THEN
                                (SELECT am.marks_obtained 
                                 FROM assignment_marks am 
                                 WHERE am.assignment_id = a.assignment_id
                                   AND am.student_id = %s
                                 LIMIT 1)
                            ELSE NULL
                        END AS student_marks_obtained,

                        -- Total submissions
                        (SELECT COUNT(*) 
                         FROM assignment_marks am
                         WHERE am.assignment_id = a.assignment_id
                        ) AS total_submissions,

                        -- ⭐ Test completed (student_test_attempts)
                        CASE 
                            WHEN %s IS NULL THEN NULL
                            ELSE (
                                SELECT 
                                    CASE WHEN is_completed = 1 THEN TRUE ELSE FALSE END
                                FROM student_test_attempts sta
                                WHERE sta.student_id = %s
                                  AND sta.test_scope = 'assignment'
                                  AND sta.reference_id = a.assignment_id
                                  AND sta.is_completed = TRUE
                                LIMIT 1
                            )
                        END AS test_completed

                    FROM assignments a
                    JOIN departments d ON a.department_id = d.department_id
                    JOIN colleges c ON a.college_id = c.college_id

                    WHERE a.college_id = %s
                      AND a.department_id = %s
                      AND d.is_active = 1
                      AND a.is_active = 1

                    ORDER BY 
                        CASE 
                            WHEN NOW() BETWEEN a.start_date AND a.end_date THEN 0
                            WHEN NOW() < a.start_date THEN 1
                            ELSE 2
                        END,
                        a.end_date ASC
                """

                cursor.execute(query, (
                    student_id, student_id,      # student_has_submitted
                    student_id, student_id,      # student_marks_obtained
                    student_id, student_id,      # test_completed
                    college_id, department_id    # filters
                ))

                assignments = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(assignments),
                    "department_name": department["department_name"],
                    "data": assignments
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching assignments: {str(e)}"
        )


@router.get("/{student_id}/topics-progress")
async def get_student_topic_progress(student_id: int):
    """
    Fetch topic-wise progress for a student
    using NEW schema (topic_college_department mapping).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate student + get college & department
                cursor.execute("""
                    SELECT college_id, department_id
                    FROM users
                    WHERE user_id = %s
                      AND is_active = 1
                """, (student_id,))
                user = cursor.fetchone()

                if not user:
                    raise HTTPException(
                        status_code=404,
                        detail="Student not found or inactive"
                    )

                college_id = user["college_id"]
                department_id = user["department_id"]

                # 2️⃣ Fetch topic progress via mapping table
                query = """
                    SELECT
                        t.topic_id,
                        t.topic_name,
                        t.total_sub_topics,

                        d.department_name,
                        c.name AS college_name,

                        COALESCE(stp.completed_sub_topics, 0) AS completed_sub_topics,
                        COALESCE(stp.total_sub_topics, t.total_sub_topics) AS total_sub_topics,
                        COALESCE(stp.progress_percent, 0) AS progress_percent,
                        COALESCE(stp.average_score, 0) AS average_score,
                        COALESCE(stp.status, 'not_started') AS status,
                        stp.last_updated

                    FROM topic_college_department tcd

                    JOIN topics t
                        ON t.topic_id = tcd.topic_id
                       AND t.is_active = 1

                    JOIN departments d
                        ON d.department_id = tcd.department_id
                       AND d.is_active = 1

                    JOIN colleges c
                        ON c.college_id = tcd.college_id
                       AND c.is_active = 1

                    LEFT JOIN student_topic_progress stp
                        ON stp.topic_id = t.topic_id
                       AND stp.student_id = %s

                    WHERE tcd.college_id = %s
                      AND tcd.department_id = %s
                      AND tcd.is_active = 1

                    ORDER BY t.topic_name
                """

                cursor.execute(query, (student_id, college_id, department_id))
                topics = cursor.fetchall() or []

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topic progress: {str(e)}"
        )



    

@router.get("/colleges/{college_id}/departments/{department_id}/topics")
async def get_topics_with_progress(college_id: int, department_id: int):
    """
    Fetch all active topics for a given college + department,
    including average progress and average score.
    Uses the new schema (topics have college_id + department_id).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate the department belongs to this college
                cursor.execute("""
                    SELECT department_name
                    FROM departments
                    WHERE department_id = %s
                      AND college_id = %s
                      AND is_active = 1
                """, (department_id, college_id))

                dept = cursor.fetchone()
                if not dept:
                    raise HTTPException(
                        status_code=404,
                        detail="Department not found under this college."
                    )

                # 2️⃣ Fetch topics with progress (new schema)
                query = """
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        t.total_sub_topics,
                        d.department_name,
                        c.name AS college_name,

                        ROUND(AVG(stp.progress_percent), 2) AS avg_progress_percent,
                        ROUND(AVG(stp.average_score), 2) AS avg_score

                    FROM topics t
                    JOIN departments d 
                        ON t.department_id = d.department_id
                    JOIN colleges c 
                        ON t.college_id = c.college_id

                    LEFT JOIN student_topic_progress stp
                        ON stp.topic_id = t.topic_id
                       AND stp.student_id IN (
                            SELECT user_id 
                            FROM users 
                            WHERE college_id = %s 
                              AND department_id = %s
                              AND is_active = 1
                        )

                    WHERE 
                        t.college_id = %s 
                        AND t.department_id = %s
                        AND t.is_active = 1
                        AND d.is_active = 1

                    GROUP BY 
                        t.topic_id,
                        t.topic_name,
                        t.total_sub_topics,
                        d.department_name,
                        c.name

                    ORDER BY t.topic_name ASC
                """

                cursor.execute(query, (
                    college_id, department_id,   # filter student progress
                    college_id, department_id    # filter topics
                ))

                topics = cursor.fetchall() or []

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topics with progress: {str(e)}"
        )



@router.get("/{topic_id}/subtopics")
async def get_subtopics_by_topic(topic_id: int):
    """Fetch all active subtopics for a given topic"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        s.sub_topic_id,
                        s.sub_topic_name,
                        s.sub_topic_order,
                        s.overview_video_url,
                        s.file_name,
                        CASE 
                            WHEN s.overview_content IS NOT NULL THEN TRUE 
                            ELSE FALSE 
                        END AS has_document,
                        s.is_active,
                        s.created_at
                    FROM topic_subtopic_map tsm
                    INNER JOIN sub_topics s 
                        ON tsm.sub_topic_id = s.sub_topic_id
                    INNER JOIN topics t 
                        ON tsm.topic_id = t.topic_id
                    WHERE t.topic_id = %s
                        AND s.is_active = TRUE
                    ORDER BY s.sub_topic_order
                """

                cursor.execute(query, (topic_id,))
                subtopics = cursor.fetchall() or []

                return {
                    "status": "success",
                    "count": len(subtopics),
                    "data": subtopics
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching subtopics for topic {topic_id}: {str(e)}"
        )
 
    

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
    
@router.get("/get/students")
async def get_all_students():
    """Fetch all ACTIVE students from ACTIVE colleges"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.username,
                        u.full_name,
                        c.name AS college_name,
                        d.department_name,
                        u.created_at
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    JOIN colleges c ON u.college_id = c.college_id
                    LEFT JOIN departments d ON u.department_id = d.department_id
                    WHERE r.name = 'student'
                      AND u.is_active = 1
                      AND c.is_active = 1  -- ADD THIS LINE
                    ORDER BY u.created_at DESC
                """)
                students = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(students),
                    "data": students
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching students: {str(e)}")
    


@router.get("/get/teachers")
async def get_all_teachers():
    """Fetch all users with the 'teacher' role"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.username,
                        u.full_name,
                        c.name AS college_name,
                        d.department_name,
                        u.created_at
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    JOIN colleges c ON u.college_id = c.college_id
                    LEFT JOIN departments d ON u.department_id = d.department_id
                    WHERE r.name = 'teacher'
                        AND u.is_active = 1
                    ORDER BY u.created_at DESC
                """)
                teachers = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(teachers),
                    "data": teachers
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teachers: {str(e)}")    
    
@router.get("/get/administrators")
async def get_all_administrators():
    """Fetch all users with the 'teacher' role"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.username,
                        u.full_name,
                        c.name AS college_name,
                        d.department_name,
                        u.created_at
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    JOIN colleges c ON u.college_id = c.college_id
                    LEFT JOIN departments d ON u.department_id = d.department_id
                    WHERE r.name = 'administrator'
                        AND u.is_active = 1
                    ORDER BY u.created_at DESC
                """)
                teachers = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(teachers),
                    "data": teachers
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching teachers: {str(e)}")
    



@router.get("/topicwise/testmarks/{student_id}")
async def get_topicwise_test_marks(student_id: int):
    """Fetch topic-wise test marks for an ACTIVE student"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # First verify student exists and is active
                cursor.execute("""
                    SELECT user_id, full_name 
                    FROM users 
                    WHERE user_id = %s AND role_id = 5 AND is_active = 1
                """, (student_id,))

                student = cursor.fetchone()

                if not student:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Active student with ID {student_id} not found"
                    )

                # Fetch topicwise marks
                cursor.execute("""
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        SUM(stm.marks_obtained) AS total_marks_obtained,
                        SUM(stm.max_marks) AS total_marks_possible
                    FROM sub_topic_marks stm
                    JOIN sub_topics st ON stm.sub_topic_id = st.sub_topic_id
                    JOIN topics t ON st.topic_id = t.topic_id
                    WHERE stm.student_id = %s
                    GROUP BY t.topic_id, t.topic_name
                """, (student_id,))
                
                topicwise_marks = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(topicwise_marks),
                    "data": topicwise_marks
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topic-wise test marks for student {student_id}: {str(e)}"
        )


@router.get("/assignmentmarks/{student_id}")
async def get_assignment_marks(student_id: int):
    """
    Fetch total assignment marks for an ACTIVE student
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Step 1 — Check if student exists and is active
                cursor.execute("""
                    SELECT user_id, full_name
                    FROM users
                    WHERE user_id = %s AND role_id = 5 AND is_active = 1
                """, (student_id,))
                
                student = cursor.fetchone()

                if not student:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Active student with ID {student_id} not found"
                    )

                # Step 2 — Fetch assignment marks
                cursor.execute("""
                    SELECT 
                        asg.assignment_topic,
                        SUM(a.marks_obtained) AS total_marks_obtained,
                        SUM(a.max_marks) AS total_max_marks,
                        MAX(a.graded_at) AS last_graded_at
                    FROM assignment_marks a
                    JOIN assignments asg ON a.assignment_id = asg.assignment_id
                    WHERE a.student_id = %s
                    GROUP BY asg.assignment_topic
                    ORDER BY last_graded_at DESC
                """, (student_id,))
                
                assignment_marks = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(assignment_marks),
                    "data": assignment_marks
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching assignment marks for student {student_id}: {str(e)}"
        )



@router.get("/totalduration/{user_id}")
async def get_total_duration(user_id: int):
    """
    Fetch total duration (in hours) spent by an ACTIVE student.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Step 1 — validate student is active
                cursor.execute("""
                    SELECT user_id, full_name 
                    FROM users 
                    WHERE user_id = %s AND role_id = 5 AND is_active = 1
                """, (user_id,))
                
                student = cursor.fetchone()

                if not student:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Active student with ID {user_id} not found"
                    )

                # Step 2 — fetch total duration for this active student
                cursor.execute("""
                    SELECT 
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,       
                        ROUND(SUM(us.duration_seconds) / 3600, 2) AS total_hours
                    FROM user_sessions us
                    JOIN users u ON us.user_id = u.user_id
                    WHERE u.user_id = %s
                    GROUP BY u.user_id, u.username;
                """, (user_id,))
                
                data = cursor.fetchone()
                
                if not data:
                    return {
                        "status": "success",
                        "message": "No sessions found",
                        "data": {}
                    }
                
                return {
                    "status": "success",
                    "data": data
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching total duration for user {user_id}: {str(e)}"
        )




@router.get("/overallreport/{user_id}")
async def get_overall_report(user_id: int):
    """
    Overall report for an ACTIVE student:
    - total subtopic marks
    - total assignment marks
    - total study hours
    - last login/logout
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Step 1 — validate active student
                cursor.execute("""
                    SELECT user_id, full_name 
                    FROM users
                    WHERE user_id = %s AND role_id = 5 AND is_active = 1
                """, (user_id,))
                
                student = cursor.fetchone()

                if not student:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Active student with ID {user_id} not found"
                    )

                # Step 2 — fetch overall aggregated report
                cursor.execute("""
                    SELECT
                        u.user_id,
                        u.username AS student_name,
                        u.full_name,
                        DATE_FORMAT(u.last_login, '%%d/%%m/%%y - %%l:%%i %%p') AS last_login,
                        DATE_FORMAT(u.last_logout, '%%d/%%m/%%y - %%l:%%i %%p') AS last_logout,

                        COALESCE(st.total_subtopic_marks, 0) AS total_subtopic_marks,
                        COALESCE(am.total_assignment_marks, 0) AS total_assignment_marks,
                        COALESCE(us.total_hours, 0) AS total_hours

                    FROM users u

                    LEFT JOIN (
                        SELECT student_id,
                               SUM(marks_obtained) AS total_subtopic_marks
                        FROM sub_topic_marks
                        GROUP BY student_id
                    ) st ON st.student_id = u.user_id

                    LEFT JOIN (
                        SELECT student_id,
                               SUM(marks_obtained) AS total_assignment_marks
                        FROM assignment_marks
                        GROUP BY student_id
                    ) am ON am.student_id = u.user_id

                    LEFT JOIN (
                        SELECT user_id,
                               ROUND(SUM(duration_seconds) / 3600, 2) AS total_hours
                        FROM user_sessions
                        GROUP BY user_id
                    ) us ON us.user_id = u.user_id

                    WHERE u.user_id = %s
                      AND u.role_id = 5
                      AND u.is_active = 1;
                """, (user_id,))

                row = cursor.fetchone()

                return {
                    "status": "success",
                    "data": {
                        "user_id": row["user_id"],
                        "student_name": row["student_name"],
                        "full_name": row["full_name"],
                        "last_login": row["last_login"] or "Never logged in",
                        "last_logout": row["last_logout"] or "Still logged in",
                        "total_subtopic_marks": row["total_subtopic_marks"],
                        "total_assignment_marks": row["total_assignment_marks"],
                        "total_hours": row["total_hours"]
                    }
                }

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching overall report: {str(e)}"
        )





@router.put("/{user_id}/add-image")
async def add_profile_image(user_id: int, file: UploadFile = File(...)):
    """Upload profile image for an ACTIVE user (like multer)"""
    try:
        # 1. Validate file extension
        allowed_extensions = {"jpg", "jpeg", "png", "webp"}
        file_ext = file.filename.split(".")[-1].lower()

        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # 2. Validate user exists and is active
        with get_db() as conn:
            with conn.cursor() as cursor:

                cursor.execute("""
                    SELECT user_id, full_name
                    FROM users
                    WHERE user_id = %s AND is_active = 1
                """, (user_id,))

                user = cursor.fetchone()

                if not user:
                    raise HTTPException(
                        status_code=404,
                        detail="Active user not found"
                    )

        # 3. Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"user_{user_id}_{timestamp}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # 4. Save file to disk
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # 5. Update database with relative path
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE users
                    SET profile_image = %s
                    WHERE user_id = %s
                """, (f"profile_images/{filename}", user_id))

                conn.commit()

        # 6. Return full URL
        file_url = f"/uploads/profile_images/{filename}"

        return {
            "status": "success",
            "message": "Profile image uploaded successfully",
            "file_url": file_url
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




@router.put("/logout/{user_id}")
async def user_logout(user_id: int):
    """
    Update the user's last logout time when they log out.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT user_id FROM users WHERE user_id = %s", (user_id,)
                )
                user = cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                # ✅ Update last_logout time
                cursor.execute(
                    "UPDATE users SET last_logout = %s WHERE user_id = %s",
                    (datetime.now(), user_id),
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"User {user_id} logged out successfully",
            "last_logout": datetime.now().strftime("%d/%m/%y - %I:%M %p"),
        }

    except Exception as e:
        print("❌ Logout error:", e)
        raise HTTPException(status_code=500, detail=f"Error logging out: {str(e)}")
    

class ChangePasswordRequest(BaseModel):
    new_password: str

@router.put("/{user_id}/change-password")
async def change_user_password(
    user_id: int,
    request: ChangePasswordRequest
):
    """Change user password (for admin/superadmin only)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Check if user exists
                cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
                user = cursor.fetchone()
                
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")
                
                # Validate password strength
                if len(request.new_password) < 6:
                    raise HTTPException(
                        status_code=400, 
                        detail="Password must be at least 6 characters long"
                    )
                
                # Hash the new password
                hashed_password = bcrypt.hashpw(
                    request.new_password.encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
                
                # Update password in database
                cursor.execute(
                    "UPDATE users SET password_hash = %s WHERE user_id = %s",
                    (hashed_password, user_id)
                )
                conn.commit()  # Fixed: use conn.commit() instead of db.commit()
                
                return {
                    "status": "success",
                    "message": "Password updated successfully"
                }
                
    except HTTPException:
        raise
    except Exception as e:
        # If using connection context manager, rollback is automatic on exception
        # But you can explicitly rollback if needed
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Error changing password: {str(e)}"
        )