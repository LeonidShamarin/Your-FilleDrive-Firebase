import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus } from "@fortawesome/free-solid-svg-icons";

import { database } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function AddFolderButton({ currentFolder }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  function closeModal() {
    setOpen(false);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const folderName = name.trim();
    if (currentFolder == null || folderName === "") return;

    // A folder's path is the chain of its ancestors, root excluded.
    const isRoot = currentFolder === ROOT_FOLDER || currentFolder.id == null;
    const newPath = isRoot
      ? []
      : [
          ...(currentFolder.path ?? []),
          { name: currentFolder.name, id: currentFolder.id },
        ];

    setSaving(true);
    setError("");
    try {
      await database.folders.add({
        name: folderName,
        parentId: currentFolder.id,
        userId: currentUser.uid,
        path: newPath,
        createdAt: database.getCurrentTimestamp(),
      });
      setName("");
      closeModal();
    } catch (submitError) {
      console.error("Error creating folder:", submitError);
      setError("Could not create the folder. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-app"
        onClick={() => setOpen(true)}
        disabled={currentFolder == null}
      >
        <FontAwesomeIcon icon={faFolderPlus} />
        New folder
      </button>

      <Modal show={open} onHide={closeModal} centered>
        <form onSubmit={handleSubmit}>
          <Modal.Header>
            <Modal.Title>New folder</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <p className="alert-app alert-app--error">{error}</p>}
            <label htmlFor="folder-name">Folder name</label>
            <input
              id="folder-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn-app" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-app btn-app--primary"
              disabled={saving || name.trim() === ""}
            >
              {saving ? "Creating…" : "Create folder"}
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}
