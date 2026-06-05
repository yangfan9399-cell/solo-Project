import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const supplies = await prisma.supply.findMany({
    include: {
      batches: {
        orderBy: {
          expiredAt: 'asc'
        }
      }
    },
    orderBy: {
      code: 'asc'
    }
  })
  return supplies
})
