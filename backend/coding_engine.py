import os
import re
import shutil
import sqlite3
import subprocess
import tempfile

from openai import OpenAI


# ============================================================
# GROQ / OPENAI-COMPATIBLE CLIENT
# ============================================================

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


# ============================================================
# MODEL
# ============================================================

MODEL_NAME = "openai/gpt-oss-20b"


# ============================================================
# NORMALIZE SKILLS
# ============================================================

def normalize_skills(skills):
    """
    Normalize candidate skills.

    Accepts:

        ["Python", "SQL", "Python"]

    or:

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

        # Remove accidental bullets
        skill = re.sub(
            r"^[-•*]\s*",
            "",
            skill
        )

        # Remove accidental numbering
        skill = re.sub(
            r"^\d+[.)]\s*",
            "",
            skill
        )

        # Normalize spaces
        skill = re.sub(
            r"\s+",
            " ",
            skill
        ).strip()

        if not skill:
            continue

        # Case-insensitive duplicate prevention
        if skill.lower() not in [
            existing.lower()
            for existing in result
        ]:
            result.append(skill)

    return result


# ============================================================
# CLEAN QUESTION
# ============================================================

def clean_question(question):
    """
    Remove accidental numbering, bullets and markdown
    from AI-generated questions.
    """

    if not question:
        return ""

    question = str(question).strip()

    # Remove numbering:
    # 1.
    # 1)
    # 10.
    question = re.sub(
        r"^\d+[.)]\s*",
        "",
        question
    )

    # Remove bullets
    question = re.sub(
        r"^[-•*]\s*",
        "",
        question
    )

    # Remove markdown
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

        if len(question) < 10:
            continue

        key = question.lower()

        if key in seen:
            continue

        seen.add(key)
        result.append(question)

    return result


# ============================================================
# FALLBACK CODING QUESTIONS
# ============================================================

def fallback_coding_questions(skills):
    """
    Generate coding questions without using the AI.

    IMPORTANT:
    Only supplied skills are used.

    This prevents Python/Java/SQL questions from appearing
    when those skills are not present.
    """

    questions = []

    for skill in skills:

        skill_lower = skill.lower().strip()

        # ====================================================
        # PYTHON
        # ====================================================

        if skill_lower == "python":

            questions.extend([
                "Write a Python program to reverse a string without using a built-in reverse function.",
                "Write a Python program to find duplicate elements in a list.",
                "Write a Python program to count the frequency of each element in a list.",
                "Write a Python function to check whether a string is a palindrome.",
                "Write a Python program to find the second largest number in a list.",
                "Write a Python function to calculate the factorial of a number.",
                "Write a Python program to remove duplicate elements from a list.",
                "Write a Python function to find the first non-repeating character in a string.",
                "Write a Python program to find the common elements between two lists.",
                "Write a Python function to determine whether two strings are anagrams."
            ])

        # ====================================================
        # JAVA
        # ====================================================

        elif skill_lower == "java":

            questions.extend([
                "Write a Java program to reverse a string.",
                "Write a Java program to find duplicate elements in an array.",
                "Write a Java program to check whether a string is a palindrome.",
                "Write a Java program to find the second largest element in an array.",
                "Write a Java program to count the frequency of characters in a string.",
                "Write a Java program to remove duplicate elements from an array.",
                "Write a Java program to find the largest element in an array.",
                "Write a Java program to check whether two strings are anagrams.",
                "Write a Java program to calculate the factorial of a number.",
                "Write a Java program to find common elements between two arrays."
            ])

        # ====================================================
        # SQL
        # ====================================================

        elif skill_lower == "sql":

            questions.extend([
                "Write a SQL query to find the second highest salary from the employees table.",
                "Write a SQL query to find employees whose salary is greater than the average salary.",
                "Write a SQL query to find the highest salary in each department.",
                "Write a SQL query to find duplicate employee records.",
                "Write a SQL query to count employees in each department.",
                "Write a SQL query to find the top three highest salaries.",
                "Write a SQL query to find employees whose names start with the letter A.",
                "Write a SQL query to calculate the average salary of employees.",
                "Write a SQL query to find employees who earn more than 50000.",
                "Write a SQL query to sort employees by salary in descending order."
            ])

        # ====================================================
        # C
        # ====================================================

        elif skill_lower == "c":

            questions.extend([
                "Write a C program to reverse a string.",
                "Write a C program to find duplicate elements in an array.",
                "Write a C program to check whether a string is a palindrome.",
                "Write a C program to find the largest element in an array.",
                "Write a C program to find the second largest element in an array.",
                "Write a C program to calculate the factorial of a number.",
                "Write a C program to count vowels in a string.",
                "Write a C program to sort an array.",
                "Write a C program to find common elements between two arrays.",
                "Write a C program to remove duplicate elements from an array."
            ])

        # ====================================================
        # C++
        # ====================================================

        elif skill_lower in [
            "c++",
            "cpp"
        ]:

            questions.extend([
                "Write a C++ program to reverse a string.",
                "Write a C++ program to find duplicate elements in an array.",
                "Write a C++ program to check whether a string is a palindrome.",
                "Write a C++ program to find the largest element in an array.",
                "Write a C++ program to find the second largest element in an array.",
                "Write a C++ program to calculate the factorial of a number.",
                "Write a C++ program to count the frequency of elements in an array.",
                "Write a C++ program to sort an array.",
                "Write a C++ program to find common elements between two arrays.",
                "Write a C++ program to remove duplicate elements from an array."
            ])

        # ====================================================
        # JAVASCRIPT
        # ====================================================

        elif skill_lower in [
            "javascript",
            "java script"
        ]:

            questions.extend([
                "Write a JavaScript function to reverse a string.",
                "Write a JavaScript function to find duplicate elements in an array.",
                "Write a JavaScript function to check whether a string is a palindrome.",
                "Write a JavaScript function to find the largest number in an array.",
                "Write a JavaScript function to remove duplicate elements from an array.",
                "Write a JavaScript function to count the frequency of array elements.",
                "Write a JavaScript function to find the second largest number in an array.",
                "Write a JavaScript function to check whether two strings are anagrams.",
                "Write a JavaScript function to find common elements between two arrays.",
                "Write a JavaScript function to sort an array without using the sort method."
            ])

        # ====================================================
        # DSA
        # ====================================================

        elif skill_lower in [
            "dsa",
            "data structures",
            "data structures and algorithms",
            "data structures & algorithms"
        ]:

            questions.extend([
                "Write code to implement a stack using an array.",
                "Write code to implement a queue using two stacks.",
                "Write code to reverse a linked list.",
                "Write code to detect a cycle in a linked list.",
                "Write code to find the middle element of a linked list.",
                "Write code to implement binary search on a sorted array.",
                "Write code to find duplicate elements in an array.",
                "Write code to implement a stack using two queues.",
                "Write code to find the maximum subarray sum.",
                "Write code to perform a binary tree traversal."
            ])

        # ====================================================
        # OOPS
        # ====================================================

        elif skill_lower in [
            "oops",
            "oop",
            "object oriented programming",
            "object-oriented programming"
        ]:

            questions.extend([
                "Write code demonstrating encapsulation using a class.",
                "Write code demonstrating inheritance using two classes.",
                "Write code demonstrating method overriding.",
                "Write code demonstrating method overloading.",
                "Write code demonstrating polymorphism.",
                "Write code demonstrating abstraction using an abstract class.",
                "Write code demonstrating an interface implementation.",
                "Write code demonstrating constructor overloading.",
                "Write code demonstrating composition between two classes.",
                "Write code demonstrating access control using class members."
            ])


        # ====================================================
        # EXCEL / ANALYTICS
        # ====================================================

        elif skill_lower in [
            "excel",
            "advanced excel",
            "pivot tables",
            "charts"
        ]:

            questions.extend([
                f"Write an Excel formula using {skill} to calculate a conditional total from a sales table.",
                f"Create a {skill} solution to identify duplicate records in a dataset.",
                f"Create a {skill} calculation to return the top 5 values from a dataset.",
                f"Build a {skill} formula/workflow to calculate month-over-month change.",
                f"Create a {skill} solution to categorize records based on a condition.",
                f"Use {skill} to calculate an average for records matching a criterion.",
                f"Create a {skill} solution to identify missing values in a data table.",
                f"Build a {skill} calculation for percentage contribution by category.",
                f"Create a {skill} solution to summarize sales by category.",
                f"Build a {skill} report calculation for a KPI dashboard."
            ])

        # ====================================================
        # POWER BI / BUSINESS ANALYTICS
        # ====================================================

        elif skill_lower in [
            "power bi",
            "business analytics",
            "data analysis",
            "data analytics"
        ]:

            questions.extend([
                f"Design a {skill} data transformation workflow for a sales dataset.",
                f"Create a {skill} analysis to compare monthly revenue.",
                f"Design a {skill} report that tracks five business KPIs.",
                f"Create a {skill} workflow to identify the best-performing category.",
                f"Build a {skill} analysis to compare actual versus target performance.",
                f"Design a {skill} solution to segment customers by performance.",
                f"Create a {skill} analysis to identify a month with an unusual drop in sales.",
                f"Build a {skill} report that supports management decision-making.",
                f"Create a {skill} workflow to validate a business dataset before reporting.",
                f"Design a {skill} dashboard for tracking business performance."
            ])

    return unique_questions(questions)


# ============================================================
# GENERATE CODING QUESTIONS
# ============================================================

def generate_coding_questions(skills):
    """
    Generate exactly 10 coding questions based ONLY on
    the candidate's extracted skills.

    IMPORTANT:

    Old behavior:
        generate_coding_questions(resume_text)

    New behavior:
        generate_coding_questions(skills)

    Example:

        ["Python", "SQL", "Flask"]

    The AI can ask Python and SQL coding questions,
    but must not introduce Java, C, C++, etc.
    """

    skills = normalize_skills(skills)

    if not skills:
        return []

    skills_text = ", ".join(skills)

    prompt = f"""
