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
  const { operator, remark } = body;
  const now = new Date().toISOString();

  updateException(id, {
    status: 'supplement_submitted',
    updated_at: now,
  });

  insertHistory({
    id: randomUUID(),
    exception_id: id,
    operator: operator || '经办人',
    operator_role: 'handler',
    action: 'supplement_submitted',
    remark: remark || '提交补记账申请，将充值金额直接入账到餐卡',
    created_at: now,
  });

  const record = getExceptionById(id);

  return new Response(JSON.stringify(record), {
    headers: { 'Content-Type': 'application/json' },
  });
};
