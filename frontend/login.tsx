import { FunctionComponent, h, Fragment } from "preact";
import { useCallback, useState } from "preact/hooks";

import { VaultClient } from "./client";
import { Modal } from "./modal";

const VAULT_BASE_URL = "http://localhost:8082/";

export const Login: FunctionComponent<{
  handleLogin: (client: VaultClient) => void;
}> = ({ handleLogin }) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleTokenLogin = useCallback(() => {
    const client = new VaultClient(VAULT_BASE_URL, tokenInput);
    client
      .tokenLookup()
      .then(() => {
        handleLogin(client);
        setLoginError(null);
      })
      .catch((e) => setLoginError(e.message || e.toString()));
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
          {loginError && (
            <div class="mt-3 alert alert-danger" role="alert">
              {loginError}
            </div>
          )}
        </Modal>
      )}
      <a class="btn btn-primary" onClick={() => setModalOpen(true)}>
        Login to Vault
      </a>
    </>
  );
};
