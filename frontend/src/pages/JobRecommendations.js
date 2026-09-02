import { useEffect, useState } from "react";
import { filterJobs } from "../api";
import "./JobRecommendations.css";

function JobRecommendations({ result }) {
  const [jobs, setJobs] = useState([]);
  const [experience, setExperience] = useState("fresher");
  const [loading, setLoading] = useState(false);

  // =========================================
  // LOAD DEFAULT JOBS FROM RESULT
  // =========================================

  useEffect(() => {
    if (result?.jobs) {
      setJobs(result.jobs);
    }
  }, [result]);

  // =========================================
  // FETCH FILTERED JOBS
  // =========================================

  const fetchFilteredJobs =
    async (selectedExperience) => {

      if (!result) {
        return;
      }

      setLoading(true);

      try {

        const res =
          await filterJobs({

            // Resume-derived roles
            roles:
              result?.roles || [],

            // Resume-derived skills
            skills:
              result?.skills || [],

            // Selected experience
            experience:
              selectedExperience,

          });

        setJobs(
          res?.data?.jobs ||
          res?.jobs ||
          []
        );

      } catch (error) {

        console.error(
          "JOB FILTER ERROR:",
          error
        );

        setJobs([]);

      } finally {

        setLoading(false);

      }

    };

  // =========================================
  // EXPERIENCE CHANGE HANDLER
  // =========================================

  const handleExperienceChange = async (e) => {
    const value = e.target.value;

    setExperience(value);

    await fetchFilteredJobs(value);
  };

  // =========================================
  // APPLY JOB
  // =========================================
  // Prevent duplicate job applications
  // and update Jobs Applied Today
  // =========================================

  const handleApply = (job) => {
    const existingJobs =
      JSON.parse(
        localStorage.getItem("jobsApplied") || "[]"
      );

    const jobTitle = job.title || job.role;

    const alreadyApplied = existingJobs.some(
      (item) =>
        item.title === jobTitle &&
        item.company === job.company
    );

    // =========================================
    // ONLY COUNT NEW APPLICATIONS
    // =========================================

    if (!alreadyApplied) {

      // -----------------------------------------
      // SAVE APPLICATION HISTORY
      // -----------------------------------------

      existingJobs.push({
        title: jobTitle,
        company: job.company,
        appliedAt: new Date().toISOString(),
      });

      localStorage.setItem(
        "jobsApplied",
        JSON.stringify(existingJobs)
      );

      // =========================================
      // JOBS APPLIED TODAY
      // =========================================

      const today =
        new Date().toISOString().split("T")[0];

      const savedDate =
        localStorage.getItem("jobsAppliedDate");

      let jobsApplied =
        Number(
          localStorage.getItem(
            "jobsAppliedToday"
          ) || 0
        );

      // -----------------------------------------
      // RESET COUNT WHEN A NEW DAY STARTS
      // -----------------------------------------

      if (savedDate !== today) {
        jobsApplied = 0;
      }

      // -----------------------------------------
      // INCREASE TODAY'S COUNT
      // -----------------------------------------

      jobsApplied += 1;

      // -----------------------------------------
      // SAVE TODAY'S COUNT
      // -----------------------------------------

      localStorage.setItem(
        "jobsAppliedToday",
        jobsApplied
      );

      localStorage.setItem(
        "jobsAppliedDate",
        today
      );

      // =========================================
      // UPDATE DASHBOARD IMMEDIATELY
      // =========================================

      window.dispatchEvent(
        new Event("dashboardStatsUpdated")
      );
    }

    // =========================================
    // OPEN APPLICATION LINK
    // =========================================

    const applyUrl =
      job.link || job.apply_link;

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

  // =========================================
  // EMPTY STATE
  // =========================================

  if (!result) {

    return (

      <div className="jobs-wrapper">

        <div className="empty-state">

          <h2>
            Upload your resume first
          </h2>

          <p>
            Go to Home page and analyze your resume
          </p>

        </div>

      </div>

    );

  }

  // =========================================
  // MAIN PAGE
  // =========================================

  return (

    <div className="jobs-wrapper">

      {/* HEADER */}

      <div className="jobs-header">

        <h2>
          Job Recommendations
        </h2>

        <p>
          Jobs matched to your resume skills
        </p>

      </div>


      {/* FILTER BAR */}

      <div className="jobs-filter-bar">

        <div className="filter-box">

          <label className="filter-label">
            Experience
          </label>

          <select
            value={experience}
            onChange={handleExperienceChange}
            className="experience-select"
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


      {/* LOADING */}

      {loading && (

        <div className="jobs-loading">

          Loading jobs for selected
          experience...

        </div>

      )}


      {/* JOB GRID */}

      {!loading && (

        <div className="jobs-grid">

          {jobs.length > 0 ? (

            jobs.map((job, i) => (

              <div
                key={i}
                className="job-card"
              >

                {/* JOB TITLE */}

                <div className="job-top">

                  <h3 className="job-title">

                    {job.title || job.role}

                  </h3>

                </div>


                {/* JOB INFORMATION */}

                <div className="job-info">

                  <p className="company">
                    {job.company}
                  </p>

                  <p className="location">
                    {job.location}
                  </p>

                </div>


                {/* APPLY BUTTON */}

                <button
                  type="button"
                  className="apply-btn"
                  onClick={() =>
                    handleApply(job)
                  }
                >

                  Apply Now →

                </button>

              </div>

            ))

          ) : (

            <p className="no-data">

              No jobs found for this
              experience level

            </p>

          )}

        </div>

      )}

    </div>

  );

}

export default JobRecommendations;