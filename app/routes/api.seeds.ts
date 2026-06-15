import { json, type ActionFunctionArgs } from '@remix-run/node';
import { seedAllScenarios } from '~/server/seeds';
import { listSessions } from '~/server/gameService';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });
  const uuids = seedAllScenarios();
  const sessions = listSessions(10);
  return json({ ok: true, uuids, sessions });
}

export async function loader() {
  const sessions = listSessions(10);
  return json({ ok: true, sessions, seeded: sessions.length >= 3 });
}
