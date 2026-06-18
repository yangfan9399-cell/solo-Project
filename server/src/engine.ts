import type { GameState, GameStep, LevelId, Settlement } from './types';
import { LEVELS, applyEvent } from './levels';

interface Session {
  state: GameState;
}

const sessions = new Map<string, Session>();

export function createSession(levelId: LevelId, sessionId: string): GameState {
  const level = LEVELS[levelId];
  const state: GameState = {
    levelId,
    currentField: { ...level.initialField },
    steps: [],
    isFinished: false,
    isWin: false,
    hiddenTriggered: false,
    message: `${level.name} 开始！目标：${level.targetText}`,
  };
  sessions.set(sessionId, { state });
  return state;
}

export function getSession(sessionId: string): GameState | null {
  const s = sessions.get(sessionId);
  return s ? s.state : null;
}

export function listLevels() {
  return Object.values(LEVELS).map((l) => ({
    id: l.id,
    name: l.name,
    subtitle: l.subtitle,
    description: l.description,
    targetText: l.targetText,
    failText: l.failText,
    hiddenText: l.hiddenText,
    maxSteps: l.maxSteps,
    initialField: l.initialField,
    mapNodes: l.mapNodes,
    mapPaths: l.mapPaths,
    availableEvents: l.availableEvents,
  }));
}

export function applyStep(sessionId: string, eventId: string): { state: GameState; step: GameStep } | { error: string } {
  const session = sessions.get(sessionId);
  if (!session) return { error: '协作会话不存在，请重新开始本局' };
  if (session.state.isFinished) return { error: '本局已结束，无法继续提交，请重开新局' };

  const level = LEVELS[session.state.levelId];
  const event = level.availableEvents.find((e) => e.id === eventId);
  if (!event) return { error: '事件不存在，请从可用事件中选择' };
  if (session.state.steps.length >= level.maxSteps) return { error: '已达到最大协作步数，无法继续' };

  const newField = applyEvent(session.state.currentField, event);
  const step: GameStep = {
    stepIndex: session.state.steps.length,
    timestamp: Date.now(),
    eventId,
    fieldAfter: { ...newField },
    note: event.name,
  };
  session.state.steps.push(step);
  session.state.currentField = newField;

  const hiddenTriggered = level.hiddenCondition ? level.hiddenCondition(newField, session.state.steps) : false;
  session.state.hiddenTriggered = hiddenTriggered;

  const isFail = level.failCondition(newField);
  const isWin = level.targetCondition(newField);

  if (isFail) {
    session.state.isFinished = true;
    session.state.isWin = false;
    session.state.message = `⚠️ 失败：${level.failText}。${hiddenTriggered ? '（但已触发隐藏条件）' : ''}`;
  } else if (isWin) {
    session.state.isFinished = true;
    session.state.isWin = true;
    session.state.message = hiddenTriggered
      ? `🎉 隐藏胜利！完成目标并触发隐藏条件！`
      : `✅ 胜利！成功达成目标：${level.targetText}`;
  } else if (session.state.steps.length >= level.maxSteps) {
    session.state.isFinished = true;
    session.state.isWin = false;
    session.state.message = '⏱️ 步数用尽，挑战失败。';
  } else {
    session.state.message = `第 ${session.state.steps.length} 步：执行「${event.name}」，消耗 ${event.cost}。`;
  }

  return { state: session.state, step };
}

export function rollbackToStep(sessionId: string, stepIndex: number): GameState | { error: string } {
  const session = sessions.get(sessionId);
  if (!session) return { error: '协作会话不存在，无法回滚' };
  if (stepIndex < 0 || stepIndex >= session.state.steps.length) return { error: '回滚目标步数无效，请选择有效历史步骤' };

  const level = LEVELS[session.state.levelId];
  session.state.steps = session.state.steps.slice(0, stepIndex);
  session.state.currentField =
    stepIndex === 0 ? { ...level.initialField } : { ...session.state.steps[stepIndex - 1].fieldAfter };
  session.state.isFinished = false;
  session.state.isWin = false;
  session.state.hiddenTriggered = level.hiddenCondition
    ? level.hiddenCondition(session.state.currentField, session.state.steps)
    : false;
  session.state.message = `已回滚到第 ${stepIndex} 步前状态。`;
  return session.state;
}

