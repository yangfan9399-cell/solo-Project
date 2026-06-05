import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')

  const batch = await prisma.visaBatch.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      reviewedBy: { select: { name: true } },
      tourists: {
        include: {
          tourist: {
            include: {
              materials: true
            }
          }
        }
      },
      auditLogs: {
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!batch) {
    throw createError({
      statusCode: 404,
      message: '批次不存在'
    })
  }

  const now = new Date()
  const sixMonthsLater = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000)

  const tourists = batch.tourists.map(tb => {
    const passportExpire = new Date(tb.tourist.passportExpire)
    const isPassportExpired = passportExpire < now
    const isPassportExpiringSoon = passportExpire < sixMonthsLater && !isPassportExpired

    return {
      id: tb.tourist.id,
      name: tb.tourist.name,
      passportNo: tb.tourist.passportNo,
      passportExpire: tb.tourist.passportExpire,
      birthDate: tb.tourist.birthDate,
      phone: tb.tourist.phone,
      isPassportExpired,
      isPassportExpiringSoon,
      materials: tb.tourist.materials,
      visaResult: tb.visaResult,
      batchNotes: tb.notes
    }
  })

  return {
    id: batch.id,
    batchNo: batch.batchNo,
    country: batch.country,
    status: batch.status,
    submitDate: batch.submitDate,
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt,
    createdBy: batch.createdBy,
    reviewedBy: batch.reviewedBy,
    tourists,
    auditLogs: batch.auditLogs
  }
})
