import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFileZipper,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../context/AuthContext";
import { database } from "../../firebase";
import { removeStoredFile } from "../../lib/remoteStorage";
import ConfirmModal from "../ui/ConfirmModal";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];

const ICON_BY_EXTENSION = {
  pdf: faFilePdf,
  txt: faFileLines,
  md: faFileLines,
  doc: faFileLines,
  docx: faFileLines,
  zip: faFileZipper,
  rar: faFileZipper,
  "7z": faFileZipper,
};

function getExtension(fileName) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export default function File({ file }) {
  const { currentUser } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const extension = getExtension(file.name);
  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const icon = isImage
    ? faFileImage
    : ICON_BY_EXTENSION[extension] ?? faFile;

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      // Storage object first: if the document goes first and this throws, the
      // file is orphaned in the bucket with nothing left pointing at it.
      // Documents written before the move to Supabase carry no path — their
      // objects live in the abandoned Firebase bucket, so there is nothing
      // here to delete and the document should still go.
      if (file.path) await removeStoredFile(file.path);
    } catch (storageError) {
      // Already gone (or never uploaded) — the document should still go.
      console.warn("Could not remove the stored object:", storageError);
    }

    try {
      await database.files.doc(file.id).delete();
      setConfirming(false);
    } catch (databaseError) {
      console.error("Error deleting file:", databaseError);
      setError("Could not delete this file. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="card-item">
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        className="card-item__link"
        title={file.name}
      >
        <span className="card-item__thumb">
          {isImage ? (
            <img src={file.url} alt="" loading="lazy" />
          ) : (
            <FontAwesomeIcon
              icon={icon}
              className="empty-state__icon"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="card-item__name">{file.name}</span>
      </a>

      {currentUser.uid === file.userId && (
        <button
          type="button"
          className="card-item__delete"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${file.name}`}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}

      <ConfirmModal
        show={confirming}
        busy={deleting}
        title="Delete file"
        body={
          <>
            <p>
              <strong>{file.name}</strong> will be removed from your drive. This
              cannot be undone.
            </p>
            {error && (
              <p className="alert-app alert-app--error mt-3">{error}</p>
            )}
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirming(false);
          setError("");
        }}
      />
    </div>
  );
}
