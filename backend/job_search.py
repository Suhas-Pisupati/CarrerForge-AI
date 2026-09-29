import os
import time
from urllib.parse import quote_plus

import requests


# ============================================================
# RAPIDAPI / JSEARCH CONFIGURATION
# ============================================================

"""
JSearch has changed its API endpoint.

Older endpoint:
    https://jsearch.p.rapidapi.com/search

Current endpoint:
    https://jsearch.p.rapidapi.com/search-v2

The old /search endpoint can return 404.

RapidAPI documentation/listing currently identifies JSearch as the
current JSearch API, while current integration evidence shows the
/search-v2 endpoint being used after the /search migration.
"""


# ------------------------------------------------------------
# LOAD RAPIDAPI KEY
# ------------------------------------------------------------

# Your existing .env may contain either:
#
# RAPID_API_KEY=YOUR_KEY
#
# or:
#
# RAPIDAPI_KEY=YOUR_KEY
#
# Support BOTH so the rest of your project does not need changing.

RAPID_API_KEY = (
    os.getenv("RAPID_API_KEY", "").strip()
    or os.getenv("RAPIDAPI_KEY", "").strip()
)


# ------------------------------------------------------------
# RAPIDAPI HOST
# ------------------------------------------------------------

RAPID_API_HOST = "jsearch.p.rapidapi.com"


# ------------------------------------------------------------
# CURRENT JSEARCH ENDPOINT
# ------------------------------------------------------------

JSEARCH_URL = (
    "https://jsearch.p.rapidapi.com/search-v2"
)


# ============================================================
# REQUEST LIMITS
# ============================================================

# Maximum number of different role searches.
#
# Example:
#
# Financial Analyst
# Finance Analyst
# Marketing Analyst
# Business Analyst
# Data Analyst
#
# Maximum = 5 API requests.

MAX_API_ROLES = 5


# Maximum jobs returned to frontend.

MAX_JOBS = 30


# HTTP timeout.

REQUEST_TIMEOUT = 20


# ============================================================
# EXPERIENCE QUERY
# ============================================================

def build_experience_query(experience):

    mapping = {

        "fresher":
            "fresher entry level",

        "0":
            "fresher entry level",

        "0 years":
            "fresher entry level",

        "1":
            "1 year experience",

        "1 year":
            "1 year experience",

        "2":
            "2 years experience",

        "2 years":
            "2 years experience",

        "3":
            "3 years experience",

        "3 years":
            "3 years experience",

        "5":
            "5+ years experience",

        "5 years":
            "5+ years experience",

    }

    value = str(
        experience or "fresher"
    ).strip().lower()

    return mapping.get(
        value,
        "fresher entry level"
    )


# ============================================================
# CLEAN LIST
# ============================================================

def _clean_list(values):

    cleaned = []

    seen = set()

    for value in values or []:

        value = str(value).strip()

        if not value:
            continue

        value = " ".join(
            value.split()
        )

        key = value.lower()

        if key in seen:
            continue

        seen.add(key)

        cleaned.append(value)

    return cleaned


# ============================================================
# CLEAN SEARCH SKILLS
# ============================================================

def _clean_search_skills(skills):

    """
    Controls only the number of skills placed inside the
    external JSearch query.

    IMPORTANT:

    This does NOT remove skills from the resume.

    The complete resume skills remain available to the frontend.
    """

    skills = _clean_list(skills)

    return skills[:6]


# ============================================================
# FALLBACK JOB SEARCH
# ============================================================

def _fallback_search_jobs(
    roles,
    experience,
    skills
):

    """
    If JSearch is unavailable, returns live LinkedIn search
    links based on the CURRENT resume.

    This prevents the Jobs page from becoming completely empty.

    IMPORTANT:

    These are live search URLs, not static jobs.
    """

    roles = _clean_list(
        roles
    )

    skills = _clean_list(
        skills
    )

    jobs = []

    # --------------------------------------------------------
    # CURRENT RESUME ROLES
    # --------------------------------------------------------

    for role in roles[:10]:

        search_skills = " ".join(
            skills[:6]
        )

        query_parts = [
            role
        ]

        if search_skills:

            query_parts.append(
                search_skills
            )

        experience_text = (
            build_experience_query(
                experience
            )
        )

        if experience_text:

            query_parts.append(
                experience_text
            )

        query_parts.append(
            "India"
        )

        query = " ".join(
            query_parts
        ).strip()

        encoded = quote_plus(
            query
        )

        jobs.append({

            "title":
                f"{role} – Live Job Search",

            "company":
                "LinkedIn Jobs",

            "location":
                "India",

            "link":
                (
                    "https://www.linkedin.com/jobs/search/"
                    f"?keywords={encoded}"
                    "&location=India"
                ),

            "experience":
                experience,

            "matched_skills":
                skills[:8],

            "source":
                "LinkedIn live search",

        })

    return jobs


