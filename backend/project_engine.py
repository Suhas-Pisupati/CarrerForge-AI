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
    """
    Skill-aware offline project fallback.
    No project uses technologies that are absent from the candidate skill list.
    """
    skills = [str(s).strip() for s in (skills or []) if str(s).strip()]
    lower = {s.lower() for s in skills}
    has = lambda *names: any(n.lower() in lower for n in names)

    projects = []

    if has("financial analysis", "finance", "excel", "advanced excel", "power bi", "sql"):
        projects.extend([
            {
                "title": "Financial Performance Analytics Dashboard",
                "difficulty": "Intermediate",
                "tech_stack": ", ".join([s for s in skills if s.lower() in {"financial analysis","finance","excel","advanced excel","power bi","sql"}]) or "Financial Analysis, Excel, Power BI",
                "architecture": "Analytics Dashboard",
                "features": ["Revenue and expense analysis", "KPI tracking", "Trend analysis", "Interactive reporting", "Management insights"]
            },
            {
                "title": "Personal Finance & Budget Analysis",
                "difficulty": "Beginner",
                "tech_stack": ", ".join([s for s in skills if s.lower() in {"finance","financial analysis","excel","advanced excel"}]) or "Finance, Excel",
                "architecture": "Data Analysis Workflow",
                "features": ["Income tracking", "Expense categorization", "Budget variance analysis", "Monthly summaries", "Financial insights"]
            },
        ])

    if has("marketing management", "marketing", "digital marketing", "market research", "market analysis"):
        projects.extend([
            {
                "title": "Customer & Market Research Analytics",
                "difficulty": "Intermediate",
                "tech_stack": ", ".join([s for s in skills if s.lower() in {"market research","market analysis","data analysis","excel","power bi","marketing management"}]) or "Market Research, Data Analysis, Excel",
                "architecture": "Research and Analytics Workflow",
                "features": ["Customer segmentation", "Survey analysis", "Preference trends", "Market comparison", "Recommendation reporting"]
            },
            {
                "title": "Marketing Campaign Performance Tracker",
                "difficulty": "Intermediate",
                "tech_stack": ", ".join([s for s in skills if s.lower() in {"marketing","digital marketing","excel","power bi","data analysis"}]) or "Marketing, Excel, Data Analysis",
                "architecture": "Analytics Dashboard",
                "features": ["Campaign tracking", "Conversion analysis", "Channel comparison", "KPI reporting", "Performance trends"]
            },
        ])

    if has("business management", "business strategy", "business analytics", "project management", "crm"):
        projects.extend([
            {
                "title": "Business KPI & Decision Support Dashboard",
                "difficulty": "Advanced",
                "tech_stack": ", ".join([s for s in skills if s.lower() in {"business analytics","business strategy","business management","power bi","excel","sql","data analysis"}]) or "Business Analytics, Excel, Power BI",
                "architecture": "Business Intelligence Dashboard",
                "features": ["KPI monitoring", "Goal tracking", "Trend analysis", "Decision support", "Management reporting"]
            },
            {
                "title": "CRM Customer Relationship Analytics",
                "difficulty": "Intermediate",
                "tech_stack": ", ".join([s for s in skills if s.lower() in {"crm","customer research","data analysis","excel","power bi"}]) or "CRM, Data Analysis, Excel",
                "architecture": "Customer Analytics Workflow",
                "features": ["Customer segmentation", "Interaction tracking", "Retention analysis", "Customer insights", "Performance reporting"]
            },
        ])

    if has("sales", "sales analysis", "sales reporting", "sales & business development", "business development"):
        projects.append({
            "title": "Sales Performance & Lead Analytics",
            "difficulty": "Intermediate",
            "tech_stack": ", ".join([s for s in skills if s.lower() in {"sales","sales analysis","sales reporting","business development","lead generation","excel","power bi","sql"}]) or "Sales Analysis, Excel, Power BI",
            "architecture": "Sales Analytics Dashboard",
            "features": ["Lead tracking", "Sales funnel analysis", "Representative performance", "Monthly reporting", "Conversion trends"]
        })

    if has("operations management", "operations"):
        projects.append({
            "title": "Operations Efficiency Analytics",
            "difficulty": "Advanced",
            "tech_stack": ", ".join([s for s in skills if s.lower() in {"operations management","operations","data analysis","excel","power bi"}]) or "Operations Management, Data Analysis, Excel",
            "architecture": "Operations Analytics Workflow",
            "features": ["Process KPI tracking", "Bottleneck analysis", "Efficiency trends", "Resource reporting", "Improvement recommendations"]
        })

    # Technical project fallbacks preserve the original feature for technical resumes.
    if has("python", "flask", "django", "fastapi", "react", "javascript", "java", "sql"):
        projects.extend([
            {
                "title": "Skill-Based Career Analytics Platform",
                "difficulty": "Advanced",
                "tech_stack": ", ".join(skills),
                "architecture": "Client-Server Architecture",
                "features": ["Skill profiling", "Analytics", "Recommendation workflow", "Search and filtering", "Reporting"]
            },
            {
                "title": "Resume & Job Match Analytics",
                "difficulty": "Advanced",
                "tech_stack": ", ".join(skills),
                "architecture": "Full-Stack Analytics Architecture",
                "features": ["Resume analysis", "Skill matching", "Job search", "Match reporting", "Dashboard"]
            },
        ])

    # Generic but still current-skill-only fallback.
    if not projects and skills:
        projects = [
            {
                "title": f"{skills[0]} Practical Analytics Project",
                "difficulty": "Beginner",
                "tech_stack": ", ".join(skills),
                "architecture": "Skill-Based Workflow",
                "features": [
                    f"Practical use of {skills[0]}",
                    "Data/input collection",
                    "Analysis or processing",
                    "Results reporting",
                    "Performance tracking"
                ]
            }
        ]

    # Guarantee 8 cards without inventing technologies.
    base = list(projects)
    index = 1
    while len(projects) < 8 and base:
        source = base[(len(projects) - len(base)) % len(base)]
        clone = dict(source)
        clone["title"] = f"{source['title']} – Use Case {index}"
        projects.append(clone)
        index += 1

    return projects[:8]


