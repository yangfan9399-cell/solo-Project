const express = require('express');
const path = require('path');
const GAME_CONFIGS = require('./data/gameConfigs');

const app = express();
const PORT = 37688;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessions = {};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function findEdge(config, from, to) {
  return config.map.edges.find(e =>
    (e.from === from && e.to === to) || (e.from === to && e.to === from)
  );
}

function getAvailableEdges(config, state, unlockedEdges) {
  return config.map.edges.filter(e => {
    if (e.locked && !unlockedEdges.includes(`${e.from}-${e.to}`) && !unlockedEdges.includes(`${e.to}-${e.from}`)) {
      return false;
    }
    return e.from === state.currentNode || e.to === state.currentNode;
  });
}

function applyEffects(state, effects, config) {
  const newState = deepClone(state);
  if (!newState.unlockedEdges) newState.unlockedEdges = [];
  if (!newState.wuFlames && config.id === 'wu') newState.wuFlames = { a: false, b: false, c: false };

  effects.forEach(effect => {
    switch (effect.type) {
      case 'railSwitch':
        newState.railSwitchValue = (newState.railSwitchValue || 0) + effect.value;
        break;
      case 'translation':
        newState.translationSlots = (newState.translationSlots || 0) + effect.value;
        break;
      case 'rewrite':
        newState.rewriteTraces = (newState.rewriteTraces || 0) + effect.value;
        break;
      case 'siRisk':
        newState.siRisk = (newState.siRisk || 0) + effect.value;
        break;
      case 'shenReward':
        newState.shenReward = (newState.shenReward || 0) + effect.value;
        break;
      case 'wuFailureFactor':
        newState.wuFailureFactor = (newState.wuFailureFactor || 0) + effect.value;
        break;
      case 'unlock_edge':
        if (!newState.unlockedEdges.includes(effect.edge)) {
          newState.unlockedEdges.push(effect.edge);
        }
        break;
      case 'hiddenUnlocked':
        newState.hiddenUnlocked = effect.value;
        break;
      case 'wuFlame':
        if (!newState.wuFlames) newState.wuFlames = { a: false, b: false, c: false };
        newState.wuFlames[effect.flame] = effect.value;
        break;
    }
  });

  if (config.id === 'wu' && newState.wuFlames) {
    const allLit = newState.wuFlames.a && newState.wuFlames.b && newState.wuFlames.c;
    if (allLit && !newState.eventsTriggered.includes('event_three_flames')) {
      const hiddenEvent = config.events['event_three_flames'];
      if (hiddenEvent) {
        newState.eventsTriggered.push('event_three_flames');
        hiddenEvent.effects.forEach(effect => {
          switch (effect.type) {
            case 'wuFailureFactor':
              newState.wuFailureFactor = (newState.wuFailureFactor || 0) + effect.value;
              break;
            case 'hiddenUnlocked':
              newState.hiddenUnlocked = effect.value;
              break;
            case 'unlock_edge':
              if (!newState.unlockedEdges.includes(effect.edge)) {
                newState.unlockedEdges.push(effect.edge);
              }
              break;
          }
        });
        newState._autoTriggeredEvent = hiddenEvent.id;
      }
    }
  }

  return newState;
}

app.get('/api/games', (req, res) => {
  const list = Object.values(GAME_CONFIGS).map(c => ({
    id: c.id,
    name: c.name,
    subtitle: c.subtitle,
    description: c.description
  }));
  res.json({ games: list });
});

app.get('/api/games/:gameId', (req, res) => {
  const config = GAME_CONFIGS[req.params.gameId];
  if (!config) return res.status(404).json({ error: '对局不存在' });
  res.json({
    id: config.id,
    name: config.name,
    subtitle: config.subtitle,
    description: config.description,
    map: config.map,
    eventList: Object.values(config.events).map(e => ({
      id: e.id,
      name: e.name,
      node: e.node,
      type: e.type,
      auto: e.auto || false
    }))
  });
});

app.post('/api/sessions/start/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  const config = GAME_CONFIGS[gameId];
  if (!config) return res.status(404).json({ error: '对局不存在' });

  const sessionId = generateSessionId();
  const initState = deepClone(config.initialState);
  initState.unlockedEdges = [];
  if (gameId === 'wu') initState.wuFlames = { a: false, b: false, c: false };

  const session = {
    sessionId,
    gameId,
    createdAt: Date.now(),
    currentStep: 0,
    gameStatus: 'playing',
    history: [{
      step: 0,
      action: { type: 'init', description: '推演局初始化' },
      state: initState,
      eventTriggered: null
    }]
  };

  sessions[sessionId] = session;

  res.json({
    sessionId,
    gameId,
    currentState: initState,
    gameStatus: 'playing',
    availableMoves: getAvailableEdges(config, initState, initState.unlockedEdges || []).map(e => ({
      from: e.from,
      to: e.to,
      target: e.from === initState.currentNode ? e.to : e.from,
      cost: e.cost,
      switchReq: e.switchReq,
      type: e.type
    }))
  });
});

