import fitz
import re
from io import BytesIO

try:
    from docx import Document
except Exception:
    Document = None


# ==========================================================
# RESUME TEXT EXTRACTION
# Supports PDF, DOCX and plain text-compatible uploads.
# ==========================================================

def extract_text(file):
    try:
        file.file.seek(0)
        content = file.file.read()

        if not content:
            return ""

        filename = (getattr(file, "filename", "") or "").lower()

        # PDF
        if filename.endswith(".pdf"):
            doc = fitz.open(stream=content, filetype="pdf")
            pages = []
            for page in doc:
                page_text = page.get_text("text")
                if page_text:
                    pages.append(page_text)
            doc.close()
            return "\n".join(pages).strip()

        # DOCX
        if filename.endswith(".docx"):
            if Document is None:
                return ""
            document = Document(BytesIO(content))
            parts = [p.text for p in document.paragraphs if p.text.strip()]
            for table in document.tables:
                for row in table.rows:
                    parts.append(" | ".join(cell.text for cell in row.cells))
            return "\n".join(parts).strip()

        # DOC is not reliably readable without an external converter.
        # Return decoded text only when it appears to be plain text.
        if filename.endswith(".doc"):
            try:
                decoded = content.decode("utf-8", errors="ignore")
                return decoded.strip()
            except Exception:
                return ""

        return content.decode("utf-8", errors="ignore").strip()

    except Exception as e:
        print("RESUME TEXT EXTRACTION ERROR:", repr(e))
        return ""


# ==========================================================
# EXPLICIT SKILL DICTIONARY
#
# The parser intentionally contains both technical and
# business/functional skills so non-CS resumes are supported.
# ==========================================================

