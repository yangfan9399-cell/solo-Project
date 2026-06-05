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
  const { reopenReason, userId } = body

  const claim = await prisma.claim.findUnique({ where: { id } })
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: '卷宗不存在' })
  }

  const previousConclusion = claim.previousConclusion || 'DRAFT'
  const previousConclusionText = claim.previousConclusionText || statusLabels[previousConclusion] || '无'
  const archiveReason = claim.archiveReason || '未记录'

  await prisma.claim.update({
    where: { id },
    data: {
      status: previousConclusion,
      isArchived: false,
      reopenedFrom: claim.previousConclusion,
      reopenReason,
      reopenDate: new Date(),
      lastArchiveReason: claim.archiveReason
    }
  })

  await prisma.historyNode.create({
    data: {
      claimId: id,
      userId,
      action: '重新开启',
      status: 'REOPENED',
      remark: `卷宗重新开启，原因：${reopenReason}。旧结论：${previousConclusionText}。原归档原因：${archiveReason}`
    }
  })

  await prisma.historyNode.create({
    data: {
      claimId: id,
      userId,
      action: '恢复处理',
      status: previousConclusion,
      remark: '卷宗恢复到重新开启前的处理状态，可继续办理'
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
