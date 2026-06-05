import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, OrderSource } from '@prisma/client';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status') as OrderStatus | null;
  const region = url.searchParams.get('region');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  const where: any = {};
  if (status) where.status = status;
  if (region) where.region = region;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        creator: true,
        assignments: {
          include: {
            cleaner: true
          },
          orderBy: {
            assignedAt: 'asc'
          }
        },
        serviceFeedback: true,
        qualityChecks: {
          include: {
            inspector: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.order.count({ where })
  ]);

  return json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    const orderNo = 'CS' + Date.now().toString().slice(-10);

    const order = await prisma.order.create({
      data: {
        orderNo,
        customerId: data.customerId,
        source: data.source as OrderSource,
        serviceType: data.serviceType,
        serviceAddress: data.serviceAddress,
        region: data.region,
        scheduledDate: new Date(data.scheduledDate),
        scheduledHours: data.scheduledHours,
        estimatedPrice: data.estimatedPrice,
        status: OrderStatus.PENDING,
        createdBy: data.createdBy
      },
      include: {
        customer: true,
        creator: true
      }
    });

    return json({ success: true, order });
  } catch (error) {
    console.error('创建订单失败:', error);
    return json({ success: false, error: '创建订单失败' }, { status: 500 });
  }
};
