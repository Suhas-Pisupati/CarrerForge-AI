from openai import OpenAI
import subprocess
import tempfile
import os
import sqlite3

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

# =====================================
# GENERATE CODING QUESTIONS
# =====================================

def generate_coding_questions(resume_text):

    prompt = f"""
You are a FAANG coding interviewer.

Generate EXACTLY 10 coding interview questions.

STRICT RULES:
- ONLY coding questions
- NO project explanation
- NO theory questions
- NO HR questions
- Questions must require coding

Include:
- Python
- Java
- DSA
- SQL
- OOPs

Examples:
- Reverse linked list
- Find duplicates
- SQL second highest salary
- Stack using queue

FORMAT:
1. Question
2. Question

Resume:
{resume_text}
"""

    res = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    text = res.choices[0].message.content

    questions = []

    for line in text.split("\n"):

        line = line.strip()

        if (
            len(line) > 10
            and "." in line
            and line[0].isdigit()
        ):

            try:

                q = line.split(".", 1)[1].strip()

                q = q.replace("*", "")

                questions.append(q)

            except:
                pass

    return questions[:10]

# =====================================
# PYTHON EXECUTION
# =====================================

def execute_python(code):

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

        os.unlink(filename)

        if result.stderr:
            return result.stderr

        return result.stdout or "Code executed successfully"

    except Exception as e:
        return str(e)

# =====================================
# JAVA EXECUTION
# =====================================

def execute_java(code):

    try:

        temp_dir = tempfile.mkdtemp()

        java_file = os.path.join(temp_dir, "Main.java")

        with open(java_file, "w", encoding="utf-8") as f:
            f.write(code)

        compile_result = subprocess.run(
            ["javac", java_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if compile_result.stderr:
            return compile_result.stderr

        run_result = subprocess.run(
            ["java", "-cp", temp_dir, "Main"],
            capture_output=True,
            text=True,
            timeout=10
        )

        if run_result.stderr:
            return run_result.stderr

        return run_result.stdout or "Java code executed successfully"

    except Exception as e:
        return str(e)

# =====================================
# C EXECUTION
# =====================================

def execute_c(code):

    try:

        temp_dir = tempfile.mkdtemp()

        c_file = os.path.join(temp_dir, "main.c")

        exe_file = os.path.join(temp_dir, "main.exe")

        with open(c_file, "w", encoding="utf-8") as f:
            f.write(code)

        compile_result = subprocess.run(
            ["gcc", c_file, "-o", exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if compile_result.stderr:
            return compile_result.stderr

        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if run_result.stderr:
            return run_result.stderr

        return run_result.stdout or "C code executed successfully"

    except Exception as e:
        return str(e)

# =====================================
# CPP EXECUTION
# =====================================

def execute_cpp(code):

    try:

        temp_dir = tempfile.mkdtemp()

        cpp_file = os.path.join(temp_dir, "main.cpp")

        exe_file = os.path.join(temp_dir, "main.exe")

        with open(cpp_file, "w", encoding="utf-8") as f:
            f.write(code)

        compile_result = subprocess.run(
            ["g++", cpp_file, "-o", exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if compile_result.stderr:
            return compile_result.stderr

        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=10
        )

        if run_result.stderr:
            return run_result.stderr

        return run_result.stdout or "C++ code executed successfully"

    except Exception as e:
        return str(e)


# =====================================
# SQL EXECUTION
# =====================================

def execute_sql(query):

    try:

        conn = sqlite3.connect(":memory:")

        cursor = conn.cursor()

        cursor.execute("""
        CREATE TABLE employees(
            id INTEGER,
            name TEXT,
            salary INTEGER
        )
        """)

        cursor.executemany(
            "INSERT INTO employees VALUES (?, ?, ?)",
            [
                (1, "John", 50000),
                (2, "Alice", 70000),
                (3, "Bob", 60000)
            ]
        )

        conn.commit()

        cursor.execute(query)

        rows = cursor.fetchall()

        conn.close()

        return str(rows)

    except Exception as e:
        return str(e)


# =====================================
# MAIN EXECUTION HANDLER
# =====================================

def execute_code(language, code):

    language = language.lower()

    if language == "python":
        return execute_python(code)

    elif language == "java":
        return execute_java(code)

    elif language == "c":
        return execute_c(code)

    elif language == "cpp":
        return execute_cpp(code)

    elif language == "sql":
        return execute_sql(code)

    else:
        return "Language not supported"


# =====================================
# EVALUATE CODE
# =====================================
def evaluate_code_answer(question, answer, language):

    prompt = f"""
You are a senior coding interviewer.

Evaluate the candidate code briefly and professionally.

Question:
{question}

Language:
{language}

Candidate Code:
{answer}

STRICT RULES:
- Keep response SHORT
- Maximum 120 words
- Use simple interview feedback style
- No long paragraphs
- No essay
- No detailed theory
- No unnecessary explanation

FORMAT:

## Score
x/10

## Time Complexity
O(...)

## Feedback
2-3 short lines only

## Improvement
1 short improvement suggestion
"""

    res = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    return {
        "feedback": res.choices[0].message.content
    }