app.post('/api/sessions/:sessionId/move', (req, res) => {
  const { sessionId } = req.params;
  const { targetNode, useTranslation = false } = req.body;

  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });
  if (session.gameStatus !== 'playing') return res.status(400).json({ error: '对局已结束' });

  const config = GAME_CONFIGS[session.gameId];
  const currentHistory = session.history[session.history.length - 1];
  const state = deepClone(currentHistory.state);

  const edge = findEdge(config, state.currentNode, targetNode);
  if (!edge) return res.status(400).json({ error: '航线不存在' });

  const unlockedEdges = state.unlockedEdges || [];
  if (edge.locked && !unlockedEdges.includes(`${edge.from}-${edge.to}`) && !unlockedEdges.includes(`${edge.to}-${edge.from}`)) {
    return res.status(400).json({ error: '此航线已锁定，需触发特定事件解锁' });
  }

  let actualSwitchReq = edge.switchReq;
  if (useTranslation && state.translationSlots > 0 && actualSwitchReq > 0) {
    state.translationSlots -= 1;
    actualSwitchReq = Math.max(0, actualSwitchReq - 1);
    state.rewriteTraces += 1;
  }

  if (state.railSwitchValue < actualSwitchReq) {
    return res.status(400).json({ error: `换轨值不足，需要 ${actualSwitchReq}，当前 ${state.railSwitchValue}` });
  }

  state.railSwitchValue -= actualSwitchReq;
  state.currentNode = targetNode;
  state.path.push(targetNode);
  state.steps += 1;

  let eventTriggered = null;
  let autoTriggeredEvent = null;
  const nodeEvents = Object.values(config.events).filter(e => e.node === targetNode && !e.auto);
  if (nodeEvents.length > 0) {
    const untriggered = nodeEvents.filter(e => !state.eventsTriggered.includes(e.id));
    if (untriggered.length > 0) {
      const ev = untriggered[0];
      state.eventsTriggered.push(ev.id);
      const newState = applyEffects(state, ev.effects, config);
      Object.assign(state, newState);
      if (state._autoTriggeredEvent) {
        autoTriggeredEvent = state._autoTriggeredEvent;
        state.eventsTriggered = state.eventsTriggered.filter((e, i, arr) => arr.indexOf(e) === i);
      }
      delete state._autoTriggeredEvent;
      eventTriggered = {
        id: ev.id,
        name: ev.name,
        type: ev.type,
        description: ev.description,
        effects: ev.effects || null
      };
    }
  }

  if (session.gameId === 'wu' && state.wuFlames) {
    const allLit = state.wuFlames.a && state.wuFlames.b && state.wuFlames.c;
    if (allLit && !session.history.some(h => h.eventTriggered && h.eventTriggered.id === 'event_three_flames') && !(eventTriggered && eventTriggered.id === 'event_three_flames')) {
      const hiddenEvent = config.events['event_three_flames'];
      if (hiddenEvent && !state.eventsTriggered.includes('event_three_flames')) {
        state.eventsTriggered.push('event_three_flames');
        autoTriggeredEvent = {
          id: hiddenEvent.id,
          name: hiddenEvent.name,
          type: hiddenEvent.type,
          description: hiddenEvent.description,
          effects: hiddenEvent.effects || null
        };
      }
    }
  }

  let gameStatus = 'playing';
  if (config.defeatFormula(state)) {
    gameStatus = 'defeat';
  } else if (config.victoryFormula(state)) {
    gameStatus = 'victory';
  }

  const action = {
    type: 'move',
    from: session.history[session.history.length - 1].state.currentNode,
    to: targetNode,
    edgeType: edge.type,
    cost: edge.cost,
    switchUsed: actualSwitchReq,
    translationUsed: useTranslation,
    description: `${session.history[session.history.length - 1].state.currentNode} → ${targetNode} [换轨${actualSwitchReq}]${useTranslation ? ' +转译' : ''}`
  };

  session.currentStep = state.steps;
  session.gameStatus = gameStatus;
  session.history.push({
    step: state.steps,
    action,
    state: deepClone(state),
    eventTriggered
  });

  res.json({
    sessionId,
    gameStatus,
    currentState: state,
    action,
    eventTriggered,
    availableMoves: gameStatus === 'playing' ? getAvailableEdges(config, state, state.unlockedEdges || []).map(e => ({
      from: e.from,
      to: e.to,
      target: e.from === state.currentNode ? e.to : e.from,
      cost: e.cost,
      switchReq: e.switchReq,
      type: e.type
    })) : []
  });
});

