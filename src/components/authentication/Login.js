import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CenteredContainer from "./CenteredContainer";

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);
    try {
      await login(emailRef.current.value, passwordRef.current.value);
      // Navigation unmounts this screen, so nothing is set after it.
      navigate("/");
    } catch (loginError) {
      setError(
        loginError.code === "auth/too-many-requests"
          ? "Too many attempts. Try again later."
          : "Wrong email or password"
      );
      setLoading(false);
    }
  }

  return (
    <CenteredContainer>
      <div className="auth-card">
        <h1>Log in</h1>
        {error && <p className="alert-app alert-app--error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              ref={emailRef}
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              ref={passwordRef}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-app btn-app--primary btn-app--block"
            disabled={loading}
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
      <p className="auth-footer">
        Need an account? <Link to="/signup">Sign up</Link>
      </p>
    </CenteredContainer>
  );
}
