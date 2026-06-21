import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import TicketList from "@/pages/TicketList";
import CreateTicket from "@/pages/CreateTicket";
import ReviewDesk from "@/pages/ReviewDesk";
import TicketDetail from "@/pages/TicketDetail";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<TicketList />} />
            <Route path="/create" element={<CreateTicket />} />
            <Route path="/create/:id" element={<CreateTicket />} />
            <Route path="/review" element={<ReviewDesk />} />
            <Route path="/ticket/:id" element={<TicketDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
