import { FunctionComponent, h, Fragment } from "preact";

export const Modal: FunctionComponent<{
  title: string;
  id: string;
  confirmText?: string;
  confirmColor?: string;
  closeText?: string;
  handleClose: () => void;
  handleConfirm?: () => void;
}> = ({
  title,
  id,
  confirmText,
  confirmColor,
  closeText,
  handleClose,
  handleConfirm,
  children,
}) => {
  return (
    <>
      <div
        class="modal show"
        tabIndex={-1}
        role="dialog"
        style={{ display: "block" }}
        id={id}
        onClick={(ev) => {
          if (ev.target === ev.currentTarget) {
            handleClose();
          }
        }}
      >
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{title}</h5>
            </div>
            <div class="modal-body">{children}</div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                onClick={() => handleClose()}
              >
                {closeText || "Close"}
              </button>
              {confirmText && (
                <button
                  type="button"
                  class={`btn btn-primary ${
                    confirmColor ? `btn-${confirmColor}` : ""
                  }`}
                  onClick={() => handleConfirm()}
                >
                  {confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </>
  );
};
