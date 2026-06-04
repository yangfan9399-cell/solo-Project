import type { APIRoute } from 'astro';
import { queryExceptions, seedData, isInited } from '../../../lib/db';
import type { ExceptionType, PaymentChannel } from '../../../lib/types';
import { EXCEPTION_TYPE_LABELS, PAYMENT_CHANNEL_LABELS } from '../../../lib/types';

export const GET: APIRoute = async ({ url }) => {
  if (!isInited()) seedData();

  const type = url.searchParams.get('type') as string | null;
  const channel = url.searchParams.get('channel') as string | null;
  const result = url.searchParams.get('result') as string | null;

  let allRecords = queryExceptions({});

  if (type) {
    const typeKey = Object.entries(EXCEPTION_TYPE_LABELS).find(([, v]) => v === type)?.[0];
    if (typeKey) allRecords = allRecords.filter((r) => r.exception_type === typeKey);
  }
  if (channel) {
    const channelKey = Object.entries(PAYMENT_CHANNEL_LABELS).find(([, v]) => v === channel)?.[0];
    if (channelKey) allRecords = allRecords.filter((r) => r.payment_channel === channelKey);
  }
  if (result === '退款成功') {
    allRecords = allRecords
      .filter((r) => ['duplicate_deduction', 'refund_failed'].includes(r.exception_type))
      .filter((r) => r.status === 'completed');
  } else if (result === '退款失败') {
    allRecords = allRecords.filter((r) => r.exception_type === 'refund_failed' && r.status !== 'completed');
  } else if (result === '退款中') {
    allRecords = allRecords
      .filter((r) => ['duplicate_deduction', 'refund_failed'].includes(r.exception_type))
      .filter((r) => ['refund_submitted', 'reviewing'].includes(r.status));
  }

  return new Response(JSON.stringify({ data: allRecords }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
