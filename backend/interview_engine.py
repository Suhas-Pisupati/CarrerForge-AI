import os
from openai import OpenAI
import json
import re

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)
# ===============================
# 🎯 Generate Questions (FIXED)
# ===============================
def generate_mock_questions(resume_text):

    prompt = f"""
Generate exactly 20 technical interview questions.

Rules:
- No numbering
- One question per line
- Short and clear

Resume:
{resume_text}
"""

    res = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}]
    )

    text = res.choices[0].message.content.strip()

    # ✅ FIXED parsing
    questions = [q.strip() for q in text.split("\n") if len(q.strip()) > 5]

    return questions[:20]
def evaluate_answer(question, answer):

    prompt = f"""
Evaluate this answer.

Question: {question}
Answer: {answer}

Give:
Score (1-10)
Feedback (2 lines)
Improvement

Format:
Score: X
Feedback: ...
Improvement: ...
"""

    res = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}]
    )

    output = res.choices[0].message.content

    score = 5
    for line in output.split("\n"):
        if "Score" in line:
            try:
                score = int(line.split(":")[1].strip())
            except:
                pass

    return {
        "feedback": output,
        "score": score
    }