const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8765;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function checkHiddenCondition(state, turn) {
  return turn <= 7 && state.calibration >= 70 && state.shiftMarks >= 3 && state.shenReward >= 40;
}

function getHiddenConditionProgress(state, turn, hiddenTriggered) {
  return {
    name: '碎镜共鸣',
    description: '第7回合前，定标值≥70 且 换轨痕≥3 且 申号奖励≥40',
    triggered: hiddenTriggered,
    turnRemaining: Math.max(0, 7 - turn + 1),
    turnPassed: turn > 7,
    requirements: [
      {
        field: '定标值',
        current: state.calibration,
        target: 70,
        met: state.calibration >= 70
      },
      {
        field: '换轨痕',
        current: state.shiftMarks,
        target: 3,
        met: state.shiftMarks >= 3
      },
      {
        field: '申号奖励',
        current: state.shenReward,
        target: 40,
        met: state.shenReward >= 40
      }
    ]
  };
}

app.get('/api/games', (req, res) => {
  const db = readDB();
  const gamesList = Object.values(db.games).map(g => ({
    id: g.id,
    name: g.name,
    subtitle: g.subtitle,
    description: g.description
  }));
  res.json(gamesList);
});

app.get('/api/games/:gameId', (req, res) => {
  const db = readDB();
  const game = db.games[req.params.gameId];
  if (!game) return res.status(404).json({ error: '游戏不存在' });
  const { actions, ...rest } = game;
  res.json({ ...rest, actionCount: actions.length });
});

app.post('/api/sessions', (req, res) => {
  const { gameId, playerA = '玩家A', playerB = '玩家B' } = req.body;
  const db = readDB();
  const game = db.games[gameId];
  if (!game) return res.status(404).json({ error: '游戏不存在' });

  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const session = {
    id: sessionId,
    gameId,
    playerA,
    playerB,
    turn: 1,
    state: JSON.parse(JSON.stringify(game.initialState)),
    actionCooldowns: {},
    history: [],
    hiddenTriggered: false,
    finished: false,
    result: null,
    createdAt: Date.now()
  };

  db.sessions[sessionId] = session;
  db.replays[sessionId] = [];
  writeDB(db);
  res.json({ sessionId, game });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const db = readDB();
  const session = db.sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });
  const game = db.games[session.gameId];
  const response = { session, game };
  if (game.id === 'yin' && !session.finished) {
    response.hiddenProgress = getHiddenConditionProgress(
      session.state,
      session.turn,
      session.hiddenTriggered
    );
  }
  res.json(response);
});

