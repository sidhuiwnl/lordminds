from fastapi import APIRouter, HTTPException
from config.database import get_db

router = APIRouter()

@router.get("/topic-subtopic")
async def get_topic_subtopic(department_id : int):
    """Fetch topics and their subtopics for a given department"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Fetch topics
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number 
                    FROM topics 
                    WHERE department_id = %s AND is_active = TRUE
                    ORDER BY topic_number
                """, (department_id,))
                topics = cursor.fetchall()

                # For each topic, fetch its subtopics
                for topic in topics:
                    cursor.execute("""
                        SELECT sub_topic_id, sub_topic_name, sub_topic_order, overview_video_url, file_name,
                               CASE 
                                   WHEN overview_content IS NOT NULL 
                                   THEN TRUE 
                                   ELSE FALSE 
                               END as has_document,
                               is_active, created_at
                        FROM sub_topics 
                        WHERE topic_id = %s AND is_active = TRUE
                        ORDER BY sub_topic_order
                    """, (topic['topic_id'],))
                    subtopics = cursor.fetchall()
                    topic['sub_topics'] = subtopics

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")
    

@router.get("/get-topic-with-subtpics")
async def get_topic_with_subtopics():
    """Fetch all topics with their subtopics and question counts"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Fetch all topics
                cursor.execute("""
                    SELECT topic_id, topic_name, topic_number, department_id 
                    FROM topics 
                    WHERE is_active = TRUE
                    ORDER BY topic_number
                """)
                topics = cursor.fetchall()

                # For each topic, fetch its subtopics
                for topic in topics:
                    cursor.execute("""
                        SELECT sub_topic_id, sub_topic_name, sub_topic_order, overview_video_url, file_name,test_file,
                               CASE 
                                   WHEN overview_content IS NOT NULL 
                                   THEN TRUE 
                                   ELSE FALSE 
                               END as has_document,
                               is_active, created_at
                        FROM sub_topics 
                        WHERE topic_id = %s AND is_active = TRUE
                        ORDER BY sub_topic_order
                    """, (topic['topic_id'],))
                    subtopics = cursor.fetchall()
                    
                    # For each subtopic, fetch total questions count
                    for subtopic in subtopics:
                        cursor.execute("""
                            SELECT COUNT(*) as total_questions
                            FROM questions 
                            WHERE test_scope = 'sub_topic' AND reference_id = %s
                        """, (subtopic['sub_topic_id'],))
                        question_count = cursor.fetchone()
                        subtopic['total_questions'] = question_count['total_questions']
                    
                    topic['sub_topics'] = subtopics
                    
                    # Calculate total questions for the topic (sum across subtopics)
                    topic['total_questions'] = sum(st['total_questions'] for st in subtopics)

                return {
                    "status": "success",
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching topics and subtopics: {str(e)}")

