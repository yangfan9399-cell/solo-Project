import { NextResponse } from 'next/server';
import { getOrderById, getCustomerById, getUserById, getProofsByOrderId, getOrderHistoryByOrderId } from '@/lib/data';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = parseInt(id);

  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  const customer = getCustomerById(order.customerId);
  const sales = getUserById(order.salesId);
  const proofs = getProofsByOrderId(orderId);
  const history = getOrderHistoryByOrderId(orderId);

  return NextResponse.json({
    order: {
      id: order.id,
      orderNo: order.orderNo,
      productName: order.productName,
      category: order.category,
      quantity: order.quantity,
      paperType: order.paperType,
      paperWeight: order.paperWeight,
      size: order.size,
      craft: order.craft,
      colorMode: order.colorMode,
      description: order.description,
      status: order.status,
      deliveryDate: order.deliveryDate,
      originalDeliveryDate: order.originalDeliveryDate,
      rejectReason: order.rejectReason,
      rejectRemark: order.rejectRemark,
      returnReason: order.returnReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerId: customer?.id,
      customerName: customer?.name || '未知客户',
      contactPerson: customer?.contactPerson || '',
      customerPhone: customer?.phone || '',
      customerEmail: customer?.email,
      customerAddress: customer?.address,
      salesName: sales?.name || '未知业务员',
    },
    proofs,
    history,
  });
}
