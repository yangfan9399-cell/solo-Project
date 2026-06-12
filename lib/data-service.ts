"use server";

import { prisma } from "./prisma";
import {
  OrderStatus,
  NodeType,
  DifferenceType,
  SampleCategory,
  UserRole,
  type DispatchOrderWithRelations,
  type OrderSummary,
  type DashboardStats,
  type CurrentUser,
  KEY_FIELDS,
} from "./types";
import { getCurrentUser, canSupplementMaterials, canReview, canArchive, canReopen, canEditOrder } from "./auth";
import { generateOrderNo, getMonthKey, formatDate } from "./utils";

function valueToString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function computeSummary(order: {
  title: string;
  gateNo: string;
  reservoirName: string;
  status: OrderStatus;
}): string {
  return `${order.reservoirName} ${order.gateNo} - ${order.title}`;
}

function computeConclusion(
  status: OrderStatus,
  blockReason?: string | null,
  sampleCategory?: SampleCategory | null
): string {
  if (status === OrderStatus.REVIEW_APPROVED) return "复核通过，流程正常闭环";
  if (status === OrderStatus.ARCHIVED) return "已完成归档";
  if (blockReason) return `异常：${blockReason}`;
  if (sampleCategory === SampleCategory.MISSING_MATERIAL)
  return "关键材料缺失，待补充";
  if (sampleCategory === SampleCategory.INCONSISTENT_PARTY)
  return "责任对象不一致，待确认";
  if (sampleCategory === SampleCategory.REVIEW_REJECTED) return "复核退回，待补证";
  return "处理中";
}

