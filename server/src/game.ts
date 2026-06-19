import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  GameSession,
  GameStep,
  GameEvent,
  GameSettlement,
  GameSlot,
  StageConfig,
  GameStageId,
  StepDelta,
} from './types';
import { getStageConfig } from './stages';

function createInitialState(config: StageConfig): GameState {
  const slots: GameSlot[] = [];
  for (let i = 0; i < config.slotCount; i++) {
    slots.push({
      id: i,
      lit: i < config.initialLitSlots,
      value: i < config.initialLitSlots ? 1 : 0,
    });
  }

  return {
    stageId: config.id,
    stepIndex: 0,
    mergeValue: config.initialMergeValue,
    slots,
    patrol: {
      position: config.patrolStart,
      direction: 1,
    },
    riskYin: 0,
    rewardDing: 0,
    failGui: 0,
    availableEvents: [],
    isGameOver: false,
    isWin: false,
    hiddenTriggered: false,
  };
}

function drawEvents(config: StageConfig, count: number): GameEvent[] {
  const pool = [...config.eventPool];
  const drawn: GameEvent[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(index, 1)[0]);
  }
  return drawn;
}

function advancePatrol(state: GameState, config: StageConfig): void {
  const { patrol } = state;
  const newPos = patrol.position + patrol.direction * config.patrolSpeed;

  if (newPos >= config.slotCount) {
    patrol.position = config.slotCount - 1;
    patrol.direction = -1;
  } else if (newPos < 0) {
    patrol.position = 0;
    patrol.direction = 1;
  } else {
    patrol.position = newPos;
  }

  const slot = state.slots[patrol.position];
  if (slot && !slot.lit) {
    slot.lit = true;
    slot.value = 1;
    state.mergeValue += 2;
  }
}

function applyEventEffect(state: GameState, event: GameEvent, config: StageConfig): void {
  const { effect } = event;

  if (effect.mergeValue !== undefined) {
    state.mergeValue += effect.mergeValue;
  }

  if (effect.slots) {
    const { lit, value: slotValue, target } = effect.slots;
    if (target === 'first-dark') {
      const darkSlot = state.slots.find((s) => !s.lit);
      if (darkSlot && lit !== undefined) {
        darkSlot.lit = true;
        if (slotValue !== undefined) darkSlot.value = slotValue;
      }
    } else if (target === 'random') {
      const darkSlots = state.slots.filter((s) => !s.lit);
      if (darkSlots.length > 0 && lit !== undefined) {
        const randomSlot = darkSlots[Math.floor(Math.random() * darkSlots.length)];
        randomSlot.lit = true;
        if (slotValue !== undefined) randomSlot.value = slotValue;
      }
    } else if (target === 'all' && lit !== undefined) {
      state.slots.forEach((s) => {
        s.lit = lit!;
        if (slotValue !== undefined) s.value = slotValue;
      });
    }
  }

  if (effect.patrol !== undefined) {
    for (let i = 0; i < Math.abs(effect.patrol); i++) {
      advancePatrol(state, config);
    }
  }

  if (effect.riskYin !== undefined) {
    state.riskYin += effect.riskYin;
  }

  if (effect.rewardDing !== undefined) {
    state.rewardDing += effect.rewardDing;
  }

  if (effect.failGui !== undefined) {
    state.failGui += effect.failGui;
    if (state.failGui < 0) state.failGui = 0;
  }

  if (state.riskYin < 0) state.riskYin = 0;
  if (state.rewardDing < 0) state.rewardDing = 0;
  if (state.mergeValue < 0) state.mergeValue = 0;
}

