import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      policy: true,
      accident: true,
      calculation: true,
      handler: true,
      reviewer: true,
      approver: true,
      documents: {
        orderBy: { createdAt: 'asc' }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      },
      historyNodes: {
        orderBy: { timestamp: 'desc' },
        include: { user: true }
      },
      disputeTerms: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!claim) {
    throw createError({
      statusCode: 404,
      statusMessage: '卷宗不存在'
    })
  }

  return claim
})
