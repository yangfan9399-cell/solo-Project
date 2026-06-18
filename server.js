const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');
const gameLogic = require('./gameLogic');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

initDatabase();

app.get('/api/scenarios', (req, res) => {
  const scenarios = {};
  for (const [key, value] of Object.entries(gameLogic.scenarios)) {
    scenarios[key] = {
      name: value.name,
      description: value.description,
      maxTurns: value.maxTurns,
      winCondition: value.winCondition,
      failCondition: value.failCondition,
      map: value.map
    };
  }
  res.json(scenarios);
});

app.post('/api/games', (req, res) => {
  try {
    const { scenarioType } = req.body;
    if (!scenarioType) {
      return res.status(400).json({ error: '请指定场景类型' });
    }
    const game = gameLogic.createGame(scenarioType);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/games/:gameId', (req, res) => {
  try {
    const game = gameLogic.getGameState(req.params.gameId);
    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/games/:gameId/actions', (req, res) => {
  try {
    const { actionType, actionData } = req.body;
    const game = gameLogic.performAction(req.params.gameId, actionType, actionData || {});
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/games/:gameId/settlement', (req, res) => {
  try {
    const settlement = gameLogic.getSettlement(req.params.gameId);
    if (!settlement) {
      return res.status(404).json({ error: '结算不存在' });
    }
    res.json(settlement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/games/:gameId/settlement/recalculate', (req, res) => {
  try {
    const settlement = gameLogic.recalculateSettlement(req.params.gameId);
    res.json(settlement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/games/:gameId/revert', (req, res) => {
  try {
    const { stepNumber } = req.body;
    const game = gameLogic.revertToStep(req.params.gameId, stepNumber);
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/games', (req, res) => {
  try {
    const games = gameLogic.getActiveGames();
    res.json(games);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`星尘棋盘资源配给盘 服务已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
