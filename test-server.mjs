import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();
const port = 3002;

app.use(express.json());

app.get('/api/verify', async (req, res) => {
  const returnPendingApplications = await prisma.borrowApplication.findMany({
    where: { status: 'RETURN_PENDING' },
    orderBy: { endTime: 'asc' },
    include: {
      classroom: { include: { campus: true } },
      handovers: true,
    },
  });
  res.json({ returnPendingApplications });
});

app.get('/api/equipment', async (req, res) => {
  const approvedApplications = await prisma.borrowApplication.findMany({
    where: { status: 'APPROVED' },
    orderBy: { createdAt: 'asc' },
    include: {
      classroom: { include: { campus: true } },
      handovers: true,
    },
  });
  res.json({ approvedApplications });
});

app.get('/api/applications/:id', async (req, res) => {
  const application = await prisma.borrowApplication.findUnique({
    where: { id: req.params.id },
    include: {
      classroom: { include: { campus: true } },
      handovers: true,
      history: { orderBy: { timestamp: 'desc' } },
    },
  });
  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }
  res.json(application);
});

app.post('/api/handover/:id', async (req, res) => {
  const { handlerName, equipmentIds } = req.body;
  
  const application = await prisma.borrowApplication.findUnique({
    where: { id: req.params.id },
    include: { classroom: true },
  });

  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  const equipment = await prisma.equipment.findMany({
    where: { classroomId: application.classroomId },
  });

  const selectedEquipment = equipment.filter(eq => equipmentIds.includes(eq.id));

  if (selectedEquipment.length === 0) {
    return res.status(400).json({ error: '请至少选择一个设备进行交接' });
  }

  for (const eq of selectedEquipment) {
    await prisma.equipmentHandover.create({
      data: {
        applicationId: req.params.id,
        equipmentName: eq.name,
        quantity: eq.quantity,
        handoverTime: new Date(),
        handlerName: handlerName,
      },
    });

    await prisma.equipment.update({
      where: { id: eq.id },
      data: { status: 'IN_USE' },
    });
  }

  await prisma.borrowApplication.update({
    where: { id: req.params.id },
    data: { status: 'RETURN_PENDING' },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId: req.params.id,
      action: 'EQUIPMENT_HANDED_OVER',
      actor: handlerName,
      timestamp: new Date(),
      note: `交接设备: ${selectedEquipment.map((e) => e.name).join(', ')}`,
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId: req.params.id,
      action: 'RETURN_PENDING',
      actor: '系统',
      timestamp: new Date(),
      note: '设备已交接，待归还核验',
    },
  });

  res.json({ message: '交接成功', status: 'RETURN_PENDING' });
});

app.post('/api/verify/:id', async (req, res) => {
  const { verifierName, cleaningStatus, abnormalReason } = req.body;

  const application = await prisma.borrowApplication.findUnique({
    where: { id: req.params.id },
    include: { handovers: true },
  });

  if (!application) {
    return res.status(404).json({ error: '申请不存在' });
  }

  await prisma.returnVerification.create({
    data: {
      applicationId: req.params.id,
      cleaningStatus: cleaningStatus,
      abnormalReason: abnormalReason || null,
      verifierName: verifierName,
      verifiedAt: new Date(),
    },
  });

  await prisma.borrowApplication.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED' },
  });

  for (const handover of application.handovers) {
    await prisma.equipment.updateMany({
      where: { name: handover.equipmentName, classroomId: application.classroomId },
      data: { status: 'AVAILABLE' },
    });
  }

  await prisma.applicationHistory.create({
    data: {
      applicationId: req.params.id,
      action: 'COMPLETED',
      actor: verifierName,
      timestamp: new Date(),
      note: abnormalReason ? `归还核验完成，异常: ${abnormalReason}` : '归还核验完成',
    },
  });

  res.json({ message: '核验完成', status: 'COMPLETED' });
});

app.get('/api/debug/app005', async (req, res) => {
  const app005 = await prisma.borrowApplication.findUnique({
    where: { id: 'APP005' },
    include: {
      classroom: true,
      handovers: true,
      history: { orderBy: { timestamp: 'desc' } },
    },
  });
  res.json(app005);
});

app.get('/api/debug/status-counts', async (req, res) => {
  const counts = await prisma.borrowApplication.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  res.json(counts);
});

app.listen(port, () => {
  console.log(`测试服务器运行在 http://localhost:${port}`);
  console.log('可用接口:');
  console.log('  GET  /api/verify        - 查看待归还核验列表');
  console.log('  GET  /api/equipment     - 查看待交接申请');
  console.log('  GET  /api/applications/:id - 查看申请详情');
  console.log('  POST /api/handover/:id  - 执行设备交接');
  console.log('  POST /api/verify/:id    - 执行归还核验');
  console.log('  GET  /api/debug/app005  - 查看 APP005 状态');
  console.log('  GET  /api/debug/status-counts - 查看状态分布');
});