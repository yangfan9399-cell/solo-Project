// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

export default function App() {
  return <StartClient />;
}

mount(() => <StartClient />, document.getElementById("app")!);
