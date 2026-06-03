import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import MainLayout from './components/layout/MainLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PetsPage from './pages/pets/PetsPage.jsx'
import PetDetailPage from './pages/pets/PetDetailPage.jsx'
import OwnersPage from './pages/owners/OwnersPage.jsx'
import OwnerDetailPage from './pages/owners/OwnerDetailPage.jsx'
import VaccinesPage from './pages/vaccines/VaccinesPage.jsx'
import VaccineBatchesPage from './pages/vaccines/VaccineBatchesPage.jsx'
import AppointmentsPage from './pages/appointments/AppointmentsPage.jsx'
import AppointmentCalendarPage from './pages/appointments/AppointmentCalendarPage.jsx'
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage.jsx'
import CheckinsPage from './pages/checkins/CheckinsPage.jsx'
import RevisitRemindersPage from './pages/revisit/RevisitRemindersPage.jsx'
import AdverseReactionsPage from './pages/reactions/AdverseReactionsPage.jsx'
import FollowUpsPage from './pages/followups/FollowUpsPage.jsx'

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pets" element={<PetsPage />} />
          <Route path="pets/:id" element={<PetDetailPage />} />
          <Route path="owners" element={<OwnersPage />} />
          <Route path="owners/:id" element={<OwnerDetailPage />} />
          <Route path="vaccines" element={<VaccinesPage />} />
          <Route path="vaccine-batches" element={<VaccineBatchesPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/calendar" element={<AppointmentCalendarPage />} />
          <Route path="appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="checkins" element={<CheckinsPage />} />
          <Route path="revisit-reminders" element={<RevisitRemindersPage />} />
          <Route path="adverse-reactions" element={<AdverseReactionsPage />} />
          <Route path="follow-ups" element={<FollowUpsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

export default App
