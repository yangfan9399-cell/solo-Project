import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { DefaultLayout } from '@/components/layout/Layout'
import { IndexPage } from '@/pages/IndexPage'
import { ClaimDetailPage } from '@/pages/ClaimDetailPage'
import { ReportPage } from '@/pages/ReportPage'

const router = createBrowserRouter([
  {
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <IndexPage />,
        loader: async () => {
          const response = await fetch('/api/claims')
          const claims = await response.json()
          return { claims }
        },
      },
      {
        path: '/claims/:id',
        element: <ClaimDetailPage />,
        loader: async ({ params }) => {
          const response = await fetch(`/api/claims/${params.id}`)
          const claim = await response.json()
          return { claim }
        },
      },
      {
        path: '/report',
        element: <ReportPage />,
        loader: async () => {
          const [suppliers, categories, defects, periods, stats] = await Promise.all([
            fetch('/api/report/suppliers').then(r => r.json()),
            fetch('/api/report/categories').then(r => r.json()),
            fetch('/api/report/defects').then(r => r.json()),
            fetch('/api/report/periods').then(r => r.json()),
            fetch('/api/report/stats').then(r => r.json()),
          ])
          return { suppliers, categories, defects, periods, stats }
        },
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
