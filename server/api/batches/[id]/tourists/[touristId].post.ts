import prisma from '~/server/utils/prisma'
import { assertRole, ROLES } from '~/server/utils/roleCheck'

export default defineEventHandler(async (event) => {
  const batchId = parseInt(getRouterParam(event, 'id') || '0')
  const touristId = parseInt(getRouterParam(event, 'touristId') || '0')
  const body = await readBody(event)
  const { visaResult, notes, userId = 1 } = body

  await assertRole(userId, ROLES.REVIEWER)

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

  const oldResult = touristBatch.visaResult

  const updated = await prisma.touristBatch.update({
    where: {
      touristId_batchId: {
        touristId,
        batchId
      }
    },
    data: {
      visaResult,
      notes
    }
  })

  const resultText: Record<string, string> = {
    PENDING: '待补充',
    APPROVED: '已出签',
    REJECTED: '拒签'
  }

  await prisma.auditLog.create({
    data: {
      batchId,
      userId,
      action: 'UPDATE_VISA_RESULT',
      notes: `更新${touristBatch.tourist.name}的出签结果：${oldResult ? resultText[oldResult] || oldResult : '未设置'} → ${visaResult ? resultText[visaResult] || visaResult : '未设置'}${notes ? `，备注：${notes}` : ''}`
    }
  })

  return updated
})
