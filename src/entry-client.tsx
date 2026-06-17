import { render } from "solid-js/web";
import App from "./root";

const root = document.getElementById("app");

if (root) {
  render(() => <App />, root);
}
