import { faFile, faTrash } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { database, storage } from "../../firebase";

export default function File({ file }) {
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    try {
      await database.files.doc(file.id).delete();
      await storage.refFromURL(file.url).delete();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const getFileType = (fileName) => {
    const fileParts = fileName.split(".");
    const fileExtension = fileParts[fileParts.length - 1].toLowerCase();
    if (
      fileExtension === "jpg" ||
      fileExtension === "jpeg" ||
      fileExtension === "png"
    ) {
      return "image";
    } else {
      return "other";
    }
  };

  const fileType = getFileType(file.name);
  const trimmedFileName =
    file.name.length > 17 ? file.name.substring(0, 17) + "..." : file.name;
  const fileUrl = `${file.url}`;

  return (
    <div className="btn btn-outline-dark text-truncate w-100">
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {fileType === "image" && (
          <img
            src={fileUrl}
            alt={file.name}
            style={{ width: "100px", height: "100px" }}
          />
        )}

        {fileType !== "image" && (
          <FontAwesomeIcon icon={faFile} className="mr-2" />
        )}

        <span style={{ paddingLeft: "1px" }}> {trimmedFileName} </span>
      </a>
      {currentUser.uid === file.userId && (
        <button
          className="btn btn-danger ml-auto align-items-center"
          onClick={handleDelete}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
    </div>
  );
}
