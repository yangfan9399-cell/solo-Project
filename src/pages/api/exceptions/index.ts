import type { APIRoute } from 'astro';
import { queryExceptions, seedData, isInited, getAllExceptions } from '../../../lib/db';
import type { ExceptionType, PaymentChannel, RecordStatus } from '../../../lib/types';

export const GET: APIRoute = async ({ url }) => {
  if (!isInited()) seedData();

  const type = url.searchParams.get('type') as ExceptionType | null;
  const channel = url.searchParams.get('channel') as PaymentChannel | null;
  const status = url.searchParams.get('status') as RecordStatus | null;
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '20'));

  const allRecords = queryExceptions({
    type: type || undefined,
    channel: channel || undefined,
    status: status || undefined,
  });

  const total = allRecords.length;
  const start = (page - 1) * limit;
  const data = allRecords.slice(start, start + limit);

  return new Response(
    JSON.stringify({ data, total }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
