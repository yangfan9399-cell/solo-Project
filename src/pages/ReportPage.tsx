import { useLoaderData, Link } from 'react-router-dom'
import { ReportDashboard } from '@/components/report/ReportDashboard'

interface SupplierSummary {
  supplierId: number
  supplierName: string
  claimCount: number
  totalAmount: number
  avgAmount: number
}

interface CategorySummary {
  categoryId: number
  categoryName: string
  claimCount: number
  totalAmount: number
}

interface DefectTypeSummary {
  defectTypeId: number
  defectTypeName: string
  claimCount: number
  totalAmount: number
}

interface PeriodSummary {
  period: string
  claimCount: number
  totalAmount: number
}

interface DashboardStats {
  totalClaims: number
  totalAmount: number
  pendingCount: number
  underReviewCount: number
  completedCount: number
}

interface LoaderData {
  suppliers: SupplierSummary[]
  categories: CategorySummary[]
  defects: DefectTypeSummary[]
  periods: PeriodSummary[]
  stats: DashboardStats
}

export function ReportPage() {
  const { suppliers, categories, defects, periods, stats } = useLoaderData<LoaderData>()

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        返回索赔列表
      </Link>
      <div className="mb-6">
        <h2 className="text-xl font-bold">数据复盘</h2>
        <p className="text-gray-500 mt-1">按供应商、零件类别、缺陷类型和索赔周期聚合统计</p>
      </div>
      <ReportDashboard
        suppliers={suppliers}
        categories={categories}
        defects={defects}
        periods={periods}
        stats={stats}
      />
    </div>
  )
}
