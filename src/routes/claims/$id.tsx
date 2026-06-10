import { createFileRoute, Link } from '@tanstack/start'
import { Layout } from '@/components/layout/Layout'
import { ClaimDetail } from '@/components/claims/ClaimDetail'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/claims/$id')({
  async loader({ params }) {
    const response = await fetch(`/api/claims/${params.id}`)
    const { claim } = await response.json()
    return { claim }
  },
  async action({ request }) {
    const body = await request.json()
    await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return { success: true }
  },
  component: ClaimDetailPage
})

function ClaimDetailPage() {
  const { claim } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  const handleUpdateStatus = async (status: string, comment: string, operator: string) => {
    await Route.useSubmit({ action: 'updateStatus', id: claim.id, status, comment, operator })
    navigate(`/claims/${claim.id}`)
  }

  const handleSupplierResponse = async (responseType: string, comment: string) => {
    await Route.useSubmit({ action: 'supplierResponse', claimId: claim.id, responseType, comment })
    navigate(`/claims/${claim.id}`)
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
