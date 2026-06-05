import prisma from '~/server/utils/prisma'
import { assertRole, ROLES } from '~/server/utils/roleCheck'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { status, notes, userId = 2, touristIds } = body

  await assertRole(userId, ROLES.REVIEWER)

  const batch = await prisma.visaBatch.findUnique({
    where: { id },
    include: {
      tourists: {
        include: {
          tourist: true
        }
      }
    }
  })

  if (!batch) {
    throw createError({
      statusCode: 404,
      message: '批次不存在'
    })
  }

  if (status === 'SUBMITTED') {
    const now = new Date()
    const expiredTourists = batch.tourists.filter(tb => 
      new Date(tb.tourist.passportExpire) < now
    )

    if (expiredTourists.length > 0) {
      throw createError({
        statusCode: 400,
        message: `以下游客护照已过期，无法递签：${expiredTourists.map(t => t.tourist.name).join('、')}。请先换证或移出批次。`
      })
    }
  }

  const updatedBatch = await prisma.visaBatch.update({
    where: { id },
    data: {
      status,
      submitDate: status === 'SUBMITTED' ? new Date() : batch.submitDate,
      reviewedById: userId
    }
  })

  await prisma.auditLog.create({
    data: {
      batchId: id,
      userId,
      action: status === 'SUBMITTED' ? 'SUBMIT' : 
              status === 'REJECTED' ? 'REJECT' : 
              status === 'ARCHIVED' ? 'ARCHIVE' : 'UPDATE_STATUS',
      notes
    }
  })

  return updatedBatch
})
