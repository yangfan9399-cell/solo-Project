import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { getRuntimeState } from '~/server/gameService';

export async function loader({ params }: LoaderFunctionArgs) {
  const uuid = params.uuid;
  if (!uuid) return json({ error: 'Missing session uuid' }, { status: 400 });
  const state = getRuntimeState(uuid);
  if (!state) return json({ error: 'Session not found' }, { status: 404 });
  return json({ ok: true, state });
}
