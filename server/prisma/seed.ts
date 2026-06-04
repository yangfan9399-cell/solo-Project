import { PrismaClient, UserRole, ProcessStatus, QualityDecision, ReworkConclusion } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.reworkRecord.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.handoverRecord.deleteMany();
  await prisma.workOrderProcess.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.processStep.deleteMany();
  await prisma.processTemplate.deleteMany();
  await prisma.user.deleteMany();

  const op1 = await prisma.user.create({
    data: { name: '张明', role: UserRole.OPERATOR, badgeNo: 'OP001' }
  });
  const op2 = await prisma.user.create({
    data: { name: '李华', role: UserRole.OPERATOR, badgeNo: 'OP002' }
  });
  const op3 = await prisma.user.create({
    data: { name: '王强', role: UserRole.OPERATOR, badgeNo: 'OP003' }
  });
  const op4 = await prisma.user.create({
    data: { name: '赵刚', role: UserRole.OPERATOR, badgeNo: 'OP004' }
  });
  const qi1 = await prisma.user.create({
    data: { name: '陈检', role: UserRole.QUALITY_INSPECTOR, badgeNo: 'QI001' }
  });
  const qi2 = await prisma.user.create({
    data: { name: '刘质检', role: UserRole.QUALITY_INSPECTOR, badgeNo: 'QI002' }
  });

  const template = await prisma.processTemplate.create({
    data: {
      name: '汽车零部件加工流程',
      productName: '变速箱壳体',
      version: 'V2.1',
      steps: {
        create: [
          { stepNumber: 1, name: '毛坯下料', department: '下料车间', description: '铝合金铸锭切割成标准尺寸' },
          { stepNumber: 2, name: '数控铣削', department: '机加工一车间', description: 'CNC五轴加工中心精铣外形' },
          { stepNumber: 3, name: '精密钻孔', department: '机加工二车间', description: '12个安装孔位钻铰加工' },
          { stepNumber: 4, name: '热处理', department: '热处理车间', description: 'T6时效处理，硬度HB120-140' },
          { stepNumber: 5, name: '表面处理', department: '涂装车间', description: '阳极氧化+喷粉' },
          { stepNumber: 6, name: '最终检验', department: '质检中心', description: '三坐标检测+气密性测试' }
        ]
      }
    },
    include: { steps: true }
  });

  const steps = template.steps.sort((a, b) => a.stepNumber - b.stepNumber);

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  await createNormalFlowOrder(steps, op1, op2, op3, op4, qi1, template, hoursAgo);
  await createRejectReworkOrder(steps, op1, op2, qi1, qi2, template, hoursAgo);
  await createSkipStepOrder(steps, op1, op3, template, hoursAgo);
  await createMultipleReworkOrder(steps, op2, op3, op4, qi1, qi2, template, hoursAgo);
  await createMixedConclusionOrder(steps, op1, op2, op3, qi1, qi2, template, hoursAgo);

  console.log('Seed data created successfully!');
}

async function createNormalFlowOrder(steps: any[], op1: any, op2: any, op3: any, op4: any, qi1: any, template: any, hoursAgo: (h: number) => Date) {
  const order = await prisma.workOrder.create({
    data: {
      orderNo: 'WO-2026-0601-001',
      productName: '变速箱壳体',
      quantity: 50,
      templateId: template.id,
      status: ProcessStatus.ARCHIVED
    }
  });

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const process = await prisma.workOrderProcess.create({
      data: {
        workOrderId: order.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        status: i === steps.length - 1 ? ProcessStatus.ARCHIVED : ProcessStatus.PASSED,
        startedAt: hoursAgo(72 - i * 12),
        completedAt: hoursAgo(72 - i * 12 - 6)
      }
    });

    if (i < steps.length) {
      const operator = i % 2 === 0 ? op1 : op2;
      const handover = await prisma.handoverRecord.create({
        data: {
          workOrderId: order.id,
          processId: process.id,
          operatorId: operator.id,
          handoverNote: `工序${step.stepNumber}-${step.name}完成，共${order.quantity}件，尺寸合格，表面无缺陷`,
          quantity: order.quantity,
          handedOverAt: hoursAgo(72 - i * 12 - 5)
        }
      });

      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi1.id,
          processId: process.id,
          decision: i === steps.length - 1 ? QualityDecision.ARCHIVE : QualityDecision.PASS,
          evidence: `抽检5件，关键尺寸CPK=1.45，符合图纸要求\n检测报告编号：QC-${20260601 + i}`,
          inspectedAt: hoursAgo(72 - i * 12 - 4)
        }
      });
    }
  }
}