You are a senior coding interviewer.

Generate EXACTLY 10 coding interview questions based ONLY
on the candidate's listed technical skills.

CANDIDATE SKILLS:

{skills_text}

STRICT RULES:

1. ONLY use technologies/programming/database skills explicitly
   listed above.

2. Do NOT introduce technologies that are not listed.

3. Do NOT invent Python.

4. Do NOT invent Java.

5. Do NOT invent C.

6. Do NOT invent C++.

7. Do NOT invent SQL.

8. Do NOT invent JavaScript.

9. Do NOT invent DSA unless DSA/Data Structures is explicitly listed.

10. Do NOT invent OOP/OOPs unless OOP/OOPs is explicitly listed.

11. Every question must require the candidate to write code
    or SQL.

12. No theory-only questions.

13. No HR questions.

14. No behavioral questions.

15. No project explanation questions.

16. No resume explanation questions.

17. No "What is..." questions unless the question also
    requires implementation/code.

18. If SQL is listed, SQL coding/query problems may be included.

19. If Python is listed, Python coding problems may be included.

20. If Java is listed, Java coding problems may be included.

21. If C is listed, C coding problems may be included.

22. If C++ is listed, C++ coding problems may be included.

23. If JavaScript is listed, JavaScript coding problems may
    be included.

