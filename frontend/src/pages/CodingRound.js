import {
  useEffect,
  useState,
  useRef
} from "react";

import {
  useNavigate
} from "react-router-dom";

import ReactMarkdown from "react-markdown";

import {
  getCodingQuestions,
  runCoding,
  evaluateCoding
} from "../api";

import "./CodingRound.css";

function CodingRound({ result }) {
  const navigate =
    useNavigate();

  // ==========================================================
  // CURRENT RESUME SUPPORTED LANGUAGES
  // ==========================================================

  const availableLanguages =
    (() => {

      const skills =
        Array.isArray(
          result?.skills
        )
          ? result.skills.map(
              (skill) =>
                String(
                  skill
                ).toLowerCase()
            )
          : [];

      const mapping = [
        [
          "python",
          "python"
        ],
        [
          "java",
          "java"
        ],
        [
          "c++",
          "cpp"
        ],
        [
          "cpp",
          "cpp"
        ],
        [
          "c language",
          "c"
        ],
        [
          "javascript",
          "javascript"
        ],
        [
          "js",
          "javascript"
        ],
        [
          "sql",
          "sql"
        ]
      ];

      const output = [];

      mapping.forEach(
        ([
          skill,
          language
        ]) => {

          if (
            skills.some(
              (item) =>
                item === skill ||
                item.includes(skill)
            )
          ) {

            if (
              !output.includes(
                language
              )
            ) {
              output.push(
                language
              );
            }

          }

        }
      );

      return output;

    })();

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    questions,
    setQuestions
  ] = useState([]);

  const [
    current,
    setCurrent
  ] = useState(0);

  const [
    code,
    setCode
  ] = useState("");

  const [
    output,
    setOutput
  ] = useState("");

  const [
    evaluation,
    setEvaluation
  ] = useState(null);

  const [
    language,
    setLanguage
  ] = useState(
    availableLanguages[0] ||
    ""
  );

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    questionLoading,
    setQuestionLoading
  ] = useState(false);

  const [
    completed,
    setCompleted
  ] = useState(false);

  const countedQuestionRef =
    useRef(new Set());

  // ==========================================================
  // RESET LANGUAGE WHEN RESUME CHANGES
  // ==========================================================

  useEffect(() => {

    setLanguage(
      availableLanguages[0] ||
      ""
    );

  }, [
    result?.resume_id
  ]);

  // ==========================================================
  // USER KEY
  // ==========================================================

  const getUserKey = () => {

    const email =
      localStorage.getItem(
        "user_email"
      ) || "guest";

    return email
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        "_"
      );
  };

  const getCodingScoreKey =
    () => {

      return `codingCorrectAnswers_${getUserKey()}`;

    };

  // ==========================================================
  // FETCH QUESTIONS WHEN NEW RESUME
  // ==========================================================

  useEffect(() => {

    if (!result) {

      setQuestions([]);

      return;
    }

    fetchQuestions();

  }, [
    result?.resume_id
  ]);

  // ==========================================================
  // FETCH CURRENT RESUME CODING QUESTIONS
  // ==========================================================

  const fetchQuestions =
    async () => {

      if (!result) {
        return;
      }

      setQuestionLoading(
        true
      );

      try {

        const userSkills =
          Array.isArray(
            result.skills
          )
            ? [
                ...result.skills
              ]
            : [];

        console.log(
          "CODING ROUND CURRENT RESUME:",
          result.resume_id
        );

        console.log(
          "CODING ROUND CURRENT SKILLS:",
          userSkills
        );

        /*
         * Backend receives the
         * CURRENT resume context.
         */

        const res =
          await getCodingQuestions({
            skills:
              userSkills,

            resume_text:
              result.resume_text ||
              "",

            resume_id:
              result.resume_id ||
              "",

            roles:
              Array.isArray(
                result.roles
              )
                ? result.roles
                : []
          });

        console.log(
          "CODING QUESTIONS RESPONSE:",
          res.data || res
        );

        const receivedQuestions =
          res.data?.questions ||
          res.questions ||
          [];

        setQuestions(
          Array.isArray(
            receivedQuestions
          )
            ? receivedQuestions
            : []
        );

        setCurrent(0);

        setEvaluation(null);

        setCode("");

        setOutput("");

        setCompleted(false);

        countedQuestionRef.current =
          new Set();

      } catch (error) {

        console.error(
          "Error fetching coding questions:",
          error
        );

        console.error(
          "Coding questions backend response:",
          error.response?.data
        );

        setQuestions([]);

      } finally {

        setQuestionLoading(
          false
        );

      }
    };

  // ==========================================================
  // RUN CODE
  // ==========================================================

  const runCode = async () => {

    if (!code.trim()) {

      setOutput(
        "⚠ Please write code first."
      );

      return;
    }

    if (!language) {

      setOutput(
        "No supported programming language was found in the current resume."
      );

      return;
    }

    try {

      const res =
        await runCoding({
          language,
          code
        });

      setOutput(
        res.data?.output ||
        res.output ||
        "No output returned."
      );

    } catch (error) {

      console.error(
        "Run code error:",
        error
      );

      setOutput(
        error.response?.data
          ?.detail ||
        error.response?.data
          ?.message ||
        "❌ Error running code."
      );
    }
  };

  // ==========================================================
  // SAVE CORRECT ANSWER
  // ==========================================================

  const saveCodingCorrectAnswer =
    () => {

      const key =
        getCodingScoreKey();

      const currentCount =
        Number(
          localStorage.getItem(
            key
          ) || 0
        );

      const newCount =
        currentCount + 1;

      localStorage.setItem(
        key,
        String(
          newCount
        )
      );

      /*
       * Existing dashboard
       * compatibility.
       */

      localStorage.setItem(
        "codingCorrectAnswers",
        String(
          newCount
        )
      );

      window.dispatchEvent(
        new Event(
          "dashboardStatsUpdated"
        )
      );
    };

  // ==========================================================
  // SUBMIT CODING ANSWER
  // ==========================================================

  const submitAnswer =
    async () => {

      if (!code.trim()) {

        setOutput(
          "⚠ Please write your solution first."
        );

        return;
      }

      if (!questions[current]) {
        return;
      }

      if (loading) {
        return;
      }

      setLoading(true);

      try {

        const res =
          await evaluateCoding({

            question:
              questions[current],

            answer:
              code,

            language,

            skills:
              Array.isArray(
                result?.skills
              )
                ? result.skills
                : [],

            resume_text:
              result?.resume_text ||
              "",

            resume_id:
              result?.resume_id ||
              "",

            roles:
              Array.isArray(
                result?.roles
              )
                ? result.roles
                : []

          });

        console.log(
          "CODING EVALUATION RESPONSE:",
          res.data || res
        );

        const rawData =
          res.data ||
          res ||
          {};

        const evaluationData =
          rawData.evaluation ||
          rawData.data ||
          (
            typeof rawData.result ===
              "object" &&
            rawData.result !== null
              ? rawData.result
              : rawData
          );

        const extractedScore =
          evaluationData.score ??
          evaluationData.overall_score ??
          evaluationData.rating ??
          evaluationData.final_score ??
          rawData.score ??
          rawData.overall_score ??
          rawData.rating ??
          rawData.final_score ??
          0;

        const score =
          Number(
            extractedScore
          ) || 0;

        const extractedFeedback =
          evaluationData.feedback ??
          evaluationData.feedback_text ??
          evaluationData.detailed_feedback ??
          evaluationData.comments ??
          evaluationData.comment ??
          evaluationData.explanation ??
          evaluationData.message ??
          rawData.feedback ??
          rawData.feedback_text ??
          rawData.detailed_feedback ??
          rawData.comments ??
          rawData.comment ??
          rawData.explanation ??
          rawData.message ??
          (
            typeof rawData.result ===
              "string"
              ? rawData.result
              : ""
          );

        let feedbackText =
          extractedFeedback;

        if (
          typeof feedbackText ===
            "object" &&
          feedbackText !== null
        ) {

          feedbackText =
            JSON.stringify(
              feedbackText,
              null,
              2
            );
        }

        if (
          !feedbackText ||
          String(
            feedbackText
          ).trim() === ""
        ) {

          feedbackText =
            "Evaluation completed, but no detailed feedback was returned by the backend.";
        }

        const normalizedEvaluation =
          {

            ...evaluationData,

            score,

            feedback:
              String(
                feedbackText
              ),

            correct:
              evaluationData.correct ??
              evaluationData.is_correct ??
              rawData.correct ??
              rawData.is_correct ??
              false

          };

        setEvaluation(
          normalizedEvaluation
        );

        const isCorrect =
          normalizedEvaluation.correct ===
            true ||
          normalizedEvaluation.is_correct ===
            true ||
          String(
            normalizedEvaluation.result ||
            ""
          ).toLowerCase() ===
            "correct" ||
          score >= 7;

        if (
          isCorrect &&
          !countedQuestionRef.current.has(
            current
          )
        ) {

          saveCodingCorrectAnswer();

          countedQuestionRef.current.add(
            current
          );
        }

        if (
          current >=
          questions.length - 1
        ) {

          setTimeout(() => {
            setCompleted(
              true
            );
          }, 1200);

        }

      } catch (error) {

        console.error(
          "Coding evaluation error:",
          error
        );

        console.error(
          "Coding backend response:",
          error.response?.data
        );

        setEvaluation({

          score: 0,

          feedback:
            error.response?.data
              ?.detail ||
            error.response?.data
              ?.message ||
            "❌ Evaluation failed. Please check your backend connection.",

          correct:
            false

        });

      } finally {

        setLoading(
          false
        );

      }
    };

  // ==========================================================
  // NEXT QUESTION
  // ==========================================================

  const nextQuestion =
    () => {

      if (
        current <
        questions.length - 1
      ) {

        setCurrent(
          (previous) =>
            previous + 1
        );

        setCode("");

        setOutput("");

        setEvaluation(
          null
        );
      }
    };

  // ==========================================================
  // FINISH
  // ==========================================================

  const finishCodingRound =
    () => {

      navigate("/");
    };

  // ==========================================================
  // NO RESUME
  // ==========================================================

  if (!result) {

    return (
      <div className="coding-page">

        <div className="coding-empty-card">

          <div
            className=
              "coding-empty-icon"
          >
            💻
          </div>

          <h2>
            Upload Resume First
          </h2>

          <p>
            Analyze your resume from
            the dashboard to start
            the AI Coding Round.
          </p>

          <button
            onClick={() =>
              navigate(
                "/resume"
              )
            }
          >
            Upload Resume
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // COMPLETED
  // ==========================================================

  if (completed) {

    const correctCount =
      Array.from(
        countedQuestionRef.current
      ).length;

    return (
      <div className="coding-page">

        <div
          className=
            "coding-complete-card"
        >

          <div
            className=
              "complete-icon"
          >
            🎉
          </div>

          <h1>
            Coding Round Completed
          </h1>

          <p>
            You completed all{" "}
            {questions.length} coding
            questions.
          </p>

          <div
            className=
              "coding-final-stat"
          >

            <span>
              Correct Problems
            </span>

            <strong>

              {correctCount}

              <small>
                /{questions.length}
              </small>

            </strong>

          </div>

          <button
            className=
              "dashboard-return-btn"
            onClick={
              finishCodingRound
            }
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // LOADING QUESTIONS
  // ==========================================================

  if (questionLoading) {

    return (
      <div className="coding-page">

        <div
          className=
            "coding-empty-card"
        >

          <div
            className=
              "coding-empty-icon"
          >
            🤖
          </div>

          <h2>
            Preparing Coding Round
          </h2>

          <p>
            Generating coding questions
            from your current resume
            skills...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================================
  // NO QUESTIONS
  // ==========================================================

  if (
    !questionLoading &&
    questions.length === 0
  ) {

    return (
      <div className="coding-page">

        <div
          className=
            "coding-empty-card"
        >

          <div
            className=
              "coding-empty-icon"
          >
            💻
          </div>

          <h2>
            No Coding Questions
          </h2>

          <p>
            No coding questions were
            generated for the current
            resume skills.
          </p>

          <button
            onClick={
              fetchQuestions
            }
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <div className="coding-page">

      <div
        className=
          "coding-container"
      >

        {/* HEADER */}

        <div
          className=
            "coding-header"
        >

          <div
            className=
              "coding-badge"
          >
            AI POWERED
          </div>

          <h1>
            Coding Interview Practice
          </h1>

          <p>
            Solve coding and SQL problems
            and receive AI evaluation.
          </p>

          {/* CURRENT RESUME SKILLS */}

          {Array.isArray(
            result.skills
          ) &&
            result.skills.length >
              0 && (

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "8px",
                  marginTop:
                    "16px"
                }}
              >

                {result.skills.map(
                  (
                    skill,
                    index
                  ) => (

                    <span
                      key={index}
                      style={{
                        padding:
                          "5px 10px",
                        borderRadius:
                          "16px",
                        background:
                          "#eef7ef",
                        color:
                          "#218838",
                        fontSize:
                          "12px"
                      }}
                    >
                      {skill}
                    </span>

                  )
                )}

              </div>

            )}

        </div>

        {/* TOP BAR */}

        <div className="top-bar">

          <div
            className=
              "question-progress"
          >

            Question{" "}

            <strong>
              {current + 1}
            </strong>

            {" "}of{" "}

            <strong>
              {questions.length}
            </strong>

          </div>

          {availableLanguages.length >
          0 ? (

            <select
              value={
                language
              }
              onChange={(event) =>
                setLanguage(
                  event.target.value
                )
              }
              className=
                "language-select"
            >

              {availableLanguages.map(
                (
                  item
                ) => (

                  <option
                    key={item}
                    value={item}
                  >

                    {item ===
                    "cpp"
                      ? "C++"
                      : item
                          .charAt(
                            0
                          )
                          .toUpperCase() +
                        item.slice(
                          1
                        )}

                  </option>

                )
              )}

            </select>

          ) : (

            <span
              className=
                "language-select"
            >
              No supported coding
              language in current
              resume
            </span>

          )}

        </div>

        {/* PROGRESS */}

        <div
          className=
            "coding-progress"
        >

          <div
            className=
              "coding-progress-fill"
            style={{
              width:
                questions.length
                  ? `${
                      ((current + 1) /
                        questions.length) *
                      100
                    }%`
                  : "0%"
            }}
          />

        </div>

        {/* QUESTION */}

        <div
          className=
            "question-card"
        >

          <div
            className=
              "question-label"
          >
            CODING QUESTION
          </div>

          <h2>
            {questions[current]}
          </h2>

        </div>

        {/* EDITOR */}

        <div
          className=
            "editor-wrapper"
        >

          <div
            className=
              "editor-top"
          >

            <span>
              {language
                ? language.toUpperCase()
                : "CODE"}
            </span>

            <span>
              Code Editor
            </span>

          </div>

          <textarea
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value
              )
            }
            placeholder={
              language
                ? `Write your ${language} solution here...`
                : "Write your solution here..."
            }
            className=
              "code-editor"
            spellCheck="false"
          />

        </div>

        {/* ACTIONS */}

        <div
          className=
            "action-buttons"
        >

          <button
            className=
              "run-btn"
            onClick={
              runCode
            }
            disabled={
              loading ||
              !language
            }
          >
            ▶ Run Code
          </button>

          <button
            className=
              "submit-btn"
            onClick={
              submitAnswer
            }
            disabled={
              loading
            }
          >

            {loading
              ? "AI Evaluating..."
              : "Submit Answer"}

          </button>

        </div>

        {/* OUTPUT */}

        {output && (

          <div
            className=
              "result-card"
          >

            <div
              className=
                "result-title"
            >
              Code Output
            </div>

            <pre>
              {output}
            </pre>

          </div>

        )}

        {/* EVALUATION */}

        {evaluation && (

          <div
            className=
              "evaluation-card"
          >

            <div
              className=
                "evaluation-title"
            >
              AI Evaluation Report
            </div>

            <div
              className=
                "evaluation-content"
            >

              <ReactMarkdown>
                {
                  evaluation.feedback ||
                  "No feedback available."
                }
              </ReactMarkdown>

            </div>

          </div>

        )}

        {/* NEXT */}

        {evaluation &&
          current <
            questions.length - 1 && (

            <div
              className=
                "next-wrapper"
            >

              <button
                className=
                  "next-btn"
                onClick={
                  nextQuestion
                }
              >
                Next Question →
              </button>

            </div>

          )}

        {/* FINISH */}

        {evaluation &&
          current ===
            questions.length - 1 && (

            <div
              className=
                "finish-wrapper"
            >

              <p>
                🎉 You completed the
                final question.
              </p>

              <button
                className=
                  "finish-btn"
                onClick={
                  finishCodingRound
                }
              >
                Finish & View Dashboard
              </button>

            </div>

          )}

      </div>

    </div>
  );
}

export default CodingRound;