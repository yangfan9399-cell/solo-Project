import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const claimCount = await prisma.claim.count()
    if (claimCount > 0) {
      return { message: '数据已存在', count: claimCount }
    }

    const handler = await prisma.user.upsert({
      where: { id: 'user-handler-001' },
      update: {},
      create: { id: 'user-handler-001', name: '张明', role: 'HANDLER' }
    })
    const reviewer = await prisma.user.upsert({
      where: { id: 'user-reviewer-001' },
      update: {},
      create: { id: 'user-reviewer-001', name: '李华', role: 'REVIEWER' }
    })
    const approver = await prisma.user.upsert({
      where: { id: 'user-approver-001' },
      update: {},
      create: { id: 'user-approver-001', name: '王芳', role: 'APPROVER' }
    })

    const policy = await prisma.policy.create({
      data: {
        policyNo: 'POL-2024-001234',
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
        claimNo: 'CLM-2024-08001',
        status: 'PAID',
        policyId: policy.id,
        accidentId: accident.id,
        calculationId: calculation.id,
        handlerId: handler.id,
        reviewerId: reviewer.id,
        approverId: approver.id,
        description: '正常赔付案例',
        documents: {
          create: [
            { name: '理赔申请书', type: '申请书', status: 'RECEIVED', required: true }
          ]
        },
        reviews: {
          create: [
            { userId: handler.id, stage: 'HANDLER', result: 'APPROVED', opinion: '材料齐全', isLiabilityConfirmed: true },
            { userId: reviewer.id, stage: 'REVIEWER', result: 'APPROVED', opinion: '同意赔付', isLiabilityConfirmed: true },
            { userId: approver.id, stage: 'APPROVER', result: 'APPROVED', opinion: '批准赔付20825元', isLiabilityConfirmed: true }
          ]
        },
        historyNodes: {
          create: [
            { action: '创建卷宗', status: 'DRAFT', remark: '创建卷宗', userId: handler.id },
            { action: '已赔付', status: 'PAID', remark: '赔款已支付', userId: approver.id }
          ]
        },
        disputeTerms: {
          create: [
            {
              termClause: '测试条款',
              termDescription: '测试条款描述',
              disputeReason: '测试争议原因',
              supplementPath: '测试补证路径',
              isResolved: false
            }
          ]
        }
      }
    })

    return { success: true, claimId: claim.id }
  } catch (e: any) {
    return { success: false, error: e.message, stack: e.stack }
  }
})
