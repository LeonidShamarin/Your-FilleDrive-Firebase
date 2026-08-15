import React, { useState } from "react";
import ReactDom from "react-dom";
import { faFileArrowUp, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuidV4 } from "uuid";

import { useAuth } from "../../context/AuthContext";
import { storage, database } from "../../firebase";
import { ROOT_FOLDER } from "../../hooks/useFolder";

/**
 * Storage path of the folder the file is being dropped into.
 * `folder.path` holds ancestor objects, so it has to be mapped to names —
 * joining the objects directly produces "[object Object]" segments.
 */
function folderStoragePath(currentFolder) {
  const isRoot = currentFolder === ROOT_FOLDER || currentFolder.id == null;
  const segments = isRoot
    ? []
    : [...(currentFolder.path ?? []).map((f) => f.name), currentFolder.name];
  return segments.join("/");
}

export default function AddFileButton({ currentFolder }) {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const { currentUser } = useAuth();

  function removeUpload(id) {
    setUploadingFiles((previous) =>
      previous.filter((uploadFile) => uploadFile.id !== id)
    );
  }

  function updateUpload(id, changes) {
    setUploadingFiles((previous) =>
      previous.map((uploadFile) =>
        uploadFile.id === id ? { ...uploadFile, ...changes } : uploadFile
      )
    );
  }

  function uploadOne(file) {
    const id = uuidV4();
    setUploadingFiles((previous) => [
      ...previous,
      { id, name: file.name, progress: 0, error: false },
    ]);

    const prefix = folderStoragePath(currentFolder);
    const fullPath = `/files/${currentUser.uid}/${
      prefix ? `${prefix}/` : ""
    }${file.name}`;

    const uploadTask = storage.ref(fullPath).put(file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        updateUpload(id, {
          progress: snapshot.bytesTransferred / snapshot.totalBytes,
        });
      },
      (uploadError) => {
        console.error("Upload failed:", uploadError);
        updateUpload(id, { error: true });
      },
      async () => {
        try {
          const url = await uploadTask.snapshot.ref.getDownloadURL();
          // Same name in the same folder means a replacement, not a duplicate.
          const existingFiles = await database.files
            .where("name", "==", file.name)
            .where("userId", "==", currentUser.uid)
            .where("folderId", "==", currentFolder.id)
            .get();

          const existingFile = existingFiles.docs[0];
          if (existingFile) {
            await existingFile.ref.update({ url });
          } else {
            await database.files.add({
              url,
              name: file.name,
              createdAt: database.getCurrentTimestamp(),
              folderId: currentFolder.id,
              userId: currentUser.uid,
            });
          }
          removeUpload(id);
        } catch (saveError) {
          console.error("Could not record the uploaded file:", saveError);
          updateUpload(id, { error: true });
        }
      }
    );
  }

  function handleUpload(e) {
    const files = Array.from(e.target.files ?? []);
    if (currentFolder != null) {
      files.forEach(uploadOne);
    }
    // Clearing the input lets the same file be picked again right after.
    e.target.value = "";
  }

  return (
    <>
      <label className="btn-app btn-app--primary" style={{ marginBottom: 0 }}>
        <FontAwesomeIcon icon={faFileArrowUp} />
        Upload
        <input
          type="file"
          multiple
          onChange={handleUpload}
          disabled={currentFolder == null}
          style={{ position: "absolute", left: "-9999px", opacity: 0 }}
        />
      </label>

      {uploadingFiles.length > 0 &&
        ReactDom.createPortal(
          <div className="upload-stack">
            {uploadingFiles.map((file) => (
              <div className="upload-card" key={file.id}>
                <div className="upload-card__head">
                  <span className="upload-card__name" title={file.name}>
                    {file.name}
                  </span>
                  {file.error && (
                    <button
                      type="button"
                      className="upload-card__close"
                      onClick={() => removeUpload(file.id)}
                      aria-label="Dismiss"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
                <div className="upload-bar">
                  <div
                    className={`upload-bar__fill${
                      file.error ? " upload-bar__fill--error" : ""
                    }`}
                    style={{
                      width: file.error ? "100%" : `${file.progress * 100}%`,
                    }}
                  />
                </div>
                <div className="upload-card__status">
                  {file.error
                    ? "Upload failed"
                    : `${Math.round(file.progress * 100)} %`}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
