import { PrismaClient, OrderStatus, DocumentStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const documentHandler = await prisma.user.upsert({
    where: { email: 'zhangwei@customs.com' },
    update: {},
    create: {
      name: '张伟',
      email: 'zhangwei@customs.com',
      role: Role.DOCUMENT_HANDLER,
    },
  });

  const customsReviewer = await prisma.user.upsert({
    where: { email: 'liming@customs.com' },
    update: {},
    create: {
      name: '李明',
      email: 'liming@customs.com',
      role: Role.CUSTOMS_REVIEWER,
    },
  });

  await createCompleteOrder(documentHandler.id, customsReviewer.id);
  await createInvoiceMismatchOrder(documentHandler.id);
  await createClassificationConflictOrder(documentHandler.id);
  await createIdMissingOrder(documentHandler.id);
  await createArchivedOrder(documentHandler.id, customsReviewer.id);

  console.log('Seed data created successfully!');
}

async function createCompleteOrder(handlerId: string, reviewerId: string) {
  const order = await prisma.order.create({
    data: {
      orderNumber: 'CC20240601001',
      source: '亚马逊美国',
      sourceOrderNo: 'AMZ-US-2024-001234',
      country: '美国',
      category: '电子产品',
      declaredValue: 1500.00,
      declaredAmount: 1500.00,
      recipientName: '王小明',
      recipientIdType: '身份证',
      recipientIdNumber: '310101199001011234',
      trackingNumber: 'SF1234567890',
      status: OrderStatus.UNDER_REVIEW,
      documentStatus: DocumentStatus.COMPLETE,
      documentHandlerId: handlerId,
      customsReviewerId: reviewerId,
      items: {
        create: [
          {
            name: '苹果 iPhone 15 Pro',
            declaredName: '智能手机',
            hsCode: '85171210',
            declaredHsCode: '85171210',
            quantity: 1,
            unitPrice: 999.00,
            total: 999.00,
            weight: 0.21,
          },
          {
            name: 'AirPods Pro 2',
            declaredName: '无线耳机',
            hsCode: '85176290',
            declaredHsCode: '85176290',
            quantity: 1,
            unitPrice: 249.00,
            total: 249.00,
            weight: 0.05,
          },
        ],
      },
      documents: {
        create: [
          { type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', uploadedBy: '张伟' },
        ],
      },
      historyNodes: {
        create: [
          { action: '订单创建', status: 'PENDING', operator: '系统', role: 'SYSTEM' },
          { action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', operator: '张伟', role: '单证经办人' },
          { action: '资料审核通过', status: 'UNDER_REVIEW', operator: '张伟', role: '单证经办人', notes: '所有单证齐全，提交关务复核' },
        ],
      },
      clearanceBasis: {
        create: {
          basisType: '个人物品清关',
          regulationReference: '海关总署公告2010年第43号',
          explanation: '该订单符合个人自用物品标准，总价值在免税额度内',
        },
      },
    },
    include: { items: true, documents: true, historyNodes: true },
  });

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber: 'INV-US-2024-001234',
      invoiceDate: new Date('2024-05-28'),
      supplierName: 'Apple Inc.',
      totalAmount: 1248.00,
      currency: 'USD',
      items: {
        create: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
  });
}

async function createInvoiceMismatchOrder(handlerId: string) {
  const order = await prisma.order.create({
    data: {
      orderNumber: 'CC20240601002',
      source: 'eBay德国',
      sourceOrderNo: 'EBY-DE-2024-987654',
      country: '德国',
      category: '家居用品',
      declaredValue: 800.00,
      actualValue: 1200.00,
      declaredAmount: 800.00,
      actualAmount: 1200.00,
      recipientName: '陈小红',
      recipientIdType: '身份证',
      recipientIdNumber: '440301199203156789',
      trackingNumber: 'DHL9876543210',
      status: OrderStatus.INVOICE_MISMATCH,
      documentStatus: DocumentStatus.COMPLETE,
      documentHandlerId: handlerId,
      items: {
        create: [
          {
            name: '双立人刀具套装',
            declaredName: '厨房刀具',
            hsCode: '82149000',
            declaredHsCode: '82149000',
            quantity: 1,
            unitPrice: 800.00,
            total: 800.00,
            weight: 2.5,
          },
        ],
      },
      documents: {
        create: [
          { type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'MISMATCH', uploadedBy: '张伟', notes: '发票金额与申报金额不符' },
          { type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', uploadedBy: '张伟' },
        ],
      },
      historyNodes: {
        create: [
          { action: '订单创建', status: 'PENDING', operator: '系统', role: 'SYSTEM' },
          { action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', operator: '张伟', role: '单证经办人' },
          { action: '发票金额不符', status: 'INVOICE_MISMATCH', operator: '张伟', role: '单证经办人', notes: '申报800欧元，实际发票1200欧元' },
        ],
      },
      amountDiscrepancy: {
        create: {
          declaredAmount: 800.00,
          actualAmount: 1200.00,
          difference: 400.00,
          differencePercent: 50.0,
          discrepancySource: '发票金额与申报金额差异',
          correctionPath: '1. 联系发件人确认真实交易金额; 2. 重新提供正确商业发票; 3. 更新申报金额后重新提交',
        },
      },
    },
    include: { items: true, documents: true },
  });

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber: 'INV-DE-2024-987654',
      invoiceDate: new Date('2024-05-29'),
      supplierName: 'Zwilling GmbH',
      totalAmount: 1200.00,
      currency: 'EUR',
      items: {
        create: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: 1200.00,
          total: 1200.00,
        })),
      },
    },
  });
}