# ============================================================
# RAPIDAPI ERROR MESSAGE
# ============================================================

def _rate_limit_message(response):

    remaining = response.headers.get(
        "x-ratelimit-requests-remaining"
    )

    reset = response.headers.get(
        "x-ratelimit-requests-reset"
    )

    retry_after = response.headers.get(
        "Retry-After"
    )

    return (
        "429 Too Many Requests | "
        f"remaining={remaining}, "
        f"reset={reset}, "
        f"retry_after={retry_after}"
    )


# ============================================================
# NORMALIZE JSEARCH JOB
# ============================================================

def _normalize_jsearch_job(
    job,
    skills,
    experience
):

    """
    Convert JSearch response data into the structure already
    expected by CareerForge AI frontend.
    """

    if not isinstance(
        job,
        dict
    ):
        return None


    # --------------------------------------------------------
    # TITLE
    # --------------------------------------------------------

    title = (

        job.get(
            "job_title"
        )

        or

        job.get(
            "title"
        )

        or

        ""
    )

    title = str(
        title
    ).strip()


    # --------------------------------------------------------
    # COMPANY
    # --------------------------------------------------------

    company = (

        job.get(
            "employer_name"
        )

        or

        job.get(
            "company_name"
        )

        or

        job.get(
            "employer"
        )

        or

        "Unknown"
    )

    company = str(
        company
    ).strip()


    # --------------------------------------------------------
    # LOCATION
    # --------------------------------------------------------

    city = (
        job.get(
            "job_city"
        )
        or
        ""
    )

    state = (
        job.get(
            "job_state"
        )
        or
        ""
    )

    country = (
        job.get(
            "job_country"
        )
        or
        "India"
    )

    location_parts = []

    if city:
        location_parts.append(
            str(city).strip()
        )

    if state:
        location_parts.append(
            str(state).strip()
        )

    if not location_parts and country:

        location_parts.append(
            str(country).strip()
        )

    location = ", ".join(
        location_parts
    )


    if not location:

        location = "India"


    # --------------------------------------------------------
    # APPLY LINK
    # --------------------------------------------------------

    link = (

        job.get(
            "job_apply_link"
        )

        or

        job.get(
            "job_google_link"
        )

        or

        ""
    )

    # --------------------------------------------------------
    # APPLY OPTIONS
    # --------------------------------------------------------

    if not link:

        apply_options = (
            job.get(
                "apply_options"
            )
            or
            []
        )

        if isinstance(
            apply_options,
            list
        ):

            for option in apply_options:

                if not isinstance(
                    option,
                    dict
                ):
                    continue

                candidate_link = (

                    option.get(
                        "apply_link"
                    )

                    or

                    option.get(
                        "link"
                    )

                    or

                    ""
                )

                if candidate_link:

                    link = candidate_link

                    break


    link = str(
        link
    ).strip()


    # --------------------------------------------------------
    # JOB ID
    # --------------------------------------------------------

    job_id = (

        job.get(
            "job_id"
        )

        or

        job.get(
            "id"
        )

        or

        link
    )

    job_id = str(
        job_id
    ).strip()


    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

    description = (

        job.get(
            "job_description"
        )

        or

        job.get(
            "description"
        )

        or

        ""
    )

    description = str(
        description
    ).strip()


    # --------------------------------------------------------
    # POSTED DATE
    # --------------------------------------------------------

    posted_date = (

        job.get(
            "job_posted_at_datetime_utc"
        )

        or

        job.get(
            "job_posted_at"
        )

        or

        job.get(
            "posted_date"
        )

        or

        ""
    )

    posted_date = str(
        posted_date
    ).strip()


    # --------------------------------------------------------
    # SALARY
    # --------------------------------------------------------

    salary_min = (
        job.get(
            "job_min_salary"
        )
    )

    salary_max = (
        job.get(
            "job_max_salary"
        )
    )


    # --------------------------------------------------------
    # REMOTE
    # --------------------------------------------------------

    is_remote = bool(
        job.get(
            "job_is_remote",
            False
        )
    )


    # --------------------------------------------------------
    # EMPLOYMENT TYPE
    # --------------------------------------------------------

    employment_type = (

        job.get(
            "job_employment_type"
        )

        or

        ""
    )


    # --------------------------------------------------------
    # PUBLISHER
    # --------------------------------------------------------

    publisher = (

        job.get(
            "job_publisher"
        )

        or

        "JSearch"
    )

    publisher = str(
        publisher
    ).strip()


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "id":
            job_id,

        "title":
            title,

        "company":
            company,

        "location":
            location,

        "link":
            link,

        "experience":
            experience,

        "matched_skills":
            skills[:8],

        "description":
            description,

        "salary_min":
            salary_min,

        "salary_max":
            salary_max,

        "posted_date":
            posted_date,

        "employment_type":
            employment_type,

        "is_remote":
            is_remote,

        "source":
            f"JSearch - {publisher}",

    }


