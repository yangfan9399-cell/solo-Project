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

  const orderMap = new Map(allOrders.map(o => [o.id, o]));
  const reworkMap = new Map(allReworks.map(r => [r.orderId, r]));

  const byServiceType: Record<string, { count: number; totalPrice: string; reworkCount: number; compensationAmount: string; compensationCount: number }> = {};
  const byCity: Record<string, { count: number; totalPrice: string; compensationAmount: string; compensationCount: number }> = {};

  allOrders.forEach(order => {
    if (!byServiceType[order.serviceType]) {
      byServiceType[order.serviceType] = { count: 0, totalPrice: '0.00', reworkCount: 0, compensationAmount: '0.00', compensationCount: 0 };
    }
    byServiceType[order.serviceType].count++;
    byServiceType[order.serviceType].totalPrice = (
      parseFloat(byServiceType[order.serviceType].totalPrice) + parseFloat(order.price as string)
    ).toFixed(2);

    if (order.status === 'rework' || order.status === 'rework_completed' || order.status === 'rework_timeout') {
      byServiceType[order.serviceType].reworkCount++;
    }

    if (!byCity[order.city]) {
      byCity[order.city] = { count: 0, totalPrice: '0.00', compensationAmount: '0.00', compensationCount: 0 };
    }
    byCity[order.city].count++;
    byCity[order.city].totalPrice = (
      parseFloat(byCity[order.city].totalPrice) + parseFloat(order.price as string)
    ).toFixed(2);
  });

  validCompensations.forEach(compensation => {
    const order = orderMap.get(compensation.orderId);
    if (order) {
      if (byServiceType[order.serviceType]) {
        byServiceType[order.serviceType].compensationAmount = (
          parseFloat(byServiceType[order.serviceType].compensationAmount) + parseFloat(compensation.amount as string)
        ).toFixed(2);
        byServiceType[order.serviceType].compensationCount++;
      }
      if (byCity[order.city]) {
        byCity[order.city].compensationAmount = (
          parseFloat(byCity[order.city].compensationAmount) + parseFloat(compensation.amount as string)
        ).toFixed(2);
        byCity[order.city].compensationCount++;
      }
    }
  });

  const byReworkReason: Record<string, { count: number; compensationAmount: string; compensationCount: number }> = {};
  allReworks.forEach(rework => {
    if (!byReworkReason[rework.reason]) {
      byReworkReason[rework.reason] = { count: 0, compensationAmount: '0.00', compensationCount: 0 };
    }
    byReworkReason[rework.reason].count++;

    const compensation = validCompensations.find(c => c.orderId === rework.orderId);
    if (compensation) {
      byReworkReason[rework.reason].compensationAmount = (
        parseFloat(byReworkReason[rework.reason].compensationAmount) + parseFloat(compensation.amount as string)
      ).toFixed(2);
      byReworkReason[rework.reason].compensationCount++;
    }
  });

  const byCompensationRuleType: Record<string, { count: number; totalAmount: string }> = {};
  validCompensations.forEach(compensation => {
    if (!byCompensationRuleType[compensation.ruleType]) {
      byCompensationRuleType[compensation.ruleType] = { count: 0, totalAmount: '0.00' };
    }
    byCompensationRuleType[compensation.ruleType].count++;
    byCompensationRuleType[compensation.ruleType].totalAmount = (
      parseFloat(byCompensationRuleType[compensation.ruleType].totalAmount) + parseFloat(compensation.amount as string)
    ).toFixed(2);
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
      byCompensationRuleType,
    },
  };
});
