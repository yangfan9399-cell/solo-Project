const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const DATA_DIR = path.join(__dirname, 'data');
const SAVES_DIR = path.join(DATA_DIR, 'saves');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');

if (!fs.existsSync(SAVES_DIR)) {
  fs.mkdirSync(SAVES_DIR, { recursive: true });
}

const loadLevels = () => {
  return JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf-8'));
};

const loadSaves = () => {
  const files = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(SAVES_DIR, f), 'utf-8')));
};

const getSavePath = (saveId) => path.join(SAVES_DIR, `${saveId}.json`);

const createSaveId = () => `save_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

app.get('/api/levels', (req, res) => {
  try {
    const levels = loadLevels();
    res.json({ success: true, data: levels });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/levels/:id', (req, res) => {
  try {
    const levels = loadLevels();
    const level = levels.find(l => l.id === req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, error: '关卡不存在' });
    }
    res.json({ success: true, data: level });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/saves', (req, res) => {
  try {
    const saves = loadSaves();
    res.json({ success: true, data: saves.sort((a, b) => b.updatedAt - a.updatedAt) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/saves', (req, res) => {
  try {
    const { levelId, gameState, replay, metadata } = req.body;
    const saveId = createSaveId();
    const now = Date.now();
    const save = {
      id: saveId,
      levelId,
      gameState,
      replay: replay || [],
      metadata: metadata || {},
      createdAt: now,
      updatedAt: now
    };
    fs.writeFileSync(getSavePath(saveId), JSON.stringify(save, null, 2));
    res.json({ success: true, data: save });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/saves/:id', (req, res) => {
  try {
    const { gameState, replay, metadata, step } = req.body;
    const savePath = getSavePath(req.params.id);
    if (!fs.existsSync(savePath)) {
      return res.status(404).json({ success: false, error: '存档不存在' });
    }
    const save = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    if (gameState) save.gameState = gameState;
    if (replay) save.replay = replay;
    if (step) {
      if (!save.replay) save.replay = [];
      save.replay.push({ ...step, timestamp: Date.now() });
    }
    if (metadata) save.metadata = { ...save.metadata, ...metadata };
    save.updatedAt = Date.now();
    fs.writeFileSync(savePath, JSON.stringify(save, null, 2));
    res.json({ success: true, data: save });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/saves/:id', (req, res) => {
  try {
    const savePath = getSavePath(req.params.id);
    if (!fs.existsSync(savePath)) {
      return res.status(404).json({ success: false, error: '存档不存在' });
    }
    const save = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    res.json({ success: true, data: save });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/saves/:id', (req, res) => {
  try {
    const savePath = getSavePath(req.params.id);
    if (!fs.existsSync(savePath)) {
      return res.status(404).json({ success: false, error: '存档不存在' });
    }
    fs.unlinkSync(savePath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/game/init', (req, res) => {
  try {
    const { levelId } = req.body;
    const levels = loadLevels();
    const level = levels.find(l => l.id === levelId);
    if (!level) {
      return res.status(404).json({ success: false, error: '关卡不存在' });
    }
    const gameState = initializeGameState(level);
    res.json({ success: true, data: { level, gameState } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function initializeGameState(level) {
  const boardSize = level.boardSize || 5;
  const cells = [];
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      const preset = level.presetCells?.find(c => c.x === x && c.y === y);
      cells.push({
        x, y,
        lit: preset?.lit || false,
        blocked: preset?.blocked || false,
        sensor: preset?.sensor || false,
        reward: preset?.reward || false,
        hazard: preset?.hazard || false,
        goal: preset?.goal || false,
        start: preset?.start || false
      });
    }
  }
  return {
    boardSize,
    cells,
    xunran: level.initialXunran ?? 0,
    xunce: level.initialXunce ?? [],
    dianliang: [],
    chenRisk: level.initialChenRisk ?? 0,
    maoReward: level.initialMaoReward ?? 0,
    xinFailure: level.initialXinFailure ?? 0,
    currentPlayer: 1,
    turn: 1,
    phase: 'play',
    players: [
      { id: 1, name: '玩家甲', x: level.start1?.x ?? 0, y: level.start1?.y ?? 0, energy: level.playerEnergy ?? 3, color: '#4f46e5' },
      { id: 2, name: '玩家乙', x: level.start2?.x ?? boardSize - 1, y: level.start2?.y ?? boardSize - 1, energy: level.playerEnergy ?? 3, color: '#dc2626' }
    ],
    eventsTriggered: [],
    sensorsActivated: [],
    stepCount: 0
  };
}

app.post('/api/game/action', (req, res) => {
  try {
    const { levelId, gameState, action } = req.body;
    const levels = loadLevels();
    const level = levels.find(l => l.id === levelId);
    if (!level) {
      return res.status(404).json({ success: false, error: '关卡不存在' });
    }
    const result = processAction(level, JSON.parse(JSON.stringify(gameState)), action);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function processAction(level, state, action) {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) return { state, message: '无效玩家', valid: false };
  if (state.phase !== 'play') return { state, message: '游戏不在进行中', valid: false };

  const prevState = JSON.parse(JSON.stringify(state));
  let valid = true;
  let message = '';
  let events = [];

  switch (action.type) {
    case 'move':
      const { dx, dy } = action;
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (nx < 0 || nx >= state.boardSize || ny < 0 || ny >= state.boardSize) {
        return { state: prevState, message: '超出棋盘范围', valid: false };
      }
      const targetCell = state.cells.find(c => c.x === nx && c.y === ny);
      if (targetCell.blocked) {
        return { state: prevState, message: '目标格被阻挡', valid: false };
      }
      if (player.energy < 1) {
        return { state: prevState, message: '能量不足', valid: false };
      }
      player.energy -= 1;
      player.x = nx;
      player.y = ny;
      state.stepCount++;
      message = `${player.name}移动至(${nx},${ny})`;

      if (targetCell.sensor && !state.sensorsActivated.includes(`${nx},${ny}`)) {
        state.sensorsActivated.push(`${nx},${ny}`);
        state.chenRisk = Math.min(100, state.chenRisk + (level.sensorPenalty ?? 10));
        events.push({ type: 'sensor', cell: { x: nx, y: ny }, message: '触发巡测槽！辰号风险上升' });
      }
      if (targetCell.reward) {
        state.maoReward += (level.rewardValue ?? 5);
        targetCell.reward = false;
        events.push({ type: 'reward', cell: { x: nx, y: ny }, message: '获得卯号奖励！' });
      }
      if (targetCell.hazard) {
        state.xinFailure += (level.hazardPenalty ?? 15);
        targetCell.hazard = false;
        events.push({ type: 'hazard', cell: { x: nx, y: ny }, message: '触发辛号失败因子！' });
      }
      break;

    case 'light':
      const lightCell = state.cells.find(c => c.x === player.x && c.y === player.y);
      if (!lightCell) return { state: prevState, message: '无效位置', valid: false };
      if (player.energy < 1) return { state: prevState, message: '能量不足', valid: false };
      if (lightCell.lit) return { state: prevState, message: '此处已点亮', valid: false };
      player.energy -= 1;
      lightCell.lit = true;
      const key = `${player.x},${player.y}`;
      if (!state.dianliang.includes(key)) {
        state.dianliang.push(key);
      }
      state.xunran = Math.min(100, state.xunran + (level.xunranPerLight ?? 8));
      state.stepCount++;
      message = `${player.name}点亮(${player.x},${player.y})`;
      events.push({ type: 'light', cell: { x: player.x, y: player.y }, message: '星尘棋盘点亮！熏染值上升' });
      break;

    case 'coop':
      const other = state.players.find(p => p.id !== action.playerId);
      const dist = Math.abs(player.x - other.x) + Math.abs(player.y - other.y);
      if (dist > 2) return { state: prevState, message: '距离过远，无法协作', valid: false };
      if (player.energy < 2 || other.energy < 2) return { state: prevState, message: '双方能量不足（需各2点）', valid: false };
      player.energy -= 2;
      other.energy -= 2;
      state.stepCount++;
      state.xunran = Math.min(100, state.xunran + (level.coopBonus ?? 20));
      state.maoReward += (level.coopRewardBonus ?? 10);
      const range = 1;
      for (let dy2 = -range; dy2 <= range; dy2++) {
        for (let dx2 = -range; dx2 <= range; dx2++) {
          const cx = player.x + dx2;
          const cy = player.y + dy2;
          const c = state.cells.find(cc => cc.x === cx && cc.y === cy);
          if (c && !c.lit) {
            c.lit = true;
            const k = `${cx},${cy}`;
            if (!state.dianliang.includes(k)) state.dianliang.push(k);
          }
        }
      }
      message = '双人协作发动！大范围点亮';
      events.push({ type: 'coop', cell: { x: player.x, y: player.y }, message: '协作爆发！熏染值大幅提升' });
      break;

    case 'endTurn':
      state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
      if (state.currentPlayer === 1) {
        state.turn++;
        state.players.forEach(p => {
          p.energy = Math.min(level.playerEnergy ?? 3, p.energy + level.energyPerTurn ?? 2);
        });
        const randomEvent = level.events?.find(e => e.random && !state.eventsTriggered.includes(e.id) && Math.random() < 0.3);
        if (randomEvent) {
          state.eventsTriggered.push(randomEvent.id);
          events.push({ type: 'randomEvent', event: randomEvent, message: `触发事件：${randomEvent.name}` });
          if (randomEvent.effect) applyEventEffect(state, randomEvent.effect);
        }
        message = `回合 ${state.turn} 开始`;
      } else {
        message = `${player.name}结束回合`;
      }
      break;

    case 'triggerEvent':
      const event = level.events?.find(e => e.id === action.eventId);
      if (!event) return { state: prevState, message: '事件不存在', valid: false };
      if (event.condition && !checkCondition(state, event.condition)) {
        return { state: prevState, message: '条件不满足', valid: false };
      }
      if (event.cost) {
        if (event.cost.player === 1 || event.cost.player === action.playerId) {
          if (player.energy < event.cost.energy) return { state: prevState, message: '能量不足', valid: false };
          player.energy -= event.cost.energy;
        }
        if (event.cost.mao && state.maoReward < event.cost.mao) {
          return { state: prevState, message: '卯号奖励不足', valid: false };
        }
        if (event.cost.mao) state.maoReward -= event.cost.mao;
      }
      if (event.choice !== undefined) {
        const chosen = event.choices?.[action.choiceIdx ?? 0];
        if (chosen?.effect) applyEventEffect(state, chosen.effect);
        events.push({ type: 'eventChoice', event, choiceIdx: action.choiceIdx, message: `选择：${chosen?.name || '选项'}` });
      } else if (event.effect) {
        applyEventEffect(state, event.effect);
      }
      state.eventsTriggered.push(event.id);
      state.stepCount++;
      message = `触发事件：${event.name}`;
      events.push({ type: 'event', event, message });
      break;

    default:
      return { state: prevState, message: '无效操作', valid: false };
  }

  checkWinLose(level, state, events);

  return { state, message, valid, events, prevState };
}

function checkCondition(state, cond) {
  if (cond.minXunran !== undefined && state.xunran < cond.minXunran) return false;
  if (cond.maxChenRisk !== undefined && state.chenRisk > cond.maxChenRisk) return false;
  if (cond.minMaoReward !== undefined && state.maoReward < cond.minMaoReward) return false;
  if (cond.turn !== undefined && state.turn < cond.turn) return false;
  if (cond.litCells !== undefined) {
    const lit = state.cells.filter(c => c.lit).length;
    if (lit < cond.litCells) return false;
  }
  return true;
}

function applyEventEffect(state, effect) {
  if (effect.xunran !== undefined) state.xunran = Math.max(0, Math.min(100, state.xunran + effect.xunran));
  if (effect.chenRisk !== undefined) state.chenRisk = Math.max(0, Math.min(100, state.chenRisk + effect.chenRisk));
  if (effect.maoReward !== undefined) state.maoReward = Math.max(0, state.maoReward + effect.maoReward);
  if (effect.xinFailure !== undefined) state.xinFailure = Math.max(0, state.xinFailure + effect.xinFailure);
  if (effect.energy !== undefined) {
    state.players.forEach(p => {
      if (p.id === effect.playerId || effect.playerId === undefined) {
        p.energy = Math.max(0, p.energy + effect.energy);
      }
    });
  }
  if (effect.litAll) {
    state.cells.forEach(c => {
      if (!c.lit && !c.blocked) {
        c.lit = true;
        const k = `${c.x},${c.y}`;
        if (!state.dianliang.includes(k)) state.dianliang.push(k);
      }
    });
  }
  if (effect.litArea) {
    const { x, y, r = 1 } = effect.litArea;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const c = state.cells.find(cc => cc.x === x + dx && cc.y === y + dy);
        if (c && !c.lit && !c.blocked) {
          c.lit = true;
          const k = `${c.x},${c.y}`;
          if (!state.dianliang.includes(k)) state.dianliang.push(k);
        }
      }
    }
  }
}

function checkWinLose(level, state, events) {
  let win = false;
  let lose = false;
  let reason = '';

  if (level.winCondition) {
    const wc = level.winCondition;
    const litCount = state.cells.filter(c => c.lit).length;
    const totalLit = state.cells.filter(c => !c.blocked).length;
    const litRatio = litCount / Math.max(1, totalLit);

    if (wc.xunran && state.xunran >= wc.xunran) win = true;
    if (wc.litRatio && litRatio >= wc.litRatio) win = true;
    if (wc.goalReached) {
      const goal = state.cells.find(c => c.goal);
      if (goal && state.players.some(p => p.x === goal.x && p.y === goal.y)) win = true;
    }
    if (wc.turn && state.turn <= wc.turn && win) win = true;
    if (wc.hiddenCondition) {
      if (wc.hiddenCondition.type === 'xinZero' && state.xinFailure === 0) {
        win = true;
        reason = '隐藏条件达成！辛号失败因子保持为0';
      }
      if (wc.hiddenCondition.type === 'coopCount' && state.eventsTriggered.filter(e => typeof e === 'string' && e.includes('coop')).length >= (wc.hiddenCondition.count || 3)) {
        win = true;
        reason = '隐藏条件达成！协作次数达标';
      }
    }
  }

  if (level.loseCondition) {
    const lc = level.loseCondition;
    if (lc.chenRisk && state.chenRisk >= lc.chenRisk) { lose = true; reason = '辰号风险爆表！'; }
    if (lc.xinFailure && state.xinFailure >= lc.xinFailure) { lose = true; reason = '辛号失败因子爆表！'; }
    if (lc.turn && state.turn > lc.turn && !win) { lose = true; reason = '回合数耗尽！'; }
  }

  if (win && !lose) {
    state.phase = 'win';
    events.push({ type: 'win', message: reason || '闯关成功！' });
  } else if (lose) {
    state.phase = 'lose';
    events.push({ type: 'lose', message: reason || '闯关失败！' });
  }
}

app.post('/api/settlement/calculate', (req, res) => {
  try {
    const { levelId, gameState, replay } = req.body;
    const levels = loadLevels();
    const level = levels.find(l => l.id === levelId);
    if (!level) {
      return res.status(404).json({ success: false, error: '关卡不存在' });
    }
    const settlement = calculateSettlement(level, gameState, replay || []);
    res.json({ success: true, data: settlement });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

function calculateSettlement(level, state, replay) {
  const totalCells = state.cells.filter(c => !c.blocked).length;
  const litCells = state.cells.filter(c => c.lit).length;
  const litRatio = litCells / Math.max(1, totalCells);

  const coopSteps = replay.filter(r => r.action?.type === 'coop').length;
  const moveSteps = replay.filter(r => r.action?.type === 'move').length;
  const lightSteps = replay.filter(r => r.action?.type === 'light').length;
  const totalSteps = replay.length;

  const xunranScore = state.xunran * 2;
  const litScore = Math.floor(litRatio * 300);
  const maoScore = state.maoReward * 3;
  const turnBonus = Math.max(0, (level.loseCondition?.turn || 50) - state.turn) * 2;
  const coopBonus = coopSteps * 15;
  const chenPenalty = Math.floor(state.chenRisk * 1.5);
  const xinPenalty = state.xinFailure * 2;

  const baseScore = xunranScore + litScore + maoScore + turnBonus + coopBonus;
  const penalty = chenPenalty + xinPenalty;
  const finalScore = Math.max(0, baseScore - penalty);

  const grade = finalScore >= 500 ? 'S' :
                finalScore >= 400 ? 'A' :
                finalScore >= 300 ? 'B' :
                finalScore >= 200 ? 'C' : 'D';

  let rank = '新手';
  if (finalScore >= 450) rank = '星尘大师';
  else if (finalScore >= 350) rank = '协作达人';
  else if (finalScore >= 250) rank = '合格闯将';

  return {
    success: state.phase === 'win',
    finalScore,
    grade,
    rank,
    details: {
      xunran: state.xunran,
      litCells,
      totalCells,
      litRatio: (litRatio * 100).toFixed(1) + '%',
      chenRisk: state.chenRisk,
      maoReward: state.maoReward,
      xinFailure: state.xinFailure,
      turns: state.turn,
      steps: { total: totalSteps, move: moveSteps, light: lightSteps, coop: coopSteps }
    },
    breakdown: {
      xunranScore,
      litScore,
      maoScore,
      turnBonus,
      coopBonus,
      chenPenalty,
      xinPenalty,
      baseScore,
      penalty
    },
    hiddenAchievements: generateAchievements(state, replay, coopSteps)
  };
}

function generateAchievements(state, replay, coopSteps) {
  const ach = [];
  if (state.xunran >= 90) ach.push({ id: 'perfectionist', name: '完美熏染', desc: '熏染值达到90以上' });
  if (coopSteps >= 3) ach.push({ id: 'coop_king', name: '协作王者', desc: '协作次数达到3次' });
  if (state.chenRisk <= 10) ach.push({ id: 'stealth', name: '潜行专家', desc: '辰号风险低于10' });
  if (state.xinFailure === 0) ach.push({ id: 'pristine', name: '一尘不染', desc: '辛号失败因子保持为0' });
  if (state.dianliang.length >= 20) ach.push({ id: 'illuminator', name: '星尘启明', desc: '点亮格数达到20' });
  return ach;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 星尘棋盘双人机关局 已启动: http://localhost:${PORT}`);
});
