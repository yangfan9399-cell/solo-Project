const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyWorkflow() {
  console.log('=== 业务流程验证 ===\n');

  console.log('1. 查询待交接申请 (APPROVED 状态):');
  const approvedApps = await prisma.borrowApplication.findMany({
    where: { status: 'APPROVED' },
    include: { classroom: true },
  });
  console.log(`   待交接申请数量: ${approvedApps.length}`);
  approvedApps.forEach(app => {
    console.log(`   - ${app.id}: ${app.classroom.name} - ${app.applicantName}`);
  });

  console.log('\n2. 查询待归还核验申请 (RETURN_PENDING 状态):');
  const returnPendingApps = await prisma.borrowApplication.findMany({
    where: { status: 'RETURN_PENDING' },
    include: { classroom: true, handovers: true },
  });
  console.log(`   待归还核验申请数量: ${returnPendingApps.length}`);
  returnPendingApps.forEach(app => {
    console.log(`   - ${app.id}: ${app.classroom.name} - ${app.applicantName}`);
    if (app.handovers.length > 0) {
      console.log(`     已交接设备: ${app.handovers.map(h => `${h.equipmentName} x${h.quantity}`).join(', ')}`);
    }
  });

  console.log('\n3. 检查 APP005 状态:');
  const app005 = await prisma.borrowApplication.findUnique({
    where: { id: 'APP005' },
    include: { classroom: true, handovers: true },
  });
  if (app005) {
    console.log(`   APP005 状态: ${app005.status}`);
    console.log(`   教室: ${app005.classroom.name}`);
    console.log(`   申请人: ${app005.applicantName}`);
    console.log(`   是否在归还核验列表: ${app005.status === 'RETURN_PENDING' ? '是 ✓' : '否'}`);
  } else {
    console.log('   APP005 不存在');
  }

  console.log('\n4. 检查所有申请状态分布:');
  const statusCounts = await prisma.borrowApplication.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  statusCounts.forEach(status => {
    const statusLabels = {
      PENDING: '待审批',
      APPROVED: '已审批',
      REJECTED: '已拒绝',
      IN_USE: '使用中',
      RETURN_PENDING: '待归还',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    };
    console.log(`   ${statusLabels[status.status] || status.status}: ${status._count.id} 个`);
  });

  await prisma.$disconnect();
}

verifyWorkflow().catch(console.error);