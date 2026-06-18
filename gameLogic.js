const db = require('./database');
const scenarios = require('./scenarios');

function getStateFromGame(game) {
  const resources = JSON.parse(game.resources || '{}');
  const visitedNodes = resources.visitedNodes || [];
  return {
    stardustStrip: game.stardust_strip,
    rehearsalSlots: game.rehearsal_slots,
    calibrationMarks: game.calibration_marks,
    chouRisk: game.chou_risk,
    shenReward: game.shen_reward,
    jiaFailureFactor: game.jia_failure_factor,
    resources,
    currentTurn: game.current_turn,
    maxTurns: game.max_turns,
    status: game.status,
    scenarioType: game.scenario_type,
    gameId: game.id,
    secretSeals: resources.secretSeals || 0,
    hiddenUnlocked: resources.hiddenUnlocked || false,
    visitedNodes
  };
}

function createGame(scenarioType) {
  const scenario = scenarios[scenarioType];
  if (!scenario) {
    throw new Error('未知的场景类型');
  }

  const init = scenario.initialState;
  const game = db.createGame({
    scenario_type: scenarioType,
    current_turn: 0,
    max_turns: scenario.maxTurns,
    status: 'active',
    stardust_strip: init.stardustStrip,
    rehearsal_slots: init.rehearsalSlots,
    calibration_marks: init.calibrationMarks,
    chou_risk: init.chouRisk,
    shen_reward: init.shenReward,
    jia_failure_factor: init.jiaFailureFactor,
    resources: JSON.stringify(init.resources || {})
  });

  const state = getStateFromGame(game);
  recordStep(game.id, 0, 0, 'init', { description: '游戏开始' }, state);

  return getGameState(game.id);
}

function getGameState(gameId) {
  const game = db.getGame(gameId);
  if (!game) return null;

  const state = getStateFromGame(game);
  const scenario = scenarios[game.scenario_type];
  const currentEvent = getEventForTurn(game.scenario_type, game.current_turn);
  const gameSteps = db.getSteps(gameId);

  return {
    ...state,
    scenario: {
      name: scenario.name,
      description: scenario.description,
      maxTurns: scenario.maxTurns,
      winCondition: scenario.winCondition,
      failCondition: scenario.failCondition,
      map: scenario.map
    },
    currentEvent,
    steps: gameSteps.map(s => ({
      id: s.id,
      stepNumber: s.step_number,
      turnNumber: s.turn_number,
      actionType: s.action_type,
      actionData: JSON.parse(s.action_data || '{}'),
      stateSnapshot: JSON.parse(s.state_snapshot),
      eventId: s.event_id,
      createdAt: s.created_at
    }))
  };
}

function getEventForTurn(scenarioType, turn) {
  const scenario = scenarios[scenarioType];
  if (!scenario || !scenario.events) return null;

  const event = scenario.events.find(e => e.turn === turn);
  if (!event) return null;

  return {
    turn: event.turn,
    title: event.title,
    description: event.description,
    isHidden: event.isHidden || false,
    choices: event.choices.map(c => ({
      id: c.id,
      text: c.text,
      requires: c.requires || null
    }))
  };
}

function recordStep(gameId, stepNumber, turnNumber, actionType, actionData, stateSnapshot, eventId = null) {
  db.createStep({
    game_id: gameId,
    step_number: stepNumber,
    turn_number: turnNumber,
    action_type: actionType,
    action_data: JSON.stringify(actionData),
    state_snapshot: JSON.stringify(stateSnapshot),
    event_id: eventId
  });
}

function getNextStepNumber(gameId) {
  const gameSteps = db.getSteps(gameId);
  if (gameSteps.length === 0) return 1;
  return Math.max(...gameSteps.map(s => s.step_number)) + 1;
}

