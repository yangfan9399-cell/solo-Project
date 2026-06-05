import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const user = await prisma.user.create({
      data: {
        name: '测试用户',
        role: 'HANDLER'
      }
    })
    return { success: true, user }
  } catch (e: any) {
    return { success: false, error: e.message, stack: e.stack }
  }
})
