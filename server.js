const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SEED_DATA = {
  scenarios: {
    xin: {
      id: 'xin',
      name: '陨铁工坊节拍修复场·辛局',
      subtitle: '时序校准·入门教学',
      description: '节拍器的基础相位发生偏移。跟随指引，学习陨铁工坊的基础操作逻辑。',
      difficulty: '★☆☆',
      icon: '◎',
      maxSteps: 12,
      initialState: {
        rewriteValue: 48,
        convertSlots: 3,
        peelMarks: 0,
        xinRisk: 15,
        shenReward: 5,
        wuFailFactor: 2,
        beatPhase: 0.72,
        integrity: 100,
        tension: 30
      },
      winCondition: {
        type: 'phase_range',
        description: '将节拍相位校准至 [0.48, 0.52] 区间，并保持完整度≥70',
        check: (s) => s.beatPhase >= 0.48 && s.beatPhase <= 0.52 && s.integrity >= 70
      },
      failCondition: {
        type: 'risk_or_peel',
        description: '辛号风险≥80 或 剥离痕≥5 或 完整度≤0',
        check: (s) => s.xinRisk >= 80 || s.peelMarks >= 5 || s.integrity <= 0
      },
      eventPool: [
        { id: 'xin_e1', name: '相位锤轻敲', cost: 0, effect: { beatPhase: -0.08, rewriteValue: -2 }, tags: ['校准', '低损'], flavor: '陨铁锤面凝着霜蓝色微光。' },
        { id: 'xin_e2', name: '折算槽预热', cost: 1, effect: { convertSlots: 1, shenReward: 2 }, tags: ['准备'], flavor: '槽位中的陨铁碎屑开始共鸣。' },
        { id: 'xin_e3', name: '辛号吹扫', cost: 0, effect: { xinRisk: -12, peelMarks: 1 }, tags: ['降风险'], flavor: '高压氮气卷走表面的氧化层。' },
        { id: 'xin_e4', name: '复写值校准', cost: 1, effect: { rewriteValue: 8, beatPhase: 0.03 }, tags: ['增益'], flavor: '在金属表面重新刻写时序回路。' },
        { id: 'xin_e5', name: '完整度焊接', cost: 2, effect: { integrity: 25, xinRisk: 5 }, tags: ['修复'], flavor: '焊锡流淌处呈现淡金色纹路。' },
        { id: 'xin_e6', name: '节拍同步脉冲', cost: 1, effect: { beatPhase: -0.05, tension: -10, xinRisk: 3 }, tags: ['校准', '关键'], flavor: '整个工坊随脉冲轻轻震颤。' }
      ],
      tutorial: [
        '【辛局·教学1】选择"相位锤轻敲"可快速降低相位值。',
        '【辛局·教学2】折算槽是资源，消耗"槽"可使用强力操作。',
        '【辛局·教学3】注意剥离痕——超过5道将触发工坊安全锁定。',
        '【辛局·教学4】最终目标：将相位稳定在0.50附近。'
      ],
      map: {
        type: 'beat-calibrator',
        name: '节拍校准台',
        background: '#0a1628',
        accentColor: '#6ea8ff',
        center: { x: 300, y: 200, label: '中央节拍器' },
        nodes: [
          { id: 'n1', x: 300, y: 60, label: '北·校准点', role: 'calibrator' },
          { id: 'n2', x: 428, y: 100, label: '东北·焊接点', role: 'welder' },
          { id: 'n3', x: 440, y: 230, label: '东·吹扫点', role: 'purge' },
          { id: 'n4', x: 370, y: 330, label: '东南·槽位', role: 'slot' },
          { id: 'n5', x: 230, y: 330, label: '西南·槽位', role: 'slot' },
          { id: 'n6', x: 160, y: 230, label: '西·复写点', role: 'rewrite' },
          { id: 'n7', x: 172, y: 100, label: '西北·脉冲点', role: 'pulse' },
          { id: 'n8', x: 300, y: 155, label: '中心指针', role: 'phase' }
        ],
        edges: [
          { from: 'n1', to: 'n8' }, { from: 'n2', to: 'n8' },
          { from: 'n3', to: 'n8' }, { from: 'n4', to: 'n8' },
          { from: 'n5', to: 'n8' }, { from: 'n6', to: 'n8' },
          { from: 'n7', to: 'n8' }
        ],
        legend: { title: '辛局·节拍校准台', hint: '将中央节拍器指针校准至中心绿区（相位0.50）' }
      },
      hiddenCondition: null
    },
    shen: {
      id: 'shen',
      name: '陨铁工坊节拍修复场·申局',
      subtitle: '资源贫瘠·奖励驱动',
      description: '折算槽初始短缺。必须通过触发申号奖励来获取额外操作空间，步步为营。',
      difficulty: '★★☆',
      icon: '◈',
      maxSteps: 15,
      initialState: {
        rewriteValue: 32,
        convertSlots: 1,
        peelMarks: 1,
        xinRisk: 35,
        shenReward: 0,
        wuFailFactor: 3,
        beatPhase: 0.18,
        integrity: 85,
        tension: 55
      },
      winCondition: {
        type: 'multi',
        description: '相位校准至 [0.48, 0.52]，复写值≥60，完整度≥60',
        check: (s) => s.beatPhase >= 0.48 && s.beatPhase <= 0.52 && s.rewriteValue >= 60 && s.integrity >= 60
      },
      failCondition: {
        type: 'strict',
        description: '辛号风险≥75 或 剥离痕≥4 或 完整度≤0 或 步数耗尽',
        check: (s, steps, maxSteps) => s.xinRisk >= 75 || s.peelMarks >= 4 || s.integrity <= 0 || steps >= maxSteps
      },
      eventPool: [
        { id: 'shen_e1', name: '相位锤重击', cost: 2, effect: { beatPhase: -0.15, rewriteValue: -4, peelMarks: 1 }, tags: ['校准', '高损'], flavor: '这一锤下去，金属发出不甘的嗡鸣。' },
        { id: 'shen_e2', name: '申号能量注入', cost: 0, effect: { shenReward: 4, xinRisk: 8, tension: 15 }, tags: ['奖励', '风险'], flavor: '一道赤红电光缠绕在工件上。' },
        { id: 'shen_e3', name: '奖励兑换槽位', cost: 0, effect: { convertSlots: 2, shenReward: -5 }, tags: ['兑换'], flavor: '申号奖励结晶化为可用槽位。', require: { shenReward: 5 } },
        { id: 'shen_e4', name: '复写值深刻', cost: 3, effect: { rewriteValue: 20, beatPhase: 0.06, integrity: -10 }, tags: ['增益', '强'], flavor: '刻刀深陷入陨铁晶格内部。' },
        { id: 'shen_e5', name: '纳米修复雾', cost: 2, effect: { integrity: 18, peelMarks: -1, xinRisk: -5 }, tags: ['修复'], flavor: '淡紫色雾气浸润每一道裂痕。' },
        { id: 'shen_e6', name: '张力释放', cost: 1, effect: { tension: -20, xinRisk: 6 }, tags: ['稳定'], flavor: '叮——蓄积的张力化作清脆的响声。' },
        { id: 'shen_e7', name: '相位反向推进', cost: 1, effect: { beatPhase: 0.08, rewriteValue: 3 }, tags: ['反向校准'], flavor: '通过反冲力将相位推向目标值。' }
      ],
      tutorial: null,
      map: {
        type: 'resource-mine',
        name: '贫瘠矿道',
        background: '#14110a',
        accentColor: '#4ed6a3',
        center: { x: 300, y: 200, label: '矿道中枢' },
        nodes: [
          { id: 'm1', x: 80, y: 120, label: '入口·能量注入', role: 'inject' },
          { id: 'm2', x: 195, y: 80, label: 'A区·奖励矿脉', role: 'reward' },
          { id: 'm3', x: 320, y: 130, label: 'B区·兑换站', role: 'exchange' },
          { id: 'm4', x: 460, y: 200, label: 'C区·深刻站', role: 'deep' },
          { id: 'm5', x: 370, y: 300, label: 'D区·纳米修复雾', role: 'repair' },
          { id: 'm6', x: 200, y: 320, label: 'E区·张力释放', role: 'release' },
          { id: 'm7', x: 80, y: 290, label: '出口·反向推进', role: 'reverse' }
        ],
        edges: [
          { from: 'm1', to: 'm2' }, { from: 'm2', to: 'm3' },
          { from: 'm3', to: 'm4' }, { from: 'm4', to: 'm5' },
          { from: 'm5', to: 'm6' }, { from: 'm6', to: 'm7' },
          { from: 'm1', to: 'm7' }
        ],
        legend: { title: '申局·贫瘠矿道', hint: '奖励矿脉稀少，必须在A区注入→B区兑换的循环中求生' }
      },
      hiddenCondition: null
    },
    wu: {
      id: 'wu',
      name: '陨铁工坊节拍修复场·戊局',
      subtitle: '隐藏条件·深渊修复',
      description: '戊号失败因子处于异常活跃状态。据说当特定操作序列被触发时，会解锁真正的结局。',
      difficulty: '★★★',
      icon: '✦',
      maxSteps: 18,
      initialState: {
        rewriteValue: 20,
        convertSlots: 4,
        peelMarks: 2,
        xinRisk: 50,
        shenReward: 3,
        wuFailFactor: 7,
        beatPhase: 0.90,
        integrity: 70,
        tension: 70
      },
      winCondition: {
        type: 'hidden',
        description: '【表】相位校准至 [0.48, 0.52]，复写值≥70，完整度≥50，剥离痕≤3',
        check: (s) => s.beatPhase >= 0.48 && s.beatPhase <= 0.52 && s.rewriteValue >= 70 && s.integrity >= 50 && s.peelMarks <= 3
      },
      failCondition: {
        type: 'wu_trigger',
        description: '戊号失败因子累积触发：(辛号风险+剥离痕×10+张力) × wuFailFactor ≥ 900',
        check: (s) => (s.xinRisk + s.peelMarks * 10 + s.tension) * s.wuFailFactor >= 900 || s.integrity <= 0
      },
      eventPool: [
        { id: 'wu_e1', name: '深渊相位锤', cost: 2, effect: { beatPhase: -0.18, rewriteValue: -3, wuFailFactor: 1 }, tags: ['校准', '深渊'], flavor: '锤面倒映出不存在的星空。' },
        { id: 'wu_e2', name: '戊号因子抑制', cost: 3, effect: { wuFailFactor: -2, integrity: -5, tension: 10 }, tags: ['关键', '抑制'], flavor: '向核心注入稳定剂，代价是结构损伤。' },
        { id: 'wu_e3', name: '辛号风险对冲', cost: 1, effect: { xinRisk: -18, peelMarks: 2 }, tags: ['高风险操作'], flavor: '用新的损伤覆盖旧的风险。' },
        { id: 'wu_e4', name: '陨铁晶格复写', cost: 4, effect: { rewriteValue: 28, beatPhase: -0.04, integrity: -8 }, tags: ['核心增益'], flavor: '一笔一划，重塑陨铁的时序记忆。' },
        { id: 'wu_e5', name: '双槽深度修复', cost: 2, effect: { integrity: 30, peelMarks: -2, tension: -15 }, tags: ['修复', '强'], flavor: '两道焊弧同时启动，织就金红交织的网。' },
        { id: 'wu_e6', name: '【隐藏】时序回溯·改', cost: 5, effect: { beatPhase: -0.12, rewriteValue: 15, wuFailFactor: -3, integrity: 10 }, tags: ['隐藏', '终局'], flavor: '传说中的改命工序。只有资源充足者可使用。', require: { convertSlots: 5, shenReward: 6 }, hidden: true },
        { id: 'wu_e7', name: '申号爆发注入', cost: 0, effect: { shenReward: 6, xinRisk: 15, tension: 20 }, tags: ['奖励'], flavor: '冒着爆炸风险，一口气注入大量奖励。' },
        { id: 'wu_e8', name: '低功耗微校准', cost: 0, effect: { beatPhase: -0.03, rewriteValue: 1, xinRisk: 2 }, tags: ['微操作'], flavor: '用指尖的温度微调陨铁的频率。' },
        { id: 'wu_e9', name: '奖励聚转化', cost: 0, effect: { convertSlots: 3, shenReward: -7 }, tags: ['兑换'], flavor: '将申号奖励凝聚为折算槽。', require: { shenReward: 7 } }
      ],
      tutorial: null,
      map: {
        type: 'abyss-forge',
        name: '深渊熔炉',
        background: '#140a1a',
        accentColor: '#c85cff',
        center: { x: 300, y: 200, label: '深渊核心' },
        nodes: [
          { id: 'f1', x: 300, y: 70, label: '上·深渊相位锤', role: 'abyss' },
          { id: 'f2', x: 440, y: 130, label: '右上·申号爆发', role: 'burst' },
          { id: 'f3', x: 440, y: 270, label: '右下·晶格复写', role: 'lattice' },
          { id: 'f4', x: 300, y: 330, label: '下·双槽深度修复', role: 'dual-repair' },
          { id: 'f5', x: 160, y: 270, label: '左下·因子抑制', role: 'suppress' },
          { id: 'f6', x: 160, y: 130, label: '左上·风险对冲', role: 'hedge' },
          { id: 'f7', x: 300, y: 200, label: '★时序回溯·改', role: 'hidden-core' }
        ],
        edges: [
          { from: 'f1', to: 'f2' }, { from: 'f2', to: 'f3' },
          { from: 'f3', to: 'f4' }, { from: 'f4', to: 'f5' },
          { from: 'f5', to: 'f6' }, { from: 'f6', to: 'f1' },
          { from: 'f1', to: 'f4' }, { from: 'f2', to: 'f5' },
          { from: 'f3', to: 'f6' }
        ],
        legend: { title: '戊局·深渊熔炉', hint: '点亮外围六符文后，中心【时序回溯·改】将可激活（需折算槽≥5 + 申号奖励≥6）' }
      },
      hiddenCondition: {
        description: '【里·隐藏】使用"时序回溯·改"，并最终达成表胜利条件 → 解锁【金色陨铁结局】',
        unlockKey: 'used_wu_e6',
        endingName: '金色陨铁结局'
      }
    }
  }
};

