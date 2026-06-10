import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { TrendingUp, Users, Package, AlertCircle, DollarSign, CheckCircle } from 'lucide-react'
import { SupplierSummary, CategorySummary, DefectTypeSummary, PeriodSummary, DashboardStats } from '@/api/report'

interface ReportDashboardProps {
  suppliers: SupplierSummary[]
  categories: CategorySummary[]
  defects: DefectTypeSummary[]
  periods: PeriodSummary[]
  stats: DashboardStats
}

export function ReportDashboard({ suppliers, categories, defects, periods, stats }: ReportDashboardProps) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
  }

  const maxSupplierAmount = Math.max(...suppliers.map(s => s.totalAmount))
  const maxCategoryAmount = Math.max(...categories.map(c => c.totalAmount))
  const maxDefectAmount = Math.max(...defects.map(d => d.totalAmount))

  const statsCards = [
    { label: '总索赔数', value: stats.totalClaims, icon: AlertCircle, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: '总索赔金额', value: `¥${formatAmount(stats.totalAmount)}`, icon: DollarSign, color: 'text-danger', bgColor: 'bg-danger/10' },
    { label: '待处理', value: stats.pendingCount, icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10' },
    { label: '复核中', value: stats.underReviewCount, icon: TrendingUp, color: 'text-accent', bgColor: 'bg-accent/10' },
    { label: '已完成', value: stats.completedCount, icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">按供应商统计</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.supplierId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{supplier.supplierName}</span>
                    <span className="text-sm text-secondary">
                      {supplier.claimCount}次 / ¥{formatAmount(supplier.totalAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(supplier.totalAmount / maxSupplierAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">按零件类别统计</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.categoryId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{category.categoryName}</span>
                    <span className="text-sm text-secondary">
                      {category.claimCount}次 / ¥{formatAmount(category.totalAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-info h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(category.totalAmount / maxCategoryAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">按缺陷类型统计</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defects.map((defect) => (
                <div key={defect.defectTypeId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{defect.defectTypeName}</span>
                    <span className="text-sm text-secondary">
                      {defect.claimCount}次 / ¥{formatAmount(defect.totalAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-warning h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(defect.totalAmount / maxDefectAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">按索赔周期统计</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-48 gap-2">
              {periods.map((period) => {
                const maxPeriodAmount = Math.max(...periods.map(p => p.totalAmount))
                const height = maxPeriodAmount > 0 ? (period.totalAmount / maxPeriodAmount) * 100 : 0
                return (
                  <div key={period.period} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-secondary mb-1">{period.claimCount}次</span>
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all duration-500 relative group"
                      style={{ height: `${height}%`, minHeight: '20px' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ¥{formatAmount(period.totalAmount)}
                      </div>
                    </div>
                    <span className="text-xs text-secondary mt-1">{period.period}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