function checkGameState(state: GameState, config: StageConfig): void {
  if (state.failGui >= config.failGuiThreshold) {
    state.isGameOver = true;
    state.isWin = false;
    state.failReason = '癸号失败因子达到临界值，暗房崩塌！';
    return;
  }

  if (state.riskYin >= config.riskYinThreshold) {
    state.isGameOver = true;
    state.isWin = false;
    state.failReason = '寅号风险失控，时序错乱！';
    return;
  }

  if (config.hiddenCondition && config.hiddenCondition.type === 'no-risk') {
    if (state.riskYin <= config.hiddenCondition.value && state.mergeValue >= config.winCondition.target) {
      state.hiddenTriggered = true;
      state.isGameOver = true;
      state.isWin = true;
      return;
    }
  }

  let winMet = false;
  switch (config.winCondition.type) {
    case 'merge-value':
      winMet = state.mergeValue >= config.winCondition.target;
      break;
    case 'all-lit':
      winMet = state.slots.every((s) => s.lit);
      break;
    case 'patrol-cycle':
      winMet = state.patrol.position >= config.winCondition.target;
      break;
  }

  if (winMet) {
    state.isGameOver = true;
    state.isWin = true;
  }

  if (state.stepIndex >= config.maxSteps && !state.isWin) {
    state.isGameOver = true;
    state.isWin = false;
    state.failReason = `超过${config.maxSteps}步限制，修复失败！`;
  }
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

function calcDelta(
  prev: GameState,
  curr: GameState,
  eventName: string | null,
  isSkip: boolean
): StepDelta {
  const prevLit = prev.slots.filter((s) => s.lit).length;
  const currLit = curr.slots.filter((s) => s.lit).length;
  return {
    eventName,
    isSkip,
    mergeValue: curr.mergeValue - prev.mergeValue,
    riskYin: curr.riskYin - prev.riskYin,
    rewardDing: curr.rewardDing - prev.rewardDing,
    failGui: curr.failGui - prev.failGui,
    slotsLit: currLit - prevLit,
    patrolMove: Math.abs(curr.patrol.position - prev.patrol.position),
  };
}

function emptyDelta(): StepDelta {
  return {
    eventName: null,
    isSkip: false,
    mergeValue: 0,
    riskYin: 0,
    rewardDing: 0,
    failGui: 0,
    slotsLit: 0,
    patrolMove: 0,
  };
}

const sessions = new Map<string, GameSession>();

export function createSession(stageId: GameStageId): GameSession {
  const config = getStageConfig(stageId);
  if (!config) {
    throw new Error(`Unknown stage: ${stageId}`);
  }

  const initialState = createInitialState(config);
  initialState.availableEvents = drawEvents(config, config.eventsPerStep);

  const session: GameSession = {
    sessionId: uuidv4(),
    currentState: initialState,
    history: [
      {
        stepIndex: 0,
        eventId: null,
        state: cloneState(initialState),
        timestamp: Date.now(),
        delta: { ...emptyDelta(), eventName: '暗房初始化' },
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string): GameSession | undefined {
  return sessions.get(sessionId);
}

export function executeEvent(sessionId: string, eventId: string): GameSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const config = getStageConfig(session.currentState.stageId);
  if (!config) return null;

  if (session.currentState.isGameOver) return session;

  const event = session.currentState.availableEvents.find((e) => e.id === eventId);
  if (!event) return null;

  if (session.currentState.rewardDing < event.cost) {
    return session;
  }

  const prevState = session.currentState;
  const newState = cloneState(prevState);
  newState.stepIndex += 1;
  newState.rewardDing -= event.cost;

  applyEventEffect(newState, event, config);
  advancePatrol(newState, config);

  checkGameState(newState, config);

  if (!newState.isGameOver) {
    newState.availableEvents = drawEvents(config, config.eventsPerStep);
  } else {
    newState.availableEvents = [];
  }

  const delta = calcDelta(prevState, newState, event.name, false);

  session.currentState = newState;
  session.history.push({
    stepIndex: newState.stepIndex,
    eventId,
    state: cloneState(newState),
    timestamp: Date.now(),
    delta,
  });
  session.updatedAt = Date.now();

  return session;
}

export function skipStep(sessionId: string): GameSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const config = getStageConfig(session.currentState.stageId);
  if (!config) return null;

  if (session.currentState.isGameOver) return session;

  const prevState = session.currentState;
  const newState = cloneState(prevState);
  newState.stepIndex += 1;

  advancePatrol(newState, config);
  newState.rewardDing += 3;

  checkGameState(newState, config);

  if (!newState.isGameOver) {
    newState.availableEvents = drawEvents(config, config.eventsPerStep);
  } else {
    newState.availableEvents = [];
  }

  const delta = calcDelta(prevState, newState, '跳过本步', true);

  session.currentState = newState;
  session.history.push({
    stepIndex: newState.stepIndex,
    eventId: null,
    state: cloneState(newState),
    timestamp: Date.now(),
    delta,
  });
  session.updatedAt = Date.now();

  return session;
}

export function calculateSettlement(sessionId: string): GameSettlement | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const config = getStageConfig(session.currentState.stageId);
  if (!config) return null;

  const state = session.currentState;
  const details: string[] = [];

  let score = 0;
  const litSlots = state.slots.filter((s) => s.lit).length;

  score += state.mergeValue * 2;
  score += litSlots * 15;
  score += state.rewardDing * 3;
  score -= state.riskYin * 2;
  score -= state.failGui * 3;

  if (state.isWin) {
    const stepsBonus = Math.max(0, config.maxSteps - state.stepIndex) * 10;
    score += stepsBonus;
    details.push(`步数奖励: +${stepsBonus} (剩余${config.maxSteps - state.stepIndex}步)`);
  }

  if (state.hiddenTriggered) {
    score *= 2;
    details.push('隐藏条件达成！分数翻倍！');
  }

  let rank = '丁';
  if (state.isWin) {
    if (state.hiddenTriggered) rank = '癸·极';
    else if (score >= 500) rank = '甲';
    else if (score >= 350) rank = '乙';
    else if (score >= 200) rank = '丙';
    else rank = '丁';
  } else {
    if (score >= 200) rank = '戊';
    else if (score >= 100) rank = '己';
    else rank = '庚';
  }

  details.unshift(`归并值贡献: +${state.mergeValue * 2}`);
  details.unshift(`点亮槽贡献: +${litSlots * 15} (${litSlots}/${state.slots.length})`);

  return {
    stageId: state.stageId,
    isWin: state.isWin,
    finalMergeValue: state.mergeValue,
    stepsUsed: state.stepIndex,
    score,
    rank,
    details,
    failReason: state.failReason,
    hiddenBonus: state.hiddenTriggered,
  };
}

export function restoreFromHistory(sessionId: string, stepIndex: number): GameSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const step = session.history.find((s) => s.stepIndex === stepIndex);
  if (!step) return null;

  const config = getStageConfig(session.currentState.stageId);
  if (!config) return null;

  session.history = session.history.filter((s) => s.stepIndex <= stepIndex);
  session.currentState = cloneState(step.state);
  session.updatedAt = Date.now();

  if (!session.currentState.isGameOver && session.currentState.availableEvents.length === 0) {
    session.currentState.availableEvents = drawEvents(config, config.eventsPerStep);
  }

  return session;
}
