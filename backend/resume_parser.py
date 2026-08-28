import fitz

def extract_text(file):
    try:
        content = file.file.read()

        if not content:
            print("❌ Empty file")
            return ""

        doc = fitz.open(stream=content, filetype="pdf")

        text = ""
        for page in doc:
            text += page.get_text("text")

        doc.close()

        print("✅ TEXT LENGTH:", len(text))

        return text.strip()

    except Exception as e:
        print("❌ ERROR IN PDF:", e)
        return ""