import React from "react";
import { Modal } from "react-bootstrap";

/**
 * Small confirmation dialog used before destructive actions.
 * A rendered modal is used on purpose instead of window.confirm — a native
 * dialog blocks the whole page and cannot be styled or tested.
 */
export default function ConfirmModal({
  show,
  title,
  body,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onHide={busy ? undefined : onCancel} centered>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn-app"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-app btn-app--danger"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
