import { FunctionComponent, h } from "preact";
import { Modal } from "./modal";

export const ConfirmDelete: FunctionComponent<{
  secretLabel: string;
  handleConfirm: () => void;
  handleCancel: () => void;
}> = ({ secretLabel, handleConfirm, handleCancel }) => (
  <Modal
    id="confirm-delete"
    title="Delete Secret"
    confirmText="Delete"
    confirmColor="danger"
    closeText="Cancel"
    handleConfirm={handleConfirm}
    handleClose={handleCancel}
  >
    <p>Do you really want to delete the secret "{secretLabel}"?</p>
  </Modal>
);
