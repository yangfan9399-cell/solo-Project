import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExceptionList from '@/components/ExceptionList';
import ExceptionDetail from '@/components/ExceptionDetail';
import ReviewPage from '@/components/ReviewPage';
import Sidebar from '@/components/Sidebar';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 ml-60 min-h-screen">
          <Routes>
            <Route path="/" element={<ExceptionList />} />
            <Route path="/detail/:id" element={<ExceptionDetail />} />
            <Route path="/review" element={<ReviewPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
