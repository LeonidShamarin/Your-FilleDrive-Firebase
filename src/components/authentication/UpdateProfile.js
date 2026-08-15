import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CenteredContainer from "./CenteredContainer";

export default function UpdateProfile() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, updatePassword, updateEmail } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setError("Passwords do not match");
      return;
    }

    const updates = [];
    if (emailRef.current.value !== currentUser.email) {
      updates.push(updateEmail(emailRef.current.value));
    }
    if (passwordRef.current.value) {
      updates.push(updatePassword(passwordRef.current.value));
    }
    if (updates.length === 0) {
      navigate("/user");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await Promise.all(updates);
      navigate("/user");
    } catch (updateError) {
      // Firebase refuses these two changes on an old session.
      setError(
        updateError.code === "auth/requires-recent-login"
          ? "For security, log out and log back in before changing this."
          : "Failed to update profile"
      );
      setLoading(false);
    }
  }

  return (
    <CenteredContainer>
      <div className="auth-card">
        <h1>Update profile</h1>
        {error && <p className="alert-app alert-app--error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="update-email">Email</label>
            <input
              id="update-email"
              type="email"
              ref={emailRef}
              defaultValue={currentUser.email}
              autoComplete="email"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="update-password">New password</label>
            <input
              id="update-password"
              type="password"
              ref={passwordRef}
              autoComplete="new-password"
              minLength={6}
              placeholder="Leave blank to keep the current one"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="update-password-confirm">Confirm new password</label>
            <input
              id="update-password-confirm"
              type="password"
              ref={passwordConfirmRef}
              autoComplete="new-password"
              placeholder="Leave blank to keep the current one"
            />
          </div>
          <button
            type="submit"
            className="btn-app btn-app--primary btn-app--block"
            disabled={loading}
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
      <p className="auth-footer">
        <Link to="/user">Cancel</Link>
      </p>
    </CenteredContainer>
  );
}
