const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3777;
const DATA_FILE = path.join(__dirname, 'replay-data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const LEVELS = {
  chen: {
    id: 'chen',
    name: '银盐暗房双人机关局·辰局',
    subtitle: '教学引导局',
    description: '熟悉暗房操作流程，点亮核心痕迹即可通关。',
    initialState: {
      fumigation: 20,
      patrolSlots: 4,
      lightMarks: 0,
      chenRisk: 0,
      maoReward: 0,
      xinFailFactor: 0,
      turn: 0
    },
    winCondition: (s) => s.lightMarks >= 5 && s.fumigation >= 60,
    loseCondition: (s) => s.chenRisk >= 100,
    map: [
      { id: 'A1', type: 'fumigate', name: '显影槽', desc: '操作可提升熏染值+15，需2人协作' },
      { id: 'A2', type: 'light', name: '红光灯', desc: '点亮痕迹+1，单人可操作' },
      { id: 'B1', type: 'fumigate', name: '定影池', desc: '熏染值+10，单人可操作' },
      { id: 'B2', type: 'risk', name: '巡测通道', desc: '触发辰号风险+20，需规避' },
      { id: 'C1', type: 'light', name: '放大机', desc: '点亮痕迹+2，需2人协作' },
      { id: 'C2', type: 'safe', name: '安全柜', desc: '辰号风险-15，单人可操作' }
    ],
    events: [
      { id: 'e1', trigger: 'turn3', text: '暗房通风系统启动，熏染值-5', effect: (s) => ({ ...s, fumigation: Math.max(0, s.fumigation - 5) }) },
      { id: 'e2', trigger: 'marks2', text: '第一张底片显影成功！获得提示', effect: (s) => s },
      { id: 'e3', trigger: 'risk50', text: '警报！巡测槽即将锁定', effect: (s) => s }
    ]
  },
  mao: {
    id: 'mao',
    name: '银盐暗房双人机关局·卯局',
    subtitle: '资源短缺局',
    description: '显影药剂不足，必须精打细算，卯号奖励是关键。',
    initialState: {
      fumigation: 10,
      patrolSlots: 2,
      lightMarks: 0,
      chenRisk: 0,
      maoReward: 0,
      xinFailFactor: 0,
      turn: 0
    },
    winCondition: (s) => s.lightMarks >= 6 && s.fumigation >= 50 && s.maoReward >= 3,
    loseCondition: (s) => s.fumigation <= 0 || s.turn > 20,
    map: [
      { id: 'A1', type: 'fumigate', name: '稀释显影液', desc: '熏染值+8，消耗1卯号奖励' },
      { id: 'A2', type: 'light', name: '接触印相', desc: '点亮痕迹+1，单人' },
      { id: 'B1', type: 'reward', name: '药剂柜', desc: '卯号奖励+1，需2人' },
      { id: 'B2', type: 'light', name: '对焦屏', desc: '点亮痕迹+1，消耗熏染值-3' },
      { id: 'C1', type: 'reward', name: '急救箱', desc: '卯号奖励+2，熏染值-5' },
      { id: 'C2', type: 'fumigate', name: '浓缩液', desc: '熏染值+20，消耗2卯号奖励' }
    ],
    events: [
      { id: 'm1', trigger: 'turn5', text: '药剂挥发！熏染值-10', effect: (s) => ({ ...s, fumigation: Math.max(0, s.fumigation - 10) }) },
      { id: 'm2', trigger: 'reward1', text: '找到备用药剂！', effect: (s) => s },
      { id: 'm3', trigger: 'turn10', text: '时间紧迫，巡测槽短暂+1', effect: (s) => ({ ...s, patrolSlots: s.patrolSlots + 1 }) }
    ]
  },
  xin: {
    id: 'xin',
    name: '银盐暗房双人机关局·辛局',
    subtitle: '隐藏条件局',
    description: '失败因子持续累积，必须触发隐藏条件才能逆转。',
    initialState: {
      fumigation: 30,
      patrolSlots: 3,
      lightMarks: 0,
      chenRisk: 0,
      maoReward: 0,
      xinFailFactor: 0,
      hiddenTriggered: false,
      turn: 0
    },
    winCondition: (s) => s.lightMarks >= 7 && s.fumigation >= 70 && s.hiddenTriggered === true,
    loseCondition: (s) => s.xinFailFactor >= 100,
    map: [
      { id: 'A1', type: 'fumigate', name: '主显影槽', desc: '熏染值+12，失败因子+5' },
      { id: 'A2', type: 'light', name: '暗室灯', desc: '点亮痕迹+1，失败因子+3' },
      { id: 'B1', type: 'hidden', name: '神秘底片', desc: '隐藏条件！需按顺序A2→B1→C2触发' },
      { id: 'B2', type: 'suppress', name: '稳定剂', desc: '失败因子-10，单人' },
      { id: 'C1', type: 'light', name: '投影器', desc: '点亮痕迹+2，失败因子+8' },
      { id: 'C2', type: 'hidden', name: '密码箱', desc: '隐藏关键节点，失败因子-15' }
    ],
    events: [
      { id: 'x1', trigger: 'turn2', text: '辛号因子开始累积...每回合+3', effect: (s) => s },
      { id: 'x2', trigger: 'fail30', text: '警告：失败因子逼近临界值', effect: (s) => s },
      { id: 'x3', trigger: 'hidden', text: '隐藏条件触发！失败因子清零，熏染值+25', effect: (s) => ({ ...s, xinFailFactor: 0, fumigation: s.fumigation + 25, hiddenTriggered: true }) }
    ]
  }
};

