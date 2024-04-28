import React from "react";
import { database } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function DeleteFolder({ currentFolder }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    if (!currentFolder || !currentUser.uid) return;

    try {
      await database.folders.doc(currentFolder.id).delete();

      if (currentFolder.path.length > 0) {
        const parentFolderId =
          currentFolder.path[currentFolder.path.length - 1]?.id;
        navigate(parentFolderId ? `/folder/${parentFolderId}` : "/");
      } else {
        navigate(`/`);
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  return (
    <div>
      {currentUser.uid && (
        <button
          className="btn btn-danger ml-2 align-items-center btn-sm"
          onClick={handleDelete}
          style={{ marginRight: "8px" }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );
}
