from openai import OpenAI
from dotenv import load_dotenv

import os
import json
import re


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is missing. Add GROQ_API_KEY to your .env file."
    )


# ============================================================
# GROQ CLIENT
# ============================================================

client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
)


# ============================================================
# MODEL
# ============================================================

MODEL_NAME = "openai/gpt-oss-20b"


# ============================================================
# CLEAN MODEL RESPONSE
# ============================================================

def clean_model_text(text):

    if not text:
        return ""

    text = str(text).strip()

    # Remove markdown code fences
    text = re.sub(
        r"```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"```\s*",
        "",
        text
    )

    return text.strip()


# ============================================================
# SAFE JSON PARSER
# ============================================================

def parse_json_safely(text):

    if not text:
        return None

    text = clean_model_text(text)

    # --------------------------------------------------------
    # Direct JSON
    # --------------------------------------------------------

    try:
        return json.loads(text)

    except Exception:
        pass

    # --------------------------------------------------------
    # Find JSON array
    # --------------------------------------------------------

    start = text.find("[")

    if start != -1:

        depth = 0
        in_string = False
        escaped = False

        for i in range(start, len(text)):

            char = text[i]

            if escaped:
                escaped = False
                continue

            if char == "\\":
                escaped = True
                continue

            if char == '"':
                in_string = not in_string
                continue

            if not in_string:

                if char == "[":
                    depth += 1

                elif char == "]":

                    depth -= 1

                    if depth == 0:

                        candidate = text[start:i + 1]

                        try:
                            return json.loads(candidate)

                        except Exception:
                            pass

    # --------------------------------------------------------
    # Find JSON object
    # --------------------------------------------------------

    start = text.find("{")

    if start != -1:

        depth = 0
        in_string = False
        escaped = False

        for i in range(start, len(text)):

            char = text[i]

            if escaped:
                escaped = False
                continue

            if char == "\\":
                escaped = True
                continue

            if char == '"':
                in_string = not in_string
                continue

            if not in_string:

                if char == "{":
                    depth += 1

                elif char == "}":

                    depth -= 1

                    if depth == 0:

                        candidate = text[start:i + 1]

                        try:
                            return json.loads(candidate)

                        except Exception:
                            pass

    return None


# ============================================================
# SAFE STRING
# ============================================================

def safe_string(value, default=""):

    if value is None:
        return default

    if isinstance(value, str):
        return value.strip()

    return str(value).strip()


# ============================================================
# SAFE LIST
# ============================================================

def safe_list(value):

    if value is None:
        return []

    if isinstance(value, list):

        result = []

        for item in value:

            if item is None:
                continue

            if isinstance(item, dict):

                result.append(
                    " | ".join(
                        f"{key}: {val}"
                        for key, val in item.items()
                    )
                )

            else:

                text = str(item).strip()

                if text:
                    result.append(text)

        return result

    if isinstance(value, str):

        result = []

        for line in value.split("\n"):

            line = line.strip()

            line = re.sub(
                r"^[-•*]\s*",
                "",
                line
            )

            line = re.sub(
                r"^\d+[.)]\s*",
                "",
                line
            )

            if line:
                result.append(line)

        return result

    return [str(value)]


# ============================================================
# NORMALIZE PROJECT
# ============================================================

def normalize_project(project):

    if not isinstance(project, dict):
        return None

    title = safe_string(
        project.get("title"),
        "Software Project"
    )

    difficulty = safe_string(
        project.get("difficulty"),
        "Intermediate"
    )

    tech_stack = safe_string(
        project.get("tech_stack"),
        "Python, FastAPI, React, SQL"
    )

    architecture = safe_string(
        project.get("architecture"),
        "Client-Server Architecture"
    )

    features = safe_list(
        project.get("features")
    )

    if not features:

        features = [
            "User authentication",
            "Core CRUD operations",
            "Dashboard",
            "Reports"
        ]

    return {
        "title": title,
        "difficulty": difficulty,
        "tech_stack": tech_stack,
        "architecture": architecture,
        "features": features[:6]
    }


# ============================================================
# FALLBACK PROJECTS
#
# IMPORTANT:
# If Groq fails, return 8 DIFFERENT projects.
# Never return only one project.
# ============================================================

def fallback_projects(skills):

    skills_text = ", ".join(skills)

    return [

        {
            "title": "AI Resume Analyzer",
            "difficulty": "Advanced",
            "tech_stack": "Python, FastAPI, React, SQL, Groq AI",
            "architecture": "Client-Server Architecture",
            "features": [
                "Resume upload",
                "ATS score analysis",
                "Skill extraction",
                "AI interview questions",
                "Job recommendations",
                "AI resume improvement"
            ]
        },

        {
            "title": "Employee Management System",
            "difficulty": "Intermediate",
            "tech_stack": "Python, FastAPI, React, MySQL",
            "architecture": "MVC / REST API",
            "features": [
                "Employee authentication",
                "Employee CRUD",
                "Department management",
                "Attendance tracking",
                "Salary management",
                "Reports"
            ]
        },

        {
            "title": "Online Learning Management System",
            "difficulty": "Intermediate",
            "tech_stack": "Python, Django, React, PostgreSQL",
            "architecture": "Client-Server Architecture",
            "features": [
                "Student registration",
                "Course management",
                "Video lessons",
                "Assignments",
                "Progress tracking",
                "Instructor dashboard"
            ]
        },

        {
            "title": "Smart Expense Tracker",
            "difficulty": "Beginner",
            "tech_stack": "Python, FastAPI, React, SQL",
            "architecture": "REST API Architecture",
            "features": [
                "Expense management",
                "Income tracking",
                "Category management",
                "Monthly reports",
                "Budget alerts",
                "Expense analytics"
            ]
        },

        {
            "title": "Real-Time Chat Application",
            "difficulty": "Advanced",
            "tech_stack": "Python, FastAPI, React, WebSocket, PostgreSQL",
            "architecture": "Real-Time Client-Server Architecture",
            "features": [
                "User authentication",
                "Private messaging",
                "Group conversations",
                "Online status",
                "Message history",
                "Real-time notifications"
            ]
        },

        {
            "title": "E-Commerce Management Platform",
            "difficulty": "Advanced",
            "tech_stack": "Python, FastAPI, React, MySQL",
            "architecture": "REST API / Layered Architecture",
            "features": [
                "Product catalog",
                "Shopping cart",
                "Order management",
                "Payment integration",
                "Inventory tracking",
                "Admin dashboard"
            ]
        },

        {
            "title": "AI Customer Support Assistant",
            "difficulty": "Advanced",
            "tech_stack": "Python, FastAPI, React, Groq AI, SQL",
            "architecture": "AI-Powered Client-Server Architecture",
            "features": [
                "AI chatbot",
                "Customer authentication",
                "Ticket creation",
                "Automatic responses",
                "Conversation history",
                "Admin analytics"
            ]
        },

        {
            "title": "Job Application Tracking System",
            "difficulty": "Intermediate",
            "tech_stack": "Python, FastAPI, React, PostgreSQL",
            "architecture": "MVC / REST API",
            "features": [
                "Job application tracking",
                "Company management",
                "Application status",
                "Interview scheduling",
                "Resume management",
                "Application analytics"
            ]
        }

    ]


# ============================================================
# PROJECT RECOMMENDATIONS
# ============================================================

def generate_projects(skills):

    # --------------------------------------------------------
    # Normalize skills
    # --------------------------------------------------------

    if not skills:

        skills = [
            "Python",
            "Java",
            "SQL"
        ]

    if isinstance(skills, str):

        skills = [
            skills
        ]

    skills = [
        str(skill).strip()
        for skill in skills
        if str(skill).strip()
    ]

    skills_text = ", ".join(skills)

    # --------------------------------------------------------
    # AI PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are an expert software architect and career mentor.

Generate EXACTLY 8 UNIQUE software projects for a B.Tech
computer science graduate.

Candidate skills:

{skills_text}

IMPORTANT RULES:

1. Generate exactly 8 projects.
2. Every project must have a DIFFERENT title.
3. Do not repeat project ideas.
4. Do not generate eight variations of the same application.
5. Use the candidate's skills where appropriate.
6. Do not force every skill into every project.
7. Each project must solve a different real-world problem.
8. Projects should be realistic enough to implement.
9. Projects should be useful for a software developer resume.
10. Include Beginner, Intermediate and Advanced projects.
11. Do not return explanations outside JSON.
12. Return ONLY valid JSON.
13. The response MUST start with [ and end with ].

Use this exact structure:

[
  {{
    "title": "Unique Project Name",
    "difficulty": "Beginner",
    "tech_stack": "Python, FastAPI, React, MySQL",
    "architecture": "Client-Server Architecture",
    "features": [
      "Feature 1",
      "Feature 2",
      "Feature 3",
      "Feature 4",
      "Feature 5"
    ]
  }}
]

Difficulty must be one of:

Beginner
Intermediate
Advanced
"""

    try:

        print("\n====================================")
        print("GENERATING PROJECTS")
        print("Skills:", skills_text)
        print("====================================")

        response = client.chat.completions.create(

            model=MODEL_NAME,

            temperature=0.8,

            max_tokens=3500,

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert software architect. "
                        "Return exactly 8 unique projects as valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        text = response.choices[0].message.content

        print("Groq response received.")

        parsed = parse_json_safely(text)

        # ----------------------------------------------------
        # Validate array
        # ----------------------------------------------------

        if not isinstance(parsed, list):

            raise ValueError(
                "Groq did not return a JSON array."
            )

        projects = []

        seen_titles = set()

        for item in parsed:

            project = normalize_project(item)

            if not project:
                continue

            title_key = (
                project["title"]
                .lower()
                .strip()
            )

            if title_key in seen_titles:
                continue

            seen_titles.add(title_key)

            projects.append(project)

        # ----------------------------------------------------
        # If AI generated less than 8,
        # fill remaining projects from fallback.
        # ----------------------------------------------------

        if len(projects) < 8:

            backup = fallback_projects(skills)

            for project in backup:

                title_key = (
                    project["title"]
                    .lower()
                    .strip()
                )

                if title_key not in seen_titles:

                    projects.append(project)

                    seen_titles.add(title_key)

                if len(projects) == 8:
                    break

        # ----------------------------------------------------
        # FINAL GUARANTEE
        # ----------------------------------------------------

        if len(projects) < 8:

            raise ValueError(
                "Unable to create 8 unique projects."
            )

        print(
            "Projects generated:",
            len(projects)
        )

        return projects[:8]

    except Exception as e:

        print(
            "PROJECT GENERATION ERROR:",
            repr(e)
        )

        # IMPORTANT:
        # Never return one project.
        # Always return 8 projects.

        return fallback_projects(skills)[:8]


# ============================================================
# NORMALIZE PROJECT GUIDE
# ============================================================

def normalize_guide(data, project_title):

    if not isinstance(data, dict):
        data = {}

    return {

        "project_title": project_title,

        "overview": safe_string(
            data.get("overview"),
            f"{project_title} is a complete software application."
        ),

        "recommended_stack": safe_string(
            data.get("recommended_stack"),
            "Python, FastAPI, React, SQL"
        ),

        "architecture": safe_string(
            data.get("architecture"),
            "Client-Server Architecture"
        ),

        "folder_structure": safe_string(
            data.get("folder_structure"),
            "frontend/\nbackend/\ndatabase/"
        ),

        "database": safe_string(
            data.get("database"),
            "Project-specific database entities."
        ),

        "apis": safe_list(
            data.get("apis")
        ),

        "development_phases": safe_list(
            data.get("development_phases")
        ),

        "steps": safe_list(
            data.get("steps")
        ),

        "testing": safe_list(
            data.get("testing")
        ),

        "deployment": safe_list(
            data.get("deployment")
        ),

        "advanced_features": safe_list(
            data.get("advanced_features")
        ),

        "resources": safe_list(
            data.get("resources")
        ),

        "resume_points": safe_list(
            data.get("resume_points")
        )
    }


# ============================================================
# PROJECT GUIDE
# ============================================================

def generate_project_guide(project_title):

    project_title = safe_string(
        project_title,
        "Software Project"
    )

    prompt = f"""
You are a senior software architect and technical mentor.

Create a COMPLETE and PROJECT-SPECIFIC development guide.

REQUESTED PROJECT:

{project_title}

VERY IMPORTANT:

The requested project is:

{project_title}

You MUST understand the project title and generate
content specifically for that project.

DO NOT replace it with:

- To-Do App
- Employee Management System
- E-commerce
- Student Management
- Hospital Management

unless the requested project is actually one of those.

For example:

If project = Food Delivery Application:

Use:
restaurants,
customers,
menus,
orders,
delivery,
payments,
delivery tracking.

If project = AI Resume Analyzer:

Use:
resume upload,
PDF parsing,
ATS analysis,
skill extraction,
AI analysis,
interview generation.

If project = Fitness Tracking Application:

Use:
users,
workouts,
exercise tracking,
calories,
progress,
goals.

If project = Online Learning Platform:

Use:
students,
instructors,
courses,
lessons,
assignments,
progress.

These examples are only references.

Generate content based on the ACTUAL project:

{project_title}

The database must be relevant to the project.

The APIs must be relevant to the project.

The folder structure must be relevant to the project.

The development steps must explain how to actually build
the project.

Include:

1. Project overview
2. Recommended technology stack
3. Architecture
4. Folder structure
5. Database design
6. API endpoints
7. Development phases
8. Detailed implementation steps
9. Testing
10. Deployment
11. Advanced features
12. Learning resources
13. Resume points

Return ONLY valid JSON.

Do NOT return markdown.

Do NOT use ```.

Return exactly:

{{
  "overview": "Project-specific overview",

  "recommended_stack": "Project-specific technology stack",

  "architecture": "Project-specific architecture",

  "folder_structure": "Project-specific folder structure",

  "database": "Project-specific database design",

  "apis": [
    "Project-specific API 1",
    "Project-specific API 2",
    "Project-specific API 3",
    "Project-specific API 4",
    "Project-specific API 5"
  ],

  "development_phases": [
    "Phase 1",
    "Phase 2",
    "Phase 3",
    "Phase 4"
  ],

  "steps": [
    "Implementation step 1",
    "Implementation step 2",
    "Implementation step 3",
    "Implementation step 4",
    "Implementation step 5",
    "Implementation step 6",
    "Implementation step 7",
    "Implementation step 8"
  ],

  "testing": [
    "Testing strategy 1",
    "Testing strategy 2",
    "Testing strategy 3",
    "Testing strategy 4"
  ],

  "deployment": [
    "Deployment step 1",
    "Deployment step 2",
    "Deployment step 3"
  ],

  "advanced_features": [
    "Advanced feature 1",
    "Advanced feature 2",
    "Advanced feature 3",
    "Advanced feature 4"
  ],

  "resources": [
    "Official documentation",
    "Learning resource",
    "GitHub/reference resource",
    "API/testing resource"
  ],

  "resume_points": [
    "Resume bullet 1",
    "Resume bullet 2",
    "Resume bullet 3"
  ]
}}
"""

    try:

        print(
            "\nGenerating guide for:",
            project_title
        )

        response = client.chat.completions.create(

            model=MODEL_NAME,

            temperature=0.2,

            max_tokens=5000,

            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior software architect. "
                        "Return ONLY valid JSON."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        text = response.choices[0].message.content

        parsed = parse_json_safely(text)

        if not isinstance(parsed, dict):

            raise ValueError(
                "Invalid project guide JSON."
            )

        guide = normalize_guide(
            parsed,
            project_title
        )

        # ----------------------------------------------------
        # Ensure arrays are never empty
        # ----------------------------------------------------

        if not guide["apis"]:

            slug = re.sub(
                r"[^a-zA-Z0-9]+",
                "-",
                project_title
            ).strip("-").lower()

            guide["apis"] = [
                f"POST /api/{slug}",
                f"GET /api/{slug}",
                f"GET /api/{slug}/:id",
                f"PUT /api/{slug}/:id",
                f"DELETE /api/{slug}/:id"
            ]

        if not guide["development_phases"]:

            guide["development_phases"] = [
                "Requirement analysis",
                "Architecture and database design",
                "Backend development",
                "Frontend development",
                "Integration and testing",
                "Deployment"
            ]

        if not guide["steps"]:

            guide["steps"] = [
                f"Analyze the requirements of {project_title}",
                "Identify users and core workflows",
                "Design the database",
                "Create the backend project",
                "Implement REST APIs",
                "Build frontend pages",
                "Connect frontend and backend",
                "Test and deploy"
            ]

        if not guide["testing"]:

            guide["testing"] = [
                "Unit testing",
                "API testing",
                "Integration testing",
                "End-to-end testing"
            ]

        if not guide["deployment"]:

            guide["deployment"] = [
                "Prepare production configuration",
                "Deploy frontend and backend",
                "Configure production database"
            ]

        if not guide["advanced_features"]:

            guide["advanced_features"] = [
                "Authentication",
                "Role-based authorization",
                "Logging and monitoring",
                "Cloud deployment"
            ]

        if not guide["resources"]:

            guide["resources"] = [
                "Official technology documentation",
                "YouTube implementation tutorials",
                "GitHub reference projects",
                "Postman API documentation"
            ]

        if not guide["resume_points"]:

            guide["resume_points"] = [
                f"Developed {project_title} using a modern software architecture",
                "Implemented REST APIs and database integration",
                "Tested and deployed the application"
            ]

        return guide

    except Exception as e:

        print(
            "PROJECT GUIDE ERROR:",
            repr(e)
        )

        # ----------------------------------------------------
        # Project-specific fallback
        # ----------------------------------------------------

        slug = re.sub(
            r"[^a-zA-Z0-9]+",
            "-",
            project_title
        ).strip("-").lower()

        return {

            "project_title": project_title,

            "overview": (
                f"{project_title} is a software application "
                f"designed to solve the real-world requirements "
                f"associated with {project_title}."
            ),

            "recommended_stack": (
                "React.js, JavaScript, Python FastAPI, SQL"
            ),

            "architecture": (
                f"{project_title} can use a layered "
                "client-server architecture with frontend, "
                "REST API, service and database layers."
            ),

            "folder_structure": f"""
{project_title}/
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── App.js
│
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   └── config/
│
├── database/
└── README.md
""",

            "database": (
                f"Create database entities that are directly "
                f"related to {project_title}. Define primary keys, "
                "foreign keys, relationships and indexes."
            ),

            "apis": [
                f"POST /api/{slug}",
                f"GET /api/{slug}",
                f"GET /api/{slug}/:id",
                f"PUT /api/{slug}/:id",
                f"DELETE /api/{slug}/:id"
            ],

            "development_phases": [
                "Requirement analysis",
                "Architecture and database design",
                "Backend development",
                "Frontend development",
                "Integration and testing",
                "Deployment"
            ],

            "steps": [
                f"Define the requirements for {project_title}",
                "Identify users and application workflows",
                "Design database entities and relationships",
                "Create the backend project",
                "Implement REST APIs",
                "Build frontend pages",
                "Connect frontend and backend",
                "Test and deploy the application"
            ],

            "testing": [
                "Unit testing",
                "REST API testing",
                "Integration testing",
                "End-to-end testing"
            ],

            "deployment": [
                "Prepare production configuration",
                "Deploy frontend and backend",
                "Configure production database"
            ],

            "advanced_features": [
                "Authentication",
                "Role-based authorization",
                "Logging and monitoring",
                "Cloud deployment"
            ],

            "resources": [
                "Official framework documentation",
                "YouTube implementation tutorials",
                "GitHub reference projects",
                "Postman API documentation"
            ],

            "resume_points": [
                f"Developed {project_title} using a full-stack architecture",
                "Implemented REST APIs and database integration",
                "Tested and deployed the application"
            ]
        }