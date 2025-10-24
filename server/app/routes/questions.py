from fastapi import APIRouter, HTTPException
from config.database import get_db
import json

router = APIRouter()

@router.get("/db")
async def get_question_types():

    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM question_type")
                question_types = cursor.fetchall()

                return {
                    "status": "success",
                    "message": "Data fetched successfully",
                    "total_records": len(question_types),
                    "data": question_types
                }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.get("/get-questions")
async def get_questions(assignment_id : int = None):
    """Get questions, optionally filtered by assignment_id"""
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                if assignment_id:
                    cursor.execute("""
                            SELECT * FROM questions 
                            WHERE assignment_id = %s
                            ORDER BY order_no
                        """, (assignment_id,))
                else:
                    cursor.execute("SELECT * FROM questions ORDER BY order_no")

                questions = cursor.fetchall()

                print(questions)

                # Parse JSON data
                for question in questions:
                    if question['question_data']:
                        question['question_data'] = json.loads(question['question_data'])

                return questions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")