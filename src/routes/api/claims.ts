import { createFileRoute } from '@tanstack/start'
import { getClaims, getClaimById, updateClaimStatus, addSupplierResponse, createClaim } from '@/api/claims'

export const Route = createFileRoute('/api/claims')({
  async loader() {
    const claims = await getClaims()
    return { claims }
  },
  async action({ request }) {
    const body = await request.json()
    
    if (body.action === 'updateStatus') {
      await updateClaimStatus(body.id, body.status, body.comment, body.operator)
      return { success: true }
    }
    
    if (body.action === 'supplierResponse') {
      await addSupplierResponse(body.claimId, body.responseType, body.comment, body.evidenceUrl)
      return { success: true }
    }
    
    if (body.action === 'create') {
      const claim = await createClaim(body.data)
      return { success: true, claim }
    }
    
    return { success: false }
  }
})
