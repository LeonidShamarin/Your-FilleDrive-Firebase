import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import CenteredContainer from "./CenteredContainer";

export default function Profile() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setError("");
    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to log out");
    }
  }

  return (
    <CenteredContainer>
      <div className="auth-card">
        <h1>Profile</h1>
        {error && <p className="alert-app alert-app--error">{error}</p>}

        <div className="profile-row">
          <span className="profile-row__label">Email</span>
          <span className="profile-row__value" title={currentUser.email}>
            {currentUser.email}
          </span>
        </div>

        <Link
          to="/update-profile"
          className="btn-app btn-app--primary btn-app--block"
          style={{ marginTop: 20 }}
        >
          Update profile
        </Link>
        <Link to="/" className="btn-app btn-app--block" style={{ marginTop: 10 }}>
          Back to my drive
        </Link>
      </div>
      <p className="auth-footer">
        <button type="button" className="btn-app btn-app--ghost" onClick={handleLogout}>
          Log out
        </button>
      </p>
    </CenteredContainer>
  );
}
