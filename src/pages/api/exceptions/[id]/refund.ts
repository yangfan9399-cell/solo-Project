import type { APIRoute } from 'astro';
import { getExceptionById, updateException, insertHistory, seedData, isInited } from '../../../../lib/db';
import { randomUUID } from 'crypto';

export const POST: APIRoute = async ({ params, request }) => {
  if (!isInited()) seedData();

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  const body = await request.json();
  const { operator, basis, amount, account } = body;
  const now = new Date().toISOString();

  updateException(id, {
    status: 'refund_submitted',
    refund_basis: basis,
    refund_amount: amount,
    refund_account: account,
    updated_at: now,
  });

  insertHistory({
    id: randomUUID(),
    exception_id: id,
    operator: operator || '经办人',
    operator_role: 'handler',
    action: 'refund_submitted',
    remark: `提交退款申请，退款依据：${basis}，退款金额：${amount}，退款账户：${account}`,
    created_at: now,
  });

  const record = getExceptionById(id);

  return new Response(JSON.stringify(record), {
    headers: { 'Content-Type': 'application/json' },
  });
};
