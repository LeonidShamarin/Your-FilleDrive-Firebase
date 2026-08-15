import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";

export default function Folder({ folder }) {
  return (
    <div className="card-item card-item--folder">
      {/* react-router v6 takes navigation state as its own prop — putting it
          inside the `to` object (v5 style) silently drops it. */}
      <Link
        to={`/folder/${folder.id}`}
        state={{ folder }}
        className="card-item__link"
        title={folder.name}
      >
        <span className="card-item__icon" aria-hidden="true">
          <FontAwesomeIcon icon={faFolder} />
        </span>
        <span className="card-item__name">{folder.name}</span>
      </Link>
    </div>
  );
}
