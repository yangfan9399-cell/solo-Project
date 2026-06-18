const express = require('express');
const cors = require('cors');
const path = require('path');
const games = require('./data/games');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const gameSessions = {};
const replayRecords = {};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function initGameState(gameId) {
  const game = games[gameId];
  if (!game) return null;
  const state = deepClone(game.initialState);
  state.gameId = gameId;
  state.status = 'playing';
  state.currentNode = game.map.nodes[0].id;
  state.visitedNodes = [game.map.nodes[0].id];
  state.eventLog = [];
  state.actionHistory = [];
  return state;
}

function applyEffect(state, effect) {
  const newState = deepClone(state);
  
  if (effect.strippingValue !== undefined) {
    newState.strippingValue = Math.max(0, Math.min(
      newState.maxStrippingValue,
      newState.strippingValue + effect.strippingValue
    ));
  }
  if (effect.chouRisk !== undefined) {
    newState.chouRisk = Math.max(0, Math.min(1, newState.chouRisk + effect.chouRisk));
  }
  if (effect.shenReward !== undefined) {
    newState.shenReward = Math.max(0, Math.min(1, newState.shenReward + effect.shenReward));
  }
  if (effect.jiaFailureFactor !== undefined) {
    newState.jiaFailureFactor = Math.max(0, Math.min(1, newState.jiaFailureFactor + effect.jiaFailureFactor));
  }
  if (effect.calibrationMarks !== undefined) {
    newState.calibrationMarks = Math.max(0, newState.calibrationMarks + effect.calibrationMarks);
  }
  if (effect.paper !== undefined && newState.resources) {
    newState.resources.paper = Math.max(0, newState.resources.paper + effect.paper);
  }
  if (effect.ink !== undefined && newState.resources) {
    newState.resources.ink = Math.max(0, newState.resources.ink + effect.ink);
  }
  if (effect.light !== undefined && newState.resources) {
    newState.resources.light = Math.max(0, newState.resources.light + effect.light);
  }
  if (effect.resources) {
    if (effect.resources.paper) newState.resources.paper = Math.max(0, newState.resources.paper + effect.resources.paper);
    if (effect.resources.ink) newState.resources.ink = Math.max(0, newState.resources.ink + effect.resources.ink);
    if (effect.resources.light) newState.resources.light = Math.max(0, newState.resources.light + effect.resources.light);
  }
  if (effect.jiaHiddenTrigger) {
    newState.jiaHiddenTriggered = true;
  }
  
  return newState;
}

function checkGameStatus(state, game) {
  const newState = deepClone(state);
  
  if (game.winCondition.type === 'calibration') {
    if (newState.calibrationMarks >= game.winCondition.target) {
      newState.status = 'won';
    }
  } else if (game.winCondition.type === 'calibration_and_end') {
    const reachedEnd = newState.currentNode === game.winCondition.endNode;
    if (newState.calibrationMarks >= game.winCondition.target && reachedEnd) {
      newState.status = 'won';
    }
  } else if (game.winCondition.type === 'calibration_and_hidden') {
    if (newState.calibrationMarks >= game.winCondition.target && newState.jiaFailureFactor < 0.6) {
      newState.status = 'won';
    }
  }
  
  if (newState.status === 'won') return newState;
  
  if (game.loseCondition.type === 'stripping') {
    if (newState.strippingValue <= game.loseCondition.threshold) {
      newState.status = 'lost';
    }
  } else if (game.loseCondition.type === 'resource_or_stripping') {
    if (newState.strippingValue <= 0 || 
        (newState.resources && (newState.resources.paper <= 0 || newState.resources.ink <= 0 || newState.resources.light <= 0))) {
      newState.status = 'lost';
    }
  } else if (game.loseCondition.type === 'jia_failure') {
    if (newState.jiaFailureFactor >= game.loseCondition.threshold) {
      newState.status = 'lost';
    }
  }
  
  if (newState.turn >= newState.maxTurns && newState.status === 'playing') {
    newState.status = 'lost';
  }
  
  return newState;
}

function checkHiddenConditions(state, game) {
  if (!game.hiddenConditions) return state;
  
  let newState = deepClone(state);
  
  for (const condition of game.hiddenConditions) {
    if (condition.trigger.calibrationMarks && 
        newState.calibrationMarks >= condition.trigger.calibrationMarks &&
        newState.turn <= condition.trigger.turn &&
        !newState[`hidden_${condition.id}_triggered`]) {
      newState = applyEffect(newState, condition.effect);
      newState[`hidden_${condition.id}_triggered`] = true;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'hidden',
        name: condition.name,
        description: condition.description,
        effect: condition.effect
      });
    }
  }
  
  return newState;
}

