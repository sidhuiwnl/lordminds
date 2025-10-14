from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import bcrypt
import pandas as pd
from io import BytesIO
from datetime import datetime

router = APIRouter()

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
    """Create a single user based on role type (manual entry for student/teacher/administrator)"""
    conn = None
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Step 1: Lookup college_id
                cursor.execute("SELECT college_id FROM colleges WHERE name = %s", (user_data.college_name,))
                college_result = cursor.fetchone()
                if not college_result:
                    raise HTTPException(status_code=400, detail=f"College '{user_data.college_name}' not found")
                college_id = college_result['college_id']

                # Step 2: Lookup department_id if applicable (FIX: Use department_name column)
                department_id = None
                if user_data.department_name:
                    cursor.execute(
                        "SELECT department_id FROM departments WHERE department_name = %s AND college_id = %s",
                        (user_data.department_name, college_id)
                    )
                    dept_result = cursor.fetchone()
                    if not dept_result:
                        raise HTTPException(status_code=400, detail=f"Department '{user_data.department_name}' not found in college '{user_data.college_name}'")
                    department_id = dept_result['department_id']

                # Step 3: Check username uniqueness
                cursor.execute("SELECT user_id FROM users WHERE username = %s", (user_data.username,))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail=f"Username '{user_data.username}' already exists")

                # Step 4: Get role_id
                role_id = ROLE_MAP.get(user_data.role)
                if not role_id:
                    raise HTTPException(status_code=400, detail=f"Invalid role: {user_data.role}")

                # Step 5: Hash password
                password_bytes = user_data.password.encode('utf-8')
                password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

                # Step 6: Insert user
                insert_query = """
                    INSERT INTO users (username, password_hash, full_name, college_id, department_id, role_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                cursor.execute(insert_query, (
                    user_data.username, password_hash, user_data.full_name,
                    college_id, department_id, role_id
                ))
                conn.commit()

                user_id = cursor.lastrowid
                return {
                    "status": "success",
                    "message": "User created successfully",
                    "data": {
                        "user_id": user_id,
                        "username": user_data.username,
                        "role": user_data.role
                    }
                }

    except HTTPException:
        raise
    except Exception as e:
        # Safe rollback to avoid InterfaceError
        if conn:
            try:
                conn.rollback()
            except:
                pass  # Ignore rollback errors
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")
    



@router.post("/bulk")
async def bulk_create_users(file: UploadFile = File(...), role: str = Form(...)):
    if role != 'student':
        raise HTTPException(status_code=400, detail="Bulk creation is only supported for 'student' role")

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
        # Updated INSERT query (removed email column)
        insert_query = """
            INSERT INTO users (username, password_hash, full_name, college_id, department_id, role_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        placeholder_count = insert_query.count('%s')  # Now 7
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

                        # Department lookup
                        cursor.execute("SELECT department_id FROM departments WHERE department_name = %s AND college_id = %s",
                                       (row['department_name'], college_id))
                        dept_res = cursor.fetchone()
                        if not dept_res:
                            errors.append(f"Row {idx+1}: Invalid dept '{row['department_name']}' for college")
                            continue
                        dept_id = dept_res['department_id']

                        # Username check
                        cursor.execute("SELECT user_id FROM users WHERE username = %s", (row['username'],))
                        if cursor.fetchone():
                            errors.append(f"Row {idx+1}: Duplicate username '{row['username']}'")
                            continue

                        # Hash password
                        password_hash = bcrypt.hashpw(str(row['password']).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

                        # Exact 6 args + datetime = 7
                        row_args = [
                            row['username'],
                            password_hash,
                            row['full_name'],
                            college_id,
                            dept_id,
                            role_id
                        ]
                        full_row = row_args + [datetime.now()]  # Append timestamp
                        if len(full_row) != placeholder_count:
                            errors.append(f"Row {idx+1}: Arg mismatch (got {len(full_row)}, expected {placeholder_count})")
                            continue
                        valid_rows.append(tuple(full_row))  # Ensure tuple

                    except Exception as row_err:
                        errors.append(f"Row {idx+1}: {str(row_err)}")

                # Temporarily comment for debugging (re-enable after)
                # if len(errors) > len(df) * 0.2:
                #     raise HTTPException(status_code=400, detail=f"Too many errors ({len(errors)}/{len(df)})")

                # Always attempt insert if valid rows exist
                if valid_rows:
                    conn.begin()
                    cursor.executemany(insert_query, valid_rows)
                    conn.commit()

                # Always return full errors for now
                return {
                    "status": "partial" if errors else "success",
                    "message": f"Processed {len(valid_rows)}/{len(df)} rows: {len(errors)} errors",
                    "count": len(valid_rows),
                    "errors": errors,  # Full list visible now
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