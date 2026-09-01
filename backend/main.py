from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import engine, Base
from auth import router as auth_router

# ===============================
# IMPORT EXISTING MODULES
# ===============================
from resume_parser import extract_text

from ai_engine import (
    analyze_resume,
    generate_interview_questions,
    generate_new_resume,
    extract_job_roles,
    interview_chatbot,
)

from utils import extract_skills
from job_search import search_jobs

# ===============================
# MOCK INTERVIEW IMPORTS
# ===============================
from interview_engine import (
    generate_mock_questions,
    evaluate_answer
)

from coding_engine import (
    generate_coding_questions,
    evaluate_code_answer
)

from project_engine import (
    generate_projects,
    generate_project_guide
)

app = FastAPI()

# ==========================================
# CREATE FASTAPI APP
# ==========================================

app = FastAPI(
    title="CareerForge AI API"
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

origins = [

    # Local React
    "http://localhost:3000",

    "http://127.0.0.1:3000",

]


app.add_middleware(

    CORSMiddleware,

    allow_origins=origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


# ==========================================
# CREATE DATABASE TABLES
# ==========================================

Base.metadata.create_all(
    bind=engine
)


# ==========================================
# AUTHENTICATION ROUTES
# ==========================================

app.include_router(
    auth_router
)


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {

        "message": "CareerForge AI Backend is running"

    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():

    return {

        "status": "healthy"

    }
# ===============================
# CHAT REQUEST MODEL
# ===============================
class ChatRequest(BaseModel):
    message: str
    resume_text: str = ""

class JobFilterRequest(BaseModel):
    roles: list[str] = []
    experience: str = "fresher"

# ===============================
# ANALYZE RESUME API
# ===============================
@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    try:

        file.file.seek(0)

        text = extract_text(file)

        if not text or text.strip() == "":
            return {
                "ats_score": 50,
                "skills": [],
                "questions": {
                    "beginner": [],
                    "intermediate": [],
                    "advanced": []
                },
                "jobs": [],
                "roles": [],
                "analysis": "No text extracted",
                "improved_resume": ""
            }

        # ATS
        analysis = analyze_resume(text)
        ats_score = analysis.get("ats_score", 65)

        # SKILLS
        skills = extract_skills(text)

        if not skills:
            skills = ["Python", "Java"]

        # QUESTIONS
        questions = generate_interview_questions(text)

        if not questions:
            questions = {
                "beginner": [],
                "intermediate": [],
                "advanced": []
            }

        # NEW RESUME
        new_resume = generate_new_resume(text)

        # ROLES
        roles = extract_job_roles(text)

        if not roles:
            roles = ["Software Engineer"]

        # JOBS
        jobs = search_jobs(roles, "fresher")

        if not jobs:
            jobs = [
                {
                    "title": "Software Engineer",
                    "company": "TCS",
                    "location": "India",
                    "link": "https://www.tcs.com/careers"
                }
            ]

        return {
            "ats_score": ats_score,
            "skills": skills,
            "questions": questions,
            "jobs": jobs,
            "roles": roles,
            "analysis": analysis.get("analysis_text", ""),
            "improved_resume": new_resume
        }

    except Exception as e:

        print("ERROR:", e)

        return {
            "ats_score": 0,
            "skills": [],
            "questions": {
                "beginner": [],
                "intermediate": [],
                "advanced": []
            },
            "jobs": [],
            "roles": [],
            "analysis": "Error occurred",
            "improved_resume": ""
        }

# ===============================
# INTERVIEW CHATBOT API
# ===============================
@app.post("/interview-chat")
async def interview_chat(request: ChatRequest):

    return interview_chatbot(
        request.resume_text,
        request.message
    )
# ===============================
# JOB FILTER API
# ===============================
@app.post("/jobs/filter")
async def filter_jobs(request: JobFilterRequest):

    roles = request.roles or ["Software Engineer"]
    experience = request.experience or "fresher"

    jobs = search_jobs(roles, experience)

    return {
        "jobs": jobs
    }
# ===============================
# MOCK INTERVIEW START
# ===============================
@app.post("/mock/start")
async def start_mock(data: dict):

    questions = generate_mock_questions(
        data.get("resume_text", "")
    )

    if not questions:
        return {"questions": []}

    return {"questions": questions}

# ===============================
# MOCK INTERVIEW EVALUATE
# ===============================
@app.post("/mock/evaluate")
async def evaluate_mock(data: dict):

    result = evaluate_answer(
        data.get("question"),
        data.get("answer")
    )

    return result

# ===============================
# CODING ROUND IMPORTS
# ===============================
from coding_engine import (
    generate_coding_questions,
    evaluate_code_answer
)

# ===============================
# CODING QUESTIONS API
# ===============================
@app.post("/coding/questions")
async def coding_questions(data: dict):

    questions = generate_coding_questions(
        data.get("resume_text", "")
    )

    return {
        "questions": questions
    }
# ===============================
# RUN CODE API
# ===============================
from coding_engine import execute_code

@app.post("/coding/run")
async def run_code(data: dict):

    language = data.get("language")
    code = data.get("code")

    output = execute_code(language, code)

    return {
        "output": output
    }
# ===============================
# EVALUATE CODE API
# ===============================
@app.post("/coding/evaluate")
async def evaluate_code(data: dict):

    result = evaluate_code_answer(
        data.get("question"),
        data.get("answer"),
        data.get("language")
    )

    return result
# ============================================================
# PROJECT RECOMMENDATIONS
# ============================================================

@app.post("/projects")
async def projects(data: dict):

    try:

        skills = data.get("skills", [])

        projects = generate_projects(skills)

        return {
            "projects": projects
        }

    except Exception as e:

        print("PROJECT API ERROR:", repr(e))

        return {
            "projects": []
        }


# ============================================================
# PROJECT GUIDE
# ============================================================

@app.post("/project-guide")
async def project_guide(data: dict):

    try:

        project_title = data.get(
            "project_title",
            ""
        )

        if not project_title.strip():

            return {
                "error": "Project title is required."
            }

        guide = generate_project_guide(
            project_title
        )

        return guide

    except Exception as e:

        print(
            "PROJECT GUIDE API ERROR:",
            repr(e)
        )

        return {
            "error": "Unable to generate project guide."
        }