24. If DSA is listed, DSA implementation problems may be included.

25. If OOP/OOPs is listed, object-oriented programming
    implementation problems may be included.

26. If only one coding skill exists, create questions around
    that skill.

27. Every question must be practical and solvable by writing code.

28. Return exactly 10 questions.

29. One question per line.

30. No numbering.

31. No markdown.

32. Do not provide answers.

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
                        "You are a strict coding interviewer. "
                        "Use ONLY the candidate skills supplied "
                        "by the application. Never introduce "
                        "unlisted programming languages, databases "
                        "or technologies."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        text = (
            response.choices[0].message.content
            or ""
        )

        questions = []

        for line in text.split("\n"):

            line = clean_question(line)

            if len(line) > 10:
                questions.append(line)

        questions = unique_questions(questions)

        # ----------------------------------------------------
        # AI returned enough questions
        # ----------------------------------------------------

        if len(questions) >= 10:
            return questions[:10]

        # ----------------------------------------------------
        # AI returned fewer than 10.
        #
        # Fill the remaining questions from the skill-based
        # fallback without introducing unrelated technologies.
        # ----------------------------------------------------

        fallback = fallback_coding_questions(skills)

        for question in fallback:

            if len(questions) >= 10:
                break

            if question.lower() not in [
                q.lower()
                for q in questions
            ]:
                questions.append(question)

        return questions[:10]

    except Exception as e:

        print(
            "CODING QUESTION ERROR:",
            repr(e)
        )

        # Safe fallback based only on skills
        return fallback_coding_questions(skills)[:10]


# ============================================================
# PYTHON EXECUTION
# ============================================================

