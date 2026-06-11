import { NextResponse } from 'next/server';
import { getOrders, getCustomerById, getUserById, createOrder, addOrderHistory } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let orders = getOrders();

  if (status && status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }
  if (customerId) {
    orders = orders.filter((o) => o.customerId === parseInt(customerId));
  }
  if (category && category !== 'all') {
    orders = orders.filter((o) => o.category === category);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.productName.toLowerCase().includes(searchLower) ||
        o.orderNo.toLowerCase().includes(searchLower)
    );
  }

  const result = orders.map((order) => {
    const customer = getCustomerById(order.customerId);
    const sales = getUserById(order.salesId);
    return {
      id: order.id,
      orderNo: order.orderNo,
      productName: order.productName,
      category: order.category,
      quantity: order.quantity,
      status: order.status,
      deliveryDate: order.deliveryDate,
      originalDeliveryDate: order.originalDeliveryDate,
      customerName: customer?.name || '未知客户',
      salesName: sales?.name || '未知业务员',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();

  const order = createOrder({
    customerId: body.customerId,
    productName: body.productName,
    category: body.category,
    quantity: body.quantity,
    paperType: body.paperType,
    paperWeight: body.paperWeight,
    size: body.size,
    craft: body.craft,
    colorMode: body.colorMode,
    description: body.description,
    deliveryDate: body.deliveryDate,
    salesId: body.salesId || 1,
    designerId: body.designerId || 2,
    status: body.status || 'draft',
  });

  if (body.status && body.status !== 'draft') {
    addOrderHistory({
      orderId: order.id,
      status: body.status,
      operatorId: body.salesId || 1,
      operatorName: '张经理',
      remark: '创建订单',
    });
  }

  return NextResponse.json(order);
}
