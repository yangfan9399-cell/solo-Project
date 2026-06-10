import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
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

export function ReportPage() {
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([])
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [defects, setDefects] = useState<DefectTypeSummary[]>([])
  const [periods, setPeriods] = useState<PeriodSummary[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/report/suppliers').then(res => res.json()),
      fetch('/api/report/categories').then(res => res.json()),
      fetch('/api/report/defects').then(res => res.json()),
      fetch('/api/report/periods').then(res => res.json()),
      fetch('/api/report/stats').then(res => res.json()),
    ])
    .then(([supplierData, categoryData, defectData, periodData, statsData]) => {
      setSuppliers(supplierData)
      setCategories(categoryData)
      setDefects(defectData)
      setPeriods(periodData)
      setStats(statsData)
      setLoading(false)
    })
    .catch(err => {
      console.error('Failed to fetch report data:', err)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">加载中...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-secondary hover:text-primary transition-colors mb-4"
      >
        返回索赔列表
      </Link>
      <div className="mb-6">
        <h2 className="text-xl font-bold">数据复盘</h2>
        <p className="text-secondary mt-1">按供应商、零件类别、缺陷类型和索赔周期聚合统计</p>
      </div>
      <ReportDashboard
        suppliers={suppliers}
        categories={categories}
        defects={defects}
        periods={periods}
        stats={stats || { totalClaims: 0, totalAmount: 0, pendingCount: 0, underReviewCount: 0, completedCount: 0 }}
      />
    </Layout>
  )
}