def execute_python(code):
    """
    Execute Python code using a temporary file.
    """

    filename = None

    try:

        with tempfile.NamedTemporaryFile(
            suffix=".py",
            delete=False,
            mode="w",
            encoding="utf-8"
        ) as f:

            f.write(code)

            filename = f.name

        result = subprocess.run(
            ["python", filename],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.stderr:
            return result.stderr

        return (
            result.stdout
            or "Code executed successfully"
        )

    except subprocess.TimeoutExpired:

        return "Execution timed out after 10 seconds."

    except Exception as e:

        return str(e)

    finally:

        if filename and os.path.exists(filename):

            try:
                os.unlink(filename)

            except Exception:
                pass


# ============================================================
# JAVA EXECUTION
# ============================================================

def execute_java(code):
    """
    Compile and execute Java code.

    The submitted Java code must contain:

        public static void main(String[] args)

    inside Main.
    """

    temp_dir = None

    try:

        temp_dir = tempfile.mkdtemp()

        java_file = os.path.join(
            temp_dir,
            "Main.java"
        )

        with open(
            java_file,
            "w",
            encoding="utf-8"
        ) as f:

            f.write(code)

        # ----------------------------------------------------
        # Compile
        # ----------------------------------------------------

        compile_result = subprocess.run(
            [
                "javac",
                java_file
            ],
            capture_output=True,
            text=True,
            timeout=10
        )

        if compile_result.returncode != 0:

            return (
                compile_result.stderr
                or compile_result.stdout
                or "Java compilation failed."
            )

        # ----------------------------------------------------
        # Run
        # ----------------------------------------------------

        run_result = subprocess.run(
            [
                "java",
                "-cp",
                temp_dir,
                "Main"
            ],
            capture_output=True,
            text=True,
            timeout=10
        )

        if run_result.returncode != 0:

            return (
                run_result.stderr
                or run_result.stdout
                or "Java execution failed."
            )

        return (
            run_result.stdout
            or "Java code executed successfully"
        )

    except subprocess.TimeoutExpired:

        return "Java execution timed out after 10 seconds."

    except Exception as e:

        return str(e)

    finally:

        if temp_dir:

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )


# ============================================================
# C EXECUTION
# ============================================================

def execute_c(code):
    """
    Compile and execute C code using GCC.
    """

    temp_dir = None

    try:

        temp_dir = tempfile.mkdtemp()

        c_file = os.path.join(
            temp_dir,
            "main.c"
        )

        exe_file = os.path.join(
            temp_dir,
            "main.exe"
        )

        with open(
            c_file,
            "w",
            encoding="utf-8"
        ) as f:

            f.write(code)

        # ----------------------------------------------------
        # Compile
        # ----------------------------------------------------

        compile_result = subprocess.run(
            [
                "gcc",
                c_file,
                "-o",
                exe_file
            ],
            capture_output=True,
            text=True,
            timeout=10
        )

        if compile_result.returncode != 0:

            return (
                compile_result.stderr
                or compile_result.stdout
                or "C compilation failed."
            )

        # ----------------------------------------------------
        # Run
        # ----------------------------------------------------

        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if run_result.returncode != 0:

            return (
                run_result.stderr
                or run_result.stdout
                or "C execution failed."
            )

        return (
            run_result.stdout
            or "C code executed successfully"
        )

    except subprocess.TimeoutExpired:

        return "C execution timed out after 10 seconds."

    except Exception as e:

        return str(e)

    finally:

        if temp_dir:

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )


# ============================================================
# C++ EXECUTION
# ============================================================

def execute_cpp(code):
    """
    Compile and execute C++ code using G++.
    """

    temp_dir = None

    try:

        temp_dir = tempfile.mkdtemp()

        cpp_file = os.path.join(
            temp_dir,
            "main.cpp"
        )

        exe_file = os.path.join(
            temp_dir,
            "main.exe"
        )

        with open(
            cpp_file,
            "w",
            encoding="utf-8"
        ) as f:

            f.write(code)

        # ----------------------------------------------------
        # Compile
        # ----------------------------------------------------

        compile_result = subprocess.run(
            [
                "g++",
                cpp_file,
                "-o",
                exe_file
            ],
            capture_output=True,
            text=True,
            timeout=10
        )

        if compile_result.returncode != 0:

            return (
                compile_result.stderr
                or compile_result.stdout
                or "C++ compilation failed."
            )

        # ----------------------------------------------------
        # Run
        # ----------------------------------------------------

        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if run_result.returncode != 0:

            return (
                run_result.stderr
                or run_result.stdout
                or "C++ execution failed."
            )

        return (
            run_result.stdout
            or "C++ code executed successfully"
        )

    except subprocess.TimeoutExpired:

        return "C++ execution timed out after 10 seconds."

    except Exception as e:

        return str(e)

    finally:

        if temp_dir:

            shutil.rmtree(
                temp_dir,
                ignore_errors=True
            )