async function createClassificationConflictOrder(handlerId: string) {
  const order = await prisma.order.create({
    data: {
      orderNumber: 'CC20240601003',
      source: '天猫国际',
      sourceOrderNo: 'TMALL-HK-2024-555555',
      country: '香港',
      category: '保健品',
      declaredValue: 680.00,
      declaredAmount: 680.00,
      recipientName: '刘建国',
      recipientIdType: '身份证',
      recipientIdNumber: '320101198508084321',
      trackingNumber: 'SF5556667777',
      status: OrderStatus.CLASSIFICATION_CONFLICT,
      documentStatus: DocumentStatus.PENDING_REVIEW,
      documentHandlerId: handlerId,
      items: {
        create: [
          {
            name: 'Swisse 胶原蛋白片',
            declaredName: '膳食补充剂',
            hsCode: '21069090',
            declaredHsCode: '30049090',
            quantity: 3,
            unitPrice: 226.67,
            total: 680.00,
            weight: 0.8,
            classificationNote: '需确认归类：药品vs食品补充剂',
          },
        ],
      },
      documents: {
        create: [
          { type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'PRODUCT_DESC', name: '产品说明书.pdf', status: 'PENDING', uploadedBy: '张伟' },
        ],
      },
      historyNodes: {
        create: [
          { action: '订单创建', status: 'PENDING', operator: '系统', role: 'SYSTEM' },
          { action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', operator: '张伟', role: '单证经办人' },
          { action: '归类冲突', status: 'CLASSIFICATION_CONFLICT', operator: '张伟', role: '单证经办人', notes: '申报品名为药品，实际为保健品' },
        ],
      },
      classificationNote: {
        create: {
          itemName: 'Swisse 胶原蛋白片',
          declaredHsCode: '30049090',
          suggestedHsCode: '21069090',
          reason: '该产品为膳食营养补充剂，不属于药品范畴，应归入食品补充剂类',
          status: 'PENDING',
        },
      },
    },
    include: { items: true, documents: true },
  });

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber: 'INV-HK-2024-555555',
      invoiceDate: new Date('2024-05-30'),
      supplierName: 'Swisse Hong Kong',
      totalAmount: 680.00,
      currency: 'HKD',
      items: {
        create: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
  });
}

