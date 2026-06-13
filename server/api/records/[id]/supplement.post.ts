import { createNode } from '~/server/utils/nodeHandler'
import { requireRole, requireRecordStatus } from '~/server/utils/requireRole'
import { validateAndFilterPayload } from '~/server/utils/validatePayload'
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

  const user = await requireRole(body.operatorId, 'supplement')
  await requireRecordStatus(id, ['REJECTED'])

  const cleanPayload = validateAndFilterPayload('supplement', user.role, body)

  const remark = [
    cleanPayload.businessRecord ? `业务记录：${cleanPayload.businessRecord}` : '',
    cleanPayload.siteDescription ? `现场说明：${cleanPayload.siteDescription}` : '',
    cleanPayload.remark || ''
  ].filter(Boolean).join('\n')

  const finalPayload: NodeActionPayload = {
    ...cleanPayload,
    remark
  }

  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['REVIEWER', 'ADMIN'] } },
    take: 1
  })

  const reviewerId = reviewers.length > 0 ? reviewers[0].id : user.id

  const result = await createNode(
    id,
    'SUPPLEMENT' as NodeType,
    'REVIEW' as RecordStatus,
    finalPayload,
    reviewerId
  )

  return { success: true, data: result }
})
