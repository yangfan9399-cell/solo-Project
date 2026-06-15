import { getDb } from './db';
import type {
  GameSession,
  AdjustmentDetail,
  GearRatioHistory,
  CalibrationResult,
  PartState,
  ErrorDataPoint,
  MaintenanceEvent,
  CalibrationReport,
  WeatherType,
  PartName,
  StrikeOrderStep,
} from '~/types/game';
import {
  PARTS,
  MAX_DAYS,
  TARGET_ERROR_SECONDS,
  TOLERANCE_SECONDS,
  BASE_PENDULUM_LENGTH,
  DEFAULT_GEAR_TEETH,
  VALID_STRIKE_ORDERS,
  pickWeather,
  getTemperature,
  WEATHER_CONFIG,
  calculateTotalError,
  calculateWearForDay,
  calculateScore,
  generateUuid,
  serializeOrder,
  deserializeOrder,
  calculateThermalExpansion,
  randomInt,
  randomFloat,
  repairPart,
} from './gameLogic';

export interface RuntimeState {
  session: GameSession;
  pendulumLength: number;
  thermalLength: number;
  gears: { gearA: number; gearB: number; gearC: number };
  lubrication: number;
  strikeOrder: StrikeOrderStep[];
  partWears: Record<PartName, number>;
  currentWeather: WeatherType;
  currentTemperature: number;
  currentError: number;
  errorHistory: number[];
  weatherHistory: WeatherType[];
  tempHistory: number[];
}

function readPartWears(sessionId: number, day: number): Record<PartName, number> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT part_name, wear_level FROM part_states
    WHERE session_id = ? AND day = ?
  `).all(sessionId, day) as Array<{ part_name: PartName; wear_level: number }>;
  const result: Record<PartName, number> = {} as Record<PartName, number>;
  for (const r of rows) result[r.part_name] = r.wear_level;
  return result;
}

function writePartWears(sessionId: number, day: number, wears: Record<PartName, number>, lastRepairDay: number) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO part_states (session_id, day, part_name, wear_level, max_wear, needs_repair, last_repaired_day)
    VALUES (?, ?, ?, ?, 100, ?, ?)
  `);
  for (const part of PARTS) {
    stmt.run(sessionId, day, part, wears[part], wears[part] > 70 ? 1 : 0, wears[part] > 70 ? lastRepairDay : lastRepairDay);
  }
}

export function getRuntimeState(sessionUuid: string): RuntimeState | null {
  const db = getDb();
  const session = db.prepare(`SELECT * FROM game_sessions WHERE session_uuid = ?`).get(sessionUuid) as GameSession | undefined;
  if (!session) return null;

  const adj = db.prepare(`
    SELECT * FROM adjustment_details
    WHERE session_id = ? AND day = ?
    ORDER BY id DESC LIMIT 1
  `).get(session.id, session.current_day) as AdjustmentDetail | undefined;

  const gear = db.prepare(`
    SELECT * FROM gear_ratio_history
    WHERE session_id = ? AND day = ?
    ORDER BY id DESC LIMIT 1
  `).get(session.id, session.current_day) as GearRatioHistory | undefined;

  const cal = db.prepare(`
    SELECT * FROM calibration_results
    WHERE session_id = ? AND day = ?
    ORDER BY id DESC LIMIT 1
  `).get(session.id, session.current_day) as CalibrationResult | undefined;

  const weather = pickWeather(session.seed_scenario as any, session.current_day);
  const temperature = adj ? adj.temperature : getTemperature(weather);
  const pendulumLen = adj ? adj.pendulum_length_after : BASE_PENDULUM_LENGTH;
  const coeff = WEATHER_CONFIG[weather].expansion;
  const tempDelta = temperature - 20;
  const thermalLen = calculateThermalExpansion(pendulumLen, tempDelta, coeff);

  const gears = gear
    ? { gearA: gear.gearA_teeth_after, gearB: gear.gearB_teeth_after, gearC: gear.gearC_teeth_after }
    : { ...DEFAULT_GEAR_TEETH };

  const lubrication = cal ? cal.lubrication_level_after : randomFloat(50, 75, 1);
  const strikeOrder = cal ? deserializeOrder(cal.strike_order_after) : VALID_STRIKE_ORDERS[0];
  const partWears = readPartWears(session.id, session.current_day);

  const idealLen = (9.80665 * 4) / (4 * Math.PI * Math.PI) * 1000;
  const currentError = calculateTotalError({
    actualPendulumLength: thermalLen,
    idealPendulumLength: idealLen,
    gears,
    lubricationLevel: lubrication,
    strikeOrder,
    partWears,
  });

  const errPoints = db.prepare(`
    SELECT error_seconds FROM error_data_points WHERE session_id = ? ORDER BY day ASC
  `).all(session.id) as Array<{ error_seconds: number }>;
  const errorHistory = errPoints.map(p => p.error_seconds);

  const adjustAll = db.prepare(`
    SELECT weather_today, temperature FROM adjustment_details
    WHERE session_id = ? ORDER BY day ASC
  `).all(session.id) as Array<{ weather_today: WeatherType; temperature: number }>;
  const weatherHistory: WeatherType[] = [];
  const tempHistory: number[] = [];
  for (let d = 1; d < session.current_day; d++) {
    const r = adjustAll[d - 1];
    weatherHistory.push(r?.weather_today ?? pickWeather(session.seed_scenario as any, d));
    tempHistory.push(r?.temperature ?? getTemperature(weatherHistory[d - 1]));
  }

  return {
    session,
    pendulumLength: pendulumLen,
    thermalLength: thermalLen,
    gears,
    lubrication,
    strikeOrder,
    partWears,
    currentWeather: weather,
    currentTemperature: temperature,
    currentError,
    errorHistory,
    weatherHistory,
    tempHistory,
  };
}

