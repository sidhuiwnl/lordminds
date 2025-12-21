from fastapi import APIRouter, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/get-superadmin-report")
async def get_superadmin_report():
    """
    SUPER ADMIN DASHBOARD REPORT
    -----------------------------------
    1️⃣ Total Active Colleges
    2️⃣ Total Active Students (from ACTIVE colleges only)
    3️⃣ Topic-wise student count (from ACTIVE colleges only)
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Total Active Colleges
                cursor.execute("""
                    SELECT COUNT(*) AS total_colleges
                    FROM colleges
                    WHERE is_active = 1
                """)
                total_colleges = cursor.fetchone()["total_colleges"]

                # 2️⃣ Total Active Students from ACTIVE colleges only
                cursor.execute("""
                    SELECT COUNT(*) AS total_students
                    FROM users u
                    JOIN colleges c ON u.college_id = c.college_id
                    WHERE u.role_id = 5
                      AND u.is_active = 1
                      AND c.is_active = 1  -- ADD THIS: Only count students from active colleges
                """)
                total_students = cursor.fetchone()["total_students"]

                # 3️⃣ Topic → Active Students Count (from ACTIVE colleges only)
                cursor.execute("""
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        COUNT(DISTINCT u.user_id) AS total_students
                    FROM topics t

                    JOIN topic_college_department tcd
                        ON tcd.topic_id = t.topic_id
                       AND tcd.is_active = 1

                    JOIN colleges c_topic  -- College for topic mapping
                        ON c_topic.college_id = tcd.college_id
                       AND c_topic.is_active = 1

                    JOIN departments d
                        ON d.department_id = tcd.department_id
                       AND d.is_active = 1

                    LEFT JOIN users u
                        ON u.college_id = tcd.college_id
                       AND u.department_id = tcd.department_id
                       AND u.role_id = 5
                       AND u.is_active = 1
                    
                    LEFT JOIN colleges c_student  -- Student's college for active check
                        ON c_student.college_id = u.college_id
                       AND c_student.is_active = 1

                    WHERE t.is_active = 1
                      AND c_student.college_id IS NOT NULL  -- Only count if student's college is active

                    GROUP BY t.topic_id, t.topic_name
                    ORDER BY t.topic_name ASC
                """)

                topics = cursor.fetchall() or []

                return {
                    "status": "success",
                    "data": {
                        "total_colleges": total_colleges,
                        "total_students": total_students,
                        "topics": topics
                    }
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching superadmin report: {str(e)}"
        )
    
    

@router.get("/students-by-college")
async def get_students_by_college():
    """
    SUPERADMIN PIE CHART:
    Students distribution across all active colleges.
    Only active students (role_id = 5) are counted.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                query = """
                    SELECT 
                        c.college_id,
                        c.name AS college_name,
                        COUNT(u.user_id) AS total_students
                    FROM colleges c
                    LEFT JOIN users u 
                        ON u.college_id = c.college_id
                        AND u.role_id = 5          -- students only
                        AND u.is_active = 1        -- active students
                    WHERE c.is_active = 1          -- active colleges
                    GROUP BY c.college_id, c.name
                    ORDER BY total_students DESC
                """

                cursor.execute(query)
                rows = cursor.fetchall() or []

                # Convert to frontend pie-chart format
                chart_data = [
                    {
                        "college_id": row["college_id"],
                        "college_name": row["college_name"],
                        "total_students": row["total_students"]
                    }
                    for row in rows
                ]

                return {
                    "status": "success",
                    "count": len(chart_data),
                    "data": chart_data
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching students by college: {str(e)}"
        )



@router.get("/daily-learning-hours")
async def get_daily_learning_hours():
    """
    DAILY TOTAL LEARNING TIME (LINE CHART)
    ---------------------------------------
    Returns total hours spent by all students per day
    based on user_sessions table (duration_seconds).
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                query = """
                    SELECT 
                        DATE(end_time) AS date,
                        ROUND(SUM(duration_seconds) / 3600, 2) AS total_hours
                    FROM user_sessions
                    WHERE end_time IS NOT NULL
                    GROUP BY DATE(end_time)
                    ORDER BY DATE(end_time) ASC;
                """

                cursor.execute(query)
                rows = cursor.fetchall() or []

                # Convert to chart.js format
                dates = [str(row["date"]) for row in rows]
                hours = [float(row["total_hours"]) for row in rows]

                return {
                    "status": "success",
                    "count": len(rows),
                    "labels": dates,         # X-axis
                    "values": hours,         # Y-axis
                    "data": rows             # raw data if needed
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching daily learning hours: {str(e)}"
        )
