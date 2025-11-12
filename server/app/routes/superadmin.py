from fastapi import APIRouter, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/get-superadmin-report")
async def get_superadmin_report():
    """
    Fetch Super Admin report:
    1️⃣ Total number of colleges (for pie chart)
    2️⃣ Total number of students (role_id = 5)
    3️⃣ Each topic → total number of students in departments mapped to that topic (for bar chart)
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Total Colleges
                cursor.execute("SELECT COUNT(*) AS total_colleges FROM colleges")
                total_colleges = cursor.fetchone()["total_colleges"]

                # 2️⃣ Total Students (role_id = 5)
                cursor.execute("SELECT COUNT(*) AS total_students FROM users WHERE role_id = 5")
                total_students = cursor.fetchone()["total_students"]

                # 3️⃣ Each Topic → total students (via department_topic_map)
                cursor.execute("""
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        COUNT(u.user_id) AS total_students
                    FROM topics t
                    LEFT JOIN department_topic_map dtm 
                        ON dtm.topic_id = t.topic_id
                    LEFT JOIN users u 
                        ON u.department_id = dtm.department_id
                        AND u.role_id = 5
                    GROUP BY t.topic_id, t.topic_name
                    ORDER BY t.topic_id ASC
                """)
                topics = cursor.fetchall() or []

                # ✅ Final Response
                return {
                    "status": "success",
                    "data": {
                        "total_colleges": total_colleges,
                        "total_students": total_students,
                        "topics": topics
                    }
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching superadmin report: {str(e)}")
