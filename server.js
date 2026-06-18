const express = require('express');
const path = require('path');
const {
  getGameConfig,
  listGames,
  loadSaveGame,
  getCurrentGameId,
  saveGameState,
  clearSaveGame,
  calculateSettlement,
  applyEvent
} = require('./server/gameLogic');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let gameSessions = {};

function initGameSession(gameId) {
  const config = getGameConfig(gameId);
  if (!config) return null;

  const initialState = { ...config.initialState };
  const history = [
    {
      step: 0,
      type: 'init',
      state: { ...initialState },
      eventId: null,
      timestamp: Date.now()
    }
  ];

  const session = {
    gameId,
    currentState: initialState,
    history,
    isEnded: false,
    result: null
  };

  gameSessions[gameId] = session;
  saveGameState(session);
  return session;
}

function getOrLoadSession(gameId) {
  if (gameSessions[gameId]) {
    return gameSessions[gameId];
  }
  const saved = loadSaveGame(gameId);
  if (saved && saved.gameId === gameId) {
    gameSessions[gameId] = saved;
    return saved;
  }
  return null;
}

app.get('/api/games', (req, res) => {
  res.json({ games: listGames() });
});

app.get('/api/game/:gameId/config', (req, res) => {
  const config = getGameConfig(req.params.gameId);
  if (!config) {
    return res.status(404).json({ error: '游戏不存在' });
  }
  res.json({
    id: config.id,
    name: config.name,
    description: config.description,
    difficulty: config.difficulty,
    events: config.events,
    mapNodes: config.mapNodes,
    winCondition: config.winCondition,
    loseCondition: config.loseCondition,
    maxTurns: config.initialState.maxTurns,
    hasHidden: !!config.hiddenCondition
  });
});

app.post('/api/game/:gameId/start', (req, res) => {
  const gameId = req.params.gameId;
  const session = initGameSession(gameId);
  if (!session) {
    return res.status(404).json({ error: '游戏不存在' });
  }
  res.json({
    gameId: session.gameId,
    currentState: session.currentState,
    history: session.history,
    isEnded: session.isEnded
  });
});

app.get('/api/game/:gameId/state', (req, res) => {
  const gameId = req.params.gameId;
  const session = getOrLoadSession(gameId);
  if (!session) {
    return res.status(404).json({ error: '游戏未开始' });
  }
  res.json({
    gameId: session.gameId,
    currentState: session.currentState,
    history: session.history,
    isEnded: session.isEnded,
    result: session.result
  });
});

app.post('/api/game/:gameId/apply-event', (req, res) => {
  const gameId = req.params.gameId;
  const { eventId } = req.body;

  const session = getOrLoadSession(gameId);
  if (!session) {
    return res.status(404).json({ error: '游戏未开始' });
  }
  if (session.isEnded) {
    return res.status(400).json({ error: '游戏已结束' });
  }

  const config = getGameConfig(gameId);
  const event = config.events.find(e => e.id === eventId);
  if (!event) {
    return res.status(404).json({ error: '事件不存在' });
  }

  const result = applyEvent(session.currentState, event);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }

  session.currentState = result.newState;
  session.history.push({
    step: session.history.length,
    type: 'event',
    eventId: event.id,
    eventName: event.name,
    stateBefore: session.history[session.history.length - 1].state,
    state: { ...result.newState },
    timestamp: Date.now()
  });

  const config2 = getGameConfig(gameId);
  const state = session.currentState;

  const win = config2.winCondition;
  const lose = config2.loseCondition;
  let isWin = false;
  let isLose = false;

  if (win.type === 'sealedValue') isWin = state.sealedValue >= win.target;
  else if (win.type === 'renReward') isWin = state.renReward >= win.target;

  if (lose.type === 'yiRisk') isLose = state.yiRisk >= lose.target;
  else if (lose.type === 'sealedValue') isLose = state.sealedValue <= lose.target;
  else if (lose.type === 'ziFailure') isLose = state.ziFailure >= lose.target;

  const maxTurns = config2.initialState.maxTurns;
  const turnLimitReached = state.turn > maxTurns;

  if (isWin || isLose || turnLimitReached) {
    session.isEnded = true;
    session.result = calculateSettlement(gameId, state, session.history);
  }

  saveGameState(session);

  res.json({
    success: true,
    currentState: session.currentState,
    history: session.history,
    isEnded: session.isEnded,
    result: session.result,
    eventApplied: event.name
  });
});

app.get('/api/game/:gameId/history', (req, res) => {
  const gameId = req.params.gameId;
  const session = getOrLoadSession(gameId);
  if (!session) {
    return res.status(404).json({ error: '游戏未开始' });
  }
  res.json({ history: session.history });
});

app.get('/api/game/:gameId/replay/:step', (req, res) => {
  const gameId = req.params.gameId;
  const step = parseInt(req.params.step);

  const session = getOrLoadSession(gameId);
  if (!session) {
    return res.status(404).json({ error: '游戏未开始' });
  }
  if (step < 0 || step >= session.history.length) {
    return res.status(400).json({ error: '步骤索引无效' });
  }

  const historyEntry = session.history[step];
  res.json({
    step,
    state: historyEntry.state,
    eventId: historyEntry.eventId,
    eventName: historyEntry.eventName,
    type: historyEntry.type
  });
});

app.get('/api/game/:gameId/settlement', (req, res) => {
  const gameId = req.params.gameId;
  const session = getOrLoadSession(gameId);
  if (!session) {
    return res.status(404).json({ error: '游戏未开始' });
  }

  const result = calculateSettlement(gameId, session.currentState, session.history);
  res.json({ settlement: result });
});

app.post('/api/game/:gameId/reset', (req, res) => {
  const gameId = req.params.gameId;
  if (gameSessions[gameId]) {
    delete gameSessions[gameId];
  }
  clearSaveGame(gameId);
  const session = initGameSession(gameId);
  res.json({
    gameId: session.gameId,
    currentState: session.currentState,
    history: session.history,
    isEnded: session.isEnded
  });
});

app.get('/api/save/current', (req, res) => {
  const curGameId = getCurrentGameId();
  if (curGameId) {
    const saved = loadSaveGame(curGameId);
    if (saved) {
      res.json({ hasSave: true, gameId: saved.gameId, turn: saved.currentState.turn });
      return;
    }
  }
  res.json({ hasSave: false });
});

app.listen(PORT, () => {
  console.log(`琉璃温室资源配给盘 服务器运行在 http://localhost:${PORT}`);
});
