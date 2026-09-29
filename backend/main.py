from dotenv import load_dotenv
load_dotenv()

import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import engine, Base
from auth import router as auth_router

from resume_parser import extract_text, extract_skills as extract_resume_skills
from ai_engine import (
    analyze_resume,
    generate_interview_questions,
    generate_new_resume,
    extract_job_roles,
    interview_chatbot,
)
from job_search import search_jobs
from interview_engine import generate_mock_questions, evaluate_answer
from coding_engine import generate_coding_questions, evaluate_code_answer, execute_code
from project_engine import generate_projects, generate_project_guide


app = FastAPI(title="CareerForge AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://carrer-forge-ai-git-main-suhas3.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.include_router(auth_router)


@app.get("/")
def home():
    return {"message": "CareerForge AI Backend is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


class ChatRequest(BaseModel):
    message: str
    resume_text: str = ""
    skills: list[str] = Field(default_factory=list)
    resume_id: str = ""


class JobFilterRequest(BaseModel):
    roles: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    resume_text: str = ""
    resume_id: str = ""
    experience: str = "fresher"


def clean_skills(skills):
    if not skills:
        return []

    if isinstance(skills, str):
        skills = [skills]

    result = []
    seen = set()

    for skill in skills:
        value = str(skill).strip()
        if not value:
            continue

        value = " ".join(value.split())
        key = value.lower()

        if key not in seen:
            result.append(value)
            seen.add(key)

    return result


def get_request_skills(data):
    """
    Single source of truth for feature requests.

    If resume_text is present, re-parse it. This is intentional:
    it prevents a stale frontend skills array from being used after a
    second resume upload.
    """
    if not isinstance(data, dict):
        return []

    resume_text = str(data.get("resume_text") or "").strip()

    if resume_text:
        return clean_skills(extract_resume_skills(resume_text))

    return clean_skills(data.get("skills") or [])


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        file.file.seek(0)
        text = extract_text(file)

        if not text or not text.strip():
            return {
                "resume_id": uuid.uuid4().hex,
                "ats_score": 0,
                "skills": [],
                "questions": {"beginner": [], "intermediate": [], "advanced": []},
                "jobs": [],
                "roles": [],
                "analysis": "",
                "resume_text": "",
                "improved_resume": "",
                "message": "No readable text was extracted from the uploaded resume.",
            }

        # IMPORTANT: every upload gets a new ID and fresh skill extraction.
        resume_id = uuid.uuid4().hex
        skills = clean_skills(extract_resume_skills(text))

        analysis = analyze_resume(text)
        ats_score = analysis.get("ats_score", 65)

        # All downstream features are generated from THIS upload's skills.
        questions = generate_interview_questions(skills)
        roles = extract_job_roles(skills, text)
        jobs = search_jobs(roles, "fresher", skills=skills)

        new_resume = generate_new_resume(text)

        return {
            "resume_id": resume_id,
            "ats_score": ats_score,
            "skills": skills,
            "questions": questions,
            "jobs": jobs,
            "roles": roles,
            "analysis": analysis.get("analysis_text", ""),
            "resume_text": text,
            "improved_resume": new_resume,
            "feature_context": {
                "resume_id": resume_id,
                "skills": skills,
                "roles": roles,
            },
        }

    except Exception as e:
        print("ANALYZE ERROR:", repr(e))
        return {
            "resume_id": uuid.uuid4().hex,
            "ats_score": 0,
            "skills": [],
            "questions": {"beginner": [], "intermediate": [], "advanced": []},
            "jobs": [],
            "roles": [],
            "analysis": "Error occurred while analyzing the resume.",
            "resume_text": "",
            "improved_resume": "",
            "error": str(e),
        }


@app.post("/interview-chat")
async def interview_chat(request: ChatRequest):
    try:
        skills = clean_skills(request.skills)

        # If resume text is available, the chatbot can use the full current resume.
        return interview_chatbot(
            request.resume_text,
            request.message,
        )
    except Exception as e:
        print("INTERVIEW CHAT ERROR:", repr(e))
        return {"type": "interview", "items": []}


@app.post("/jobs/filter")
async def filter_jobs(request: JobFilterRequest):
    skills = clean_skills(request.skills)

    if request.resume_text:
        parsed = extract_resume_skills(request.resume_text)
        if parsed:
            skills = clean_skills(parsed)

    roles = [str(r).strip() for r in request.roles if str(r).strip()]

    if not roles:
        roles = extract_job_roles(skills, request.resume_text)

    jobs = search_jobs(
        roles,
        request.experience or "fresher",
        skills=skills,
    )

    return {
        "jobs": jobs,
        "roles": roles,
        "skills": skills,
    }


@app.post("/mock/start")
async def start_mock(data: dict):
    try:
        skills = get_request_skills(data)

        if not skills:
            return {"questions": [], "skills": []}

        questions = generate_mock_questions(skills)

        return {
            "questions": questions,
            "skills": skills,
            "resume_id": data.get("resume_id", ""),
        }
    except Exception as e:
        print("MOCK START ERROR:", repr(e))
        return {"questions": [], "skills": [], "error": str(e)}


@app.post("/mock/evaluate")
async def evaluate_mock(data: dict):
    try:
        return evaluate_answer(
            data.get("question"),
            data.get("answer"),
        )
    except Exception as e:
        return {"error": f"Unable to evaluate answer: {str(e)}"}


@app.post("/coding/questions")
async def coding_questions(data: dict):
    try:
        skills = get_request_skills(data)

        if not skills:
            return {"questions": [], "skills": []}

        questions = generate_coding_questions(skills)

        return {
            "questions": questions,
            "skills": skills,
            "resume_id": data.get("resume_id", ""),
        }
    except Exception as e:
        print("CODING QUESTIONS ERROR:", repr(e))
        return {"questions": [], "skills": [], "error": str(e)}


@app.post("/coding/run")
async def run_code(data: dict):
    try:
        output = execute_code(
            data.get("language"),
            data.get("code"),
        )
        return {"output": output}
    except Exception as e:
        return {"output": f"Execution error: {str(e)}"}


@app.post("/coding/evaluate")
async def evaluate_code(data: dict):
    try:
        return evaluate_code_answer(
            data.get("question"),
            data.get("answer"),
            data.get("language"),
        )
    except Exception as e:
        return {"error": f"Unable to evaluate code: {str(e)}"}


@app.post("/projects")
async def projects(data: dict):
    try:
        skills = get_request_skills(data)

        if not skills:
            return {"projects": [], "skills": []}

        generated = generate_projects(skills)

        return {
            "projects": generated,
            "skills": skills,
            "resume_id": data.get("resume_id", ""),
        }
    except Exception as e:
        print("PROJECT GENERATION ERROR:", repr(e))
        return {"projects": [], "skills": [], "error": str(e)}


@app.post("/project-guide")
async def project_guide(data: dict):
    try:
        project_title = str(data.get("project_title") or "").strip()

        if not project_title:
            return {"error": "Project title is required."}

        skills = get_request_skills(data)

        guide = generate_project_guide(
            project_title,
            skills=skills,
        )

        return guide

    except Exception as e:
        print("PROJECT GUIDE ERROR:", repr(e))
        return {"error": f"Unable to generate project guide: {str(e)}"}
