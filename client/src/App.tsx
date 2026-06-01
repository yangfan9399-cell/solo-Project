import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import WaterQuality from './pages/WaterQuality';
import WaterQualityDetail from './pages/WaterQualityDetail';
import RepairReports from './pages/RepairReports';
import RepairReportDetail from './pages/RepairReportDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WaterStopNotices from './pages/WaterStopNotices';
import Notifications from './pages/Notifications';
import Locations from './pages/Locations';
import Users from './pages/Users';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/water-quality" element={<WaterQuality />} />
        <Route path="/water-quality/:id" element={<WaterQualityDetail />} />
        <Route path="/repair-reports" element={<RepairReports />} />
        <Route path="/repair-reports/:id" element={<RepairReportDetail />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="/water-stop-notices" element={<WaterStopNotices />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/users" element={<Users />} />
      </Route>
    </Routes>
  );
}
