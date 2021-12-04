import { h, render } from "preact";
import { App, InitData } from "./app";

const container = document.getElementById("netbox-vault-app-container");
container.innerHTML = "";

const dataTag = document.getElementById("vault-data");
const initData: InitData = JSON.parse(dataTag.textContent);

let root;
function init() {
  root = render(h(App, { initData }), container, root);
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
