import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import RequestList from '@/pages/RequestList'
import RequestNew from '@/pages/RequestNew'
import RequestDetail from '@/pages/RequestDetail'
import Kanban from '@/pages/Kanban'
import Overdue from '@/pages/Overdue'
import Libraries from '@/pages/Libraries'
import Exceptions from '@/pages/Exceptions'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<RequestList />} />
          <Route path="/requests/new" element={<RequestNew />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/overdue" element={<Overdue />} />
          <Route path="/libraries" element={<Libraries />} />
          <Route path="/exceptions" element={<Exceptions />} />
        </Route>
      </Routes>
    </Router>
  )
}
