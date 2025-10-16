from fastapi import APIRouter, HTTPException
from  config.database import get_db
from pydantic import BaseModel,field_validator
from typing import List
from datetime import datetime

router = APIRouter()



class CollegeOnboard(BaseModel):
    name: str
    address: str
    departments: List[str]

    @field_validator('departments')
    @classmethod
    def validate_departments(cls, v):
        if not v:
            raise ValueError('At least one department is required')
        return v

@router.post("/onboard")
async def onboard_college(data: CollegeOnboard):
    """Onboard a new college with address and associated departments"""
    conn = None
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Step 1: Insert college and get ID
                college_query = """
                    INSERT INTO colleges (name, college_address, created_at)
                    VALUES (%s, %s, %s)
                """
                cursor.execute(college_query, (data.name, data.address, datetime.now()))
                college_id = cursor.lastrowid

                created_depts = []

                for dept_name in data.departments:
                    # Step 2: Check if department exists in master table
                    cursor.execute(
                        "SELECT department_id FROM departments WHERE department_name = %s",
                        (dept_name,)
                    )
                    dept = cursor.fetchone()

                    if dept:
                        department_id = dept["department_id"]
                        created_depts.append(f"{dept_name} (exists)")
                    else:
                        # Create department in master table
                        dept_code = dept_name[:4].upper() + str(int(datetime.timestamp(datetime.now())))  # unique code
                        dept_query = """
                            INSERT INTO departments (department_name, department_code, is_active, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s)
                        """
                        cursor.execute(dept_query, (dept_name, dept_code, True, datetime.now(), datetime.now()))
                        department_id = cursor.lastrowid
                        created_depts.append(f"{dept_name} (created)")

                    # Step 3: Map department to college
                    cursor.execute(
                        "INSERT IGNORE INTO college_departments (college_id, department_id, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                        (college_id, department_id, datetime.now(), datetime.now())
                    )

                conn.commit()

                return {
                    "status": "success",
                    "message": f"College '{data.name}' onboarded successfully with {len(created_depts)} departments",
                    "data": {
                        "college_id": college_id,
                        "college_name": data.name,
                        "address": data.address,
                        "departments": created_depts
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
        raise HTTPException(status_code=500, detail=f"Error onboarding college: {str(e)}")



@router.get("/")
async def get_colleges():
    """Fetch all colleges"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM colleges ORDER BY name")
                colleges = cursor.fetchall()
                return {
                    "status": "success",
                    "count": len(colleges),
                    "data": colleges
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching colleges: {str(e)}")