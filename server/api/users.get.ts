import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const role = query.role as string | undefined

  const users = await prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    include: {
      department: true
    },
    orderBy: { name: 'asc' }
  })
  return users
})
