import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import ThresholdMatrix from "@/pages/ThresholdMatrix";
import ImpactSamples from "@/pages/ImpactSamples";
import Approvals from "@/pages/Approvals";
import History from "@/pages/History";

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/" element={<ThresholdMatrix />} />
            <Route path="/impact" element={<ImpactSamples />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