const replayStore = {};
const activeSessions = {};

function generateId() {
  return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function applyEvent(state, event) {
  const newState = { ...state };
  for (const [key, value] of Object.entries(event.effect)) {
    if (typeof newState[key] === 'number') {
      newState[key] = +(newState[key] + value).toFixed(4);
    }
  }
  newState.beatPhase = Math.max(0, Math.min(1, newState.beatPhase));
  newState.integrity = Math.max(0, Math.min(100, newState.integrity));
  newState.peelMarks = Math.max(0, newState.peelMarks);
  newState.convertSlots = Math.max(0, newState.convertSlots);
  newState.xinRisk = Math.max(0, Math.min(100, newState.xinRisk));
  newState.tension = Math.max(0, Math.min(100, newState.tension));
  newState.shenReward = Math.max(0, newState.shenReward);
  newState.wuFailFactor = Math.max(1, newState.wuFailFactor);
  newState.rewriteValue = Math.max(0, newState.rewriteValue);
  return newState;
}

function checkRequirements(state, event) {
  if (!event.require) return true;
  for (const [key, value] of Object.entries(event.require)) {
    if ((state[key] || 0) < value) return false;
  }
  return true;
}

function calcSettlement(scenario, steps, finalState) {
  let baseScore = 0;
  const win = scenario.winCondition.check(finalState);
  const fail = scenario.failCondition.check(finalState, steps.length, scenario.maxSteps);

  if (win) baseScore += 1000;
  baseScore += finalState.rewriteValue * 8;
  baseScore += finalState.integrity * 5;
  baseScore += finalState.shenReward * 12;
  baseScore -= finalState.xinRisk * 4;
  baseScore -= finalState.peelMarks * 20;
  baseScore -= finalState.wuFailFactor * 15;
  baseScore -= steps.length * 6;

  if (scenario.id === 'wu' && scenario.hiddenCondition) {
    const usedHidden = steps.some(s => s.eventId === 'wu_e6');
    if (usedHidden && win) {
      baseScore += 5000;
      return {
        win: true,
        fail: false,
        hiddenUnlocked: true,
        endingName: scenario.hiddenCondition.endingName,
        score: Math.max(0, Math.floor(baseScore)),
        rank: baseScore >= 6000 ? 'S+' : baseScore >= 5000 ? 'S' : 'A',
        breakdown: {
          base: win ? 1000 : 0,
          rewriteValue: finalState.rewriteValue * 8,
          integrity: finalState.integrity * 5,
          shenReward: finalState.shenReward * 12,
          xinRisk: -finalState.xinRisk * 4,
          peelMarks: -finalState.peelMarks * 20,
          wuFailFactor: -finalState.wuFailFactor * 15,
          stepPenalty: -steps.length * 6,
          hiddenBonus: 5000
        }
      };
    }
  }

  let rank = 'D';
  if (win) {
    if (baseScore >= 1500) rank = 'S';
    else if (baseScore >= 1200) rank = 'A';
    else if (baseScore >= 900) rank = 'B';
    else rank = 'C';
  } else if (fail) {
    rank = 'F';
  }

  return {
    win,
    fail,
    hiddenUnlocked: false,
    endingName: null,
    score: Math.max(0, Math.floor(baseScore)),
    rank,
    breakdown: {
      base: win ? 1000 : 0,
      rewriteValue: finalState.rewriteValue * 8,
      integrity: finalState.integrity * 5,
      shenReward: finalState.shenReward * 12,
      xinRisk: -finalState.xinRisk * 4,
      peelMarks: -finalState.peelMarks * 20,
      wuFailFactor: -finalState.wuFailFactor * 15,
      stepPenalty: -steps.length * 6
    }
  };
}

app.get('/api/scenarios', (req, res) => {
  const list = Object.values(SEED_DATA.scenarios).map(s => ({
    id: s.id,
    name: s.name,
    subtitle: s.subtitle,
    description: s.description,
    difficulty: s.difficulty,
    icon: s.icon,
    maxSteps: s.maxSteps
  }));
  res.json({ scenarios: list });
});

app.get('/api/scenario/:id', (req, res) => {
  const sc = SEED_DATA.scenarios[req.params.id];
  if (!sc) return res.status(404).json({ error: '局不存在' });
  const events = sc.eventPool.map(e => ({
    id: e.id, name: e.name, cost: e.cost, tags: e.tags, flavor: e.flavor,
    effect: e.effect, require: e.require || null, hidden: e.hidden || false
  }));
  res.json({
    scenario: {
      id: sc.id, name: sc.name, subtitle: sc.subtitle, description: sc.description,
      difficulty: sc.difficulty, icon: sc.icon, maxSteps: sc.maxSteps,
      winCondition: { type: sc.winCondition.type, description: sc.winCondition.description },
      failCondition: { type: sc.failCondition.type, description: sc.failCondition.description },
      tutorial: sc.tutorial,
      hiddenCondition: sc.hiddenCondition ? { description: sc.hiddenCondition.description } : null,
      map: sc.map
    },
    initialState: sc.initialState,
    eventPool: events
  });
});

app.post('/api/step/check', (req, res) => {
  const { scenarioId, currentState, eventId } = req.body;
  const sc = SEED_DATA.scenarios[scenarioId];
  if (!sc) return res.status(404).json({ error: '局不存在' });
  const event = sc.eventPool.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: '事件不存在' });

  if (event.cost > currentState.convertSlots) {
    return res.json({ valid: false, reason: '折算槽不足' });
  }
  if (!checkRequirements(currentState, event)) {
    return res.json({ valid: false, reason: '前置条件不满足' });
  }

  const afterCost = { ...currentState, convertSlots: currentState.convertSlots - event.cost };
  const nextState = applyEvent(afterCost, event);
  res.json({ valid: true, event, nextState });
});

