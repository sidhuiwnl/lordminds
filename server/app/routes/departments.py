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
    """Fetch topics for a specific department"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT t.*
                    FROM topics t
                    JOIN departments d ON t.department_id = d.department_id
                    WHERE d.department_id = %s
                    ORDER BY t.topic_name
                """
                cursor.execute(query, (department_id,))
                topics = cursor.fetchall()
                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics: {str(e)}")