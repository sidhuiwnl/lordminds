from fastapi import APIRouter, Form, HTTPException
from  config.database import get_db
from pydantic import BaseModel,field_validator
from typing import List, Optional
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
    """Fetch all ACTIVE colleges"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT *
                    FROM colleges
                    WHERE is_active = 1
                    ORDER BY name
                """)
                
                colleges = cursor.fetchall()

                return {
                    "status": "success",
                    "count": len(colleges),
                    "data": colleges
                }

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching colleges: {str(e)}"
        )



@router.get("/{college_id}/departments")
async def get_college_departments(college_id: int):
    """Fetch ACTIVE departments for a specific college"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT d.department_id, d.department_name, d.department_code
                    FROM departments d
                    JOIN college_departments cd ON d.department_id = cd.department_id
                    WHERE cd.college_id = %s
                      AND d.is_active = 1
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
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching departments for college {college_id}: {str(e)}"
        )




    
@router.get("/get-all-with-department")
async def get_colleges():
    """Fetch all active colleges with their departments (via college_departments table)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Fetch only active colleges
                cursor.execute("SELECT * FROM colleges WHERE is_active = 1 ORDER BY name")
                colleges = cursor.fetchall()

                # Fetch college-department relationships only for active colleges
                cursor.execute("""
                    SELECT 
                        cd.college_id,
                        d.department_id AS department_id,
                        d.department_name
                    FROM college_departments cd
                    JOIN departments d ON cd.department_id = d.department_id
                    JOIN colleges c ON cd.college_id = c.college_id
                    WHERE c.is_active = 1
                    ORDER BY d.department_name
                """)
                college_departments = cursor.fetchall()

                # Group departments by college_id
                dept_map = {}
                for row in college_departments:
                    college_id = row["college_id"]
                    if college_id not in dept_map:
                        dept_map[college_id] = []
                    dept_map[college_id].append({
                        "department_id": row["department_id"],
                        "name": row["department_name"]
                    })

                # Attach departments to each college
                for college in colleges:
                    college_id = college["college_id"]
                    college["departments"] = dept_map.get(college_id, [])

                return {
                    "status": "success",
                    "count": len(colleges),
                    "data": colleges
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching colleges: {str(e)}")
    




@router.put("/update/{college_id}")
async def update_college(
    college_id: int,
    name: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    department_ids: Optional[str] = Form(None)  # e.g. "1,2,3"
):
    """
    Update college name/location and optionally add new departments (without removing existing ones).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # --- 1️⃣ Update basic info ---
                fields = []
                values = []
                if name:
                    fields.append("name = %s")
                    values.append(name)
                if location:
                    fields.append("location = %s")
                    values.append(location)

                if fields:
                    values.append(college_id)
                    query = f"UPDATE colleges SET {', '.join(fields)} WHERE college_id = %s"
                    cursor.execute(query, values)
                    conn.commit()

                # --- 2️⃣ Add new departments (no overwrite) ---
                if department_ids:
                    dept_list = [int(d.strip()) for d in department_ids.split(",") if d.strip().isdigit()]

                    for dept_id in dept_list:
                        # Only add if not already exists
                        cursor.execute("""
                            SELECT 1 FROM college_departments
                            WHERE college_id = %s AND department_id = %s
                        """, (college_id, dept_id))
                        existing = cursor.fetchone()

                        if not existing:
                            cursor.execute("""
                                INSERT INTO college_departments (college_id, department_id)
                                VALUES (%s, %s)
                            """, (college_id, dept_id))
                    conn.commit()

                # --- 3️⃣ Fetch updated college ---
                cursor.execute("SELECT * FROM colleges WHERE college_id = %s", (college_id,))
                updated_college = cursor.fetchone()

                if not updated_college:
                    raise HTTPException(status_code=404, detail="College not found")

                return {
                    "status": "success",
                    "message": "College updated successfully",
                    "updated_college": updated_college
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating college: {str(e)}")
  
    

    
@router.delete("/delete/{college_id}")
async def delete_college(college_id: int):
    """Soft delete a college by setting is_active = 0"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Soft delete by setting is_active = 0 instead of actual deletion
                cursor.execute("UPDATE colleges SET is_active = 0 WHERE college_id = %s", (college_id,))
                conn.commit()

                if cursor.rowcount == 0:
                    raise HTTPException(status_code=404, detail="College not found")

                return {"status": "success", "message": "College soft deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting college: {str(e)}")