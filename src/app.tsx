import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "./app.css";
import Layout from "~/components/Layout";

export default function App() {
  return (
    <Router
      root={props => (
        <Layout>
          <Suspense>{props.children}</Suspense>
        </Layout>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