app.post('/api/sessions/:sessionId/actions', (req, res) => {
  const db = readDB();
  const session = db.sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });
  if (session.finished) return res.status(400).json({ error: '游戏已结束' });

  const game = db.games[session.gameId];
  const { actionId } = req.body;
  const action = game.actions.find(a => a.id === actionId);
  if (!action) return res.status(404).json({ error: '操作不存在' });

  if ((session.actionCooldowns[actionId] || 0) > 0) {
    return res.status(400).json({ error: '操作冷却中', remaining: session.actionCooldowns[actionId] });
  }

  if (action.cost) {
    if (action.cost.sealingSlots !== undefined &&
        session.state.sealingSlots.used + action.cost.sealingSlots > session.state.sealingSlots.total) {
      return res.status(400).json({ error: '封存槽不足' });
    }
    if (action.cost.shiftMarks !== undefined && session.state.shiftMarks < action.cost.shiftMarks) {
      return res.status(400).json({ error: '换轨痕不足' });
    }
    if (action.cost.calibration !== undefined && session.state.calibration < action.cost.calibration) {
      return res.status(400).json({ error: '定标值不足' });
    }
    if (action.cost.shenReward !== undefined && session.state.shenReward < action.cost.shenReward) {
      return res.status(400).json({ error: '申号奖励不足' });
    }
  }

  const effect = action.effect;
  const oldState = JSON.parse(JSON.stringify(session.state));

  if (action.cost && action.cost.calibration) {
    session.state.calibration -= action.cost.calibration;
  }
  if (action.cost && action.cost.shenReward) {
    session.state.shenReward -= action.cost.shenReward;
  }

  if (effect.calibration) session.state.calibration += effect.calibration;
  if (effect.unitaryRisk) session.state.unitaryRisk += effect.unitaryRisk;
  if (effect.shiftMarks) session.state.shiftMarks += effect.shiftMarks;
  if (effect.shenReward) session.state.shenReward += effect.shenReward;
  if (effect.yinFailure) session.state.yinFailure += effect.yinFailure;
  if (effect.sealingSlots_used) {
    session.state.sealingSlots.used = Math.min(
      session.state.sealingSlots.used + effect.sealingSlots_used,
      session.state.sealingSlots.total
    );
  }
  if (effect.sealingSlots_total) {
    session.state.sealingSlots.total += effect.sealingSlots_total;
  }

  if (action.cooldown > 0) {
    session.actionCooldowns[actionId] = action.cooldown + 1;
  }

  const event = game.events.find(e => e.turn === session.turn);
  let eventResult = null;
  if (event) {
    eventResult = { name: event.name, hint: event.hint };
    const ev = event.effect;
    if (ev.calibration) session.state.calibration += ev.calibration;
    if (ev.unitaryRisk) session.state.unitaryRisk += ev.unitaryRisk;
    if (ev.shiftMarks) session.state.shiftMarks += ev.shiftMarks;
    if (ev.shenReward) session.state.shenReward += ev.shenReward;
    if (ev.yinFailure) session.state.yinFailure += ev.yinFailure;
    if (ev.sealingSlots_used) {
      session.state.sealingSlots.used = Math.min(
        session.state.sealingSlots.used + ev.sealingSlots_used,
        session.state.sealingSlots.total
      );
    }
    if (ev.sealingSlots_total) {
      session.state.sealingSlots.total += ev.sealingSlots_total;
    }
    if (event.checkCondition && game.id === 'yin' && checkHiddenCondition(session.state, session.turn)) {
      session.hiddenTriggered = true;
      session.state.calibration += 30;
      session.state.shiftMarks += 2;
      session.state.shenReward += 25;
      eventResult.triggered = '碎镜共鸣';
      eventResult.bonus = { calibration: 30, shiftMarks: 2, shenReward: 25 };
    }
  }

  session.state.calibration = Math.max(0, session.state.calibration);
  session.state.unitaryRisk = Math.max(0, session.state.unitaryRisk);
  session.state.shiftMarks = Math.max(0, session.state.shiftMarks);
  session.state.shenReward = Math.max(0, session.state.shenReward);
  session.state.yinFailure = Math.max(0, session.state.yinFailure);

  session.history.push({
    turn: session.turn,
    action,
    oldState,
    newState: JSON.parse(JSON.stringify(session.state)),
    event: eventResult,
    timestamp: Date.now()
  });

  if (!db.replays[req.params.sessionId]) db.replays[req.params.sessionId] = [];
  db.replays[req.params.sessionId].push({
    turn: session.turn,
    actionId: action.id,
    actionName: action.name,
    state: JSON.parse(JSON.stringify(session.state)),
    event: eventResult,
    timestamp: Date.now()
  });

  Object.keys(session.actionCooldowns).forEach(k => {
    if (session.actionCooldowns[k] > 0) session.actionCooldowns[k]--;
  });

  session.turn++;

  writeDB(db);
  const response = {
    success: true,
    action,
    event: eventResult,
    state: session.state,
    turn: session.turn,
    actionCooldowns: session.actionCooldowns
  };
  if (game.id === 'yin' && !session.finished) {
    response.hiddenProgress = getHiddenConditionProgress(
      session.state,
      session.turn,
      session.hiddenTriggered
    );
  }
  res.json(response);
});

