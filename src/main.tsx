import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'

const routeConfig = {
  '/': import('./routes/index'),
  '/claims/$id': import('./routes/claims/$id'),
  '/report': import('./routes/report'),
  '/api/claims': import('./routes/api/claims'),
  '/api/claims/$id': import('./routes/api/claims/$id'),
  '/api/report': import('./routes/api/report'),
}

const router = createRouter({
  routeConfig
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