async function createRejectReworkOrder(steps: any[], op1: any, op2: any, qi1: any, qi2: any, template: any, hoursAgo: (h: number) => Date) {
  const order = await prisma.workOrder.create({
    data: {
      orderNo: 'WO-2026-0601-002',
      productName: '变速箱壳体',
      quantity: 30,
      templateId: template.id,
      status: ProcessStatus.IN_PROGRESS
    }
  });

  for (let i = 0; i < 3; i++) {
    const step = steps[i];
    const status = i < 2 ? ProcessStatus.PASSED : ProcessStatus.REWORKING;
    const process = await prisma.workOrderProcess.create({
      data: {
        workOrderId: order.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        status,
        startedAt: hoursAgo(48 - i * 8),
        completedAt: i < 2 ? hoursAgo(48 - i * 8 - 4) : null
      }
    });

    const operator = i === 0 ? op1 : op2;
    const handover = await prisma.handoverRecord.create({
      data: {
        workOrderId: order.id,
        processId: process.id,
        operatorId: operator.id,
        handoverNote: i < 2
          ? `工序${step.stepNumber}-${step.name}完成，共${order.quantity}件`
          : `工序3-精密钻孔完成，共${order.quantity}件，但发现孔位偏差异常`,
        quantity: order.quantity,
        handedOverAt: hoursAgo(48 - i * 8 - 3)
      }
    });

    if (i === 2) {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi1.id,
          processId: process.id,
          decision: QualityDecision.REJECT,
          rejectReason: '孔位偏移超出公差0.08mm，不符合图纸要求\n三坐标检测显示8件超差',
          evidence: '检测报告编号：QC-20260602-003\n超差零件编号：P017-P024',
          inspectedAt: hoursAgo(48 - i * 8 - 2)
        }
      });

      await prisma.reworkRecord.create({
        data: {
          processId: process.id,
          operatorId: op2.id,
          reworkReason: '孔位偏移0.08mm，需重新定位镗孔',
          reworkMaterials: '专用镗刀1把、定位夹具1套、冷却液5L',
          startTime: hoursAgo(20),
          reworkNote: '重新找正基准，使用专用镗刀修正孔位',
          reworkConclusion: null
        }
      });
    } else {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi2.id,
          processId: process.id,
          decision: QualityDecision.PASS,
          evidence: `抽检合格，CPK>1.33\n检测报告编号：QC-20260602-00${i + 1}`,
          inspectedAt: hoursAgo(48 - i * 8 - 2)
        }
      });
    }
  }
}