app.post('/api/sessions/:sessionId/end', (req, res) => {
  const db = readDB();
  const session = db.sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: '会话不存在' });
  if (session.finished) return res.status(400).json({ error: '游戏已结束' });

  const game = db.games[session.gameId];
  const cond = game.winCondition;
  const state = session.state;

  const results = [];
  let totalScore = 0;

  const calibOk = state.calibration >= cond.calibration.min && state.calibration <= cond.calibration.max;
  results.push({
    field: '碎镜书房定标值',
    value: state.calibration,
    target: `${cond.calibration.min}~${cond.calibration.max}`,
    pass: calibOk,
    weight: 35
  });
  if (calibOk) totalScore += 35;
  else totalScore += Math.max(0, 35 - Math.abs(state.calibration - (cond.calibration.min + cond.calibration.max) / 2));

  const slotsOk = state.sealingSlots.used >= cond.sealingSlots.minUsed;
  results.push({
    field: '碎镜书房封存槽',
    value: `${state.sealingSlots.used}/${state.sealingSlots.total}`,
    target: `≥${cond.sealingSlots.minUsed}`,
    pass: slotsOk,
    weight: 20
  });
  if (slotsOk) totalScore += 20;
  else totalScore += Math.floor(20 * state.sealingSlots.used / cond.sealingSlots.minUsed);

  if (cond.shiftMarks) {
    const shiftOk = state.shiftMarks >= cond.shiftMarks.min;
    results.push({
      field: '碎镜书房换轨痕',
      value: state.shiftMarks,
      target: `≥${cond.shiftMarks.min}`,
      pass: shiftOk,
      weight: 15
    });
    if (shiftOk) totalScore += 15;
    else totalScore += Math.floor(15 * Math.min(state.shiftMarks, cond.shiftMarks.min) / cond.shiftMarks.min);
  }

  const riskOk = state.unitaryRisk <= cond.maxRisk;
  results.push({
    field: '酉号风险',
    value: state.unitaryRisk,
    target: `≤${cond.maxRisk}`,
    pass: riskOk,
    weight: 10
  });
  if (riskOk) totalScore += 10;
  else totalScore += Math.max(0, 10 - (state.unitaryRisk - cond.maxRisk));

  results.push({
    field: '申号奖励',
    value: state.shenReward,
    target: '越高越好',
    pass: state.shenReward > 0,
    weight: 10
  });
  totalScore += Math.min(10, Math.floor(state.shenReward / 10));

  const yinOk = state.yinFailure < 3;
  results.push({
    field: '寅号失败因子',
    value: state.yinFailure,
    target: '<3',
    pass: yinOk,
    weight: 10
  });
  if (yinOk) totalScore += 10;
  else totalScore += Math.max(0, 10 - (state.yinFailure - 2) * 5);

  if (cond.requireAllSlotsUsed) {
    const allSlotsOk = state.sealingSlots.used >= state.sealingSlots.total;
    results.push({
      field: '封存槽全部使用（申局要求）',
      value: state.sealingSlots.used,
      target: `≥${state.sealingSlots.total}`,
      pass: allSlotsOk,
      weight: 15
    });
    if (allSlotsOk) totalScore += 15;
  }

  if (cond.requireHiddenCondition) {
    results.push({
      field: '隐藏条件·碎镜共鸣（寅局要求）',
      value: session.hiddenTriggered ? '已触发' : '未触发',
      target: '已触发',
      pass: session.hiddenTriggered,
      weight: 25
    });
    if (session.hiddenTriggered) totalScore += 25;
  }

  const passCount = results.filter(r => r.pass).length;
  const win = passCount >= Math.ceil(results.length * 0.7) && totalScore >= 60;

  const cooperationScore = Math.floor(session.history.filter(h => h.action.name.includes('双人')).length * 8);
  totalScore += cooperationScore;
  results.push({
    field: '协作闯关步骤加分',
    value: cooperationScore,
    target: '双人操作越多加分',
    pass: cooperationScore > 0,
    weight: 0
  });

  const stepsUsed = session.history.length;
  const efficiencyBonus = Math.max(0, (cond.maxTurns - stepsUsed + 1) * 3);
  totalScore += efficiencyBonus;
  results.push({
    field: '回合效率奖励',
    value: efficiencyBonus,
    target: `${cond.maxTurns}回合内完成`,
    pass: stepsUsed <= cond.maxTurns,
    weight: 0
  });

  totalScore = Math.min(150, totalScore);

  let rank = '丁·初窥门径';
  if (totalScore >= 130) rank = '甲·碎镜重光';
  else if (totalScore >= 110) rank = '乙·镜心通明';
  else if (totalScore >= 90) rank = '丙·融会贯通';
  else if (totalScore >= 70) rank = '丁·初窥门径';
  else rank = '戊·尚需磨炼';

  session.finished = true;
  session.result = {
    win,
    totalScore,
    rank,
    details: results,
    stepsUsed,
    cooperationBonus: cooperationScore
  };

  db.sessions[req.params.sessionId] = session;
  writeDB(db);

  res.json(session.result);
});

app.get('/api/replays/:sessionId', (req, res) => {
  const db = readDB();
  const replay = db.replays[req.params.sessionId];
  if (!replay) return res.status(404).json({ error: '回放不存在' });
  const session = db.sessions[req.params.sessionId];
  const game = db.games[session.gameId];
  res.json({ replay, session, game });
});

app.listen(PORT, () => {
  console.log(`碎镜书房双人机关局 服务器已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
