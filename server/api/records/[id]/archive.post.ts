import { createNode } from '~/server/utils/nodeHandler'
import { requireRole, requireRecordStatus } from '~/server/utils/requireRole'
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

  await requireRole(body.operatorId, 'archive')
  await requireRecordStatus(id, ['REVIEW'])

  const result = await createNode(
    id,
    'ARCHIVE' as any,
    'ARCHIVED' as any,
    body,
    body.operatorId
  )

  return { success: true, data: result }
})
