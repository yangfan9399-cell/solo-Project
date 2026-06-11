import { NextResponse } from 'next/server';
import { initDatabase } from '@/db/init';
import { db } from '@/db';
import { orders, customers, proofs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { REJECT_REASON_LABELS } from '@/lib/constants';

export async function GET() {
  await initDatabase();

  const allOrders = await db.select().from(orders);
  const allCustomers = await db.select().from(customers);
  const allProofs = await db.select().from(proofs);

  const customerById: Record<number, string> = {};
  allCustomers.forEach((c) => {
    customerById[c.id] = c.name;
  });

  const byCustomer: Record<string, { total: number; statuses: Record<string, number> }> = {};
  allOrders.forEach((order) => {
    const customerName = customerById[order.customerId] || '未知客户';
    if (!byCustomer[customerName]) {
      byCustomer[customerName] = { total: 0, statuses: {} };
    }
    byCustomer[customerName].total++;
    const status = order.status;
    byCustomer[customerName].statuses[status] = (byCustomer[customerName].statuses[status] || 0) + 1;
  });

  const byCategory: Record<string, number> = {};
  allOrders.forEach((order) => {
    byCategory[order.category] = (byCategory[order.category] || 0) + 1;
  });

  const byStatus: Record<string, number> = {};
  allOrders.forEach((order) => {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
  });

  const rejectReasons: Record<string, number> = {};
  allOrders.forEach((order) => {
    if (order.rejectReason) {
      const label = REJECT_REASON_LABELS[order.rejectReason as keyof typeof REJECT_REASON_LABELS] || order.rejectReason;
      rejectReasons[label] = (rejectReasons[label] || 0) + 1;
    }
  });

  const returnOrders = allOrders.filter((o) => o.status === 'order_returned' || o.returnReason);
  const returnReasons: Record<string, number> = {};
  returnOrders.forEach((order) => {
    if (order.returnReason) {
      const reason = order.returnReason.length > 20 ? order.returnReason.substring(0, 20) + '...' : order.returnReason;
      returnReasons[reason] = (returnReasons[reason] || 0) + 1;
    }
  });

  const proofCountsByOrder: Record<number, number> = {};
  allProofs.forEach((p) => {
    proofCountsByOrder[p.orderId] = (proofCountsByOrder[p.orderId] || 0) + 1;
  });

  let totalProofCycles = 0;
  let ordersWithProofs = 0;
  const proofCycleDistribution: Record<string, number> = {
    '1次': 0,
    '2次': 0,
    '3次': 0,
    '3次以上': 0,
  };

  Object.values(proofCountsByOrder).forEach((count) => {
    if (count > 0) {
      ordersWithProofs++;
      totalProofCycles += count;
      if (count === 1) proofCycleDistribution['1次']++;
      else if (count === 2) proofCycleDistribution['2次']++;
      else if (count === 3) proofCycleDistribution['3次']++;
      else if (count > 3) proofCycleDistribution['3次以上']++;
    }
  });

  const avgProofCycles = ordersWithProofs > 0 ? (totalProofCycles / ordersWithProofs).toFixed(1) : '0';

  const colorDeviationCount = allProofs.filter((p) => p.colorDeviation).length;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = allOrders.filter((o) => new Date(o.createdAt) >= thirtyDaysAgo);

  return NextResponse.json({
    totalOrders: allOrders.length,
    pendingOrders: allOrders.filter((o) => !['order_placed', 'order_returned'].includes(o.status)).length,
    completedOrders: allOrders.filter((o) => o.status === 'order_placed').length,
    byCustomer,
    byCategory,
    byStatus,
    rejectReasons,
    returnReasons,
    avgProofCycles,
    proofCycleDistribution,
    colorDeviationCount,
    recentOrdersCount: recentOrders.length,
    ordersWithColorDeviation: allOrders.filter((o) => o.rejectReason === 'color_deviation').length,
  });
}
