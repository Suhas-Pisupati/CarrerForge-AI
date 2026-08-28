import { useState } from "react";
import "./InterviewPrep.css";
import Chatbot from "../components/Chatbot";

function InterviewPrep({ result }) {

  const [level, setLevel] = useState("beginner");
  const [openIndex, setOpenIndex] = useState(null);

  // 🚫 No resume uploaded
  if (!result) {
    return (
      <div className="interview-wrapper">
        <div className="empty-state">
          <h2>Upload your resume</h2>
          <p>Go to Home page and analyze your resume</p>
        </div>
      </div>
    );
  }

  // 🚫 No questions from backend
  if (!result.questions) {
    return (
      <div className="interview-wrapper">
        <div className="empty-state">
          <h2>No interview questions available</h2>
        </div>
      </div>
    );
  }

  // ✅ FIXED (lowercase keys)
  const questions = result.questions[level] || [];

  return (
    <div className="interview-wrapper">

      {/* HEADER */}
      <div className="interview-header">
        <h2>Interview Preparation</h2>
        <p>Questions based on your resume</p>
      </div>

      {/* LEVEL SWITCH */}
      <div className="level-switch">

        <button
          className={level === "beginner" ? "active" : ""}
          onClick={() => {
            setLevel("beginner");
            setOpenIndex(null);
          }}
        >
          Beginner
        </button>

        <button
          className={level === "intermediate" ? "active" : ""}
          onClick={() => {
            setLevel("intermediate");
            setOpenIndex(null);
          }}
        >
          Intermediate
        </button>

        <button
          className={level === "advanced" ? "active" : ""}
          onClick={() => {
            setLevel("advanced");
            setOpenIndex(null);
          }}
        >
          Advanced
        </button>

      </div>

      {/* QUESTIONS */}
      <div className="questions-container">

        {questions.length > 0 ? (

          questions.map((q, i) => (

            <div key={i} className="question-card">

              <div className="question-row">

                {/* NUMBER BADGE */}
                <div className="q-badge">
                  {i + 1}
                </div>

                {/* QUESTION */}
                <div className="q-content">

                  <p className="question-text">
                    {q.question}
                  </p>

                  <button
                    className="toggle-btn"
                    onClick={() =>
                      setOpenIndex(openIndex === i ? null : i)
                    }
                  >
                    {openIndex === i ? "Hide Answer" : "Show Answer"}
                  </button>

                </div>

              </div>

              {/* ANSWER */}
              {openIndex === i && (
                <div className="answer-box">
                  {q.answer}
                </div>
              )}

            </div>

          ))

        ) : (
          <p className="no-data">No questions found</p>
        )}

      </div>

      {/* CHATBOT */}
      <div className="chat-section">
        <Chatbot
          apiEndpoint="interview-chat"
          resumeText={result?.analysis?.analysis_text || ""}
        />
      </div>

    </div>
  );
}

export default InterviewPrep;