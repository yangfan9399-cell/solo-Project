import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Loading from './components/common/Loading';
import NotificationContainer from './components/common/NotificationContainer';
import Layout from './components/layout/Layout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EquipmentListPage = lazy(() => import('./pages/equipments/EquipmentListPage'));
const EquipmentDetailPage = lazy(() => import('./pages/equipments/EquipmentDetailPage'));
const TaskListPage = lazy(() => import('./pages/tasks/TaskListPage'));
const TaskDetailPage = lazy(() => import('./pages/tasks/TaskDetailPage'));
const ReservationListPage = lazy(() => import('./pages/reservations/ReservationListPage'));
const ReservationDetailPage = lazy(() => import('./pages/reservations/ReservationDetailPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const MediaCardListPage = lazy(() => import('./pages/mediaCards/MediaCardListPage'));
const DamageReportListPage = lazy(() => import('./pages/damageReports/DamageReportListPage'));
const DamageReportDetailPage = lazy(() => import('./pages/damageReports/DamageReportDetailPage'));
const OverdueReminderListPage = lazy(() => import('./pages/OverdueReminderListPage'));
const UserListPage = lazy(() => import('./pages/UserListPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = React.useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    init();
  }, [checkAuth]);

  if (isChecking) {
    return <Loading fullPage text="加载中..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <>
      <NotificationContainer />
      <Suspense fallback={<Loading fullPage text="加载中..." />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="equipments" element={<EquipmentListPage />} />
            <Route path="equipments/:id" element={<EquipmentDetailPage />} />
            <Route path="tasks" element={<TaskListPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="reservations" element={<ReservationListPage />} />
            <Route path="reservations/:id" element={<ReservationDetailPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="media-cards" element={<MediaCardListPage />} />
            <Route path="damage-reports" element={<DamageReportListPage />} />
            <Route path="damage-reports/:id" element={<DamageReportDetailPage />} />
            <Route path="overdue-reminders" element={<OverdueReminderListPage />} />
            <Route path="users" element={<UserListPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
