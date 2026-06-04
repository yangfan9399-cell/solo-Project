import type { APIRoute } from 'astro';
import { getExceptionById, getHistoriesByExceptionId, seedData, isInited } from '../../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  if (!isInited()) seedData();

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  const record = getExceptionById(id);
  if (!record) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const histories = getHistoriesByExceptionId(id);

  return new Response(
    JSON.stringify({ ...record, histories }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
