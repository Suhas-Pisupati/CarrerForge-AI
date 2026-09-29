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
        "GROQ_API_KEY is missing. "
        "Add GROQ_API_KEY to your .env file."
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
# COMMON GROQ FUNCTION
# ============================================================

def call_groq(
    prompt,
    system_message=None,
    temperature=0.2,
    max_tokens=4000
):
    """
    Common Groq API request.
    """

    messages = []

    if system_message:
        messages.append({
            "role": "system",
            "content": system_message
        })

    messages.append({
        "role": "user",
        "content": prompt
    })

    response = client.chat.completions.create(
        model=MODEL_NAME,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=messages
    )

    return response.choices[0].message.content


# ============================================================
# CLEAN MODEL RESPONSE
# ============================================================

def clean_model_text(text):

    if not text:
        return ""

    text = str(text).strip()

    # Remove JSON markdown
    text = re.sub(
        r"```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Remove normal markdown code blocks
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
    # FIND JSON ARRAY
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

                        candidate = text[
                            start:i + 1
                        ]

                        try:
                            return json.loads(candidate)

                        except Exception:
                            pass

    # --------------------------------------------------------
    # FIND JSON OBJECT
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

                        candidate = text[
                            start:i + 1
                        ]

                        try:
                            return json.loads(candidate)

                        except Exception:
                            pass

    return None


# ============================================================
# SAFE STRING
# ============================================================

def safe_string(
    value,
    default=""
):

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

    # --------------------------------------------------------
    # LIST
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # STRING
    # --------------------------------------------------------

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
# NORMALIZE SKILL
# ============================================================

def normalize_skill(skill):

    if not skill:
        return ""

    skill = str(skill).strip()

    skill = re.sub(
        r"^[-•*]\s*",
        "",
        skill
    )

    skill = re.sub(
        r"^\d+[.)]\s*",
        "",
        skill
    )

    skill = re.sub(
        r"\s+",
        " ",
        skill
    )

    return skill.strip()


# ============================================================
# EXTRACT SKILLS
# ============================================================

def extract_skills(resume_text):

    if not resume_text or not resume_text.strip():
        return []

    prompt = f"""
You are a strict resume skill extraction system.

Extract ONLY skills that are explicitly mentioned
in the resume.

IMPORTANT RULES:

1. Do NOT infer skills.
2. Do NOT guess skills.
3. Do NOT recommend skills.
4. Do NOT add common programming languages unless
   explicitly mentioned.
5. Do NOT add Python unless Python appears in the resume.
6. Do NOT add Java unless Java appears in the resume.
7. Do NOT add SQL unless SQL appears in the resume.
8. Include technical skills.
9. Include software/tools.
10. Include analytical/business skills when explicitly listed.
11. Include soft skills when explicitly listed.
12. Do not include degree names as skills.
13. Do not include company names.
14. Do not include job titles.
15. Do not include locations.
16. Do not include generic words such as "graduate".
17. Preserve the skill wording from the resume where possible.
18. Remove duplicate skills.
19. Return ONLY a JSON array.
20. No markdown.
21. No explanation.

Example:

Resume:

TECHNICAL SKILLS
Python, SQL, Excel, Power BI

SOFT SKILLS
Leadership, Communication

Return:

[
    "Python",
    "SQL",
    "Excel",
    "Power BI",
    "Leadership",
    "Communication"
]

RESUME:
{resume_text}
"""

    try:

        raw = call_groq(
            prompt,
            system_message=(
                "You are a strict resume parser. "
                "Never invent skills. "
                "Return only explicitly stated skills."
            ),
            temperature=0,
            max_tokens=2500
        )

        parsed = parse_json_safely(raw)

        if not isinstance(parsed, list):
            return []

        skills = []

        for item in parsed:

            skill = normalize_skill(item)

            if not skill:
                continue

            # ------------------------------------------------
            # VERIFY SKILL EXISTS IN RESUME
            # ------------------------------------------------

            if skill.lower() not in resume_text.lower():
                continue

            # ------------------------------------------------
            # REMOVE DUPLICATES
            # ------------------------------------------------

            if skill.lower() not in [
                existing.lower()
                for existing in skills
            ]:

                skills.append(skill)

        print(
            "EXTRACTED SKILLS:",
            skills
        )

        return skills

    except Exception as e:

        print(
            "SKILL EXTRACTION ERROR:",
            repr(e)
        )

        return []


# ============================================================
# ATS ANALYSIS
# ============================================================

def analyze_resume(resume_text):

    if not resume_text or not resume_text.strip():

        return {
            "ats_score": 40,
            "analysis_text": "Resume text is empty."
        }

    prompt = f"""
Analyze this resume like an ATS system.

Evaluate:

- Resume structure
- Relevant technical skills
- Keywords
- Projects
- Education
- Experience
- ATS readability
- Job relevance

Return ONLY:

ATS Score: number between 40 and 95

Resume:
{resume_text}
"""

    try:

        content = call_groq(
            prompt,
            system_message=(
                "You are an ATS resume scoring system. "
                "Return a realistic score between 40 and 95."
            ),
            temperature=0,
            max_tokens=700
        )

        # First search specifically for ATS Score
        match = re.search(
            r"ATS\s*Score\s*:\s*(\d{2,3})",
            content,
            re.IGNORECASE
        )

        # Backup search
        if not match:

            match = re.search(
                r"\b(\d{2,3})\b",
                content
            )

        if match:

            score = int(
                match.group(1)
            )

            score = max(
                40,
                min(score, 95)
            )

        else:

            score = 65

        return {
            "ats_score": score,
            "analysis_text": content
        }

    except Exception as e:

        print(
            "ATS ANALYSIS ERROR:",
            repr(e)
        )

        return {
            "ats_score": 65,
            "analysis_text": (
                "Unable to complete ATS analysis."
            )
        }


# ============================================================
# INTERVIEW QUESTIONS
# ============================================================

def _normalize_skill_list(skills):
    if not skills:
        return []
    if isinstance(skills, str):
        skills = [skills]
    result = []
    seen = set()
    for skill in skills:
        value = normalize_skill(skill)
        if not value:
            continue
        key = value.lower()
        if key not in seen:
            result.append(value)
            seen.add(key)
    return result


def _fallback_interview_questions(skills):
    """
    Skill-specific fallback used when the AI service is unavailable.
    It never introduces a technology that is not in the current resume.
    """
    skills = _normalize_skill_list(skills)
    if not skills:
        return {
            "beginner": [],
            "intermediate": [],
            "advanced": []
        }

    beginner, intermediate, advanced = [], [], []

    for skill in skills:
        beginner.extend([
            {
                "question": f"What is {skill} and what is it used for?",
                "answer": f"{skill} is a skill mentioned in the resume. Explain its purpose and common use cases."
            },
            {
                "question": f"What are the main concepts of {skill}?",
                "answer": f"Describe the core concepts of {skill} and how they are used."
            },
            {
                "question": f"Where would you use {skill} in a real business or project scenario?",
                "answer": f"Give a practical scenario where {skill} would help solve a problem."
            },
            {
                "question": f"What are common tasks performed using {skill}?",
                "answer": f"Describe a few practical tasks that can be performed using {skill}."
            },
            {
                "question": f"What are the benefits of using {skill}?",
                "answer": f"Explain the main benefits of using {skill} for the relevant task."
            }
        ])
        intermediate.extend([
            {
                "question": f"How would you apply {skill} to solve a real-world problem?",
                "answer": f"Explain the workflow, inputs, process and expected outcome when using {skill}."
            },
            {
                "question": f"What challenges can occur when working with {skill}?",
                "answer": f"Discuss common implementation or usage challenges and how you would address them."
            },
            {
                "question": f"How would you measure the quality of work done using {skill}?",
                "answer": f"Identify suitable metrics, validation steps or business outcomes."
            },
            {
                "question": f"How would you improve an existing process that uses {skill}?",
                "answer": f"Explain how you would identify bottlenecks and improve the process."
            },
            {
                "question": f"Describe a practical workflow involving {skill}.",
                "answer": f"Explain the workflow from requirements through execution and reporting."
            }
        ])
        advanced.extend([
            {
                "question": f"How would you design a scalable process around {skill}?",
                "answer": f"Discuss scalability, quality control, monitoring and maintainability for {skill}."
            },
            {
                "question": f"How would you troubleshoot a problem involving {skill}?",
                "answer": f"Explain a structured approach to isolate the issue, validate assumptions and implement a fix."
            },
            {
                "question": f"How would you evaluate different approaches when using {skill}?",
                "answer": f"Compare approaches using requirements, cost, quality, accuracy, time and maintainability."
            },
            {
                "question": f"How can {skill} support better decision-making?",
                "answer": f"Explain how outputs from {skill} can be validated and converted into useful decisions."
            },
            {
                "question": f"What risks should be considered when using {skill} in an organization?",
                "answer": f"Discuss accuracy, process, security, compliance or business risks relevant to {skill}."
            }
        ])

    def unique(items):
        out, seen = [], set()
        for item in items:
            key = item["question"].lower()
            if key not in seen:
                out.append(item)
                seen.add(key)
        return out

    return {
        "beginner": unique(beginner)[:10],
        "intermediate": unique(intermediate)[:10],
        "advanced": unique(advanced)[:10]
    }


def generate_interview_questions(skills):
    """
    Generate interview questions from the CURRENT resume skills.

    The caller should pass the skills extracted from the newly uploaded
    resume. A resume text is intentionally not used as the source of
    technology selection here, which prevents stale/default technologies.
    """
    skills = _normalize_skill_list(skills)

    if not skills:
        return {
            "beginner": [],
            "intermediate": [],
            "advanced": []
        }

    skills_text = ", ".join(skills)

    prompt = f"""
You are an expert interview preparation system.

Generate exactly 10 questions WITH short answers for each level:
Beginner, Intermediate and Advanced.

CURRENT CANDIDATE SKILLS:
{skills_text}

STRICT RULES:
1. Use ONLY the skills listed above.
2. Every question must clearly relate to at least one listed skill.
3. Never introduce Python, Java, SQL, JavaScript, C, C++, DSA, OOP,
   cloud platforms or any other technology unless it is listed above.
4. Do not use skills from previous candidates.
5. Do not infer a technology merely because it is commonly paired with
   another skill.
6. Mix the listed skills so the questions reflect this candidate.
7. Beginner questions should test fundamentals.
8. Intermediate questions should test practical application.
9. Advanced questions should test problem solving, trade-offs and real use.
10. Answers must be concise and directly answer the question.
11. Return ONLY valid JSON.
12. No markdown.
13. Exactly 10 items per level.

JSON:
{{
  "beginner": [{{"question":"...","answer":"..."}}],
  "intermediate": [{{"question":"...","answer":"..."}}],
  "advanced": [{{"question":"...","answer":"..."}}]
}}
"""

    try:
        content = call_groq(
            prompt,
            system_message=(
                "You generate interview preparation from the supplied "
                "current-resume skill list only. Never add unlisted skills."
            ),
            temperature=0.2,
            max_tokens=6500
        )

        data = parse_json_safely(content)

        if not isinstance(data, dict):
            raise ValueError("Invalid interview JSON")

        result = {}

        for level in ["beginner", "intermediate", "advanced"]:
            items = data.get(level)
            if not isinstance(items, list):
                raise ValueError(f"Missing {level} questions")

            valid = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                question = safe_string(item.get("question"))
                answer = safe_string(item.get("answer"))
                if question and answer:
                    valid.append({
                        "question": question,
                        "answer": answer
                    })

            if len(valid) < 10:
                raise ValueError(f"Less than 10 valid {level} questions")

            result[level] = valid[:10]

        return result

    except Exception as e:
        print("INTERVIEW GENERATION ERROR:", repr(e))
        return _fallback_interview_questions(skills)


# ============================================================
# RESUME IMPROVER
# ============================================================

def generate_new_resume(resume_text):

    prompt = f"""
Rewrite this resume professionally.

Sections:

Summary
Skills
Projects
Education
Experience

IMPORTANT:

- Preserve factual information.
- Do not invent experience.
- Do not invent projects.
- Do not invent technologies.
- Improve grammar.
- Make it ATS-friendly.
- Use concise professional bullet points.
- Keep the candidate's actual information.

Resume:
{resume_text}
"""

    try:

        return call_groq(
            prompt,
            system_message=(
                "You are a professional ATS resume writer. "
                "Never invent candidate information."
            ),
            temperature=0.3,
            max_tokens=5000
        )

    except Exception as e:

        print(
            "RESUME IMPROVER ERROR:",
            repr(e)
        )

        return resume_text


# ============================================================
# JOB ROLES
# ============================================================

def extract_job_roles(skills=None, resume_text=""):
    """
    Match job roles to the CURRENT resume skills.
    Deterministic domain matching is used first so a new business resume
    cannot accidentally inherit a software-engineering role.
    """
    if isinstance(skills, str) and not resume_text:
        resume_text = skills
        try:
            from resume_parser import extract_skills as parser_extract_skills
            skills = parser_extract_skills(resume_text)
        except Exception:
            skills = []

    skills = _normalize_skill_list(skills)

    if not skills and resume_text:
        try:
            from resume_parser import extract_skills as parser_extract_skills
            skills = parser_extract_skills(resume_text)
        except Exception:
            skills = []

    if not skills:
        return []

    lower = {s.lower() for s in skills}
    roles = []

    def add(*values):
        for value in values:
            if value.lower() not in {r.lower() for r in roles}:
                roles.append(value)

    technical = any(s in lower for s in {
        "python", "java", "c", "c++", "c#", "javascript",
        "typescript", "php", "go", "r", "react", "node.js",
        "express.js", "flask", "django", "fastapi", "sql",
        "mysql", "postgresql", "mongodb", "pandas", "numpy",
        "machine learning", "deep learning", "artificial intelligence",
        "tensorflow", "keras", "pytorch", "opencv"
    })

    business = any(s in lower for s in {
        "business management", "financial analysis", "finance",
        "marketing management", "marketing", "business strategy",
        "market research", "market analysis", "sales",
        "sales analysis", "sales reporting", "business development",
        "sales & business development", "operations management",
        "crm", "business analytics", "data analysis", "data analytics",
        "project management", "digital marketing"
    })

    if any(s in lower for s in {"financial analysis", "finance"}):
        add("Financial Analyst", "Finance Analyst")

    if any(s in lower for s in {
        "marketing management", "marketing", "digital marketing",
        "market research", "market analysis"
    }):
        add("Marketing Analyst", "Market Research Analyst")

    if any(s in lower for s in {
        "business management", "business strategy", "business analytics",
        "business development", "sales & business development", "crm"
    }):
        add("Business Analyst", "Business Development Analyst")

    if any(s in lower for s in {
        "operations management", "operations"
    }):
        add("Operations Analyst")

    if any(s in lower for s in {
        "data analysis", "data analytics", "excel", "advanced excel",
        "power bi", "tableau", "pivot tables", "sql"
    }):
        add("Data Analyst", "Business Intelligence Analyst")

    if any(s in lower for s in {
        "sales", "sales analysis", "sales reporting",
        "sales & business development", "lead generation"
    }):
        add("Sales Analyst")

    if technical:
        if any(s in lower for s in {"python", "java", "c", "c++", "c#", "javascript", "typescript"}):
            add("Software Engineer")
        if any(s in lower for s in {"python", "flask", "django", "fastapi", "node.js", "express.js"}):
            add("Backend Developer")
        if any(s in lower for s in {"machine learning", "deep learning", "artificial intelligence", "tensorflow", "keras", "pytorch"}):
            add("Machine Learning Engineer", "AI Engineer")
        if any(s in lower for s in {"pandas", "numpy", "matplotlib", "seaborn", "power bi", "tableau", "sql", "data analysis"}):
            add("Data Analyst")
        if any(s in lower for s in {"react", "javascript", "html", "css"}):
            add("Frontend Developer")

    # If the current skill mix does not map cleanly, ask the AI only to fill
    # missing roles. It receives the current skills and nothing from history.
    if len(roles) < 5:
        skills_text = ", ".join(skills)
        prompt = f"""
Match job roles to these CURRENT resume skills only:

{skills_text}

Return a JSON array of up to 5 additional relevant job roles.
Do not return Software Engineer unless a programming/software skill
is explicitly present. Do not use roles from any previous candidate.
"""
        try:
            content = call_groq(
                prompt,
                system_message="Return roles only for the supplied current skills.",
                temperature=0.1,
                max_tokens=600
            )
            parsed = parse_json_safely(content)
            if isinstance(parsed, list):
                for role in parsed:
                    value = safe_string(role)
                    if value:
                        add(value)
                    if len(roles) >= 5:
                        break
        except Exception as e:
            print("JOB ROLE AI FILL ERROR:", repr(e))

    if not roles:
        add("Analyst" if business else "Technical Analyst")

    return roles[:5]


# ============================================================
# INTERVIEW CHATBOT
# ============================================================

def interview_chatbot(
    resume_text,
    user_message
):

    user_message = safe_string(
        user_message,
        "technical interview"
    )

    prompt = f"""
You are an expert technical interviewer.

Generate exactly 5 interview questions WITH answers.

Topic:
{user_message}

Resume:
{resume_text}

STRICT RULES:

1. Questions MUST follow the user's topic.
2. If user asks Spring Boot, give Spring Boot only.
3. If user asks Python, give Python only.
4. If user asks SQL, give SQL only.
5. Return exactly 5 questions.
6. Return JSON only.
7. No markdown.
8. No explanation.
9. Answers must be concise and professional.

JSON format:

{{
  "type": "interview",
  "items": [
    {{
      "question": "What is Spring Boot?",
      "answer": "Spring Boot simplifies Spring application development."
    }}
  ]
}}
"""

    try:

        content = call_groq(
            prompt,
            system_message=(
                "You are a technical interview chatbot. "
                "Follow the requested topic exactly."
            ),
            temperature=0.3,
            max_tokens=3000
        )

        data = parse_json_safely(
            content
        )

        if (
            isinstance(data, dict)
            and data.get("type") == "interview"
            and isinstance(
                data.get("items"),
                list
            )
        ):

            valid_items = []

            for item in data["items"]:

                if not isinstance(
                    item,
                    dict
                ):
                    continue

                question = safe_string(
                    item.get("question")
                )

                answer = safe_string(
                    item.get("answer")
                )

                if question and answer:

                    valid_items.append(
                        {
                            "question": question,
                            "answer": answer
                        }
                    )

            if valid_items:

                return {
                    "type": "interview",
                    "items": valid_items[:5]
                }

    except Exception as e:

        print(
            "INTERVIEW CHATBOT ERROR:",
            repr(e)
        )

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    return {

        "type": "interview",

        "items": [

            {
                "question": (
                    f"What is {user_message}?"
                ),
                "answer": (
                    f"{user_message} is a technical "
                    "concept used in software development."
                )
            },

            {
                "question": (
                    f"Why is {user_message} important?"
                ),
                "answer": (
                    f"{user_message} can help developers "
                    "build maintainable and scalable applications."
                )
            },

            {
                "question": (
                    f"What are the main features of {user_message}?"
                ),
                "answer": (
                    f"The main features depend on the "
                    f"use case and implementation of {user_message}."
                )
            },

            {
                "question": (
                    f"How is {user_message} used in projects?"
                ),
                "answer": (
                    f"{user_message} can be applied as "
                    "part of a software development workflow."
                )
            },

            {
                "question": (
                    f"What are common challenges with {user_message}?"
                ),
                "answer": (
                    "Common challenges include implementation, "
                    "performance, testing, and maintainability."
                )
            }

        ]
    }


# ============================================================
# JOB CHATBOT
# ============================================================

def job_chatbot(
    resume_text,
    user_message
):

    prompt = f"""
You are an AI job recommendation engine.

Based on:

1. Candidate resume
2. User request

Generate EXACTLY 5 fresher job search results.

Resume:
{resume_text}

User Request:
{user_message}

STRICT RULES:

- Return ONLY JSON.
- No explanation.
- No markdown.
- No headings.
- No extra text.
- Jobs must match resume skills.
- Use realistic India locations.
- Do not claim a specific company currently has
  an opening unless verified.
- Use job-search URLs when a specific listing
  cannot be verified.
- Apply links must be valid URL strings.
- Return exactly 5 jobs.

JSON format:

{{
  "type": "jobs",
  "items": [
    {{
      "role": "Python Developer",
      "company": "Job Search",
      "location": "Bangalore",
      "apply_link": "https://www.linkedin.com/jobs/search/?keywords=python%20developer"
    }}
  ]
}}
"""

    try:

        content = call_groq(
            prompt,
            system_message=(
                "You are an AI job search assistant. "
                "Do not fabricate verified job openings. "
                "Use job-search URLs when necessary."
            ),
            temperature=0.2,
            max_tokens=3000
        )

        data = parse_json_safely(
            content
        )

        if (
            isinstance(data, dict)
            and data.get("type") == "jobs"
            and isinstance(
                data.get("items"),
                list
            )
        ):

            valid_items = []

            for item in data["items"]:

                if not isinstance(
                    item,
                    dict
                ):
                    continue

                role = safe_string(
                    item.get("role")
                )

                company = safe_string(
                    item.get("company"),
                    "Job Search"
                )

                location = safe_string(
                    item.get("location"),
                    "India"
                )

                apply_link = safe_string(
                    item.get("apply_link")
                )

                if (
                    role
                    and location
                    and apply_link
                    and apply_link.startswith("http")
                ):

                    valid_items.append(
                        {
                            "role": role,
                            "company": company,
                            "location": location,
                            "apply_link": apply_link
                        }
                    )

            if len(valid_items) >= 5:

                return {
                    "type": "jobs",
                    "items": valid_items[:5]
                }

    except Exception as e:

        print(
            "JOB CHATBOT ERROR:",
            repr(e)
        )

    # --------------------------------------------------------
    # SAFE FALLBACK
    # --------------------------------------------------------

    return {

        "type": "jobs",

        "items": [

            {
                "role": "Python Developer",
                "company": "Job Search",
                "location": "Bangalore",
                "apply_link": (
                    "https://www.linkedin.com/jobs/search/"
                    "?keywords=python%20developer"
                )
            },

            {
                "role": "Backend Developer",
                "company": "Job Search",
                "location": "Hyderabad",
                "apply_link": (
                    "https://www.linkedin.com/jobs/search/"
                    "?keywords=backend%20developer"
                )
            },

            {
                "role": "Software Engineer",
                "company": "Job Search",
                "location": "Chennai",
                "apply_link": (
                    "https://www.linkedin.com/jobs/search/"
                    "?keywords=software%20engineer%20fresher"
                )
            },

            {
                "role": "SQL Developer",
                "company": "Job Search",
                "location": "Pune",
                "apply_link": (
                    "https://www.linkedin.com/jobs/search/"
                    "?keywords=sql%20developer"
                )
            },

            {
                "role": "Machine Learning Engineer",
                "company": "Job Search",
                "location": "Bangalore",
                "apply_link": (
                    "https://www.linkedin.com/jobs/search/"
                    "?keywords=machine%20learning%20engineer%20fresher"
                )
            }

        ]
    }


# ============================================================
# NORMALIZE PROJECT
# ============================================================

def normalize_project(project):

    if not isinstance(
        project,
        dict
    ):
        return None

    title = safe_string(
        project.get("title"),
        "Software Project"
    )

    difficulty = safe_string(
        project.get("difficulty"),
        "Intermediate"
    )

    if difficulty not in [
        "Beginner",
        "Intermediate",
        "Advanced"
    ]:

        difficulty = "Intermediate"

    tech_stack = safe_string(
        project.get("tech_stack"),
        "Based on candidate skills"
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
            "Core application workflow",
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
# DYNAMIC FALLBACK PROJECTS
# ============================================================

def fallback_projects(skills):

    skills = skills or []

    skills_text = ", ".join(
        skills
    )

    if not skills_text:
        skills_text = (
            "No specific skills detected"
        )

    return [

        {
            "title": "Business Analytics Dashboard",
            "difficulty": "Beginner",
            "tech_stack": skills_text,
            "architecture": "Analytics Dashboard Architecture",
            "features": [
                "Data collection",
                "Data analysis",
                "Interactive reports",
                "Business insights",
                "Charts and dashboards",
                "Exportable reports"
            ]
        },

        {
            "title": "Customer Insights Platform",
            "difficulty": "Intermediate",
            "tech_stack": skills_text,
            "architecture": "Client-Server Architecture",
            "features": [
                "Customer data management",
                "Customer analysis",
                "Feedback tracking",
                "Trend identification",
                "Reports",
                "Dashboard"
            ]
        },

        {
            "title": "Sales Performance Analyzer",
            "difficulty": "Intermediate",
            "tech_stack": skills_text,
            "architecture": "Analytics Architecture",
            "features": [
                "Sales tracking",
                "Performance analysis",
                "Monthly reports",
                "Sales trends",
                "Performance dashboard",
                "Business insights"
            ]
        },

        {
            "title": "Market Research Management System",
            "difficulty": "Intermediate",
            "tech_stack": skills_text,
            "architecture": "Client-Server Architecture",
            "features": [
                "Survey management",
                "Customer responses",
                "Market analysis",
                "Trend analysis",
                "Reports",
                "Dashboard"
            ]
        },

        {
            "title": "Financial Analysis Dashboard",
            "difficulty": "Intermediate",
            "tech_stack": skills_text,
            "architecture": "Analytics Architecture",
            "features": [
                "Financial data management",
                "Revenue analysis",
                "Expense analysis",
                "Financial reports",
                "Charts",
                "Dashboard"
            ]
        },

        {
            "title": "Business Operations Tracker",
            "difficulty": "Intermediate",
            "tech_stack": skills_text,
            "architecture": "Business Management Architecture",
            "features": [
                "Operations tracking",
                "Task management",
                "Performance metrics",
                "Reports",
                "Analytics",
                "Dashboard"
            ]
        },

        {
            "title": "Employee Performance Analytics",
            "difficulty": "Advanced",
            "tech_stack": skills_text,
            "architecture": "Analytics Client-Server Architecture",
            "features": [
                "Employee records",
                "Performance tracking",
                "Analytics",
                "Reports",
                "Department comparison",
                "Management dashboard"
            ]
        },

        {
            "title": "Business Decision Support System",
            "difficulty": "Advanced",
            "tech_stack": skills_text,
            "architecture": "Decision Support Architecture",
            "features": [
                "Business data analysis",
                "KPI tracking",
                "Trend analysis",
                "Decision support",
                "Reports",
                "Management dashboard"
            ]
        }

    ]


# ============================================================
# PROJECT RECOMMENDATIONS
# ============================================================

def generate_projects(skills):

    if isinstance(
        skills,
        str
    ):
        skills = [skills]

    skills = [
        normalize_skill(skill)
        for skill in (skills or [])
        if normalize_skill(skill)
    ]

    skills_text = ", ".join(
        skills
    )

    if not skills_text:
        return []

    prompt = f"""
You are an expert software architect and career mentor.

Generate EXACTLY 8 UNIQUE software project ideas
based on the candidate's ACTUAL skills.

CANDIDATE SKILLS:

{skills_text}

STRICT RULES:

1. Generate exactly 8 projects.
2. Every project must have a different title.
3. Do not repeat project ideas.
4. Use the candidate's actual skills.
5. Do NOT invent technologies not in candidate skills.
6. You may use a necessary basic technology only
   when required by the project.
7. Do not force every skill into every project.
8. Each project must solve a different real-world problem.
9. Projects must be realistic for a fresher.
10. Include Beginner, Intermediate and Advanced projects.
11. Projects should be useful for a resume.
12. Return ONLY valid JSON.
13. No markdown.
14. No explanation.

Return:

[
  {{
    "title": "Unique Project Name",
    "difficulty": "Beginner",
    "tech_stack": "Relevant skills",
    "architecture": "Architecture",
    "features": [
      "Feature 1",
      "Feature 2",
      "Feature 3",
      "Feature 4",
      "Feature 5"
    ]
  }}
]

Difficulty must be:

Beginner
Intermediate
Advanced
"""

    try:

        text = call_groq(
            prompt,
            system_message=(
                "You are an expert software architect. "
                "Generate projects based only on supplied skills."
            ),
            temperature=0.5,
            max_tokens=3500
        )

        parsed = parse_json_safely(
            text
        )

        if not isinstance(
            parsed,
            list
        ):
            raise ValueError(
                "Invalid project response"
            )

        projects = []

        seen_titles = set()

        for item in parsed:

            project = normalize_project(
                item
            )

            if not project:
                continue

            title_key = (
                project["title"]
                .lower()
                .strip()
            )

            if title_key in seen_titles:
                continue

            seen_titles.add(
                title_key
            )

            projects.append(
                project
            )

        if len(projects) >= 8:
            return projects[:8]

        # ----------------------------------------------------
        # FILL REMAINING
        # ----------------------------------------------------

        backup = fallback_projects(
            skills
        )

        for project in backup:

            title_key = (
                project["title"]
                .lower()
                .strip()
            )

            if title_key not in seen_titles:

                projects.append(
                    project
                )

                seen_titles.add(
                    title_key
                )

            if len(projects) == 8:
                break

        return projects[:8]

    except Exception as e:

        print(
            "PROJECT GENERATION ERROR:",
            repr(e)
        )

        return fallback_projects(
            skills
        )[:8]


# ============================================================
# NORMALIZE PROJECT GUIDE
# ============================================================

def normalize_guide(
    data,
    project_title
):

    if not isinstance(
        data,
        dict
    ):
        data = {}

    return {

        "project_title": project_title,

        "overview": safe_string(
            data.get("overview"),
            f"{project_title} is a software application."
        ),

        "recommended_stack": safe_string(
            data.get("recommended_stack"),
            "Based on candidate skills"
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
            "Project-specific database design."
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

def generate_project_guide(
    project_title,
    skills=None
):

    project_title = safe_string(
        project_title,
        "Software Project"
    )

    skills = skills or []

    if isinstance(
        skills,
        str
    ):
        skills = [skills]

    skills = [
        normalize_skill(skill)
        for skill in skills
        if normalize_skill(skill)
    ]

    skills_text = ", ".join(
        skills
    )

    if not skills_text:

        skills_text = (
            "No specific skills detected"
        )

    prompt = f"""
You are a senior software architect and technical mentor.

Create a COMPLETE project-specific development guide.

PROJECT:

{project_title}

CANDIDATE SKILLS:

{skills_text}

IMPORTANT RULES:

1. The project must be based on the requested project title.
2. Use candidate skills wherever appropriate.
3. Do NOT invent candidate skills.
4. Do NOT claim candidate knows a technology that is not
   supplied in candidate skills.
5. If an additional technology is necessary, clearly identify it
   as an additional technology.
6. Make the guide practical for a fresher.
7. Database design must match the actual project.
8. APIs must match the actual project.
9. Folder structure must match the actual project.
10. Development steps must explain how to actually build it.

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

Return exactly:

{{
  "overview": "Project-specific overview",

  "recommended_stack": "Project-specific stack",

  "architecture": "Project-specific architecture",

  "folder_structure": "Project-specific structure",

  "database": "Project-specific database design",

  "apis": [
    "API 1",
    "API 2",
    "API 3",
    "API 4",
    "API 5"
  ],

  "development_phases": [
    "Phase 1",
    "Phase 2",
    "Phase 3",
    "Phase 4"
  ],

  "steps": [
    "Step 1",
    "Step 2",
    "Step 3",
    "Step 4",
    "Step 5",
    "Step 6",
    "Step 7",
    "Step 8"
  ],

  "testing": [
    "Testing 1",
    "Testing 2",
    "Testing 3"
  ],

  "deployment": [
    "Deployment 1",
    "Deployment 2",
    "Deployment 3"
  ],

  "advanced_features": [
    "Feature 1",
    "Feature 2",
    "Feature 3"
  ],

  "resources": [
    "Official documentation",
    "Learning resource",
    "Reference resource"
  ],

  "resume_points": [
    "Resume bullet 1",
    "Resume bullet 2",
    "Resume bullet 3"
  ]
}}
"""

    try:

        text = call_groq(
            prompt,
            system_message=(
                "You are a senior software architect. "
                "Return only valid JSON."
            ),
            temperature=0.2,
            max_tokens=5000
        )

        parsed = parse_json_safely(
            text
        )

        if not isinstance(
            parsed,
            dict
        ):
            raise ValueError(
                "Invalid project guide response"
            )

        return normalize_guide(
            parsed,
            project_title
        )

    except Exception as e:

        print(
            "PROJECT GUIDE ERROR:",
            repr(e)
        )

        return {

            "project_title": project_title,

            "overview": (
                f"{project_title} is a project designed "
                "around the candidate's available skills."
            ),

            "recommended_stack": skills_text,

            "architecture": (
                "Client-Server Architecture"
            ),

            "folder_structure": (
                "frontend/\n"
                "backend/\n"
                "database/\n"
                "README.md"
            ),

            "database": (
                f"Create database entities relevant to "
                f"{project_title}."
            ),

            "apis": [
                "POST /api/create",
                "GET /api/items",
                "GET /api/items/:id",
                "PUT /api/items/:id",
                "DELETE /api/items/:id"
            ],

            "development_phases": [
                "Requirement analysis",
                "Database design",
                "Backend development",
                "Frontend development",
                "Testing",
                "Deployment"
            ],

            "steps": [
                f"Define requirements for {project_title}",
                "Identify users and workflows",
                "Design database",
                "Create backend",
                "Implement APIs",
                "Build frontend",
                "Connect frontend and backend",
                "Test and deploy"
            ],

            "testing": [
                "Unit testing",
                "API testing",
                "Integration testing"
            ],

            "deployment": [
                "Prepare production configuration",
                "Deploy backend and frontend",
                "Configure production database"
            ],

            "advanced_features": [
                "Authentication",
                "Role-based authorization",
                "Logging"
            ],

            "resources": [
                "Official documentation",
                "Learning tutorials",
                "GitHub references"
            ],

            "resume_points": [
                f"Developed {project_title}",
                "Implemented application APIs",
                "Tested and deployed the application"
            ]
        }


# ============================================================
# COMPLETE RESUME ANALYSIS
# ============================================================

def analyze_resume_complete(
    resume_text
):

    """
    Returns:

    - ATS score
    - ATS analysis
    - Resume skills
    - Matching job roles
    """

    ats = analyze_resume(
        resume_text
    )

    skills = extract_skills(
        resume_text
    )

    roles = extract_job_roles(
        resume_text
    )

    return {

        "ats_score": ats.get(
            "ats_score",
            65
        ),

        "analysis_text": ats.get(
            "analysis_text",
            ""
        ),

        "skills": skills,

        "job_roles": roles
    }


# ============================================================
# HEALTH CHECK
# ============================================================

def test_ai_connection():

    try:

        response = call_groq(
            "Reply with exactly: OK",
            system_message=(
                "You are a connection test assistant."
            ),
            temperature=0,
            max_tokens=20
        )

        return {
            "success": True,
            "response": response
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }