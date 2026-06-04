import fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient, ProcessStatus, QualityDecision, ReworkConclusion } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = fastify({ logger: true });

await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

const handoverSchema = z.object({
  workOrderId: z.string(),
  processId: z.string(),
  operatorId: z.string(),
  handoverNote: z.string().min(1),
  quantity: z.number().int().positive()
});

const qualitySchema = z.object({
  handoverId: z.string(),
  inspectorId: z.string(),
  decision: z.enum(['PASS', 'REJECT', 'ARCHIVE']),
  evidence: z.string().optional(),
  rejectReason: z.string().optional()
});

const reworkSubmitSchema = z.object({
  processId: z.string(),
  operatorId: z.string(),
  reworkReason: z.string().min(1),
  reworkMaterials: z.string().min(1),
  reworkNote: z.string().optional(),
  reworkConclusion: z.enum(['REPAIRED', 'SCRAPPED', 'CONCESSION']).optional()
});

const reworkCompleteSchema = z.object({
  reworkConclusion: z.enum(['REPAIRED', 'SCRAPPED', 'CONCESSION']),
  reworkNote: z.string().optional()
});

app.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.get('/api/users', async () => {
  return await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
});

app.get('/api/work-orders', async () => {
  const orders = await prisma.workOrder.findMany({
    include: {
      template: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
      processes: {
        include: {
          step: true,
          handoverRecords: {
            include: {
              operator: true,
              qualityInspection: { include: { inspector: true } }
            },
            orderBy: { handedOverAt: 'desc' }
          },
          reworkRecords: { include: { operator: true }, orderBy: { createdAt: 'desc' } }
        },
        orderBy: { stepNumber: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
});

app.get('/api/work-orders/:id', async (request) => {
  const { id } = request.params as { id: string };
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      template: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
      processes: {
        include: {
          step: true,
          handoverRecords: {
            include: {
              operator: true,
              qualityInspection: { include: { inspector: true } }
            },
            orderBy: { handedOverAt: 'desc' }
          },
          reworkRecords: { include: { operator: true }, orderBy: { createdAt: 'desc' } },
          qualityInspections: { include: { inspector: true }, orderBy: { inspectedAt: 'desc' } }
        },
        orderBy: { stepNumber: 'asc' }
      }
    }
  });
  if (!order) {
    return { statusCode: 404, error: 'Not Found', message: '工单不存在' };
  }
  return order;
});

app.post('/api/work-orders/:id/validate-archive', async (request) => {
  const { id } = request.params as { id: string };
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      template: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
      processes: {
        include: {
          step: true,
          handoverRecords: {
            include: { qualityInspection: true },
            orderBy: { handedOverAt: 'desc' }
          },
          reworkRecords: {
            where: { reworkConclusion: { not: null } },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { stepNumber: 'asc' }
      }
    }
  });

  if (!order) {
    return { valid: false, error: '工单不存在' };
  }

  const templateSteps = order.template.steps;
  const missingSteps: { stepNumber: number; name: string; department: string; resolvedByRework?: boolean; reworkConclusion?: string }[] = [];

  for (const step of templateSteps) {
    const process = order.processes.find(p => p.stepId === step.id);
    if (!process) {
      missingSteps.push({
        stepNumber: step.stepNumber,
        name: step.name,
        department: step.department
      });
      continue;
    }

    const lastHandover = process.handoverRecords[0];
    if (!lastHandover || !lastHandover.qualityInspection) {
      missingSteps.push({
        stepNumber: step.stepNumber,
        name: step.name,
        department: step.department
      });
      continue;
    }

    const qi = lastHandover.qualityInspection;
    if (qi.decision === QualityDecision.REJECT) {
      const hasCompletedRework = process.reworkRecords.length > 0;
      const lastRework = process.reworkRecords[0];
      const isProcessPassed = process.status === ProcessStatus.PASSED || process.status === ProcessStatus.ARCHIVED;

      if (hasCompletedRework && isProcessPassed && lastRework.reworkConclusion) {
        missingSteps.push({
          stepNumber: step.stepNumber,
          name: step.name,
          department: step.department,
          resolvedByRework: true,
          reworkConclusion: lastRework.reworkConclusion
        });
      } else {
        missingSteps.push({
          stepNumber: step.stepNumber,
          name: step.name,
          department: step.department
        });
      }
    }
  }

  const actualMissing = missingSteps.filter(s => !s.resolvedByRework);

  if (actualMissing.length > 0) {
    return {
      valid: false,
      error: '存在缺失的前序签收，无法归档',
      missingSteps: actualMissing,
      resolvedByRework: missingSteps.filter(s => s.resolvedByRework)
    };
  }

  return {
    valid: true,
    resolvedByRework: missingSteps.filter(s => s.resolvedByRework)
  };
});

app.post('/api/handover', async (request, reply) => {
  try {
    const body = handoverSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { id: body.operatorId } });
    if (!user || user.role !== 'OPERATOR') {
      return reply.status(403).send({ error: '只有操作员可以提交交接' });
    }

    const process = await prisma.workOrderProcess.findUnique({
      where: { id: body.processId },
      include: {
        workOrder: {
          include: {
            template: { include: { steps: { orderBy: { stepNumber: 'asc' } } } }
          }
        }
      }
    });

    if (!process) {
      return reply.status(404).send({ error: '工序不存在' });
    }

    const templateSteps = process.workOrder.template.steps;
    const currentStepIndex = templateSteps.findIndex(s => s.id === process.stepId);

    if (currentStepIndex > 0) {
      const prevStep = templateSteps[currentStepIndex - 1];
      const prevProcess = await prisma.workOrderProcess.findUnique({
        where: {
          workOrderId_stepId: {
            workOrderId: process.workOrderId,
            stepId: prevStep.id
          }
        },
        include: {
          handoverRecords: {
            include: { qualityInspection: true },
            orderBy: { handedOverAt: 'desc' },
            take: 1
          },
          reworkRecords: {
            where: { reworkConclusion: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!prevProcess) {
        return reply.status(400).send({
          error: '工序跳步检测到缺失前序签收',
          missingStep: {
            stepNumber: prevStep.stepNumber,
            name: prevStep.name,
            department: prevStep.department
          }
        });
      }

      const lastHandover = prevProcess.handoverRecords[0];
      if (!lastHandover || !lastHandover.qualityInspection) {
        return reply.status(400).send({
          error: '工序跳步检测到缺失前序签收',
          missingStep: {
            stepNumber: prevStep.stepNumber,
            name: prevStep.name,
            department: prevStep.department
          }
        });
      }

      if (lastHandover.qualityInspection.decision === QualityDecision.REJECT) {
        const hasCompletedRework = prevProcess.reworkRecords.length > 0;
        const lastRework = prevProcess.reworkRecords[0];
        const isPrevProcessPassed = prevProcess.status === ProcessStatus.PASSED || prevProcess.status === ProcessStatus.ARCHIVED;

        if (!(hasCompletedRework && isPrevProcessPassed && lastRework.reworkConclusion)) {
          return reply.status(400).send({
            error: '前序工序被质检退回且未完成返修，无法进行后续交接',
            rejectedStep: {
              stepNumber: prevStep.stepNumber,
              name: prevStep.name,
              department: prevStep.department
            }
          });
        }
      }
    }

    const handover = await prisma.handoverRecord.create({
      data: {
        ...body,
        handedOverAt: new Date()
      },
      include: { operator: true }
    });

    await prisma.workOrderProcess.update({
      where: { id: body.processId },
      data: {
        status: ProcessStatus.QUALITY_CHECK,
        completedAt: new Date()
      }
    });

    await prisma.workOrder.update({
      where: { id: body.workOrderId },
      data: { status: ProcessStatus.QUALITY_CHECK }
    });

    return handover;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.status(400).send({ error: '参数验证失败', details: e.errors });
    }
    throw e;
  }
});

app.post('/api/quality', async (request, reply) => {
  try {
    const body = qualitySchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { id: body.inspectorId } });
    if (!user || user.role !== 'QUALITY_INSPECTOR') {
      return reply.status(403).send({ error: '只有质检员可以执行质检操作' });
    }

    const handover = await prisma.handoverRecord.findUnique({
      where: { id: body.handoverId },
      include: { process: true }
    });

    if (!handover) {
      return reply.status(404).send({ error: '交接记录不存在' });
    }

    if (body.decision === 'ARCHIVE') {
      const validation = await app.inject({
        method: 'POST',
        url: `/api/work-orders/${handover.workOrderId}/validate-archive`
      });
      const result = validation.json();
      if (!result.valid) {
        return reply.status(400).send(result);
      }
    }

    const inspection = await prisma.qualityInspection.create({
      data: {
        handoverId: body.handoverId,
        inspectorId: body.inspectorId,
        processId: handover.processId,
        decision: body.decision as QualityDecision,
        evidence: body.evidence,
        rejectReason: body.rejectReason
      },
      include: { inspector: true }
    });

    let processStatus: ProcessStatus;
    let orderStatus: ProcessStatus;

    switch (body.decision) {
      case 'PASS':
        processStatus = ProcessStatus.PASSED;
        orderStatus = ProcessStatus.IN_PROGRESS;
        break;
      case 'REJECT':
        processStatus = ProcessStatus.REWORKING;
        orderStatus = ProcessStatus.REWORKING;
        break;
      case 'ARCHIVE':
        processStatus = ProcessStatus.ARCHIVED;
        orderStatus = ProcessStatus.ARCHIVED;
        break;
      default:
        processStatus = ProcessStatus.PASSED;
        orderStatus = ProcessStatus.IN_PROGRESS;
    }

    await prisma.workOrderProcess.update({
      where: { id: handover.processId },
      data: { status: processStatus }
    });

    await prisma.workOrder.update({
      where: { id: handover.workOrderId },
      data: { status: orderStatus }
    });

    return inspection;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.status(400).send({ error: '参数验证失败', details: e.errors });
    }
    throw e;
  }
});

