import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  })
  return { success: true, data: users }
})
