import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { listSessions } from '~/server/gameService';

export async function loader(_args: LoaderFunctionArgs) {
  const sessions = listSessions(50);
  return json({ ok: true, sessions });
}
