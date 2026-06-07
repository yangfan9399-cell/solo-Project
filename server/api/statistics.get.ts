import { useDb } from '../db';
import { orders, reworks, compensations } from '../db/schema';
import { eq, sql, count, sum, inArray } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const db = useDb();

  const allOrders = await db.select().from(orders);
  const allReworks = await db.select().from(reworks);
  const allCompensations = await db.select().from(compensations);

  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter(o =>
    o.status === 'inspection_passed' || o.status === 'closed' || o.status === 'compensation_approved'
  ).length;
  const pendingOrders = allOrders.filter(o =>
    o.status === 'pending' || o.status === 'assigned'
  ).length;
  const reworkOrders = allOrders.filter(o =>
    o.status === 'rework' || o.status === 'rework_completed' || o.status === 'rework_timeout'
  ).length;

  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.price as string), 0);

  const validCompensations = allCompensations.filter(c =>
    c.status === 'approved' || c.status === 'pending'
  );
  const totalCompensation = validCompensations.reduce((sum, c) => sum + parseFloat(c.amount as string), 0);
  const compensationCount = validCompensations.length;

  const byServiceType: Record<string, { count: number; totalPrice: string; reworkCount: number }> = {};
  const byCity: Record<string, { count: number; totalPrice: string }> = {};

  allOrders.forEach(order => {
    if (!byServiceType[order.serviceType]) {
      byServiceType[order.serviceType] = { count: 0, totalPrice: '0.00', reworkCount: 0 };
    }
    byServiceType[order.serviceType].count++;
    byServiceType[order.serviceType].totalPrice = (
      parseFloat(byServiceType[order.serviceType].totalPrice) + parseFloat(order.price as string)
    ).toFixed(2);

    if (order.status === 'rework' || order.status === 'rework_completed' || order.status === 'rework_timeout') {
      byServiceType[order.serviceType].reworkCount++;
    }

    if (!byCity[order.city]) {
      byCity[order.city] = { count: 0, totalPrice: '0.00' };
    }
    byCity[order.city].count++;
    byCity[order.city].totalPrice = (
      parseFloat(byCity[order.city].totalPrice) + parseFloat(order.price as string)
    ).toFixed(2);
  });

  const byReworkReason: Record<string, number> = {};
  allReworks.forEach(rework => {
    if (!byReworkReason[rework.reason]) {
      byReworkReason[rework.reason] = 0;
    }
    byReworkReason[rework.reason]++;
  });

  return {
    success: true,
    data: {
      totalOrders,
      completedOrders,
      pendingOrders,
      reworkOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalCompensation: totalCompensation.toFixed(2),
      compensationCount,
      byServiceType,
      byCity,
      byReworkReason,
    },
  };
});
