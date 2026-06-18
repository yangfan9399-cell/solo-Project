const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const GAME_SCENARIOS = {
  yi: {
    id: 'yi',
    name: '乙局·教学指引',
    description: '盐湖气球升空初期，资源充足，按指引完成教学演练。掌握封存、复写、转译三大操作。',
    difficulty: '教学',
    map: {
      nodes: [
        { id: 'A', x: 80, y: 120, name: '盐湖主站', type: 'source', capacity: 500 },
        { id: 'B', x: 220, y: 60, name: '观测塔', type: 'relay', capacity: 200 },
        { id: 'C', x: 220, y: 200, name: '采集舱', type: 'relay', capacity: 250 },
        { id: 'D', x: 380, y: 120, name: '气球群', type: 'target', capacity: 300 }
      ],
      edges: [
        { from: 'A', to: 'B', cost: 10, maxFlow: 80 },
        { from: 'A', to: 'C', cost: 15, maxFlow: 100 },
        { from: 'B', to: 'D', cost: 8, maxFlow: 60 },
        { from: 'C', to: 'D', cost: 12, maxFlow: 90 },
        { from: 'B', to: 'C', cost: 5, maxFlow: 40 }
      ]
    },
    initialState: {
      sealedValue: 100,
      rewriteSlots: 5,
      traceMarks: 0,
      yiRisk: 0,
      renReward: 0,
      ziFailFactor: 0,
      resources: { energy: 300, gas: 250, signal: 150 }
    },
    winFormula: (s) => s.sealedValue >= 280 && s.renReward >= 60 && s.yiRisk <= 40,
    lossFormula: (s) => s.sealedValue <= 0 || s.ziFailFactor >= 100 || s.rewriteSlots < 0,
    events: [
      { id: 'yi_e1', round: 1, type: 'guide', title: '封存指引', desc: '点击节点可将资源封存，提升封存值。尝试封存盐湖主站！', effect: null },
      { id: 'yi_e2', round: 2, type: 'reward', title: '初始奖励', desc: '盐湖气球释放首波能量！', effect: { renReward: 20, sealedValue: 15 } },
      { id: 'yi_e3', round: 3, type: 'guide', title: '复写槽使用', desc: '使用复写槽可改写节点容量。消耗1复写槽强化气球群！', effect: null },
      { id: 'yi_e4', round: 4, type: 'risk', title: '小股乱流', desc: '高空气流扰动，乙号风险上升。', effect: { yiRisk: 15 } },
      { id: 'yi_e5', round: 5, type: 'reward', title: '观测成功', desc: '观测塔捕捉到关键信号！', effect: { renReward: 30, sealedValue: 30 } },
      { id: 'yi_e6', round: 6, type: 'bonus', title: '教学通关奖励', desc: '完成教学目标可获得额外封存值。', effect: { sealedValue: 50, renReward: 25 } }
    ],
    rounds: 8,
    targetSealedValue: 280,
    targetRenReward: 60,
    maxYiRisk: 40
  },

  ren: {
    id: 'ren',
    name: '壬局·资源短缺',
    description: '盐湖气球长途奔袭，物资匮乏。必须精打细算，每一份资源都要用在刀刃上。',
    difficulty: '困难',
    map: {
      nodes: [
        { id: 'A', x: 60, y: 140, name: '荒原补给', type: 'source', capacity: 200 },
        { id: 'B', x: 160, y: 70, name: '风蚀崖', type: 'relay', capacity: 100 },
        { id: 'C', x: 160, y: 210, name: '盐碱滩', type: 'relay', capacity: 120 },
        { id: 'D', x: 280, y: 100, name: '中转浮标', type: 'relay', capacity: 90 },
        { id: 'E', x: 280, y: 180, name: '沙暴眼', type: 'hazard', capacity: 80 },
        { id: 'F', x: 400, y: 140, name: '远空气球', type: 'target', capacity: 250 }
      ],
      edges: [
        { from: 'A', to: 'B', cost: 20, maxFlow: 40 },
        { from: 'A', to: 'C', cost: 18, maxFlow: 50 },
        { from: 'B', to: 'D', cost: 12, maxFlow: 35 },
        { from: 'C', to: 'E', cost: 10, maxFlow: 40 },
        { from: 'C', to: 'D', cost: 22, maxFlow: 30 },
        { from: 'D', to: 'F', cost: 15, maxFlow: 45 },
        { from: 'E', to: 'F', cost: 25, maxFlow: 35 }
      ]
    },
    initialState: {
      sealedValue: 60,
      rewriteSlots: 2,
      traceMarks: 0,
      yiRisk: 20,
      renReward: 10,
      ziFailFactor: 5,
      resources: { energy: 120, gas: 100, signal: 60 }
    },
    winFormula: (s) => s.sealedValue >= 200 && s.renReward >= 80 && s.resources.energy >= 20,
    lossFormula: (s) => s.sealedValue <= 0 || s.ziFailFactor >= 100 || s.resources.energy <= 0,
    events: [
      { id: 'ren_e1', round: 1, type: 'warn', title: '物资告急', desc: '能量储备不足，谨慎分配！', effect: null },
      { id: 'ren_e2', round: 2, type: 'risk', title: '补给线中断', desc: '荒原补给能力下降，乙号风险上升。', effect: { yiRisk: 20, resources: { energy: -20 } } },
      { id: 'ren_e3', round: 3, type: 'choice', title: '岔路抉择', desc: '沙暴眼或中转浮标？选择沙暴眼将获得额外奖励但提升失败因子。', effect: null },
      { id: 'ren_e4', round: 4, type: 'reward', title: '逆风加速', desc: '巧用风力，节省资源！', effect: { resources: { energy: 30, gas: 20 } } },
      { id: 'ren_e5', round: 5, type: 'risk', title: '沙尘侵袭', desc: '气球外壳受损，封存值下降。', effect: { sealedValue: -25, ziFailFactor: 10 } },
      { id: 'ren_e6', round: 6, type: 'reward', title: '紧急空投', desc: '友军支援到达！', effect: { rewriteSlots: 1, resources: { signal: 30 } } },
      { id: 'ren_e7', round: 7, type: 'hazard', title: '最后风暴', desc: '抵达前的考验！', effect: { yiRisk: 25, sealedValue: -15 } }
    ],
    rounds: 9,
    targetSealedValue: 200,
    targetRenReward: 80,
    maxYiRisk: 80
  },

  zi: {
    id: 'zi',
    name: '子局·隐藏条件',
    description: '神秘数据信号浮现。满足隐藏条件可触发真结局，否则普通结局也算通关。',
    difficulty: '谜团',
    map: {
      nodes: [
        { id: 'A', x: 60, y: 140, name: '信号源', type: 'source', capacity: 300 },
        { id: 'B', x: 160, y: 60, name: '棱镜阵', type: 'special', capacity: 150, hidden: true },
        { id: 'C', x: 160, y: 220, name: '回响塔', type: 'special', capacity: 150, hidden: true },
        { id: 'D', x: 260, y: 140, name: '交汇点', type: 'relay', capacity: 200 },
        { id: 'E', x: 360, y: 80, name: '虚数门', type: 'secret', capacity: 100, hidden: true },
        { id: 'F', x: 360, y: 200, name: '归航标', type: 'target', capacity: 300 }
      ],
      edges: [
        { from: 'A', to: 'B', cost: 10, maxFlow: 60 },
        { from: 'A', to: 'C', cost: 10, maxFlow: 60 },
        { from: 'B', to: 'D', cost: 12, maxFlow: 50 },
        { from: 'C', to: 'D', cost: 12, maxFlow: 50 },
        { from: 'B', to: 'E', cost: 30, maxFlow: 25, hidden: true },
        { from: 'C', to: 'E', cost: 30, maxFlow: 25, hidden: true },
        { from: 'D', to: 'F', cost: 8, maxFlow: 80 },
        { from: 'E', to: 'F', cost: 5, maxFlow: 60, hidden: true }
      ]
    },
    initialState: {
      sealedValue: 80,
      rewriteSlots: 4,
      traceMarks: 0,
      yiRisk: 10,
      renReward: 0,
      ziFailFactor: 0,
      resources: { energy: 200, gas: 180, signal: 200 },
      hiddenUnlocked: false,
      prismActivated: false,
      echoActivated: false
    },
    winFormula: (s) => s.sealedValue >= 250 && s.renReward >= 50 && s.ziFailFactor < 80,
    lossFormula: (s) => s.sealedValue <= 0 || s.ziFailFactor >= 100,
    events: [
      { id: 'zi_e1', round: 1, type: 'mystery', title: '双生信号', desc: '棱镜阵与回响塔同时发出脉冲...', effect: null },
      { id: 'zi_e2', round: 2, type: 'hint', title: '棱镜共鸣', desc: '若棱镜阵封存值达到80，虚数门将显现。', effect: null },
      { id: 'zi_e3', round: 3, type: 'risk', title: '频率干扰', desc: '信号冲突，乙号风险上升。', effect: { yiRisk: 15, resources: { signal: -20 } } },
      { id: 'zi_e4', round: 4, type: 'hint', title: '回响定理', desc: '回响塔同样需要封存值80。两路同时达成可解锁捷径。', effect: null },
      { id: 'zi_e5', round: 5, type: 'reward', title: '数据涟漪', desc: '同步操作带来额外奖励！', effect: { renReward: 25, sealedValue: 20 } },
      { id: 'zi_e6', round: 6, type: 'mystery', title: '虚数显现', desc: '若隐藏条件达成，虚数门开启！', effect: null },
      { id: 'zi_e7', round: 7, type: 'bonus', title: '真结局判定', desc: '通过虚数门获得的封存值将翻倍结算。', effect: null },
      { id: 'zi_e8', round: 8, type: 'risk', title: '坍缩预警', desc: '未能及时归航将触发失败！', effect: { ziFailFactor: 15 } }
    ],
    rounds: 10,
    targetSealedValue: 250,
    targetRenReward: 50,
    maxYiRisk: 60,
    hiddenCondition: (s) => (s.prismActivated && s.echoActivated),
    hiddenBonus: (s) => ({ sealedValue: s.sealedValue * 0.5, renReward: 50, yiRisk: -20 })
  }
};

