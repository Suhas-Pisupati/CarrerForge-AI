import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { useEffect, useRef, useState } from "react";
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


/*
 * Clear all resume-related localStorage data.
 *
 * This is important because the Android APK uses
 * WebView localStorage, which persists between logins.
 */
function clearResumeStorage() {
  try {
    localStorage.removeItem(
      "careerforge_resume_context"
    );

    localStorage.removeItem(
      "careerforge_resume_id"
    );

    /*
     * Remove any old user-specific resume contexts
     * created by the previous version of the app.
     */
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (
        key &&
        key.startsWith(
          "careerforge_resume_context_"
        )
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

  } catch (error) {
    console.error(
      "Unable to clear resume storage:",
      error
    );
  }
}


function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /*
   * Resume result exists only for the current login session.
   *
   * IMPORTANT:
   * We intentionally DO NOT restore an old resume
   * from localStorage when the user logs in.
   */
  const [result, setResult] = useState(null);

  /*
   * Keeps track of the currently authenticated user.
   *
   * This helps us detect:
   * - new login
   * - logout
   * - user change
   */
  const previousUserEmail = useRef(null);


  /*
   * =========================
   * VERIFY AUTHENTICATED USER
   * =========================
   */

  useEffect(() => {
    let mounted = true;

    const verifyUser = async () => {
      const token =
        localStorage.getItem("token");

      /*
       * No token means there is no active session.
       */
      if (!token) {
        localStorage.removeItem("user");

        /*
         * IMPORTANT:
         * Remove any old resume data.
         */
        clearResumeStorage();

        if (mounted) {
          setUser(null);
          setResult(null);
          setAuthLoading(false);
          previousUserEmail.current = null;
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

          /*
           * Check whether this is a new login/session.
           */
          const currentEmail =
            currentUser?.email
              ? String(
                  currentUser.email
                ).toLowerCase()
              : null;

          const oldEmail =
            previousUserEmail.current;

          /*
           * If the authenticated user has changed,
           * clear any old resume data.
           */
          if (
            oldEmail &&
            currentEmail &&
            oldEmail !== currentEmail
          ) {
            clearResumeStorage();
            setResult(null);
          }

          /*
           * On first authentication, we also start
           * with a clean resume context.
           *
           * This prevents an old APK localStorage value
           * from appearing after login.
           */
          if (!oldEmail) {
            clearResumeStorage();
            setResult(null);
          }

          previousUserEmail.current =
            currentEmail;

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

        /*
         * Invalid/expired token.
         */
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        /*
         * Clear resume data too.
         */
        clearResumeStorage();

        if (mounted) {
          setUser(null);
          setResult(null);
          previousUserEmail.current = null;
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
   * =========================
   * DETECT LOGIN / LOGOUT
   * =========================
   *
   * Login and Register components
   * can call setUser().
   *
   * When the user changes, make sure
   * the previous user's resume cannot
   * remain visible.
   */

  useEffect(() => {

    if (authLoading) {
      return;
    }

    /*
     * User logged out.
     */
    if (!user) {

      setResult(null);

      clearResumeStorage();

      previousUserEmail.current = null;

      return;
    }

    const currentEmail =
      user?.email
        ? String(
            user.email
          ).toLowerCase()
        : null;

    /*
     * If another user logs in,
     * remove the previous resume.
     */
    if (
      previousUserEmail.current &&
      currentEmail &&
      previousUserEmail.current !== currentEmail
    ) {
      setResult(null);
      clearResumeStorage();
    }

    previousUserEmail.current =
      currentEmail;

  }, [
    user,
    authLoading
  ]);


  /*
   * =========================
   * SAVE CURRENT SESSION DATA
   * =========================
   *
   * We keep the compatibility key while
   * the user is actively using the application.
   *
   * It is cleared when the user logs out
   * or another user logs in.
   */

  useEffect(() => {

    if (authLoading) {
      return;
    }

    /*
     * No authenticated user.
     */
    if (!user) {
      clearResumeStorage();
      return;
    }

    /*
     * No resume uploaded yet.
     */
    if (!result) {
      localStorage.removeItem(
        "careerforge_resume_context"
      );

      localStorage.removeItem(
        "careerforge_resume_id"
      );

      return;
    }

    try {

      /*
       * Save only the CURRENT user's
       * current-session resume.
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


  /*
   * =========================
   * ROUTES
   * =========================
   */

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