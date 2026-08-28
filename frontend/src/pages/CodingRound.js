import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import "./CodingRound.css";

function CodingRound({ result }) {

  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);

  const [current, setCurrent] = useState(0);

  const [code, setCode] = useState("");

  const [output, setOutput] = useState("");

  const [evaluation, setEvaluation] =
    useState(null);

  const [language, setLanguage] =
    useState("python");

  const [loading, setLoading] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const countedQuestionRef =
    useRef(new Set());


  // ==========================================================
  // USER-SPECIFIC STORAGE KEY
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


  const getCodingScoreKey = () => {

    return `codingCorrectAnswers_${getUserKey()}`;

  };


  // ==========================================================
  // LOAD QUESTIONS
  // ==========================================================

  useEffect(() => {

    if (result) {

      fetchQuestions();

    }

  }, [result]);


  // ==========================================================
  // FETCH QUESTIONS
  // ==========================================================

  const fetchQuestions = async () => {

    try {

      const res =
        await axios.post(
          "http://127.0.0.1:8000/coding/questions",
          {
            resume_text:
              result?.analysis || ""
          }
        );


      const receivedQuestions =
        res.data?.questions || [];


      setQuestions(
        receivedQuestions
      );

      setCurrent(0);

      setEvaluation(null);

      setCode("");

      setOutput("");

      setCompleted(false);

      countedQuestionRef.current =
        new Set();


    } catch (err) {

      console.error(
        "Error fetching coding questions:",
        err
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


    try {

      const res =
        await axios.post(
          "http://127.0.0.1:8000/coding/run",
          {
            language,
            code
          }
        );


      setOutput(
        res.data?.output ||
        "No output returned."
      );


    } catch (err) {

      console.error(
        "Run code error:",
        err
      );


      setOutput(
        "❌ Error running code."
      );

    }

  };


  // ==========================================================
  // SAVE CODING CORRECT ANSWER
  // ==========================================================

  const saveCodingCorrectAnswer = () => {

    const key =
      getCodingScoreKey();


    const currentCount =
      Number(
        localStorage.getItem(
          key
        ) || 0
      );


    localStorage.setItem(
      key,
      String(
        currentCount + 1
      )
    );


    // Compatibility with old dashboard key

    localStorage.setItem(
      "codingCorrectAnswers",
      String(
        currentCount + 1
      )
    );


    window.dispatchEvent(
      new Event(
        "dashboardStatsUpdated"
      )
    );

  };


  // ==========================================================
  // SUBMIT ANSWER
  // ==========================================================

  const submitAnswer = async () => {

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
        await axios.post(
          "http://127.0.0.1:8000/coding/evaluate",
          {
            question:
              questions[current],

            answer:
              code,

            language
          }
        );


      const data =
        res.data || {};


      setEvaluation(
        data
      );


      // ======================================================
      // DETERMINE WHETHER ANSWER IS CORRECT
      // ======================================================

      const score =
        Number(
          data.score ||
          data.overall_score ||
          0
        );


      const isCorrect =
        data.correct === true ||
        data.is_correct === true ||
        String(
          data.result || ""
        ).toLowerCase() ===
          "correct" ||
        score >= 7;


      // ======================================================
      // COUNT ONLY ONCE
      // ======================================================

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


      // ======================================================
      // FINAL QUESTION
      // ======================================================

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


    } catch (err) {

      console.error(
        "Evaluation error:",
        err
      );


      setEvaluation({

        feedback:
          "❌ Evaluation failed. Please check your backend connection.",

        correct:
          false

      });

    } finally {

      setLoading(false);

    }

  };


  // ==========================================================
  // NEXT QUESTION
  // ==========================================================

  const nextQuestion = () => {

    if (
      current <
      questions.length - 1
    ) {

      setCurrent(
        (prev) =>
          prev + 1
      );

      setCode("");

      setOutput("");

      setEvaluation(null);

    }

  };


  // ==========================================================
  // FINISH CODING ROUND
  // ==========================================================

  const finishCodingRound = () => {

    navigate("/");

  };


  // ==========================================================
  // NO RESUME
  // ==========================================================

  if (!result) {

    return (

      <div className="coding-page">

        <div className="coding-empty-card">

          <div className="coding-empty-icon">
            💻
          </div>

          <h2>
            Upload Resume First
          </h2>

          <p>
            Analyze your resume from the
            dashboard to start the AI Coding Round.
          </p>

          <button
            onClick={() =>
              navigate("/resume")
            }
          >
            Upload Resume
          </button>

        </div>

      </div>

    );

  }


  // ==========================================================
  // COMPLETED SCREEN
  // ==========================================================

  if (completed) {

    const correctCount =
      Array.from(
        countedQuestionRef.current
      ).length;


    return (

      <div className="coding-page">

        <div className="coding-complete-card">

          <div className="complete-icon">
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


          <div className="coding-final-stat">

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
            className="dashboard-return-btn"
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
  // MAIN PAGE
  // ==========================================================

  return (

    <div className="coding-page">

      <div className="coding-container">


        {/* HEADER */}

        <div className="coding-header">

          <div className="coding-badge">
            AI POWERED
          </div>

          <h1>
            Coding Interview Practice
          </h1>

          <p>
            Solve coding and SQL problems
            and receive AI evaluation.
          </p>

        </div>


        {/* TOP BAR */}

        <div className="top-bar">

          <div className="question-progress">

            Question{" "}

            <strong>
              {current + 1}
            </strong>

            {" "}of{" "}

            <strong>
              {questions.length}
            </strong>

          </div>


          <select
            value={language}
            onChange={(e) =>
              setLanguage(
                e.target.value
              )
            }
            className="language-select"
          >

            <option value="python">
              Python
            </option>

            <option value="java">
              Java
            </option>

            <option value="c">
              C
            </option>

            <option value="cpp">
              C++
            </option>

            <option value="sql">
              SQL
            </option>

          </select>

        </div>


        {/* PROGRESS BAR */}

        <div className="coding-progress">

          <div
            className="coding-progress-fill"
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

        {questions.length > 0 && (

          <div className="question-card">

            <div className="question-label">
              CODING QUESTION
            </div>

            <h2>
              {questions[current]}
            </h2>

          </div>

        )}


        {/* EDITOR */}

        <div className="editor-wrapper">

          <div className="editor-top">

            <span>
              {language.toUpperCase()}
            </span>

            <span>
              Code Editor
            </span>

          </div>


          <textarea
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
              )
            }
            placeholder={
              `Write your ${language} solution here...`
            }
            className="code-editor"
            spellCheck="false"
          />

        </div>


        {/* ACTION BUTTONS */}

        <div className="action-buttons">

          <button
            className="run-btn"
            onClick={runCode}
            disabled={loading}
          >
            ▶ Run Code
          </button>


          <button
            className="submit-btn"
            onClick={
              submitAnswer
            }
            disabled={loading}
          >

            {loading
              ? "AI Evaluating..."
              : "Submit Answer"}

          </button>

        </div>


        {/* OUTPUT */}

        {output && (

          <div className="result-card">

            <div className="result-title">
              Code Output
            </div>

            <pre>
              {output}
            </pre>

          </div>

        )}


        {/* EVALUATION */}

        {evaluation && (

          <div className="evaluation-card">

            <div className="evaluation-title">

              AI Evaluation Report

            </div>


            <div className="evaluation-content">

              <ReactMarkdown>
                {
                  evaluation.feedback ||
                  "No feedback available."
                }
              </ReactMarkdown>

            </div>

          </div>

        )}


        {/* NEXT QUESTION */}

        {evaluation &&
          current <
            questions.length - 1 && (

            <div className="next-wrapper">

              <button
                className="next-btn"
                onClick={
                  nextQuestion
                }
              >
                Next Question →
              </button>

            </div>

          )}


        {/* FINAL QUESTION MESSAGE */}

        {evaluation &&
          current ===
            questions.length - 1 && (

            <div className="finish-wrapper">

              <p>
                🎉 You completed the final
                question.
              </p>

              <button
                className="finish-btn"
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