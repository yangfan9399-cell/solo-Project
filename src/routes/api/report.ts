import { createFileRoute } from '@tanstack/start'
import { getSupplierSummary, getCategorySummary, getDefectTypeSummary, getPeriodSummary, getDashboardStats } from '@/api/report'

export const Route = createFileRoute('/api/report')({
  async loader() {
    const [suppliers, categories, defects, periods, stats] = await Promise.all([
      getSupplierSummary(),
      getCategorySummary(),
      getDefectTypeSummary(),
      getPeriodSummary(),
      getDashboardStats()
    ])
    return { suppliers, categories, defects, periods, stats }
  }
})
