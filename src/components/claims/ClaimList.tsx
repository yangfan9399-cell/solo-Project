import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClaimItem {
  id: number
  batchNumber: string | null
  partNumber: string | null
  partName: string | null
  categoryName: string | null
  supplierName: string | null
  defectType: string | null
  quantityDefective: number
  claimAmount: string
  description: string | null
  status: string
  batchTraceable: boolean | null
  repairDeadline: string | null
  repairCompleted: boolean | null
  engineerName: string | null
  createdAt: string | null
}

interface ClaimListProps {
  claims: ClaimItem[]
}

export function ClaimList({ claims }: ClaimListProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN')
  }

  const formatAmount = (amount: string) => {
    return Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <Card key={claim.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <a
                    href={`/claims/${claim.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    索赔 #{claim.id}
                  </a>
                  <StatusBadge status={claim.status} />
                  {claim.batchTraceable === false && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">
                      <AlertTriangle className="h-3 w-3" />
                      追溯失败
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-secondary">零件：</span>
                    <span className="font-medium">{claim.partName}</span>
                    <span className="text-secondary ml-1">({claim.partNumber})</span>
                  </div>
                  <div>
                    <span className="text-secondary">批次：</span>
                    <span className="font-medium">{claim.batchNumber}</span>
                  </div>
                  <div>
                    <span className="text-secondary">供应商：</span>
                    <span className="font-medium">{claim.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-secondary">缺陷：</span>
                    <span className="font-medium">{claim.defectType}</span>
                  </div>
                </div>
                
                <p className="mt-2 text-sm text-secondary line-clamp-2">{claim.description}</p>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-lg font-bold text-danger">¥{formatAmount(claim.claimAmount)}</p>
                  <p className="text-xs text-secondary">{claim.quantityDefective}件不良</p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-secondary">
                  {claim.repairDeadline && (
                    <span className={cn('flex items-center gap-1', isOverdue(claim.repairDeadline) && 'text-danger')}>
                      <Clock className="h-3 w-3" />
                      {formatDate(claim.repairDeadline)}
                    </span>
                  )}
                  <span>登记: {claim.engineerName}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {claims.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-secondary">暂无索赔记录</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