export async function getOrderList(filters?: {
  status?: OrderStatus;
  category?: SampleCategory;
  isArchived?: boolean;
  search?: string;
}): Promise<OrderSummary[]> {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.sampleCategory = filters.category;
  if (filters?.isArchived !== undefined)
    where.isArchived = filters.isArchived;
  if (filters?.search) {
    where.OR = [
      { orderNo: { contains: filters.search } },
      { title: { contains: filters.search } },
      { reservoirName: { contains: filters.search } },
      { responsibleUnit: { contains: filters.search } },
    ];
  }

  const orders = await prisma.dispatchOrder.findMany({
    where,
    select: {
      id: true,
      orderNo: true,
      title: true,
      status: true,
      sampleCategory: true,
      reservoirName: true,
      gateNo: true,
      responsibleUnit: true,
      responsiblePerson: true,
      createdAt: true,
      updatedAt: true,
      isArchived: true,
      summary: true,
      conclusion: true,
      currentNodeId: true,
      blockReason: true,
      remedyPath: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders as OrderSummary[];
}

export async function getOrderDetail(
  orderId: string
): Promise<DispatchOrderWithRelations | null> {
  return prisma.dispatchOrder.findUnique({
    where: { id: orderId },
    include: {
      nodes: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      differences: { orderBy: { changedAt: "desc" } },
      reviewRecords: { orderBy: { reviewedAt: "desc" } },
    },
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [all, byCategory] = await Promise.all([
    prisma.dispatchOrder.findMany({
      select: { status: true, createdAt: true, sampleCategory: true },
    }),
    prisma.dispatchOrder.groupBy({
      by: ["sampleCategory"],
      _count: true,
    }),
  ]);

  const categoryCounts: Record<SampleCategory, number> = {
    NORMAL_CLOSE: 0,
    MISSING_MATERIAL: 0,
    INCONSISTENT_PARTY: 0,
    REVIEW_REJECTED: 0,
  };

  byCategory.forEach((item: any) => {
    if (item.sampleCategory) {
      categoryCounts[item.sampleCategory as SampleCategory] = item._count;
    }
  });

  const monthMap = new Map<string, number>();
  all.forEach((order: any) => {
    const key = getMonthKey(order.createdAt);
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });

  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return {
    total: all.length,
    pending: all.filter((o: any) => o.status === OrderStatus.PENDING_ACCEPT).length,
    processing: all.filter((o: any) => o.status === OrderStatus.PROCESSING).length,
    reviewing: all.filter((o: any) => o.status === OrderStatus.PENDING_REVIEW).length,
    approved: all.filter((o: any) => o.status === OrderStatus.REVIEW_APPROVED).length,
    rejected: all.filter((o: any) => o.status === OrderStatus.REVIEW_REJECTED).length,
    archived: all.filter((o: any) => o.status === OrderStatus.ARCHIVED).length,
    byCategory: categoryCounts,
    byMonth,
  };
}

async function recordFieldDifferences(
  orderId: string,
  oldData: any,
  newData: any,
  userId: string,
  nodeId?: string
) {
  const differences: any[] = [];

  for (const field of KEY_FIELDS) {
    const oldVal = valueToString(oldData[field.name]);
    const newVal = valueToString(newData[field.name]);
    if (oldVal !== newVal) {
      differences.push({
        orderId,
        nodeId,
        fieldName: field.name,
        fieldLabel: field.label,
        oldValue: oldVal,
        newValue: newVal,
        differenceType: field.type,
        changedBy: userId,
      });
    }
  }

  if (differences.length > 0) {
    await prisma.fieldDifference.createMany({ data: differences });
  }

  return differences;
}

async function createNode(
  orderId: string,
  nodeType: NodeType,
  status: OrderStatus,
  userId: string,
  userName: string,
  remark?: string,
  snapshot?: any
) {
  return prisma.orderNode.create({
    data: {
      orderId,
      nodeType,
      status,
      operatorId: userId,
      operatorName: userName,
      remark,
      snapshotData: snapshot,
    },
  });
}

export async function acceptOrder(orderId: string, operatorId?: string) {
  const user = await getCurrentUser();
  const existing = await prisma.dispatchOrder.findUnique({ where: { id: orderId } });
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能操作");
  if (!canEditOrder(user, existing.status, existing.isArchived)) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限受理该记录`);
  }
  if (existing.status !== OrderStatus.PENDING_ACCEPT) {
    throw new Error("仅待受理状态可受理");
  }

  const targetOperatorId = operatorId || user.id;
  const operatorUser = await prisma.user.upsert({
    where: { id: targetOperatorId },
    update: {},
    create: { id: targetOperatorId, name: user.name, role: user.role },
  });

  const newData = {
    status: OrderStatus.PROCESSING,
    operatorId: targetOperatorId,
  };

  const differences = await recordFieldDifferences(
    orderId, existing, newData, user.id);

  const node = await createNode(
    orderId,
    NodeType.ACCEPT,
    OrderStatus.PROCESSING,
    user.id,
    user.name,
    "已受理并分配处理",
    { ...existing, ...newData }
  );

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      ...newData,
      currentNodeId: node.id,
      summary: computeSummary({ ...existing, ...newData }),
      conclusion: computeConclusion(OrderStatus.PROCESSING),
    },
    include: { nodes: true, differences: true },
  });

  return { order: updated, differences };
}

export async function processOrder(
  orderId: string,
  data: {
    actualExecuteTime?: Date;
    actualOpening?: number;
    actualFlow?: number;
    amount?: number;
    remark?: string;
    businessRecord?: string;
    evidence?: string;
  }
) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能操作");
  if (!canEditOrder(user, existing.status, existing.isArchived)) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限更新执行数据`);
  }
  if (!["PROCESSING", "REVIEW_REJECTED"].includes(existing.status))
    throw new Error("当前状态不允许处理");

  const newData = {
    actualExecuteTime: data.actualExecuteTime,
    actualOpening: data.actualOpening,
    actualFlow: data.actualFlow,
    amount: data.amount,
  };

  const differences = await recordFieldDifferences(
    orderId,
    existing,
    newData,
    user.id
  );

  const node = await createNode(
    orderId,
    NodeType.PROCESS,
    existing.status,
    user.id,
    user.name,
    data.remark || data.businessRecord,
    { ...existing, ...newData }
  );

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      ...newData,
      currentNodeId: node.id,
      conclusion: computeConclusion(existing.status, existing.blockReason, existing.sampleCategory),
    },
    include: { nodes: true, differences: true },
  });

  return { order: updated, differences };
}

