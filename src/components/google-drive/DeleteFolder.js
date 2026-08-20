import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import { database } from "../../firebase";
import { removeStoredFile } from "../../lib/remoteStorage";
import { useAuth } from "../../context/AuthContext";
import { ROOT_FOLDER } from "../../hooks/useFolder";
import ConfirmModal from "../ui/ConfirmModal";

// Firestore has no recursive delete on the client, so the subtree is walked
// here. Both limits are hard stops: a corrupted `parentId` chain must not turn
// this into an unbounded walk.
const MAX_DEPTH = 20;
const MAX_NODES = 500;

/**
 * Breadth-first walk over everything stored under `rootId`.
 * Returns the descendant folder and file documents, deepest level last.
 */
async function collectSubtree(rootId, userId) {
  const folders = [];
  const files = [];
  const visited = new Set([rootId]);
  const queue = [{ id: rootId, depth: 0 }];

  while (queue.length > 0) {
    if (folders.length + files.length > MAX_NODES) {
      throw new Error("subtree-too-large");
    }

    const { id, depth } = queue.shift();
    if (depth >= MAX_DEPTH) continue;

    const [childFolders, childFiles] = await Promise.all([
      database.folders
        .where("parentId", "==", id)
        .where("userId", "==", userId)
        .get(),
      database.files
        .where("folderId", "==", id)
        .where("userId", "==", userId)
        .get(),
    ]);

    childFiles.docs.forEach((doc) => files.push(doc));
    childFolders.docs.forEach((doc) => {
      if (visited.has(doc.id)) return; // a cycle would otherwise never end
      visited.add(doc.id);
      folders.push(doc);
      queue.push({ id: doc.id, depth: depth + 1 });
    });
  }

  return { folders, files };
}

export default function DeleteFolder({ currentFolder }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // The root is not a document — there is nothing to delete there.
  const isRoot =
    !currentFolder ||
    currentFolder === ROOT_FOLDER ||
    currentFolder.id == null;

  if (isRoot || !currentUser) return null;

  async function handleDelete() {
    setDeleting(true);
    setError("");

    try {
      const { folders, files } = await collectSubtree(
        currentFolder.id,
        currentUser.uid
      );

      // Files first: a stored object with no document left is invisible and
      // keeps costing storage.
      for (const fileDoc of files) {
        // Documents written before the move to Supabase have no path — their
        // objects sit in the abandoned Firebase bucket and cannot be reached.
        const { path } = fileDoc.data();
        if (path) {
          try {
            await removeStoredFile(path);
          } catch (storageError) {
            console.warn("Stored object already gone:", storageError);
          }
        }
        await fileDoc.ref.delete();
      }

      // Deepest folders first, then the folder being deleted.
      for (const folderDoc of [...folders].reverse()) {
        await folderDoc.ref.delete();
      }
      await database.folders.doc(currentFolder.id).delete();

      const parentId = currentFolder.path?.[currentFolder.path.length - 1]?.id;
      navigate(parentId ? `/folder/${parentId}` : "/");
    } catch (deleteError) {
      console.error("Error deleting folder:", deleteError);
      setError(
        deleteError.message === "subtree-too-large"
          ? `This folder holds more than ${MAX_NODES} items. Delete some of its contents first.`
          : "Could not delete this folder. Try again."
      );
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-app btn-app--danger"
        onClick={() => setConfirming(true)}
      >
        <FontAwesomeIcon icon={faTrash} />
        Delete folder
      </button>

      <ConfirmModal
        show={confirming}
        busy={deleting}
        title="Delete folder"
        confirmLabel="Delete folder"
        body={
          <>
            <p>
              <strong>{currentFolder.name}</strong> and everything inside it —
              subfolders and uploaded files alike — will be deleted. This cannot
              be undone.
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
    </>
  );
}
