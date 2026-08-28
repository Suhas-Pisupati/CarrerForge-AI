def extract_skills(text):

    skills = ["python","java","html","css","javascript","sql"]

    text = text.lower()

    found = [s for s in skills if s in text]

    return found if found else ["python","java"]