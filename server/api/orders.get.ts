import { useDb } from '../db';
import { orders, customers, cleaners } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const status = query.status as string;
  const city = query.city as string;
  const serviceType = query.serviceType as string;

  const db = useDb();

  const conditions = [];
  if (status) {
    conditions.push(eq(orders.status, status as any));
  }
  if (city) {
    conditions.push(eq(orders.city, city));
  }
  if (serviceType) {
    conditions.push(eq(orders.serviceType, serviceType as any));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      order: orders,
      customer: customers,
      cleaner: cleaners,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .leftJoin(cleaners, eq(orders.cleanerId, cleaners.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt));

  const ordersWithDetails = result.map(row => ({
    ...row.order,
    customer: row.customer,
    cleaner: row.cleaner,
  }));

  return {
    success: true,
    data: ordersWithDetails,
  };
});
