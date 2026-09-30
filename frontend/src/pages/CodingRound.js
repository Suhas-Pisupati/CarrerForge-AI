import {
  useEffect,
  useMemo,
  useRef,
  useState
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

  const navigate = useNavigate();


  // ==========================================================
  // CURRENT RESUME DATA
  // ==========================================================

  /*
   * The new uploaded resume must always be the source
   * for Coding Round.
   *
   * We support both the new structure and the older
   * result.analysis structure so existing functionality
   * is not broken.
   */

  const currentSkills = useMemo(() => {

    if (
      Array.isArray(result?.skills)
    ) {
      return result.skills
        .filter(
          (skill) =>
            skill !== null &&
            skill !== undefined &&
            String(skill).trim() !== ""
        )
        .map(
          (skill) =>
            String(skill).trim()
        );
    }

    return [];

  }, [result]);


  const currentResumeText = useMemo(() => {

    /*
     * New backend structure
     */
    if (
      typeof result?.resume_text ===
      "string" &&
      result.resume_text.trim()
    ) {
      return result.resume_text;
    }

    /*
     * Older structure:
     * result.analysis may contain the resume text
     */
    if (
      typeof result?.analysis ===
      "string" &&
      result.analysis.trim()
    ) {
      return result.analysis;
    }

    /*
     * Older nested structure
     */
    if (
      typeof result?.analysis?.analysis_text ===
      "string" &&
      result.analysis.analysis_text.trim()
    ) {
      return result.analysis.analysis_text;
    }

    return "";

  }, [result]);


  const currentResumeId =
    result?.resume_id ||
    result?.id ||
    "";


  const currentRoles = useMemo(() => {

    if (
      Array.isArray(result?.roles)
    ) {
      return result.roles;
    }

    return [];

  }, [result]);


  // ==========================================================
  // SUPPORTED PROGRAMMING LANGUAGES
  // ==========================================================

  /*
   * Languages are determined ONLY from the current resume.
   *
   * Example:
   *
   * Resume:
   * Python, SQL, Pandas
   *
   * Available languages:
   * Python, SQL
   *
   * If another resume has Java:
   * Java will appear instead.
   */

  const availableLanguages = useMemo(() => {

    const skills = currentSkills.map(
      (skill) =>
        String(skill)
          .toLowerCase()
          .trim()
    );

    const languageMap = [

      {
        names: [
          "python"
        ],
        language: "python"
      },

      {
        names: [
          "java",
          "core java",
          "java programming"
        ],
        language: "java"
      },

      {
        names: [
          "c++",
          "cpp",
          "c plus plus"
        ],
        language: "cpp"
      },

      {
        names: [
          "c",
          "c language",
          "c programming"
        ],
        language: "c"
      },

      {
        names: [
          "javascript",
          "java script",
          "js"
        ],
        language: "javascript"
      },

      {
        names: [
          "typescript",
          "type script",
          "ts"
        ],
        language: "typescript"
      },

      {
        names: [
          "sql",
          "mysql",
          "postgresql",
          "postgres",
          "sql server",
          "mssql",
          "oracle sql",
          "pl/sql",
          "plsql"
        ],
        language: "sql"
      }

    ];


    const detected = [];


    languageMap.forEach(
      ({
        names,
        language
      }) => {

        const found =
          skills.some(
            (skill) =>
              names.some(
                (name) => {

                  /*
                   * C must be handled carefully.
                   * We don't want CSS or C# to become C.
                   */

                  if (
                    language === "c"
                  ) {

                    return (
                      skill === "c" ||
                      skill ===
                        "c language" ||
                      skill ===
                        "c programming"
                    );

                  }

                  return (
                    skill === name ||
                    skill.includes(
                      name
                    )
                  );

                }
              )
          );


        if (
          found &&
          !detected.includes(
            language
          )
        ) {

          detected.push(
            language
          );

        }

      }
    );


    return detected;

  }, [currentSkills]);


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
  ] = useState("");


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


  /*
   * Used to prevent an older API response from replacing
   * the questions of a newly uploaded resume.
   */
  const requestIdRef =
    useRef(0);


  // ==========================================================
  // USER-SPECIFIC STORAGE
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
  // RESET LANGUAGE WHEN NEW RESUME IS LOADED
  // ==========================================================

  useEffect(() => {

    setLanguage(
      availableLanguages[0] || ""
    );

  }, [
    currentResumeId,
    availableLanguages
  ]);


  // ==========================================================
  // FETCH QUESTIONS WHEN CURRENT RESUME CHANGES
  // ==========================================================

  useEffect(() => {

    if (!result) {

      setQuestions([]);

      setCurrent(0);

      setCode("");

      setOutput("");

      setEvaluation(null);

      setCompleted(false);

      countedQuestionRef.current =
        new Set();

      return;

    }


    fetchQuestions();

  }, [
    currentResumeId
  ]);


  // ==========================================================
  // FETCH CODING QUESTIONS
  // ==========================================================

  const fetchQuestions = async () => {

    if (!result) {
      return;
    }


    const requestId =
      ++requestIdRef.current;


    setQuestionLoading(true);


    /*
     * Immediately clear old resume data.
     *
     * This is important when the user uploads another
     * resume.
     */

    setQuestions([]);

    setCurrent(0);

    setCode("");

    setOutput("");

    setEvaluation(null);

    setCompleted(false);

    countedQuestionRef.current =
      new Set();


    try {

      console.log(
        "================================"
      );

      console.log(
        "CODING ROUND - CURRENT RESUME"
      );

      console.log(
        "Resume ID:",
        currentResumeId
      );

      console.log(
        "Current Skills:",
        currentSkills
      );

      console.log(
        "Resume Text Length:",
        currentResumeText.length
      );

      console.log(
        "Current Roles:",
        currentRoles
      );

      console.log(
        "================================"
      );


      /*
       * IMPORTANT:
       *
       * Send the CURRENT resume context
       * to the backend.
       */

      const response =
        await getCodingQuestions({

          skills:
            currentSkills,

          resume_text:
            currentResumeText,

          resume_id:
            currentResumeId,

          roles:
            currentRoles

        });


      /*
       * If another resume was uploaded while this
       * request was running, ignore this old response.
       */

      if (
        requestId !==
        requestIdRef.current
      ) {

        return;

      }


      console.log(
        "CODING QUESTIONS RESPONSE:",
        response?.data ||
        response
      );


      const responseData =
        response?.data ||
        response ||
        {};


      const receivedQuestions =
        responseData.questions ||
        responseData.data?.questions ||
        responseData.result?.questions ||
        [];


      const normalizedQuestions =
        Array.isArray(
          receivedQuestions
        )
          ? receivedQuestions
              .filter(
                (question) =>
                  question !==
                    null &&
                  question !==
                    undefined
              )
              .map(
                (question) => {

                  if (
                    typeof question ===
                    "string"
                  ) {
                    return question;
                  }

                  /*
                   * If backend returns:
                   *
                   * {
                   *   question: "...",
                   *   answer: "..."
                   * }
                   *
                   * use the question field.
                   */

                  return (
                    question.question ||
                    question.title ||
                    question.text ||
                    JSON.stringify(
                      question
                    )
                  );

                }
              )
          : [];


      setQuestions(
        normalizedQuestions
      );


      setCurrent(0);

      setEvaluation(null);

      setCode("");

      setOutput("");

      setCompleted(false);

      countedQuestionRef.current =
        new Set();


    } catch (error) {

      /*
       * Ignore an old request error if a newer resume
       * has already been uploaded.
       */

      if (
        requestId !==
        requestIdRef.current
      ) {

        return;

      }


      console.error(
        "Error fetching coding questions:",
        error
      );


      console.error(
        "Coding questions backend response:",
        error?.response?.data
      );


      setQuestions([]);

    } finally {

      if (
        requestId ===
        requestIdRef.current
      ) {

        setQuestionLoading(
          false
        );

      }

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

      setOutput(
        "Running code..."
      );


      const response =
        await runCoding({

          language,

          code

        });


      setOutput(
        response?.data?.output ||
        response?.output ||
        response?.data?.result ||
        "No output returned."
      );


    } catch (error) {

      console.error(
        "Run code error:",
        error
      );


      console.error(
        "Run code backend response:",
        error?.response?.data
      );


      setOutput(

        error?.response?.data?.detail ||

        error?.response?.data?.message ||

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
       * Existing dashboard compatibility.
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


      if (
        !questions[current]
      ) {

        return;

      }


      if (loading) {

        return;

      }


      setLoading(true);


      try {

        /*
         * IMPORTANT:
         *
         * Send current resume information again
         * during evaluation.
         */

        const response =
          await evaluateCoding({

            question:
              questions[current],

            answer:
              code,

            language,

            skills:
              currentSkills,

            resume_text:
              currentResumeText,

            resume_id:
              currentResumeId,

            roles:
              currentRoles

          });


        console.log(
          "CODING EVALUATION RESPONSE:",
          response?.data ||
          response
        );


        const rawData =
          response?.data ||
          response ||
          {};


        // ====================================================
        // HANDLE DIFFERENT RESPONSE STRUCTURES
        // ====================================================

        const evaluationData =

          rawData.evaluation ||

          rawData.data?.evaluation ||

          rawData.data ||

          (
            typeof rawData.result ===
              "object" &&
            rawData.result !== null
              ? rawData.result
              : rawData
          );


        // ====================================================
        // SCORE
        // ====================================================

        const extractedScore =

          evaluationData?.score ??

          evaluationData?.overall_score ??

          evaluationData?.rating ??

          evaluationData?.final_score ??

          rawData?.score ??

          rawData?.overall_score ??

          rawData?.rating ??

          rawData?.final_score ??

          0;


        const score =
          Number(
            extractedScore
          ) || 0;


        // ====================================================
        // FEEDBACK
        // ====================================================

        const extractedFeedback =

          evaluationData?.feedback ??

          evaluationData?.feedback_text ??

          evaluationData?.detailed_feedback ??

          evaluationData?.comments ??

          evaluationData?.comment ??

          evaluationData?.explanation ??

          evaluationData?.message ??

          rawData?.feedback ??

          rawData?.feedback_text ??

          rawData?.detailed_feedback ??

          rawData?.comments ??

          rawData?.comment ??

          rawData?.explanation ??

          rawData?.message ??

          (
            typeof rawData?.result ===
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


        // ====================================================
        // NORMALIZED EVALUATION
        // ====================================================

        const normalizedEvaluation = {

          ...(evaluationData || {}),

          score,

          feedback:
            String(
              feedbackText
            ),

          correct:

            evaluationData?.correct ??

            evaluationData?.is_correct ??

            rawData?.correct ??

            rawData?.is_correct ??

            false

        };


        console.log(
          "NORMALIZED CODING EVALUATION:",
          normalizedEvaluation
        );


        setEvaluation(
          normalizedEvaluation
        );


        // ====================================================
        // DETERMINE CORRECT ANSWER
        // ====================================================

        const isCorrect =

          normalizedEvaluation.correct ===
            true ||

          normalizedEvaluation.is_correct ===
            true ||

          String(
            normalizedEvaluation.result ||
            ""
          )
            .toLowerCase() ===
            "correct" ||

          score >= 7;


        // ====================================================
        // COUNT QUESTION ONLY ONCE
        // ====================================================

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


        // ====================================================
        // FINAL QUESTION
        // ====================================================

        if (

          current >=
          questions.length - 1

        ) {

          /*
           * Keep the existing behavior:
           * show evaluation first and then completion.
           */

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
          error?.response?.data
        );


        setEvaluation({

          score: 0,

          feedback:

            error?.response?.data?.detail ||

            error?.response?.data?.message ||

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

        setEvaluation(null);

      }

    };


  // ==========================================================
  // FINISH CODING ROUND
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
  // LOADING QUESTIONS
  // ==========================================================

  if (questionLoading) {

    return (

      <div className="coding-page">

        <div className="coding-empty-card">

          <div className="coding-empty-icon">
            🤖
          </div>

          <h2>
            Preparing Coding Round
          </h2>

          <p>
            Generating coding questions
            from your current resume skills...
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

        <div className="coding-empty-card">

          <div className="coding-empty-icon">
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
  // MAIN CODING PAGE
  // ==========================================================

  return (

    <div className="coding-page">

      <div className="coding-container">


        {/* =====================================================
            HEADER
        ====================================================== */}

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


        {/* =====================================================
            TOP BAR
        ====================================================== */}

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


          {availableLanguages.length > 0 ? (

            <select
              value={language}
              onChange={(event) =>
                setLanguage(
                  event.target.value
                )
              }
              className="language-select"
            >

              {availableLanguages.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >

                    {
                      item === "cpp"
                        ? "C++"
                        : item ===
                          "javascript"
                        ? "JavaScript"
                        : item ===
                          "typescript"
                        ? "TypeScript"
                        : item
                            .charAt(0)
                            .toUpperCase() +
                          item.slice(1)
                    }

                  </option>

                )
              )}

            </select>

          ) : (

            <span className="language-select">

              No supported coding
              language in current resume

            </span>

          )}

        </div>


        {/* =====================================================
            PROGRESS BAR
        ====================================================== */}

        <div className="coding-progress">

          <div
            className="coding-progress-fill"
            style={{
              width:
                questions.length
                  ? `${
                      (
                        (
                          current + 1
                        ) /
                        questions.length
                      ) *
                      100
                    }%`
                  : "0%"
            }}
          />

        </div>


        {/* =====================================================
            QUESTION
        ====================================================== */}

        <div className="question-card">

          <div className="question-label">
            CODING QUESTION
          </div>

          <h2>
            {questions[current]}
          </h2>

        </div>


        {/* =====================================================
            CODE EDITOR
        ====================================================== */}

        <div className="editor-wrapper">

          <div className="editor-top">

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
            className="code-editor"
            spellCheck="false"
          />

        </div>


        {/* =====================================================
            ACTION BUTTONS
        ====================================================== */}

        <div className="action-buttons">

          <button
            className="run-btn"
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
            className="submit-btn"
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


        {/* =====================================================
            CODE OUTPUT
        ====================================================== */}

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


        {/* =====================================================
            AI EVALUATION
        ====================================================== */}

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


        {/* =====================================================
            NEXT QUESTION
        ====================================================== */}

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


        {/* =====================================================
            FINAL QUESTION
        ====================================================== */}

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