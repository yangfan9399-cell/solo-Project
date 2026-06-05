import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
  const customers = await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });

  return json(customers);
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        region: data.region
      }
    });

    return json({ success: true, customer });
  } catch (error) {
    console.error('创建客户失败:', error);
    return json({ success: false, error: '创建客户失败' }, { status: 500 });
  }
};
