import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createSession } from '~/server/gameService';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const body = await request.json();
    const { playerName, scenario } = body;
    const validScenarios = ['normal', 'wear_abnormal', 'rollback'] as const;
    if (!validScenarios.includes(scenario)) {
      return json({ error: 'Invalid scenario' }, { status: 400 });
    }
    const state = createSession(playerName || '无名钟匠', scenario);
    return json({ ok: true, sessionUuid: state.session.session_uuid, state });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to create session' }, { status: 500 });
  }
}
