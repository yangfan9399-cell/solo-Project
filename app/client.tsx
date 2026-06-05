import { StartClient } from "@tanstack/start";
import { createRouter } from "./router";
import React from "react";
import ReactDOM from "react-dom/client";

const router = createRouter();

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <StartClient router={router} />
  </React.StrictMode>
);
