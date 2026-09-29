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

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";

import DashboardHome from "./pages/DashboardHome";
import Dashboard from "./pages/Dashboard";
import InterviewPrep from "./pages/InterviewPrep";
import JobRecommendations from "./pages/JobRecommendations";
import MockInterview from "./pages/MockInterview";
import CodingRound from "./pages/CodingRound";
import ProjectGuide from "./pages/ProjectGuide";

function userStorageKey(user) {
  const email =
    user?.email ||
    localStorage.getItem("user_email") ||
    "guest";

  return `careerforge_resume_context_${String(email)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")}`;
}

function readSavedResume(user) {
  try {
    const raw =
      localStorage.getItem(userStorageKey(user)) ||
      localStorage.getItem(
        "careerforge_resume_context"
      );

    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(
      "Unable to restore resume context:",
      error
    );

    return null;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /*
   * IMPORTANT:
   * This is the single current-resume context
   * used by every feature.
   */
  const [result, setResult] = useState(() =>
    readSavedResume(null)
  );

  useEffect(() => {
    let mounted = true;

    const verifyUser = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("user");

        if (mounted) {
          setUser(null);
          setAuthLoading(false);
        }

        return;
      }

      try {
        const response =
          await axios.get(
            `${API}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

        const currentUser =
          response.data;

        if (mounted) {
          setUser(currentUser);

          localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
          );

          const saved =
            readSavedResume(
              currentUser
            );

          if (saved) {
            setResult(saved);
          }
        }
      } catch (error) {
        console.error(
          "User verification failed:",
          error
        );

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        if (mounted) {
          setUser(null);
          setResult(null);
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

  /*
   * Save ONLY the current resume.
   *
   * When a new resume is uploaded,
   * result is replaced completely.
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const key =
      userStorageKey(user);

    if (!result) {
      localStorage.removeItem(key);

      localStorage.removeItem(
        "careerforge_resume_context"
      );

      return;
    }

    try {
      localStorage.setItem(
        key,
        JSON.stringify(result)
      );

      /*
       * Compatibility key for
       * existing components.
       */
      localStorage.setItem(
        "careerforge_resume_context",
        JSON.stringify(result)
      );

      if (result.resume_id) {
        localStorage.setItem(
          "careerforge_resume_id",
          result.resume_id
        );
      }
    } catch (error) {
      console.error(
        "Unable to save resume context:",
        error
      );
    }
  }, [
    result,
    user,
    authLoading
  ]);

  return (
    <Router>
      <Routes>

        {/* =========================
            LOGIN
        ========================= */}

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

        {/* =========================
            REGISTER
        ========================= */}

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

        {/* =========================
            PROTECTED ROUTES
        ========================= */}

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

            {/* HOME */}

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

            {/* RESUME / DASHBOARD */}

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

            {/* INTERVIEW */}

            <Route
              path="/interview"
              element={
                <InterviewPrep
                  result={result}
                />
              }
            />

            {/* JOBS */}

            <Route
              path="/jobs"
              element={
                <JobRecommendations
                  result={result}
                />
              }
            />

            {/* MOCK INTERVIEW */}

            <Route
              path="/mock"
              element={
                <MockInterview
                  result={result}
                />
              }
            />

            {/* CODING */}

            <Route
              path="/coding"
              element={
                <CodingRound
                  result={result}
                />
              }
            />

            {/* PROJECTS */}

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

        {/* =========================
            FALLBACK
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? "/"
                  : "/login"
              }
              replace
            />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;