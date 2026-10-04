import {
  useState,
  useEffect,
  useRef
} from "react";

import {
  startMockInterview,
  evaluateMockInterview
} from "../api";

import {
  useNavigate
} from "react-router-dom";

import {
  Capacitor
} from "@capacitor/core";

import {
  TextToSpeech
} from "@capacitor-community/text-to-speech";

import {
  SpeechRecognition
} from "@capacitor-community/speech-recognition";

import "./MockInterview.css";


function MockInterview({ result }) {

  const navigate =
    useNavigate();


  // ==========================================================
  // INTERVIEW STATE
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
    answer,
    setAnswer
  ] = useState("");


  const [
    feedback,
    setFeedback
  ] = useState(null);


  const [
    started,
    setStarted
  ] = useState(false);


  const [
    scores,
    setScores
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    starting,
    setStarting
  ] = useState(false);


  const [
    completed,
    setCompleted
  ] = useState(false);


  // ==========================================================
  // PREVENT DUPLICATE CORRECT ANSWER COUNTING
  // ==========================================================

  const countedQuestionsRef =
    useRef(new Set());


  // ==========================================================
  // GET CURRENT USER KEY
  // ==========================================================

  const getUserKey = () => {

    const email =
      localStorage.getItem(
        "user_email"
      ) ||
      "guest";


    return email
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        "_"
      );
  };


  // ==========================================================
  // GET MOCK SCORE STORAGE KEY
  // ==========================================================

  const getMockScoreKey = () => {

    return `mockCorrectAnswers_${getUserKey()}`;

  };


  // ==========================================================
  // STOP SPEECH RECOGNITION
  // ==========================================================

  const stopVoiceRecognition = async () => {

    /*
     * Stop native Android speech recognition.
     */

    if (
      Capacitor.isNativePlatform()
    ) {

      try {

        const listening =
          await SpeechRecognition.isListening();

        if (
          listening.listening
        ) {

          await SpeechRecognition.stop();

        }

      } catch (error) {

        console.log(
          "Native speech recognition stop error:",
          error
        );

      }

    }

  };


  // ==========================================================
  // STOP TEXT TO SPEECH
  // ==========================================================

  const stopSpeaking = async () => {

    /*
     * Stop browser speech synthesis.
     */

    if (
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }


    /*
     * Stop native Android Text-to-Speech.
     */

    if (
      Capacitor.isNativePlatform()
    ) {

      try {

        await TextToSpeech.stop();

      } catch (error) {

        console.log(
          "Native TTS stop error:",
          error
        );

      }

    }

  };


  // ==========================================================
  // RESET INTERVIEW WHEN A NEW RESUME IS UPLOADED
  // ==========================================================

  useEffect(() => {

    /*
     * IMPORTANT:
     *
     * When resume_id changes, it means
     * a different resume has been analyzed.
     *
     * Reset the old interview so questions
     * from the previous resume are never reused.
     */

    setQuestions([]);

    setCurrent(0);

    setAnswer("");

    setFeedback(null);

    setStarted(false);

    setScores([]);

    setCompleted(false);

    setLoading(false);

    setStarting(false);


    countedQuestionsRef.current =
      new Set();


    /*
     * Stop any currently playing
     * interview question.
     */

    stopSpeaking();


    /*
     * Stop any active microphone
     * recognition session.
     */

    stopVoiceRecognition();


  }, [
    result?.resume_id
  ]);


  // ==========================================================
  // SPEECH RECOGNITION
  // ==========================================================

  const startVoice = async () => {

    /*
     * Prevent microphone recognition
     * while AI is evaluating the answer.
     */

    if (loading) {

      return;

    }


    // ========================================================
    // ANDROID / CAPACITOR
    // ========================================================

    if (
      Capacitor.isNativePlatform()
    ) {

      try {

        console.log(
          "Starting native Android speech recognition..."
        );


        // ----------------------------------------------------
        // CHECK IF SPEECH RECOGNITION IS AVAILABLE
        // ----------------------------------------------------

        const availability =
          await SpeechRecognition.available();


        console.log(
          "Speech recognition availability:",
          availability
        );


        if (
          !availability.available
        ) {

          alert(
            "Speech recognition is not available on this device."
          );

          return;

        }


        // ----------------------------------------------------
        // REQUEST MICROPHONE PERMISSION
        // ----------------------------------------------------

        let permission =
          await SpeechRecognition.checkPermissions();


        console.log(
          "Speech recognition permission:",
          permission
        );


        if (
          permission.speechRecognition !==
          "granted"
        ) {

          permission =
            await SpeechRecognition.requestPermissions();


          console.log(
            "Updated speech recognition permission:",
            permission
          );

        }


        if (
          permission.speechRecognition !==
          "granted"
        ) {

          alert(
            "Microphone permission is required. Please allow microphone access for CareerForge AI in your phone settings."
          );

          return;

        }


        // ----------------------------------------------------
        // STOP PREVIOUS RECOGNITION SESSION
        // ----------------------------------------------------

        try {

          const listening =
            await SpeechRecognition.isListening();


          if (
            listening.listening
          ) {

            await SpeechRecognition.stop();

          }

        } catch (error) {

          console.log(
            "Previous recognition session check error:",
            error
          );

        }


        // ----------------------------------------------------
        // START NATIVE SPEECH RECOGNITION
        // ----------------------------------------------------

        console.log(
          "Listening for your answer..."
        );


        const result =
          await SpeechRecognition.start({

            language:
              "en-US",


            maxResults:
              1,


            prompt:
              "Speak your interview answer",


            partialResults:
              false,


            popup:
              false

          });


        console.log(
          "Native speech recognition result:",
          result
        );


        // ----------------------------------------------------
        // GET SPOKEN TEXT
        // ----------------------------------------------------

        const matches =
          result?.matches ||
          [];


        if (
          Array.isArray(matches) &&
          matches.length > 0
        ) {

          const transcript =
            String(
              matches[0]
            ).trim();


          console.log(
            "Recognized answer:",
            transcript
          );


          if (
            transcript
          ) {

            setAnswer(
              (previous) => {

                if (
                  previous.trim()
                ) {

                  return `${previous} ${transcript}`;

                }


                return transcript;

              }
            );

          }

        } else {

          console.log(
            "No speech result received."
          );


          alert(
            "I couldn't hear your answer. Please tap 'Speak Answer' and try again."
          );

        }


        return;

      } catch (error) {

        console.error(
          "Native Android speech recognition error:",
          error
        );


        alert(
          "Unable to use the microphone. Please make sure microphone permission is allowed and try again."
        );


        return;

      }

    }


    // ========================================================
    // WEBSITE / BROWSER SPEECH RECOGNITION
    // ========================================================

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognitionAPI) {

      alert(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );

      return;

    }


    const recognition =
      new SpeechRecognitionAPI();


    recognition.lang =
      "en-US";


    recognition.continuous =
      false;


    recognition.interimResults =
      false;


    recognition.onstart = () => {

      console.log(
        "Browser voice recognition started"
      );

    };


    recognition.onresult =
      (event) => {

        const transcript =
          event
            .results[0][0]
            .transcript;


        setAnswer(
          (previous) => {

            if (
              previous.trim()
            ) {

              return `${previous} ${transcript}`;

            }


            return transcript;

          }
        );

      };


    recognition.onerror =
      (event) => {

        console.error(
          "Browser speech recognition error:",
          event.error
        );

      };


    recognition.onend = () => {

      console.log(
        "Browser voice recognition ended"
      );

    };


    try {

      recognition.start();

    } catch (error) {

      console.error(
        "Unable to start browser speech recognition:",
        error
      );

    }

  };


  // ==========================================================
  // TEXT TO SPEECH
  // ==========================================================

  const speak = async (
    text
  ) => {

    if (!text) {
      return;
    }


    /*
     * Always stop any previous speech
     * before starting the new question.
     */

    await stopSpeaking();


    // ========================================================
    // ANDROID / CAPACITOR
    // ========================================================

    if (
      Capacitor.isNativePlatform()
    ) {

      try {

        console.log(
          "Using native Android Text-to-Speech"
        );


        await TextToSpeech.speak({

          text:
            String(text),


          lang:
            "en-US",


          rate:
            0.95,


          pitch:
            1.0,


          volume:
            1.0

        });


        return;

      } catch (error) {

        console.error(
          "Native Android TTS error:",
          error
        );

        /*
         * If native TTS fails, continue to
         * browser TTS as a fallback.
         */

      }

    }


    // ========================================================
    // WEBSITE / BROWSER TTS
    // ========================================================

    if (
      !window.speechSynthesis
    ) {

      console.error(
        "Speech synthesis is not supported."
      );

      return;

    }


    try {

      const speech =
        new SpeechSynthesisUtterance(
          String(text)
        );


      speech.lang =
        "en-US";


      speech.rate =
        0.95;


      speech.pitch =
        1;


      speech.volume =
        1;


      /*
       * Try to select an English voice
       * when available.
       */

      const voices =
        window.speechSynthesis.getVoices();


      const englishVoice =
        voices.find(
          (voice) =>
            voice.lang &&
            voice.lang
              .toLowerCase()
              .startsWith(
                "en"
              )
        );


      if (
        englishVoice
      ) {

        speech.voice =
          englishVoice;

      }


      window.speechSynthesis.speak(
        speech
      );


    } catch (error) {

      console.error(
        "Browser Text-to-Speech error:",
        error
      );

    }

  };


  // ==========================================================
  // START MOCK INTERVIEW
  // ==========================================================

  const startInterview =
    async () => {

      if (starting) {
        return;
      }


      // ------------------------------------------------------
      // RESUME CHECK
      // ------------------------------------------------------

      if (!result) {

        alert(
          "Please upload and analyze a resume first."
        );

        return;
      }


      // ------------------------------------------------------
      // CURRENT RESUME SKILLS
      // ------------------------------------------------------

      /*
       * IMPORTANT:
       *
       * Always take skills from the CURRENT
       * uploaded/analyzed resume.
       *
       * Nothing is hardcoded here.
       */

      const userSkills =
        Array.isArray(
          result.skills
        )
          ? [
              ...result.skills
            ]
          : [];


      if (
        userSkills.length === 0
      ) {

        alert(
          "No skills were detected from the current resume. Please upload another resume."
        );

        return;
      }


      setStarting(
        true
      );


      try {

        console.log(
          "================================"
        );


        console.log(
          "MOCK INTERVIEW START"
        );


        console.log(
          "CURRENT RESUME ID:",
          result.resume_id
        );


        console.log(
          "CURRENT RESUME SKILLS:",
          userSkills
        );


        console.log(
          "CURRENT RESUME TEXT:",
          result.resume_text
        );


        console.log(
          "CURRENT RESUME ROLES:",
          result.roles
        );


        console.log(
          "================================"
        );


        /*
         * SEND CURRENT RESUME CONTEXT
         * TO BACKEND.
         */

        const res =
          await startMockInterview({

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
                ? [
                    ...result.roles
                  ]
                : []

          });


        console.log(
          "MOCK INTERVIEW RESPONSE:",
          res.data || res
        );


        // ----------------------------------------------------
        // GET QUESTIONS
        // ----------------------------------------------------

        const receivedQuestions =
          res.data?.questions ||
          res.questions ||
          [];


        if (
          !Array.isArray(
            receivedQuestions
          ) ||
          receivedQuestions.length ===
            0
        ) {

          alert(
            "No interview questions were generated. Please try again."
          );

          return;
        }


        // ----------------------------------------------------
        // START INTERVIEW
        // ----------------------------------------------------

        setQuestions(
          receivedQuestions
        );


        setCurrent(
          0
        );


        setStarted(
          true
        );


        setCompleted(
          false
        );


        setScores(
          []
        );


        setAnswer(
          ""
        );


        setFeedback(
          null
        );


        countedQuestionsRef.current =
          new Set();


      } catch (error) {

        console.error(
          "Start interview error:",
          error
        );


        console.error(
          "Mock interview backend response:",
          error.response?.data
        );


        alert(
          error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to start mock interview. Please check the backend connection."
        );


      } finally {

        setStarting(
          false
        );

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

      const timer =
        setTimeout(
          () => {

            speak(
              questions[current]
            );

          },
          500
        );


      return () => {

        clearTimeout(
          timer
        );

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

  const saveCorrectAnswer =
    () => {

      const key =
        getMockScoreKey();


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
        String(newCount)
      );


      /*
       * Keep the old dashboard
       * compatibility key.
       */

      localStorage.setItem(
        "mockCorrectAnswers",
        String(newCount)
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

  const submitAnswer =
    async () => {

      if (
        !answer.trim()
      ) {

        alert(
          "Please type or speak your answer first."
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


      /*
       * Stop microphone recognition
       * before sending the answer.
       */

      await stopVoiceRecognition();


      setLoading(
        true
      );


      try {

        /*
         * IMPORTANT:
         *
         * Evaluation also receives the
         * CURRENT resume context.
         */

        const res =
          await evaluateMockInterview({

            question:
              questions[current],


            answer:
              answer,


            skills:
              Array.isArray(
                result?.skills
              )
                ? [
                    ...result.skills
                  ]
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
                ? [
                    ...result.roles
                  ]
                : []

          });


        console.log(
          "MOCK EVALUATION RESPONSE:",
          res.data || res
        );


        // ====================================================
        // RAW RESPONSE
        // ====================================================

        const rawData =
          res.data ||
          res ||
          {};


        // ====================================================
        // HANDLE DIFFERENT BACKEND STRUCTURES
        // ====================================================

        const evaluationData =
          rawData.evaluation ||
          rawData.data ||
          (
            typeof rawData.result ===
              "object" &&
            rawData.result !==
              null
              ? rawData.result
              : rawData
          );


        // ====================================================
        // EXTRACT SCORE
        // ====================================================

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


        // ====================================================
        // EXTRACT FEEDBACK
        // ====================================================

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
            typeof rawData.result ===
            "string"
              ? rawData.result
              : ""
          );


        // ====================================================
        // SAFELY CONVERT FEEDBACK TO STRING
        // ====================================================

        let feedbackText =
          extractedFeedback;


        if (
          typeof feedbackText ===
            "object" &&
          feedbackText !==
            null
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
            "Evaluation was completed, but no detailed feedback was returned by the backend.";

        }


        // ====================================================
        // NORMALIZED FEEDBACK
        // ====================================================

        const normalizedFeedback = {

          ...evaluationData,


          score:
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


        console.log(
          "NORMALIZED MOCK EVALUATION:",
          normalizedFeedback
        );


        setFeedback(
          normalizedFeedback
        );


        // ====================================================
        // IMPORTANT:
        // USE THE CURRENT SCORE ARRAY
        // ====================================================

        const updatedScores = [
          ...scores,
          score
        ];


        setScores(
          updatedScores
        );


        // ====================================================
        // DETERMINE CORRECT ANSWER
        // ====================================================

        const isCorrect =
          normalizedFeedback.correct ===
            true ||

          normalizedFeedback.is_correct ===
            true ||

          String(
            normalizedFeedback.result ||
            ""
          )
            .toLowerCase() ===
            "correct" ||

          score >= 7;


        // ====================================================
        // COUNT ONLY ONCE
        // ====================================================

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


        // ====================================================
        // LAST QUESTION
        // ====================================================

        if (
          current >=
          questions.length - 1
        ) {

          /*
           * Include the current score
           * immediately because React state
           * updates asynchronously.
           */

          const finalScores =
            updatedScores;


          const average =
            finalScores.length >
            0
              ? finalScores.reduce(
                  (
                    sum,
                    value
                  ) =>
                    sum + value,
                  0
                ) /
                finalScores.length
              : 0;


          // --------------------------------------------------
          // INTERVIEW HISTORY
          // --------------------------------------------------

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
              average.toFixed(
                1
              ),


            totalQuestions:
              questions.length,


            /*
             * Save resume ID so history
             * belongs to this resume.
             */

            resume_id:
              result?.resume_id ||
              ""

          });


          localStorage.setItem(
            "interviews",
            JSON.stringify(
              history
            )
          );


          /*
           * Give the user time to read
           * the final feedback.
           */

          setTimeout(
            () => {

              setCompleted(
                true
              );

            },
            1800
          );


        } else {

          /*
           * Move to the next question
           * after feedback is visible.
           */

          setTimeout(
            () => {

              setAnswer(
                ""
              );


              setFeedback(
                null
              );


              setCurrent(
                (previous) =>
                  previous + 1
              );

            },
            1800
          );

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

          score:
            0,


          feedback:
            error.response?.data?.detail ||
            error.response?.data?.message ||
            "Unable to evaluate the answer. Please check the backend connection."

        });


      } finally {

        setLoading(
          false
        );

      }

    };


  // ==========================================================
  // FINISH INTERVIEW
  // ==========================================================

  const finishInterview =
    () => {

      stopSpeaking();

      stopVoiceRecognition();


      navigate(
        "/"
      );

    };


  // ==========================================================
  // NO RESUME
  // ==========================================================

  if (!result) {

    return (

      <div
        className="mock-page"
      >

        <div
          className=
            "mock-empty-card"
        >

          <div
            className=
              "mock-empty-icon"
          >
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
  // COMPLETED SCREEN
  // ==========================================================

  if (completed) {

    const average =
      scores.length > 0
        ? scores.reduce(
            (
              a,
              b
            ) =>
              a + b,
            0
          ) /
          scores.length
        : 0;


    return (

      <div
        className="mock-page"
      >

        <div
          className=
            "mock-result-card"
        >

          <div
            className=
              "result-icon"
          >
            🎉
          </div>


          <h1>
            Mock Interview Completed
          </h1>


          <p>
            Great job! You completed all{" "}
            {questions.length} interview questions.
          </p>


          <div
            className=
              "final-score"
          >

            <span>
              Final Score
            </span>


            <strong>

              {average.toFixed(
                1
              )}

              <small>
                /10
              </small>

            </strong>

          </div>


          <div
            className=
              "score-list"
          >

            {scores.map(
              (
                score,
                index
              ) => (

                <div
                  key={index}
                  className=
                    "score-item"
                >

                  <span>
                    Question{" "}
                    {index + 1}
                  </span>


                  <strong>
                    {score}/10
                  </strong>

                </div>

              )
            )}

          </div>


          <button
            className=
              "dashboard-return-btn"
            onClick={
              finishInterview
            }
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

      <div
        className="mock-page"
      >

        <div
          className=
            "mock-start-card"
        >

          <button
            className=
              "start-btn"
            onClick={
              startInterview
            }
            disabled={
              starting
            }
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

    <div
      className="mock-page"
    >

      <div
        className=
          "mock-container"
      >


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div
          className=
            "mock-header"
        >

          <div>

            <h1>
              Mock Interview
            </h1>


            <p>
              Answer by typing or using your voice.
            </p>

          </div>


          <div
            className=
              "progress-box"
          >

            Question


            <strong>
              {current + 1}
            </strong>


            <span>
              / {questions.length}
            </span>

          </div>

        </div>


        {/* ====================================================
            PROGRESS BAR
        ==================================================== */}

        <div
          className=
            "progress-track"
        >

          <div
            className=
              "progress-fill"
            style={{
              width:
                `${
                  (
                    (
                      current + 1
                    ) /
                    questions.length
                  ) *
                  100
                }%`
            }}
          />

        </div>


        {/* ====================================================
            QUESTION CARD
        ==================================================== */}

        <div
          className=
            "mock-question-card"
        >

          <div
            className=
              "question-label"
          >

            <span>
              🎤 AI Interviewer
            </span>


            <button
              className=
                "replay-btn"
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


          <p
            className=
              "question-hint"
          >
            Listen to the question or
            read it above, then submit your
            answer.
          </p>

        </div>


        {/* ====================================================
            ANSWER CARD
        ==================================================== */}

        <div
          className=
            "answer-card"
        >

          <div
            className=
              "answer-header"
          >

            <h3>
              Your Answer
            </h3>


            <span>
              Type or speak
            </span>

          </div>


          <textarea
            value={
              answer
            }
            onChange={(e) =>
              setAnswer(
                e.target.value
              )
            }
            placeholder=
              "Type your interview answer here..."
            disabled={
              loading
            }
          />


          <div
            className=
              "answer-actions"
          >

            <button
              className=
                "voice-btn"
              onClick={
                startVoice
              }
              disabled={
                loading
              }
            >
              🎙️ Speak Answer
            </button>


            <button
              className=
                "submit-answer-btn"
              onClick={
                submitAnswer
              }
              disabled={
                loading
              }
            >

              {loading
                ? "AI Evaluating..."
                : "Submit Answer →"}

            </button>

          </div>

        </div>


        {/* ====================================================
            FEEDBACK
        ==================================================== */}

        {feedback && (

          <div
            className=
              "mock-feedback-card"
          >

            <div
              className=
                "feedback-header"
            >

              <div>

                <span>
                  AI FEEDBACK
                </span>


                <h3>
                  Answer Evaluation
                </h3>

              </div>


              <div
                className=
                  "feedback-score"
              >

                {feedback.score || 0}


                <small>
                  /10
                </small>

              </div>

            </div>


            <div
              className=
                "feedback-body"
            >

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