# ============================================================
# EXTRACT JSEARCH DATA
# ============================================================

def _extract_jsearch_jobs(data):

    """
    JSearch versions may return slightly different response
    structures.

    Support both:

    {
        "data": [...]
    }

    and:

    {
        "data": {
            "jobs": [...]
        }
    }

    This keeps the frontend independent from API response shape.
    """

    if not isinstance(
        data,
        dict
    ):
        return []


    payload = data.get(
        "data"
    )


    # --------------------------------------------------------
    # DATA = LIST
    # --------------------------------------------------------

    if isinstance(
        payload,
        list
    ):

        return payload


    # --------------------------------------------------------
    # DATA = DICT
    # --------------------------------------------------------

    if isinstance(
        payload,
        dict
    ):

        jobs = payload.get(
            "jobs"
        )

        if isinstance(
            jobs,
            list
        ):

            return jobs


        # Other possible names.

        jobs = payload.get(
            "results"
        )

        if isinstance(
            jobs,
            list
        ):

            return jobs


    # --------------------------------------------------------
    # TOP LEVEL JOBS
    # --------------------------------------------------------

    jobs = data.get(
        "jobs"
    )

    if isinstance(
        jobs,
        list
    ):

        return jobs


    return []


# ============================================================
# SEARCH JOBS
# ============================================================