app.get('/api/sessions/:sessionId/history', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const history = session.history.map(h => ({
    step: h.step,
    action: h.action,
    state: deepClone(h.state),
    eventTriggered: h.eventTriggered ? {
      id: h.eventTriggered.id,
      name: h.eventTriggered.name,
      type: h.eventTriggered.type,
      description: h.eventTriggered.description,
      effects: h.eventTriggered.effects || null
    } : null
  }));

  res.json({
    sessionId: session.sessionId,
    gameId: session.gameId,
    gameStatus: session.gameStatus,
    currentStep: session.currentStep,
    history
  });
});

app.get('/api/sessions/:sessionId/step/:stepIndex', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const idx = parseInt(req.params.stepIndex);
  if (idx < 0 || idx >= session.history.length) {
    return res.status(400).json({ error: '步骤索引越界' });
  }

  const config = GAME_CONFIGS[session.gameId];
  const snapshot = session.history[idx];

  res.json({
    step: idx,
    state: snapshot.state,
    action: snapshot.action,
    eventTriggered: snapshot.eventTriggered,
    isLatest: idx === session.history.length - 1,
    gameStatusAtStep: idx === session.history.length - 1 ? session.gameStatus : 'playing',
    availableMoves: (idx === session.history.length - 1 && session.gameStatus === 'playing') ?
      getAvailableEdges(config, snapshot.state, snapshot.state.unlockedEdges || []).map(e => ({
        from: e.from,
        to: e.to,
        target: e.from === snapshot.state.currentNode ? e.to : e.from,
        cost: e.cost,
        switchReq: e.switchReq,
        type: e.type
      })) : []
  });
});

app.post('/api/sessions/:sessionId/revert/:stepIndex', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const idx = parseInt(req.params.stepIndex);
  if (idx < 0 || idx >= session.history.length) {
    return res.status(400).json({ error: '步骤索引越界' });
  }

  const config = GAME_CONFIGS[session.gameId];
  session.history = session.history.slice(0, idx + 1);
  const latestState = deepClone(session.history[session.history.length - 1].state);
  session.currentStep = latestState.steps;
  session.gameStatus = 'playing';

  if (config.defeatFormula(latestState)) {
    session.gameStatus = 'defeat';
  } else if (config.victoryFormula(latestState)) {
    session.gameStatus = 'victory';
  }

  res.json({
    sessionId: session.sessionId,
    gameStatus: session.gameStatus,
    currentState: latestState,
    revertedTo: idx,
    availableMoves: session.gameStatus === 'playing' ?
      getAvailableEdges(config, latestState, latestState.unlockedEdges || []).map(e => ({
        from: e.from,
        to: e.to,
        target: e.from === latestState.currentNode ? e.to : e.from,
        cost: e.cost,
        switchReq: e.switchReq,
        type: e.type
      })) : []
  });
});

