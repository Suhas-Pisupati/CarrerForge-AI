import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

function Register() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {

    e.preventDefault();

    setError("");


    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {

      setError(
        "Please fill in all fields."
      );

      return;
    }


    if (password.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    if (password !== confirmPassword) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    setLoading(true);


    try {

      await axios.post(
        "http://127.0.0.1:8000/auth/register",
        {
          name: name.trim(),

          email:
            email.trim().toLowerCase(),

          password: password
        }
      );


      // Clear any old logged-in user
      localStorage.removeItem("token");
      localStorage.removeItem("user");


      alert(
        "Registration successful. Please login."
      );


      navigate("/login", {
        replace: true
      });


    } catch (err) {

      console.error(
        "Registration error:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Registration failed. Please try again."
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
            Create Account
          </h1>

          <p>
            Start your AI-powered career preparation
          </p>

        </div>


        {error && (

          <div className="auth-error">
            {error}
          </div>

        )}


        <form onSubmit={handleRegister}>


          {/* NAME */}

          <div className="form-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              disabled={loading}
              required
            />

          </div>


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
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              minLength={6}
              required
            />

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="form-group">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              disabled={loading}
              minLength={6}
              required
            />

          </div>


          {/* REGISTER */}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >

            {loading
              ? "Creating Account..."
              : "Create Account"
            }

          </button>


        </form>


        <div className="auth-footer">

          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Sign In
          </Link>

        </div>


      </div>

    </div>

  );

}

export default Register;