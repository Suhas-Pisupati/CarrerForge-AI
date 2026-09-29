import os
import re

from openai import OpenAI


# ============================================================
# GROQ / OPENAI-COMPATIBLE CLIENT
# ============================================================

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


MODEL_NAME = "openai/gpt-oss-20b"


# ============================================================
# NORMALIZE SKILLS
# ============================================================

def normalize_skills(skills):
    """
    Normalize the skills received from the resume analyzer.

    Accepts:
        ["Python", "SQL", "Python"]

    Or:
        "Python"

    Returns:
        ["Python", "SQL"]
    """

    if not skills:
        return []

    if isinstance(skills, str):
        skills = [skills]

    result = []

    for skill in skills:

        skill = str(skill).strip()

        if not skill:
            continue

        # Remove accidental bullets/numbers
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
        ).strip()

        if not skill:
            continue

        # Case-insensitive duplicate check
        if skill.lower() not in [
            x.lower()
            for x in result
        ]:
            result.append(skill)

    return result


# ============================================================
# CLEAN QUESTION
# ============================================================

def clean_question(question):
    """
    Remove accidental numbering, bullets and markdown.
    """

    if not question:
        return ""

    question = str(question).strip()

    # Remove markdown bullets
    question = re.sub(
        r"^[-•*]\s*",
        "",
        question
    )

    # Remove numbering such as:
    # 1.
    # 1)
    # 01.
    question = re.sub(
        r"^\d+[.)]\s*",
        "",
        question
    )

    # Remove accidental markdown
    question = question.replace("**", "")
    question = question.replace("__", "")

    # Normalize spaces
    question = re.sub(
        r"\s+",
        " ",
        question
    ).strip()

    return question


# ============================================================
# REMOVE DUPLICATE QUESTIONS
# ============================================================

def unique_questions(questions):
    """
    Remove duplicate questions while preserving order.
    """

    result = []
    seen = set()

    for question in questions:

        question = clean_question(question)

        if len(question) < 5:
            continue

        key = question.lower()

        if key in seen:
            continue

        seen.add(key)
        result.append(question)

    return result


# ============================================================
# FALLBACK QUESTIONS
# ============================================================

