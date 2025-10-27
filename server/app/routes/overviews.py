from fastapi import APIRouter, HTTPException, Form
from config.database import get_db

router = APIRouter()

@router.post("/upload", status_code=201)
async def upload_overview(
    topic_name: str = Form(...),
    sub_topic_name: str = Form(...),
    no_of_sub_topics: int = Form(...),
    video_link: str = Form(None),   # Optional
    file_name: str = Form(None),    # Optional - filename from frontend
    overview_content: str = Form(None)  # Optional - longtext from frontend
):
    """
    Upload an overview (topic + sub-topic) with optional video or text content.

    Steps:
    1. Create or get topic (independent of department)
    2. Create sub-topic with video link or overview content
    """

    # ✅ Require at least one content type
    if not video_link and not overview_content:
        raise HTTPException(
            status_code=400,
            detail="At least one of video_link or overview_content must be provided."
        )

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                
                # 1️⃣ Check if topic exists (department_id is now NULL)
                cursor.execute(
                    """SELECT topic_id FROM topics 
                       WHERE topic_name = %s AND is_active = TRUE""",
                    (topic_name,)
                )
                topic = cursor.fetchone()

                if topic:
                    topic_id = topic["topic_id"]

                    # Update total_sub_topics if needed
                    cursor.execute(
                        """UPDATE topics 
                           SET total_sub_topics = %s, updated_at = NOW()
                           WHERE topic_id = %s""",
                        (no_of_sub_topics, topic_id)
                    )
                else:
                    # Create new topic
                    insert_topic = """
                        INSERT INTO topics
                        (topic_name, total_sub_topics, is_active, created_at, updated_at)
                        VALUES (%s, %s, TRUE, NOW(), NOW())
                    """
                    cursor.execute(insert_topic, (topic_name, no_of_sub_topics))
                    topic_id = cursor.lastrowid

                # 2️⃣ Get next sub_topic_order for this topic
                cursor.execute(
                    """SELECT COALESCE(MAX(sub_topic_order), 0) + 1 AS next_order
                       FROM sub_topics WHERE topic_id = %s""",
                    (topic_id,)
                )
                next_order = cursor.fetchone()["next_order"]

                # 3️⃣ Create sub-topic
                insert_sub_topic = """
                    INSERT INTO sub_topics
                    (topic_id, sub_topic_name, sub_topic_order, overview_video_url, 
                      overview_content, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, TRUE, NOW(), NOW())
                """
                cursor.execute(
                    insert_sub_topic,
                    (
                        topic_id,
                        sub_topic_name,
                        next_order,
                        video_link,
                        overview_content,
                    ),
                )
                sub_topic_id = cursor.lastrowid

                conn.commit()

                return {
                    "status": "success",
                    "message": "Overview created successfully.",
                    "topic_id": topic_id,
                    "sub_topic_id": sub_topic_id,
                    "sub_topic_order": next_order,
                }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating overview: {str(e)}")


@router.get("/get_all")
async def get_overviews_by_department(
    
    is_active: bool = True
):
    """
    Retrieve all topics and their subtopics for a given department.
    Only includes: topic_id, topic_name, sub_topic_id, sub_topic_name, overview_video_url
    """

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        st.sub_topic_id,
                        st.sub_topic_name,
                        st.overview_video_url
                    FROM topics t
                    LEFT JOIN sub_topics st ON t.topic_id = st.topic_id
                    WHERE t.is_active = %s
                    ORDER BY t.topic_id, st.sub_topic_order
                """
                cursor.execute(query, (is_active))
                results = cursor.fetchall()

                # Group by topic
                topics_dict = {}
                for row in results:
                    topic_id = row['topic_id']
                    if topic_id not in topics_dict:
                        topics_dict[topic_id] = {
                            "topic_id": topic_id,
                            "topic_name": row['topic_name'],
                            "sub_topics": []
                        }
                    if row['sub_topic_id']:
                        topics_dict[topic_id]['sub_topics'].append({
                            "sub_topic_id": row['sub_topic_id'],
                            "sub_topic_name": row['sub_topic_name'],
                            "overview_video_url": row['overview_video_url']
                        })

                return {
                    "status": "success",
                    "count": len(topics_dict),
                    "data": list(topics_dict.values())
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overviews: {str(e)}")