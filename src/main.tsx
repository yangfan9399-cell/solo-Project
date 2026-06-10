import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { IndexPage } from './pages/IndexPage'
import { ClaimDetailPage } from './pages/ClaimDetailPage'
import { ReportPage } from './pages/ReportPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/claims/:id" element={<ClaimDetailPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