function loadReplays() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

function saveReplays(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function computeSettlement(levelId, replay) {
  const level = LEVELS[levelId];
  if (!level) return null;
  let state = JSON.parse(JSON.stringify(level.initialState));
  const steps = [];
  const hiddenSeq = [];
  const firedEvents = new Set();
  for (const action of replay.actions) {
    state.turn = (state.turn || 0) + 1;
    const cell = level.map.find(c => c.id === action.cellId);
    if (cell) {
      const coop = action.players === 2;
      switch (cell.type) {
        case 'fumigate':
          if (levelId === 'mao' && cell.id === 'A1') {
            if (state.maoReward >= 1) {
              state.maoReward -= 1;
              state.fumigation += 8;
              steps.push({ turn: state.turn, action: `${cell.name} 协作:${coop}`, fumigation: state.fumigation });
            }
          } else if (levelId === 'mao' && cell.id === 'C2') {
            if (state.maoReward >= 2) {
              state.maoReward -= 2;
              state.fumigation += 20;
              steps.push({ turn: state.turn, action: cell.name, fumigation: state.fumigation });
            }
          } else {
            state.fumigation += coop ? 18 : (cell.id === 'B1' ? 10 : 12);
            steps.push({ turn: state.turn, action: cell.name, fumigation: state.fumigation });
          }
          if (levelId === 'xin') state.xinFailFactor += 5;
          break;
        case 'light':
          state.lightMarks += coop ? (cell.id === 'C1' ? 3 : 2) : 1;
          if (levelId === 'mao' && cell.id === 'B2') state.fumigation = Math.max(0, state.fumigation - 3);
          if (levelId === 'xin') state.xinFailFactor += cell.id === 'C1' ? 8 : 3;
          if (levelId === 'xin') hiddenSeq.push(cell.id);
          steps.push({ turn: state.turn, action: cell.name, lightMarks: state.lightMarks });
          break;
        case 'risk':
          state.chenRisk += 20;
          steps.push({ turn: state.turn, action: cell.name, chenRisk: state.chenRisk });
          break;
        case 'safe':
          state.chenRisk = Math.max(0, state.chenRisk - 15);
          steps.push({ turn: state.turn, action: cell.name, chenRisk: state.chenRisk });
          break;
        case 'reward':
          state.maoReward += cell.id === 'C1' ? 2 : 1;
          if (cell.id === 'C1') state.fumigation = Math.max(0, state.fumigation - 5);
          steps.push({ turn: state.turn, action: cell.name, maoReward: state.maoReward });
          break;
        case 'suppress':
          state.xinFailFactor = Math.max(0, state.xinFailFactor - 10);
          steps.push({ turn: state.turn, action: cell.name, xinFailFactor: state.xinFailFactor });
          break;
        case 'hidden':
          if (levelId === 'xin') {
            hiddenSeq.push(cell.id);
            if (cell.id === 'C2') state.xinFailFactor = Math.max(0, state.xinFailFactor - 15);
            const targetSeq = ['A2', 'B1', 'C2'];
            const slice = hiddenSeq.slice(-3);
            if (slice.length === 3 && slice.every((v, i) => v === targetSeq[i])) {
              state.xinFailFactor = 0;
              state.fumigation += 25;
              state.hiddenTriggered = true;
              steps.push({ turn: state.turn, action: '★ 隐藏条件触发！', hidden: true });
            } else {
              steps.push({ turn: state.turn, action: cell.name });
            }
          }
          break;
      }
    }
    if (levelId === 'xin' && state.turn >= 2) {
      state.xinFailFactor += 3;
    }
    for (const ev of level.events) {
      if (firedEvents.has(ev.id)) continue;
      let match = false;
      if (ev.trigger === `turn${state.turn}`) {
        match = true;
      } else if (ev.trigger === 'risk50' && state.chenRisk >= 50) {
        match = true;
      } else if (ev.trigger === 'fail30' && state.xinFailFactor >= 30) {
        match = true;
      } else if (ev.trigger === 'marks2' && state.lightMarks >= 2) {
        match = true;
      } else if (ev.trigger === 'reward1' && state.maoReward >= 1) {
        match = true;
      }
      if (match) {
        firedEvents.add(ev.id);
        state = ev.effect(state) || state;
        steps.push({ turn: state.turn, event: ev.text });
      }
    }
  }
  const won = level.winCondition(state);
  const lost = level.loseCondition(state);
  const coopSteps = replay.actions.filter(a => a.players === 2).length;
  const score = Math.floor(
    state.fumigation * 2 +
    state.lightMarks * 15 +
    state.maoReward * 10 +
    coopSteps * 20 -
    state.chenRisk * 0.5 -
    state.xinFailFactor * 0.8
  );
  return {
    levelId,
    levelName: level.name,
    finalState: state,
    steps,
    won,
    lost,
    coopSteps,
    score: Math.max(0, score),
    totalTurns: state.turn
  };
}

app.get('/api/levels', (req, res) => {
  const list = Object.values(LEVELS).map(l => ({
    id: l.id,
    name: l.name,
    subtitle: l.subtitle,
    description: l.description
  }));
  res.json(list);
});

app.get('/api/level/:id', (req, res) => {
  const level = LEVELS[req.params.id];
  if (!level) return res.status(404).json({ error: '局不存在' });
  res.json({
    id: level.id,
    name: level.name,
    subtitle: level.subtitle,
    description: level.description,
    initialState: level.initialState,
    map: level.map
  });
});

app.post('/api/replay/save', (req, res) => {
  const { sessionId, levelId, actions, state } = req.body;
  if (!sessionId || !levelId) return res.status(400).json({ error: '参数缺失' });
  const data = loadReplays();
  data[sessionId] = { levelId, actions, state, savedAt: Date.now() };
  saveReplays(data);
  res.json({ ok: true });
});

app.get('/api/replay/:sessionId', (req, res) => {
  const data = loadReplays();
  const replay = data[req.params.sessionId];
  if (!replay) return res.status(404).json({ error: '回放不存在' });
  res.json(replay);
});

app.post('/api/settle', (req, res) => {
  const { levelId, actions } = req.body;
  const result = computeSettlement(levelId, { actions });
  if (!result) return res.status(400).json({ error: '无法结算' });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`银盐暗房双人机关局 启动: http://localhost:${PORT}`);
});