app.get('/api/games', (req, res) => {
  const gameList = Object.values(games).map(g => ({
    id: g.id,
    name: g.name,
    subtitle: g.subtitle,
    description: g.description,
    theme: g.theme
  }));
  res.json({ games: gameList });
});

app.get('/api/games/:gameId', (req, res) => {
  const game = games[req.params.gameId];
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json({ game: {
    id: game.id,
    name: game.name,
    subtitle: game.subtitle,
    description: game.description,
    map: game.map,
    events: game.events.filter(e => !e.hidden),
    winCondition: game.winCondition,
    loseCondition: game.loseCondition
  }});
});

app.post('/api/games/:gameId/start', (req, res) => {
  const gameId = req.params.gameId;
  const game = games[gameId];
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const sessionId = req.body.sessionId || Date.now().toString();
  const state = initGameState(gameId);
  
  state.sessionId = sessionId;
  gameSessions[sessionId] = state;
  replayRecords[sessionId] = [{
    turn: 0,
    action: 'start',
    state: deepClone(state),
    timestamp: Date.now()
  }];
  
  res.json({ sessionId, state });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const state = gameSessions[req.params.sessionId];
  if (!state) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ state });
});

function deterministicReplayAction(gameId, currentState, action, payload, randomOutcomes) {
  const game = games[gameId];
  let newState = deepClone(currentState);

  if (action === 'move') {
    const targetNode = payload.nodeId;
    const moveCost = { paper: 2, ink: 1, light: 1 };
    newState.resources.paper -= moveCost.paper;
    newState.resources.ink -= moveCost.ink;
    newState.resources.light -= moveCost.light;
    newState.currentNode = targetNode;
    if (!newState.visitedNodes.includes(targetNode)) {
      newState.visitedNodes.push(targetNode);
      newState.calibrationMarks += 0.5;
    }
    if (randomOutcomes && randomOutcomes.riskTriggered) {
      newState.strippingValue -= randomOutcomes.damage;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'risk_triggered',
        name: '风险触发',
        description: `丑号风险触发，剥离值-${randomOutcomes.damage}`
      });
    }
    if (randomOutcomes && randomOutcomes.rewardTriggered) {
      newState.calibrationMarks += randomOutcomes.bonus;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'reward_triggered',
        name: '奖励触发',
        description: `申号奖励触发，定标痕+${randomOutcomes.bonus}`
      });
    }
    newState.actionHistory.push({ action, payload, timestamp: Date.now() });
  } else if (action === 'use_slot') {
    newState.usedSlots += 1;
    const slotType = payload.type;
    if (slotType === 'repair') {
      const repairAmount = 15;
      newState.strippingValue = Math.min(newState.maxStrippingValue, newState.strippingValue + repairAmount);
      newState.eventLog.push({ turn: newState.turn, type: 'slot_repair', name: '排演槽·修补', description: `使用排演槽修补纸船，剥离值+${repairAmount}` });
    } else if (slotType === 'calibrate') {
      newState.calibrationMarks += 1;
      newState.eventLog.push({ turn: newState.turn, type: 'slot_calibrate', name: '排演槽·校准', description: '使用排演槽校准航向，定标痕+1' });
    } else if (slotType === 'resupply') {
      newState.resources.paper += 10;
      newState.resources.ink += 8;
      newState.resources.light += 5;
      newState.eventLog.push({ turn: newState.turn, type: 'slot_resupply', name: '排演槽·补给', description: '使用排演槽召唤补给，资源小幅恢复' });
    }
    newState.actionHistory.push({ action, payload, timestamp: Date.now() });
  } else if (action === 'end_turn') {
    newState.turn += 1;
    const turnEvents = game.events.filter(e => e.turn === newState.turn);
    for (const event of turnEvents) {
      newState = applyEffect(newState, event.effect);
      newState.eventLog.push({
        turn: newState.turn,
        type: event.type,
        name: event.name,
        description: event.description,
        effect: event.effect,
        hidden: event.hidden || false
      });
    }
    newState = checkHiddenConditions(newState, game);
    newState.actionHistory.push({ action, timestamp: Date.now() });
  }

  newState.strippingValue = Math.max(0, newState.strippingValue);
  newState = checkGameStatus(newState, game);
  return newState;
}

function replayActionsFromRecords(gameId, records) {
  const game = games[gameId];
  if (!game) return null;
  let state = initGameState(gameId);
  for (let i = 1; i < records.length; i++) {
    const record = records[i];
    state = deterministicReplayAction(gameId, state, record.action, record.payload || {}, record.randomOutcomes || null);
  }
  return state;
}

