import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const count = await prisma.user.count()
    return { count }
  } catch (e: any) {
    return { error: e.message, stack: e.stack }
  }
})
