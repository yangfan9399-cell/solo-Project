import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/stores')({
  server: {
    handlers: {
      GET: async () => {
        const stores = await prisma.store.findMany({
          orderBy: { code: 'asc' },
        })
        return Response.json(stores)
      },
    },
  },
})
