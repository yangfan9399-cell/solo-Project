import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { generateReport, recalculateScore, getRuntimeState } from '~/server/gameService';
import { getDb } from '~/server/db';

export async function loader({ params }: LoaderFunctionArgs) {
  const uuid = params.uuid;
  if (!uuid) return json({ error: 'Missing session uuid' }, { status: 400 });
  const state = getRuntimeState(uuid);
  if (!state) return json({ error: 'Session not found' }, { status: 404 });

  let score = state.session.final_score;
  if (score == null) {
    score = recalculateScore(state.session.id);
    const db = getDb();
    db.prepare(`UPDATE game_sessions SET final_score = ? WHERE id = ?`).run(score, state.session.id);
  }

  const report = generateReport(uuid);
  return json({ ok: true, report, score });
}
