import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('body:', body)

    const policy = await prisma.policy.create({
      data: {
        policyNo: 'TEST-' + Date.now(),
        policyType: '测试',
        insuredName: '测试',
        insuredIdNo: '123456',
        coverageAmount: 1000,
        premium: 100,
        effectiveDate: new Date(),
        expiryDate: new Date()
      }
    })

    return { ok: true, policyId: policy.id }
  } catch (err: any) {
    console.error('Error:', err)
    return { ok: false, error: err.message }
  }
})
