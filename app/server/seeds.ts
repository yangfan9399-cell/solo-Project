import {
  createSession,
  applyAdjustment,
  advanceDay,
  rollbackToDay,
  getRuntimeState,
  recalculateScore,
} from './gameService';
import { getDb } from './db';
import { VALID_STRIKE_ORDERS, TARGET_ERROR_SECONDS } from './gameLogic';

export function seedAllScenarios(): { normal: string; wear: string; rollback: string } {
  clearSessions();
  const normal = seedNormalScenario();
  const wear = seedWearAbnormalScenario();
  const rollback = seedRollbackScenario();
  return { normal, wear, rollback };
}

function clearSessions() {
  const db = getDb();
  db.prepare(`DELETE FROM game_sessions`).run();
}

function seedNormalScenario(): string {
  let state = createSession('钟匠·老李', 'normal');
  const uuid = state.session.session_uuid;

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 994.5, note: '微调摆长，降低热胀影响' } });
  state = applyAdjustment(uuid, { type: 'gear', payload: { gearA: 48, gearB: 36, gearC: 24, reason: '还原标准齿轮比' } });
  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 88 } });
  state = applyAdjustment(uuid, { type: 'strike_order', payload: { order: VALID_STRIKE_ORDERS[0] } });
  state = advanceDay(uuid);

  if (state.partWears.pendulum > 40) applyAdjustment(uuid, { type: 'repair', payload: { part: 'pendulum' } });
  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 995.2, note: '温度下降，补偿收缩' } });
  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 90 } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 993.8, note: '潮湿天气微调' } });
  if (Object.values(state.partWears).some(w => w > 55)) {
    for (const [p, w] of Object.entries(state.partWears)) {
      if (w > 60) applyAdjustment(uuid, { type: 'repair', payload: { part: p } });
    }
  }
  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 92 } });
  state = advanceDay(uuid);

  for (let d = 4; d <= 7; d++) {
    state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 994 + (Math.random() * 2 - 1), note: `Day${d} 热胀补偿` } });
    state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 90 + Math.random() * 5 } });
    state = advanceDay(uuid);
  }

  const db = getDb();
  db.prepare(`UPDATE game_sessions SET final_score = ? WHERE session_uuid = ?`).run(recalculateScore(state.session.id), uuid);
  return uuid;
}

function seedWearAbnormalScenario(): string {
  let state = createSession('学徒·小王', 'wear_abnormal');
  const uuid = state.session.session_uuid;

  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 55 } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 1000, note: '初始调整过度' } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 50 } });
  for (const [p, w] of Object.entries(state.partWears)) {
    if (w > 65) applyAdjustment(uuid, { type: 'repair', payload: { part: p } });
  }
  state = applyAdjustment(uuid, { type: 'gear', payload: { gearA: 52, gearB: 34, gearC: 22, reason: '错误更换齿轮' } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'strike_order', payload: { order: VALID_STRIKE_ORDERS[4] } });
  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 980, note: '过度纠正' } });
  state = advanceDay(uuid);

  for (let d = 5; d <= 7; d++) {
    if (d === 5) state = applyAdjustment(uuid, { type: 'repair', payload: { part: 'hammer' } });
    state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 992 + Math.random() * 4 - 2, note: `Day${d} 尝试修正` } });
    state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 60 + Math.random() * 15 } });
    state = advanceDay(uuid);
  }

  const db = getDb();
  const finalState = getRuntimeState(uuid);
  if (finalState) {
    db.prepare(`UPDATE game_sessions SET final_score = ?, status = ? WHERE session_uuid = ?`).run(
      recalculateScore(finalState.session.id),
      finalState.currentError > TARGET_ERROR_SECONDS * 3 ? 'failed' : 'completed',
      uuid
    );
  }
  return uuid;
}

function seedRollbackScenario(): string {
  let state = createSession('资深·陈师傅', 'rollback');
  const uuid = state.session.session_uuid;

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 994, note: '标准摆长' } });
  state = applyAdjustment(uuid, { type: 'gear', payload: { gearA: 48, gearB: 36, gearC: 24, reason: '标准比' } });
  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 85 } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 88 } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 996, note: '预期降温，提前加长' } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 1010, note: '错误判断，大幅加长' } });
  state = applyAdjustment(uuid, { type: 'gear', payload: { gearA: 50, gearB: 30, gearC: 25, reason: '实验性改动' } });
  state = applyAdjustment(uuid, { type: 'strike_order', payload: { order: VALID_STRIKE_ORDERS[3] } });
  state = advanceDay(uuid);

  state = rollbackToDay(uuid, 3);
  state = getRuntimeState(uuid)!;
  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 994.5, note: '回滚后修正：恢复正常摆长' } });
  state = applyAdjustment(uuid, { type: 'gear', payload: { gearA: 48, gearB: 36, gearC: 24, reason: '回滚后恢复标准齿轮比' } });
  state = applyAdjustment(uuid, { type: 'strike_order', payload: { order: VALID_STRIKE_ORDERS[0] } });
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 92 } });
  for (const [p, w] of Object.entries(state.partWears)) {
    if (w > 55) applyAdjustment(uuid, { type: 'repair', payload: { part: p } });
  }
  state = advanceDay(uuid);

  state = applyAdjustment(uuid, { type: 'pendulum', payload: { length: 994, note: '最终校准' } });
  state = applyAdjustment(uuid, { type: 'lubrication', payload: { level: 95 } });
  state = advanceDay(uuid);

  const db = getDb();
  db.prepare(`UPDATE game_sessions SET final_score = ? WHERE session_uuid = ?`).run(recalculateScore(state.session.id), uuid);
  return uuid;
}
