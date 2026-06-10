import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ClaimDetail } from '@/components/claims/ClaimDetail'
import { ArrowLeft } from 'lucide-react'

interface ClaimDetailType {
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
  evidences: Array<{
    id: number
    type: string | null
    url: string | null
    description: string | null
    uploadedAt: string | null
  }>
  history: Array<{
    id: number
    status: string
    comment: string | null
    operator: string | null
    createdAt: string | null
  }>
  supplierResponse: {
    responseType: string
    comment: string | null
    evidenceUrl: string | null
    createdAt: string | null
  } | null
}

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [claim, setClaim] = useState<ClaimDetailType | null>(null)
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

  const handleUpdateStatus = async (status: string, comment: string, operator: string) => {
    if (!id) return
    await fetch(`/api/claims/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', status, comment, operator })
    })
    window.location.reload()
  }

  const handleSupplierResponse = async (responseType: string, comment: string) => {
    if (!id) return
    await fetch(`/api/claims/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'supplierResponse', responseType, comment })
    })
    window.location.reload()
  }

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

  if (!claim) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-secondary">索赔记录不存在</p>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">
            返回索赔列表
          </Link>
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
        <ArrowLeft className="h-4 w-4" />
        返回索赔列表
      </Link>
      <ClaimDetail
        claim={claim}
        onUpdateStatus={handleUpdateStatus}
        onSupplierResponse={handleSupplierResponse}
      />
    </Layout>
  )
}
