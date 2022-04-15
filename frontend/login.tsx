import { FunctionComponent, h, Fragment } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { VaultClient } from "./client";
import { Modal } from "./modal";

const LOCAL_STORAGE_KEY_TOKEN = "netbox-vault-token";

export const logout = () => localStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);

export const Login: FunctionComponent<{
  handleLogin: (client: VaultClient) => void;
  baseUrl: string;
  kvMount: string;
}> = ({ handleLogin, baseUrl, kvMount }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const mounts = {
    kv: kvMount,
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY_TOKEN);
    const client = new VaultClient(baseUrl, mounts, savedToken);
    client
      .tokenLookup()
      .then(() => {
        handleLogin(client);
      })
      .catch(logout)
      .then(() => setIsLoading(false));
  }, [baseUrl, mounts]);

  const handleTokenLogin = useCallback(() => {
    setLoginError(null);
    const client = new VaultClient(baseUrl, mounts, tokenInput);
    client
      .tokenLookup()
      .then(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY_TOKEN, tokenInput);
        handleLogin(client);
      })
      .catch((e) => setLoginError(e.message || e.toString()));
  }, [tokenInput, handleLogin, baseUrl, mounts]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

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
            <pre class="mt-3 alert alert-danger" role="alert">
              {loginError}
            </pre>
          )}
        </Modal>
      )}
      <a class="btn btn-primary" onClick={() => setModalOpen(true)}>
        Login to Vault
      </a>
    </>
  );
};
