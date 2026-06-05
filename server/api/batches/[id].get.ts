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

  const touristIds = batch.tourists.map(tb => tb.touristId)

  const materialAudits = await prisma.materialAudit.findMany({
    where: {
      material: {
        touristId: {
          in: touristIds
        }
      }
    },
    include: {
      material: {
        include: {
          tourist: {
            select: { name: true }
          }
        }
      },
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

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

  const formattedMaterialAudits = materialAudits.map(ma => ({
    id: `ma_${ma.id}`,
    type: 'MATERIAL',
    touristName: ma.material.tourist.name,
    materialType: ma.material.type,
    action: ma.action,
    notes: ma.notes,
    createdAt: ma.createdAt,
    user: ma.user
  }))

  const formattedAuditLogs = batch.auditLogs.map(al => ({
    id: `al_${al.id}`,
    type: 'BATCH',
    action: al.action,
    notes: al.notes,
    createdAt: al.createdAt,
    user: al.user
  }))

  const allLogs = [...formattedMaterialAudits, ...formattedAuditLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

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
    auditLogs: batch.auditLogs,
    materialAudits: formattedMaterialAudits,
    allActivityLogs: allLogs
  }
})