function serveStatic(req, res) {
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(PUBLIC_DIR, pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + pathname);
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function recalculateSettlement(scenarioId, steps, finalState) {
  const scenario = GAME_SCENARIOS[scenarioId];
  if (!scenario) return { error: '场景不存在' };

  let state = JSON.parse(JSON.stringify(scenario.initialState));
  const stepResults = [];
  let sealedValueByStep = [state.sealedValue];
  let yiRiskByStep = [state.yiRisk];
  let renRewardByStep = [state.renReward];
  let ziFailByStep = [state.ziFailFactor];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const roundNum = i + 1;
    const result = { step: roundNum, action: step.action, before: { ...state } };

    switch (step.action.type) {
      case 'seal':
        const node = scenario.map.nodes.find(n => n.id === step.action.nodeId);
        if (node && state.resources.energy >= step.action.amount * 0.5) {
          const sealAmount = Math.min(step.action.amount, node.capacity - (state.nodeSeals?.[node.id] || 0), state.resources.energy * 2);
          state.sealedValue += sealAmount;
          state.resources.energy -= Math.ceil(sealAmount * 0.5);
          state.traceMarks += 1;
          state.nodeSeals = state.nodeSeals || {};
          state.nodeSeals[node.id] = (state.nodeSeals[node.id] || 0) + sealAmount;
          if (node.id === 'B' && state.nodeSeals['B'] >= 80) {
            state.prismActivated = true;
          }
          if (node.id === 'C' && state.nodeSeals['C'] >= 80) {
            state.echoActivated = true;
          }
          result.sealAmount = sealAmount;
        }
        break;
      case 'rewrite':
        if (state.rewriteSlots > 0) {
          state.rewriteSlots -= 1;
          state.sealedValue += step.action.bonus || 25;
          result.rewritten = true;
        }
        break;
      case 'dispatch':
        const edge = scenario.map.edges.find(e =>
          (e.from === step.action.from && e.to === step.action.to) ||
          (e.from === step.action.to && e.to === step.action.from)
        );
        if (edge && state.resources.gas >= edge.cost) {
          state.resources.gas -= edge.cost;
          state.traceMarks += 1;
          state.sealedValue += Math.floor(edge.maxFlow * 0.2);
          result.dispatched = true;
        }
        break;
      case 'signal':
        if (state.resources.signal >= 20) {
          state.resources.signal -= 20;
          state.renReward += 15;
          state.yiRisk = Math.max(0, state.yiRisk - 5);
        }
        break;
      case 'skip':
        state.ziFailFactor += 5;
        break;
    }

    const roundEvent = scenario.events.find(e => e.round === roundNum);
    if (roundEvent && roundEvent.effect) {
      applyEventEffect(state, roundEvent.effect);
      result.eventApplied = roundEvent.id;
    }

    if (scenario.hiddenCondition && scenario.hiddenCondition(state) && !state.hiddenUnlocked) {
      state.hiddenUnlocked = true;
      if (scenario.hiddenBonus) {
        const bonus = scenario.hiddenBonus(state);
        applyEventEffect(state, bonus);
        result.hiddenUnlocked = true;
      }
    }

    result.after = { ...state };
    stepResults.push(result);
    sealedValueByStep.push(state.sealedValue);
    yiRiskByStep.push(state.yiRisk);
    renRewardByStep.push(state.renReward);
    ziFailByStep.push(state.ziFailFactor);
  }

  if (finalState && finalState.hiddenUnlocked !== undefined) {
    state.hiddenUnlocked = finalState.hiddenUnlocked;
  }

  const isWin = scenario.winFormula(state);
  const isLoss = scenario.lossFormula(state);
  let outcome = '进行中';
  if (isWin && state.hiddenUnlocked) outcome = '真结局·胜利';
  else if (isWin) outcome = '普通结局·胜利';
  else if (isLoss) outcome = '失败';

  return {
    scenario: scenario.name,
    outcome,
    isWin,
    isLoss,
    isHiddenEnding: state.hiddenUnlocked && isWin,
    finalState: {
      sealedValue: state.sealedValue,
      rewriteSlots: state.rewriteSlots,
      traceMarks: state.traceMarks,
      yiRisk: state.yiRisk,
      renReward: state.renReward,
      ziFailFactor: state.ziFailFactor,
      resources: state.resources,
      hiddenUnlocked: state.hiddenUnlocked
    },
    targets: {
      sealedValue: scenario.targetSealedValue,
      sealedValueReached: state.sealedValue >= scenario.targetSealedValue,
      renReward: scenario.targetRenReward,
      renRewardReached: state.renReward >= scenario.targetRenReward,
      maxYiRisk: scenario.maxYiRisk,
      yiRiskOk: state.yiRisk <= scenario.maxYiRisk
    },
    stepResults,
    charts: { sealedValueByStep, yiRiskByStep, renRewardByStep, ziFailByStep }
  };
}

