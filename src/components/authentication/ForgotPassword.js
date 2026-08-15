import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CenteredContainer from "./CenteredContainer";

export default function ForgotPassword() {
  const emailRef = useRef();
  const { resetPassword } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);
    try {
      await resetPassword(emailRef.current.value);
      setMessage("Check your inbox for the reset link");
    } catch {
      setError("Failed to send the reset email");
    }
    setLoading(false);
  }

  return (
    <CenteredContainer>
      <div className="auth-card">
        <h1>Reset password</h1>
        {error && <p className="alert-app alert-app--error">{error}</p>}
        {message && <p className="alert-app alert-app--success">{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              ref={emailRef}
              autoComplete="email"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-app btn-app--primary btn-app--block"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
      <p className="auth-footer">
        Need an account? <Link to="/signup">Sign up</Link>
      </p>
    </CenteredContainer>
  );
}
