import { FunctionComponent, h, render, Fragment } from "preact";
import { useState } from "preact/hooks";
import { VaultClient } from "./client";
import { EditForm } from "./edit";

import { List } from "./list";
import { Login, logout } from "./login";

const App: FunctionComponent<{}> = (props) => {
  const [client, setClient] = useState<VaultClient | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const entityPath = "device/1";

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
            <List path={entityPath} client={client} handleEdit={setEditingId} />
            {editingId && (
              <EditForm
                path={entityPath}
                id={editingId}
                client={client}
                handleClose={() => setEditingId(null)}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

// following is render boilerplate

const container = document.getElementById("netbox-vault-app-container");
container.innerHTML = "";

let root;
function init() {
  root = render(<App />, container, root);
}

// @ts-ignore
if (import.meta.webpackHot) {
  console.log("found support for HMR");
  // @ts-ignore
  import.meta.webpackHot.accept("./app.tsx", () => {
    console.log("reloading...");
    requestAnimationFrame(init);
  });
  // @ts-ignore
  import.meta.webpackHot.accept();
}

init();
