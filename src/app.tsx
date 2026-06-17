import { Router, Route } from "@solidjs/router";
import { Suspense } from "solid-js";
import "./app.css";
import Layout from "~/components/Layout";

import Dashboard from "~/routes";
import Ledger from "~/routes/ledger";
import MapView from "~/routes/map";
import Inspections from "~/routes/inspections";
import Versions from "~/routes/versions";
import Exports from "~/routes/exports";
import Detail from "~/routes/detail/[type]/[id]";

export default function App() {
  return (
    <Router
      root={props => (
        <Layout>
          <Suspense>{props.children}</Suspense>
        </Layout>
      )}
    >
      <Route path="/" component={Dashboard} />
      <Route path="/ledger" component={Ledger} />
      <Route path="/map" component={MapView} />
      <Route path="/inspections" component={Inspections} />
      <Route path="/versions" component={Versions} />
      <Route path="/exports" component={Exports} />
      <Route path="/detail/:type/:id" component={Detail} />
    </Router>
  );
}
