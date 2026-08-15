import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloud,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";

export default function NavbarComponent() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch {
      // Signing out only clears local state; if it fails the user stays put.
    }
  }

  return (
    <header className="app-header">
      <Link to="/" className="app-brand">
        <span className="app-brand__mark" aria-hidden="true">
          <FontAwesomeIcon icon={faCloud} />
        </span>
        Your File Drive
      </Link>

      <span className="app-header__spacer" />

      {currentUser && (
        <span className="app-header__user" title={currentUser.email}>
          {currentUser.email}
        </span>
      )}

      <Link to="/user" className="btn-app btn-app--ghost">
        <FontAwesomeIcon icon={faUser} />
        Profile
      </Link>

      <button
        type="button"
        className="btn-app btn-app--ghost"
        onClick={handleLogout}
      >
        <FontAwesomeIcon icon={faRightFromBracket} />
        Log out
      </button>
    </header>
  );
}
