import requests

RAPID_API_KEY = "bd8af45832mshbd318ca9317ab17p111a92jsna31b9e6c8cb5"

# ==========================================
# BUILD EXPERIENCE QUERY
# ==========================================
def build_experience_query(experience):

    if experience == "fresher":
        return "fresher jobs"

    elif experience == "1":
        return "1 year experience jobs"

    elif experience == "2":
        return "2 years experience jobs"

    elif experience == "3":
        return "3 years experience jobs"

    elif experience == "5":
        return "5+ years experience jobs"

    return "fresher jobs"


# ==========================================
# SEARCH JOBS
# ==========================================
def search_jobs(roles, experience="fresher"):

    jobs = []

    seen_links = set()

    headers = {
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    exp_text = build_experience_query(experience)

    for role in roles:

        # Search multiple pages
        for page in range(1, 4):

            try:

                query = f"{role} {exp_text} India"

                response = requests.get(
                    "https://jsearch.p.rapidapi.com/search",
                    headers=headers,
                    params={
                        "query": query,
                        "page": str(page),
                        "num_pages": "1"
                    }
                )

                data = response.json()

                for job in data.get("data", []):

                    link = job.get("job_apply_link", "")

                    # Remove duplicate jobs
                    if link in seen_links:
                        continue

                    seen_links.add(link)

                    jobs.append({

                        "title": job.get("job_title", ""),

                        "company": job.get("employer_name", ""),

                        "location":
                            job.get("job_city")
                            or job.get("job_state")
                            or job.get("job_country")
                            or "India",

                        "link": link,

                        "experience": experience

                    })

                    # Return 30 jobs
                    if len(jobs) >= 30:
                        return jobs

            except Exception as e:

                print("JOB API ERROR:", e)

                continue

    return jobs