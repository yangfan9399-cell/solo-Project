import { createNode } from '~/server/utils/nodeHandler'
import { requireRole, requireRecordStatus } from '~/server/utils/requireRole'
import { validateAndFilterPayload } from '~/server/utils/validatePayload'
import type { NodeActionPayload, NodeType, RecordStatus } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少记录ID' })
  }

  const body = await readBody<NodeActionPayload>(event)
  if (!body.operatorId || !body.operatorName) {
    throw createError({ statusCode: 400, message: '缺少操作人信息' })
  }

  const user = await requireRole(body.operatorId, 'process')
  await requireRecordStatus(id, ['PROCESSING', 'REOPENED'])

  const cleanPayload = validateAndFilterPayload('process', user.role, body)

  const result = await createNode(
    id,
    'PROCESS' as NodeType,
    'REVIEW' as RecordStatus,
    cleanPayload,
    user.id
  )

  return { success: true, data: result }
})
