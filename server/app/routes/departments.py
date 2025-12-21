from fastapi import APIRouter, HTTPException, Form
from config.database import get_db

router = APIRouter()

@router.get("/get-departments")
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



@router.post("/create")
async def create_department(
    department_name: str = Form(...),
    department_code: str = Form(...),
    
):
    """Create a new department (without linking to a college)"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                insert_query = """
                    INSERT INTO departments (department_name, department_code, created_at, updated_at)
                    VALUES (%s, %s,NOW(), NOW())
                """
                
                cursor.execute(insert_query, (
                    department_name,
                    department_code,
                    
                ))
                conn.commit()

                return {
                    "status": "success",
                    "message": "Department created successfully"
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating department: {str(e)}")

 
    
@router.get("/{department_id}/topics")
async def get_department_topics(department_id: int):
    """
    Fetch topics assigned to a department
    (NEW schema using topic_college_department)
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate department
                cursor.execute("""
                    SELECT department_name
                    FROM departments
                    WHERE department_id = %s
                      AND is_active = 1
                """, (department_id,))

                dept = cursor.fetchone()
                if not dept:
                    raise HTTPException(
                        status_code=404,
                        detail="Department not found or inactive."
                    )

                # 2️⃣ Fetch assigned topics
                cursor.execute("""
                    SELECT DISTINCT
                        t.topic_id,
                        t.topic_name,
                        t.created_at
                    FROM topic_college_department tcd

                    JOIN topics t
                        ON t.topic_id = tcd.topic_id
                       AND t.is_active = 1

                    WHERE tcd.department_id = %s
                      AND tcd.is_active = 1

                    ORDER BY t.topic_name ASC
                """, (department_id,))

                topics = cursor.fetchall()

                return {
                    "status": "success",
                    "department_id": department_id,
                    "department_name": dept["department_name"],
                    "count": len(topics),
                    "data": topics
                }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topics: {str(e)}"
        )
