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

                # Step 1: Check if the college already exists
                cursor.execute(
                    "SELECT college_id FROM colleges WHERE name = %s AND college_address = %s",
                    (data.name, data.address)
                )
                existing_college = cursor.fetchone()

                if existing_college:
                    college_id = existing_college["college_id"]
                    college_action = "existing"
                else:
                    # Create a new college
                    cursor.execute(
                        """
                        INSERT INTO colleges (name, college_address, created_at)
                        VALUES (%s, %s, %s)
                        """,
                        (data.name, data.address, datetime.now())
                    )
                    college_id = cursor.lastrowid
                    college_action = "created"

                created_depts = []

                # Step 2: Process each department
                for dept_name in data.departments:
                    # Check if department already exists in master table
                    cursor.execute(
                        "SELECT department_id FROM departments WHERE department_name = %s",
                        (dept_name,)
                    )
                    dept = cursor.fetchone()

                    if dept:
                        department_id = dept["department_id"]
                        created_depts.append(f"{dept_name} (exists)")
                    else:
                        # Create new department
                        dept_code = dept_name[:4].upper() + str(int(datetime.timestamp(datetime.now())))
                        cursor.execute(
                            """
                            INSERT INTO departments (department_name, department_code, is_active, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s)
                            """,
                            (dept_name, dept_code, True, datetime.now(), datetime.now())
                        )
                        department_id = cursor.lastrowid
                        created_depts.append(f"{dept_name} (created)")

                    # Step 3: Map department to college (avoid duplicates)
                    cursor.execute(
                        """
                        INSERT IGNORE INTO college_departments
                        (college_id, department_id, created_at, updated_at)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (college_id, department_id, datetime.now(), datetime.now())
                    )

                conn.commit()

                return {
                    "status": "success",
                    "message": f"College '{data.name}' ({college_action}) onboarded successfully with {len(created_depts)} departments",
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



@router.get("/get-all")
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
    

@router.get("/{college_id}/departments")
async def get_college_departments(college_id: int):
    """Fetch departments associated with a specific college"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT d.department_id, d.department_name, d.department_code
                    FROM departments d
                    JOIN college_departments cd ON d.department_id = cd.department_id
                    WHERE cd.college_id = %s
                    ORDER BY d.department_name
                """
                cursor.execute(query, (college_id,))
                departments = cursor.fetchall()
                return {
                    "status": "success",
                    "count": len(departments),
                    "data": departments
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching departments for college {college_id}: {str(e)}")    