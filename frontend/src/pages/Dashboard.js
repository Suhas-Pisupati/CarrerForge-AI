import UploadResume from "../UploadResume";

import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

import "./Dashboard.css";

import ProjectRecommendations
  from "../components/ProjectRecommendations";


ChartJS.register(
  Tooltip,
  CategoryScale,
  LinearScale,
  BarElement
);


function Dashboard({
  result,
  setResult
}) {

  // ==========================================================
  // CURRENT RESUME DATA
  // ==========================================================

  const atsScore =
    Number(
      result?.ats_score || 0
    );


  /*
   * Always use skills from the CURRENT
   * analyzed resume.
   *
   * This prevents old resume skills
   * from being reused.
   */

  const skills =
    Array.isArray(
      result?.skills
    )
      ? result.skills
      : [];


  /*
   * Current resume text.
   *
   * This is passed to Project Recommendations
   * so AI can understand the complete resume,
   * not only the skill names.
   */

  const resumeText =
    result?.resume_text ||
    "";


  /*
   * Current resume ID.
   *
   * This is important when the user uploads
   * another resume. Project Recommendations
   * can distinguish the new resume from the
   * previous resume.
   */

  const resumeId =
    result?.resume_id ||
    "";


  // ==========================================================
  // STABLE SKILL CHART
  // ==========================================================

  /*
   * DO NOT use Math.random() here.
   *
   * The old Dashboard used:
   *
   * Math.random()
   *
   * which caused the chart values to change
   * every time React rendered the component.
   *
   * We keep the original chart feature but
   * use deterministic values.
   */

  const skillChart = {

    labels:
      skills,

    datasets: [
      {
        label:
          "Skill Strength",

        data:
          skills.map(
            (_, index) =>
              70 +
              (index * 7) % 30
          ),

        backgroundColor:
          "#1e40af",

        borderRadius:
          6
      }
    ]
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="dashboard"
    >

      {/* ======================================================
          UPLOAD SECTION
      ====================================================== */}

      <div
        className="upload-section"
      >

        <UploadResume
          setResult={
            setResult
          }
        />

      </div>


      {/* ======================================================
          RESULTS
      ====================================================== */}

      {result && (

        <>

          <div
            className="dashboard-grid"
          >


            {/* ==================================================
                ATS SCORE
            ================================================== */}

            <div
              className="card score-card"
            >

              <div
                className="score-ring"
              >

                <svg
                  width="120"
                  height="120"
                >

                  {/* Background circle */}

                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                  />


                  {/* Progress circle */}

                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    style={{
                      strokeDasharray:
                        314,

                      strokeDashoffset:
                        314 -
                        (
                          314 *
                          atsScore
                        ) /
                        100
                    }}
                  />

                </svg>


                <div
                  className="score-text"
                >

                  {atsScore}%

                </div>

              </div>


              <p
                className="card-label"
              >
                ATS Score
              </p>

            </div>


            {/* ==================================================
                SKILLS
                KEEP THIS FEATURE ON DASHBOARD
            ================================================== */}

            <div
              className="card skills-card"
            >

              <div
                className="skills-header"
              >

                Skills

              </div>


              <div
                className="skills-list"
              >

                {skills.length > 0 ? (

                  skills.map(
                    (
                      skill,
                      index
                    ) => (

                      <span
                        key={
                          `${resumeId || "resume"}-${index}-${skill}`
                        }
                        className="skill-pill"
                      >

                        {skill}

                      </span>

                    )
                  )

                ) : (

                  <p
                    className="empty"
                  >

                    No skills detected

                  </p>

                )}

              </div>


              {/* ==================================================
                  SKILL CHART
              ================================================== */}

              {skills.length > 0 && (

                <div
                  className="chart-box"
                  style={{
                    height:
                      "280px"
                  }}
                >

                  <Bar
                    data={
                      skillChart
                    }

                    options={{
                      responsive:
                        true,

                      maintainAspectRatio:
                        false
                    }}
                  />

                </div>

              )}

            </div>

          </div>


          {/* ====================================================
              PROJECT RECOMMENDATIONS
          ==================================================== */}

          {skills.length > 0 && (

            <div
              className=
                "project-recommendation-container"
            >

              <ProjectRecommendations

                /*
                 * CURRENT RESUME SKILLS
                 */

                skills={
                  skills
                }


                /*
                 * CURRENT RESUME TEXT
                 */

                resumeText={
                  resumeText
                }


                /*
                 * CURRENT RESUME ID
                 */

                resumeId={
                  resumeId
                }

              />

            </div>

          )}

        </>

      )}

    </div>
  );
}


export default Dashboard;