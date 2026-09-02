import { useState, useEffect } from "react";
import "./ProjectGuide.css";
import { useLocation } from "react-router-dom";
import { getProjectGuide } from "../api";

function ProjectGuide() {
  const location = useLocation();

  const incomingTitle = location.state?.projectTitle || "";

  const [projectTitle, setProjectTitle] = useState(incomingTitle);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // FORMAT HELPERS
  // =========================
  const renderFolderStructure = (folderStructure) => {
    if (!folderStructure) return "No folder structure available.";

    if (typeof folderStructure === "string") {
      return folderStructure;
    }

    if (Array.isArray(folderStructure)) {
      return folderStructure.join("\n");
    }

    if (typeof folderStructure === "object") {
      return JSON.stringify(folderStructure, null, 2);
    }

    return String(folderStructure);
  };

  const renderDatabase = (database) => {
    if (!database) return <p>No database details available.</p>;

    if (typeof database === "string") {
      return <p>{database}</p>;
    }

    if (Array.isArray(database)) {
      return (
        <ul>
          {database.map((item, index) => (
            <li key={index}>
              {typeof item === "string"
                ? item
                : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof database === "object") {
      return (
        <div>
          {Object.entries(database).map(([key, value]) => (
            <div
              key={key}
              style={{ marginBottom: "10px" }}
            >
              <strong>{key}:</strong>{" "}
              {Array.isArray(value)
                ? value.join(", ")
                : typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </div>
          ))}
        </div>
      );
    }

    return <p>{String(database)}</p>;
  };

  const renderList = (data) => {
    if (!data) return <li>No data available</li>;

    if (Array.isArray(data)) {
      return data.map((item, index) => (
        <li key={index}>
          {typeof item === "string"
            ? item
            : JSON.stringify(item)}
        </li>
      ));
    }

    if (typeof data === "string") {
      return <li>{data}</li>;
    }

    if (typeof data === "object") {
      return Object.entries(data).map(
        ([key, value], index) => (
          <li key={index}>
            <strong>{key}:</strong>{" "}
            {Array.isArray(value)
              ? value.join(", ")
              : typeof value === "object"
              ? JSON.stringify(value)
              : String(value)}
          </li>
        )
      );
    }

    return <li>{String(data)}</li>;
  };

  // =========================
  // GENERATE GUIDE
  // =========================
  const generateGuide = async (title = projectTitle) => {

    if (!title || !title.trim()) {

      alert(
        "Please enter a project title"
      );

      return;
    }

    setLoading(true);

    setGuide(null);

    try {

      const res = await getProjectGuide({
        project_title:
          title.trim(),
      });

      setGuide(
        res.data || res
      );

    } catch (err) {

      console.error(
        "PROJECT GUIDE ERROR:",
        err
      );

      setGuide(null);

    } finally {

      setLoading(false);

    }

  };


  // =========================
  // AUTO LOAD IF COMING FROM DASHBOARD CARD
  // =========================
  useEffect(() => {

    if (incomingTitle) {

      setProjectTitle(
        incomingTitle
      );

      generateGuide(
        incomingTitle
      );

    }

  }, [incomingTitle]);


  return (

    <div className="project-guide-page">

      {/* SEARCH BAR ALWAYS SHOWS */}

      <div className="search-card">

        <input
          type="text"
          value={projectTitle}
          onChange={(e) =>
            setProjectTitle(
              e.target.value
            )
          }
          placeholder="Enter any project title"
        />

        <button
          onClick={() =>
            generateGuide(
              projectTitle
            )
          }
        >
          Generate Guide
        </button>

      </div>


      {/* EMPTY STATE */}

      {!guide &&
        !loading &&
        !incomingTitle && (

          <div className="project-empty-state">

            <h2>
              Project Guide Generator
            </h2>

            <p>
              Enter any project title or generated
              project title above and generate a
              complete development guide with
              architecture, folder structure, APIs,
              steps, advanced features and resources.
            </p>

          </div>

        )}


      {/* LOADING */}

      {loading && (

        <div className="loading-box">

          Generating Project Guide...

        </div>

      )}


      {/* GUIDE */}

      {!loading && guide && (

        <>

          <div className="project-header-block">

            <h1 className="project-main-title">
              {projectTitle}
            </h1>

            <p className="project-subtitle">
              Complete Development Guide
            </p>

          </div>


          <div className="guide-grid">

            <div className="guide-card">

              <h3>
                📌 Project Overview
              </h3>

              <p>
                {guide.overview ||
                  "No overview available."}
              </p>

            </div>


            <div className="guide-card">

              <h3>
                🏗 Architecture
              </h3>

              <p>
                {guide.architecture ||
                  "No architecture available."}
              </p>

            </div>


            <div className="guide-card full-width">

              <h3>
                📂 Folder Structure
              </h3>

              <pre>
                {renderFolderStructure(
                  guide.folder_structure
                )}
              </pre>

            </div>


            <div className="guide-card">

              <h3>
                🗄 Database Design
              </h3>

              {renderDatabase(
                guide.database
              )}

            </div>


            <div className="guide-card">

              <h3>
                🔗 API Endpoints
              </h3>

              <ul>
                {renderList(
                  guide.apis
                )}
              </ul>

            </div>


            <div className="guide-card full-width">

              <h3>
                🚀 Development Steps
              </h3>


              {Array.isArray(
                guide.steps
              ) &&
              guide.steps.length > 0 ? (

                guide.steps.map(
                  (step, index) => (

                    <div
                      key={index}
                      className="step-item"
                    >

                      <span className="step-number">
                        {index + 1}
                      </span>

                      <span>

                        {typeof step ===
                        "string"
                          ? step
                          : JSON.stringify(
                              step
                            )}

                      </span>

                    </div>

                  )

                )

              ) : (

                <p>
                  No development steps available.
                </p>

              )}

            </div>


            <div className="guide-card">

              <h3>
                ⭐ Advanced Features
              </h3>

              <ul>
                {renderList(
                  guide.advanced_features
                )}
              </ul>

            </div>


            <div className="guide-card">

              <h3>
                📚 Resources
              </h3>

              <ul>
                {renderList(
                  guide.resources
                )}
              </ul>

            </div>

          </div>

        </>

      )}

    </div>

  );

}
export default ProjectGuide;