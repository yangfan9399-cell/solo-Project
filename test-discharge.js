const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const hospId = 'hosp_2';
  
  // 查看住院状态
  const hosp = await prisma.hospitalization.findUnique({
    where: { id: hospId },
    include: { pet: true }
  });
  console.log('宠物:', hosp.pet.name);
  console.log('住院状态:', hosp.status);
  console.log('出院时间:', hosp.dischargeDate);
  console.log('异常类型:', hosp.anomalyType);
  
  // 查看费用状态
  const fees = await prisma.feeItem.findMany({
    where: { hospitalizationId: hospId },
    orderBy: { createdAt: 'asc' }
  });
  console.log('\n费用明细:');
  const statusCount = {};
  fees.forEach(f => {
    statusCount[f.status] = (statusCount[f.status] || 0) + 1;
    console.log('  ', f.name, '-', f.status, '-', Number(f.totalPrice));
  });
  
  console.log('\n费用状态统计:', statusCount);
  
  const settledTotal = fees
    .filter(f => f.status === 'SETTLED')
    .reduce((sum, f) => sum + Number(f.totalPrice), 0);
  console.log('已结算费用总额:', settledTotal);
  
  // 查看费用复核记录
  const reviews = await prisma.feeReview.findMany({
    where: { hospitalizationId: hospId },
    orderBy: { reviewedAt: 'desc' }
  });
  console.log('\n费用复核记录:', reviews.length, '条');
  reviews.forEach(r => {
    console.log('  ', r.isFinal ? '最终结算' : '临时复核', '- 应收:', Number(r.totalAmount), '- 实收:', Number(r.actualAmount));
  });
  
  await prisma.$disconnect();
}

test().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