app.post('/api/rework', async (request, reply) => {
  try {
    const body = reworkSubmitSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { id: body.operatorId } });
    if (!user || user.role !== 'OPERATOR') {
      return reply.status(403).send({ error: '只有操作员可以提交返修' });
    }

    const rework = await prisma.reworkRecord.create({
      data: {
        processId: body.processId,
        operatorId: body.operatorId,
        reworkReason: body.reworkReason,
        reworkMaterials: body.reworkMaterials,
        reworkNote: body.reworkNote,
        reworkConclusion: body.reworkConclusion as ReworkConclusion | undefined,
        startTime: new Date(),
        endTime: body.reworkConclusion ? new Date() : null
      },
      include: { operator: true }
    });

    if (!body.reworkConclusion) {
      await prisma.workOrderProcess.update({
        where: { id: body.processId },
        data: { status: ProcessStatus.REWORKING }
      });
    } else {
      let newProcessStatus: ProcessStatus;
      switch (body.reworkConclusion) {
        case 'REPAIRED':
          newProcessStatus = ProcessStatus.IN_PROGRESS;
          break;
        case 'SCRAPPED':
          newProcessStatus = ProcessStatus.PASSED;
          break;
        case 'CONCESSION':
          newProcessStatus = ProcessStatus.PASSED;
          break;
        default:
          newProcessStatus = ProcessStatus.IN_PROGRESS;
      }

      await prisma.workOrderProcess.update({
        where: { id: body.processId },
        data: { status: newProcessStatus }
      });

      const process = await prisma.workOrderProcess.findUnique({
        where: { id: body.processId }
      });
      if (process) {
        await prisma.workOrder.update({
          where: { id: process.workOrderId },
          data: { status: ProcessStatus.IN_PROGRESS }
        });
      }
    }

    return rework;
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.status(400).send({ error: '参数验证失败', details: e.errors });
    }
    throw e;
  }
});

