import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const policy = await prisma.policy.create({
      data: {
        policyNo: 'TEST-POLICY-' + Date.now(),
        policyType: '测试险种',
        insuredName: '测试被保险人',
        insuredIdNo: '1234567890',
        coverageAmount: 100000,
        premium: 1000,
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31')
      }
    })
    return { success: true, policy }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})
