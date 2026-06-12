import { createNode } from '~/server/utils/nodeHandler'
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

  const result = await createNode(
    id,
    'ARCHIVE' as NodeType,
    'ARCHIVED' as RecordStatus,
    body,
    body.operatorId
  )

  return { success: true, data: result }
})