function applyEffect(state, effect) {
  const newState = { ...state };
  const newResources = { ...state.resources };

  if (effect.stardustStrip !== undefined) {
    newState.stardustStrip += effect.stardustStrip;
  }
  if (effect.rehearsalSlots !== undefined) {
    newState.rehearsalSlots += effect.rehearsalSlots;
  }
  if (effect.calibrationMarks !== undefined) {
    newState.calibrationMarks += effect.calibrationMarks;
  }
  if (effect.chouRisk !== undefined) {
    newState.chouRisk += effect.chouRisk;
    newState.chouRisk = Math.max(0, Math.min(1, newState.chouRisk));
  }
  if (effect.shenReward !== undefined) {
    newState.shenReward += effect.shenReward;
  }
  if (effect.jiaFailureFactor !== undefined) {
    newState.jiaFailureFactor += effect.jiaFailureFactor;
    newState.jiaFailureFactor = Math.max(0, Math.min(1, newState.jiaFailureFactor));
  }
  if (effect.resources) {
    for (const [key, value] of Object.entries(effect.resources)) {
      newResources[key] = (newResources[key] || 0) + value;
    }
  }
  if (effect.secretSeals !== undefined) {
    newResources.secretSeals = (newResources.secretSeals || 0) + effect.secretSeals;
  }
  if (effect.hiddenUnlocked !== undefined) {
    newResources.hiddenUnlocked = effect.hiddenUnlocked;
  }

  newState.resources = newResources;
  newState.secretSeals = newResources.secretSeals || 0;
  newState.hiddenUnlocked = newResources.hiddenUnlocked || false;

  return newState;
}

function updateGameState(gameId, state) {
  db.updateGame(gameId, {
    current_turn: state.currentTurn,
    status: state.status,
    stardust_strip: state.stardustStrip,
    rehearsal_slots: state.rehearsalSlots,
    calibration_marks: state.calibrationMarks,
    chou_risk: state.chouRisk,
    shen_reward: state.shenReward,
    jia_failure_factor: state.jiaFailureFactor,
    resources: JSON.stringify(state.resources)
  });
}

function checkConditions(state, scenarioType) {
  const scenario = scenarios[scenarioType];
  let failed = false;
  let failReason = '';
  let won = false;
  let winReason = '';

  const failCond = scenario.failCondition;
  switch (failCond.type) {
    case 'risk_threshold':
      if (state.chouRisk >= failCond.threshold) {
        failed = true;
        failReason = `丑号风险超过 ${(failCond.threshold * 100).toFixed(0)}%`;
      }
      break;
    case 'resource_depletion':
      for (const [key, value] of Object.entries(state.resources)) {
        if (key !== 'secretSeals' && key !== 'hiddenUnlocked' && value < 0) {
          failed = true;
          failReason = `资源 ${key} 耗尽`;
          break;
        }
      }
      break;
    case 'jia_factor':
      if (state.jiaFailureFactor >= failCond.threshold) {
        failed = true;
        failReason = `甲号失败因子达到 ${(failCond.threshold * 100).toFixed(0)}%`;
      }
      break;
  }

  const winCond = scenario.winCondition;
  if (!failed && state.currentTurn >= scenario.maxTurns) {
    switch (winCond.type) {
      case 'stardust_target':
        if (state.stardustStrip >= winCond.target) {
          won = true;
          winReason = `星尘剥离值达到目标 ${winCond.target}`;
        } else {
          failed = true;
          failReason = `星尘剥离值不足 (${state.stardustStrip.toFixed(0)} / ${winCond.target})`;
        }
        break;
      case 'multi_condition':
        const conds = winCond.conditions;
        let allMet = true;
        if (conds.stardustStrip && state.stardustStrip < conds.stardustStrip) {
          allMet = false;
        }
        if (conds.minCalibrationMarks && state.calibrationMarks < conds.minCalibrationMarks) {
          allMet = false;
        }
        if (allMet) {
          won = true;
          winReason = '所有胜利条件均已达成';
        } else {
          failed = true;
          failReason = '胜利条件未达成';
        }
        break;
      case 'secret':
        if (state.resources.hiddenUnlocked && state.resources.secretSeals >= winCond.secretRequirement.secretSeals) {
          won = true;
          winReason = '🌟 隐藏胜利：成功解开终极封印！';
        } else if (state.stardustStrip >= winCond.normalTarget) {
          won = true;
          winReason = `星尘剥离值达到目标 ${winCond.normalTarget}`;
        } else {
          failed = true;
          failReason = `星尘剥离值不足 (${state.stardustStrip.toFixed(0)} / ${winCond.normalTarget})`;
        }
        break;
    }
  }

  return { won, winReason, failed, failReason };
}

