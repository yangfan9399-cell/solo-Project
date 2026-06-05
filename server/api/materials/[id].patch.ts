import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { status, notes, userId = 1, batchId } = body

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      tourist: true
    }
  })

  if (!material) {
    throw createError({
      statusCode: 404,
      message: '材料不存在'
    })
  }

  const updatedMaterial = await prisma.material.update({
    where: { id },
    data: {
      status,
      notes
    }
  })

  await prisma.materialAudit.create({
    data: {
      materialId: id,
      batchId: batchId ? parseInt(batchId) : null,
      userId,
      action: 'UPDATE_STATUS',
      notes: `将${material.type}状态从${material.status}更新为${status}${notes ? `，备注：${notes}` : ''}`
    }
  })

  return updatedMaterial
})
