import { NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, addProof, addOrderHistory, getProofsByOrderId } from '@/lib/data';

const STATUS_FLOW: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['proof_uploaded'],
  proof_uploaded: ['customer_confirmed', 'customer_rejected'],
  customer_confirmed: ['production_review'],
  customer_rejected: ['proof_uploaded'],
  production_review: ['order_placed', 'order_returned'],
  order_placed: [],
  order_returned: ['proof_uploaded'],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = parseInt(id);

  const body = await request.json();
  const { action, remark, operatorId, operatorName, rejectReason, returnReason, proofImageUrl, proofRemark, colorDeviation } = body;

  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 });
  }

  const currentStatus = order.status;
  let newStatus: string;

  switch (action) {
    case 'submit':
      if (currentStatus !== 'draft') {
        return NextResponse.json({ error: '当前状态不能提交' }, { status: 400 });
      }
      newStatus = 'submitted';
      break;

    case 'upload_proof':
      if (!['submitted', 'customer_rejected', 'order_returned'].includes(currentStatus)) {
        return NextResponse.json({ error: '当前状态不能上传打样' }, { status: 400 });
      }
      newStatus = 'proof_uploaded';

      const proofs = getProofsByOrderId(orderId);
      const newVersion = proofs.length > 0 ? proofs[0].version + 1 : 1;

      addProof({
        orderId,
        version: newVersion,
        imageUrl: proofImageUrl || `/proofs/po${orderId}-v${newVersion}.svg`,
        remark: proofRemark || remark,
        uploadedBy: operatorId || 2,
        colorDeviation: colorDeviation || null,
      });
      break;

    case 'customer_confirm':
      if (currentStatus !== 'proof_uploaded') {
        return NextResponse.json({ error: '当前状态不能确认' }, { status: 400 });
      }
      newStatus = 'customer_confirmed';
      break;

    case 'customer_reject':
      if (currentStatus !== 'proof_uploaded') {
        return NextResponse.json({ error: '当前状态不能拒绝' }, { status: 400 });
      }
      newStatus = 'customer_rejected';
      break;

    case 'send_to_production':
      if (currentStatus !== 'customer_confirmed') {
        return NextResponse.json({ error: '客户未确认，不能下单' }, { status: 400 });
      }
      newStatus = 'production_review';
      break;

    case 'place_order':
      if (currentStatus !== 'production_review') {
        return NextResponse.json({ error: '当前状态不能下单' }, { status: 400 });
      }
      newStatus = 'order_placed';
      break;

    case 'return_order':
      if (currentStatus !== 'production_review') {
        return NextResponse.json({ error: '当前状态不能退回' }, { status: 400 });
      }
      newStatus = 'order_returned';
      break;

    default:
      return NextResponse.json({ error: '未知操作' }, { status: 400 });
  }

  const updates: any = {};
  if (rejectReason) {
    updates.rejectReason = rejectReason;
  }
  if (remark && action === 'customer_reject') {
    updates.rejectRemark = remark;
  }
  if (returnReason) {
    updates.returnReason = returnReason;
  }

  updateOrderStatus(orderId, newStatus, updates);

  addOrderHistory({
    orderId,
    status: newStatus,
    operatorId: operatorId || 1,
    operatorName: operatorName || '系统',
    remark: remark || getDefaultRemark(action),
  });

  return NextResponse.json({ success: true, status: newStatus });
}

function getDefaultRemark(action: string): string {
  const remarks: Record<string, string> = {
    submit: '提交订单',
    upload_proof: '上传打样',
    customer_confirm: '客户确认样稿',
    customer_reject: '客户拒绝样稿',
    send_to_production: '提交生产复核',
    place_order: '复核通过，正式下单',
    return_order: '生产复核退回',
  };
  return remarks[action] || '状态变更';
}
