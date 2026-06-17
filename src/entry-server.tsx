import { renderToString } from "solid-js/web";
import App from "./root";

export default function handleServerRequest() {
  const html = renderToString(() => <App />);
  return new Response(html, {
    headers: { "content-type": "text/html" },
  });
}