def fallback_questions(skills):
    """
    Generate safe fallback questions using ONLY the supplied skills.

    No new technologies are introduced here.
    """

    questions = []

    for skill in skills:

        skill_lower = skill.lower()

        # ----------------------------------------------------
        # Python
        # ----------------------------------------------------

        if skill_lower == "python":

            questions.extend([
                "What are the main features of Python?",
                "What is the difference between a list and a tuple in Python?",
                "What are Python dictionaries and when would you use them?",
                "What is the difference between == and is in Python?",
                "How does exception handling work in Python?"
            ])

        # ----------------------------------------------------
        # Java
        # ----------------------------------------------------

        elif skill_lower == "java":

            questions.extend([
                "What are the main features of Java?",
                "What is the difference between a class and an object in Java?",
                "What is inheritance in Java?",
                "What is method overloading in Java?",
                "What is exception handling in Java?"
            ])

        # ----------------------------------------------------
        # SQL
        # ----------------------------------------------------

        elif skill_lower == "sql":

            questions.extend([
                "What is SQL and what is it used for?",
                "What is the difference between WHERE and HAVING in SQL?",
                "What is the difference between INNER JOIN and LEFT JOIN?",
                "What is a primary key in SQL?",
                "What is normalization in a database?"
            ])

        # ----------------------------------------------------
        # HTML
        # ----------------------------------------------------

        elif skill_lower == "html":

            questions.extend([
                "What is HTML and what is its purpose?",
                "What is the difference between div and semantic HTML elements?",
                "What are HTML forms used for?",
                "What is the purpose of HTML attributes?",
                "What is the difference between block and inline elements in HTML?"
            ])

        # ----------------------------------------------------
        # CSS
        # ----------------------------------------------------

        elif skill_lower == "css":

            questions.extend([
                "What is CSS and why is it used?",
                "What is the CSS box model?",
                "What is the difference between class and ID selectors?",
                "What is Flexbox in CSS?",
                "What is the difference between relative and absolute positioning?"
            ])

        # ----------------------------------------------------
        # Flask
        # ----------------------------------------------------

        elif skill_lower == "flask":

            questions.extend([
                "What is Flask and what is it used for?",
                "How are routes defined in Flask?",
                "What is a Flask application?",
                "How does Flask handle HTTP requests?",
                "How can JSON responses be returned from Flask?"
            ])

        # ----------------------------------------------------
        # Django
        # ----------------------------------------------------

        elif skill_lower == "django":

            questions.extend([
                "What is Django and what is it used for?",
                "What is the Django MVT architecture?",
                "What is a Django model?",
                "What are Django views?",
                "What is Django ORM?"
            ])

        # ----------------------------------------------------
        # JavaScript
        # ----------------------------------------------------

        elif skill_lower in ["javascript", "java script"]:

            questions.extend([
                "What is JavaScript and where is it commonly used?",
                "What is the difference between let, const and var?",
                "What is a JavaScript function?",
                "What is the difference between == and === in JavaScript?",
                "What is the DOM in JavaScript?"
            ])

        # ----------------------------------------------------
        # C
        # ----------------------------------------------------

        elif skill_lower == "c":

            questions.extend([
                "What are the main features of C?",
                "What is a pointer in C?",
                "What is the difference between an array and a pointer in C?",
                "What is a structure in C?",
                "How does memory allocation work in C?"
            ])

        # ----------------------------------------------------
        # C++
        # ----------------------------------------------------

        elif skill_lower in ["c++", "cpp"]:

            questions.extend([
                "What are the main features of C++?",
                "What is object-oriented programming in C++?",
                "What is inheritance in C++?",
                "What is polymorphism in C++?",
                "What is the difference between a pointer and a reference in C++?"
            ])

        # ----------------------------------------------------
        # PANDAS
        # ----------------------------------------------------

        elif skill_lower == "pandas":

            questions.extend([
                "What is Pandas used for?",
                "What is a DataFrame in Pandas?",
                "What is the difference between a Series and a DataFrame?",
                "How can missing values be handled using Pandas?",
                "How can data be filtered in a Pandas DataFrame?"
            ])

        # ----------------------------------------------------
        # NUMPY
        # ----------------------------------------------------

        elif skill_lower in ["numpy", "num py"]:

            questions.extend([
                "What is NumPy used for?",
                "What is a NumPy array?",
                "How is a NumPy array different from a Python list?",
                "What is vectorization in NumPy?",
                "How can NumPy arrays be reshaped?"
            ])

        # ----------------------------------------------------
        # TENSORFLOW
        # ----------------------------------------------------

        elif skill_lower == "tensorflow":

            questions.extend([
                "What is TensorFlow used for?",
                "What is a tensor in TensorFlow?",
                "What is a neural network model in TensorFlow?",
                "What is the purpose of an optimizer in TensorFlow?",
                "What is an epoch during model training?"
            ])

        # ----------------------------------------------------
        # KERAS
        # ----------------------------------------------------

        elif skill_lower == "keras":

            questions.extend([
                "What is Keras used for?",
                "What is a Keras model?",
                "What is the difference between Sequential and Functional models in Keras?",
                "What is an optimizer in Keras?",
                "What is the purpose of model.fit() in Keras?"
            ])

        # ----------------------------------------------------
        # OPENCV
        # ----------------------------------------------------

        elif skill_lower in ["opencv", "open cv"]:

            questions.extend([
                "What is OpenCV used for?",
                "What is image processing in OpenCV?",
                "How can an image be read using OpenCV?",
                "What is a video frame in OpenCV?",
                "How can images be converted between color spaces in OpenCV?"
            ])

        # ----------------------------------------------------
        # MACHINE LEARNING
        # ----------------------------------------------------

        elif skill_lower in [
            "machine learning",
            "machine-learning",
            "ml"
        ]:

            questions.extend([
                "What is machine learning?",
                "What is the difference between supervised and unsupervised learning?",
                "What is overfitting in machine learning?",
                "What is the purpose of train-test splitting?",
                "What is cross-validation in machine learning?"
            ])

        # ----------------------------------------------------
        # ARTIFICIAL INTELLIGENCE
        # ----------------------------------------------------

        elif skill_lower in [
            "artificial intelligence",
            "artificial-intelligence",
            "ai"
        ]:

            questions.extend([
                "What is artificial intelligence?",
                "What are the main areas of artificial intelligence?",
                "How does artificial intelligence differ from traditional programming?",
                "What is a model in artificial intelligence?",
                "What are common applications of artificial intelligence?"
            ])

        # ----------------------------------------------------
        # GENERIC FALLBACK FOR AN ACTUAL LISTED SKILL
        # ----------------------------------------------------

        else:

            questions.extend([
                f"What is {skill} and what is it commonly used for?",
                f"What are the main concepts of {skill}?",
                f"What are the advantages of using {skill}?",
                f"What are common challenges when working with {skill}?",
                f"How would you use {skill} in a real software development scenario?"
            ])

    return unique_questions(questions)


# ============================================================
# GENERATE MOCK INTERVIEW QUESTIONS
# ============================================================

