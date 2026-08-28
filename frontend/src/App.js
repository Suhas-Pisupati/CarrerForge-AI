import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { useEffect, useState } from "react";

import axios from "axios";

import "./App.css";


// ==========================================
// AUTH
// ==========================================

import Login from "./pages/Login";
import Register from "./pages/Register";


// ==========================================
// COMPONENTS
// ==========================================

import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";


// ==========================================
// PAGES
// ==========================================

import DashboardHome from "./pages/DashboardHome";
import Dashboard from "./pages/Dashboard";
import InterviewPrep from "./pages/InterviewPrep";
import JobRecommendations from "./pages/JobRecommendations";
import MockInterview from "./pages/MockInterview";
import CodingRound from "./pages/CodingRound";
import ProjectGuide from "./pages/ProjectGuide";


function App() {

  // ========================================
  // USER STATE
  // IMPORTANT:
  // Do NOT load user from localStorage here.
  // Backend will verify the token first.
  // ========================================

  const [user, setUser] = useState(null);


  // ========================================
  // AUTH CHECK STATE
  // ========================================

  const [authLoading, setAuthLoading] = useState(true);


  // ========================================
  // RESUME RESULT
  // ========================================

  const [result, setResult] = useState(null);


  // ========================================
  // VERIFY CURRENT USER
  // ========================================

  useEffect(() => {

    let mounted = true;


    const verifyUser = async () => {

      const token = localStorage.getItem("token");


      // ======================================
      // NO TOKEN = NOT LOGGED IN
      // ======================================

      if (!token) {

        localStorage.removeItem("user");

        if (mounted) {

          setUser(null);
          setAuthLoading(false);

        }

        return;

      }


      // ======================================
      // TOKEN EXISTS
      // VERIFY WITH BACKEND
      // ======================================

      try {

        const response = await axios.get(
          "http://127.0.0.1:8000/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );


        const currentUser = response.data;


        // ====================================
        // ONLY USE VERIFIED USER
        // ====================================

        if (mounted) {

          setUser(currentUser);

          localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
          );

        }

      } catch (error) {

        console.error(
          "User verification failed:",
          error
        );


        // ====================================
        // TOKEN INVALID / EXPIRED
        // ====================================

        localStorage.removeItem("token");
        localStorage.removeItem("user");


        if (mounted) {

          setUser(null);

        }

      } finally {

        if (mounted) {

          setAuthLoading(false);

        }

      }

    };


    verifyUser();


    // ======================================
    // CLEANUP
    // ======================================

    return () => {

      mounted = false;

    };

  }, []);


  return (

    <Router>

      <Routes>


        {/* =====================================
            PUBLIC ROUTES
        ====================================== */}

        <Route
          path="/login"
          element={

            authLoading ? (

              <div className="auth-loading">
                Checking session...
              </div>

            ) : user ? (

              <Navigate
                to="/"
                replace
              />

            ) : (

              <Login
                setUser={setUser}
              />

            )

          }
        />


        <Route
          path="/register"
          element={

            authLoading ? (

              <div className="auth-loading">
                Checking session...
              </div>

            ) : user ? (

              <Navigate
                to="/"
                replace
              />

            ) : (

              <Register />

            )

          }
        />


        {/* =====================================
            PROTECTED ROUTES
        ====================================== */}

        <Route
          element={
            <ProtectedRoute
              user={user}
              authLoading={authLoading}
            />
          }
        >


          <Route
            element={
              <ProtectedLayout
                user={user}
                setUser={setUser}
              />
            }
          >


            {/* =================================
                HOME DASHBOARD
            ================================= */}

            <Route
              path="/"
              element={
                <DashboardHome
                  result={result}
                  setResult={setResult}
                  user={user}
                  setUser={setUser}
                />
              }
            />


            {/* =================================
                RESUME ANALYZER
            ================================= */}

            <Route
              path="/resume"
              element={
                <Dashboard
                  result={result}
                  setResult={setResult}
                  user={user}
                />
              }
            />


            {/* =================================
                INTERVIEW
            ================================= */}

            <Route
              path="/interview"
              element={
                <InterviewPrep
                  result={result}
                />
              }
            />


            {/* =================================
                JOBS
            ================================= */}

            <Route
              path="/jobs"
              element={
                <JobRecommendations
                  result={result}
                />
              }
            />


            {/* =================================
                MOCK INTERVIEW
            ================================= */}

            <Route
              path="/mock"
              element={
                <MockInterview
                  result={result}
                />
              }
            />


            {/* =================================
                CODING
            ================================= */}

            <Route
              path="/coding"
              element={
                <CodingRound
                  result={result}
                />
              }
            />


            {/* =================================
                PROJECT GUIDE
            ================================= */}

            <Route
              path="/projects"
              element={
                <ProjectGuide
                  result={result}
                />
              }
            />


            <Route
              path="/project-guide"
              element={
                <ProjectGuide
                  result={result}
                />
              }
            />


          </Route>

        </Route>


        {/* =====================================
            UNKNOWN URL
        ====================================== */}

        <Route
          path="*"
          element={

            <Navigate
              to={user ? "/" : "/login"}
              replace
            />

          }
        />


      </Routes>

    </Router>

  );

}

export default App;