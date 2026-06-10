import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/drugs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const includeBatches = url.searchParams.get('includeBatches') === 'true'

        const drugs = await prisma.drug.findMany({
          include: includeBatches ? {
            batches: {
              orderBy: { productionDate: 'desc' },
            }
          } : undefined,
          orderBy: { name: 'asc' },
        })
        return Response.json(drugs)
      },
    },
  },
})
