import { useState } from "react";
import { Button } from "./Button";
import { FormError } from "./Field";
import { Modal } from "./Modal";

/** Confirmation modal for destructive actions. `onConfirm` may return a promise. */
export function ConfirmDialog({ open, onClose, title, message, confirmLabel = "Delete", onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const close = () => {
    setError(null);
    onClose();
  };

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={title} size="sm">
      <p className="text-sm text-ink-soft">{message}</p>
      {error && (
        <div className="mt-4">
          <FormError>{error}</FormError>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
        <Button variant="danger" loading={busy} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
