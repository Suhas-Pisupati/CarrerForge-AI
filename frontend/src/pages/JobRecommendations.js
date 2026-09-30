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


  // =========================================================
  // LOAD JOBS FOR CURRENT RESUME
  // =========================================================

  useEffect(() => {

    /*
     * No resume available
     */

    if (!result) {

      setJobs([]);

      return;
    }


    /*
     * IMPORTANT:
     *
     * Whenever a new resume is uploaded,
     * result.resume_id changes.
     *
     * We completely replace the old jobs.
     *
     * This prevents jobs from the previous
     * resume remaining on the screen.
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


  // =========================================================
  // FETCH FILTERED JOBS
  // =========================================================

  const fetchFilteredJobs =
    async (
      selectedExperience
    ) => {

      /*
       * No resume
       */

      if (!result) {
        return;
      }


      setLoading(
        true
      );


      try {

        /*
         * =====================================================
         * CURRENT RESUME SKILLS
         * =====================================================
         *
         * These are taken from the CURRENT resume only.
         */

        const currentSkills =
          Array.isArray(
            result.skills
          )
            ? [
                ...result.skills
              ]
            : [];


        /*
         * =====================================================
         * CURRENT RESUME ROLES
         * =====================================================
         */

        const currentRoles =
          Array.isArray(
            result.roles
          )
            ? [
                ...result.roles
              ]
            : [];


        console.log(
          "JOB SEARCH CURRENT RESUME ID:",
          result.resume_id
        );


        console.log(
          "JOB SEARCH CURRENT SKILLS:",
          currentSkills
        );


        console.log(
          "JOB SEARCH CURRENT ROLES:",
          currentRoles
        );


        /*
         * =====================================================
         * API REQUEST
         * =====================================================
         *
         * All current resume information is sent.
         *
         * Skills and roles are NOT displayed in the UI.
         * They are used internally by the backend.
         */

        const res =
          await filterJobs({

            /*
             * Resume-derived roles
             */

            roles:
              currentRoles,


            /*
             * Resume-derived skills
             */

            skills:
              currentSkills,


            /*
             * Full current resume text
             */

            resume_text:
              result.resume_text ||
              "",


            /*
             * Current resume ID
             *
             * This prevents using stale
             * information from an older resume.
             */

            resume_id:
              result.resume_id ||
              "",


            /*
             * Selected experience
             */

            experience:
              selectedExperience

          });


        /*
         * =====================================================
         * GET NEW JOBS
         * =====================================================
         */

        const newJobs =
          res?.data?.jobs ||
          res?.jobs ||
          [];


        /*
         * =====================================================
         * REPLACE OLD JOBS COMPLETELY
         * =====================================================
         *
         * Never append new jobs to old jobs.
         */

        setJobs(
          Array.isArray(
            newJobs
          )
            ? newJobs
            : []
        );


      } catch (
        error
      ) {

        console.error(
          "JOB FILTER ERROR:",
          error.response?.data ||
            error
        );


        /*
         * If the current search fails,
         * don't show jobs belonging to
         * an older resume.
         */

        setJobs([]);

      } finally {

        setLoading(
          false
        );

      }

    };


  // =========================================================
  // EXPERIENCE CHANGE HANDLER
  // =========================================================

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


  // =========================================================
  // APPLY JOB
  // =========================================================
  //
  // Prevent duplicate applications
  // and update Jobs Applied Today.
  // =========================================================

  const handleApply =
    (job) => {

      /*
       * Get existing application history.
       */

      const existingJobs =
        JSON.parse(
          localStorage.getItem(
            "jobsApplied"
          ) || "[]"
        );


      /*
       * Support both API formats:
       *
       * job.title
       * job.role
       */

      const jobTitle =
        job.title ||
        job.role ||
        "Job";


      /*
       * Check if this job was
       * already applied for.
       */

      const alreadyApplied =
        existingJobs.some(
          (
            item
          ) =>
            item.title ===
              jobTitle &&
            item.company ===
              job.company
        );


      // =======================================================
      // ONLY COUNT NEW APPLICATIONS
      // =======================================================

      if (
        !alreadyApplied
      ) {

        /*
         * -----------------------------------------------
         * SAVE APPLICATION HISTORY
         * -----------------------------------------------
         */

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


        /*
         * -----------------------------------------------
         * JOBS APPLIED TODAY
         * -----------------------------------------------
         */

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


        /*
         * -----------------------------------------------
         * RESET COUNT WHEN NEW DAY STARTS
         * -----------------------------------------------
         */

        if (
          savedDate !==
          today
        ) {

          jobsApplied =
            0;

        }


        /*
         * -----------------------------------------------
         * INCREASE TODAY'S COUNT
         * -----------------------------------------------
         */

        jobsApplied +=
          1;


        /*
         * -----------------------------------------------
         * SAVE TODAY'S COUNT
         * -----------------------------------------------
         */

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


        /*
         * -----------------------------------------------
         * UPDATE DASHBOARD IMMEDIATELY
         * -----------------------------------------------
         */

        window.dispatchEvent(
          new Event(
            "dashboardStatsUpdated"
          )
        );

      }


      // =======================================================
      // OPEN APPLICATION LINK
      // =======================================================

      const applyUrl =
        job.link ||
        job.apply_link;


      if (
        applyUrl
      ) {

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


  // =========================================================
  // EMPTY STATE — NO RESUME
  // =========================================================

  if (
    !result
  ) {

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


  // =========================================================
  // CURRENT RESUME DATA
  // =========================================================
  //
  // These values are intentionally NOT rendered
  // on the page.
  //
  // They are available for the job API.
  // =========================================================

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


  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (

    <div
      className=
        "jobs-wrapper"
    >

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        className=
          "jobs-header"
      >

        <h2>
          Job Recommendations
        </h2>


        <p>
          Jobs matched to your
          resume skills
        </p>


        {/* ===================================================
            IMPORTANT:
            
            DO NOT DISPLAY SKILLS HERE.
            
            Skills are still stored in:
            
            const skills = result.skills
            
            and sent to the backend.
            =================================================== */}


        {/* ===================================================
            IMPORTANT:
            
            DO NOT DISPLAY ROLES HERE.
            
            Roles are still stored in:
            
            const roles = result.roles
            
            and sent to the backend.
            =================================================== */}

      </div>


      {/* =====================================================
          FILTER BAR
          ===================================================== */}

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

            <option
              value="fresher"
            >
              Fresher
            </option>


            <option
              value="1"
            >
              1 Year
            </option>


            <option
              value="2"
            >
              2 Years
            </option>


            <option
              value="3"
            >
              3 Years
            </option>


            <option
              value="5"
            >
              5+ Years
            </option>

          </select>

        </div>

      </div>


      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading && (

        <div
          className=
            "jobs-loading"
        >

          Loading jobs for selected
          experience...

        </div>

      )}


      {/* =====================================================
          JOB GRID
          ===================================================== */}

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
                  key={
                    `${
                      result.resume_id ||
                      "resume"
                    }-${index}`
                  }
                  className=
                    "job-card"
                >

                  {/* =========================================
                      JOB TITLE
                      ========================================= */}

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


                  {/* =========================================
                      JOB INFORMATION
                      ========================================= */}

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


                  {/* =========================================
                      APPLY BUTTON
                      ========================================= */}

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