async function createSkipStepOrder(steps: any[], op1: any, op3: any, template: any, hoursAgo: (h: number) => Date) {
  const order = await prisma.workOrder.create({
    data: {
      orderNo: 'WO-2026-0601-003',
      productName: '变速箱壳体',
      quantity: 20,
      templateId: template.id,
      status: ProcessStatus.QUALITY_CHECK
    }
  });

  for (let i = 0; i < 4; i++) {
    const step = steps[i];
    if (i === 2) continue;
    const process = await prisma.workOrderProcess.create({
      data: {
        workOrderId: order.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        status: i === 3 ? ProcessStatus.QUALITY_CHECK : ProcessStatus.PASSED,
        startedAt: hoursAgo(36 - i * 6),
        completedAt: i < 3 ? hoursAgo(36 - i * 6 - 3) : null
      }
    });

    const handover = await prisma.handoverRecord.create({
      data: {
        workOrderId: order.id,
        processId: process.id,
        operatorId: i < 2 ? op1 : op3,
        handoverNote: `工序${step.stepNumber}-${step.name}完成，共${order.quantity}件`,
        quantity: order.quantity,
        handedOverAt: hoursAgo(36 - i * 6 - 2)
      }
    });

    if (i < 3) {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: (await prisma.user.findFirst({ where: { role: UserRole.QUALITY_INSPECTOR } }))!.id,
          processId: process.id,
          decision: QualityDecision.PASS,
          evidence: '抽检合格',
          inspectedAt: hoursAgo(36 - i * 6 - 1)
        }
      });
    }
  }
}

async function createMultipleReworkOrder(steps: any[], op2: any, op3: any, op4: any, qi1: any, qi2: any, template: any, hoursAgo: (h: number) => Date) {
  const order = await prisma.workOrder.create({
    data: {
      orderNo: 'WO-2026-0601-004',
      productName: '变速箱壳体',
      quantity: 40,
      templateId: template.id,
      status: ProcessStatus.PASSED
    }
  });

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isReworkStep = i === 1;
    const process = await prisma.workOrderProcess.create({
      data: {
        workOrderId: order.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        status: ProcessStatus.PASSED,
        startedAt: hoursAgo(96 - i * 16),
        completedAt: hoursAgo(96 - i * 16 - 10)
      }
    });

    const handover = await prisma.handoverRecord.create({
      data: {
        workOrderId: order.id,
        processId: process.id,
        operatorId: i % 2 === 0 ? op2 : op3,
        handoverNote: isReworkStep
          ? '工序2-数控铣削，首次加工后发现表面粗糙度不达标，经两次返修后合格'
          : `工序${step.stepNumber}-${step.name}完成，共${order.quantity}件`,
        quantity: order.quantity,
        handedOverAt: hoursAgo(96 - i * 16 - 8)
      }
    });

    if (isReworkStep) {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi1.id,
          processId: process.id,
          decision: QualityDecision.PASS,
          evidence: '经过两次返修后，表面粗糙度Ra从6.3提升至1.6，符合要求\n最终检测报告：QC-20260601-015',
          inspectedAt: hoursAgo(96 - i * 16 - 6)
        }
      });

      await prisma.reworkRecord.create({
        data: {
          processId: process.id,
          operatorId: op3.id,
          reworkReason: '首次加工表面粗糙度Ra=6.3，要求Ra<=1.6',
          reworkMaterials: '金刚石砂轮1片、抛光膏1支、防锈油2L',
          reworkConclusion: ReworkConclusion.REPAIRED,
          reworkNote: '粗磨→半精磨→精磨→抛光，更换刀具参数，降低进给量',
          startTime: hoursAgo(80),
          endTime: hoursAgo(72)
        }
      });

      await prisma.reworkRecord.create({
        data: {
          processId: process.id,
          operatorId: op4.id,
          reworkReason: '第一次返修后仍有3件Ra=2.1，需再次精抛',
          reworkMaterials: '超细抛光布1张、金刚石研磨膏1支',
          reworkConclusion: ReworkConclusion.REPAIRED,
          reworkNote: '针对3件超差零件进行手工精抛，达到图纸要求',
          startTime: hoursAgo(70),
          endTime: hoursAgo(66)
        }
      });
    } else {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi2.id,
          processId: process.id,
          decision: i === steps.length - 1 ? QualityDecision.ARCHIVE : QualityDecision.PASS,
          evidence: `检测合格，报告编号：QC-20260601-0${10 + i}`,
          inspectedAt: hoursAgo(96 - i * 16 - 6)
        }
      });
    }
  }
}

