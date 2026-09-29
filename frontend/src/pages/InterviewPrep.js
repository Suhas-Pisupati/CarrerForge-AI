import {
  useEffect,
  useState
} from "react";

import "./InterviewPrep.css";

import Chatbot
  from "../components/Chatbot";

function InterviewPrep({
  result
}) {

  const [
    level,
    setLevel
  ] = useState(
    "beginner"
  );

  const [
    openIndex,
    setOpenIndex
  ] = useState(null);

  /*
   * Whenever a NEW resume is
   * uploaded, reset the page.
   */

  useEffect(() => {

    setLevel(
      "beginner"
    );

    setOpenIndex(
      null
    );

  }, [
    result?.resume_id
  ]);

  /*
   * =========================
   * NO RESUME
   * =========================
   */

  if (!result) {

    return (

      <div
        className=
          "interview-wrapper"
      >

        <div
          className=
            "empty-state"
        >

          <h2>
            Upload your resume
          </h2>

          <p>
            Go to Home page and
            analyze your resume
          </p>

        </div>

      </div>
    );
  }

  /*
   * =========================
   * CURRENT RESUME QUESTIONS
   * =========================
   */

  const questions =
    result.questions?.[
      level
    ] || [];

  /*
   * CURRENT RESUME SKILLS
   */

  const skills =
    Array.isArray(
      result.skills
    )
      ? result.skills
      : [];

  return (

    <div
      className=
        "interview-wrapper"
    >

      {/* =====================
          HEADER
      ===================== */}

      <div
        className=
          "interview-header"
      >

        <h2>
          Interview Preparation
        </h2>

        <p>
          Questions based on
          your current resume
          skills
        </p>

        {skills.length > 0 && (

          <div
            className=
              "interview-skill-context"
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

      </div>

      {/* =====================
          LEVEL
      ===================== */}

      <div
        className=
          "level-switch"
      >

        {[
          "beginner",
          "intermediate",
          "advanced"
        ].map(
          (item) => (

            <button
              key={item}
              className={
                level === item
                  ? "active"
                  : ""
              }
              onClick={() => {

                setLevel(
                  item
                );

                setOpenIndex(
                  null
                );

              }}
            >

              {item
                .charAt(0)
                .toUpperCase() +
                item.slice(1)}

            </button>

          )
        )}

      </div>

      {/* =====================
          QUESTIONS
      ===================== */}

      <div
        className=
          "questions-container"
      >

        {questions.length > 0 ? (

          questions.map(
            (q, index) => (

              <div
                key={`${result.resume_id || "resume"}-${level}-${index}`}
                className=
                  "question-card"
              >

                <div
                  className=
                    "question-row"
                >

                  <div
                    className=
                      "q-badge"
                  >
                    {index + 1}
                  </div>

                  <div
                    className=
                      "q-content"
                  >

                    <p
                      className=
                        "question-text"
                    >
                      {
                        q.question ||
                        q
                      }
                    </p>

                    <button
                      className=
                        "toggle-btn"
                      onClick={() =>
                        setOpenIndex(
                          openIndex ===
                            index
                            ? null
                            : index
                        )
                      }
                    >

                      {openIndex ===
                        index
                        ? "Hide Answer"
                        : "Show Answer"}

                    </button>

                  </div>

                </div>

                {openIndex ===
                  index && (

                  <div
                    className=
                      "answer-box"
                  >

                    {
                      q.answer ||
                      "No answer available."
                    }

                  </div>

                )}

              </div>

            )
          )

        ) : (

          <div
            className=
              "no-data"
          >

            <p>
              No interview
              questions were
              generated for the
              current resume.
            </p>

            {skills.length ===
              0 && (

              <p>
                Upload a resume
                with identifiable
                skills first.
              </p>

            )}

          </div>

        )}

      </div>

      {/* =====================
          CHATBOT
      ===================== */}

      <div
        className=
          "chat-section"
      >

        <Chatbot
          apiEndpoint=
            "interview-chat"

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