# ============================================================
# PROJECT RECOMMENDATIONS
# ============================================================

def generate_projects(skills):
    skills = [str(s).strip() for s in (skills or []) if str(s).strip()]
    if not skills:
        return []

    skills_text = ", ".join(skills)

    prompt = f"""
You are an expert project recommender.

Generate EXACTLY 8 different project ideas for the candidate.

CURRENT RESUME SKILLS:
{skills_text}

Rules:
1. Every project must directly use one or more current skills.
2. Do not introduce a technology that is not listed.
3. Do not use Python, Java, SQL, React, FastAPI or other technologies
   unless they appear in the current skill list.
4. For business/finance/marketing resumes, generate business analytics,
   finance, marketing, operations, CRM or reporting projects as relevant.
5. For technical resumes, generate technical software projects as relevant.
6. Projects must solve different real-world problems.
7. Include Beginner, Intermediate and Advanced difficulty where appropriate.
8. Return ONLY valid JSON.
9. Exactly 8 objects.

Format:
[
  {{
    "title": "Project title",
    "difficulty": "Beginner",
    "tech_stack": "Only current skills used by the project",
    "architecture": "Relevant architecture/workflow",
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"]
  }}
]
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.6,
            max_tokens=3500,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Return exactly 8 project recommendations based only "
                        "on the supplied current-resume skills."
                    )
                },
                {"role": "user", "content": prompt}
            ]
        )

        parsed = parse_json_safely(response.choices[0].message.content or "")
        if not isinstance(parsed, list):
            raise ValueError("Invalid project JSON")

        projects = []
        seen = set()

        for item in parsed:
            project = normalize_project(item)
            if not project:
                continue

            title_key = project["title"].lower().strip()
            if title_key in seen:
                continue

            # Reject obvious technology leakage.
            stack = str(project.get("tech_stack", "")).lower()
            features = " ".join(project.get("features", [])).lower()
            combined = stack + " " + features

            allowed = {s.lower() for s in skills}
            leaked = False
            for forbidden in ["python", "java", "sql", "javascript", "react", "fastapi", "django", "flask"]:
                if forbidden in combined and forbidden not in allowed:
                    leaked = True
                    break

            if leaked:
                continue

            projects.append(project)
            seen.add(title_key)

        if len(projects) < 8:
            backup = fallback_projects(skills)
            for project in backup:
                key = project["title"].lower().strip()
                if key not in seen:
                    projects.append(project)
                    seen.add(key)
                if len(projects) >= 8:
                    break

        return projects[:8]

    except Exception as e:
        print("PROJECT GENERATION ERROR:", repr(e))
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

def generate_project_guide(project_title, skills=None):

    project_title = safe_string(
        project_title,
        "Software Project"
    )

    skills = [str(s).strip() for s in (skills or []) if str(s).strip()]
    skills_text = ", ".join(skills) if skills else "No resume skills supplied"

    prompt = f"""
You are a senior software architect and technical mentor.

Create a COMPLETE and PROJECT-SPECIFIC development guide.

REQUESTED PROJECT:

{project_title}

CURRENT RESUME SKILLS:

{skills_text}

If resume skills are supplied, use them when recommending the stack and implementation approach. Do not invent unlisted technologies when the project can be built using the supplied skills.

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
                skills_text
                if skills_text != "No resume skills supplied"
                else "Use the technologies required by the selected project."
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
                f"Create database entities directly related to {project_title}. "
                f"Use the current resume skills where applicable: {skills_text}. "
                "Define primary keys, foreign keys, relationships and indexes where a database is required."
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