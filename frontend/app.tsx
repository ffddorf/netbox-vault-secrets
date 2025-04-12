import { FunctionComponent, h, Fragment, ComponentChildren } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import {
  displayError,
  NotFoundError,
  SecretMetadata,
  trimPath,
  VaultClient,
} from "./client";
import { infoFromMeta, SecretInfo } from "./common";
import { ConfirmDelete } from "./dialogue";
import { EditForm } from "./edit";
import { List } from "./list";
import { Login, OidcConfig } from "./login";

const batch = (list: string[], batchSize: number): string[][] => {
  const result = [];
  for (let i = 0; i < list.length / batchSize; i++) {
    result.push(list.slice(i, i + batchSize));
  }
  return result;
};

const gatherSecrets = async (client: VaultClient, path: string) => {
  let keys = [];
  try {
    const meta = await client.listSecrets(path);
    keys = meta.keys;
  } catch (e) {
    if (e instanceof NotFoundError) {
      return [];
    }
    throw e;
  }

  const results: SecretMetadata[] = [];
  // fetch batches of 5
  for (const set of batch(keys, 5)) {
    const items = await Promise.all(
      set.map((key) => client.secretMetadata(`${path}/${key}`))
    );
    results.push(...items);
  }
  const secretList: SecretInfo[] = results.map((meta, i) =>
    infoFromMeta(keys[i], meta)
  );
  return secretList;
};

export interface InitData {
  objectPath: string;
  config: {
    api_url: string;
    kv_mount_path?: string;
    secret_path_prefix?: string;
    login_methods?: string[];
    oidc?: OidcConfig;
  };
}

const Card: FunctionComponent<{
  footer?: ComponentChildren;
  onLogout?: () => void;
}> = ({ children, onLogout, footer }) => {
  return (
    <>
      <div class="card-header d-flex">
        <h5>Secrets</h5>
        {onLogout && (
          <a
            class="btn btn-outline-secondary btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={onLogout}
          >
            Logout
          </a>
        )}
      </div>
      <div class="card-body">{children}</div>
      {footer && <div class="card-footer text-end noprint">{footer}</div>}
    </>
  );
};

export const App: FunctionComponent<{ initData: InitData }> = ({
  initData: { config, objectPath },
}) => {
  const [client, setClient] = useState<VaultClient | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingSecret, setDeletingSecret] = useState<SecretInfo | null>(null);
  const [secretList, updateSecretList] = useState<SecretInfo[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const secretsBasePath = `${trimPath(
    config.secret_path_prefix ?? "netbox"
  )}/${objectPath}`;

  useEffect(() => {
    if (client) {
      gatherSecrets(client, secretsBasePath)
        .then((list) => {
          updateSecretList(list);
          setError(null);
        })
        .catch((e) => {
          updateSecretList([]);
          setError(e);
        });
    }
  }, [client, secretsBasePath]);

  const reload = useCallback(
    async (id: string) => {
      const meta = await client.secretMetadata(`${secretsBasePath}/${id}`);
      const info = infoFromMeta(id, meta);
      const index = secretList.findIndex((item) => item.id === id);
      if (index === -1) {
        updateSecretList([...secretList, info]);
      } else {
        updateSecretList([
          ...secretList.slice(0, index),
          info,
          ...secretList.slice(index + 1),
        ]);
      }
    },
    [client, secretList, secretsBasePath]
  );

  const editEnd = useCallback(
    async (id?: string) => {
      const reloadId = id ?? editingId;
      if (reloadId) {
        await reload(reloadId);
      }
      setEditingId(null);
    },
    [editingId]
  );

  const deleteConfirm = useCallback(async () => {
    await client.secretDelete(`${secretsBasePath}/${deletingSecret.id}`);

    // remove from list
    const index = secretList.findIndex((s) => s.id === deletingSecret.id);
    if (index !== -1) {
      updateSecretList([
        ...secretList.slice(0, index),
        ...secretList.slice(index + 1),
      ]);
    }

    setDeletingSecret(null);
  }, [client, deletingSecret, secretsBasePath]);

  if (error) {
    return (
      <Card>
        <div class="alert alert-danger" role="alert">
          Unable to load secrets:
          {displayError(error)}
        </div>
      </Card>
    );
  }

  if (client === null) {
    return (
      <Card>
        <Login
          handleLogin={setClient}
          baseUrl={config.api_url}
          kvMount={config.kv_mount_path ?? "/secret"}
          loginMethods={config.login_methods ?? ["token"]}
          oidc={config.oidc}
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        onLogout={() => {
          client.forgetAuthData();
          setClient(null);
        }}
        footer={
          <button
            class="btn btn-sm btn-primary"
            onClick={() => setEditingId("")}
          >
            <span class="mdi mdi-plus-thick" aria-hidden="true" /> Create Secret
          </button>
        }
      >
        <List
          secretList={secretList}
          getSecret={(id) => client.secretData(`${secretsBasePath}/${id}`)}
          handleEdit={setEditingId}
          handleDelete={setDeletingSecret}
          handleCopy={(secret) => {
            navigator.clipboard.writeText(secret.password);
          }}
        />
      </Card>
      {editingId !== null && (
        <EditForm
          path={secretsBasePath}
          id={editingId}
          client={client}
          handleClose={editEnd}
        />
      )}
      {deletingSecret && (
        <ConfirmDelete
          secretLabel={deletingSecret.label}
          handleConfirm={deleteConfirm}
          handleCancel={() => setDeletingSecret(null)}
        />
      )}
    </>
  );
};
