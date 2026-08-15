import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CenteredContainer from "./CenteredContainer";

const ERROR_BY_CODE = {
  "auth/email-already-in-use": "That email is already registered",
  "auth/invalid-email": "Invalid email address",
  "auth/weak-password": "Password must be at least 6 characters",
};

export default function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await signup(emailRef.current.value, passwordRef.current.value);
      navigate("/");
    } catch (signupError) {
      setError(
        ERROR_BY_CODE[signupError.code] ?? "Failed to create an account"
      );
      setLoading(false);
    }
  }

  return (
    <CenteredContainer>
      <div className="auth-card">
        <h1>Create an account</h1>
        {error && <p className="alert-app alert-app--error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              ref={emailRef}
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              ref={passwordRef}
              autoComplete="new-password"
              minLength={6}
              required
            />
            <p className="auth-hint">At least 6 characters.</p>
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password-confirm">Confirm password</label>
            <input
              id="signup-password-confirm"
              type="password"
              ref={passwordConfirmRef}
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-app btn-app--primary btn-app--block"
            disabled={loading}
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>
      </div>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </CenteredContainer>
  );
}
