from datetime import datetime
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db


router = APIRouter()

@router.get("/department/{college_id}/{department_id}/topic/{topic_id}/progress")
async def get_specific_topic_progress(college_id: int, department_id: int, topic_id: int):
    """
    Fetch average progress and score for a specific topic 
    under a department in a college.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        COUNT(stp.student_id) AS total_students,
                        ROUND(AVG(stp.progress_percent), 2) AS avg_progress_percent,
                        ROUND(AVG(stp.average_score), 2) AS avg_score,
                        SUM(CASE WHEN stp.status = 'Completed' THEN 1 ELSE 0 END) AS completed_students,
                        SUM(CASE WHEN stp.status = 'Not Started' THEN 1 ELSE 0 END) AS not_started_students
                    FROM topics t
                    LEFT JOIN student_topic_progress stp 
                        ON t.topic_id = stp.topic_id
                    INNER JOIN departments d 
                        ON t.department_id = d.department_id
                    INNER JOIN college_departments cd 
                        ON d.department_id = cd.department_id
                    INNER JOIN colleges c 
                        ON cd.college_id = c.college_id
                    WHERE cd.department_id = %s 
                      AND cd.college_id = %s 
                      AND t.topic_id = %s
                    GROUP BY t.topic_id, t.topic_name
                    LIMIT 1
                """

                cursor.execute(query, (department_id, college_id, topic_id))
                topic = cursor.fetchone()

                if not topic:
                    raise HTTPException(status_code=404, detail="No data found for this topic")

                return {
                    "status": "success",
                    "data": topic
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topic progress: {str(e)}")


@router.post("/store-marks")
async def store_marks(marks_data: dict):
    """
    Store marks obtained by student in sub_topic_marks table
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO sub_topic_marks 
                    (student_id, sub_topic_id, marks_obtained, max_marks, attempted_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (
                    marks_data["student_id"],
                    marks_data["sub_topic_id"], 
                    marks_data["marks_obtained"],
                    marks_data["max_marks"]
                ))
                conn.commit()
                
        return {"status": "success", "message": "Marks stored successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing marks: {str(e)}")