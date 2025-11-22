from fastapi import APIRouter, HTTPException, Form
from config.database import get_db

router = APIRouter()

@router.post("/upload", status_code=201)
async def upload_overview(
    college_id: int = Form(...),
    department_id: int = Form(...),
    topic_id: int = Form(...),   # <-- IMPORTANT
    sub_topic_name: str = Form(...),
    no_of_sub_topics: int = Form(...),
    video_link: str = Form(None),
    file_name: str = Form(None),
    overview_content: str = Form(None)
):
    """
    Upload an overview for a topic that belongs to a specific
    college + department. Topics are isolated per college/department.
    """

    # Must have at least one content type
    if not video_link and not overview_content:
        raise HTTPException(
            status_code=400,
            detail="At least one of video_link or overview_content must be provided."
        )

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ VALIDATE: Topic belongs to this college + department
                cursor.execute("""
                    SELECT topic_id FROM topics
                    WHERE topic_id = %s AND college_id = %s AND department_id = %s AND is_active = 1
                """, (topic_id, college_id, department_id))

                topic = cursor.fetchone()
                if not topic:
                    raise HTTPException(
                        status_code=404,
                        detail="Topic does not belong to the given college/department."
                    )

                # 2️⃣ Update total_sub_topics (optional)
                cursor.execute("""
                    UPDATE topics 
                    SET total_sub_topics = %s, updated_at = NOW()
                    WHERE topic_id = %s
                """, (no_of_sub_topics, topic_id))

                # 3️⃣ Find next sub_topic_order
                cursor.execute("""
                    SELECT COALESCE(MAX(sub_topic_order), 0) + 1 AS next_order
                    FROM sub_topics
                    WHERE topic_id = %s
                """, (topic_id,))
                next_order = cursor.fetchone()["next_order"]

                # 4️⃣ Insert subtopic
                cursor.execute("""
                    INSERT INTO sub_topics (
                        topic_id,
                        sub_topic_name,
                        sub_topic_order,
                        overview_video_url,
                        overview_content,
                        is_active,
                        created_at,
                        updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, 1, NOW(), NOW())
                """,
                (
                    topic_id,
                    sub_topic_name,
                    next_order,
                    video_link,
                    overview_content
                ))

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
        raise HTTPException(
            status_code=500,
            detail=f"Error creating overview: {str(e)}"
        )




@router.get("/get_all")
async def get_overviews_by_department(
    is_active: bool = True
):
    """
    Retrieve all active topics and their active subtopics.
    Includes: topic_id, topic_name, sub_topic_id, sub_topic_name, overview_video_url, overview_content
    """

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # ✅ Include both topic and subtopic is_active filters
                query = """
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        st.sub_topic_id,
                        st.sub_topic_name,
                        st.overview_video_url,
                        st.overview_content
                    FROM topics t
                    LEFT JOIN sub_topics st 
                        ON t.topic_id = st.topic_id
                        AND st.is_active = %s
                    WHERE t.is_active = %s
                    ORDER BY t.topic_id, st.sub_topic_order
                """

                # Note: must pass parameters as a tuple (even if same value)
                cursor.execute(query, (is_active, is_active))
                results = cursor.fetchall()

                # Group results by topic
                topics_dict = {}
                for row in results:
                    topic_id = row["topic_id"]

                    if topic_id not in topics_dict:
                        topics_dict[topic_id] = {
                            "topic_id": topic_id,
                            "topic_name": row["topic_name"],
                            "sub_topics": [],
                        }

                    if row["sub_topic_id"]:
                        topics_dict[topic_id]["sub_topics"].append({
                            "sub_topic_id": row["sub_topic_id"],
                            "sub_topic_name": row["sub_topic_name"],
                            "overview_video_url": row["overview_video_url"],
                            "overview_content": row["overview_content"],
                        })

                return {
                    "status": "success",
                    "count": len(topics_dict),
                    "data": list(topics_dict.values()),
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overviews: {str(e)}")

    

    

@router.put("/deactivate-subtopic/{sub_topic_id}")
async def deactivate_subtopic(sub_topic_id: int):
    """
    Soft delete (deactivate) a subtopic and its related questions.
    Marks them as inactive instead of deleting.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Check if subtopic exists
                cursor.execute(
                    "SELECT sub_topic_name FROM sub_topics WHERE sub_topic_id = %s",
                    (sub_topic_id,)
                )
                sub = cursor.fetchone()
                if not sub:
                    raise HTTPException(status_code=404, detail="Subtopic not found")

                # Deactivate related questions
                cursor.execute(
                    """
                    UPDATE questions 
                    SET is_active = 0, updated_at = NOW()
                    WHERE test_scope = 'sub_topic' AND reference_id = %s
                    """,
                    (sub_topic_id,)
                )
                questions_updated = cursor.rowcount

                # Deactivate the subtopic itself
                cursor.execute(
                    "UPDATE sub_topics SET is_active = 0, updated_at = NOW() WHERE sub_topic_id = %s",
                    (sub_topic_id,)
                )
                conn.commit()

        return {
            "status": "success",
            "message": f"Subtopic '{sub['sub_topic_name']}' and its questions deactivated successfully.",
            "deactivated_questions": questions_updated,
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error deactivating subtopic:", e)
        raise HTTPException(status_code=500, detail=f"Error deactivating subtopic: {str(e)}")





@router.put("/update-overview/{sub_topic_id}")
async def update_subtopic_overview(
    sub_topic_id: int,
    overview_video_url: str = Form(None),
    overview_content: str = Form(None),
):
    """
    Update overview video URL and/or overview content for a specific subtopic.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # 1️⃣ Check if subtopic exists
                cursor.execute(
                    "SELECT sub_topic_name FROM sub_topics WHERE sub_topic_id = %s",
                    (sub_topic_id,),
                )
                sub = cursor.fetchone()

                if not sub:
                    raise HTTPException(status_code=404, detail="Subtopic not found")

                # 2️⃣ Validate: At least one field must be provided
                if not overview_video_url and not overview_content:
                    raise HTTPException(
                        status_code=400,
                        detail="At least one of overview_video_url or overview_content must be provided.",
                    )

                # 3️⃣ Build dynamic SQL update
                update_fields = []
                params = []

                if overview_video_url is not None:
                    update_fields.append("overview_video_url = %s")
                    params.append(overview_video_url)

                if overview_content is not None:
                    update_fields.append("overview_content = %s")
                    params.append(overview_content)

                params.append(sub_topic_id)

                update_sql = f"""
                    UPDATE sub_topics
                    SET {', '.join(update_fields)}, updated_at = NOW()
                    WHERE sub_topic_id = %s
                """

                cursor.execute(update_sql, tuple(params))
                conn.commit()

        return {
            "status": "success",
            "message": f"Subtopic '{sub['sub_topic_name']}' overview updated successfully.",
            "updated_fields": {
                "overview_video_url": overview_video_url,
                "overview_content": "Updated" if overview_content else None,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        print("❌ Error updating subtopic overview:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