export function computeSettlement(sessionId: string): Settlement | { error: string } {
  const session = sessions.get(sessionId);
  if (!session) return { error: '协作会话不存在，无法结算' };

  const level = LEVELS[session.state.levelId];
  const { currentField, steps, hiddenTriggered } = session.state;

  let finalTraceValue = 0;
  let riskPenalty = 0;
  const stepReview: Settlement['stepReview'] = [];

  steps.forEach((s, idx) => {
    const event = level.availableEvents.find((e) => e.id === s.eventId);
    const prev = idx === 0 ? level.initialField : steps[idx - 1].fieldAfter;
    let contribution = 0;
    if (event && event.effect.traceValue) contribution += event.effect.traceValue * 2;
    if (event && event.effect.measureSlot) contribution += event.effect.measureSlot * 1.5;
    if (event && event.effect.balanceMark) contribution += event.effect.balanceMark * 1.5;
    if (event && event.effect.wuRisk && event.effect.wuRisk < 0) contribution += Math.abs(event.effect.wuRisk) * 1;
    if (event && event.effect.dingReward) contribution += event.effect.dingReward * 1;
    stepReview.push({ step: idx + 1, eventId: s.eventId, contribution: Math.round(contribution) });
  });

  finalTraceValue = currentField.traceValue;
  riskPenalty = Math.round(currentField.wuRisk * 1.5 + currentField.weiFailFactor * 2);

  const efficiencyBonus = session.state.isWin
    ? Math.max(0, Math.round((level.maxSteps - steps.length) * 30))
    : 0;
  const rewardScore = Math.round(currentField.dingReward * 3);
  const hiddenBonus = hiddenTriggered ? 500 : 0;

  const isWin = level.targetCondition(currentField);
  const totalScore = isWin
    ? Math.round(finalTraceValue * 4 + currentField.measureSlot * 2 + currentField.balanceMark * 2 + rewardScore - riskPenalty + efficiencyBonus + hiddenBonus)
    : Math.max(0, Math.round(finalTraceValue * 1.5 + currentField.measureSlot * 1 + currentField.balanceMark * 1 - riskPenalty));

  let detailText = '';
  if (hiddenTriggered && isWin) {
    detailText = `【隐藏结局·三相共鸣】云母矿灯三属性共振完成，不仅达成常规目标，更解锁了矿脉深处的秘密信号。团队协作指数★★★★★。`;
  } else if (isWin) {
    detailText = `【常规胜利】在限定步数内，团队协同将描线值、量测槽、配平痕均推至目标阈值。协作指数★★★★☆。`;
  } else if (level.failCondition(currentField)) {
    detailText = `【失败·风险溢出】${level.failText}，矿灯信号中断。请关注戊号风险与未号失败因子的实时监控。`;
  } else {
    detailText = `【失败·步数耗尽】团队尚未在限定步数内达到目标阈值。建议优化协作步骤的资源分配。`;
  }

  return {
    levelId: session.state.levelId,
    isWin,
    hiddenTriggered,
    finalTraceValue,
    totalSteps: steps.length,
    rewardScore,
    riskPenalty,
    efficiencyBonus,
    totalScore,
    stepReview,
    detailText,
  };
}

export function resumeFromReplay(sessionId: string, replay: GameStep[], levelId: LevelId): GameState {
  const level = LEVELS[levelId];
  const state: GameState = {
    levelId,
    currentField: { ...level.initialField },
    steps: [],
    isFinished: false,
    isWin: false,
    hiddenTriggered: false,
    message: '从回放轴恢复中...',
  };

  for (const r of replay) {
    const event = level.availableEvents.find((e) => e.id === r.eventId);
    if (!event) break;
    state.currentField = applyEvent(state.currentField, event);
    state.steps.push({
      stepIndex: state.steps.length,
      timestamp: r.timestamp,
      eventId: r.eventId,
      fieldAfter: { ...state.currentField },
      note: event.name,
    });
  }

  const hiddenTriggered = level.hiddenCondition ? level.hiddenCondition(state.currentField, state.steps) : false;
  state.hiddenTriggered = hiddenTriggered;
  const isFail = level.failCondition(state.currentField);
  const isWin = level.targetCondition(state.currentField);

  if (isFail) {
    state.isFinished = true;
    state.isWin = false;
    state.message = '从回放恢复：本局已失败。';
  } else if (isWin) {
    state.isFinished = true;
    state.isWin = true;
    state.message = '从回放恢复：本局已胜利！';
  } else if (state.steps.length >= level.maxSteps) {
    state.isFinished = true;
    state.isWin = false;
    state.message = '从回放恢复：步数已用尽。';
  } else {
    state.message = `已从回放轴恢复到第 ${state.steps.length} 步。`;
  }

  sessions.set(sessionId, { state });
  return state;
}
