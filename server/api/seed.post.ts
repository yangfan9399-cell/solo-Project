import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const count = await prisma.claim.count()
  if (count > 0) {
    return { message: '数据已存在，跳过初始化', count }
  }

  const handler = await prisma.user.create({
    data: {
      id: 'user-handler-001',
      name: '张明',
      role: 'HANDLER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming'
    }
  })

  const reviewer = await prisma.user.create({
    data: {
      id: 'user-reviewer-001',
      name: '李华',
      role: 'REVIEWER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua'
    }
  })

  const approver = await prisma.user.create({
    data: {
      id: 'user-approver-001',
      name: '王芳',
      role: 'APPROVER',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang'
    }
  })

  const policy1 = await prisma.policy.create({
    data: {
      policyNo: 'POL-2024-001234',
      policyType: '机动车辆保险',
      insuredName: '陈强',
      insuredIdNo: '310101199001011234',
      coverageAmount: 500000,
      premium: 4500,
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      beneficiary: '陈强',
      remarks: '交强险+商业险全保'
    }
  })

  const policy2 = await prisma.policy.create({
    data: {
      policyNo: 'POL-2024-001235',
      policyType: '重大疾病保险',
      insuredName: '刘芳',
      insuredIdNo: '320101198505055678',
      coverageAmount: 300000,
      premium: 6800,
      effectiveDate: new Date('2024-03-15'),
      expiryDate: new Date('2025-03-14'),
      beneficiary: '配偶',
      remarks: '终身重疾险，保额30万'
    }
  })

  const accident1 = await prisma.accident.create({
    data: {
      accidentType: '车辆追尾事故',
      accidentDate: new Date('2024-08-15'),
      accidentLocation: '北京市朝阳区建国路',
      description: '被保险人驾驶车辆在建国路与前方车辆发生追尾事故，造成双方车辆损坏。',
      injuryLevel: '轻微',
      damageAmount: 25000,
      policeReport: '是，交警已出具责任认定书',
      witness: '无'
    }
  })

  const calculation1 = await prisma.calculation.create({
    data: {
      totalLoss: 25000,
      deductible: 500,
      coverageRatio: 0.85,
      payableAmount: 20825,
      limitExceeded: false,
      calculationNote: '车辆损失险赔付，扣除绝对免赔额500元，按85%比例赔付。'
    }
  })

  const claim1 = await prisma.claim.create({
    data: {
      claimNo: 'CLM-2024-08001',
      status: 'PAID',
      policyId: policy1.id,
      accidentId: accident1.id,
      calculationId: calculation1.id,
      handlerId: handler.id,
      reviewerId: reviewer.id,
      approverId: approver.id,
      description: '车辆追尾事故理赔，材料齐全，责任清晰。',
      documents: {
        create: [
          { name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: new Date('2024-08-16'), required: true },
          { name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: new Date('2024-08-16'), required: true },
          { name: '驾驶证行驶证', type: '证件', status: 'RECEIVED', receivedDate: new Date('2024-08-16'), required: true },
          { name: '交通事故认定书', type: '事故证明', status: 'RECEIVED', receivedDate: new Date('2024-08-17'), required: true },
          { name: '车辆定损单', type: '定损材料', status: 'RECEIVED', receivedDate: new Date('2024-08-18'), required: true },
          { name: '维修发票', type: '费用凭证', status: 'RECEIVED', receivedDate: new Date('2024-08-20'), required: true }
        ]
      },
      reviews: {
        create: [
          {
            userId: handler.id,
            stage: 'HANDLER',
            result: 'APPROVED',
            opinion: '材料齐全，事故真实，核算赔付金额20,825元。',
            isLiabilityConfirmed: true
          },
          {
            userId: reviewer.id,
            stage: 'REVIEWER',
            result: 'APPROVED',
            opinion: '责任认定清晰，材料完整，同意赔付。',
            isLiabilityConfirmed: true
          },
          {
            userId: approver.id,
            stage: 'APPROVER',
            result: 'APPROVED',
            opinion: '同意赔付20,825元。',
            isLiabilityConfirmed: true
          }
        ]
      },
      historyNodes: {
        create: [
          { action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', userId: handler.id },
          { action: '材料齐全', status: 'UNDER_REVIEW', remark: '所有理赔材料已收齐', userId: handler.id },
          { action: '审核通过', status: 'UNDER_REVIEW', remark: '审核人确认责任，材料完整', userId: reviewer.id },
          { action: '赔付批准', status: 'APPROVED', remark: '复核人批准赔付', userId: approver.id },
          { action: '已赔付', status: 'PAID', remark: '赔款已支付至被保险人账户', userId: approver.id }
        ]
      }
    }
  })

  const claim2 = await prisma.claim.create({
    data: {
      claimNo: 'CLM-2024-09001',
      status: 'MATERIALS_MISSING',
      policyId: policy2.id,
      accidentId: (await prisma.accident.create({
        data: {
          accidentType: '急性心肌梗塞',
          accidentDate: new Date('2024-09-20'),
          accidentLocation: '上海市浦东新区',
          description: '被保险人因突发胸痛送医，诊断为急性心肌梗塞，行PCI手术治疗。',
          injuryLevel: '重大疾病',
          damageAmount: 150000,
          policeReport: '否',
          witness: '家属'
        }
      })).id,
      handlerId: handler.id,
      reviewerId: reviewer.id,
      description: '重大疾病理赔，缺少部分医疗证明材料。',
      documents: {
        create: [
          { name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: new Date('2024-09-22'), required: true },
          { name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: new Date('2024-09-22'), required: true },
          { name: '诊断证明书', type: '医疗证明', status: 'RECEIVED', receivedDate: new Date('2024-09-22'), required: true },
          { name: '住院病历', type: '医疗记录', status: 'SUPPLEMENT_REQUIRED', required: true, supplementReason: '缺少手术记录和病理报告' },
          { name: '医疗费用发票', type: '费用凭证', status: 'PENDING', required: true },
          { name: '费用清单', type: '费用明细', status: 'PENDING', required: true }
        ]
      },
      reviews: {
        create: [
          {
            userId: handler.id,
            stage: 'HANDLER',
            result: 'SUPPLEMENT_REQUIRED',
            opinion: '材料不齐全，需补充：1. 手术记录 2. 病理报告 3. 医疗费用发票及清单',
            isLiabilityConfirmed: false
          }
        ]
      },
      historyNodes: {
        create: [
          { action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', userId: handler.id },
          { action: '材料初检', status: 'MATERIALS_MISSING', remark: '发现缺少手术记录、病理报告、医疗发票等关键材料', userId: handler.id }
        ]
      }
    }
  })

  const claim3 = await prisma.claim.create({
    data: {
      claimNo: 'CLM-2024-10001',
      status: 'LIABILITY_DISPUTE',
      policyId: (await prisma.policy.create({
        data: {
          policyNo: 'POL-2024-001236',
          policyType: '意外伤害保险',
          insuredName: '赵刚',
          insuredIdNo: '330101199210109012',
          coverageAmount: 200000,
          premium: 1200,
          effectiveDate: new Date('2024-06-01'),
          expiryDate: new Date('2025-05-31'),
          beneficiary: '法定受益人',
          remarks: '综合意外险'
        }
      })).id,
      accidentId: (await prisma.accident.create({
        data: {
          accidentType: '高空坠落',
          accidentDate: new Date('2024-10-05'),
          accidentLocation: '深圳市南山区',
          description: '被保险人在装修作业时从3米高处坠落，造成多处骨折和内脏损伤。',
          injuryLevel: '重伤',
          damageAmount: 180000,
          policeReport: '是，安监部门已介入',
          witness: '同事2人'
        }
      })).id,
      calculationId: (await prisma.calculation.create({
        data: {
          totalLoss: 250000,
          deductible: 0,
          coverageRatio: 1,
          payableAmount: 200000,
          limitExceeded: true,
          limitAmount: 200000,
          calculationNote: '意外伤害身故伤残保额20万元，实际损失超过保额，按保额上限赔付。'
        }
      })).id,
      handlerId: handler.id,
      reviewerId: reviewer.id,
      approverId: approver.id,
      description: '高空坠落意外伤残理赔，存在责任免除争议。',
      documents: {
        create: [
          { name: '理赔申请书', type: '申请书', status: 'RECEIVED', receivedDate: new Date('2024-10-08'), required: true },
          { name: '身份证复印件', type: '身份证明', status: 'RECEIVED', receivedDate: new Date('2024-10-08'), required: true },
          { name: '事故证明', type: '事故证明', status: 'RECEIVED', receivedDate: new Date('2024-10-10'), required: true },
          { name: '伤残鉴定报告', type: '鉴定报告', status: 'RECEIVED', receivedDate: new Date('2024-10-25'), required: true },
          { name: '住院病历', type: '医疗记录', status: 'RECEIVED', receivedDate: new Date('2024-10-20'), required: true }
        ]
      },
      disputeTerms: {
        create: [
          {
            termClause: '保险条款第6条第3款',
            termDescription: '被保险人从事高风险职业（如高空作业）期间发生的意外伤害，保险公司不承担赔偿责任。',
            disputeReason: '被保险人事故时正在进行装修高空作业，属于条款约定的高风险职业范畴。被保险人投保时未如实告知职业类别。',
            supplementPath: '1. 获取被保险人投保时的职业告知材料；2. 核实事故发生时的具体工作内容；3. 确认是否属于条款约定的免责情形。',
            isResolved: false
          }
        ]
      },
      reviews: {
        create: [
          {
            userId: handler.id,
            stage: 'HANDLER',
            result: 'DISPUTE',
            opinion: '材料齐全，但存在责任免除争议。被保险人从事高空作业，属于条款约定的高风险职业。',
            isLiabilityConfirmed: false
          },
          {
            userId: reviewer.id,
            stage: 'REVIEWER',
            result: 'DISPUTE',
            opinion: '同意经办人意见，存在责任免除争议。需进一步核实投保时职业告知情况。',
            isLiabilityConfirmed: false
          }
        ]
      },
      historyNodes: {
        create: [
          { action: '创建卷宗', status: 'DRAFT', remark: '经办人创建理赔卷宗', userId: handler.id },
          { action: '材料齐全', status: 'UNDER_REVIEW', remark: '所有理赔材料已收齐', userId: handler.id },
          { action: '发现争议', status: 'LIABILITY_DISPUTE', remark: '审核发现责任免除争议：高空作业属于免责条款', userId: reviewer.id }
        ]
      }
    }
  })

  return {
    message: '数据初始化完成',
    claims: 3,
    users: 3,
    policies: 3
  }
})
