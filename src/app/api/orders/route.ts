import { NextResponse } from 'next/server';
import { initDatabase } from '@/db/init';
import { db } from '@/db';
import { orders, customers, users } from '@/db/schema';
import { eq, desc, like, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  await initDatabase();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let whereConditions: any[] = [];

  if (status && status !== 'all') {
    whereConditions.push(eq(orders.status, status as any));
  }
  if (customerId) {
    whereConditions.push(eq(orders.customerId, parseInt(customerId)));
  }
  if (category && category !== 'all') {
    whereConditions.push(eq(orders.category, category as any));
  }
  if (search) {
    whereConditions.push(
      sql`(${orders.productName} LIKE ${'%' + search + '%'} OR ${orders.orderNo} LIKE ${'%' + search + '%'})`
    );
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const result = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      productName: orders.productName,
      category: orders.category,
      quantity: orders.quantity,
      status: orders.status,
      deliveryDate: orders.deliveryDate,
      originalDeliveryDate: orders.originalDeliveryDate,
      customerName: customers.name,
      salesName: users.name,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(users, eq(orders.salesId, users.id))
    .where(where)
    .orderBy(desc(orders.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  await initDatabase();

  const body = await request.json();

  const now = new Date();
  const orderNo = 'PO' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(Math.floor(Math.random() * 900) + 100);

  const result = await db.insert(orders).values({
    orderNo,
    customerId: body.customerId,
    productName: body.productName,
    category: body.category,
    quantity: body.quantity,
    paperType: body.paperType,
    paperWeight: body.paperWeight || null,
    size: body.size,
    craft: body.craft,
    colorMode: body.colorMode,
    description: body.description || null,
    status: body.status || 'draft',
    deliveryDate: new Date(body.deliveryDate),
    originalDeliveryDate: new Date(body.deliveryDate),
    salesId: body.salesId || 1,
    designerId: body.designerId || 2,
  }).returning();

  if (body.status && body.status !== 'draft') {
    const { addOrderHistory } = await import('@/db/init');
  }

  return NextResponse.json(result[0]);
}
