from datetime import datetime
from typing import Optional
import bcrypt
from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from config.database import get_db


router = APIRouter()


@router.get("/topics/{user_id}")
async def get_administrator_topics(user_id: int):
    """
    Fetch all topics assigned to the college of the given user_id.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Step 1: Get user's college_id
                cursor.execute("""
                    SELECT college_id 
                    FROM users 
                    WHERE user_id = %s
                """, (user_id,))
                user = cursor.fetchone()
                
                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                college_id = user["college_id"]

                # Step 2: Fetch topics for departments under that college
                cursor.execute("""
                    SELECT 
                        t.topic_id,
                        t.topic_name,
                        t.topic_number,
                        t.total_sub_topics,
                        t.is_active,
                        t.created_at,
                        cd.department_id
                    FROM topics t
                    JOIN college_departments cd 
                        ON t.department_id = cd.department_id
                    WHERE cd.college_id = %s
                    ORDER BY t.topic_name
                """, (college_id,))
                
                topics = cursor.fetchall()

                return {
                    "status": "success",
                    "college_id": college_id,
                    "count": len(topics),
                    "data": topics
                }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching topics: {str(e)}"
        )



@router.get("/get-administrator-details/{user_id}")
async def get_administrator_details(user_id: int):
    """
    Fetch administrator's college details and active departments 
    under that college. Uses new schema where departments contain college_id.
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:

                # 1️⃣ Validate administrator and get college
                user_query = """
                    SELECT 
                        u.user_id,
                        u.username,
                        u.full_name,
                        u.college_id,
                        c.name AS college_name,
                        c.college_address
                    FROM users u
                    JOIN colleges c ON u.college_id = c.college_id
                    WHERE u.user_id = %s
                      AND u.role_id = 3          -- administrator role
                      AND u.is_active = 1        -- active user only
                """
                cursor.execute(user_query, (user_id,))
                user_details = cursor.fetchone()

                if not user_details:
                    raise HTTPException(
                        status_code=404, 
                        detail="Active administrator not found"
                    )

                college_id = user_details["college_id"]

                # 2️⃣ Fetch ACTIVE departments under that college
                dept_query = """
                    SELECT 
                        department_id,
                        department_name
                    FROM departments
                    WHERE college_id = %s
                      AND is_active = 1
                    ORDER BY department_name
                """
                cursor.execute(dept_query, (college_id,))
                departments = cursor.fetchall()

                return {
                    "status": "success",
                    "data": {
                        "user": user_details,
                        "departments": departments
                    }
                }

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching administrator details: {str(e)}"
        )


@router.put("/update/{user_id}")
async def update_admin(
    user_id: int,
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Verify user is an admin
                cursor.execute(
                    "SELECT * FROM users WHERE user_id = %s AND role_id = 3", (user_id,)
                )
                admin = cursor.fetchone()
                if not admin:
                    raise HTTPException(status_code=404, detail="Administrator not found")

                updates = []
                values = []

                if username:
                    updates.append("username = %s")
                    values.append(username)

                if password:
                    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
                    updates.append("password_hash = %s")
                    values.append(hashed_pw.decode("utf-8"))

                if not updates:
                    return {"status": "fail", "detail": "No fields to update"}

                values.append(user_id)
                query = f"""
                    UPDATE users
                    SET {', '.join(updates)}, updated_at = NOW()
                    WHERE user_id = %s AND role_id = 3
                """
                cursor.execute(query, values)
                conn.commit()

                cursor.execute(
                    "SELECT user_id, username, full_name, created_at FROM users WHERE user_id = %s",
                    (user_id,),
                )
                updated_admin = cursor.fetchone()

        return {
            "status": "success",
            "message": "Administrator updated successfully",
            "admin": updated_admin,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating administrator: {str(e)}")
    

@router.delete("/delete/{user_id}")
async def delete_admin(user_id: int):
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                # Verify admin exists
                cursor.execute(
                    "SELECT full_name FROM users WHERE user_id = %s AND role_id = 3",
                    (user_id,),
                )
                admin = cursor.fetchone()

                if not admin:
                    raise HTTPException(status_code=404, detail="Administrator not found")

                try:
                    cursor.execute("DELETE FROM users WHERE user_id = %s AND role_id = 3", (user_id,))
                    conn.commit()
                except Exception as e:
                    if "1451" in str(e):
                        raise HTTPException(
                            status_code=400,
                            detail="Cannot delete administrator because related records exist.",
                        )
                    raise

        return {
            "status": "success",
            "message": f"Administrator '{admin['full_name']}' deleted successfully",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting administrator: {str(e)}")    