from fastapi import FastAPI
from config.database import get_db
from fastapi.middleware.cors import CORSMiddleware
from routes import assignments, overviews,users,tests,colleges,topics,questions,departments,administrator,teacher,students
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="LordMind API",
    description="Educational Management System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


app.include_router(assignments.router, prefix="/assignments", tags=["Assignments"])
app.include_router(overviews.router, prefix="/overviews", tags=["Overviews"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(tests.router, prefix="/tests", tags=["Tests"])
app.include_router(colleges.router, prefix="/colleges", tags=["Colleges"])
app.include_router(topics.router, prefix="/topics", tags=["Topics"])
app.include_router(questions.router, prefix="/questions", tags=["Questions"])
app.include_router(departments.router, prefix="/departments", tags=["Departments"])
app.include_router(administrator.router, prefix="/administrator", tags=["Administrator"])
app.include_router(teacher.router, prefix="/teacher", tags=["Teacher"])
app.include_router(students.router, prefix="/student", tags=["Student"])



@app.get("/")
async def root():

    return {
        "message": "API is connected and running!",
        "status": "success",
        "version": "1.0.0"
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)