export async function supplementMaterials(
  orderId: string,
  data: {
    businessRecord: string;
    siteDescription: string;
    attachments?: { name: string; type: string; size: number; url: string }[];
    remark?: string;
  }
) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能操作");
  if (!canSupplementMaterials(user, existing.status, existing.isArchived)) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限补充材料，仅经办人可补充`);
  }

  const node = await createNode(
    orderId,
    NodeType.SUPPLEMENT,
    existing.status,
    user.id,
    user.name,
    data.remark || "补充业务记录和现场说明",
    {
      businessRecord: data.businessRecord,
      siteDescription: data.siteDescription,
    }
  );

  if (data.attachments && data.attachments.length > 0) {
    await prisma.orderAttachment.createMany({
      data: data.attachments.map((a) => ({
        orderId,
        nodeId: node.id,
        name: a.name,
        type: a.type,
        size: a.size,
        url: a.url,
        uploadedBy: user.id,
        description: "补充证据附件",
      })),
    });
  }

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      blockReason: null,
      currentNodeId: node.id,
      conclusion: "已补充材料，待继续处理",
    },
    include: { nodes: true, attachments: true },
  });

  return { order: updated, node };
}

export async function submitForReview(orderId: string, data: {
  conclusion: string;
  evidenceBasis: string;
  remark?: string;
}) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能操作");
  if (existing.status !== OrderStatus.PROCESSING)
    throw new Error("仅处理中状态可提交复核");
  if (user.role !== UserRole.OPERATOR && user.role !== UserRole.ADMIN) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限提交复核，仅经办人可提交`);
  }

  const newData = {
    status: OrderStatus.PENDING_REVIEW,
    conclusion: data.conclusion,
  };

  const differences = await recordFieldDifferences(
    orderId,
    existing,
    newData,
    user.id
  );

  const node = await createNode(
    orderId,
    NodeType.SUBMIT_REVIEW,
    OrderStatus.PENDING_REVIEW,
    user.id,
    user.name,
    data.remark || `提交复核。采用依据：${data.evidenceBasis}`,
    { ...existing, ...newData, evidenceBasis: data.evidenceBasis }
  );

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      ...newData,
      currentNodeId: node.id,
      summary: computeSummary({ ...existing, ...newData }),
      conclusion: data.conclusion,
    },
    include: { nodes: true, differences: true },
  });

  return { order: updated, differences };
}

