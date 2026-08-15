import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";

import NavbarComponent from "./Navbar";
import AddFolderButton from "./AddFolderButton";
import AddFileButton from "./AddFileButton";
import FolderBreadcrumbs from "./FolderBreadcrumbs";
import Folder from "./Folder";
import File from "./File";
import DeleteFolder from "./DeleteFolder";
import { useFolder } from "../../hooks/useFolder";

export default function Dashboard() {
  const { folderId } = useParams();
  const { state } = useLocation();
  // `state` is what <Link state={{ folder }}> put there — the folder itself
  // lives under `.folder`, and is null on a cold load or a page refresh.
  const { folder, childFolders, childFiles } = useFolder(
    folderId,
    state?.folder ?? null
  );

  const isEmpty = childFolders.length === 0 && childFiles.length === 0;

  return (
    <>
      <NavbarComponent />
      <main className="app-main">
        <div className="toolbar">
          <FolderBreadcrumbs currentFolder={folder} />
          <div className="toolbar__actions">
            <AddFileButton currentFolder={folder} />
            <AddFolderButton currentFolder={folder} />
            <DeleteFolder currentFolder={folder} />
          </div>
        </div>

        {childFolders.length > 0 && (
          <section>
            <h2 className="section-label">Folders</h2>
            <div className="grid">
              {childFolders.map((childFolder) => (
                <Folder key={childFolder.id} folder={childFolder} />
              ))}
            </div>
          </section>
        )}

        {childFiles.length > 0 && (
          <section>
            <h2 className="section-label">Files</h2>
            <div className="grid">
              {childFiles.map((childFile) => (
                <File key={childFile.id} file={childFile} />
              ))}
            </div>
          </section>
        )}

        {isEmpty && (
          <div className="empty-state">
            <span className="empty-state__icon" aria-hidden="true">
              <FontAwesomeIcon icon={faFolderOpen} />
            </span>
            <p className="empty-state__title">This folder is empty</p>
            <p className="empty-state__text">
              Upload a file or create a folder with the buttons above. Everything
              you store here is visible only to your account.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
