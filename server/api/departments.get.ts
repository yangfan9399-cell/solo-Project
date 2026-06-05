import prisma from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' }
  })
  return departments
})
