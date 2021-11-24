import { FunctionComponent, h, render, Fragment } from "preact";
import { useState } from "preact/hooks";

import { List } from "./list";
import { Login } from "./login";

const App: FunctionComponent<{}> = (props) => {
  const [token, setToken] = useState<string | null>(null);

  if (token === null) {
    return <Login handleLogin={(token) => setToken(token)} />;
  }

  return <List token={token} />;
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