app.post('/api/sessions/:sessionId/action', (req, res) => {
  const sessionId = req.params.sessionId;
  const state = gameSessions[sessionId];
  if (!state) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (state.status !== 'playing') {
    return res.status(400).json({ error: 'Game already ended' });
  }
  
  const { action, payload } = req.body;
  const game = games[state.gameId];
  let newState = deepClone(state);
  let randomOutcomes = null;
  
  if (action === 'move') {
    const targetNode = payload.nodeId;
    const currentNode = newState.currentNode;
    
    const routeExists = game.map.routes.some(
      r => (r[0] === currentNode && r[1] === targetNode) || 
           (r[1] === currentNode && r[0] === targetNode)
    );
    
    if (!routeExists) {
      return res.status(400).json({ error: 'Invalid move: route does not exist' });
    }
    
    const moveCost = { paper: 2, ink: 1, light: 1 };
    if (newState.resources.paper < moveCost.paper ||
        newState.resources.ink < moveCost.ink ||
        newState.resources.light < moveCost.light) {
      return res.status(400).json({ error: '资源不足，无法移动' });
    }
    
    newState.resources.paper -= moveCost.paper;
    newState.resources.ink -= moveCost.ink;
    newState.resources.light -= moveCost.light;
    
    newState.currentNode = targetNode;
    if (!newState.visitedNodes.includes(targetNode)) {
      newState.visitedNodes.push(targetNode);
      newState.calibrationMarks += 0.5;
    }
    
    randomOutcomes = {};
    const riskRoll = Math.random();
    if (riskRoll < newState.chouRisk) {
      const damage = Math.floor(5 + Math.random() * 8);
      newState.strippingValue -= damage;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'risk_triggered',
        name: '风险触发',
        description: `丑号风险触发，剥离值-${damage}`
      });
      randomOutcomes.riskTriggered = true;
      randomOutcomes.damage = damage;
    } else {
      randomOutcomes.riskTriggered = false;
    }
    
    const rewardRoll = Math.random();
    if (rewardRoll < newState.shenReward) {
      const bonus = Math.floor(2 + Math.random() * 5) * 0.5;
      newState.calibrationMarks += bonus;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'reward_triggered',
        name: '奖励触发',
        description: `申号奖励触发，定标痕+${bonus}`
      });
      randomOutcomes.rewardTriggered = true;
      randomOutcomes.bonus = bonus;
    } else {
      randomOutcomes.rewardTriggered = false;
    }
    
    newState.actionHistory.push({ action, payload, timestamp: Date.now() });
  } 
  else if (action === 'use_slot') {
    if (newState.usedSlots >= newState.rehearsalSlots) {
      return res.status(400).json({ error: '排演槽已用尽' });
    }
    
    const slotType = payload.type;
    newState.usedSlots += 1;
    
    if (slotType === 'repair') {
      const repairAmount = 15;
      newState.strippingValue = Math.min(newState.maxStrippingValue, newState.strippingValue + repairAmount);
      newState.eventLog.push({
        turn: newState.turn,
        type: 'slot_repair',
        name: '排演槽·修补',
        description: `使用排演槽修补纸船，剥离值+${repairAmount}`
      });
    } else if (slotType === 'calibrate') {
      newState.calibrationMarks += 1;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'slot_calibrate',
        name: '排演槽·校准',
        description: '使用排演槽校准航向，定标痕+1'
      });
    } else if (slotType === 'resupply') {
      newState.resources.paper += 10;
      newState.resources.ink += 8;
      newState.resources.light += 5;
      newState.eventLog.push({
        turn: newState.turn,
        type: 'slot_resupply',
        name: '排演槽·补给',
        description: '使用排演槽召唤补给，资源小幅恢复'
      });
    }
    
    newState.actionHistory.push({ action, payload, timestamp: Date.now() });
  }
  else if (action === 'end_turn') {
    newState.turn += 1;
    
    const turnEvents = game.events.filter(e => e.turn === newState.turn);
    for (const event of turnEvents) {
      newState = applyEffect(newState, event.effect);
      newState.eventLog.push({
        turn: newState.turn,
        type: event.type,
        name: event.name,
        description: event.description,
        effect: event.effect,
        hidden: event.hidden || false
      });
    }
    
    newState = checkHiddenConditions(newState, game);
    
    newState.actionHistory.push({ action, timestamp: Date.now() });
  }
  
  newState = checkGameStatus(newState, game);
  
  gameSessions[sessionId] = newState;
  
  if (!replayRecords[sessionId]) {
    replayRecords[sessionId] = [];
  }
  replayRecords[sessionId].push({
    turn: newState.turn,
    action,
    payload: payload || null,
    randomOutcomes,
    state: deepClone(newState),
    timestamp: Date.now()
  });
  
  res.json({ state: newState });
});

