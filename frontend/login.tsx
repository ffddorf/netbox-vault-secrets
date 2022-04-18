import { FunctionComponent, h, Fragment } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { displayError, VaultClient } from "./client";
import { Modal } from "./modal";

const LOCAL_STORAGE_KEY_TOKEN = "netbox-vault-token";

export const logout = () => localStorage.removeItem(LOCAL_STORAGE_KEY_TOKEN);

export interface OidcConfig {
  mount_path?: string;
  roles?: Record<string, string>;
}

const TokenLogin: FunctionComponent<{
  handleLogin: (token: string) => void;
}> = ({ handleLogin }) => {
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string | null>(null);
  return (
    <>
      {isModalOpen && (
        <Modal
          id="vaultLogin"
          title="Login to Vault"
          handleClose={() => setModalOpen(false)}
          confirmText="Login"
          handleConfirm={() => {
            setModalOpen(false);
            handleLogin(tokenInput);
          }}
          class="d-flex flex-column gap-4"
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
        Login using Token
      </a>
    </>
  );
};

const receiveMessage = <T,>(): Promise<T> =>
  new Promise((resolve, reject) =>
    window.addEventListener(
      "message",
      ({ data, origin }) => {
        if (origin === location.origin) {
          try {
            resolve(data);
          } catch (e) {
            reject(e);
          }
        }
        reject("invalid source origin");
      },
      {
        once: true,
      }
    )
  );

export const Login: FunctionComponent<{
  handleLogin: (client: VaultClient) => void;
  baseUrl: string;
  kvMount: string;
  loginMethods: string[];
  oidc?: OidcConfig;
}> = ({ handleLogin, baseUrl, kvMount, loginMethods, oidc }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<Error | null>(null);

  const mounts = {
    kv: kvMount,
    oidc: oidc?.mount_path ?? "/auth/oidc",
  };

  useEffect(() => {
    const savedToken = localStorage.getItem(LOCAL_STORAGE_KEY_TOKEN);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    const client = new VaultClient(baseUrl, mounts, savedToken);
    client
      .tokenLookupSelf()
      .then(() => {
        handleLogin(client);
      })
      .catch(logout)
      .then(() => setIsLoading(false));
  }, [baseUrl, mounts]);

  const handleTokenLogin = useCallback(
    (token: string) => {
      setLoginError(null);
      const client = new VaultClient(baseUrl, mounts, token);
      client
        .tokenLookupSelf()
        .then(() => {
          localStorage.setItem(LOCAL_STORAGE_KEY_TOKEN, token);
          handleLogin(client);
        })
        .catch((e) => setLoginError(e));
    },
    [handleLogin, baseUrl, mounts]
  );

  const handleOidcLogin = useCallback(
    (role?: string) => () => {
      setLoginError(null);
      const client = new VaultClient(baseUrl, mounts);
      client
        .oidcAuthURL(`${location.origin}/plugins/vault/callback`, role)
        .then(async ({ auth_url }) => {
          const resp = receiveMessage<{
            state: string;
            code: string;
          }>();
          const popup = window.open(auth_url, "vaultOIDCWindow");
          const params = await resp; // wait for popup to finish
          popup.close();

          const authedClient = await client.oidcCompleteFlow(params);
          handleLogin(authedClient);
        })
        .catch((e) => setLoginError(e.message || e.toString()));
    },
    [oidc, mounts]
  );

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {(loginMethods.includes("oidc") &&
        oidc?.roles &&
        Object.entries(oidc?.roles).map(([role, label]: [string, string]) => (
          <button
            class="btn btn-primary align-self-center"
            onClick={handleOidcLogin(role)}
          >
            Login using {label}
          </button>
        ))) ?? (
        <button
          class="btn btn-primary align-self-center"
          onClick={handleOidcLogin()}
        >
          Login using OIDC
        </button>
      )}{" "}
      {loginMethods.includes("token") && (
        <TokenLogin handleLogin={handleTokenLogin} />
      )}
      {loginError && (
        <pre class="alert alert-danger mt-3" role="alert">
          {displayError(loginError)}
        </pre>
      )}
    </>
  );
};
