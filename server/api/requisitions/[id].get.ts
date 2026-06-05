import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少领用记录ID' })
  }

  const requisition = await prisma.requisition.findUnique({
    where: { id },
    include: {
      supply: true,
      supplyBatch: true,
      department: true,
      nurse: true,
      warehouseAdmin: true,
      reviewer: true,
      history: {
        include: {
          operator: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  if (!requisition) {
    throw createError({ statusCode: 404, message: '领用记录不存在' })
  }

  return requisition
})
