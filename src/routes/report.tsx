import { createFileRoute } from '@tanstack/start'
import { Layout } from '@/components/layout/Layout'
import { ReportDashboard } from '@/components/report/ReportDashboard'

export const Route = createFileRoute('/report')({
  async loader() {
    const response = await fetch('/api/report')
    const { suppliers, categories, defects, periods, stats } = await response.json()
    return { suppliers, categories, defects, periods, stats }
  },
  component: ReportPage
})

function ReportPage() {
  const { suppliers, categories, defects, periods, stats } = Route.useLoaderData()

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold">数据复盘</h2>
        <p className="text-secondary mt-1">按供应商、零件类别、缺陷类型和索赔周期聚合统计</p>
      </div>
      <ReportDashboard
        suppliers={suppliers}
        categories={categories}
        defects={defects}
        periods={periods}
        stats={stats}
      />
    </Layout>
  )
}
