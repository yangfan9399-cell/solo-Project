import { useLoaderData, Link } from 'react-router-dom'
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

interface LoaderData {
  claims: Claim[]
}

export function IndexPage() {
  const { claims } = useLoaderData<LoaderData>()

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
