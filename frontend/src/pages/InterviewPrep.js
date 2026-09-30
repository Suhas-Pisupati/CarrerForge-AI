import {
  useEffect,
  useState
} from "react";

import "./InterviewPrep.css";

import Chatbot from "../components/Chatbot";


function InterviewPrep({
  result
}) {

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    level,
    setLevel
  ] = useState("beginner");


  const [
    openIndex,
    setOpenIndex
  ] = useState(null);


  // ==========================================================
  // RESET WHEN A NEW RESUME IS UPLOADED
  // ==========================================================

  useEffect(() => {

    /*
     * When the user uploads a different resume,
     * reset the interview page to Beginner
     * and close any previously opened answer.
     *
     * This prevents the previous resume's UI state
     * from remaining visible.
     */

    setLevel("beginner");

    setOpenIndex(null);

  }, [
    result?.resume_id
  ]);


  // ==========================================================
  // NO RESUME
  // ==========================================================

  if (!result) {

    return (

      <div className="interview-wrapper">

        <div className="empty-state">

          <h2>
            Upload your resume
          </h2>

          <p>
            Go to Home page and analyze your resume
          </p>

        </div>

      </div>

    );
  }


  // ==========================================================
  // NO INTERVIEW QUESTIONS
  // ==========================================================

  if (!result.questions) {

    return (

      <div className="interview-wrapper">

        <div className="empty-state">

          <h2>
            No interview questions available
          </h2>

          <p>
            Please analyze your resume again to generate
            interview questions.
          </p>

        </div>

      </div>

    );
  }


  // ==========================================================
  // CURRENT RESUME QUESTIONS
  // ==========================================================

  /*
   * Questions are always taken from the CURRENT
   * analyzed resume.
   *
   * The backend should have already generated these
   * using the current resume skills.
   */

  const questions =
    result.questions?.[level] || [];


  // ==========================================================
  // CURRENT RESUME SKILLS
  // ==========================================================

  /*
   * IMPORTANT:
   *
   * We keep the skills available internally because
   * the current resume context may be needed by the
   * application.
   *
   * BUT WE DO NOT DISPLAY THEM ON THIS PAGE.
   *
   * This prevents the large skills list from appearing
   * below "Questions based on your current resume skills".
   */

  const skills =
    Array.isArray(result.skills)
      ? result.skills
      : [];


  // Prevent unused-variable warnings while keeping
  // the current resume skill context available.
  void skills;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="interview-wrapper">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="interview-header">

        <h2>
          Interview Preparation
        </h2>

        <p>
          Questions based on your current resume skills
        </p>

        {/*
         * IMPORTANT:
         *
         * DO NOT DISPLAY result.skills HERE.
         *
         * The skills are still present in result and are
         * still used by the backend to generate the questions.
         *
         * No skills UI is rendered on this page.
         */}

      </div>


      {/* ======================================================
          LEVEL SWITCH
      ====================================================== */}

      <div className="level-switch">

        <button
          className={
            level === "beginner"
              ? "active"
              : ""
          }
          onClick={() => {

            setLevel("beginner");

            setOpenIndex(null);

          }}
        >
          Beginner
        </button>


        <button
          className={
            level === "intermediate"
              ? "active"
              : ""
          }
          onClick={() => {

            setLevel("intermediate");

            setOpenIndex(null);

          }}
        >
          Intermediate
        </button>


        <button
          className={
            level === "advanced"
              ? "active"
              : ""
          }
          onClick={() => {

            setLevel("advanced");

            setOpenIndex(null);

          }}
        >
          Advanced
        </button>

      </div>


      {/* ======================================================
          QUESTIONS
      ====================================================== */}

      <div className="questions-container">

        {questions.length > 0 ? (

          questions.map(
            (
              q,
              index
            ) => (

              <div
                key={
                  `${
                    result.resume_id ||
                    "resume"
                  }-${level}-${index}`
                }
                className="question-card"
              >


                {/* ==================================================
                    QUESTION ROW
                ================================================== */}

                <div className="question-row">


                  {/* NUMBER BADGE */}

                  <div className="q-badge">

                    {index + 1}

                  </div>


                  {/* QUESTION CONTENT */}

                  <div className="q-content">

                    <p className="question-text">

                      {
                        typeof q === "string"
                          ? q
                          : (
                              q?.question ||
                              "No question available."
                            )
                      }

                    </p>


                    {/* SHOW / HIDE ANSWER */}

                    <button
                      className="toggle-btn"
                      onClick={() =>
                        setOpenIndex(
                          openIndex === index
                            ? null
                            : index
                        )
                      }
                    >

                      {
                        openIndex === index
                          ? "Hide Answer"
                          : "Show Answer"
                      }

                    </button>

                  </div>

                </div>


                {/* ==================================================
                    ANSWER
                ================================================== */}

                {openIndex === index && (

                  <div className="answer-box">

                    {
                      typeof q === "string"
                        ? "No answer available."
                        : (
                            q?.answer ||
                            "No answer available."
                          )
                    }

                  </div>

                )}

              </div>

            )

          )

        ) : (

          /* ======================================================
             NO QUESTIONS
          ====================================================== */

          <div className="no-data">

            <p>
              No interview questions were generated
              for the current resume.
            </p>


            {
              result.skills?.length === 0 && (

                <p>
                  Upload a resume with identifiable
                  skills first.
                </p>

              )
            }

          </div>

        )}

      </div>


      {/* ======================================================
          CHATBOT
      ====================================================== */}

      <div className="chat-section">

        <Chatbot
          apiEndpoint="interview-chat"
          resumeText={
            result.resume_text ||
            ""
          }
        />

      </div>

    </div>

  );
}


export default InterviewPrep;