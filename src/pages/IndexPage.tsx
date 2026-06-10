import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClaimList } from '@/components/claims/ClaimList'

interface Claim {
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
  status: string | null
  batchTraceable: boolean | null
  repairDeadline: string | null
  repairCompleted: boolean | null
  engineerName: string | null
  createdAt: string | null
}

export function IndexPage() {
  const [claims, setClaims] = useState<Claim[]>([])
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">索赔列表</h2>
        <p className="text-gray-500 mt-1">查看所有质量索赔记录</p>
      </div>
      <ClaimList claims={claims} />
    </div>
  )
}
