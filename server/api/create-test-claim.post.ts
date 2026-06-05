import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const handler = await prisma.user.findFirst({ where: { role: 'HANDLER' } }) ||
      await prisma.user.create({ data: { name: '张明', role: 'HANDLER' } })
    const reviewer = await prisma.user.findFirst({ where: { role: 'REVIEWER' } }) ||
      await prisma.user.create({ data: { name: '李华', role: 'REVIEWER' } })
    const approver = await prisma.user.findFirst({ where: { role: 'APPROVER' } }) ||
      await prisma.user.create({ data: { name: '王芳', role: 'APPROVER' } })

    const policy = await prisma.policy.create({
      data: {
        policyNo: 'POL-TEST-' + Date.now(),
        policyType: '机动车辆保险',
        insuredName: '陈强',
        insuredIdNo: '310101199001011234',
        coverageAmount: 500000,
        premium: 4500,
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31')
      }
    })

    const accident = await prisma.accident.create({
      data: {
        accidentType: '车辆追尾事故',
        accidentDate: new Date('2024-08-15'),
        accidentLocation: '北京市朝阳区',
        description: '追尾事故',
        damageAmount: 25000
      }
    })

    const calculation = await prisma.calculation.create({
      data: {
        totalLoss: 25000,
        deductible: 500,
        coverageRatio: 0.85,
        payableAmount: 20825,
        limitExceeded: false
      }
    })

    const claim = await prisma.claim.create({
      data: {
        claimNo: 'CLM-TEST-' + Date.now(),
        status: 'PAID',
        policyId: policy.id,
        accidentId: accident.id,
        calculationId: calculation.id,
        handlerId: handler.id,
        reviewerId: reviewer.id,
        approverId: approver.id,
        description: '测试卷宗',
        documents: {
          create: [
            { name: '理赔申请书', type: '申请书', status: 'RECEIVED', required: true }
          ]
        },
        reviews: {
          create: [
            { userId: handler.id, stage: 'HANDLER', result: 'APPROVED', opinion: '材料齐全', isLiabilityConfirmed: true },
            { userId: reviewer.id, stage: 'REVIEWER', result: 'APPROVED', opinion: '同意赔付', isLiabilityConfirmed: true },
            { userId: approver.id, stage: 'APPROVER', result: 'APPROVED', opinion: '批准赔付', isLiabilityConfirmed: true }
          ]
        },
        historyNodes: {
          create: [
            { action: '创建卷宗', status: 'DRAFT', remark: '创建', userId: handler.id },
            { action: '已赔付', status: 'PAID', remark: '赔款已支付', userId: approver.id }
          ]
        },
        disputeTerms: {
          create: {
            termClause: '条款第6条',
            termDescription: '责任免除条款',
            disputeReason: '争议原因',
            supplementPath: '补证路径',
            isResolved: false
          }
        }
      },
      include: {
        policy: true,
        accident: true,
        calculation: true,
        handler: true,
        reviewer: true,
        approver: true,
        documents: true,
        reviews: { include: { user: true } },
        historyNodes: { include: { user: true } },
        disputeTerms: true
      }
    })

    return { success: true, claimId: claim.id, claimNo: claim.claimNo }
  } catch (e: any) {
    return { success: false, error: e.message, stack: e.stack?.substring(0, 500) }
  }
})
