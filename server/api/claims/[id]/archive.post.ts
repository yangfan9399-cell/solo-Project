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
  const { archiveReason, conclusionText, userId } = body

  const claim = await prisma.claim.findUnique({ where: { id } })
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: '卷宗不存在' })
  }

  const oldStatus = claim.status
  const oldStatusLabel = statusLabels[oldStatus] || oldStatus
  const finalConclusionText = conclusionText || oldStatusLabel

  await prisma.claim.update({
    where: { id },
    data: {
      status: 'ARCHIVED',
      isArchived: true,
      archiveReason,
      archiveDate: new Date(),
      previousConclusion: oldStatus,
      previousConclusionText: finalConclusionText
    }
  })

  await prisma.historyNode.create({
    data: {
      claimId: id,
      userId,
      action: '归档',
      status: 'ARCHIVED',
      remark: `卷宗已归档，原因：${archiveReason}。原结论：${finalConclusionText}`
    }
  })

  const result = await prisma.claim.findUnique({
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

  return result
})
