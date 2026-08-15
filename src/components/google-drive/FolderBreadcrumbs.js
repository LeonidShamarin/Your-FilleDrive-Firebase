import React from "react";
import { Link } from "react-router-dom";
import { ROOT_FOLDER } from "./../../hooks/useFolder";

export default function FolderBreadcrumbs({ currentFolder }) {
  // The folder is null for the first frame after a cold load; keep the row's
  // height so the toolbar does not jump once it arrives.
  if (!currentFolder) {
    return (
      <nav className="breadcrumbs" aria-label="Folder path">
        <span className="breadcrumbs__current">&nbsp;</span>
      </nav>
    );
  }

  const isRoot = currentFolder === ROOT_FOLDER || currentFolder.id == null;
  // `path` holds every ancestor except the root itself, oldest first.
  const ancestors = isRoot ? [] : [ROOT_FOLDER, ...(currentFolder.path ?? [])];

  return (
    <nav className="breadcrumbs" aria-label="Folder path">
      {ancestors.map((folder, index) => (
        <span className="breadcrumbs__item" key={folder.id ?? "root"}>
          <Link
            to={folder.id ? `/folder/${folder.id}` : "/"}
            // Each ancestor's own path is everything above it, root excluded.
            state={{ folder: { ...folder, path: ancestors.slice(1, index) } }}
            className="breadcrumbs__link"
            title={folder.name}
          >
            {folder.name}
          </Link>
          <span className="breadcrumbs__sep" aria-hidden="true">
            /
          </span>
        </span>
      ))}
      <span className="breadcrumbs__current" title={currentFolder.name}>
        {isRoot ? ROOT_FOLDER.name : currentFolder.name}
      </span>
    </nav>
  );
}