app.post('/api/replay/save', (req, res) => {
  const { scenarioId, initialState, steps, finalState, sessionId } = req.body;
  const sc = SEED_DATA.scenarios[scenarioId];
  if (!sc) return res.status(404).json({ error: '局不存在' });

  const id = sessionId && replayStore[sessionId] ? sessionId : generateId();
  const settlement = calcSettlement(sc, steps, finalState);

  replayStore[id] = {
    id,
    scenarioId,
    initialState,
    steps,
    finalState,
    settlement,
    savedAt: Date.now()
  };
  res.json({ replayId: id, settlement });
});

app.get('/api/replay/:id', (req, res) => {
  const r = replayStore[req.params.id];
  if (!r) return res.status(404).json({ error: '回放不存在' });
  res.json(r);
});

app.post('/api/settle/recalc', (req, res) => {
  const { scenarioId, steps, initialState } = req.body;
  const sc = SEED_DATA.scenarios[scenarioId];
  if (!sc) return res.status(404).json({ error: '局不存在' });

  let state = { ...initialState };
  const replayed = [];
  for (const step of steps) {
    const event = sc.eventPool.find(e => e.id === step.eventId);
    if (!event) continue;
    if (event.cost > state.convertSlots) break;
    state = { ...state, convertSlots: state.convertSlots - event.cost };
    state = applyEvent(state, event);
    replayed.push({ step: step.step, eventId: event.id, stateAfter: { ...state } });
  }

  const settlement = calcSettlement(sc, replayed, state);
  res.json({ finalState: state, replayedSteps: replayed, settlement });
});

app.post('/api/session', (req, res) => {
  const { scenarioId, replayId } = req.body;
  if (replayId && replayStore[replayId]) {
    const r = replayStore[replayId];
    return res.json({
      sessionId: replayId,
      scenarioId: r.scenarioId,
      initialState: r.initialState,
      steps: r.steps,
      finalState: r.finalState,
      resumed: true
    });
  }
  const sc = SEED_DATA.scenarios[scenarioId];
  if (!sc) return res.status(404).json({ error: '局不存在' });
  const sid = generateId();
  activeSessions[sid] = { scenarioId, startedAt: Date.now() };
  res.json({
    sessionId: sid,
    scenarioId,
    initialState: sc.initialState,
    steps: [],
    finalState: sc.initialState,
    resumed: false
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  陨铁工坊节拍修复场 已启动                   ║`);
  console.log(`║  访问地址: http://localhost:${PORT}             ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
});
