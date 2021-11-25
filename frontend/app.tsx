import { FunctionComponent, h, render, Fragment } from "preact";
import { useState } from "preact/hooks";
import { VaultClient } from "./client";

import { List } from "./list";
import { Login } from "./login";

const App: FunctionComponent<{}> = (props) => {
  const [client, setClient] = useState<VaultClient | null>(null);

  if (client === null) {
    return <Login handleLogin={setClient} />;
  }

  return <List path={"device/1"} client={client} />;
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