function performAction(gameId, actionType, actionData) {
  const gameState = getGameState(gameId);
  if (!gameState) {
    throw new Error('游戏不存在');
  }
  if (gameState.status !== 'active') {
    throw new Error('游戏已结束');
  }

  let newState = { ...gameState };

  switch (actionType) {
    case 'allocate_resource':
      newState = handleResourceAllocation(newState, actionData);
      break;
    case 'use_rehearsal':
      newState = handleRehearsal(newState, actionData);
      break;
    case 'calibrate':
      newState = handleCalibration(newState, actionData);
      break;
    case 'event_choice':
      newState = handleEventChoice(newState, actionData, gameState.scenarioType);
      break;
    case 'next_turn':
      newState = advanceTurn(newState);
      break;
    case 'visit_node':
      newState = handleVisitNode(newState, actionData, gameState.scenarioType);
      break;
    default:
      throw new Error('未知的操作类型');
  }

  const { won, winReason, failed, failReason } = checkConditions(newState, gameState.scenarioType);

  if (won) {
    newState.status = 'won';
  } else if (failed) {
    newState.status = 'failed';
  }

  const stepNumber = getNextStepNumber(gameId);
  recordStep(gameId, stepNumber, newState.currentTurn, actionType, actionData, newState);

  updateGameState(gameId, newState);

  if (newState.status !== 'active') {
    calculateSettlement(gameId);
  }

  return getGameState(gameId);
}

function handleResourceAllocation(state, data) {
  const { resource, amount, target } = data;
  const newState = { ...state };
  newState.resources = { ...newState.resources };

  if (!newState.resources[resource] || newState.resources[resource] < amount) {
    throw new Error('资源不足');
  }

  newState.resources[resource] -= amount;

  switch (target) {
    case 'stardust':
      newState.stardustStrip += amount * 2;
      break;
    case 'risk_reduction':
      newState.chouRisk = Math.max(0, newState.chouRisk - amount * 0.02);
      break;
    case 'reward_boost':
      newState.shenReward += amount * 0.05;
      break;
  }

  return newState;
}

function handleRehearsal(state, data) {
  const { action } = data;
  const newState = { ...state };

  if (newState.rehearsalSlots <= 0) {
    throw new Error('排演槽不足');
  }

  newState.rehearsalSlots -= 1;

  switch (action) {
    case 'boost_stardust':
      newState.stardustStrip += 25;
      break;
    case 'reduce_risk':
      newState.chouRisk = Math.max(0, newState.chouRisk - 0.1);
      break;
    case 'gain_calibration':
      newState.calibrationMarks += 1;
      break;
  }

  return newState;
}

function handleCalibration(state, data) {
  const newState = { ...state };

  if (newState.calibrationMarks <= 0) {
    throw new Error('定标痕不足');
  }

  newState.calibrationMarks -= 1;
  newState.stardustStrip *= 1.1;

  return newState;
}

function handleEventChoice(state, data, scenarioType) {
  const { eventTurn, choiceId } = data;
  const scenario = scenarios[scenarioType];
  const event = scenario.events.find(e => e.turn === eventTurn);

  if (!event) {
    throw new Error('事件不存在');
  }

  const choice = event.choices.find(c => c.id === choiceId);
  if (!choice) {
    throw new Error('选项不存在');
  }

  if (choice.requires) {
    for (const [key, value] of Object.entries(choice.requires)) {
      const currentVal = key === 'secretSeals'
        ? (state.resources.secretSeals || 0)
        : (state[key] || 0);
      if (currentVal < value) {
        throw new Error(`不满足条件: 需要 ${value} ${key}`);
      }
    }
  }

  return applyEffect(state, choice.effect);
}

function advanceTurn(state) {
  const newState = { ...state };
  newState.currentTurn += 1;

  newState.rehearsalSlots += 1;
  newState.stardustStrip += newState.shenReward * 5;

  return newState;
}

function handleVisitNode(state, data, scenarioType) {
  const { nodeId } = data;
  const newState = { ...state };
  newState.resources = { ...newState.resources };

  const visitedNodes = newState.resources.visitedNodes || [];
  if (visitedNodes.includes(nodeId)) {
    throw new Error('该节点已访问过');
  }

  const scenario = scenarios[scenarioType];
  const node = scenario.map.nodes.find(n => n.id === nodeId);
  if (!node) {
    throw new Error('节点不存在');
  }

  if (visitedNodes.length > 0) {
    const isConnected = scenario.map.connections.some(
      ([a, b]) => (a === visitedNodes[visitedNodes.length - 1] && b === nodeId) ||
                   (b === visitedNodes[visitedNodes.length - 1] && a === nodeId)
    );
    if (!isConnected) {
      throw new Error('只能移动到相邻节点');
    }
  } else {
    if (node.type !== 'start') {
      throw new Error('必须从起点开始');
    }
  }

  const bonus = node.bonus || {};
  const effect = { ...bonus };

  if (bonus.energy || bonus.data || bonus.time) {
    effect.resources = {};
    if (bonus.energy) effect.resources.energy = bonus.energy;
    if (bonus.data) effect.resources.data = bonus.data;
    if (bonus.time) effect.resources.time = bonus.time;
    delete effect.energy;
    delete effect.data;
    delete effect.time;
  }

  const resultState = applyEffect(newState, effect);
  resultState.resources.visitedNodes = [...visitedNodes, nodeId];
  resultState.visitedNodes = resultState.resources.visitedNodes;

  return resultState;
}

