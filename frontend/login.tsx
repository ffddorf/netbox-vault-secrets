import { FunctionComponent, h, Fragment } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { displayError, OauthFlowParams, VaultClient } from "./client";
import { Modal } from "./modal";

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

const checkLoop = async (checker: () => boolean, timeout: number) => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, timeout));
    if (checker()) {
      return;
    }
  }
};

const POPUP_CHECK_INTERVAL = 500; // ms
const startOauthFlow = async <T,>(url: string): Promise<T | undefined> => {
  const respPromise = receiveMessage<T>();
  const popup = window.open(url, "vaultOIDCWindow");
  const closePromise = new Promise<undefined>((_, reject) =>
    checkLoop(() => {
      if (popup.closed) {
        reject(new Error("Window closed without completing OAuth flow."));
        return true;
      }
      return false;
    }, POPUP_CHECK_INTERVAL)
  );
  // wait for popup to finish
  const params = await Promise.race([respPromise, closePromise]);
  popup.close();

  return params;
};

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
    const unauthClient = new VaultClient(baseUrl, mounts);
    unauthClient
      .loadAuthData()
      .then((client) => {
        if (client) {
          handleLogin(client);
        }
      })
      .catch(() => {})
      .then(() => setIsLoading(false));
  }, [baseUrl, mounts]);

  const handleTokenLogin = useCallback(
    (token: string) => {
      setLoginError(null);
      const client = new VaultClient(baseUrl, mounts, token);
      client
        .tokenLookupSelf()
        .then(() => client.storeAuthData())
        .then(() => handleLogin(client))
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
          const params = await startOauthFlow<OauthFlowParams>(auth_url);
          if (params) {
            const authedClient = await client.oidcCompleteFlow(params);
            authedClient.storeAuthData().then(() => handleLogin(authedClient));
          }
          setLoginError(new Error("OAuth flow did not complete."));
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
