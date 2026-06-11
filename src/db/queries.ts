import { db } from './index';
import { orders, proofs, orderHistory, customers, users } from './schema';
import { eq, desc, sql, and, like } from 'drizzle-orm';
import type { OrderStatus, RejectReason } from './schema';

export async function addOrderHistory(
  orderId: number,
  status: OrderStatus,
  operatorId: number | null,
  operatorName: string,
  remark?: string | null
) {
  await db.insert(orderHistory).values({
    orderId,
    status,
    operatorId,
    operatorName,
    remark: remark || null,
  });
}

export async function getOrderById(orderId: number) {
  const result = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      productName: orders.productName,
      category: orders.category,
      quantity: orders.quantity,
      paperType: orders.paperType,
      paperWeight: orders.paperWeight,
      size: orders.size,
      craft: orders.craft,
      colorMode: orders.colorMode,
      description: orders.description,
      status: orders.status,
      deliveryDate: orders.deliveryDate,
      originalDeliveryDate: orders.originalDeliveryDate,
      rejectReason: orders.rejectReason,
      rejectRemark: orders.rejectRemark,
      returnReason: orders.returnReason,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      customerId: customers.id,
      customerName: customers.name,
      contactPerson: customers.contactPerson,
      customerPhone: customers.phone,
      customerEmail: customers.email,
      customerAddress: customers.address,
      salesName: users.name,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(users, eq(orders.salesId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  return result[0] || null;
}

export async function getProofsByOrderId(orderId: number) {
  return db
    .select()
    .from(proofs)
    .where(eq(proofs.orderId, orderId))
    .orderBy(desc(proofs.version));
}

export async function getOrderHistoryByOrderId(orderId: number) {
  return db
    .select()
    .from(orderHistory)
    .where(eq(orderHistory.orderId, orderId))
    .orderBy(orderHistory.createdAt);
}

export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
  updates: {
    rejectReason?: RejectReason | null;
    rejectRemark?: string | null;
    returnReason?: string | null;
  } = {}
) {
  const result = await db
    .update(orders)
    .set({
      status,
      updatedAt: sql`NOW()`,
      ...(updates.rejectReason !== undefined ? { rejectReason: updates.rejectReason } : {}),
      ...(updates.rejectRemark !== undefined ? { rejectRemark: updates.rejectRemark } : {}),
      ...(updates.returnReason !== undefined ? { returnReason: updates.returnReason } : {}),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return result[0] || null;
}

export async function addProof(data: {
  orderId: number;
  version: number;
  imageUrl: string;
  remark?: string | null;
  uploadedBy: number;
  colorDeviation?: string | null;
}) {
  const result = await db.insert(proofs).values({
    orderId: data.orderId,
    version: data.version,
    imageUrl: data.imageUrl,
    remark: data.remark || null,
    uploadedBy: data.uploadedBy,
    colorDeviation: data.colorDeviation || null,
  }).returning();

  return result[0];
}

export async function getLatestProofVersion(orderId: number): Promise<number> {
  const result = await db
    .select({ version: proofs.version })
    .from(proofs)
    .where(eq(proofs.orderId, orderId))
    .orderBy(desc(proofs.version))
    .limit(1);

  return result.length > 0 ? result[0].version : 0;
}