export async function reviewOrder(
  orderId: string,
  data: {
    isApproved: boolean;
    conclusion: string;
    opinion?: string;
    blockReason?: string;
    remedyPath?: string;
  }
) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能操作");
  if (!canReview(user, existing.status, existing.isArchived)) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限复核，仅复核人可进行复核操作`);
  }
  if (existing.status !== OrderStatus.PENDING_REVIEW)
    throw new Error("仅待复核状态可进行复核");

  const newStatus = data.isApproved
    ? OrderStatus.REVIEW_APPROVED
    : OrderStatus.REVIEW_REJECTED;

  const newData = {
    status: newStatus,
    reviewTime: new Date(),
    conclusion: data.conclusion,
    blockReason: data.isApproved ? null : data.blockReason,
    remedyPath: data.isApproved ? null : data.remedyPath,
  };

  const differences = await recordFieldDifferences(
    orderId,
    existing,
    newData,
    user.id
  );

  const node = await createNode(
    orderId,
    data.isApproved ? NodeType.APPROVE : NodeType.REJECT,
    newStatus,
    user.id,
    user.name,
    data.opinion || (data.isApproved ? "复核通过" : "复核退回"),
    { ...existing, ...newData }
  );

  await prisma.reviewRecord.create({
    data: {
      orderId,
      reviewerId: user.id,
      reviewerName: user.name,
      conclusion: data.conclusion,
      opinion: data.opinion,
      blockReason: data.blockReason,
      remedyPath: data.remedyPath,
      isApproved: data.isApproved,
    },
  });

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      ...newData,
      currentNodeId: node.id,
      summary: computeSummary({ ...existing, ...newData }),
      conclusion: computeConclusion(
        newStatus,
        newData.blockReason,
        existing.sampleCategory
      ),
    },
    include: { nodes: true, differences: true, reviewRecords: true },
  });

  return { order: updated, differences };
}

export async function archiveOrder(orderId: string) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能操作");
  if (!canArchive(user, existing.status, existing.isArchived)) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限归档，仅复核人可归档`);
  }
  if (existing.status !== OrderStatus.REVIEW_APPROVED)
    throw new Error("仅复核通过状态可归档");

  const newData = {
    status: OrderStatus.ARCHIVED,
    isArchived: true,
  };

  const node = await createNode(
    orderId,
    NodeType.ARCHIVE,
    OrderStatus.ARCHIVED,
    user.id,
    user.name,
    "已完成归档",
    { ...existing, ...newData }
  );

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      ...newData,
      currentNodeId: node.id,
      conclusion: computeConclusion(OrderStatus.ARCHIVED),
    },
    include: { nodes: true },
  });

  return { order: updated };
}

export async function reopenOrder(orderId: string) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (!canReopen(user, existing.status, existing.isArchived)) {
    throw new Error(`当前用户(${user.name}，角色：${user.role})无权限重新处理，仅管理员可操作`);
  }
  if (!existing.isArchived) throw new Error("仅归档记录可重新处理");

  const newData = {
    status: OrderStatus.PROCESSING,
    isArchived: false,
  };

  const node = await createNode(
    orderId,
    NodeType.REOPEN,
    OrderStatus.PROCESSING,
    user.id,
    user.name,
    "重新处理，生成新节点",
    { ...existing, ...newData }
  );

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      ...newData,
      currentNodeId: node.id,
      conclusion: "已重新开启新处理节点",
    },
    include: { nodes: true },
  });

  return { order: updated, newNodeId: node.id };
}

export async function updateKeyField(
  orderId: string,
  fieldName: string,
  newValue: any,
  fieldLabel: string
) {
  const user = await getCurrentUser();
  const existing = await getOrderDetail(orderId);
  if (!existing) throw new Error("记录不存在");
  if (existing.isArchived) throw new Error("已归档记录不能修改");

  const keyField = KEY_FIELDS.find((f) => f.name === fieldName);
  if (!keyField) throw new Error("关键字段不允许直接修改，请通过正规流程");

  const oldVal = valueToString((existing as any)[fieldName]);
  const newVal = valueToString(newValue);

  if (oldVal === newVal) return { success: true, differences: [] };

  const difference = await prisma.fieldDifference.create({
    data: {
      orderId,
      fieldName,
      fieldLabel,
      oldValue: oldVal,
      newValue: newVal,
      differenceType: DifferenceType.OTHER,
      changedBy: user.id,
    },
  });

  const node = await createNode(
    orderId,
    NodeType.SUPPLEMENT,
    existing.status,
    user.id,
    user.name,
    `修改${fieldLabel}：${oldVal} → ${newVal}`,
    { [fieldName]: newValue }
  );

  const updated = await prisma.dispatchOrder.update({
    where: { id: orderId },
    data: {
      [fieldName]: newValue,
      currentNodeId: node.id,
      conclusion: computeConclusion(
        existing.status, existing.blockReason, existing.sampleCategory
      ),
      summary: computeSummary({ ...existing, [fieldName]: newValue }),
    },
    include: { nodes: true, differences: true },
  });

  return { order: updated, differences: [difference] };
}

export async function getOrderWithAllData() {
  return {
    list: await getOrderList(),
    stats: await getDashboardStats(),
  };
}