# ============================================================
# SQL EXECUTION
# ============================================================

def execute_sql(query):
    """
    Execute SQL against an in-memory SQLite database.

    Available table:

        employees

    Columns:

        id
        name
        salary
    """

    conn = None

    try:

        conn = sqlite3.connect(":memory:")

        cursor = conn.cursor()

        # ----------------------------------------------------
        # Create sample table
        # ----------------------------------------------------

        cursor.execute(
            """
            CREATE TABLE employees(
                id INTEGER,
                name TEXT,
                salary INTEGER
            )
            """
        )

        # ----------------------------------------------------
        # Insert sample data
        # ----------------------------------------------------

        cursor.executemany(
            """
            INSERT INTO employees
            VALUES (?, ?, ?)
            """,
            [
                (1, "John", 50000),
                (2, "Alice", 70000),
                (3, "Bob", 60000)
            ]
        )

        conn.commit()

        # ----------------------------------------------------
        # Execute candidate query
        # ----------------------------------------------------

        cursor.execute(query)

        rows = cursor.fetchall()

        return str(rows)

    except Exception as e:

        return str(e)

    finally:

        if conn:

            try:
                conn.close()

            except Exception:
                pass


# ============================================================
# MAIN EXECUTION HANDLER
# ============================================================

def execute_code(language, code):
    """
    Execute submitted code according to language.

    Supported:

        Python
        Java
        C
        C++
        SQL
    """

    language = (
        language
        or ""
    ).lower().strip()

    if not code or not str(code).strip():

        return "No code was provided."

    if language == "python":

        return execute_python(code)

    elif language == "java":

        return execute_java(code)

    elif language == "c":

        return execute_c(code)

    elif language in [
        "cpp",
        "c++"
    ]:

        return execute_cpp(code)

    elif language == "sql":

        return execute_sql(code)

    else:

        return "Language not supported"


# ============================================================
# EVALUATE CODE
# ============================================================

def evaluate_code_answer(
    question,
    answer,
    language
):
    """
    Evaluate candidate code using Groq.

    Returns:

        {
            "feedback": "..."
        }
    """

    question = str(
        question or ""
    ).strip()

    answer = str(
        answer or ""
    ).strip()

    language = str(
        language or ""
    ).strip()

    if not question:

        return {
            "feedback": (
                "Evaluation error: "
                "No coding question was provided."
            )
        }

    if not answer:

        return {
            "feedback": (
                "## Score\n"
                "0/10\n\n"
                "## Time Complexity\n"
                "N/A\n\n"
                "## Feedback\n"
                "No code was submitted.\n"
                "The answer cannot be evaluated without code.\n\n"
                "## Improvement\n"
                "Submit a complete solution to the coding problem."
            )
        }

    prompt = f"""
You are a senior coding interviewer.

Evaluate the candidate's code briefly and professionally.

Question:
{question}

Language:
{language}

Candidate Code:
{answer}

STRICT RULES:

- Keep response SHORT.
- Maximum 120 words.
- Use simple interview feedback style.
- No long paragraphs.
- No essay.
- No detailed theory.
- No unnecessary explanation.
- Focus on correctness, efficiency and code quality.

FORMAT:

## Score
X/10

## Time Complexity
O(...)

## Feedback
2-3 short lines only

## Improvement
1 short improvement suggestion
"""

    try:

        response = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.2,
            max_tokens=700,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior coding interviewer. "
                        "Evaluate the submitted code accurately "
                        "and keep the response concise."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        output = (
            response.choices[0].message.content
            or ""
        ).strip()

        if not output:

            output = (
                "## Score\n"
                "0/10\n\n"
                "## Time Complexity\n"
                "Unable to determine\n\n"
                "## Feedback\n"
                "The evaluation service returned an empty response.\n\n"
                "## Improvement\n"
                "Try submitting the code again."
            )

        return {
            "feedback": output
        }

    except Exception as e:

        print(
            "CODE EVALUATION ERROR:",
            repr(e)
        )

        return {
            "feedback": (
                "Evaluation error: "
                f"{str(e)}"
            )
        }