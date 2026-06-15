import { json, type ActionFunctionArgs } from '@remix-run/node';
import { rollbackToDay } from '~/server/gameService';

export async function action({ params, request }: ActionFunctionArgs) {
  const uuid = params.uuid;
  if (!uuid) return json({ error: 'Missing session uuid' }, { status: 400 });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const body = await request.json();
    const day = Number(body.day);
    if (isNaN(day)) return json({ error: 'Invalid day' }, { status: 400 });
    const state = rollbackToDay(uuid, day);
    return json({ ok: true, state });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to rollback' }, { status: 400 });
  }
}
