import { useState, useEffect, useRef } from "react";
import {
  startMockInterview,
  evaluateMockInterview
} from "../api";
import { useNavigate } from "react-router-dom";
import "./MockInterview.css";

function MockInterview({ result }) {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);

  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [started, setStarted] = useState(false);
  const [scores, setScores] = useState([]);

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const [completed, setCompleted] = useState(false);

  // Prevent duplicate counting
  const countedQuestionsRef = useRef(new Set());

  // ==========================================================
  // GET CURRENT USER KEY
  // ==========================================================

  const getUserKey = () => {
    const email =
      localStorage.getItem("user_email") ||
      "guest";

    return email
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
  };

  // ==========================================================
  // GET STORAGE KEY
  // ==========================================================

  const getMockScoreKey = () => {
    return `mockCorrectAnswers_${getUserKey()}`;
  };

  // ==========================================================
  // SPEECH RECOGNITION
  // ==========================================================

  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.start();

    recognition.onstart = () => {
      console.log("Voice recognition started");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setAnswer((prev) => {
        if (prev.trim()) {
          return `${prev} ${transcript}`;
        }

        return transcript;
      });
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );
    };
  };

  // ==========================================================
  // TEXT TO SPEECH
  // ==========================================================

  const speak = (text) => {
    if (!text) {
      return;
    }

    if (!window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();

    const speech =
      new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 0.95;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
  };

  // ==========================================================
  // START INTERVIEW
  // ==========================================================

  const startInterview = async () => {
    if (starting) {
      return;
    }

    setStarting(true);

    try {
      const res = await startMockInterview({
        resume_text:
          result?.analysis || ""
      });

      const receivedQuestions =
        res.data?.questions ||
        res.questions ||
        [];

      if (!receivedQuestions.length) {
        alert(
          "No interview questions were generated. Please try again."
        );

        return;
      }

      setQuestions(receivedQuestions);
      setCurrent(0);
      setStarted(true);
      setCompleted(false);
      setScores([]);
      setAnswer("");
      setFeedback(null);

      countedQuestionsRef.current =
        new Set();

    } catch (error) {
      console.error(
        "Start interview error:",
        error
      );

      alert(
        error.response?.data?.detail ||
        "Failed to start mock interview. Please check the backend connection."
      );
    } finally {
      setStarting(false);
    }
  };

  // ==========================================================
  // SPEAK QUESTION WHEN QUESTION CHANGES
  // ==========================================================

  useEffect(() => {
    if (
      started &&
      questions.length > 0 &&
      questions[current]
    ) {
      const timer = setTimeout(() => {
        speak(
          questions[current]
        );
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    current,
    questions,
    started
  ]);

  // ==========================================================
  // SAVE CORRECT ANSWER
  // ==========================================================

  const saveCorrectAnswer = () => {
    const key =
      getMockScoreKey();

    const currentCount =
      Number(
        localStorage.getItem(key) || 0
      );

    localStorage.setItem(
      key,
      String(currentCount + 1)
    );

    // Also keep your old key for compatibility
    localStorage.setItem(
      "mockCorrectAnswers",
      String(currentCount + 1)
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
    if (!answer.trim()) {
      alert(
        "Please type or speak your answer first."
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
        await evaluateMockInterview({
          question:
            questions[current],

          answer:
            answer
        });

      console.log(
        "MOCK EVALUATION RESPONSE:",
        res.data || res
      );

      // ======================================================
      // GET RAW RESPONSE
      // ======================================================

      const rawData =
        res.data || res || {};

      // ======================================================
      // HANDLE DIFFERENT BACKEND RESPONSE STRUCTURES
      // ======================================================

      const evaluationData =
        rawData.evaluation ||
        rawData.data ||
        (
          typeof rawData.result === "object" &&
          rawData.result !== null
            ? rawData.result
            : rawData
        );

      // ======================================================
      // EXTRACT SCORE
      // ======================================================

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
        Number(extractedScore) || 0;

      // ======================================================
      // EXTRACT FEEDBACK
      // ======================================================

      const extractedFeedback =
        evaluationData.feedback ??
        evaluationData.feedback_text ??
        evaluationData.detailed_feedback ??
        evaluationData.comments ??
        evaluationData.comment ??
        evaluationData.message ??
        rawData.feedback ??
        rawData.feedback_text ??
        rawData.detailed_feedback ??
        rawData.comments ??
        rawData.comment ??
        rawData.message ??
        (
          typeof rawData.result === "string"
            ? rawData.result
            : ""
        );

      // ======================================================
      // CONVERT FEEDBACK TO STRING SAFELY
      // ======================================================

      let feedbackText =
        extractedFeedback;

      if (
        typeof feedbackText === "object" &&
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
        String(feedbackText).trim() === ""
      ) {
        feedbackText =
          "Evaluation was completed, but no detailed feedback was returned by the backend.";
      }

      // ======================================================
      // SAVE FEEDBACK
      // ======================================================

      const normalizedFeedback = {
        ...evaluationData,

        score,

        feedback:
          String(feedbackText),

        correct:
          evaluationData.correct ??
          evaluationData.is_correct ??
          rawData.correct ??
          rawData.is_correct ??
          false
      };

      console.log(
        "NORMALIZED MOCK EVALUATION:",
        normalizedFeedback
      );

      setFeedback(
        normalizedFeedback
      );

      // ======================================================
      // SAVE SCORE
      // ======================================================

      setScores((prev) => [
        ...prev,
        score
      ]);

      // ======================================================
      // DETERMINE CORRECT ANSWER
      // ======================================================

      const isCorrect =
        normalizedFeedback.correct === true ||
        normalizedFeedback.is_correct === true ||
        String(
          normalizedFeedback.result || ""
        )
          .toLowerCase() === "correct" ||
        score >= 7;

      // ======================================================
      // COUNT ONLY ONCE
      // ======================================================

      if (
        isCorrect &&
        !countedQuestionsRef.current.has(
          current
        )
      ) {
        saveCorrectAnswer();

        countedQuestionsRef.current.add(
          current
        );
      }

      // ======================================================
      // LAST QUESTION
      // ======================================================

      if (
        current >=
        questions.length - 1
      ) {
        const finalScores =
          [...scores, score];

        const average =
          finalScores.length > 0
            ? finalScores.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              finalScores.length
            : 0;

        const history =
          JSON.parse(
            localStorage.getItem(
              "interviews"
            ) || "[]"
          );

        history.push({
          date:
            new Date().toLocaleString(),

          avg:
            average.toFixed(1),

          totalQuestions:
            questions.length
        });

        localStorage.setItem(
          "interviews",
          JSON.stringify(history)
        );

        setTimeout(() => {
          setCompleted(true);
        }, 1800);

      } else {
        setTimeout(() => {
          setAnswer("");
          setFeedback(null);

          setCurrent(
            (prev) => prev + 1
          );
        }, 1800);
      }

    } catch (error) {
      console.error(
        "Mock evaluation error:",
        error
      );

      console.error(
        "Mock backend response:",
        error.response?.data
      );

      setFeedback({
        score: 0,

        feedback:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Unable to evaluate the answer. Please check the backend connection."
      });

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FINISH INTERVIEW
  // ==========================================================

  const finishInterview = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    navigate("/");
  };

  // ==========================================================
  // NO RESUME
  // ==========================================================

  if (!result) {
    return (
      <div className="mock-page">
        <div className="mock-empty-card">

          <div className="mock-empty-icon">
            🎤
          </div>

          <h2>
            Upload Resume First
          </h2>

          <p>
            Upload and analyze your resume
            before starting the AI Mock Interview.
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
    const average =
      scores.length > 0
        ? scores.reduce(
            (a, b) => a + b,
            0
          ) / scores.length
        : 0;

    return (
      <div className="mock-page">

        <div className="mock-result-card">

          <div className="result-icon">
            🎉
          </div>

          <h1>
            Mock Interview Completed
          </h1>

          <p>
            Great job! You completed all{" "}
            {questions.length} interview questions.
          </p>

          <div className="final-score">

            <span>
              Final Score
            </span>

            <strong>
              {average.toFixed(1)}
              <small>/10</small>
            </strong>

          </div>

          <div className="score-list">

            {scores.map(
              (score, index) => (
                <div
                  key={index}
                  className="score-item"
                >

                  <span>
                    Question {index + 1}
                  </span>

                  <strong>
                    {score}/10
                  </strong>

                </div>
              )
            )}

          </div>

          <button
            className="dashboard-return-btn"
            onClick={finishInterview}
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // START SCREEN
  // ==========================================================

  if (!started) {
    return (
      <div className="mock-page">

        <div className="mock-start-card">

          <button
            className="start-btn"
            onClick={startInterview}
            disabled={starting}
          >
            {starting
              ? "Preparing Interview..."
              : "Start Mock Interview 🎤"}
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // INTERVIEW SCREEN
  // ==========================================================

  return (
    <div className="mock-page">

      <div className="mock-container">

        {/* HEADER */}

        <div className="mock-header">

          <div>
            <h1>
              Mock Interview
            </h1>

            <p>
              Answer by typing or using your voice.
            </p>
          </div>

          <div className="progress-box">

            Question

            <strong>
              {current + 1}
            </strong>

            <span>
              / {questions.length}
            </span>

          </div>

        </div>

        {/* PROGRESS */}

        <div className="progress-track">

          <div
            className="progress-fill"
            style={{
              width:
                `${
                  ((current + 1) /
                    questions.length) *
                  100
                }%`
            }}
          />

        </div>

        {/* QUESTION */}

        <div className="mock-question-card">

          <div className="question-label">

            <span>
              🎤 AI Interviewer
            </span>

            <button
              className="replay-btn"
              onClick={() =>
                speak(
                  questions[current]
                )
              }
            >
              🔊 Replay
            </button>

          </div>

          <h2>
            {questions[current]}
          </h2>

          <p className="question-hint">
            Listen to the question or
            read it above, then submit your
            answer.
          </p>

        </div>

        {/* ANSWER */}

        <div className="answer-card">

          <div className="answer-header">

            <h3>
              Your Answer
            </h3>

            <span>
              Type or speak
            </span>

          </div>

          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder="Type your interview answer here..."
            disabled={loading}
          />

          <div className="answer-actions">

            <button
              className="voice-btn"
              onClick={startVoice}
              disabled={loading}
            >
              🎙️ Speak Answer
            </button>

            <button
              className="submit-answer-btn"
              onClick={submitAnswer}
              disabled={loading}
            >
              {loading
                ? "AI Evaluating..."
                : "Submit Answer →"}
            </button>

          </div>

        </div>

        {/* FEEDBACK */}

        {feedback && (
          <div className="mock-feedback-card">

            <div className="feedback-header">

              <div>

                <span>
                  AI FEEDBACK
                </span>

                <h3>
                  Answer Evaluation
                </h3>

              </div>

              <div className="feedback-score">

                {feedback.score || 0}

                <small>
                  /10
                </small>

              </div>

            </div>

            <div className="feedback-body">
              {feedback.feedback ||
                "No feedback available."}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default MockInterview;