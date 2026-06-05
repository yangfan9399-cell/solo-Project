import { PrismaClient, UserRole, ApplicationStatus, InspectionResult, FileType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始播种数据...')

  const investmentManager = await prisma.user.upsert({
    where: { email: 'zhang.manager@mall.com' },
    update: {},
    create: {
      name: '张明',
      email: 'zhang.manager@mall.com',
      role: UserRole.INVESTMENT_MANAGER,
      phone: '13800138001'
    }
  })

  const engineer = await prisma.user.upsert({
    where: { email: 'li.engineer@mall.com' },
    update: {},
    create: {
      name: '李强',
      email: 'li.engineer@mall.com',
      role: UserRole.ENGINEER,
      phone: '13800138002'
    }
  })

  const fireInspector = await prisma.user.upsert({
    where: { email: 'wang.inspector@mall.com' },
    update: {},
    create: {
      name: '王芳',
      email: 'wang.inspector@mall.com',
      role: UserRole.FIRE_INSPECTOR,
      phone: '13800138003'
    }
  })

  console.log('用户创建完成')

  const merchantData = [
    { name: '星巴克咖啡', contactName: '陈店长', phone: '13900139001', email: 'starbucks@coffee.com', businessType: '餐饮' },
    { name: '优衣库', contactName: '刘经理', phone: '13900139002', email: 'uniqlo@fashion.com', businessType: '服装' },
    { name: '海底捞火锅', contactName: '周店长', phone: '13900139003', email: 'haidilao@hotpot.com', businessType: '餐饮' },
    { name: '苹果零售店', contactName: '吴经理', phone: '13900139004', email: 'apple@tech.com', businessType: '数码' }
  ]

  const merchants = await Promise.all(
    merchantData.map(data => 
      prisma.merchant.upsert({
        where: { email: data.email },
        update: {
          name: data.name,
          contactName: data.contactName,
          phone: data.phone,
          businessType: data.businessType
        },
        create: data
      })
    )
  )

  console.log('商户创建完成')

  const shopUnits = await Promise.all([
    prisma.shopUnit.upsert({
      where: { unitNumber: '1F-001' },
      update: {},
      create: {
        unitNumber: '1F-001',
        floor: '1F',
        area: 150,
        status: 'occupied',
        description: '一层主入口位置'
      }
    }),
    prisma.shopUnit.upsert({
      where: { unitNumber: '2F-005' },
      update: {},
      create: {
        unitNumber: '2F-005',
        floor: '2F',
        area: 800,
        status: 'occupied',
        description: '二层服装区核心位置'
      }
    }),
    prisma.shopUnit.upsert({
      where: { unitNumber: '3F-012' },
      update: {},
      create: {
        unitNumber: '3F-012',
        floor: '3F',
        area: 500,
        status: 'occupied',
        description: '三层餐饮区'
      }
    }),
    prisma.shopUnit.upsert({
      where: { unitNumber: '1F-008' },
      update: {},
      create: {
        unitNumber: '1F-008',
        floor: '1F',
        area: 200,
        status: 'occupied',
        description: '一层数码区'
      }
    })
  ])

  console.log('铺位创建完成')

  await prisma.application.deleteMany({})

  const normalApplication = await prisma.application.create({
    data: {
      merchantId: merchants[0].id,
      shopUnitId: shopUnits[0].id,
      projectName: '星巴克1F-001店铺装修工程',
      status: ApplicationStatus.ARCHIVED,
      constructionStart: new Date('2024-01-15'),
      constructionEnd: new Date('2024-02-15'),
      estimatedCost: 500000,
      projectScope: '店铺整体装修，包括水电改造、墙面地面铺设、吧台安装等',
      investmentManagerId: investmentManager.id,
      drawings: {
        create: [
          {
            name: '平面布置图',
            type: FileType.FLOOR_PLAN,
            fileUrl: '/drawings/starbucks-floor.pdf',
            uploadedById: investmentManager.id,
            description: '店铺平面布置设计图'
          },
          {
            name: '消防设计图',
            type: FileType.FIRE_PLAN,
            fileUrl: '/drawings/starbucks-fire.pdf',
            uploadedById: investmentManager.id,
            description: '消防系统设计图'
          }
        ]
      },
      inspectionNodes: {
        create: [
          {
            nodeType: '投资主管审核',
            nodeOrder: 1,
            result: InspectionResult.PASSED,
            handlerId: investmentManager.id,
            handledAt: new Date('2024-01-10'),
            remarks: '资料齐全，施工时段合理，同意进入下一环节'
          },
          {
            nodeType: '工程人员现场检查',
            nodeOrder: 2,
            result: InspectionResult.PASSED,
            handlerId: engineer.id,
            handledAt: new Date('2024-01-20'),
            remarks: '现场施工符合规范，水电改造合格'
          },
          {
            nodeType: '消防复核',
            nodeOrder: 3,
            result: InspectionResult.PASSED,
            handlerId: fireInspector.id,
            handledAt: new Date('2024-02-10'),
            remarks: '消防设施齐全，疏散通道畅通，验收通过'
          }
        ]
      },
      responsiblePersons: {
        create: [
          {
            name: '陈店长',
            role: '商户负责人',
            phone: '13900139001',
            email: 'starbucks@coffee.com'
          },
          {
            name: '赵施工',
            role: '施工负责人',
            phone: '13600136001'
          }
        ]
      }
    }
  })

  console.log('正常验收样本创建完成')

  const drawingsMissingApp = await prisma.application.create({
    data: {
      merchantId: merchants[1].id,
      shopUnitId: shopUnits[1].id,
      projectName: '优衣库2F-005店铺装修工程',
      status: ApplicationStatus.INVESTMENT_REVIEWED,
      constructionStart: new Date('2024-03-01'),
      constructionEnd: new Date('2024-04-15'),
      estimatedCost: 1200000,
      projectScope: '大面积服装店面装修，包含试衣间、收银台、展示区等',
      investmentManagerId: investmentManager.id,
      drawings: {
        create: [
          {
            name: '平面布置图',
            type: FileType.FLOOR_PLAN,
            fileUrl: '/drawings/uniqlo-floor.pdf',
            uploadedById: investmentManager.id,
            description: '初步平面布置图'
          }
        ]
      },
      inspectionNodes: {
        create: [
          {
            nodeType: '投资主管审核',
            nodeOrder: 1,
            result: InspectionResult.PASSED,
            handlerId: investmentManager.id,
            handledAt: new Date('2024-02-25'),
            remarks: '资料审核通过，进入工程检查环节'
          },
          {
            nodeType: '工程人员现场检查',
            nodeOrder: 2
          },
          {
            nodeType: '消防复核',
            nodeOrder: 3
          }
        ]
      },
      responsiblePersons: {
        create: [
          {
            name: '刘经理',
            role: '商户负责人',
            phone: '13900139002',
            email: 'uniqlo@fashion.com'
          }
        ]
      }
    }
  })

  console.log('图纸缺失样本创建完成 - 待工程检查')

  const timeConflictApp = await prisma.application.create({
    data: {
      merchantId: merchants[2].id,
      shopUnitId: shopUnits[2].id,
      projectName: '海底捞3F-012店铺装修工程',
      status: ApplicationStatus.INVESTMENT_REVIEWED,
      constructionStart: new Date('2024-03-10'),
      constructionEnd: new Date('2024-05-10'),
      estimatedCost: 2000000,
      projectScope: '大型餐饮店面装修，包含厨房设备安装、通风系统、用餐区装修',
      investmentManagerId: investmentManager.id,
      drawings: {
        create: [
          {
            name: '厨房布局图',
            type: FileType.FLOOR_PLAN,
            fileUrl: '/drawings/haidilao-kitchen.pdf',
            uploadedById: investmentManager.id
          }
        ]
      },
      inspectionNodes: {
        create: [
          {
            nodeType: '投资主管审核',
            nodeOrder: 1,
            result: InspectionResult.PASSED,
            handlerId: investmentManager.id,
            handledAt: new Date('2024-03-05'),
            remarks: '资料审核通过'
          },
          {
            nodeType: '工程人员现场检查',
            nodeOrder: 2
          },
          {
            nodeType: '消防复核',
            nodeOrder: 3
          }
        ]
      },
      responsiblePersons: {
        create: [
          {
            name: '周店长',
            role: '商户负责人',
            phone: '13900139003',
            email: 'haidilao@hotpot.com'
          }
        ]
      }
    }
  })

  await prisma.application.create({
    data: {
      merchantId: merchants[3].id,
      shopUnitId: shopUnits[2].id,
      projectName: '临时促销活动',
      status: ApplicationStatus.ENGINEER_INSPECTED,
      constructionStart: new Date('2024-03-15'),
      constructionEnd: new Date('2024-03-25'),
      estimatedCost: 50000,
      projectScope: '临时促销摊位搭建',
      investmentManagerId: investmentManager.id,
      inspectionNodes: {
        create: [
          {
            nodeType: '投资主管审核',
            nodeOrder: 1,
            result: InspectionResult.PASSED,
            handlerId: investmentManager.id,
            handledAt: new Date('2024-03-12')
          },
          {
            nodeType: '工程人员现场检查',
            nodeOrder: 2,
            result: InspectionResult.PASSED,
            handlerId: engineer.id,
            handledAt: new Date('2024-03-14')
          },
          {
            nodeType: '消防复核',
            nodeOrder: 3
          }
        ]
      }
    }
  })

  console.log('施工时间冲突样本创建完成')

  const rectificationApp = await prisma.application.create({
    data: {
      merchantId: merchants[3].id,
      shopUnitId: shopUnits[3].id,
      projectName: '苹果零售店1F-008装修工程',
      status: ApplicationStatus.ENGINEER_INSPECTED,
      constructionStart: new Date('2024-04-01'),
      constructionEnd: new Date('2024-05-01'),
      estimatedCost: 800000,
      projectScope: '高端数码零售店装修，包含展示台、体验区、售后服务区',
      investmentManagerId: investmentManager.id,
      drawings: {
        create: [
          {
            name: '店铺平面图',
            type: FileType.FLOOR_PLAN,
            fileUrl: '/drawings/apple-floor.pdf',
            uploadedById: investmentManager.id
          },
          {
            name: '消防设施图',
            type: FileType.FIRE_PLAN,
            fileUrl: '/drawings/apple-fire.pdf',
            uploadedById: investmentManager.id
          }
        ]
      },
      inspectionNodes: {
        create: [
          {
            nodeType: '投资主管审核',
            nodeOrder: 1,
            result: InspectionResult.PASSED,
            handlerId: investmentManager.id,
            handledAt: new Date('2024-03-28'),
            remarks: '资料齐全，审核通过'
          },
          {
            nodeType: '工程人员现场检查',
            nodeOrder: 2,
            result: InspectionResult.PASSED,
            handlerId: engineer.id,
            handledAt: new Date('2024-04-10'),
            remarks: '现场施工质量良好'
          },
          {
            nodeType: '消防复核',
            nodeOrder: 3,
            result: InspectionResult.NEEDS_RECTIFICATION,
            handlerId: fireInspector.id,
            handledAt: new Date('2024-04-25'),
            remarks: '消防验收需整改',
            rectificationDeadline: new Date('2024-05-05'),
            rectificationRequirements: '1. 紧急出口标识不明显，需增设夜光标识；2. 灭火器数量不足，需补充2具4kg干粉灭火器；3. 疏散通道宽度不足，需调整展柜位置'
          },
          {
            nodeType: '消防整改复核',
            nodeOrder: 4,
            rectificationRequirements: '1. 紧急出口标识不明显，需增设夜光标识；2. 灭火器数量不足，需补充2具4kg干粉灭火器；3. 疏散通道宽度不足，需调整展柜位置',
            rectificationDeadline: new Date('2024-05-05')
          }
        ]
      },
      responsiblePersons: {
        create: [
          {
            name: '吴经理',
            role: '商户负责人',
            phone: '13900139004',
            email: 'apple@tech.com'
          }
        ]
      }
    },
    include: { inspectionNodes: true }
  })

  await prisma.rectification.create({
    data: {
      inspectionNodeId: rectificationApp.inspectionNodes[2].id,
      description: '1. 紧急出口标识不明显，需增设夜光标识；2. 灭火器数量不足，需补充2具4kg干粉灭火器；3. 疏散通道宽度不足，需调整展柜位置'
    }
  })

  console.log('消防整改样本创建完成')
  console.log('所有数据播种完成！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
