import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const stations = await prisma.pumpStation.findMany({
    orderBy: { code: 'asc' }
  })
  return { success: true, data: stations }
})
