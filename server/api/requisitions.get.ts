import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const requisitions = await prisma.requisition.findMany({
    include: {
      supply: true,
      supplyBatch: true,
      department: true,
      nurse: true,
      warehouseAdmin: true,
      reviewer: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  return requisitions
})
