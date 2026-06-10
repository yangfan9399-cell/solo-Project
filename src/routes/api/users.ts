import { createFileRoute } from '@tanstack/react-router'
import { prisma } from '../../utils/prisma'

export const Route = createFileRoute('/api/users')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const role = url.searchParams.get('role')
        const where: any = {}
        if (role) {
          where.role = role
        }
        const users = await prisma.user.findMany({
          where,
          include: {
            store: {
              select: { name: true, code: true, region: true }
            }
          },
          orderBy: { name: 'asc' },
        })
        return Response.json(users)
      },
    },
  },
})
