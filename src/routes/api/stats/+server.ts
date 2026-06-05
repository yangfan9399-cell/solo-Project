import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, BadReviewReason, StaffRole } from '@prisma/client';

export const GET: RequestHandler = async ({ url }) => {
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  const where = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  const [
    ordersByRegion,
    ordersByCleaner,
    badReviewReasons,
    reworkStats,
    overallStats
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ['region'],
      where,
      _count: { id: true },
      _avg: { estimatedPrice: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    prisma.assignment.findMany({
      where: {
        order: where
      },
      include: {
        cleaner: true,
        order: {
          include: {
            serviceFeedback: true,
            qualityChecks: true
          }
        }
      }
    }).then(async (assignments) => {
      const cleanerMap = new Map();
      
      for (const a of assignments) {
        if (!cleanerMap.has(a.cleanerId)) {
          cleanerMap.set(a.cleanerId, {
            id: a.cleanerId,
            name: a.cleaner.name,
            region: a.cleaner.region,
            totalOrders: 0,
            avgRating: 0,
            badReviews: 0,
            reworkCount: 0
          });
        }
        const stats = cleanerMap.get(a.cleanerId);
        stats.totalOrders++;
        
        if (a.order.serviceFeedback) {
          if (a.order.serviceFeedback.customerRating) {
            stats.avgRating = (stats.avgRating * (stats.totalOrders - 1) + a.order.serviceFeedback.customerRating) / stats.totalOrders;
          }
          if (a.order.serviceFeedback.badReviewReason && a.order.serviceFeedback.badReviewReason !== 'NOT_APPLICABLE') {
            stats.badReviews++;
          }
        }
        stats.reworkCount += a.order.reworkCount;
      }
      
      return Array.from(cleanerMap.values()).sort((a, b) => b.totalOrders - a.totalOrders);
    }),
    prisma.serviceFeedback.groupBy({
      by: ['badReviewReason'],
      where: {
        badReviewReason: { not: 'NOT_APPLICABLE' },
        order: where
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    }),
    prisma.order.groupBy({
      by: ['reworkCount'],
      where,
      _count: { id: true },
      orderBy: { reworkCount: 'asc' }
    }),
    prisma.order.aggregate({
      where,
      _count: { id: true },
      _sum: { estimatedPrice: true },
      _avg: { estimatedPrice: true }
    })
  ]);

  return json({
    overall: {
      totalOrders: overallStats._count.id,
      totalRevenue: overallStats._sum.estimatedPrice?.toNumber() || 0,
      avgPrice: overallStats._avg.estimatedPrice?.toNumber() || 0
    },
    byRegion: ordersByRegion.map(r => ({
      region: r.region,
      count: r._count.id,
      avgPrice: r._avg.estimatedPrice?.toNumber() || 0
    })),
    byCleaner: ordersByCleaner,
    badReviewReasons: badReviewReasons.map(r => ({
      reason: r.badReviewReason,
      count: r._count.id
    })),
    reworkDistribution: reworkStats.map(r => ({
      reworkCount: r.reworkCount,
      orderCount: r._count.id
    }))
  });
};
