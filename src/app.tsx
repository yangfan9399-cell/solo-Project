import { HashRouter, Route } from "@solidjs/router";
import { Suspense, lazy } from "solid-js";
import "./app.css";
import Layout from "./components/Layout";

const ProjectLedger = lazy(() => import("./routes/index"));
const ProjectDetail = lazy(() => import("./routes/project/[id]"));
const ReviewWorkbench = lazy(() => import("./routes/review/index"));
const AnomaliesPage = lazy(() => import("./routes/anomalies/index"));
const MileagePage = lazy(() => import("./routes/mileage/[id]"));
const HistoryPage = lazy(() => import("./routes/history/[id]"));
const ExportPage = lazy(() => import("./routes/export/[id]"));

export default function App() {
  return (
    <HashRouter root={(props) => (
      <Layout>
        <Suspense fallback={
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        }>
          {props.children}
        </Suspense>
      </Layout>
    )}>
      <Route path="/" component={ProjectLedger} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/review" component={ReviewWorkbench} />
      <Route path="/anomalies" component={AnomaliesPage} />
      <Route path="/mileage/:id" component={MileagePage} />
      <Route path="/history/:id" component={HistoryPage} />
      <Route path="/export/:id" component={ExportPage} />
    </HashRouter>
  );
}
