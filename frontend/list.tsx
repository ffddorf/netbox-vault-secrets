import { FunctionComponent, h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { SecretData, SecretMetadata, VaultClient } from "./client";
import { infoFromMeta, SecretInfo } from "./common";

const icon = (isRevealed: boolean) =>
  isRevealed ? "mdi-lock-open" : "mdi-lock";
const buttonClass = (color: string) => `btn ${color} btn-sm`;
const buttonColor = (isRevealed: boolean) =>
  isRevealed ? "btn-danger" : "btn-success";

const Secret: FunctionComponent<{
  meta: SecretInfo;
  getSecret: () => Promise<SecretData>;
  handleEdit: () => void;
}> = ({ meta, getSecret, handleEdit }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const revealSecret = useCallback(() => {
    setIsRevealed(!isRevealed);
    if (!isRevealed && !value) {
      getSecret().then((data) => setValue(data.data.password || null));
    }
  }, [getSecret, isRevealed, value]);

  return (
    <tr>
      <td>{meta.label}</td>
      <td>{meta.username}</td>
      <td class={isRevealed ? "" : "text-muted"}>
        {isRevealed && value ? value : "***********"}
      </td>
      <td class="text-end noprint">
        <a
          class={buttonClass(buttonColor(isRevealed))}
          title="Reveal Secret"
          onClick={revealSecret}
        >
          <i class={`mdi ${icon(isRevealed)}`}></i>
        </a>{" "}
        <a
          class={buttonClass("btn-warning")}
          title="Edit Secret"
          onClick={handleEdit}
        >
          <i class="mdi mdi-pencil"></i>
        </a>{" "}
        <a class={buttonClass("btn-danger")} title="Delete Secret">
          <i class="mdi mdi-trash-can-outline"></i>
        </a>
      </td>
    </tr>
  );
};

const batch = (list: string[], batchSize: number): string[][] => {
  const result = [];
  for (let i = 0; i < list.length / batchSize; i++) {
    result.push(list.slice(i, i + batchSize));
  }
  return result;
};

const gatherSecrets = async (client: VaultClient, path: string) => {
      const { keys } = await client.listSecrets(`netbox/${path}`);
      const results: SecretMetadata[] = [];
      // fetch batches of 5
      for (const set of batch(keys, 5)) {
        const items = await Promise.all(
          set.map((key) => client.secretMetadata(`netbox/${path}/${key}`))
        );
        results.push(...items);
      }
      const secretList: SecretInfo[] = results.map((meta, i) =>
        infoFromMeta(keys[i], meta)
      );
  return secretList;
  };

export const List: FunctionComponent<{
  path: string;
  client: VaultClient | null;
  handleEdit: (id: string) => void;
}> = ({ client, path, handleEdit }) => {
  const [secretList, updateSecretList] = useState<SecretInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      gatherSecrets(client, path)
        .then((list) => {
          updateSecretList(list);
          setError(null);
        })
        .catch((e) => {
          updateSecretList([]);
          setError(e.message || e.toString());
        });
    }
  }, [client, path]);

  if (secretList.length === 0) {
    return <div class="text-muted">None</div>;
  }

  if (error) {
    return (
      <div class="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <table class="table table-hover">
      <tbody>
        {secretList.map((secret) => (
          <Secret
            key={secret.id}
            meta={secret}
            getSecret={() => client.secretData(`netbox/${path}/${secret.id}`)}
            handleEdit={() => handleEdit(secret.id)}
          />
        ))}
      </tbody>
    </table>
  );
};
