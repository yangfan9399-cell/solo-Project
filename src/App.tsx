import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { useAppStore } from '@/store';

export default function App() {
  const initializeStore = useAppStore((s) => s.initializeStore);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
