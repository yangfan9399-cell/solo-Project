import prisma from '~/server/utils/prisma'
import { assertRole, ROLES } from '~/server/utils/roleCheck'

export default defineEventHandler(async (event) => {
  const batchId = parseInt(getRouterParam(event, 'id') || '0')
  const touristId = parseInt(getRouterParam(event, 'touristId') || '0')
  const body = await readBody(event)
  const { userId = 1, reason } = body

  await assertRole(userId, [ROLES.OPERATOR, ROLES.REVIEWER])

  const touristBatch = await prisma.touristBatch.findUnique({
    where: {
      touristId_batchId: {
        touristId,
        batchId
      }
    },
    include: {
      tourist: true
    }
  })

  if (!touristBatch) {
    throw createError({
      statusCode: 404,
      message: '游客不在此批次中'
    })
  }

  await prisma.touristBatch.delete({
    where: {
      touristId_batchId: {
        touristId,
        batchId
      }
    }
  })

  await prisma.auditLog.create({
    data: {
      batchId,
      userId,
      action: 'REMOVE_TOURIST',
      notes: `移除游客：${touristBatch.tourist.name}${reason ? `，原因：${reason}` : ''}`
    }
  })

  return { success: true }
})
