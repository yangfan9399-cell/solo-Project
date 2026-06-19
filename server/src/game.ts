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
  SettlementBreakdownItem,
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
  const breakdown: SettlementBreakdownItem[] = [];
  const details: string[] = [];

  const litSlots = state.slots.filter((s) => s.lit).length;
  const totalSlots = state.slots.length;

  let baseScore = 0;
  let bonusScore = 0;
  let penaltyScore = 0;
  let finalMultiplier = 1;

  // === 基础分 ===
  const mergeScore = state.mergeValue * 2;
  baseScore += mergeScore;
  breakdown.push({
    category: '基础分',
    label: '银盐归并值',
    formula: `${state.mergeValue} × 2 = ${mergeScore}`,
    value: mergeScore,
    description: '归并值越高，基础分越高。每点归并值计 2 分。',
  });

  const slotScore = litSlots * 15;
  baseScore += slotScore;
  breakdown.push({
    category: '基础分',
    label: '点亮槽数量',
    formula: `${litSlots} × 15 = ${slotScore}`,
    value: slotScore,
    description: `已点亮 ${litSlots}/${totalSlots} 个槽。每个点亮槽计 15 分。`,
  });

  const rewardScore = state.rewardDing * 3;
  baseScore += rewardScore;
  breakdown.push({
    category: '基础分',
    label: '丁号奖励剩余',
    formula: `${state.rewardDing} × 3 = ${rewardScore}`,
    value: rewardScore,
    description: '结算时剩余的丁号奖励转化为分数。每点奖励计 3 分。',
  });

  // === 扣分项 ===
  const riskPenalty = state.riskYin * 2;
  if (riskPenalty > 0) {
    penaltyScore += riskPenalty;
    breakdown.push({
      category: '扣分项',
      label: '寅号风险惩罚',
      formula: `${state.riskYin} × 2 = -${riskPenalty}`,
      value: -riskPenalty,
      description: `寅号风险 ${state.riskYin}/${config.riskYinThreshold}。每点风险扣 2 分。`,
    });
  }

  const failPenalty = state.failGui * 3;
  if (failPenalty > 0) {
    penaltyScore += failPenalty;
    breakdown.push({
      category: '扣分项',
      label: '癸号失败因子惩罚',
      formula: `${state.failGui} × 3 = -${failPenalty}`,
      value: -failPenalty,
      description: `癸号失败因子 ${state.failGui}/${config.failGuiThreshold}。每点因子扣 3 分。`,
    });
  }

  // === 加分项 ===
  if (state.isWin) {
    const stepsRemaining = config.maxSteps - state.stepIndex;
    const stepsBonus = Math.max(0, stepsRemaining) * 10;
    bonusScore += stepsBonus;
    breakdown.push({
      category: '加分项',
      label: '剩余步数奖励',
      formula: `${stepsRemaining} × 10 = +${stepsBonus}`,
      value: stepsBonus,
      description: `在 ${config.maxSteps} 步限制内提前完成。剩余 ${stepsRemaining} 步，每步加 10 分。`,
    });
  }

  // === 胜负判定 ===
  let winCurrent = 0;
  let winMet = false;
  let winLabel = '';

  switch (config.winCondition.type) {
    case 'merge-value':
      winCurrent = state.mergeValue;
      winMet = state.mergeValue >= config.winCondition.target;
      winLabel = `归并值 ≥ ${config.winCondition.target}`;
      break;
    case 'all-lit':
      winCurrent = litSlots;
      winMet = litSlots >= config.winCondition.target;
      winLabel = `点亮 ${config.winCondition.target} 个槽`;
      break;
    case 'patrol-cycle':
      winCurrent = state.patrol.position;
      winMet = state.patrol.position >= config.winCondition.target;
      winLabel = `巡测位置 ≥ ${config.winCondition.target}`;
      break;
    default:
      winCurrent = state.mergeValue;
      winMet = state.isWin;
      winLabel = '达成胜利条件';
  }

  breakdown.push({
    category: '胜负判定',
    label: winLabel,
    formula: `当前: ${winCurrent} / 目标: ${config.winCondition.target}`,
    value: winMet ? 1 : 0,
    description: winMet ? '✅ 胜利条件达成！' : '❌ 未达成胜利条件。',
  });

  if (state.failReason) {
    breakdown.push({
      category: '胜负判定',
      label: '失败原因',
      formula: state.failReason,
      value: 0,
      description: state.failReason,
    });
  }

  // === 局特色 / 隐藏条件 ===
  if (config.hiddenCondition) {
    const hiddenMet = state.hiddenTriggered;
    let hiddenDesc = '';
    let hiddenFormula = '';

    if (config.hiddenCondition.type === 'no-risk') {
      hiddenDesc = '零风险完美修复：寅号风险全程保持 0 并达成胜利条件';
      hiddenFormula = hiddenMet ? '✅ 隐藏条件达成！分数 ×2' : `❌ 寅号风险 ${state.riskYin} ≠ 0，未触发`;
    } else {
      hiddenDesc = `隐藏条件类型: ${config.hiddenCondition.type}`;
      hiddenFormula = hiddenMet ? '✅ 已触发' : '❌ 未触发';
    }

    if (hiddenMet) {
      finalMultiplier *= 2;
      breakdown.push({
        category: '奖励倍率',
        label: '癸局隐藏奖励：零风险完美修复',
        formula: '总分 × 2',
        value: 2,
        description: hiddenDesc,
      });
    } else {
      breakdown.push({
        category: '奖励倍率',
        label: '癸局隐藏条件（未触发）',
        formula: hiddenFormula,
        value: 1,
        description: hiddenDesc + '。提示：尝试全程保持寅号风险为 0。',
      });
    }
  }

  // === 总分计算 ===
  let subScore = baseScore + bonusScore - penaltyScore;
  const finalScore = Math.round(subScore * finalMultiplier);

  // === 评级 ===
  let rank = '丁';
  let rankDesc = '';
  if (state.isWin) {
    if (state.hiddenTriggered) {
      rank = '癸·极';
      rankDesc = '最高评级：隐藏条件达成的完美修复';
    } else if (finalScore >= 500) {
      rank = '甲';
      rankDesc = '优秀：500 分以上';
    } else if (finalScore >= 350) {
      rank = '乙';
      rankDesc = '良好：350 分以上';
    } else if (finalScore >= 200) {
      rank = '丙';
      rankDesc = '合格：200 分以上';
    } else {
      rank = '丁';
      rankDesc = '及格：200 分以下';
    }
  } else {
    if (finalScore >= 200) {
      rank = '戊';
      rankDesc = '失败但表现尚可：200 分以上';
    } else if (finalScore >= 100) {
      rank = '己';
      rankDesc = '失败：100-200 分';
    } else {
      rank = '庚';
      rankDesc = '失败：100 分以下';
    }
  }

  details.unshift(`归并值贡献: +${mergeScore}`);
  details.unshift(`点亮槽贡献: +${slotScore} (${litSlots}/${totalSlots})`);
  if (state.isWin) {
    details.push(`步数奖励: +${bonusScore} (剩余${config.maxSteps - state.stepIndex}步)`);
  }
  if (state.hiddenTriggered) {
    details.push('隐藏条件达成！分数翻倍！');
  }

  return {
    stageId: state.stageId,
    stageName: config.name,
    isWin: state.isWin,
    failReason: state.failReason,
    finalMergeValue: state.mergeValue,
    stepsUsed: state.stepIndex,
    maxSteps: config.maxSteps,
    score: finalScore,
    rank,
    details,
    hiddenBonus: state.hiddenTriggered,
    breakdown,
    summary: {
      baseScore,
      bonusScore,
      penaltyScore,
      finalMultiplier,
      finalScore,
    },
    winCondition: {
      type: config.winCondition.type,
      target: config.winCondition.target,
      current: winCurrent,
      met: winMet,
    },
    thresholds: {
      riskYin: { current: state.riskYin, max: config.riskYinThreshold },
      failGui: { current: state.failGui, max: config.failGuiThreshold },
      rewardDing: { current: state.rewardDing },
    },
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