SKILL_PATTERNS = {
    # Programming
    "Python": [r"\bpython\b"],
    "Java": [r"\bjava\b"],
    "C": [r"\bc programming\b", r"\bc language\b"],
    "C++": [r"\bc\+\+\b"],
    "C#": [r"\bc#\b", r"\bc sharp\b"],
    "JavaScript": [r"\bjavascript\b", r"\bjs\b"],
    "TypeScript": [r"\btypescript\b", r"\bts\b"],
    "PHP": [r"\bphp\b"],
    "Go": [r"\bgolang\b", r"\bgo language\b"],
    "R": [r"\br programming\b", r"\br language\b"],

    # Web / backend
    "HTML": [r"\bhtml5?\b"],
    "CSS": [r"\bcss3?\b"],
    "React": [r"\breact(?:\.js|js)?\b"],
    "Node.js": [r"\bnode\.?js\b", r"\bnodejs\b"],
    "Express.js": [r"\bexpress\.?js\b", r"\bexpressjs\b"],
    "Flask": [r"\bflask\b"],
    "Django": [r"\bdjango\b"],
    "FastAPI": [r"\bfastapi\b"],

    # Database
    "SQL": [r"\bsql\b", r"\bstructured query language\b"],
    "MySQL": [r"\bmysql\b"],
    "PostgreSQL": [r"\bpostgresql\b", r"\bpostgres\b"],
    "MongoDB": [r"\bmongodb\b", r"\bmongo db\b"],
    "SQLite": [r"\bsqlite\b"],
    "Oracle": [r"\boracle database\b", r"\boracle sql\b"],
    "SQL Server": [r"\bsql server\b", r"\bmicrosoft sql server\b"],
    "DBMS": [r"\bdbms\b", r"\bdatabase management system\b"],

    # Data / analytics
    "Pandas": [r"\bpandas\b"],
    "NumPy": [r"\bnumpy\b"],
    "Matplotlib": [r"\bmatplotlib\b"],
    "Seaborn": [r"\bseaborn\b"],
    "Scikit-learn": [r"\bscikit[\s-]?learn\b", r"\bsklearn\b"],
    "Excel": [r"\bmicrosoft excel\b", r"\bexcel\b"],
    "Advanced Excel": [r"\badvanced excel\b"],
    "Pivot Tables": [r"\bpivot tables?\b"],
    "Charts": [r"\bcharts?\b"],
    "Power BI": [r"\bpower\s?bi\b"],
    "Tableau": [r"\btableau\b"],
    "Google Sheets": [r"\bgoogle sheets\b"],

    # AI/ML
    "Machine Learning": [r"\bmachine learning\b", r"\bmachine-learning\b"],
    "Deep Learning": [r"\bdeep learning\b", r"\bdeep-learning\b"],
    "Artificial Intelligence": [r"\bartificial intelligence\b"],
    "Natural Language Processing": [r"\bnatural language processing\b", r"\bnlp\b"],
    "Computer Vision": [r"\bcomputer vision\b"],
    "TensorFlow": [r"\btensorflow\b"],
    "Keras": [r"\bkeras\b"],
    "PyTorch": [r"\bpytorch\b"],
    "OpenCV": [r"\bopencv\b", r"\bopen cv\b"],
    "XGBoost": [r"\bxgboost\b"],
    "Random Forest": [r"\brandom forest\b"],
    "CNN": [r"\bcnn\b", r"\bconvolutional neural network\b"],
    "LSTM": [r"\blstm\b", r"\blong short[- ]term memory\b"],

    # Cloud / tools
    "AWS": [r"\baws\b", r"\bamazon web services\b"],
    "Azure": [r"\bazure\b"],
    "Google Cloud": [r"\bgoogle cloud\b", r"\bgcp\b"],
    "Docker": [r"\bdocker\b"],
    "Git": [r"\bgit\b"],
    "GitHub": [r"\bgithub\b"],
    "Linux": [r"\blinux\b"],
    "REST API": [r"\brest api\b", r"\brestful api\b"],
    "API": [r"\bapis?\b"],
    "OpenAI": [r"\bopenai\b"],
    "Groq": [r"\bgroq\b"],
    "Microsoft Word": [r"\bmicrosoft word\b", r"\bword\b"],
    "Microsoft PowerPoint": [r"\bmicrosoft powerpoint\b", r"\bpowerpoint\b"],
    "Canva": [r"\bcanva\b"],

    # Core CS
    "Data Structures": [r"\bdata structures\b"],
    "Algorithms": [r"\balgorithms?\b"],
    "Object-Oriented Programming": [
        r"\boops?\b",
        r"\bobject[- ]oriented programming\b"
    ],
    "Computer Networks": [r"\bcomputer networks\b", r"\bcomputer networking\b"],
    "Operating Systems": [r"\boperating systems?\b"],

    # Business / finance / marketing / operations
    "Business Management": [r"\bbusiness management\b"],
    "Financial Analysis": [r"\bfinancial analysis\b"],
    "Marketing Management": [r"\bmarketing management\b"],
    "Business Strategy": [r"\bbusiness strategy\b"],
    "Market Research": [r"\bmarket research\b"],
    "Sales & Business Development": [
        r"\bsales\s*(?:&|and)\s*business development\b",
        r"\bbusiness development\b"
    ],
    "Operations Management": [r"\boperations management\b"],
    "Human Resource Management": [r"\bhuman resource management\b", r"\bhr management\b"],
    "CRM": [r"\bcrm\b", r"\bcustomer relationship management\b"],
    "Data Analysis": [r"\bdata analysis\b", r"\bdata analytics\b"],
    "Project Management": [r"\bproject management\b"],
    "Strategic Decision Making": [r"\bstrategic decision making\b"],
    "Problem Solving": [r"\bproblem solving\b"],
    "Business Communication": [r"\bbusiness communication\b"],
    "Customer Research": [r"\bcustomer research\b"],
    "Lead Generation": [r"\blead generation\b"],
    "Sales Reporting": [r"\bsales reporting\b"],
    "Sales Analysis": [r"\bsales analysis\b"],
    "Management Presentations": [r"\bmanagement presentations?\b"],
    "Customer Satisfaction": [r"\bcustomer satisfaction\b"],
    "Digital Marketing": [r"\bdigital marketing\b"],
    "Business Analytics": [r"\bbusiness analytics\b"],
    "Market Analysis": [r"\bmarket analysis\b"],

    # Soft/professional skills when explicitly stated
    "Leadership": [r"\bleadership\b"],
    "Teamwork": [r"\bteamwork\b"],
    "Communication": [r"\bcommunication\b"],
    "Time Management": [r"\btime management\b"],
    "Adaptability": [r"\badaptability\b"],
    "Critical Thinking": [r"\bcritical thinking\b"],
    "Presentation": [r"\bpresentation\b"],
    "Decision Making": [r"\bdecision making\b"],

    # Other common business skills
    "Business Development": [r"\bbusiness development\b"],
    "Sales": [r"\bsales\b"],
    "Finance": [r"\bfinance\b"],
    "Marketing": [r"\bmarketing\b"],
    "Operations": [r"\boperations\b"],
    "Human Resources": [r"\bhuman resources\b"],
}


def normalize_resume_text(text):
    if not text:
        return ""
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def extract_skills(text):
    """
    Deterministic extraction from the actual uploaded resume.

    This function is the source of truth for the current resume.
    It never carries skills from a previous upload.
    """
    if not text:
        return []

    normalized = normalize_resume_text(text)
    detected = []

    for skill, patterns in SKILL_PATTERNS.items():
        for pattern in patterns:
            try:
                if re.search(pattern, normalized, flags=re.IGNORECASE):
                    detected.append(skill)
                    break
            except re.error:
                continue

    # Keep order from the dictionary and remove duplicates.
    result = []
    seen = set()
    for skill in detected:
        key = skill.lower()
        if key not in seen:
            result.append(skill)
            seen.add(key)

    return result
