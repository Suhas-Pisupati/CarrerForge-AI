import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

function Login({ setUser }) {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {

      setError(
        "Please enter email and password."
      );

      return;
    }

    setLoading(true);

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/auth/login",
        {
          email: email.trim().toLowerCase(),
          password: password
        }
      );


      // ========================================
      // GET CURRENT LOGIN DATA
      // ========================================

      const token =
        response.data.access_token;

      const loginUser =
        response.data.user;


      if (!token || !loginUser) {

        throw new Error(
          "Invalid login response"
        );

      }


      // ========================================
      // REMOVE OLD USER DATA
      // ========================================

      localStorage.removeItem("token");
      localStorage.removeItem("user");


      // ========================================
      // SAVE NEW USER DATA
      // ========================================

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(loginUser)
      );


      // ========================================
      // UPDATE APP USER STATE
      // ========================================

      if (setUser) {

        setUser(loginUser);

      }


      // ========================================
      // GO TO DASHBOARD
      // ========================================

      navigate("/", {
        replace: true
      });


    } catch (err) {

      console.error(
        "Login error:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Login failed. Please check your email and password."
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-header">

          <div className="auth-logo">
            🤖 CareerForge AI
          </div>

          <h1>
            Welcome Back
          </h1>

          <p>
            Sign in to continue your interview preparation
          </p>

        </div>


        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        <form onSubmit={handleLogin}>


          {/* EMAIL */}

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              required
            />

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign In"
            }

          </button>


        </form>


        <div className="auth-footer">

          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Create Account
          </Link>

        </div>


      </div>

    </div>

  );

}

export default Login;