app.put('/api/rework/:id/complete', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const body = reworkCompleteSchema.parse(request.body);

    const rework = await prisma.reworkRecord.findUnique({ where: { id } });
    if (!rework) {
      return reply.status(404).send({ error: '返修记录不存在' });
    }

    const updated = await prisma.reworkRecord.update({
      where: { id },
      data: {
        reworkConclusion: body.reworkConclusion as ReworkConclusion,
        reworkNote: body.reworkNote,
        endTime: new Date()
      },
      include: { operator: true }
    });

    let newProcessStatus: ProcessStatus;
    switch (body.reworkConclusion) {
      case 'REPAIRED':
        newProcessStatus = ProcessStatus.IN_PROGRESS;
        break;
      case 'SCRAPPED':
        newProcessStatus = ProcessStatus.PASSED;
        break;
      case 'CONCESSION':
        newProcessStatus = ProcessStatus.PASSED;
        break;
      default:
        newProcessStatus = ProcessStatus.IN_PROGRESS;
    }

    await prisma.workOrderProcess.update({
      where: { id: rework.processId },
      data: { status: newProcessStatus }
    });

    const process = await prisma.workOrderProcess.findUnique({
      where: { id: rework.processId }
    });
    if (process) {
      await prisma.workOrder.update({
        where: { id: process.workOrderId },
        data: { status: ProcessStatus.IN_PROGRESS }
      });
    }

    return {
      ...updated,
      processStatus: newProcessStatus,
      conclusionSummary: {
        REPAIRED: '返修合格，工序恢复进行中，可重新提交交接',
        SCRAPPED: '报废处理，零件已剔除并补投，工序视为完成',
        CONCESSION: '让步接收，偏差经特批认可，工序视为通过'
      }[body.reworkConclusion]
    };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return reply.status(400).send({ error: '参数验证失败', details: e.errors });
    }
    throw e;
  }
});

