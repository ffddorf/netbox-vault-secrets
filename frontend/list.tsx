import { FunctionComponent, h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

import { SecretMetadata, VaultClient } from "./client";

const Secret: FunctionComponent<{ secret: SecretInfo }> = ({ secret }) => {
  return (
    <tr>
      <td>{secret.label}</td>
      <td>{secret.username}</td>
      <td>**************</td>
      <td class="text-end noprint">
        <div class="btn-group" role="group">
          <a class="btn btn-primary btn-sm" title="Reveal Secret">
            <i class="mdi mdi-eye"></i>
          </a>
          <a class="btn btn-warning btn-sm" title="Edit Secret">
            <i class="mdi mdi-pencil"></i>
          </a>
          <a class="btn btn-danger btn-sm" title="Delete Secret">
            <i class="mdi mdi-trash-can-outline"></i>
          </a>
        </div>
      </td>
    </tr>
  );
};

interface SecretInfo {
  id: string;
  label: string;
  username: string;
}

const batch = (list: string[], batchSize: number): string[][] => {
  const result = [];
  for (let i = 0; i < list.length / batchSize; i++) {
    result.push(list.slice(i, i + batchSize));
  }
  return result;
};

const gatherSecrets =
  (client: VaultClient, updateSecretList: (list: SecretInfo[]) => void) =>
  async (id: string) => {
    try {
      const { keys } = await client.listSecrets(`netbox/device/${id}`);
      const results: SecretMetadata[] = [];
      // fetch batches of 5
      for (const set of batch(keys, 5)) {
        const items = await Promise.all(
          set.map((key) => client.secretMetadata(`netbox/device/${id}/${key}`))
        );
        results.push(...items);
      }
      const secretList: SecretInfo[] = results.map((meta, i) => ({
        id: keys[i],
        label: meta.custom_metadata.label || keys[i],
        username: meta.custom_metadata.username || "",
      }));
      updateSecretList(secretList);
    } catch (e) {
      console.error(e);
      updateSecretList([]);
    }
  };

export const List: FunctionComponent<{ client: VaultClient | null }> = ({
  client,
}) => {
  const [secretList, updateSecretList] = useState<SecretInfo[]>([]);

  const fetchSecrets = useMemo(
    () => (client ? gatherSecrets(client, updateSecretList) : null),
    [client]
  );
  useEffect(() => {
    if (fetchSecrets) {
      fetchSecrets("1");
    }
  }, [fetchSecrets]);

  if (secretList.length === 0) {
    return <div class="text-muted">None</div>;
  }

  return (
    <table class="table table-hover">
      <tbody>
        {secretList.map((secret) => (
          <Secret key={secret.id} secret={secret} />
        ))}
      </tbody>
    </table>
  );
};
