import { FunctionComponent, h } from "preact";
import { useEffect, useState } from "preact/hooks";

import { vaultRequest } from "./client";

const Secret: FunctionComponent<{ key: string }> = ({ key }) => {
  return (
    <tr key={key}>
      <td>{key}</td>
      <td>User</td>
      <td>Password</td>
      <td class="text-end noprint">
        <div class="btn-group" role="group">
          <a class="btn btn-warning btn-sm" title="Edit Secret">
            <i class="mdi mdi-pencil"></i>
          </a>
          <a class="btn btn-danger btn-sm">
            <i class="mdi mdi-trash-can-outline" title="Delete Secret"></i>
          </a>
        </div>
      </td>
    </tr>
  );
};

interface SecretList {
  data: {
    keys: string[];
  };
}

export const List: FunctionComponent<{ token: string }> = ({ token }) => {
  const [secretList, updateSecretList] = useState<string[]>([]);

  useEffect(() => {
    vaultRequest<SecretList>(
      "/v1/secret/metadata/netbox/device/1/?list=true",
      token
    )
      .then((m) => updateSecretList(m.data.keys))
      .catch(() => updateSecretList([]));
  }, []);

  if (secretList.length === 0) {
    return <div class="text-muted">None</div>;
  }

  return (
    <table class="table table-hover">
      <tbody>
        {secretList.map((key) => (
          <Secret key={key} />
        ))}
      </tbody>
    </table>
  );
};
