// @refresh reload
import { hydrate, render } from "solid-js/web";
import App from "./root";

const root = document.getElementById("app");

if (root) {
  if (root.hasChildNodes()) {
    hydrate(() => <App />, root);
  } else {
    render(() => <App />, root);
  }
}
