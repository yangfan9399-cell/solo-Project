import { prisma } from '~/server/utils/prisma'

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  MATERIALS_MISSING: '材料缺失',
  MATERIALS_SUPPLEMENTED: '材料已补充',
  UNDER_REVIEW: '审核中',
  LIABILITY_DISPUTE: '责任争议',
  AMOUNT_EXCEEDED: '金额超限',
  APPROVED: '审核通过',
  PAID: '已赔付',
  REJECTED: '已拒赔',
  ARCHIVED: '已归档',
  REOPENED: '已重新开启'
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { result, opinion, isLiabilityConfirmed, disputeTerms, userId } = body

  const claim = await prisma.claim.findUnique({ where: { id } })
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: '卷宗不存在' })
  }

  const reviewResult = result

  await prisma.review.create({
    data: {
      claimId: id,
      userId,
      stage: 'REVIEWER',
      result: reviewResult,
      opinion,
      isLiabilityConfirmed
    }
  })

  let newStatus = claim.status

  if (reviewResult === 'APPROVED') {
    newStatus = 'UNDER_REVIEW'
  } else if (reviewResult === 'SUPPLEMENT_REQUIRED') {
    newStatus = 'MATERIALS_MISSING'
  } else if (reviewResult === 'DISPUTE') {
    newStatus = 'LIABILITY_DISPUTE'
  } else if (reviewResult === 'REJECTED') {
    newStatus = 'REJECTED'
  }

  const historyRemark = getHistoryRemark(reviewResult, opinion)

  await prisma.claim.update({
    where: { id },
    data: {
      status: newStatus,
      reviewerId: userId
    }
  })

  await prisma.historyNode.create({
    data: {
      claimId: id,
      userId,
      action: '审核',
      status: newStatus,
      remark: historyRemark
    }
  })

  if (reviewResult === 'DISPUTE' && disputeTerms) {
    await prisma.disputeTerm.create({
      data: {
        claimId: id,
        termClause: disputeTerms.termClause,
        termDescription: disputeTerms.termDescription,
        disputeReason: disputeTerms.disputeReason,
        supplementPath: disputeTerms.supplementPath,
        isResolved: false
      }
    })
  }

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

function getHistoryRemark(result: string, opinion: string): string {
  const prefix = '审核人审核：'
  switch (result) {
    case 'APPROVED':
      return prefix + '审核通过，提交复核'
    case 'SUPPLEMENT_REQUIRED':
      return prefix + '要求补充材料'
    case 'DISPUTE':
      return prefix + '发现责任免除争议'
    case 'REJECTED':
      return prefix + '审核拒绝'
    default:
      return prefix + opinion
  }
}
