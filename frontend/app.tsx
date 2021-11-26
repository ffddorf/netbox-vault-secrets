import { FunctionComponent, h, render, Fragment } from "preact";
import { useState } from "preact/hooks";
import { VaultClient } from "./client";

import { List } from "./list";
import { Login, logout } from "./login";

const App: FunctionComponent<{}> = (props) => {
  const [client, setClient] = useState<VaultClient | null>(null);

  return (
    <>
      <div class="card-header d-flex">
        <h5>Secrets</h5>
        {client !== null && (
          <a
            class="btn btn-outline-secondary"
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
          <List path={"device/1"} client={client} />
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
