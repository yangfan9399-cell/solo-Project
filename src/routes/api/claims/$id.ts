import { createFileRoute } from '@tanstack/start'
import { getClaimById } from '@/api/claims'

export const Route = createFileRoute('/api/claims/$id')({
  async loader({ params }) {
    const id = parseInt(params.id, 10)
    const claim = await getClaimById(id)
    return { claim }
  }
})
