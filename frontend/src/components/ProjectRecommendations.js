import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProjectRecommendations.css";

function ProjectRecommendations({ skills }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const generateProjects = async () => {
    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/projects",
        { skills }
      );

      setProjects(res.data.projects || []);
    } catch (error) {
      console.error("PROJECT GENERATION ERROR:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const openProject = (title) => {
    navigate("/project-guide", {
      state: {
        projectTitle: title,
      },
    });
  };

  return (
    <div className="project-section">
      <div className="project-header">
        <h2>AI Project Recommender</h2>
      </div>

      <div className="project-button-wrap">
        <button
          onClick={generateProjects}
          className="generate-project-btn"
        >
          🚀 Generate Project Ideas
        </button>
      </div>

      {loading && (
        <div className="project-loading">
          Generating Projects...
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              {/* TOP */}
              <div className="project-top">
                <h3 className="project-title">
                  {project.title}
                </h3>

                <span
                  className={`level-badge ${
                    project.difficulty?.toLowerCase() || ""
                  }`}
                >
                  {project.difficulty || "Intermediate"}
                </span>
              </div>

              {/* CONTENT */}
              <div className="project-card-body">
                <div className="tech-stack-box">
                  <span className="label">Tech Stack</span>
                  <div className="value">
                    {project.tech_stack || "N/A"}
                  </div>
                </div>

                <div className="arch-box">
                  <span className="label">Architecture</span>
                  <div className="value">
                    {project.architecture || "N/A"}
                  </div>
                </div>

                <div className="feature-section">
                  <div className="feature-title">
                    Key Features
                  </div>

                  <div className="feature-list">
                    {project.features?.length > 0 ? (
                      project.features.map((feature, i) => (
                        <span
                          key={i}
                          className="feature-chip"
                        >
                          {feature}
                        </span>
                      ))
                    ) : (
                      <span className="no-feature">
                        No features available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BUTTON ALWAYS AT BOTTOM */}
              <div className="project-card-footer">
                <button
                  className="open-project-btn"
                  onClick={() => openProject(project.title)}
                >
                  View Complete Guide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="project-empty-state">
          Click <strong>Generate Project Ideas</strong> to get project recommendations.
        </div>
      )}
    </div>
  );
}

export default ProjectRecommendations;