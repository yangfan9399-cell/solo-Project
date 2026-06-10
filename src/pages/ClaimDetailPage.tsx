import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ClaimDetail } from '@/components/claims/ClaimDetail'

interface Evidence {
  id: number
  type: string | null
  url: string | null
  description: string | null
  uploadedAt: string | null
}

interface History {
  id: number
  status: string
  comment: string | null
  operator: string | null
  createdAt: string | null
}

interface SupplierResponse {
  responseType: string
  comment: string | null
  evidenceUrl: string | null
  createdAt: string | null
}

interface ClaimDetailData {
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
  updatedAt: string | null
  evidences: Evidence[]
  history: History[]
  supplierResponse: SupplierResponse | null
}

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [claim, setClaim] = useState<ClaimDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/claims/${id}`)
      .then(res => res.json())
      .then(data => {
        setClaim(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch claim:', err)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">加载中...</p>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">索赔记录不存在</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          返回索赔列表
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        返回索赔列表
      </Link>
      <ClaimDetail claim={claim} />
    </div>
  )
}