function calculateSettlement(gameId) {
  const gameState = getGameState(gameId);
  if (!gameState) return null;

  const gameSteps = db.getSteps(gameId);
  const steps = gameSteps.length;

  const baseScore = gameState.stardustStrip;
  const efficiencyBonus = gameState.stardustStrip / Math.max(1, steps) * 10;
  const riskPenalty = gameState.chouRisk * 50;
  const calibrationBonus = gameState.calibrationMarks * 20;
  const jiaPenalty = gameState.jiaFailureFactor * 30;
  const secretBonus = (gameState.resources.secretSeals || 0) * 50;
  const hiddenBonus = gameState.resources.hiddenUnlocked ? 100 : 0;

  let finalScore = baseScore + efficiencyBonus - riskPenalty + calibrationBonus - jiaPenalty + secretBonus + hiddenBonus;
  if (gameState.status === 'won') {
    finalScore *= 1.5;
  }

  let riskLevel = '低';
  if (gameState.chouRisk >= 0.6) riskLevel = '高';
  else if (gameState.chouRisk >= 0.3) riskLevel = '中';

  const resourceEfficiency = gameState.stardustStrip / Math.max(1, steps);

  const breakdown = {
    baseScore,
    efficiencyBonus,
    riskPenalty,
    calibrationBonus,
    jiaPenalty,
    secretBonus,
    hiddenBonus,
    winMultiplier: gameState.status === 'won' ? 1.5 : 1
  };

  db.deleteSettlements(gameId);

  const settlement = db.createSettlement({
    game_id: gameId,
    final_stardust_strip: gameState.stardustStrip,
    total_steps: steps,
    resource_efficiency: resourceEfficiency,
    risk_level: riskLevel,
    result: gameState.status === 'won' ? '胜利' : '失败',
    score: Math.max(0, finalScore),
    breakdown: JSON.stringify(breakdown)
  });

  return formatSettlement(settlement);
}

function formatSettlement(settlement) {
  return {
    id: settlement.id,
    gameId: settlement.game_id,
    finalStardustStrip: settlement.final_stardust_strip,
    totalSteps: settlement.total_steps,
    resourceEfficiency: settlement.resource_efficiency,
    riskLevel: settlement.risk_level,
    result: settlement.result,
    score: settlement.score,
    breakdown: JSON.parse(settlement.breakdown),
    calculatedAt: settlement.calculated_at
  };
}

function getSettlement(gameId) {
  const settlement = db.getLatestSettlement(gameId);
  if (!settlement) return null;
  return formatSettlement(settlement);
}

function recalculateSettlement(gameId) {
  return calculateSettlement(gameId);
}

function getActiveGames() {
  const activeGames = db.getActiveGames();
  return activeGames.map(g => getGameState(g.id));
}

function revertToStep(gameId, stepNumber) {
  const gameSteps = db.getSteps(gameId);
  const step = gameSteps.find(s => s.step_number === stepNumber);
  if (!step) {
    throw new Error('步骤不存在');
  }

  const stateSnapshot = JSON.parse(step.state_snapshot);

  const newState = {
    currentTurn: stateSnapshot.currentTurn || stateSnapshot.turnNumber || 0,
    status: 'active',
    stardustStrip: stateSnapshot.stardustStrip,
    rehearsalSlots: stateSnapshot.rehearsalSlots,
    calibrationMarks: stateSnapshot.calibrationMarks,
    chouRisk: stateSnapshot.chouRisk,
    shenReward: stateSnapshot.shenReward,
    jiaFailureFactor: stateSnapshot.jiaFailureFactor,
    resources: stateSnapshot.resources || {}
  };

  updateGameState(gameId, newState);
  db.deleteStepsAfter(gameId, stepNumber);
  db.deleteSettlements(gameId);

  return getGameState(gameId);
}

module.exports = {
  createGame,
  getGameState,
  performAction,
  getSettlement,
  recalculateSettlement,
  getActiveGames,
  revertToStep,
  scenarios
};