export function createSession(
  playerName: string,
  scenario: 'normal' | 'wear_abnormal' | 'rollback'
): RuntimeState {
  const db = getDb();
  const uuid = generateUuid();
  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO game_sessions (session_uuid, player_name, status, current_day, total_days, seed_scenario)
      VALUES (?, ?, 'playing', 1, ?, ?)
    `).run(uuid, playerName || '无名钟匠', MAX_DAYS, scenario);
    const sessionId = Number(info.lastInsertRowid);

    const initWears: Record<PartName, number> = {
      pendulum: scenario === 'wear_abnormal' ? 35 : scenario === 'rollback' ? 15 : 10,
      gearA: scenario === 'wear_abnormal' ? 40 : 12,
      gearB: scenario === 'wear_abnormal' ? 45 : 14,
      gearC: scenario === 'wear_abnormal' ? 42 : 13,
      hammer: scenario === 'wear_abnormal' ? 38 : 11,
      spring: scenario === 'wear_abnormal' ? 36 : 12,
    };
    writePartWears(sessionId, 1, initWears, 0);

    const weather = pickWeather(scenario, 1);
    const temperature = getTemperature(weather);
    const pendulum = BASE_PENDULUM_LENGTH + (scenario === 'normal' ? randomFloat(-15, 15, 2) : scenario === 'wear_abnormal' ? randomFloat(-30, 30, 2) : randomFloat(-20, 25, 2));

    db.prepare(`
      INSERT INTO adjustment_details (session_id, day, pendulum_length_before, pendulum_length_after, weather_today, temperature, metal_expansion_coeff, operator_note)
      VALUES (?, 1, ?, ?, ?, ?, ?, '初始摆长设置')
    `).run(sessionId, BASE_PENDULUM_LENGTH, pendulum, weather, temperature, WEATHER_CONFIG[weather].expansion);

    const gearA = DEFAULT_GEAR_TEETH.gearA + (scenario === 'wear_abnormal' ? randomInt(-4, 4) : randomInt(-2, 2));
    const gearB = DEFAULT_GEAR_TEETH.gearB + (scenario === 'wear_abnormal' ? randomInt(-4, 4) : randomInt(-2, 2));
    const gearC = DEFAULT_GEAR_TEETH.gearC + (scenario === 'wear_abnormal' ? randomInt(-3, 3) : randomInt(-2, 2));
    db.prepare(`
      INSERT INTO gear_ratio_history (session_id, day, gearA_teeth_before, gearA_teeth_after, gearB_teeth_before, gearB_teeth_after, gearC_teeth_before, gearC_teeth_after, reason)
      VALUES (?, 1, ?, ?, ?, ?, ?, ?, '初始齿轮配置')
    `).run(sessionId, DEFAULT_GEAR_TEETH.gearA, gearA, DEFAULT_GEAR_TEETH.gearB, gearB, DEFAULT_GEAR_TEETH.gearC, gearC);

    const lub = randomFloat(40, 65, 1);
    const orderIdx = scenario === 'wear_abnormal' ? 3 : scenario === 'rollback' ? 2 : 1;
    const order = VALID_STRIKE_ORDERS[orderIdx];

    const idealLen = (9.80665 * 4) / (4 * Math.PI * Math.PI) * 1000;
    const coeff = WEATHER_CONFIG[weather].expansion;
    const tempDelta = temperature - 20;
    const thermalLen = calculateThermalExpansion(pendulum, tempDelta, coeff);
    const gears = { gearA, gearB, gearC };
    const initialError = calculateTotalError({
      actualPendulumLength: thermalLen,
      idealPendulumLength: idealLen,
      gears,
      lubricationLevel: lub,
      strikeOrder: order,
      partWears: initWears,
    });

    db.prepare(`
      INSERT INTO calibration_results (session_id, day, lubrication_level_before, lubrication_level_after, strike_order_before, strike_order_after, error_seconds, target_error, pass_threshold)
      VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, 100, lub, serializeOrder(VALID_STRIKE_ORDERS[0]), serializeOrder(order), initialError, TARGET_ERROR_SECONDS, initialError <= TOLERANCE_SECONDS ? 1 : 0);

    db.prepare(`
      INSERT INTO error_data_points (session_id, day, error_seconds, target, tolerance)
      VALUES (?, 1, ?, ?, ?)
    `).run(sessionId, initialError, TARGET_ERROR_SECONDS, TOLERANCE_SECONDS);

    db.prepare(`
      INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
      VALUES (?, 1, 'adjust_pendulum', '初始化钟摆长度', '标准994mm', ? || 'mm')
    `).run(sessionId, pendulum.toFixed(2));
    db.prepare(`
      INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
      VALUES (?, 1, 'change_gear_ratio', '初始化齿轮齿数', '48:36:24', ? || ':' || ? || ':' || ?)
    `).run(sessionId, gearA, gearB, gearC);
  });
  tx();
  const state = getRuntimeState(uuid);
  if (!state) throw new Error('Failed to create session');
  return state;
}

