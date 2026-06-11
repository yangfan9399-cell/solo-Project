import { NextResponse } from 'next/server';
import { initDatabase } from '@/db/init';
import { getOrderById, getProofsByOrderId, getOrderHistoryByOrderId } from '@/db/queries';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await initDatabase();

  const { id } = await params;
  const orderId = parseInt(id);

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  const proofList = await getProofsByOrderId(orderId);
  const history = await getOrderHistoryByOrderId(orderId);

  return NextResponse.json({
    order,
    proofs: proofList,
    history,
  });
}
