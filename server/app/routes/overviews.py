from fastapi import APIRouter, HTTPException, Form
from config.database import get_db

router = APIRouter()

@router.post("/upload", status_code=201)
async def upload_overview(
    department_id: int = Form(...),
    topic_name: str = Form(...),
    sub_topic_name: str = Form(...),
    no_of_sub_topics: int = Form(...),
    video_link: str = Form(None),  # Optional
    file_name : str = Form(None), # Optional - filename from frontend
    overview_content: str = Form(None)  # Optional - longtext from frontend
):
    """
    Upload an overview with video link and/or document content.
    Steps:
    1. Validate department exists
    2. Create or get topic
    3. Create sub-topic with video link and document content
    """

    # ✅ Validate at least one content type is provided
    if not video_link and not overview_content:
        raise HTTPException(
            status_code=400, 
            detail="At least one of video_link or overview_content must be provided."
        )

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Verify department exists
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id = %s",
                    (department_id,)
                )
                dept = cursor.fetchone()
                if not dept:
                    raise HTTPException(status_code=400, detail="Department not found")

                # 2️⃣ Check if topic exists, if not create it
                cursor.execute(
                    """SELECT topic_id FROM topics 
                       WHERE department_id = %s AND topic_name = %s AND is_active = TRUE""",
                    (department_id, topic_name)
                )
                topic = cursor.fetchone()
                
                if topic:
                    topic_id = topic['topic_id']
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
                        (department_id, topic_name, total_sub_topics, created_at, updated_at)
                        VALUES (%s, %s, %s, NOW(), NOW())
                    """
                    cursor.execute(insert_topic, (department_id, topic_name, no_of_sub_topics))
                    topic_id = cursor.lastrowid

                # 3️⃣ Get the next sub_topic_order for this topic
                cursor.execute(
                    """SELECT COALESCE(MAX(sub_topic_order), 0) + 1 as next_order
                       FROM sub_topics WHERE topic_id = %s""",
                    (topic_id,)
                )
                next_order = cursor.fetchone()['next_order']

                # 4️⃣ Create sub-topic
                insert_sub_topic = """
                    INSERT INTO sub_topics
                    (topic_id, sub_topic_name, sub_topic_order, overview_video_url,file_name, 
                     overview_content, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                """
                cursor.execute(insert_sub_topic, (
                    topic_id,
                    sub_topic_name,
                    next_order,
                    video_link,
                    file_name,
                    overview_content
                ))
                sub_topic_id = cursor.lastrowid

                conn.commit()

                return {
                    "status": "success",
                    "message": "Overview created successfully.",
                    "topic_id": topic_id,
                    "sub_topic_id": sub_topic_id,
                    "sub_topic_order": next_order
                }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating overview: {str(e)}")


@router.get("/")
async def get_all_overviews(
    department_id: int = None,
    topic_id: int = None,
    is_active: bool = True
):
    """
    Retrieve all overviews with filtering options.
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
                        t.department_id,
                        d.department_name,
                        st.sub_topic_id,
                        st.sub_topic_name,
                        st.sub_topic_order,
                        st.overview_video_url,
                        st.file_name,
                        CASE 
                            WHEN st.overview_content IS NOT NULL 
                            THEN TRUE 
                            ELSE FALSE 
                        END as has_document,
                        st.is_active as sub_topic_active,
                        st.created_at as sub_topic_created_at
                    FROM topics t
                    INNER JOIN departments d ON t.department_id = d.department_id
                    LEFT JOIN sub_topics st ON t.topic_id = st.topic_id
                    WHERE t.is_active = %s
                """
                params = [is_active]

                if department_id:
                    query += " AND t.department_id = %s"
                    params.append(department_id)

                if topic_id:
                    query += " AND t.topic_id = %s"
                    params.append(topic_id)

                query += " ORDER BY t.topic_id, st.sub_topic_order"

                cursor.execute(query, params)
                results = cursor.fetchall()

                # Group by topics
                topics_dict = {}
                for row in results:
                    topic_id = row['topic_id']
                    
                    if topic_id not in topics_dict:
                        topics_dict[topic_id] = {
                            "topic_id": topic_id,
                            "topic_name": row['topic_name'],
                            "topic_number": row['topic_number'],
                            "total_sub_topics": row['total_sub_topics'],
                            "department_id": row['department_id'],
                            "department_name": row['department_name'],
                            "sub_topics": []
                        }
                    
                    if row['sub_topic_id']:
                        topics_dict[topic_id]['sub_topics'].append({
                            "sub_topic_id": row['sub_topic_id'],
                            "sub_topic_name": row['sub_topic_name'],
                            "sub_topic_order": row['sub_topic_order'],
                            "overview_video_url": row['overview_video_url'],
                            "file_name": row['file_name'],
                            "has_document": row['has_document'],
                            "is_active": row['sub_topic_active'],
                            "created_at": row['sub_topic_created_at']
                        })

                return {
                    "status": "success",
                    "count": len(topics_dict),
                    "data": list(topics_dict.values())
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overviews: {str(e)}")