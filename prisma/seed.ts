import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stationStaff = await prisma.user.create({
    data: {
      name: '张三',
      role: 'STATION_STAFF',
      username: 'station1',
      password: '123456',
    },
  });

  const customerService = await prisma.user.create({
    data: {
      name: '李四',
      role: 'CUSTOMER_SERVICE',
      username: 'cs1',
      password: '123456',
    },
  });

  const dutyManager = await prisma.user.create({
    data: {
      name: '王五',
      role: 'DUTY_MANAGER',
      username: 'manager1',
      password: '123456',
    },
  });

  const auditor = await prisma.user.create({
    data: {
      name: '赵六',
      role: 'AUDITOR',
      username: 'auditor1',
      password: '123456',
    },
  });

  const normalClaimItem = await prisma.lostItem.create({
    data: {
      name: '苹果iPhone 15 Pro',
      category: 'ELECTRONICS',
      description: '黑色，128GB，屏幕有轻微划痕',
      foundLocation: '1号线人民广场站站台A区',
      lockerNumber: 'A-001',
      isValuable: true,
      estimatedValue: 7999,
      foundAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'RETURNED',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  await prisma.claimRequest.create({
    data: {
      itemId: normalClaimItem.id,
      claimantName: '小明',
      claimantPhone: '13800138001',
      claimantIdCard: '310101199001011234',
      description: '本人于3天前在人民广场站遗失手机',
      verified: true,
      verificationNote: '身份证信息匹配，手机特征描述准确',
      verifiedBy: '李四',
      verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historyRecord.createMany({
    data: [
      {
        itemId: normalClaimItem.id,
        action: '拾获登记',
        operatorName: '张三',
        operatorUserId: stationStaff.id,
        notes: '站务员张三在站台拾获手机一部',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: normalClaimItem.id,
        action: '认领申请',
        operatorName: '小明',
        operatorUserId: stationStaff.id,
        notes: '用户小明提交认领申请',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: normalClaimItem.id,
        action: '材料核验通过',
        operatorName: '李四',
        operatorUserId: customerService.id,
        notes: '身份证和描述信息一致',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: normalClaimItem.id,
        action: '确认交还',
        operatorName: '王五',
        operatorUserId: dutyManager.id,
        notes: '已当面交还给失主小明',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const valuableItem = await prisma.lostItem.create({
    data: {
      name: '劳力士手表',
      category: 'JEWELRY',
      description: '金色表带，表盘直径40mm，有证书编号ROLEX-12345',
      foundLocation: '2号线静安寺站客服中心',
      lockerNumber: 'B-001',
      isValuable: true,
      estimatedValue: 150000,
      foundAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'VERIFIED',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  await prisma.claimRequest.create({
    data: {
      itemId: valuableItem.id,
      claimantName: '陈先生',
      claimantPhone: '13900139001',
      claimantIdCard: '310101198505056789',
      relationshipProof: '购买发票照片已上传',
      description: '本人遗失金色劳力士手表，证书编号ROLEX-12345',
      verified: true,
      verificationNote: '贵重物品，已核验发票和身份信息',
      verifiedBy: '李四',
      verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historyRecord.createMany({
    data: [
      {
        itemId: valuableItem.id,
        action: '拾获登记',
        operatorName: '张三',
        operatorUserId: stationStaff.id,
        notes: '客服中心收到乘客交来的劳力士手表',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: valuableItem.id,
        action: '认领申请',
        operatorName: '陈先生',
        operatorUserId: stationStaff.id,
        notes: '陈先生提交认领申请并上传购买发票',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: valuableItem.id,
        action: '材料核验通过',
        operatorName: '李四',
        operatorUserId: customerService.id,
        notes: '发票和身份信息均已核实，确认为贵重物品',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const mismatchItem = await prisma.lostItem.create({
    data: {
      name: '华为Mate 60 Pro',
      category: 'ELECTRONICS',
      description: '白色，256GB，手机壳为蓝色',
      foundLocation: '3号线中山公园站自动扶梯旁',
      lockerNumber: 'C-005',
      isValuable: true,
      estimatedValue: 6999,
      foundAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'CLAIMED',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  await prisma.claimRequest.create({
    data: {
      itemId: mismatchItem.id,
      claimantName: '刘女士',
      claimantPhone: '13700137001',
      claimantIdCard: '310101199203034567',
      description: '本人遗失华为手机，黑色，128GB',
      verified: false,
      verificationNote: '颜色和内存描述与物品不符',
      verifiedBy: '李四',
      verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historyRecord.createMany({
    data: [
      {
        itemId: mismatchItem.id,
        action: '拾获登记',
        operatorName: '张三',
        operatorUserId: stationStaff.id,
        notes: '保洁人员在自动扶梯旁拾获手机',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: mismatchItem.id,
        action: '认领申请',
        operatorName: '刘女士',
        operatorUserId: stationStaff.id,
        notes: '刘女士提交认领申请',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: mismatchItem.id,
        action: '材料核验未通过',
        operatorName: '李四',
        operatorUserId: customerService.id,
        notes: '颜色描述为黑色，实际为白色；内存描述为128GB，实际为256GB',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const expiredItem = await prisma.lostItem.create({
    data: {
      name: '黑色双肩背包',
      category: 'BAGS',
      description: '普通黑色双肩背包，内有衣物若干',
      foundLocation: '4号线上海体育馆站',
      lockerNumber: 'D-010',
      isValuable: false,
      foundAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: 'EXPIRED',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  await prisma.historyRecord.createMany({
    data: [
      {
        itemId: expiredItem.id,
        action: '拾获登记',
        operatorName: '张三',
        operatorUserId: stationStaff.id,
        notes: '站务员在站台拾获黑色背包',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: expiredItem.id,
        action: '超期未认领',
        operatorName: '王五',
        operatorUserId: dutyManager.id,
        notes: '保管期限已过，无人认领',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        itemId: expiredItem.id,
        action: '移交处理',
        operatorName: '王五',
        operatorUserId: dutyManager.id,
        notes: '已移交至失物招领中心统一处理',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  await prisma.lostItem.create({
    data: {
      name: '身份证',
      category: 'DOCUMENTS',
      description: '姓名：孙七，地址：上海市浦东新区',
      foundLocation: '1号线陆家嘴站',
      lockerNumber: 'A-015',
      isValuable: false,
      foundAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      status: 'FOUND',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  await prisma.lostItem.create({
    data: {
      name: '钱包',
      category: 'WALLET',
      description: '棕色皮质钱包，内有现金300元',
      foundLocation: '2号线南京西路站',
      lockerNumber: 'B-008',
      isValuable: false,
      estimatedValue: 300,
      foundAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      status: 'FOUND',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  await prisma.lostItem.create({
    data: {
      name: '外套',
      category: 'CLOTHING',
      description: '灰色羽绒服，L码',
      foundLocation: '3号线金沙江路站',
      lockerNumber: 'C-012',
      isValuable: false,
      foundAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'FOUND',
      foundBy: '张三',
      foundByUserId: stationStaff.id,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