function applyEventEffect(state, effect) {
  if (effect.sealedValue) state.sealedValue += effect.sealedValue;
  if (effect.rewriteSlots) state.rewriteSlots += effect.rewriteSlots;
  if (effect.traceMarks) state.traceMarks += effect.traceMarks;
  if (effect.yiRisk) state.yiRisk += effect.yiRisk;
  if (effect.renReward) state.renReward += effect.renReward;
  if (effect.ziFailFactor) state.ziFailFactor += effect.ziFailFactor;
  if (effect.resources) {
    if (!state.resources) state.resources = { energy: 0, gas: 0, signal: 0 };
    if (effect.resources.energy) state.resources.energy += effect.resources.energy;
    if (effect.resources.gas) state.resources.gas += effect.resources.gas;
    if (effect.resources.signal) state.resources.signal += effect.resources.signal;
  }
  if (state.sealedValue < 0) state.sealedValue = 0;
  if (state.yiRisk < 0) state.yiRisk = 0;
  if (state.ziFailFactor < 0) state.ziFailFactor = 0;
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'GET' && pathname === '/api/scenarios') {
    const list = Object.values(GAME_SCENARIOS).map(s => ({
      id: s.id, name: s.name, description: s.description, difficulty: s.difficulty, rounds: s.rounds
    }));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(list));
  }

  if (req.method === 'GET' && pathname.startsWith('/api/scenario/')) {
    const id = pathname.split('/').pop();
    const scenario = GAME_SCENARIOS[id];
    if (!scenario) { res.writeHead(404); return res.end(JSON.stringify({ error: 'not found' })); }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(scenario));
  }

  if (req.method === 'POST' && pathname === '/api/settle') {
    try {
      const body = await parseBody(req);
      const result = recalculateSettlement(body.scenarioId, body.steps || [], body.finalState || {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true, time: Date.now() }));
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('  盐湖气球资源配给盘 已启动');
  console.log('  访问地址: http://localhost:' + PORT);
  console.log('  启动方式: npm start  或  node server.js');
  console.log('========================================\n');
});
