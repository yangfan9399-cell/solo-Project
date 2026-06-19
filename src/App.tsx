import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BatchesListPage from "@/pages/BatchesListPage";
import SubmitReadingPage from "@/pages/SubmitReadingPage";
import ConsultationPage from "@/pages/ConsultationPage";
import HistoryPage from "@/pages/HistoryPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BatchesListPage />} />
        <Route path="/batch/:id" element={<ConsultationPage />} />
        <Route path="/submit/:id" element={<SubmitReadingPage />} />
        <Route path="/history/:id" element={<HistoryPage />} />
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#E8DDC9] flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4" style={{ fontFamily: 'serif' }}>404</p>
              <p className="text-[#5A4A34]">页面未找到</p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
