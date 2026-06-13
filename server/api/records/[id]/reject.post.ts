import { createNode } from '~/server/utils/nodeHandler'
import { requireRole, requireRecordStatus } from '~/server/utils/requireRole'
import { validateAndFilterPayload } from '~/server/utils/validatePayload'
import type { NodeActionPayload } from '~/types'
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

  const user = await requireRole(body.operatorId, 'reject')
  await requireRecordStatus(id, ['REVIEW'])

  if (!body.blockReason) {
    throw createError({ statusCode: 400, message: '退回补证必须填写阻断原因' })
  }
  if (!body.remedyPath) {
    throw createError({ statusCode: 400, message: '退回补证必须填写补救路径' })
  }

  const cleanPayload = validateAndFilterPayload('reject', user.role, body)

  const record = await prisma.alarmRecord.findUnique({
    where: { id },
    include: { nodes: { orderBy: { createdAt: 'asc' } } }
  })

  if (!record) {
    throw createError({ statusCode: 404, message: '记录不存在' })
  }

  const acceptNode = record.nodes.find((n: { nodeType: string; operatorId: string }) => n.nodeType === 'ACCEPT')
  const applicantId = acceptNode?.operatorId || (record as any).currentHandlerId

  const result = await createNode(
    id,
    'REJECT' as any,
    'REJECTED' as any,
    cleanPayload,
    applicantId
  )

  return { success: true, data: result }
})
