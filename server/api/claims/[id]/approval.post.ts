import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { result, opinion, userId } = body

  const claim = await prisma.claim.findUnique({ where: { id } })
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: '卷宗不存在' })
  }

  let reviewResult: string
  let newStatus: string
  let actionText: string

  switch (result) {
    case 'APPROVED':
      reviewResult = 'APPROVED'
      newStatus = 'PAID'
      actionText = '复核批准赔付'
      break
    case 'REJECTED':
      reviewResult = 'REJECTED'
      newStatus = 'REJECTED'
      actionText = '复核拒绝赔付'
      break
    case 'RETURNED':
      reviewResult = 'SUPPLEMENT_REQUIRED'
      newStatus = 'MATERIALS_MISSING'
      actionText = '复核退回，要求补充材料'
      break
    default:
      throw createError({ statusCode: 400, statusMessage: '无效的审批结果' })
  }

  await prisma.review.create({
    data: {
      claimId: id,
      userId,
      stage: 'APPROVER',
      result: reviewResult,
      opinion,
      isLiabilityConfirmed: result === 'APPROVED'
    }
  })

  await prisma.claim.update({
    where: { id },
    data: {
      status: newStatus,
      approverId: userId
    }
  })

  await prisma.historyNode.create({
    data: {
      claimId: id,
      userId,
      action: '复核审批',
      status: newStatus,
      remark: actionText + (opinion ? ` - ${opinion}` : '')
    }
  })

  const resultClaim = await prisma.claim.findUnique({
    where: { id },
    include: {
      policy: true,
      accident: true,
      calculation: true,
      handler: true,
      reviewer: true,
      approver: true,
      documents: { orderBy: { createdAt: 'asc' } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      },
      historyNodes: {
        orderBy: { timestamp: 'desc' },
        include: { user: true }
      },
      disputeTerms: { orderBy: { createdAt: 'asc' } }
    }
  })

  return resultClaim
})
