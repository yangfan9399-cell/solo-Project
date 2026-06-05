import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const count = await prisma.claim.count()
    if (count > 0) {
      return { message: 'already has data', count }
    }

    let handler = await prisma.user.findUnique({ where: { id: 'user-handler-001' } })
    if (!handler) {
      handler = await prisma.user.create({
        data: {
          id: 'user-handler-001',
          name: '张明',
          role: 'HANDLER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming'
        }
      })
    }

    let reviewer = await prisma.user.findUnique({ where: { id: 'user-reviewer-001' } })
    if (!reviewer) {
      reviewer = await prisma.user.create({
        data: {
          id: 'user-reviewer-001',
          name: '李华',
          role: 'REVIEWER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua'
        }
      })
    }

    let approver = await prisma.user.findUnique({ where: { id: 'user-approver-001' } })
    if (!approver) {
      approver = await prisma.user.create({
        data: {
          id: 'user-approver-001',
          name: '王芳',
          role: 'APPROVER',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang'
        }
      })
    }

    const policy = await prisma.policy.create({
      data: {
        policyNo: 'POL-DEMO-001',
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
        claimNo: 'CLM-DEMO-001',
        status: 'PAID',
        policyId: policy.id,
        accidentId: accident.id,
        calculationId: calculation.id,
        handlerId: handler.id,
        reviewerId: reviewer.id,
        approverId: approver.id,
        description: '正常赔付案例 - 车辆追尾事故理赔'
      }
    })

    await prisma.document.create({
      data: {
        claimId: claim.id,
        name: '理赔申请书',
        type: '申请书',
        status: 'RECEIVED',
        required: true
      }
    })

    await prisma.document.create({
      data: {
        claimId: claim.id,
        name: '身份证复印件',
        type: '身份证明',
        status: 'RECEIVED',
        required: true
      }
    })

    await prisma.review.create({
      data: {
        claimId: claim.id,
        userId: handler.id,
        stage: 'HANDLER',
        result: 'APPROVED',
        opinion: '材料齐全，事故真实，建议赔付',
        isLiabilityConfirmed: true
      }
    })

    await prisma.review.create({
      data: {
        claimId: claim.id,
        userId: reviewer.id,
        stage: 'REVIEWER',
        result: 'APPROVED',
        opinion: '责任清晰，金额合理，同意赔付',
        isLiabilityConfirmed: true
      }
    })

    await prisma.review.create({
      data: {
        claimId: claim.id,
        userId: approver.id,
        stage: 'APPROVER',
        result: 'APPROVED',
        opinion: '批准赔付金额20,825元',
        isLiabilityConfirmed: true
      }
    })

    await prisma.historyNode.create({
      data: {
        claimId: claim.id,
        userId: handler.id,
        action: '创建卷宗',
        status: 'DRAFT',
        remark: '经办人创建理赔卷宗'
      }
    })

    await prisma.historyNode.create({
      data: {
        claimId: claim.id,
        userId: reviewer.id,
        action: '审核通过',
        status: 'UNDER_REVIEW',
        remark: '审核人审核通过，提交复核'
      }
    })

    await prisma.historyNode.create({
      data: {
        claimId: claim.id,
        userId: approver.id,
        action: '复核批准',
        status: 'PAID',
        remark: '复核人批准赔付，案件已赔付结案'
      }
    })

    return { success: true, claimId: claim.id, claimNo: claim.claimNo }
  } catch (e: any) {
    console.error('Init error:', e)
    return { success: false, error: e.message }
  }
})
