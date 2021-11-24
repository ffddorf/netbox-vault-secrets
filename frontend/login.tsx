import { FunctionComponent, h, Fragment } from "preact";
import { useCallback, useState } from "preact/hooks";

import { vaultRequest } from "./client";
import { Modal } from "./modal";

export const Login: FunctionComponent<{ handleLogin: (t: string) => void }> = ({
  handleLogin,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState(null);

  const handleTokenLogin = useCallback(() => {
    vaultRequest("/v1/auth/token/lookup-self", tokenInput).then(() =>
      handleLogin(tokenInput)
    );
  }, [tokenInput, handleLogin]);

  return (
    <>
      {isModalOpen && (
        <Modal
          id="vaultLogin"
          title="Login to Vault"
          confirmText="Login"
          handleConfirm={handleTokenLogin}
          handleClose={() => setModalOpen(false)}
        >
          <div class="form-group">
            <label for="vaultTokenInput">Vault Token</label>
            <input
              class="form-control"
              type="password"
              id="vaultTokenInput"
              onChange={(ev) => setTokenInput(ev.currentTarget.value)}
            />
            <small id="vaultTokenInputHelp" class="form-text text-muted">
              Please provide a valid Vault token.
            </small>
          </div>
        </Modal>
      )}
      <a class="btn btn-primary" onClick={() => setModalOpen(true)}>
        Login to Vault
      </a>
    </>
  );
};
