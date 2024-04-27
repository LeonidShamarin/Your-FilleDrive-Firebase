import React from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { database } from "../../firebase";

export default function Folder({ folder }) {
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    try {
      await database.folders.doc(folder.id).delete();
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  return (
    <Button
      to={{
        pathname: `/folder/${folder.id}`,
        state: { folder: folder },
      }}
      variant="outline-dark"
      className="text-truncate w-100"
      as={Link}
    >
      <FontAwesomeIcon icon={faFolder} className="mr-2 px-2" />
      {folder.name}
      {currentUser.uid === folder.userId && (
        <button
          className="btn btn-danger ml-2 align-items-center btn-sm"
          onClick={handleDelete}
          style={{ marginLeft: "5px" }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </Button>
  );
}
