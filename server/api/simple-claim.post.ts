import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const policy = await prisma.policy.findFirst()
    const accident = await prisma.accident.findFirst()
    const handler = await prisma.user.findFirst({ where: { role: 'HANDLER' } })

    if (!policy || !accident || !handler) {
      return { success: false, error: '缺少基础数据' }
    }

    const claim = await prisma.claim.create({
      data: {
        claimNo: 'CLM-SIMPLE-' + Date.now(),
        status: 'DRAFT',
        policyId: policy.id,
        accidentId: accident.id,
        handlerId: handler.id,
        description: '简单测试卷宗'
      }
    })

    return { success: true, claimId: claim.id }
  } catch (e: any) {
    console.error('Error:', e)
    return { success: false, error: e.message }
  }
})
