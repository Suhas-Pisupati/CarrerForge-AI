import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { useEffect, useState } from "react";
import axios from "axios";

import API from "./api";

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

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [result, setResult] = useState(null);


  // ========================================
  // VERIFY CURRENT USER
  // ========================================

  useEffect(() => {

    let mounted = true;


    const verifyUser = async () => {

      const token = localStorage.getItem("token");


      // No token
      if (!token) {

        localStorage.removeItem("user");

        if (mounted) {

          setUser(null);
          setAuthLoading(false);

        }

        return;

      }


      try {

        // ✅ DEPLOYED BACKEND URL
        const response = await axios.get(
          `${API}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );


        const currentUser = response.data;


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


    return () => {

      mounted = false;

    };

  }, []);


  return (

    <Router>

      <Routes>


        {/* PUBLIC ROUTES */}

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


        {/* PROTECTED ROUTES */}

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


            <Route
              path="/interview"
              element={
                <InterviewPrep
                  result={result}
                />
              }
            />


            <Route
              path="/jobs"
              element={
                <JobRecommendations
                  result={result}
                />
              }
            />


            <Route
              path="/mock"
              element={
                <MockInterview
                  result={result}
                />
              }
            />


            <Route
              path="/coding"
              element={
                <CodingRound
                  result={result}
                />
              }
            />


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


        {/* UNKNOWN URL */}

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