async function createMixedConclusionOrder(steps: any[], op1: any, op2: any, op3: any, qi1: any, qi2: any, template: any, hoursAgo: (h: number) => Date) {
  const order = await prisma.workOrder.create({
    data: {
      orderNo: 'WO-2026-0601-005',
      productName: '变速箱壳体',
      quantity: 25,
      templateId: template.id,
      status: ProcessStatus.PASSED
    }
  });

  for (let i = 0; i < 4; i++) {
    const step = steps[i];
    const isScrapStep = i === 2;
    const isConcessionStep = i === 3;
    const process = await prisma.workOrderProcess.create({
      data: {
        workOrderId: order.id,
        stepId: step.id,
        stepNumber: step.stepNumber,
        status: ProcessStatus.PASSED,
        startedAt: hoursAgo(60 - i * 12),
        completedAt: hoursAgo(60 - i * 12 - 6)
      }
    });

    const operator = i === 0 ? op1 : i === 1 ? op2 : op3;
    const handover = await prisma.handoverRecord.create({
      data: {
        workOrderId: order.id,
        processId: process.id,
        operatorId: operator.id,
        handoverNote: isScrapStep
          ? `工序3-精密钻孔完成，2件孔位严重偏移无法返修，已报废`
          : isConcessionStep
            ? `工序4-热处理完成，3件硬度偏下限HB118，申请让步接收`
            : `工序${step.stepNumber}-${step.name}完成，共${order.quantity}件`,
        quantity: isScrapStep ? order.quantity - 2 : isConcessionStep ? order.quantity - 3 : order.quantity,
        handedOverAt: hoursAgo(60 - i * 12 - 5)
      }
    });

    if (isScrapStep) {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi1.id,
          processId: process.id,
          decision: QualityDecision.REJECT,
          rejectReason: '2件孔位偏移超过0.2mm，超出返修能力范围\n零件编号：P003、P009',
          evidence: '三坐标检测报告：QC-20260603-SCR\n偏移量分别为0.23mm和0.25mm',
          inspectedAt: hoursAgo(60 - i * 12 - 4)
        }
      });

      await prisma.reworkRecord.create({
        data: {
          processId: process.id,
          operatorId: op2.id,
          reworkReason: '2件孔位偏移超差0.2mm以上，尝试返修',
          reworkMaterials: '备用铸锭2件、专用钻模1套',
          reworkConclusion: ReworkConclusion.SCRAPPED,
          reworkNote: '尝试重新钻孔，但基准面已损伤无法修复，判定报废并补投2件毛坯重新加工',
          startTime: hoursAgo(40),
          endTime: hoursAgo(36)
        }
      });
    } else if (isConcessionStep) {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi2.id,
          processId: process.id,
          decision: QualityDecision.PASS,
          evidence: '3件硬度HB118，低于标准下限HB120但仅差2个单位\n技术评审意见：不影响使用安全',
          inspectedAt: hoursAgo(60 - i * 12 - 4)
        }
      });

      await prisma.reworkRecord.create({
        data: {
          processId: process.id,
          operatorId: op3.id,
          reworkReason: '3件T6时效后硬度偏下限HB118（标准HB120-140）',
          reworkMaterials: '回火炉工时2小时、硬度计检测3次',
          reworkConclusion: ReworkConclusion.CONCESSION,
          reworkNote: '经技术评审，HB118虽低于标准2个单位，但不影响装配强度和使用安全，经总工批准让步接收',
          startTime: hoursAgo(30),
          endTime: hoursAgo(28)
        }
      });
    } else {
      await prisma.qualityInspection.create({
        data: {
          handoverId: handover.id,
          inspectorId: qi1.id,
          processId: process.id,
          decision: QualityDecision.PASS,
          evidence: `抽检合格，报告编号：QC-20260603-0${i + 1}`,
          inspectedAt: hoursAgo(60 - i * 12 - 4)
        }
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