app.get('/api/statistics/overview', async () => {
  const totalOrders = await prisma.workOrder.count();
  const archivedOrders = await prisma.workOrder.count({ where: { status: ProcessStatus.ARCHIVED } });
  const inProgressOrders = await prisma.workOrder.count({ where: { status: ProcessStatus.IN_PROGRESS } });
  const reworkingOrders = await prisma.workOrder.count({ where: { status: ProcessStatus.REWORKING } });

  const totalReworks = await prisma.reworkRecord.count();
  const completedReworks = await prisma.reworkRecord.count({ where: { reworkConclusion: { not: null } } });

  return {
    workOrders: {
      total: totalOrders,
      archived: archivedOrders,
      inProgress: inProgressOrders,
      reworking: reworkingOrders
    },
    reworks: {
      total: totalReworks,
      completed: completedReworks,
      pending: totalReworks - completedReworks
    }
  };
});

app.get('/api/statistics/rework-by-reason', async () => {
  const reworks = await prisma.reworkRecord.findMany({
    where: { reworkConclusion: { not: null } },
    include: { process: { include: { step: true } } }
  });

  const reasonMap = new Map<string, { count: number; totalHours: number; processes: any[] }>();

  for (const r of reworks) {
    const key = r.reworkReason;
    const hours = r.endTime && r.startTime
      ? (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
      : 0;

    if (!reasonMap.has(key)) {
      reasonMap.set(key, { count: 0, totalHours: 0, processes: [] });
    }
    const entry = reasonMap.get(key)!;
    entry.count++;
    entry.totalHours += hours;
    entry.processes.push({
      id: r.id,
      stepName: r.process.step.name,
      conclusion: r.reworkConclusion,
      hours: parseFloat(hours.toFixed(2))
    });
  }

  return Array.from(reasonMap.entries()).map(([reason, data]) => ({
    reason,
    count: data.count,
    avgHours: parseFloat((data.totalHours / data.count).toFixed(2)),
    totalHours: parseFloat(data.totalHours.toFixed(2)),
    details: data.processes
  })).sort((a, b) => b.count - a.count);
});

app.get('/api/statistics/rework-by-department', async () => {
  const reworks = await prisma.reworkRecord.findMany({
    where: { reworkConclusion: { not: null } },
    include: {
      process: { include: { step: true } },
      operator: true
    }
  });

  const deptMap = new Map<string, { count: number; totalHours: number; operators: Set<string> }>();

  for (const r of reworks) {
    const key = r.process.step.department;
    const hours = r.endTime && r.startTime
      ? (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
      : 0;

    if (!deptMap.has(key)) {
      deptMap.set(key, { count: 0, totalHours: 0, operators: new Set() });
    }
    const entry = deptMap.get(key)!;
    entry.count++;
    entry.totalHours += hours;
    entry.operators.add(r.operator.name);
  }

  return Array.from(deptMap.entries()).map(([department, data]) => ({
    department,
    count: data.count,
    avgHours: parseFloat((data.totalHours / data.count).toFixed(2)),
    totalHours: parseFloat(data.totalHours.toFixed(2)),
    involvedOperators: Array.from(data.operators)
  })).sort((a, b) => b.count - a.count);
});

app.get('/api/statistics/rework-by-conclusion', async () => {
  const reworks = await prisma.reworkRecord.findMany({
    where: { reworkConclusion: { not: null } },
    include: { process: { include: { step: true, workOrder: true } } }
  });

  const conclusionMap = new Map<string, { count: number; processes: any[] }>();

  for (const r of reworks) {
    const key = r.reworkConclusion!;
    if (!conclusionMap.has(key)) {
      conclusionMap.set(key, { count: 0, processes: [] });
    }
    const entry = conclusionMap.get(key)!;
    entry.count++;
    entry.processes.push({
      id: r.id,
      orderNo: r.process.workOrder.orderNo,
      stepName: r.process.step.name,
      reason: r.reworkReason
    });
  }

  return Array.from(conclusionMap.entries()).map(([conclusion, data]) => ({
    conclusion,
    count: data.count,
    details: data.processes
  }));
});

app.get('/api/statistics/repeat-reworks', async () => {
  const reworks = await prisma.reworkRecord.findMany({
    include: {
      process: {
        include: {
          step: true,
          workOrder: true,
          reworkRecords: true
        }
      }
    }
  });

  const processMap = new Map<string, { process: any; count: number; reworks: any[] }>();

  for (const r of reworks) {
    const key = r.processId;
    if (!processMap.has(key)) {
      processMap.set(key, {
        process: r.process,
        count: r.process.reworkRecords.length,
        reworks: []
      });
    }
    processMap.get(key)!.reworks.push(r);
  }

  return Array.from(processMap.values())
    .filter(p => p.count >= 2)
    .map(p => ({
      processId: p.process.id,
      orderNo: p.process.workOrder.orderNo,
      stepName: p.process.step.name,
      department: p.process.step.department,
      reworkCount: p.count,
      reworks: p.reworks.map(r => ({
        id: r.id,
        reason: r.reworkReason,
        conclusion: r.reworkConclusion,
        operatorName: r.operatorId
      }))
    }))
    .sort((a, b) => b.reworkCount - a.reworkCount);
});

app.get('/api/statistics/rework-time-distribution', async () => {
  const reworks = await prisma.reworkRecord.findMany({
    where: { reworkConclusion: { not: null } },
    include: { process: { include: { step: true } } }
  });

  const stepMap = new Map<string, { step: any; totalHours: number; count: number }>();

  for (const r of reworks) {
    const key = r.process.step.name;
    const hours = r.endTime && r.startTime
      ? (r.endTime.getTime() - r.startTime.getTime()) / (1000 * 60 * 60)
      : 0;

    if (!stepMap.has(key)) {
      stepMap.set(key, { step: r.process.step, totalHours: 0, count: 0 });
    }
    const entry = stepMap.get(key)!;
    entry.count++;
    entry.totalHours += hours;
  }

  return Array.from(stepMap.values()).map(d => ({
    stepName: d.step.name,
    department: d.step.department,
    count: d.count,
    totalHours: parseFloat(d.totalHours.toFixed(2)),
    avgHours: parseFloat((d.totalHours / d.count).toFixed(2))
  })).sort((a, b) => b.totalHours - a.totalHours);
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
