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
    """
    Onboard a new college and create college-specific departments
    """
    conn = None
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Step 1: Check if the college already exists
                cursor.execute("""
                    SELECT college_id FROM colleges 
                    WHERE name = %s AND college_address = %s
                """, (data.name, data.address))

                existing = cursor.fetchone()

                if existing:
                    college_id = existing["college_id"]
                    college_action = "existing"
                else:
                    cursor.execute("""
                        INSERT INTO colleges (name, college_address, created_at)
                        VALUES (%s, %s, NOW())
                    """, (data.name, data.address))
                    
                    college_id = cursor.lastrowid
                    college_action = "created"

                created_depts = []
                skipped = []

                # Step 2: Create department PER college
                for dept in data.departments:

                    # Check if department already exists for this college
                    cursor.execute("""
                        SELECT department_id FROM departments 
                        WHERE department_name = %s AND college_id = %s
                    """, (dept, college_id))

                    exists = cursor.fetchone()

                    if exists:
                        skipped.append(dept)
                        continue

                    dept_code = dept[:4].upper()

                    cursor.execute("""
                        INSERT INTO departments 
                        (department_name, department_code, college_id, is_active, created_at, updated_at)
                        VALUES (%s, %s, %s, 1, NOW(), NOW())
                    """, (dept, dept_code, college_id))

                    created_depts.append(dept)

                conn.commit()

                return {
                    "status": "success",
                    "message": f"College '{data.name}' onboarded. Created {len(created_depts)} departments.",
                    "college_id": college_id,
                    "created_departments": created_depts,
                    "existing_departments": skipped
                }

    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))



def generate_department_code(dept_name: str) -> str:
    """Generate a department code based on department name"""
    dept_prefix = dept_name[:4].upper().strip()
    timestamp_suffix = str(int(datetime.now().timestamp()))[-4:]
    return f"{dept_prefix}{timestamp_suffix}"






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
                    SELECT department_id, department_name, department_code
                    FROM departments
                    WHERE college_id = %s
                      AND is_active = 1
                    ORDER BY department_name;
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



@router.get("/{college_id}/departments/{department_id}/topics")
async def get_topics_for_college_department(college_id: int, department_id: int):
    """
    Fetch topics that belong to a specific college + department.
    Works with NEW model where topics contain college_id and department_id.
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
                        t.created_at
                    FROM topics t
                    WHERE t.college_id = %s
                      AND t.department_id = %s
                      AND t.is_active = 1
                    ORDER BY t.topic_name
                """

                cursor.execute(query, (college_id, department_id))
                topics = cursor.fetchall()

                return {
                    "status": "success",
                    "college_id": college_id,
                    "department_id": department_id,
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topics for college {college_id}, department {department_id}: {str(e)}"
        )



    
@router.get("/get-all-with-department")
async def get_colleges():
    """Fetch all active colleges with their own departments"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # Fetch active colleges
                cursor.execute("""
                    SELECT college_id, name, college_address, created_at
                    FROM colleges
                    WHERE is_active = 1
                    ORDER BY name;
                """)
                colleges = cursor.fetchall()

                # Fetch departments directly linked to each college
                cursor.execute("""
                    SELECT 
                        department_id,
                        department_name,
                        college_id
                    FROM departments
                    WHERE is_active = 1
                    ORDER BY department_name;
                """)
                departments = cursor.fetchall()

                # Group departments by their college_id
                dept_map = {}
                for row in departments:
                    cid = row["college_id"]
                    if cid not in dept_map:
                        dept_map[cid] = []

                    dept_map[cid].append({
                        "department_id": row["department_id"],
                        "name": row["department_name"],
                    })

                # Attach departments to each college
                for college in colleges:
                    cid = college["college_id"]
                    college["departments"] = dept_map.get(cid, [])

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




@router.put("/update/{college_id}")
async def update_college(
    college_id: int,
    name: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    department_names: Optional[str] = Form(None)  # "CSE, IT, ECE"
):
    """
    Update college info and optionally add NEW departments
    scoped strictly to this college.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Verify college exists
                cursor.execute(
                    "SELECT college_id FROM colleges WHERE college_id = %s AND is_active = 1",
                    (college_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="College not found")

                # 2️⃣ Update college fields
                fields = []
                values = []

                if name:
                    fields.append("name = %s")
                    values.append(name)

                if address:
                    fields.append("college_address = %s")
                    values.append(address)

                if fields:
                    values.append(college_id)
                    cursor.execute(
                        f"UPDATE colleges SET {', '.join(fields)} WHERE college_id = %s",
                        values
                    )

                # 3️⃣ Add NEW departments for this college
                added_departments = []

                if department_names:
                    dept_list = [d.strip() for d in department_names.split(",") if d.strip()]

                    for dept_name in dept_list:
                        # Check if department already exists FOR THIS COLLEGE
                        cursor.execute("""
                            SELECT department_id
                            FROM departments
                            WHERE department_name = %s
                              AND college_id = %s
                              AND is_active = 1
                        """, (dept_name, college_id))

                        if cursor.fetchone():
                            continue  # already exists

                        dept_code = generate_department_code(dept_name)

                        cursor.execute("""
                            INSERT INTO departments (
                                department_name,
                                department_code,
                                college_id,
                                is_active,
                                created_at,
                                updated_at
                            )
                            VALUES (%s, %s, %s, 1, NOW(), NOW())
                        """, (dept_name, dept_code, college_id))

                        added_departments.append(dept_name)

                conn.commit()

                # 4️⃣ Fetch updated college + departments
                cursor.execute("""
                    SELECT 
                        c.college_id,
                        c.name,
                        c.college_address,
                        GROUP_CONCAT(d.department_name ORDER BY d.department_name) AS departments
                    FROM colleges c
                    LEFT JOIN departments d
                        ON d.college_id = c.college_id
                       AND d.is_active = 1
                    WHERE c.college_id = %s
                    GROUP BY c.college_id
                """, (college_id,))

                updated_college = cursor.fetchone()

                return {
                    "status": "success",
                    "message": "College updated successfully",
                    "added_departments": added_departments,
                    "updated_college": updated_college
                }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating college: {str(e)}"
        )


def generate_department_code(dept_name: str) -> str:
    """Generate a department code based on department name"""
    dept_prefix = dept_name[:4].upper().strip()
    timestamp_suffix = str(int(datetime.now().timestamp()))[-4:]
    return f"{dept_prefix}{timestamp_suffix}"
    

    
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