def search_jobs(
    roles,
    experience="fresher",
    skills=None
):

    """
    Search jobs using the CURRENT resume.

    CURRENT RESUME
        ↓
    CURRENT ROLES
        +
    CURRENT SKILLS
        ↓
    JSEARCH /search-v2
        ↓
    LIVE JOBS

    If JSearch fails:
        ↓
    LIVE LINKEDIN SEARCH FALLBACK

    """

    # --------------------------------------------------------
    # CLEAN ROLES
    # --------------------------------------------------------

    roles = _clean_list(
        roles
    )


    # --------------------------------------------------------
    # CLEAN SKILLS
    # --------------------------------------------------------

    skills = _clean_list(
        skills
    )


    # --------------------------------------------------------
    # NO ROLES
    # --------------------------------------------------------

    if not roles:

        if skills:

            roles = [
                f"{skills[0]} Jobs"
            ]

        else:

            return []


    # --------------------------------------------------------
    # API KEY CHECK
    # --------------------------------------------------------

    if not RAPID_API_KEY:

        print(
            "RAPID_API_KEY / RAPIDAPI_KEY "
            "is not configured."
        )

        print(
            "Using current-resume LinkedIn "
            "live search fallback."
        )

        return _fallback_search_jobs(
            roles,
            experience,
            skills
        )


    # --------------------------------------------------------
    # RAPIDAPI HEADERS
    # --------------------------------------------------------

    headers = {

        "X-RapidAPI-Key":
            RAPID_API_KEY,

        "X-RapidAPI-Host":
            RAPID_API_HOST,

        "Accept":
            "application/json",

        "User-Agent":
            "CareerForgeAI/1.0",
    }


    # --------------------------------------------------------
    # EXPERIENCE
    # --------------------------------------------------------

    exp_text = build_experience_query(
        experience
    )


    # --------------------------------------------------------
    # SEARCH SKILLS
    # --------------------------------------------------------

    search_skills = _clean_search_skills(
        skills
    )


    # --------------------------------------------------------
    # JOB STORAGE
    # --------------------------------------------------------

    jobs = []

    seen_links = set()

    seen_ids = set()


    # --------------------------------------------------------
    # API FAILURE FLAG
    # --------------------------------------------------------

    api_failed = False


    # ========================================================
    # SEARCH CURRENT RESUME ROLES
    # ========================================================

    for role in roles[:MAX_API_ROLES]:

        # ----------------------------------------------------
        # BUILD QUERY
        # ----------------------------------------------------

        query_parts = [
            role
        ]


        if search_skills:

            query_parts.append(
                " ".join(
                    search_skills
                )
            )


        if exp_text:

            query_parts.append(
                exp_text
            )


        query_parts.append(
            "India"
        )


        query = " ".join(
            query_parts
        ).strip()


        # ----------------------------------------------------
        # REQUEST
        # ----------------------------------------------------

        try:

            print(
                f"JSearch request: {role}"
            )

            response = requests.get(

                JSEARCH_URL,

                headers=headers,

                params={

                    "query":
                        query,

                    "page":
                        "1",

                    "num_pages":
                        "1",

                    "date_posted":
                        "month",
                },

                timeout=REQUEST_TIMEOUT
            )


            # =================================================
            # RATE LIMIT
            # =================================================

            if response.status_code == 429:

                print(
                    "JOB API RATE LIMIT:"
                )

                print(
                    _rate_limit_message(
                        response
                    )
                )

                api_failed = True

                break


            # =================================================
            # AUTHORIZATION
            # =================================================

            if response.status_code in (
                401,
                403
            ):

                print(
                    "JSearch authorization error."
                )

                print(
                    f"HTTP status: "
                    f"{response.status_code}"
                )

                print(
                    "Check that your RapidAPI key "
                    "is valid and that your JSearch "
                    "subscription is active."
                )

                api_failed = True

                break


            # =================================================
            # ENDPOINT NOT FOUND
            # =================================================

            if response.status_code == 404:

                print(
                    "JSearch endpoint returned 404."
                )

                print(
                    "Current endpoint being used:"
                )

                print(
                    JSEARCH_URL
                )

                print(
                    "Falling back to live LinkedIn "
                    "search."
                )

                api_failed = True

                break


            # =================================================
            # OTHER HTTP ERRORS
            # =================================================

            response.raise_for_status()


            # =================================================
            # JSON
            # =================================================

            try:

                data = response.json()

            except ValueError:

                print(
                    "JSearch returned a non-JSON "
                    "response."
                )

                api_failed = True

                break


            # =================================================
            # EXTRACT JOBS
            # =================================================

            raw_jobs = _extract_jsearch_jobs(
                data
            )


            # ------------------------------------------------
            # PROCESS JOBS
            # ------------------------------------------------

            for raw_job in raw_jobs:

                normalized = (
                    _normalize_jsearch_job(
                        raw_job,
                        skills,
                        experience
                    )
                )


                if not normalized:

                    continue


                link = normalized.get(
                    "link",
                    ""
                )


                job_id = normalized.get(
                    "id",
                    ""
                )


                # --------------------------------------------
                # MUST HAVE TITLE
                # --------------------------------------------

                if not normalized.get(
                    "title"
                ):

                    continue


                # --------------------------------------------
                # MUST HAVE LINK
                # --------------------------------------------

                if not link:

                    continue


                # --------------------------------------------
                # DUPLICATE LINK
                # --------------------------------------------

                if link in seen_links:

                    continue


                # --------------------------------------------
                # DUPLICATE ID
                # --------------------------------------------

                if (
                    job_id
                    and
                    job_id in seen_ids
                ):

                    continue


                seen_links.add(
                    link
                )


                if job_id:

                    seen_ids.add(
                        job_id
                    )


                jobs.append(
                    normalized
                )


                # --------------------------------------------
                # MAX JOBS
                # --------------------------------------------

                if len(jobs) >= MAX_JOBS:

                    return jobs


            # ------------------------------------------------
            # SMALL DELAY
            # ------------------------------------------------

            time.sleep(
                0.4
            )


        # ====================================================
        # TIMEOUT
        # ====================================================

        except requests.exceptions.Timeout:

            print(
                f"JOB API TIMEOUT for role "
                f"'{role}'"
            )

            api_failed = True

            break


        # ====================================================
        # REQUEST ERROR
        # ====================================================

        except requests.exceptions.RequestException as exc:

            print(
                f"JOB API ERROR for role "
                f"'{role}': {exc}"
            )

            api_failed = True

            break


        # ====================================================
        # UNKNOWN ERROR
        # ====================================================

        except Exception as exc:

            print(
                f"UNEXPECTED JOB API ERROR "
                f"for role '{role}': {exc}"
            )

            api_failed = True

            break


    # ========================================================
    # RETURN JSEARCH RESULTS
    # ========================================================

    if jobs:

        print(
            f"JSearch returned "
            f"{len(jobs)} usable jobs."
        )

        return jobs


    # ========================================================
    # FALLBACK
    # ========================================================

    print(
        "JSearch returned no usable jobs."
    )


    if api_failed:

        print(
            "Using current-resume LinkedIn "
            "live search fallback."
        )

    else:

        print(
            "Using current-resume LinkedIn "
            "live search fallback."
        )


    return _fallback_search_jobs(
        roles,
        experience,
        skills
    )