import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ClaimList } from '@/components/claims/ClaimList'

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

export function IndexPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/claims')
      .then(res => res.json())
      .then(data => {
        setClaims(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch claims:', err)
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
      <div className="mb-6">
        <h2 className="text-xl font-bold">索赔列表</h2>
        <p className="text-secondary mt-1">显示所有质量索赔记录</p>
      </div>
      <ClaimList claims={claims} />
    </Layout>
  )
}
