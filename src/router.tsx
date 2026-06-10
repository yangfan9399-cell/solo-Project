import { createRouter, RouteConfig } from '@tanstack/react-router'
import { DefaultLayout } from '@/components/layout/Layout'
import { IndexPage } from '@/pages/IndexPage'
import { ClaimDetailPage } from '@/pages/ClaimDetailPage'
import { ReportPage } from '@/pages/ReportPage'
import { getClaims, getClaimById } from '@/api/claims'
import { getSupplierSummary, getCategorySummary, getDefectTypeSummary, getPeriodSummary, getDashboardStats } from '@/api/report'

const routeConfig: RouteConfig[] = [
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <IndexPage />,
        loader: async () => {
          const claims = await getClaims()
          return { claims }
        },
      },
      {
        path: '/claims/$id',
        element: <ClaimDetailPage />,
        loader: async ({ params }) => {
          const claim = await getClaimById(Number(params.id))
          return { claim }
        },
      },
      {
        path: '/report',
        element: <ReportPage />,
        loader: async () => {
          const [suppliers, categories, defects, periods, stats] = await Promise.all([
            getSupplierSummary(),
            getCategorySummary(),
            getDefectTypeSummary(),
            getPeriodSummary(),
            getDashboardStats(),
          ])
          return { suppliers, categories, defects, periods, stats }
        },
      },
    ],
  },
]

export const router = createRouter({ routeConfig })

export function getRouter() {
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
