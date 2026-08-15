import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloud } from "@fortawesome/free-solid-svg-icons";

export default function CenteredContainer({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="app-brand__mark" aria-hidden="true">
            <FontAwesomeIcon icon={faCloud} />
          </span>
          Your File Drive
        </div>
        {children}
      </div>
    </div>
  );
}
