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
  const { operator, action, remark } = body;
  const now = new Date().toISOString();

  if (action === 'confirm') {
    updateException(id, { status: 'completed', updated_at: now });

    insertHistory({
      id: randomUUID(),
      exception_id: id,
      operator: operator || '复核人',
      operator_role: 'reviewer',
      action: 'review_confirmed',
      remark: remark || '复核确认，同意处理结果',
      created_at: now,
    });

    insertHistory({
      id: randomUUID(),
      exception_id: id,
      operator: '系统',
      operator_role: 'handler',
      action: 'completed',
      remark: '处理完成',
      created_at: now,
    });
  } else if (action === 'return') {
    updateException(id, { status: 'returned', updated_at: now });

    insertHistory({
      id: randomUUID(),
      exception_id: id,
      operator: operator || '复核人',
      operator_role: 'reviewer',
      action: 'returned_for_evidence',
      remark: remark || '退回，要求补充证据',
      created_at: now,
    });
  }

  const record = getExceptionById(id);

  return new Response(JSON.stringify(record), {
    headers: { 'Content-Type': 'application/json' },
  });
};
