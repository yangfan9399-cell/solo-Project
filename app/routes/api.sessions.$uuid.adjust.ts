import { json, type ActionFunctionArgs } from '@remix-run/node';
import { applyAdjustment } from '~/server/gameService';

export async function action({ params, request }: ActionFunctionArgs) {
  const uuid = params.uuid;
  if (!uuid) return json({ error: 'Missing session uuid' }, { status: 400 });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const body = await request.json();
    const state = applyAdjustment(uuid, body);
    return json({ ok: true, state });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to apply adjustment' }, { status: 400 });
  }
}
