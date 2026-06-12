import { createNode } from '~/server/utils/nodeHandler'
import type { NodeActionPayload, NodeType, RecordStatus } from '~/types'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少记录ID' })
  }

  const body = await readBody<NodeActionPayload>(event)
  if (!body.operatorId || !body.operatorName) {
    throw createError({ statusCode: 400, message: '缺少操作人信息' })
  }

  const remark = [
    body.businessRecord ? `业务记录：${body.businessRecord}` : '',
    body.siteDescription ? `现场说明：${body.siteDescription}` : '',
    body.remark || ''
  ].filter(Boolean).join('\n')

  const payload: NodeActionPayload = {
    ...body,
    remark
  }

  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['REVIEWER', 'ADMIN'] } },
    take: 1
  })

  const reviewerId = reviewers.length > 0 ? reviewers[0].id : body.operatorId

  const result = await createNode(
    id,
    'SUPPLEMENT' as NodeType,
    'REVIEW' as RecordStatus,
    payload,
    reviewerId
  )

  return { success: true, data: result }
})
