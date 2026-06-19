import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import AnomalyQueue from "@/pages/AnomalyQueue"
import CalibrationDetail from "@/pages/CalibrationDetail"
import ThresholdRules from "@/pages/ThresholdRules"
import RetestRecords from "@/pages/RetestRecords"
import ReviewPanel from "@/pages/ReviewPanel"
import CloseAudit from "@/pages/CloseAudit"

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<AnomalyQueue />} />
          <Route path="/anomaly/:id" element={<CalibrationDetail />} />
          <Route path="/rules" element={<ThresholdRules />} />
          <Route path="/retests" element={<RetestRecords />} />
          <Route path="/review" element={<ReviewPanel />} />
          <Route path="/audit" element={<CloseAudit />} />
        </Routes>
      </Layout>
    </Router>
  )
}
