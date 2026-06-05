import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId = 1 } = getQuery(event)

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId as string) },
    select: {
      id: true,
      name: true,
      role: true
    }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在'
    })
  }

  return user
})