async function createIdMissingOrder(handlerId: string) {
  await prisma.order.create({
    data: {
      orderNumber: 'CC20240601004',
      source: 'Shopee新加坡',
      sourceOrderNo: 'SGP-SG-2024-111222',
      country: '新加坡',
      category: '服装配饰',
      declaredValue: 350.00,
      declaredAmount: 350.00,
      recipientName: '赵美玲',
      recipientIdType: '身份证',
      trackingNumber: 'SG111222333',
      status: OrderStatus.ID_MISSING,
      documentStatus: DocumentStatus.INCOMPLETE,
      documentHandlerId: handlerId,
      items: {
        create: [
          {
            name: 'Charles & Keith 手提包',
            declaredName: '女士手提包',
            hsCode: '42022100',
            declaredHsCode: '42022100',
            quantity: 1,
            unitPrice: 350.00,
            total: 350.00,
            weight: 0.6,
          },
        ],
      },
      documents: {
        create: [
          { type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'ID_CARD', name: '收件人身份证.jpg', status: 'MISSING', notes: '收件人身份证件缺失，需补传' },
        ],
      },
      historyNodes: {
        create: [
          { action: '订单创建', status: 'PENDING', operator: '系统', role: 'SYSTEM' },
          { action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', operator: '张伟', role: '单证经办人' },
          { action: '证件缺失', status: 'ID_MISSING', operator: '张伟', role: '单证经办人', notes: '收件人身份证照片缺失，已通知收件人' },
        ],
      },
    },
  });
}

async function createArchivedOrder(handlerId: string, reviewerId: string) {
  const order = await prisma.order.create({
    data: {
      orderNumber: 'CC20240501005',
      source: '亚马逊日本',
      sourceOrderNo: 'AMZ-JP-2024-888888',
      country: '日本',
      category: '图书音像',
      declaredValue: 450.00,
      declaredAmount: 450.00,
      recipientName: '孙文华',
      recipientIdType: '身份证',
      recipientIdNumber: '110101197812125555',
      trackingNumber: 'JP8888888888',
      status: OrderStatus.ARCHIVED,
      documentStatus: DocumentStatus.COMPLETE,
      documentHandlerId: handlerId,
      customsReviewerId: reviewerId,
      items: {
        create: [
          {
            name: '村上春树作品集',
            declaredName: '书籍',
            hsCode: '49019900',
            declaredHsCode: '49019900',
            quantity: 5,
            unitPrice: 90.00,
            total: 450.00,
            weight: 1.2,
          },
        ],
      },
      documents: {
        create: [
          { type: 'COMMERCIAL_INVOICE', name: '商业发票.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'PACKING_LIST', name: '装箱单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'SHIPPING_LABEL', name: '运单.pdf', status: 'VERIFIED', uploadedBy: '张伟' },
          { type: 'ID_CARD', name: '收件人身份证.jpg', status: 'VERIFIED', uploadedBy: '张伟' },
        ],
      },
      historyNodes: {
        create: [
          { action: '订单创建', status: 'PENDING', operator: '系统', role: 'SYSTEM', timestamp: new Date('2024-05-01T10:00:00') },
          { action: '资料上传', status: 'DOCUMENTS_INCOMPLETE', operator: '张伟', role: '单证经办人', timestamp: new Date('2024-05-01T11:30:00') },
          { action: '资料审核通过', status: 'UNDER_REVIEW', operator: '张伟', role: '单证经办人', timestamp: new Date('2024-05-01T14:00:00') },
          { action: '放行通过', status: 'APPROVED', operator: '李明', role: '关务复核人', notes: '单证齐全，准予放行', timestamp: new Date('2024-05-01T16:30:00') },
          { action: '归档', status: 'ARCHIVED', operator: '系统', role: 'SYSTEM', timestamp: new Date('2024-05-05T09:00:00') },
        ],
      },
      clearanceBasis: {
        create: {
          basisType: '图书免税政策',
          regulationReference: '海关总署令第161号',
          explanation: '进口图书符合免税政策，已办理免税手续',
          approvedBy: '李明',
          approvedAt: new Date('2024-05-01T16:30:00'),
        },
      },
    },
    include: { items: true },
  });

  await prisma.invoice.create({
    data: {
      orderId: order.id,
      invoiceNumber: 'INV-JP-2024-888888',
      invoiceDate: new Date('2024-04-28'),
      supplierName: 'Amazon Japan',
      totalAmount: 450.00,
      currency: 'JPY',
      items: {
        create: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
