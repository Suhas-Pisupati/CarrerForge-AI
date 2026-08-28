import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "./DashboardHome.css";

function DashboardHome({
  result,
  setResult,
  user,
  setUser
}) {

  const navigate = useNavigate();


  // ==========================================================
  // CURRENT USER
  // ==========================================================

  const [currentUser, setCurrentUser] =
    useState(user || null);

  const [loadingUser, setLoadingUser] =
    useState(true);


  // ==========================================================
  // DASHBOARD STATISTICS
  // ==========================================================

  const [jobsAppliedToday, setJobsAppliedToday] =
    useState(0);

  const [mockCorrectAnswers, setMockCorrectAnswers] =
    useState(0);

  const [codingCorrectAnswers, setCodingCorrectAnswers] =
    useState(0);


  // ==========================================================
  // GET CURRENT USER KEY
  // ==========================================================

  const getUserKey = (currentUserData = null) => {

    const email =
      currentUserData?.email ||
      localStorage.getItem("user_email") ||
      "";

    if (!email) {
      return "guest";
    }

    return email
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

  };


  // ==========================================================
  // LOAD DASHBOARD STATISTICS
  // ==========================================================

  const loadStatistics = (currentUserData = null) => {

    // ========================================================
    // JOBS
    // ========================================================

    const jobsToday =
      Number(
        localStorage.getItem(
          "jobsAppliedToday"
        ) ||
        localStorage.getItem(
          "jobs_applied_today"
        ) ||
        0
      );


    setJobsAppliedToday(
      jobsToday
    );


    // ========================================================
    // USER-SPECIFIC MOCK SCORE
    // ========================================================

    const userKey =
      getUserKey(
        currentUserData
      );


    const mockKey =
      `mockCorrectAnswers_${userKey}`;


    const savedMock =
      localStorage.getItem(
        mockKey
      );


    const mockCorrect =
      savedMock !== null
        ? Number(savedMock)
        : 0;


    setMockCorrectAnswers(
      mockCorrect
    );


    // ========================================================
    // USER-SPECIFIC CODING SCORE
    // ========================================================

    const codingKey =
      `codingCorrectAnswers_${userKey}`;


    const savedCoding =
      localStorage.getItem(
        codingKey
      );


    const codingCorrect =
      savedCoding !== null
        ? Number(savedCoding)
        : 0;


    setCodingCorrectAnswers(
      codingCorrect
    );

  };


  // ==========================================================
  // LOAD CURRENT LOGGED-IN USER
  // ==========================================================

  useEffect(() => {

    const token =
      localStorage.getItem(
        "token"
      );


    // --------------------------------------------------------
    // NO TOKEN
    // --------------------------------------------------------

    if (!token) {

      setCurrentUser(
        null
      );

      setLoadingUser(
        false
      );

      return;

    }


    // --------------------------------------------------------
    // GET USER FROM BACKEND
    // --------------------------------------------------------

    const loadCurrentUser =
      async () => {

        try {

          const response =
            await axios.get(
              "http://127.0.0.1:8000/auth/me",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`
                }
              }
            );


          const latestUser =
            response.data;


          // ==================================================
          // SET CURRENT USER
          // ==================================================

          setCurrentUser(
            latestUser
          );


          if (setUser) {

            setUser(
              latestUser
            );

          }


          // ==================================================
          // SAVE ONLY THE CURRENT USER
          // ==================================================

          localStorage.setItem(
            "user",
            JSON.stringify(
              latestUser
            )
          );


          // ==================================================
          // UPDATE CURRENT USER EMAIL
          // ==================================================

          if (
            latestUser?.email
          ) {

            localStorage.setItem(
              "user_email",
              latestUser.email
            );

          }


          // ==================================================
          // UPDATE CURRENT USER NAME
          // ==================================================

          if (
            latestUser?.name
          ) {

            localStorage.setItem(
              "user_name",
              latestUser.name
            );

          }


          // ==================================================
          // REMOVE OLD currentUser STORAGE
          // ==================================================

          localStorage.removeItem(
            "currentUser"
          );


          // ==================================================
          // LOAD USER-SPECIFIC STATISTICS
          // ==================================================

          loadStatistics(
            latestUser
          );


          // ==================================================
          // TELL NAVBAR THAT USER CHANGED
          // ==================================================

          window.dispatchEvent(
            new Event(
              "authChanged"
            )
          );

        } catch (error) {

          console.error(
            "Failed to load current user:",
            error
          );


          // --------------------------------------------------
          // BACKEND USER FETCH FAILED
          // --------------------------------------------------

          const savedUser =
            localStorage.getItem(
              "user"
            );


          if (savedUser) {

            try {

              const parsedUser =
                JSON.parse(
                  savedUser
                );


              setCurrentUser(
                parsedUser
              );


              if (setUser) {

                setUser(
                  parsedUser
                );

              }


              if (
                parsedUser?.email
              ) {

                localStorage.setItem(
                  "user_email",
                  parsedUser.email
                );

              }


              if (
                parsedUser?.name
              ) {

                localStorage.setItem(
                  "user_name",
                  parsedUser.name
                );

              }


              loadStatistics(
                parsedUser
              );

            } catch (
              storageError
            ) {

              console.error(
                "Invalid saved user:",
                storageError
              );

              setCurrentUser(
                null
              );

            }

          } else {

            setCurrentUser(
              null
            );

          }

        } finally {

          setLoadingUser(
            false
          );

        }

      };


    loadCurrentUser();


  }, [setUser]);


  // ==========================================================
  // KEEP USER STATE SYNCHRONIZED
  // ==========================================================

  useEffect(() => {

    if (user) {

      setCurrentUser(
        user
      );

      loadStatistics(
        user
      );

    }

  }, [user]);


  // ==========================================================
  // DASHBOARD STATISTICS EVENTS
  // ==========================================================

  useEffect(() => {

    const handleDashboardUpdate =
      () => {

        loadStatistics(
          currentUser
        );

      };


    const handleStorageChange =
      () => {

        loadStatistics(
          currentUser
        );

      };


    const handleAuthChange =
      () => {

        const savedUser =
          localStorage.getItem(
            "user"
          );


        if (savedUser) {

          try {

            const parsedUser =
              JSON.parse(
                savedUser
              );


            setCurrentUser(
              parsedUser
            );


            loadStatistics(
              parsedUser
            );

          } catch {

            loadStatistics();

          }

        } else {

          setCurrentUser(
            null
          );

          loadStatistics();

        }

      };


    window.addEventListener(
      "dashboardStatsUpdated",
      handleDashboardUpdate
    );


    window.addEventListener(
      "storage",
      handleStorageChange
    );


    window.addEventListener(
      "focus",
      handleDashboardUpdate
    );


    window.addEventListener(
      "authChanged",
      handleAuthChange
    );


    return () => {

      window.removeEventListener(
        "dashboardStatsUpdated",
        handleDashboardUpdate
      );


      window.removeEventListener(
        "storage",
        handleStorageChange
      );


      window.removeEventListener(
        "focus",
        handleDashboardUpdate
      );


      window.removeEventListener(
        "authChanged",
        handleAuthChange
      );

    };

  }, [currentUser]);


  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const displayName =
    currentUser?.name ||
    currentUser?.full_name ||
    currentUser?.username ||
    user?.name ||
    user?.full_name ||
    user?.username ||
    "User";


  const displayEmail =
    currentUser?.email ||
    user?.email ||
    "";


  // ==========================================================
  // RESUME DATA
  // ==========================================================

  const skills =
    result?.skills || [];


  const atsScore =
    Number(
      result?.ats_score || 0
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="dashboard-home">


      {/* =====================================================
          WELCOME HEADER
      ===================================================== */}

      <section className="dashboard-welcome">

        <div>

          <p className="dashboard-label">
            AI CAREER ASSISTANT
          </p>


          <h1>

            Welcome back,{" "}

            {loadingUser
              ? "..."
              : displayName}

            {" "}👋

          </h1>


          <p className="dashboard-description">

            Build your career with AI-powered
            resume analysis, interview preparation,
            coding practice and job recommendations.

          </p>


          {displayEmail && (

            <p className="dashboard-user-email">

              {displayEmail}

            </p>

          )}

        </div>


        <button
          className="upload-resume-button"
          onClick={() =>
            navigate("/resume")
          }
        >

          📄 Upload Resume

        </button>

      </section>


      {/* =====================================================
          DASHBOARD STATISTICS
      ===================================================== */}

      <section className="dashboard-stats">


        {/* ===================================================
            RESUME
        =================================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            📄
          </div>


          <div className="stat-content">

            <span>
              Resume ATS Score
            </span>


            <strong>

              {atsScore > 0
                ? `${atsScore}%`
                : "--"}

            </strong>

          </div>

        </div>


        {/* ===================================================
            SKILLS
        =================================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            🧠
          </div>


          <div className="stat-content">

            <span>
              Skills Detected
            </span>


            <strong>

              {skills.length > 0
                ? skills.length
                : "--"}

            </strong>

          </div>

        </div>


        {/* ===================================================
            JOBS
        =================================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            💼
          </div>


          <div className="stat-content">

            <span>
              Jobs Applied Today
            </span>


            <strong>
              {jobsAppliedToday}
            </strong>

          </div>

        </div>


        {/* ===================================================
            MOCK INTERVIEW
        =================================================== */}

        <div
          className="stat-card"
          onClick={() =>
            navigate("/mock")
          }
          style={{
            cursor: "pointer"
          }}
        >

          <div className="stat-icon">
            🎤
          </div>


          <div className="stat-content">

            <span>
              Mock Interview
            </span>


            <strong>

              {mockCorrectAnswers}

              {" "}correct

            </strong>

          </div>

        </div>


        {/* ===================================================
            CODING
        =================================================== */}

        <div
          className="stat-card"
          onClick={() =>
            navigate("/coding")
          }
          style={{
            cursor: "pointer"
          }}
        >

          <div className="stat-icon">
            💻
          </div>


          <div className="stat-content">

            <span>
              Coding Problems
            </span>


            <strong>

              {codingCorrectAnswers}

              {" "}correct

            </strong>

          </div>

        </div>


      </section>


      {/* =====================================================
          GET STARTED
      ===================================================== */}

      {!result && (

        <section className="dashboard-get-started">

          <div>

            <h2>
              Start with your resume
            </h2>


            <p>
              Upload your resume to unlock
              personalized AI career features.
            </p>

          </div>


          <button
            onClick={() =>
              navigate("/resume")
            }
          >

            Upload Resume

          </button>

        </section>

      )}


    </div>

  );

}

export default DashboardHome;