app.post('/api/sessions/:sessionId/settle', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const config = GAME_CONFIGS[session.gameId];
  const finalState = deepClone(session.history[session.history.length - 1].state);

  const isVictory = config.victoryFormula(finalState);
  const isDefeat = config.defeatFormula(finalState);
  const score = config.scoreFormula(finalState);

  const eventsFired = session.history.filter(h => h.eventTriggered).map(h => ({
    step: h.step,
    id: h.eventTriggered.id,
    name: h.eventTriggered.name,
    type: h.eventTriggered.type,
    description: h.eventTriggered.description
  }));

  const detailBreakdown = [];
  detailBreakdown.push({ label: '基础分', value: session.gameId === 'si' ? 100 : session.gameId === 'shen' ? 120 : 150 });
  detailBreakdown.push({ label: '步数惩罚', value: -(finalState.steps * (session.gameId === 'si' ? 5 : session.gameId === 'shen' ? 6 : 4)) });
  detailBreakdown.push({ label: '巳号风险惩罚', value: -(finalState.siRisk * (session.gameId === 'si' ? 10 : session.gameId === 'shen' ? 8 : 6)) });
  if (session.gameId === 'wu') {
    detailBreakdown.push({ label: '午号失败因子惩罚', value: -(Math.max(0, finalState.wuFailureFactor) * 8) });
    const fc = Object.values(finalState.wuFlames || {}).filter(Boolean).length;
    detailBreakdown.push({ label: '三焰点燃加成', value: fc * 25 });
  }
  detailBreakdown.push({ label: '申号奖励加成', value: finalState.shenReward * (session.gameId === 'si' ? 15 : session.gameId === 'shen' ? 20 : 18) });
  detailBreakdown.push({ label: '复写痕加成', value: finalState.rewriteTraces * (session.gameId === 'si' ? 8 : session.gameId === 'shen' ? 10 : 12) });
  if (finalState.hiddenUnlocked) detailBreakdown.push({ label: '隐藏结局加成', value: session.gameId === 'wu' ? 100 : 50 });
  if (session.gameId === 'shen') detailBreakdown.push({ label: '剩余换轨加成', value: finalState.railSwitchValue * 5 });

  let grade = 'F';
  if (isVictory) {
    if (score >= 180) grade = 'S+';
    else if (score >= 150) grade = 'S';
    else if (score >= 120) grade = 'A';
    else if (score >= 90) grade = 'B';
    else if (score >= 60) grade = 'C';
    else grade = 'D';
  }

  res.json({
    sessionId: session.sessionId,
    gameId: session.gameId,
    gameName: config.name,
    result: isVictory ? 'victory' : (isDefeat ? 'defeat' : 'incomplete'),
    score,
    grade,
    finalState: {
      railSwitchValue: finalState.railSwitchValue,
      translationSlots: finalState.translationSlots,
      rewriteTraces: finalState.rewriteTraces,
      siRisk: finalState.siRisk,
      shenReward: finalState.shenReward,
      wuFailureFactor: finalState.wuFailureFactor,
      steps: finalState.steps,
      path: finalState.path,
      hiddenUnlocked: finalState.hiddenUnlocked,
      wuFlames: finalState.wuFlames || null
    },
    totalSteps: session.currentStep,
    eventsFired,
    detailBreakdown,
    replay: session.history.map((h, i) => ({
      step: i,
      action: h.action,
      stateSnapshot: {
        currentNode: h.state.currentNode,
        railSwitchValue: h.state.railSwitchValue,
        translationSlots: h.state.translationSlots,
        rewriteTraces: h.state.rewriteTraces,
        siRisk: h.state.siRisk,
        shenReward: h.state.shenReward,
        wuFailureFactor: h.state.wuFailureFactor
      }
    }))
  });
});

app.post('/api/sessions/restore', (req, res) => {
  const { sessionData } = req.body;
  if (!sessionData || !sessionData.sessionId || !sessionData.gameId || !sessionData.history) {
    return res.status(400).json({ error: '会话数据不完整' });
  }
  const config = GAME_CONFIGS[sessionData.gameId];
  if (!config) return res.status(404).json({ error: '对局配置不存在' });

  const sid = sessionData.sessionId;
  sessions[sid] = deepClone(sessionData);

  sessions[sid].history = sessions[sid].history.map(h => {
    const normalized = { ...h };
    if (normalized.state && !Array.isArray(normalized.state.unlockedEdges)) {
      normalized.state.unlockedEdges = [];
    }
    if (normalized.state && sessionData.gameId === 'wu' && !normalized.state.wuFlames) {
      normalized.state.wuFlames = { a: false, b: false, c: false };
    }
    if (normalized.eventTriggered) {
      const et = normalized.eventTriggered;
      if (et.event) {
        normalized.eventTriggered = {
          id: et.event.id,
          name: et.event.name,
          type: et.event.type,
          description: et.event.description,
          effects: et.event.effects || null
        };
      } else if (!et.id) {
        normalized.eventTriggered = null;
      }
    }
    return normalized;
  });

  const latestState = sessions[sid].history[sessions[sid].history.length - 1].state;

  res.json({
    sessionId: sid,
    gameId: sessions[sid].gameId,
    gameStatus: sessions[sid].gameStatus,
    currentState: latestState,
    currentStep: sessions[sid].currentStep,
    availableMoves: sessions[sid].gameStatus === 'playing' ?
      getAvailableEdges(config, latestState, latestState.unlockedEdges || []).map(e => ({
        from: e.from,
        to: e.to,
        target: e.from === latestState.currentNode ? e.to : e.from,
        cost: e.cost,
        switchReq: e.switchReq,
        type: e.type
      })) : []
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  ❄ 雪线缆屋航线推演局 服务已启动 ❄                   ║
╠══════════════════════════════════════════════════════╣
║  地址: http://localhost:${PORT}                      ║
║  对局: 巳局(教学) / 申局(资源) / 午局(隐藏)           ║
╚══════════════════════════════════════════════════════╝
  `);
});
