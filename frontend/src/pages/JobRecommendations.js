import {
  useEffect,
  useState
} from "react";

import {
  filterJobs
} from "../api";

import "./JobRecommendations.css";

function JobRecommendations({
  result
}) {

  const [
    jobs,
    setJobs
  ] = useState([]);

  const [
    experience,
    setExperience
  ] = useState(
    "fresher"
  );

  const [
    loading,
    setLoading
  ] = useState(false);

  /*
   * =========================
   * LOAD NEW RESUME JOBS
   * =========================
   */

  useEffect(() => {

    if (!result) {

      setJobs([]);

      return;
    }

    /*
     * IMPORTANT:
     * Old jobs are removed when
     * resume_id changes.
     */

    setJobs(
      Array.isArray(
        result.jobs
      )
        ? [
            ...result.jobs
          ]
        : []
    );

  }, [
    result?.resume_id
  ]);

  /*
   * =========================
   * FETCH JOBS
   * =========================
   */

  const fetchFilteredJobs =
    async (
      selectedExperience
    ) => {

      if (!result) {
        return;
      }

      setLoading(
        true
      );

      try {

        const currentSkills =
          Array.isArray(
            result.skills
          )
            ? result.skills
            : [];

        const currentRoles =
          Array.isArray(
            result.roles
          )
            ? result.roles
            : [];

        const res =
          await filterJobs({

            /*
             * CURRENT RESUME ONLY
             */

            roles:
              currentRoles,

            skills:
              currentSkills,

            resume_text:
              result.resume_text ||
              "",

            resume_id:
              result.resume_id ||
              "",

            experience:
              selectedExperience
          });

        const newJobs =
          res?.data?.jobs ||
          res?.jobs ||
          [];

        /*
         * Replace old jobs completely.
         */

        setJobs(
          Array.isArray(
            newJobs
          )
            ? newJobs
            : []
        );

      } catch (error) {

        console.error(
          "JOB FILTER ERROR:",
          error.response?.data ||
            error
        );

        setJobs([]);

      } finally {

        setLoading(
          false
        );
      }
    };

  /*
   * =========================
   * EXPERIENCE
   * =========================
   */

  const handleExperienceChange =
    async (
      event
    ) => {

      const value =
        event.target.value;

      setExperience(
        value
      );

      await fetchFilteredJobs(
        value
      );
    };

  /*
   * =========================
   * APPLY
   * =========================
   */

  const handleApply =
    (job) => {

      const existingJobs =
        JSON.parse(
          localStorage.getItem(
            "jobsApplied"
          ) || "[]"
        );

      const jobTitle =
        job.title ||
        job.role ||
        "Job";

      const alreadyApplied =
        existingJobs.some(
          (item) =>
            item.title ===
              jobTitle &&
            item.company ===
              job.company
        );

      if (!alreadyApplied) {

        existingJobs.push({

          title:
            jobTitle,

          company:
            job.company,

          appliedAt:
            new Date()
              .toISOString()
        });

        localStorage.setItem(
          "jobsApplied",
          JSON.stringify(
            existingJobs
          )
        );

        const today =
          new Date()
            .toISOString()
            .split("T")[0];

        const savedDate =
          localStorage.getItem(
            "jobsAppliedDate"
          );

        let jobsApplied =
          Number(
            localStorage.getItem(
              "jobsAppliedToday"
            ) || 0
          );

        if (
          savedDate !==
          today
        ) {
          jobsApplied = 0;
        }

        jobsApplied +=
          1;

        localStorage.setItem(
          "jobsAppliedToday",
          String(
            jobsApplied
          )
        );

        localStorage.setItem(
          "jobsAppliedDate",
          today
        );

        window.dispatchEvent(
          new Event(
            "dashboardStatsUpdated"
          )
        );
      }

      const applyUrl =
        job.link ||
        job.apply_link;

      if (applyUrl) {

        window.open(
          applyUrl,
          "_blank",
          "noopener,noreferrer"
        );

      } else {

        alert(
          "Application link is not available."
        );
      }
    };

  /*
   * =========================
   * NO RESUME
   * =========================
   */

  if (!result) {

    return (

      <div
        className=
          "jobs-wrapper"
      >

        <div
          className=
            "empty-state"
        >

          <h2>
            Upload your resume first
          </h2>

          <p>
            Go to Home page and
            analyze your resume
          </p>

        </div>

      </div>
    );
  }

  const skills =
    Array.isArray(
      result.skills
    )
      ? result.skills
      : [];

  const roles =
    Array.isArray(
      result.roles
    )
      ? result.roles
      : [];

  return (

    <div
      className=
        "jobs-wrapper"
    >

      {/* =====================
          HEADER
      ===================== */}

      <div
        className=
          "jobs-header"
      >

        <h2>
          Job Recommendations
        </h2>

        <p>
          Jobs matched to your
          current resume skills
        </p>

        {skills.length > 0 && (

          <div
            className=
              "job-skill-context"
          >

            {skills.map(
              (
                skill,
                index
              ) => (

                <span
                  key={index}
                >
                  {skill}
                </span>

              )
            )}

          </div>

        )}

        {roles.length > 0 && (

          <p>
            Matched roles:{" "}
            {roles.join(
              ", "
            )}
          </p>

        )}

      </div>

      {/* =====================
          FILTER
      ===================== */}

      <div
        className=
          "jobs-filter-bar"
      >

        <div
          className=
            "filter-box"
        >

          <label
            className=
              "filter-label"
          >
            Experience
          </label>

          <select
            value={
              experience
            }
            onChange={
              handleExperienceChange
            }
            className=
              "experience-select"
          >

            <option value="fresher">
              Fresher
            </option>

            <option value="1">
              1 Year
            </option>

            <option value="2">
              2 Years
            </option>

            <option value="3">
              3 Years
            </option>

            <option value="5">
              5+ Years
            </option>

          </select>

        </div>

      </div>

      {/* =====================
          LOADING
      ===================== */}

      {loading && (

        <div
          className=
            "jobs-loading"
        >

          Loading jobs for the
          selected experience...

        </div>

      )}

      {/* =====================
          JOBS
      ===================== */}

      {!loading && (

        <div
          className=
            "jobs-grid"
        >

          {jobs.length > 0 ? (

            jobs.map(
              (
                job,
                index
              ) => (

                <div
                  key={`${result.resume_id || "resume"}-${index}`}
                  className=
                    "job-card"
                >

                  <div
                    className=
                      "job-top"
                  >

                    <h3
                      className=
                        "job-title"
                    >

                      {
                        job.title ||
                        job.role ||
                        "Job Opportunity"
                      }

                    </h3>

                  </div>

                  <div
                    className=
                      "job-info"
                  >

                    <p
                      className=
                        "company"
                    >
                      {
                        job.company ||
                        "Company"
                      }
                    </p>

                    <p
                      className=
                        "location"
                    >
                      {
                        job.location ||
                        "India"
                      }
                    </p>

                  </div>

                  <button
                    type="button"
                    className=
                      "apply-btn"
                    onClick={() =>
                      handleApply(
                        job
                      )
                    }
                  >
                    Apply Now →
                  </button>

                </div>

              )
            )

          ) : (

            <p
              className=
                "no-data"
            >

              No jobs are available
              for the current resume
              yet. Try changing the
              experience filter.

            </p>

          )}

        </div>

      )}

    </div>
  );
}

export default JobRecommendations;