export interface AdjustAction {
  type: 'pendulum' | 'gear' | 'lubrication' | 'strike_order' | 'repair';
  payload: any;
}

export function applyAdjustment(sessionUuid: string, action: AdjustAction): RuntimeState {
  const state = getRuntimeState(sessionUuid);
  if (!state) throw new Error('Session not found');
  if (state.session.status !== 'playing') throw new Error('Session is not playing');

  const db = getDb();
  const sessionId = state.session.id;
  const day = state.session.current_day;

  const tx = db.transaction(() => {
    if (action.type === 'pendulum') {
      const newLen = Number(action.payload.length);
      if (isNaN(newLen) || newLen < 900 || newLen > 1100) throw new Error('摆长必须在900-1100mm之间');
      const before = state.pendulumLength;
      db.prepare(`
        INSERT INTO adjustment_details (session_id, day, pendulum_length_before, pendulum_length_after, weather_today, temperature, metal_expansion_coeff, operator_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sessionId, day, before, newLen, state.currentWeather, state.currentTemperature, WEATHER_CONFIG[state.currentWeather].expansion, action.payload.note || '手动调整摆长');
      db.prepare(`
        INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
        VALUES (?, ?, 'adjust_pendulum', '调整钟摆长度', ?, ?)
      `).run(sessionId, day, before.toFixed(2) + 'mm', newLen.toFixed(2) + 'mm');
    }

    if (action.type === 'gear') {
      const { gearA, gearB, gearC, reason } = action.payload;
      const a = Number(gearA), b = Number(gearB), c = Number(gearC);
      if ([a, b, c].some(x => isNaN(x) || x < 10 || x > 80)) throw new Error('齿轮齿数必须在10-80之间');
      db.prepare(`
        INSERT INTO gear_ratio_history (session_id, day, gearA_teeth_before, gearA_teeth_after, gearB_teeth_before, gearB_teeth_after, gearC_teeth_before, gearC_teeth_after, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sessionId, day, state.gears.gearA, a, state.gears.gearB, b, state.gears.gearC, c, reason || '调整齿轮比');
      db.prepare(`
        INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
        VALUES (?, ?, 'change_gear_ratio', '更换齿轮比', ?, ?)
      `).run(sessionId, day, `${state.gears.gearA}:${state.gears.gearB}:${state.gears.gearC}`, `${a}:${b}:${c}`);
    }

    if (action.type === 'lubrication') {
      const level = Number(action.payload.level);
      if (isNaN(level) || level < 0 || level > 100) throw new Error('润滑度必须在0-100之间');
      const before = state.lubrication;
      db.prepare(`
        INSERT INTO calibration_results (session_id, day, lubrication_level_before, lubrication_level_after, strike_order_before, strike_order_after, error_seconds, target_error, pass_threshold)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0)
      `).run(sessionId, day, before, level, serializeOrder(state.strikeOrder), serializeOrder(state.strikeOrder), TARGET_ERROR_SECONDS);
      db.prepare(`
        INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
        VALUES (?, ?, 'lubricate', '润滑齿轮组', ?, ?)
      `).run(sessionId, day, before.toFixed(1) + '%', level.toFixed(1) + '%');
    }

    if (action.type === 'strike_order') {
      const order = action.payload.order as StrikeOrderStep[];
      if (!order || order.length !== 4) throw new Error('锤击顺序无效');
      const before = state.strikeOrder;
      const lastCal = db.prepare(`
        SELECT * FROM calibration_results WHERE session_id = ? AND day = ? ORDER BY id DESC LIMIT 1
      `).get(sessionId, day) as CalibrationResult | undefined;
      const lub = lastCal ? lastCal.lubrication_level_after : state.lubrication;
      db.prepare(`
        INSERT INTO calibration_results (session_id, day, lubrication_level_before, lubrication_level_after, strike_order_before, strike_order_after, error_seconds, target_error, pass_threshold)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0)
      `).run(sessionId, day, lub, lub, serializeOrder(before), serializeOrder(order), TARGET_ERROR_SECONDS);
      db.prepare(`
        INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
        VALUES (?, ?, 'strike_order', '调整报时锤击顺序', ?, ?)
      `).run(sessionId, day, serializeOrder(before), serializeOrder(order));
    }

    if (action.type === 'repair') {
      const part = action.payload.part as PartName;
      if (!PARTS.includes(part)) throw new Error('零件名称无效');
      const before = state.partWears[part];
      const after = repairPart(before);
      const newWears = { ...state.partWears, [part]: after };
      const stmt = db.prepare(`
        INSERT INTO part_states (session_id, day, part_name, wear_level, max_wear, needs_repair, last_repaired_day)
        VALUES (?, ?, ?, ?, 100, ?, ?)
      `);
      for (const p of PARTS) {
        stmt.run(sessionId, day, p, newWears[p], newWears[p] > 70 ? 1 : 0, p === part ? day : day);
      }
      db.prepare(`
        INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
        VALUES (?, ?, 'repair_part', '更换/修复零件 ' || ?, ?, ?)
      `).run(sessionId, day, part, before.toFixed(1) + '%', after.toFixed(1) + '%');
    }
  });
  tx();

  const s = getRuntimeState(sessionUuid);
  if (!s) throw new Error('Session lost');
  return s;
}

export function advanceDay(sessionUuid: string): RuntimeState {
  const state = getRuntimeState(sessionUuid);
  if (!state) throw new Error('Session not found');
  if (state.session.status !== 'playing') throw new Error('Session is not playing');

  const db = getDb();
  const sessionId = state.session.id;
  const nextDay = state.session.current_day + 1;

  const idealLen = (9.80665 * 4) / (4 * Math.PI * Math.PI) * 1000;
  const eveningError = calculateTotalError({
    actualPendulumLength: state.thermalLength,
    idealPendulumLength: idealLen,
    gears: state.gears,
    lubricationLevel: state.lubrication,
    strikeOrder: state.strikeOrder,
    partWears: state.partWears,
  });

  const tx = db.transaction(() => {
    const lastCal = db.prepare(`
      SELECT * FROM calibration_results WHERE session_id = ? AND day = ? ORDER BY id DESC LIMIT 1
    `).get(sessionId, state.session.current_day) as CalibrationResult | undefined;

    if (lastCal) {
      db.prepare(`
        UPDATE calibration_results SET error_seconds = ?, pass_threshold = ?
        WHERE id = ?
      `).run(eveningError, eveningError <= TOLERANCE_SECONDS ? 1 : 0, lastCal.id);
    }

    const lastErr = db.prepare(`
      SELECT * FROM error_data_points WHERE session_id = ? AND day = ?
    `).get(sessionId, state.session.current_day) as ErrorDataPoint | undefined;
    if (lastErr) {
      db.prepare(`UPDATE error_data_points SET error_seconds = ? WHERE id = ?`).run(eveningError, lastErr.id);
    }

    if (nextDay > MAX_DAYS) {
      const score = recalculateScore(sessionId);
      db.prepare(`
        UPDATE game_sessions SET status = ?, finished_at = datetime('now'), final_score = ?, current_day = ?
        WHERE id = ?
      `).run(eveningError <= TOLERANCE_SECONDS ? 'completed' : 'failed', score, MAX_DAYS, sessionId);
    } else {
      db.prepare(`UPDATE game_sessions SET current_day = ? WHERE id = ?`).run(nextDay, sessionId);

      const weather = pickWeather(state.session.seed_scenario as any, nextDay);
      const temperature = getTemperature(weather);

      const newWears = calculateWearForDay(
        state.partWears,
        weather,
        state.lubrication,
        state.session.seed_scenario as any,
        nextDay
      );
      writePartWears(sessionId, nextDay, newWears, state.session.current_day);

      const coeff = WEATHER_CONFIG[weather].expansion;
      const tempDelta = temperature - 20;
      const thermalLen = calculateThermalExpansion(state.pendulumLength, tempDelta, coeff);
      const morningError = calculateTotalError({
        actualPendulumLength: thermalLen,
        idealPendulumLength: idealLen,
        gears: state.gears,
        lubricationLevel: state.lubrication,
        strikeOrder: state.strikeOrder,
        partWears: newWears,
      });

      db.prepare(`
        INSERT INTO adjustment_details (session_id, day, pendulum_length_before, pendulum_length_after, weather_today, temperature, metal_expansion_coeff, operator_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, '日期变更，天气变化导致热胀冷缩')
      `).run(sessionId, nextDay, state.pendulumLength, state.pendulumLength, weather, temperature, coeff);

      db.prepare(`
        INSERT INTO gear_ratio_history (session_id, day, gearA_teeth_before, gearA_teeth_after, gearB_teeth_before, gearB_teeth_after, gearC_teeth_before, gearC_teeth_after, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '日期变更，齿轮比保持')
      `).run(sessionId, nextDay, state.gears.gearA, state.gears.gearA, state.gears.gearB, state.gears.gearB, state.gears.gearC, state.gears.gearC);

      db.prepare(`
        INSERT INTO calibration_results (session_id, day, lubrication_level_before, lubrication_level_after, strike_order_before, strike_order_after, error_seconds, target_error, pass_threshold)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sessionId, nextDay, state.lubrication, state.lubrication, serializeOrder(state.strikeOrder), serializeOrder(state.strikeOrder), morningError, TARGET_ERROR_SECONDS, morningError <= TOLERANCE_SECONDS ? 1 : 0);

      db.prepare(`
        INSERT INTO error_data_points (session_id, day, error_seconds, target, tolerance)
        VALUES (?, ?, ?, ?, ?)
      `).run(sessionId, nextDay, morningError, TARGET_ERROR_SECONDS, TOLERANCE_SECONDS);
    }
  });
  tx();

  const s = getRuntimeState(sessionUuid);
  if (!s) throw new Error('Session lost');
  return s;
}

export function rollbackToDay(sessionUuid: string, targetDay: number): RuntimeState {
  const state = getRuntimeState(sessionUuid);
  if (!state) throw new Error('Session not found');
  if (targetDay < 1 || targetDay >= state.session.current_day) throw new Error('回滚日期无效');

  const db = getDb();
  const sessionId = state.session.id;

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM adjustment_details WHERE session_id = ? AND day > ?`).run(sessionId, targetDay);
    db.prepare(`DELETE FROM gear_ratio_history WHERE session_id = ? AND day > ?`).run(sessionId, targetDay);
    db.prepare(`DELETE FROM calibration_results WHERE session_id = ? AND day > ?`).run(sessionId, targetDay);
    db.prepare(`DELETE FROM part_states WHERE session_id = ? AND day > ?`).run(sessionId, targetDay);
    db.prepare(`DELETE FROM error_data_points WHERE session_id = ? AND day > ?`).run(sessionId, targetDay);
    db.prepare(`DELETE FROM maintenance_events WHERE session_id = ? AND day > ?`).run(sessionId, targetDay);

    db.prepare(`
      UPDATE game_sessions SET current_day = ?, status = 'playing', finished_at = NULL, final_score = NULL
      WHERE id = ?
    `).run(targetDay, sessionId);

    db.prepare(`
      INSERT INTO maintenance_events (session_id, day, event_type, description, before_state, after_state)
      VALUES (?, ?, 'rollback', '回滚游戏状态到第' || ? || '天', ?, ?)
    `).run(sessionId, targetDay, targetDay, `day=${state.session.current_day}`, `day=${targetDay}`);
  });
  tx();

  const s = getRuntimeState(sessionUuid);
  if (!s) throw new Error('Session lost');
  return s;
}

export function recalculateScore(sessionId: number): number {
  const db = getDb();
  const errors = db.prepare(`
    SELECT error_seconds FROM error_data_points WHERE session_id = ? ORDER BY day ASC
  `).all(sessionId) as Array<{ error_seconds: number }>;
  const events = db.prepare(`
    SELECT event_type FROM maintenance_events WHERE session_id = ?
  `).all(sessionId) as Array<{ event_type: string }>;

  const adjustmentsCount = events.filter(e => ['adjust_pendulum', 'change_gear_ratio', 'lubricate', 'strike_order'].includes(e.event_type)).length;
  const repairCount = events.filter(e => e.event_type === 'repair_part').length;

  const dailyErrors = errors.map(e => e.error_seconds);
  const finalError = dailyErrors[dailyErrors.length - 1] ?? 999;

  return calculateScore({
    dailyErrors,
    adjustmentsCount,
    repairCount,
    finalError,
    targetError: TARGET_ERROR_SECONDS,
  });
}

export function generateReport(sessionUuid: string): CalibrationReport | null {
  const state = getRuntimeState(sessionUuid);
  if (!state) return null;
  const db = getDb();
  const sessionId = state.session.id;

  const errors = db.prepare(`
    SELECT day, error_seconds FROM error_data_points WHERE session_id = ? ORDER BY day ASC
  `).all(sessionId) as Array<{ day: number; error_seconds: number }>;

  const adjusts = db.prepare(`
    SELECT day, weather_today, temperature, pendulum_length_before, pendulum_length_after FROM adjustment_details
    WHERE session_id = ? ORDER BY day ASC, id ASC
  `).all(sessionId) as Array<any>;

  const parts = db.prepare(`
    SELECT day, part_name, wear_level FROM part_states WHERE session_id = ? ORDER BY day ASC, part_name ASC
  `).all(sessionId) as Array<{ day: number; part_name: PartName; wear_level: number }>;

  const events = db.prepare(`
    SELECT day, event_type, description, before_state, after_state FROM maintenance_events
    WHERE session_id = ? ORDER BY day ASC, id ASC
  `).all(sessionId) as Array<any>;

  const partsByDay: Record<number, Record<PartName, number>> = {};
  for (const p of parts) {
    if (!partsByDay[p.day]) partsByDay[p.day] = {} as Record<PartName, number>;
    partsByDay[p.day][p.part_name] = p.wear_level;
  }

  const dailyLogs: CalibrationReport['daily_logs'] = [];
  const daysCount = Math.min(state.session.current_day, MAX_DAYS);
  for (let d = 1; d <= daysCount; d++) {
    const dayAdj = adjusts.filter(a => a.day === d);
    const dayEvents = events.filter(e => e.day === d && e.event_type !== 'rollback');
    const err = errors.find(e => e.day === d)?.error_seconds ?? 0;
    const weather = (dayAdj[0]?.weather_today as WeatherType) ?? pickWeather(state.session.seed_scenario as any, d);
    const temp = dayAdj[0]?.temperature ?? getTemperature(weather);

    dailyLogs.push({
      day: d,
      weather,
      temperature: temp,
      morning_error: d === 1 ? err : (errors.find(e => e.day === d - 1)?.error_seconds ?? 0),
      adjustments: dayEvents.map((e: any) => `${e.event_type}: ${e.description} (${e.before_state} → ${e.after_state})`),
      evening_error: err,
      parts_condition: partsByDay[d] ?? ({} as Record<PartName, number>),
    });
  }

  const initialParts = partsByDay[1] ?? ({} as Record<PartName, number>);
  const finalError = errors[errors.length - 1]?.error_seconds ?? 999;
  const totalAdjustments = events.filter((e: any) => ['adjust_pendulum', 'change_gear_ratio', 'lubricate', 'strike_order'].includes(e.event_type)).length;
  const partsRepaired = events.filter((e: any) => e.event_type === 'repair_part').length;
  const score = recalculateScore(sessionId);

  const perfectDays = errors.filter(e => e.error_seconds <= TARGET_ERROR_SECONDS).length;
  const accuracy = Math.round((perfectDays / daysCount) * 100);

  const verdict = finalError <= TARGET_ERROR_SECONDS ? 'perfect' : finalError <= TOLERANCE_SECONDS ? 'pass' : 'fail';

  const changeCauses: CalibrationReport['change_causes'] = [];
  for (let i = 1; i < errors.length; i++) {
    const prev = errors[i - 1];
    const curr = errors[i];
    const diff = Math.round((curr.error_seconds - prev.error_seconds) * 100) / 100;
    const dayEvents = events.filter((e: any) => e.day === curr.day);
    const wea = (adjusts.find(a => a.day === curr.day)?.weather_today as WeatherType) ?? 'sunny';
    const causes: string[] = [];
    if (dayEvents.some((e: any) => e.event_type === 'adjust_pendulum')) causes.push('调整摆长');
    if (dayEvents.some((e: any) => e.event_type === 'change_gear_ratio')) causes.push('更换齿轮比');
    if (dayEvents.some((e: any) => e.event_type === 'lubricate')) causes.push('润滑处理');
    if (dayEvents.some((e: any) => e.event_type === 'strike_order')) causes.push('调整锤击顺序');
    if (dayEvents.some((e: any) => e.event_type === 'repair_part')) causes.push('零件修复');
    if (wea !== 'sunny') causes.push(`${WEATHER_CONFIG[wea].description.split('：')[0]}天气影响`);
    if (causes.length === 0) causes.push('自然磨损积累');

    changeCauses.push({
      day: curr.day,
      cause: causes.join('、'),
      impact: diff > 0 ? '误差增加' : diff < 0 ? '误差减少' : '误差不变',
      error_change: diff,
    });
  }

  return {
    session_id: sessionId,
    start_summary: {
      initial_error: errors[0]?.error_seconds ?? 0,
      initial_parts_condition: initialParts,
      initial_weather: dailyLogs[0]?.weather ?? 'sunny',
    },
    daily_logs: dailyLogs,
    final_summary: {
      final_error: finalError,
      total_adjustments: totalAdjustments,
      parts_repaired: partsRepaired,
      score,
      accuracy,
      verdict,
    },
    change_causes: changeCauses,
  };
}

export function listSessions(limit = 20) {
  const db = getDb();
  return db.prepare(`SELECT * FROM game_sessions ORDER BY id DESC LIMIT ?`).all(limit) as GameSession[];
}
