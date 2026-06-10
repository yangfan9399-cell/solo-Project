import { useLoaderData, useNavigate, Link } from 'react-router-dom'
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

interface LoaderData {
  claim: ClaimDetailData | null
}

export function ClaimDetailPage() {
  const { claim } = useLoaderData<LoaderData>()
  const navigate = useNavigate()

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

  const handleUpdateStatus = async (status: string, comment: string, operator: string) => {
    await fetch(`/api/claims/${claim.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', status, comment, operator }),
    })
    navigate(`/claims/${claim.id}`)
  }

  const handleSupplierResponse = async (responseType: string, comment: string, evidenceUrl: string | null) => {
    await fetch(`/api/claims/${claim.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'supplierResponse', responseType, comment, evidenceUrl }),
    })
    navigate(`/claims/${claim.id}`)
  }

  return (
    <div>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        返回索赔列表
      </Link>
      <ClaimDetail 
        claim={claim} 
        onUpdateStatus={handleUpdateStatus}
        onSupplierResponse={handleSupplierResponse}
      />
    </div>
  )
}
