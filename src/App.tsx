import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import ImpactDetail from "@/pages/ImpactDetail";
import BlockersDetail from "@/pages/BlockersDetail";
import RollbackDraft from "@/pages/RollbackDraft";
import AuditLog from "@/pages/AuditLog";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/impact/:packageId" element={<ImpactDetail />} />
          <Route path="/blockers/:packageId" element={<BlockersDetail />} />
          <Route path="/rollback/:packageId" element={<RollbackDraft />} />
          <Route path="/audit" element={<AuditLog />} />
        </Routes>
      </Layout>
    </Router>
  );
}
