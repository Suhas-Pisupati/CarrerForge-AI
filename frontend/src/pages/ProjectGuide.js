import {
  useState,
  useEffect
} from "react";

import "./ProjectGuide.css";

import {
  useLocation
} from "react-router-dom";

import {
  getProjectGuide
} from "../api";


function ProjectGuide({
  result
}) {

  const location =
    useLocation();


  // ==========================================================
  // CURRENT PROJECT
  // ==========================================================

  const incomingTitle =
    location.state?.projectTitle ||
    "";


  /*
   * IMPORTANT:
   *
   * The current resume from App.js
   * is the primary source.
   *
   * Navigation state is only used
   * for the selected project title
   * and as a fallback for skills.
   */

  const currentSkills =
    Array.isArray(
      result?.skills
    )
      ? result.skills
      : (
          Array.isArray(
            location.state?.skills
          )
            ? location.state.skills
            : []
        );


  const currentResumeText =
    result?.resume_text ||
    location.state?.resumeText ||
    "";


  const currentResumeId =
    result?.resume_id ||
    location.state?.resumeId ||
    "";


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    projectTitle,
    setProjectTitle
  ] = useState(
    incomingTitle
  );


  /*
   * IMPORTANT:
   *
   * Skills are still stored internally
   * and sent to the backend.
   *
   * They are NOT displayed anywhere
   * on this page.
   */

  const [
    skills,
    setSkills
  ] = useState(
    currentSkills
  );


  const [
    guide,
    setGuide
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(false);


  // ==========================================================
  // KEEP CURRENT RESUME CONTEXT UPDATED
  // ==========================================================

  useEffect(() => {

    /*
     * When a completely new resume is
     * uploaded, update the project
     * guide's skills.
     */

    setSkills(
      Array.isArray(
        result?.skills
      )
        ? [
            ...result.skills
          ]
        : []
    );


    /*
     * Clear an old guide when the
     * resume changes.
     */

    setGuide(null);

  }, [
    result?.resume_id
  ]);


  // ==========================================================
  // FOLDER STRUCTURE FORMATTER
  // ==========================================================

  const renderFolderStructure =
    (
      folderStructure
    ) => {

      if (
        !folderStructure
      ) {
        return "No folder structure available.";
      }


      if (
        typeof folderStructure ===
        "string"
      ) {
        return folderStructure;
      }


      if (
        Array.isArray(
          folderStructure
        )
      ) {
        return folderStructure.join(
          "\n"
        );
      }


      if (
        typeof folderStructure ===
        "object"
      ) {
        return JSON.stringify(
          folderStructure,
          null,
          2
        );
      }


      return String(
        folderStructure
      );
    };


  // ==========================================================
  // DATABASE FORMATTER
  // ==========================================================

  const renderDatabase =
    (database) => {

      if (!database) {

        return (
          <p>
            No database details available.
          </p>
        );
      }


      if (
        typeof database ===
        "string"
      ) {

        return (
          <p>
            {database}
          </p>
        );
      }


      if (
        Array.isArray(
          database
        )
      ) {

        return (
          <ul>

            {database.map(
              (
                item,
                index
              ) => (

                <li key={index}>

                  {
                    typeof item ===
                    "string"
                      ? item
                      : JSON.stringify(
                          item
                        )
                  }

                </li>

              )
            )}

          </ul>
        );
      }


      if (
        typeof database ===
        "object"
      ) {

        return (
          <div>

            {Object.entries(
              database
            ).map(
              ([
                key,
                value
              ]) => (

                <div
                  key={key}
                  style={{
                    marginBottom:
                      "10px"
                  }}
                >

                  <strong>
                    {key}:
                  </strong>{" "}

                  {
                    Array.isArray(
                      value
                    )
                      ? value.join(
                          ", "
                        )
                      : typeof value ===
                          "object" &&
                        value !== null
                      ? JSON.stringify(
                          value
                        )
                      : String(
                          value
                        )
                  }

                </div>

              )
            )}

          </div>
        );
      }


      return (
        <p>
          {String(database)}
        </p>
      );
    };


  // ==========================================================
  // GENERIC LIST FORMATTER
  // ==========================================================

  const renderList =
    (data) => {

      if (!data) {

        return (
          <li>
            No data available
          </li>
        );
      }


      if (
        Array.isArray(
          data
        )
      ) {

        return data.map(
          (
            item,
            index
          ) => (

            <li key={index}>

              {
                typeof item ===
                "string"
                  ? item
                  : JSON.stringify(
                      item
                    )
              }

            </li>

          )
        );
      }


      if (
        typeof data ===
        "string"
      ) {

        return (
          <li>
            {data}
          </li>
        );
      }


      if (
        typeof data ===
          "object" &&
        data !== null
      ) {

        return Object.entries(
          data
        ).map(
          (
            [
              key,
              value
            ],
            index
          ) => (

            <li key={index}>

              <strong>
                {key}:
              </strong>{" "}

              {
                Array.isArray(
                  value
                )
                  ? value.join(
                      ", "
                    )
                  : typeof value ===
                      "object" &&
                    value !== null
                  ? JSON.stringify(
                      value
                    )
                  : String(
                      value
                    )
              }

            </li>

          )
        );
      }


      return (
        <li>
          {String(data)}
        </li>
      );
    };


  // ==========================================================
  // GENERATE PROJECT GUIDE
  // ==========================================================

  const generateGuide =
    async (
      title = projectTitle
    ) => {

      if (
        !title ||
        !title.trim()
      ) {

        alert(
          "Please enter a project title"
        );

        return;
      }


      if (
        !Array.isArray(
          skills
        ) ||
        skills.length === 0
      ) {

        alert(
          "No current resume skills are available. Please upload and analyze your resume first."
        );

        return;
      }


      setLoading(
        true
      );


      setGuide(
        null
      );


      try {

        /*
         * Always use the CURRENT
         * resume skills.
         */

        const userSkills =
          Array.isArray(
            skills
          )
            ? [
                ...skills
              ]
            : [];


        console.log(
          "PROJECT GUIDE CURRENT RESUME:",
          currentResumeId
        );


        console.log(
          "PROJECT GUIDE CURRENT SKILLS:",
          userSkills
        );


        console.log(
          "PROJECT GUIDE TITLE:",
          title.trim()
        );


        const res =
          await getProjectGuide({

            /*
             * CURRENT PROJECT
             */

            project_title:
              title.trim(),


            /*
             * CURRENT RESUME
             */

            skills:
              userSkills,


            resume_text:
              currentResumeText,


            resume_id:
              currentResumeId

          });


        console.log(
          "PROJECT GUIDE RESPONSE:",
          res.data || res
        );


        setGuide(
          res.data || res
        );

      } catch (error) {

        console.error(
          "PROJECT GUIDE ERROR:",
          error
        );


        console.error(
          "Project guide backend response:",
          error.response?.data
        );


        alert(
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Unable to generate project guide."
        );


        setGuide(
          null
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  // ==========================================================
  // AUTO GENERATE FROM PROJECT RECOMMENDATION
  // ==========================================================

  useEffect(() => {

    if (
      !incomingTitle
    ) {
      return;
    }


    const title =
      incomingTitle.trim();


    if (!title) {
      return;
    }


    /*
     * Do not automatically use
     * old resume data.
     *
     * Always take current result
     * first.
     */

    const userSkills =
      Array.isArray(
        result?.skills
      )
        ? [
            ...result.skills
          ]
        : (
            Array.isArray(
              location.state?.skills
            )
              ? [
                  ...location.state.skills
                ]
              : []
          );


    setProjectTitle(
      title
    );


    setSkills(
      userSkills
    );


    if (
      userSkills.length === 0
    ) {
      return;
    }


    const loadGuide =
      async () => {

        setLoading(
          true
        );


        setGuide(
          null
        );


        try {

          console.log(
            "AUTO PROJECT GUIDE RESUME:",
            currentResumeId
          );


          console.log(
            "AUTO PROJECT GUIDE SKILLS:",
            userSkills
          );


          const res =
            await getProjectGuide({

              project_title:
                title,

              skills:
                userSkills,

              resume_text:
                currentResumeText,

              resume_id:
                currentResumeId

            });


          console.log(
            "AUTO PROJECT GUIDE RESPONSE:",
            res.data || res
          );


          setGuide(
            res.data || res
          );

        } catch (error) {

          console.error(
            "AUTO PROJECT GUIDE ERROR:",
            error
          );


          console.error(
            "Project guide backend response:",
            error.response?.data
          );


          setGuide(
            null
          );

        } finally {

          setLoading(
            false
          );

        }

      };


    loadGuide();


    /*
     * We intentionally react to
     * project title + current resume.
     */

  }, [
    incomingTitle,
    result?.resume_id
  ]);


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className=
        "project-guide-page"
    >


      {/* ======================================================
          SEARCH BAR
      ====================================================== */}

      <div
        className=
          "search-card"
      >

        <input
          type="text"
          value={
            projectTitle
          }
          onChange={(event) =>
            setProjectTitle(
              event.target.value
            )
          }
          placeholder=
            "Enter any project title"
        />


        <button
          onClick={() =>
            generateGuide(
              projectTitle
            )
          }
          disabled={
            loading
          }
        >

          {
            loading
              ? "Generating..."
              : "Generate Guide"
          }

        </button>

      </div>


      {/* ======================================================
          IMPORTANT:
          CURRENT SKILLS ARE NOT DISPLAYED HERE.
          
          Skills are still stored internally and
          sent to the backend for personalization.
      ====================================================== */}


      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {!guide &&
        !loading &&
        !incomingTitle && (

          <div
            className=
              "project-empty-state"
          >

            <h2>
              Project Guide Generator
            </h2>


            <p>
              Enter any project title
              or generated project title
              above and generate a
              complete development guide
              with architecture, folder
              structure, APIs, steps,
              advanced features and
              resources.
            </p>

          </div>

        )}


      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (

        <div
          className=
            "loading-box"
        >

          Generating Project Guide...

        </div>

      )}


      {/* ======================================================
          GUIDE
      ====================================================== */}

      {!loading &&
        guide && (

          <>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
              className=
                "project-header-block"
            >

              <h1
                className=
                  "project-main-title"
              >

                {projectTitle}

              </h1>


              <p
                className=
                  "project-subtitle"
              >

                Complete Development Guide

              </p>

            </div>


            {/* ==================================================
                GUIDE GRID
            ================================================== */}

            <div
              className=
                "guide-grid"
            >


              {/* =================================================
                  OVERVIEW
              ================================================= */}

              <div
                className=
                  "guide-card"
              >

                <h3>
                  📌 Project Overview
                </h3>


                <p>
                  {guide.overview ||
                    "No overview available."}
                </p>

              </div>


              {/* =================================================
                  ARCHITECTURE
              ================================================= */}

              <div
                className=
                  "guide-card"
              >

                <h3>
                  🏗 Architecture
                </h3>


                <p>
                  {guide.architecture ||
                    "No architecture available."}
                </p>

              </div>


              {/* =================================================
                  FOLDER STRUCTURE
              ================================================= */}

              <div
                className=
                  "guide-card full-width"
              >

                <h3>
                  📂 Folder Structure
                </h3>


                <pre>
                  {renderFolderStructure(
                    guide.folder_structure
                  )}
                </pre>

              </div>


              {/* =================================================
                  DATABASE
              ================================================= */}

              <div
                className=
                  "guide-card"
              >

                <h3>
                  🗄 Database Design
                </h3>


                {renderDatabase(
                  guide.database
                )}

              </div>


              {/* =================================================
                  API
              ================================================= */}

              <div
                className=
                  "guide-card"
              >

                <h3>
                  🔗 API Endpoints
                </h3>


                <ul>

                  {renderList(
                    guide.apis
                  )}

                </ul>

              </div>


              {/* =================================================
                  DEVELOPMENT STEPS
              ================================================= */}

              <div
                className=
                  "guide-card full-width"
              >

                <h3>
                  🚀 Development Steps
                </h3>


                {Array.isArray(
                  guide.steps
                ) &&
                guide.steps.length >
                  0 ? (

                  guide.steps.map(
                    (
                      step,
                      index
                    ) => (

                      <div
                        key={index}
                        className=
                          "step-item"
                      >

                        <span
                          className=
                            "step-number"
                        >

                          {index + 1}

                        </span>


                        <span>

                          {
                            typeof step ===
                            "string"
                              ? step
                              : JSON.stringify(
                                  step
                                )
                          }

                        </span>

                      </div>

                    )
                  )

                ) : (

                  <p>
                    No development steps
                    available.
                  </p>

                )}

              </div>


              {/* =================================================
                  ADVANCED FEATURES
              ================================================= */}

              <div
                className=
                  "guide-card"
              >

                <h3>
                  ⭐ Advanced Features
                </h3>


                <ul>

                  {renderList(
                    guide.advanced_features
                  )}

                </ul>

              </div>


              {/* =================================================
                  RESOURCES
              ================================================= */}

              <div
                className=
                  "guide-card"
              >

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