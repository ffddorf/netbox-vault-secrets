import { FunctionComponent, h, render, Fragment } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { NotFoundError, SecretMetadata, VaultClient } from "./client";
import { infoFromMeta, SecretInfo } from "./common";
import { ConfirmDelete } from "./dialogue";
import { EditForm } from "./edit";
import { List } from "./list";
import { Login, logout } from "./login";

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
}

export const App: FunctionComponent<{ initData: InitData }> = ({
  initData,
}) => {
  const [client, setClient] = useState<VaultClient | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingSecret, setDeletingSecret] = useState<SecretInfo | null>(null);
  const [secretList, updateSecretList] = useState<SecretInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      gatherSecrets(client, initData.objectPath)
        .then((list) => {
          updateSecretList(list);
          setError(null);
        })
        .catch((e) => {
          updateSecretList([]);
          setError(e.message || e.toString());
        });
    }
  }, [client]);

  const reload = useCallback(
    async (id: string) => {
      const meta = await client.secretMetadata(`${initData.objectPath}/${id}`);
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
    [client, secretList]
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
    await client.secretDelete(`${initData.objectPath}/${deletingSecret.id}`);

    // remove from list
    const index = secretList.findIndex((s) => s.id === deletingSecret.id);
    if (index !== -1) {
      updateSecretList([
        ...secretList.slice(0, index),
        ...secretList.slice(index + 1),
      ]);
    }

    setDeletingSecret(null);
  }, [client, deletingSecret]);

  if (error) {
    return (
      <div class="alert alert-danger" role="alert">
        Unable to load secrets: {error}
      </div>
    );
  }

  return (
    <>
      <div class="card-header d-flex">
        <h5>Secrets</h5>
        {client !== null && (
          <a
            class="btn btn-outline-secondary btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              logout();
              setClient(null);
            }}
          >
            Logout
          </a>
        )}
      </div>
      <div class="card-body">
        {client === null ? (
          <Login handleLogin={setClient} />
        ) : (
          <>
            <List
              secretList={secretList}
              getSecret={(id) =>
                client.secretData(`${initData.objectPath}/${id}`)
              }
              handleEdit={setEditingId}
              handleDelete={setDeletingSecret}
            />
            {editingId !== null && (
              <EditForm
                path={initData.objectPath}
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
        )}
      </div>
      <div class="card-footer text-end noprint">
        <button class="btn btn-sm btn-primary" onClick={() => setEditingId("")}>
          <span class="mdi mdi-plus-thick" aria-hidden="true" /> Create Secret
        </button>
      </div>
    </>
  );
};