def generate_mock_questions(skills):
    """
    Generate exactly 20 technical interview questions.

    IMPORTANT:
    This function receives SKILLS instead of the entire resume.

    Example:

        skills = ["Python", "SQL", "Flask"]

    This prevents the model from selecting technologies
    that are not actually present in the candidate's skills.
    """

    skills = normalize_skills(skills)

    if not skills:
        return []

    skills_text = ", ".join(skills)

    prompt = f"""
You are a senior technical interviewer.

Generate exactly 20 technical interview questions.

CANDIDATE SKILLS:
{skills_text}

STRICT RULES:

1. Questions must be based ONLY on the candidate's listed skills.
2. Do NOT ask about technologies not listed.
3. Do NOT invent Python.
4. Do NOT invent Java.
5. Do NOT invent SQL.
6. If SQL is not listed, do not ask SQL questions.
7. If Python is not listed, do not ask Python questions.
8. If Java is not listed, do not ask Java questions.
9. Use different listed skills where possible.
10. Questions must be technical.
11. No HR questions.
12. No behavioral questions.
13. No salary questions.
14. No career questions.
15. No generic HR questions.
16. No project questions unless a listed skill is directly involved.
17. Questions should test actual technical knowledge.
18. One question per line.
19. No numbering.
20. No markdown.
21. Do not provide answers.
22. Return exactly 20 questions.

CANDIDATE SKILLS:
{skills_text}
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.3,
            max_tokens=2500,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict technical interviewer. "
                        "You MUST use only the supplied candidate skills. "
                        "Never introduce an unlisted technology."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        text = response.choices[0].message.content or ""

        questions = []

        for line in text.split("\n"):

            line = clean_question(line)

            if len(line) > 5:
                questions.append(line)

        questions = unique_questions(questions)

        # ----------------------------------------------------
        # If AI produced 20 or more
        # ----------------------------------------------------

        if len(questions) >= 20:
            return questions[:20]

        # ----------------------------------------------------
        # Fill missing questions using safe skill-based
        # fallback questions.
        # ----------------------------------------------------

        fallback = fallback_questions(skills)

        for question in fallback:

            if len(questions) >= 20:
                break

            if question.lower() not in [
                q.lower()
                for q in questions
            ]:
                questions.append(question)

        return questions[:20]

    except Exception as e:

        print(
            "MOCK QUESTION ERROR:",
            repr(e)
        )

        # If Groq fails, still return skill-based questions.
        return fallback_questions(skills)[:20]


# ============================================================
# EVALUATE ANSWER
# ============================================================

def evaluate_answer(question, answer):
    """
    Evaluate the candidate's answer.

    Returns:

    {
        "feedback": "...",
        "score": 8
    }
    """

    question = str(question or "").strip()
    answer = str(answer or "").strip()

    if not question:
        return {
            "feedback": "No interview question was provided.",
            "score": 0
        }

    if not answer:
        return {
            "feedback": (
                "Score: 0/10\n"
                "Feedback: No answer was provided.\n"
                "The interviewer cannot evaluate an empty response.\n"
                "Improvement: Provide a clear technical answer."
            ),
            "score": 0
        }

    prompt = f"""
You are a senior technical interviewer.

Evaluate the candidate's technical interview answer.

Question:
{question}

Candidate Answer:
{answer}

Evaluate:

1. Technical correctness
2. Understanding of the concept
3. Accuracy
4. Clarity
5. Completeness

Give:

Score: X/10
Feedback: 2 short lines
Improvement: 1 short suggestion

Use this exact format:

Score: X/10
Feedback: First short feedback line.
Feedback: Second short feedback line.
Improvement: One short improvement suggestion.

Keep the response concise.
Do not discuss HR or behavioral topics.
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.2,
            max_tokens=800,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict technical interview evaluator. "
                        "Evaluate only the technical answer."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        output = (
            response.choices[0].message.content or ""
        ).strip()

        # ----------------------------------------------------
        # Extract score
        # ----------------------------------------------------

        score = 5

        score_patterns = [
            r"Score\s*:\s*(\d+(?:\.\d+)?)\s*/\s*10",
            r"Score\s*:\s*(\d+(?:\.\d+)?)",
            r"(\d+(?:\.\d+)?)\s*/\s*10"
        ]

        for pattern in score_patterns:

            match = re.search(
                pattern,
                output,
                flags=re.IGNORECASE
            )

            if match:

                try:
                    score = float(match.group(1))
                    break

                except Exception:
                    pass

        # ----------------------------------------------------
        # Convert score to integer
        # ----------------------------------------------------

        try:
            score = int(round(score))
        except Exception:
            score = 5

        # ----------------------------------------------------
        # Keep score inside 0-10
        # ----------------------------------------------------

        score = max(
            0,
            min(
                10,
                score
            )
        )

        # ----------------------------------------------------
        # If model returned empty output
        # ----------------------------------------------------

        if not output:

            output = (
                f"Score: {score}/10\n"
                "Feedback: The answer was evaluated successfully.\n"
                "Feedback: Review the core technical concept and explain it clearly.\n"
                "Improvement: Add more technically accurate details."
            )

        return {
            "feedback": output,
            "score": score
        }

    except Exception as e:

        print(
            "ANSWER EVALUATION ERROR:",
            repr(e)
        )

        return {
            "feedback": (
                "Score: 0/10\n"
                "Feedback: Unable to evaluate the answer because "
                "the AI evaluation service returned an error.\n"
                f"Feedback: {str(e)}\n"
                "Improvement: Please try submitting the answer again."
            ),
            "score": 0
        }