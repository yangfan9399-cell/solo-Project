import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as string | undefined

  const where: any = {}
  if (status && status !== 'ALL') {
    where.status = status
  }

  const claims = await prisma.claim.findMany({
    where,
    include: {
      policy: true,
      accident: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return claims
})