app.get('/api/sessions/:sessionId/replay', (req, res) => {
  const records = replayRecords[req.params.sessionId];
  if (!records) {
    return res.status(404).json({ error: 'Replay records not found' });
  }
  res.json({ replay: records });
});

app.get('/api/sessions/:sessionId/replay/:step', (req, res) => {
  const records = replayRecords[req.params.sessionId];
  const step = parseInt(req.params.step);
  
  if (!records) {
    return res.status(404).json({ error: 'Replay records not found' });
  }
  if (step < 0 || step >= records.length) {
    return res.status(400).json({ error: 'Invalid step index' });
  }
  
  res.json({ step: records[step] });
});

app.post('/api/sessions/:sessionId/settlement', (req, res) => {
  const sessionId = req.params.sessionId;
  const records = replayRecords[sessionId];
  
  if (!records || records.length === 0) {
    return res.status(404).json({ error: 'Replay records not found' });
  }
  
  const gameId = records[0].state.gameId;
  const game = games[gameId];
  if (!game) {
    return res.status(404).json({ error: 'Game definition not found' });
  }
  
  const state = replayActionsFromRecords(gameId, records);
  if (!state) {
    return res.status(500).json({ error: 'Failed to recalculate state' });
  }
  
  gameSessions[sessionId] = state;
  
  let totalRiskEvents = 0;
  let totalRewardEvents = 0;
  let totalResourcesUsed = { paper: 0, ink: 0, light: 0 };
  
  for (const record of records) {
    if (record.action === 'move') {
      totalResourcesUsed.paper += 2;
      totalResourcesUsed.ink += 1;
      totalResourcesUsed.light += 1;
    }
  }
  
  const riskEvents = state.eventLog.filter(e => e.type === 'risk_triggered' || e.type === 'risk');
  const rewardEvents = state.eventLog.filter(e => e.type === 'reward_triggered' || e.type === 'reward');
  totalRiskEvents = riskEvents.length;
  totalRewardEvents = rewardEvents.length;
  
  const slotsUsed = state.usedSlots;
  const nodesVisited = state.visitedNodes.length;
  const turnsPlayed = state.turn;
  const finalStrippingValue = state.strippingValue;
  
  let score = 0;
  score += state.calibrationMarks * 100;
  score += finalStrippingValue * 2;
  score += nodesVisited * 50;
  score -= totalRiskEvents * 30;
  score += totalRewardEvents * 40;
  score -= slotsUsed * 20;
  
  if (state.status === 'won') {
    score *= 1.5;
    score += 500;
  }
  
  const efficiency = state.calibrationMarks / Math.max(1, turnsPlayed);
  
  const rank = score >= 1500 ? 'S' : 
               score >= 1200 ? 'A' :
               score >= 900 ? 'B' :
               score >= 600 ? 'C' : 'D';
  
  res.json({
    settlement: {
      sessionId,
      gameId,
      gameName: game.name,
      recalculated: true,
      finalState: {
        strippingValue: finalStrippingValue,
        maxStrippingValue: state.maxStrippingValue,
        calibrationMarks: state.calibrationMarks,
        targetCalibration: state.targetCalibration,
        chouRisk: state.chouRisk,
        shenReward: state.shenReward,
        jiaFailureFactor: state.jiaFailureFactor,
        resources: state.resources,
        turn: turnsPlayed,
        maxTurns: state.maxTurns,
        currentNode: state.currentNode,
        status: state.status
      },
      statistics: {
        totalRiskEvents,
        totalRewardEvents,
        totalResourcesUsed,
        slotsUsed,
        nodesVisited,
        turnsPlayed
      },
      score: Math.floor(score),
      rank,
      efficiency: efficiency.toFixed(2),
      winCondition: game.winCondition,
      loseCondition: game.loseCondition
    }
  });
});

app.post('/api/replay/save', (req, res) => {
  const { sessionId, replayData } = req.body;
  
  if (sessionId && replayData) {
    replayRecords[sessionId] = replayData;
    if (replayData.length > 0) {
      const lastState = replayData[replayData.length - 1].state;
      gameSessions[sessionId] = lastState;
    }
  }
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🌙 夜航纸船资源配给盘 已启动`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📦 游戏: 丑局 / 申局 / 甲局`);
});
