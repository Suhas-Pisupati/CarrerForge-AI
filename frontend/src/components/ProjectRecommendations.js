import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProjectRecommendations } from "../api";
import "./ProjectRecommendations.css";

function ProjectRecommendations({
  skills,
  resumeText = "",
  resumeId = "",
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ==========================================================
  // CURRENT RESUME SKILLS
  // ==========================================================
  // Skills are used internally for AI generation.
  // They are NOT displayed on this page.
  // ==========================================================

  const currentSkills = Array.isArray(skills)
    ? skills
    : [];

  // ==========================================================
  // CLEAR OLD PROJECTS WHEN NEW RESUME IS UPLOADED
  // ==========================================================

  useEffect(() => {
    setProjects([]);
  }, [resumeId]);

  // ==========================================================
  // GENERATE PROJECT RECOMMENDATIONS
  // ==========================================================

  const generateProjects = async () => {
    if (currentSkills.length === 0) {
      alert(
        "Please upload and analyze a resume with skills first."
      );
      return;
    }

    setLoading(true);

    // Clear previous projects immediately
    // so old resume recommendations are not visible
    // while the new resume is being processed.
    setProjects([]);

    try {
      console.log(
        "PROJECT RECOMMENDATION CURRENT RESUME ID:",
        resumeId
      );

      console.log(
        "PROJECT RECOMMENDATION CURRENT SKILLS:",
        currentSkills
      );

      console.log(
        "PROJECT RECOMMENDATION RESUME TEXT:",
        resumeText
          ? "Resume text available"
          : "No resume text available"
      );

      // ======================================================
      // IMPORTANT:
      // Send ONLY the CURRENT resume context.
      // ======================================================

      const res = await getProjectRecommendations({
        skills: currentSkills,

        resume_text: resumeText,

        resume_id: resumeId,
      });

      console.log(
        "PROJECT RECOMMENDATION RESPONSE:",
        res
      );

      const generated =
        res?.data?.projects ||
        res?.projects ||
        [];

      setProjects(
        Array.isArray(generated)
          ? generated
          : []
      );

    } catch (error) {
      console.error(
        "PROJECT GENERATION ERROR:",
        error.response?.data || error
      );

      setProjects([]);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // OPEN COMPLETE PROJECT GUIDE
  // ==========================================================

  const openProject = (title) => {
    if (!title) {
      return;
    }

    navigate("/project-guide", {
      state: {
        projectTitle: title,

        // Pass current resume context
        // to Project Guide.
        skills: currentSkills,

        resumeText: resumeText,

        resumeId: resumeId,
      },
    });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="project-section">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="project-header">

        <h2>
          AI Project Recommender
        </h2>

        {/*
          IMPORTANT:
          The skills list has intentionally been removed.

          Skills are still sent to the backend internally,
          but they are NOT displayed underneath the heading.
        */}

      </div>


      {/* ======================================================
          GENERATE BUTTON
          ====================================================== */}

      <div className="project-button-wrap">

        <button
          onClick={generateProjects}
          className="generate-project-btn"
          disabled={loading}
        >
          {loading
            ? "Generating..."
            : "🚀 Generate Project Ideas"}
        </button>

      </div>


      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading && (
        <div className="project-loading">
          Generating Projects...
        </div>
      )}


      {/* ======================================================
          PROJECT GRID
          ====================================================== */}

      {!loading &&
        projects.length > 0 && (

          <div className="project-grid">

            {projects.map(
              (project, index) => (

                <div
                  key={index}
                  className="project-card"
                >

                  {/* ==========================================
                      PROJECT TOP
                      ========================================== */}

                  <div className="project-top">

                    <h3 className="project-title">
                      {project.title}
                    </h3>


                    <span
                      className={`level-badge ${
                        project.difficulty?.toLowerCase() || ""
                      }`}
                    >
                      {project.difficulty ||
                        "Intermediate"}
                    </span>

                  </div>


                  {/* ==========================================
                      PROJECT BODY
                      ========================================== */}

                  <div className="project-card-body">

                    {/* ========================================
                        TECH STACK
                        ======================================== */}

                    <div className="tech-stack-box">

                      <span className="label">
                        Tech Stack
                      </span>

                      <div className="value">
                        {project.tech_stack ||
                          "N/A"}
                      </div>

                    </div>


                    {/* ========================================
                        ARCHITECTURE
                        ======================================== */}

                    <div className="arch-box">

                      <span className="label">
                        Architecture
                      </span>

                      <div className="value">
                        {project.architecture ||
                          "N/A"}
                      </div>

                    </div>


                    {/* ========================================
                        FEATURES
                        ======================================== */}

                    <div className="feature-section">

                      <div className="feature-title">
                        Key Features
                      </div>


                      <div className="feature-list">

                        {Array.isArray(
                          project.features
                        ) &&
                        project.features.length > 0 ? (

                          project.features.map(
                            (
                              feature,
                              featureIndex
                            ) => (

                              <span
                                key={
                                  featureIndex
                                }
                                className="feature-chip"
                              >
                                {feature}
                              </span>

                            )
                          )

                        ) : (

                          <span className="no-feature">
                            No features available
                          </span>

                        )}

                      </div>

                    </div>

                  </div>


                  {/* ==========================================
                      PROJECT FOOTER
                      ========================================== */}

                  <div className="project-card-footer">

                    <button
                      className="open-project-btn"
                      onClick={() =>
                        openProject(
                          project.title
                        )
                      }
                    >
                      View Complete Guide
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}


      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {!loading &&
        projects.length === 0 && (

          <div className="project-empty-state">

            Click{" "}

            <strong>
              Generate Project Ideas
            </strong>{" "}

            to get project recommendations.

          </div>

        )}

    </div>
  );
}

export default ProjectRecommendations;