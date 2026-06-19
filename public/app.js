const STORAGE_KEY = 'yinyan_darkroom_state_v1';

const state = {
  sessionId: null,
  currentLevelId: 'chen',
  levels: [],
  currentLevel: null,
  gameState: null,
  selectedCellId: null,
  actions: [],
  events: [],
  firedEvents: new Set(),
  hiddenSeq: [],
  settled: false
};

function genSessionId() {
  return 'yy_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function saveToLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId: state.sessionId,
      currentLevelId: state.currentLevelId,
      gameState: state.gameState,
      actions: state.actions,
      events: state.events,
      firedEvents: Array.from(state.firedEvents),
      hiddenSeq: state.hiddenSeq,
      settled: state.settled
    }));
  } catch (e) {}
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state.sessionId = data.sessionId;
      state.currentLevelId = data.currentLevelId;
      state.gameState = data.gameState;
      state.actions = data.actions || [];
      state.events = data.events || [];
      state.firedEvents = new Set(data.firedEvents || []);
      state.hiddenSeq = data.hiddenSeq || [];
      state.settled = data.settled || false;
      return true;
    }
  } catch (e) {}
  return false;
}

async function saveToServer() {
  setSyncStatus('同步中...', 'var(--text-dim)');
  try {
    await fetch('/api/replay/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        levelId: state.currentLevelId,
        actions: state.actions,
        state: state.gameState
      })
    });
    setSyncStatus('已同步', 'var(--success)');
  } catch (e) {
    setSyncStatus('离线 (本地保存)', 'var(--amber)');
  }
}

function setSyncStatus(text, color) {
  const el = document.getElementById('syncStatus');
  if (el) {
    el.textContent = text;
    el.style.color = color;
  }
}

async function init() {
  const loaded = loadFromLocal();
  if (!loaded || !state.sessionId) {
    state.sessionId = genSessionId();
  }

  document.getElementById('sessionLabel').textContent = '会话ID: ' + state.sessionId;

  try {
    const res = await fetch('/api/levels');
    state.levels = await res.json();
    renderLevelTabs();
  } catch (e) {
    state.levels = [
      { id: 'chen', name: '辰局', subtitle: '教学引导局', description: '熟悉暗房操作' },
      { id: 'mao', name: '卯局', subtitle: '资源短缺局', description: '药剂不足' },
      { id: 'xin', name: '辛局', subtitle: '隐藏条件局', description: '触发隐藏条件' }
    ];
    renderLevelTabs();
  }

  await loadLevel(state.currentLevelId);

  bindEvents();
  renderAll();
  saveToLocal();
  saveToServer();
}

function bindEvents() {
  document.getElementById('newSessionBtn').addEventListener('click', () => {
    if (confirm('确定开启新会话？当前进度将保留在本地但会话ID会更换。')) {
      state.sessionId = genSessionId();
      document.getElementById('sessionLabel').textContent = '会话ID: ' + state.sessionId;
      saveToLocal();
      saveToServer();
    }
  });

  document.getElementById('actSingleBtn').addEventListener('click', () => doAction(1));
  document.getElementById('actCoopBtn').addEventListener('click', () => doAction(2));
  document.getElementById('settleBtn').addEventListener('click', settleGame);

  document.getElementById('loadReplayBtn').addEventListener('click', loadLastReplay);
  document.getElementById('clearReplayBtn').addEventListener('click', () => {
    if (confirm('清空当前回放并重置本局？')) {
      resetLevel();
    }
  });
}

function renderLevelTabs() {
  const container = document.getElementById('levelTabs');
  container.innerHTML = state.levels.map(l => `
    <div class="level-tab ${l.id === state.currentLevelId ? 'active' : ''}" data-id="${l.id}">
      <h3>${l.name.replace('银盐暗房双人机关局·', '')}</h3>
      <div class="tab-sub">${l.subtitle}</div>
    </div>
  `).join('');
  container.querySelectorAll('.level-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const id = tab.dataset.id;
      if (id !== state.currentLevelId && state.actions.length > 0) {
        if (!confirm(`切换到其他局？当前${state.currentLevelId}局进度将保留。`)) return;
      }
      await loadLevel(id);
      renderAll();
    });
  });
}

async function loadLevel(id) {
  state.currentLevelId = id;
  state.selectedCellId = null;
  state.settled = false;
  try {
    const res = await fetch(`/api/level/${id}`);
    state.currentLevel = await res.json();
  } catch (e) {
    state.currentLevel = getFallbackLevel(id);
  }
  if (!state.gameState || state.gameState._levelId !== id) {
    state.gameState = JSON.parse(JSON.stringify(state.currentLevel.initialState));
    state.gameState._levelId = id;
    state.actions = [];
    state.events = [];
    state.firedEvents = new Set();
    state.hiddenSeq = [];
  }
  saveToLocal();
}

function getFallbackLevel(id) {
  const levels = {
    chen: {
      id: 'chen', name: '辰局', subtitle: '教学',
      initialState: { fumigation: 20, patrolSlots: 4, lightMarks: 0, chenRisk: 0, maoReward: 0, xinFailFactor: 0, turn: 0 },
      map: [
        { id: 'A1', type: 'fumigate', name: '显影槽', desc: '熏染值+15' },
        { id: 'A2', type: 'light', name: '红光灯', desc: '点亮痕迹+1' },
        { id: 'B1', type: 'fumigate', name: '定影池', desc: '熏染值+10' },
        { id: 'B2', type: 'risk', name: '巡测通道', desc: '辰号风险+20' },
        { id: 'C1', type: 'light', name: '放大机', desc: '点亮痕迹+2' },
        { id: 'C2', type: 'safe', name: '安全柜', desc: '辰号风险-15' }
      ]
    },
    mao: {
      id: 'mao', name: '卯局', subtitle: '资源短缺',
      initialState: { fumigation: 10, patrolSlots: 2, lightMarks: 0, chenRisk: 0, maoReward: 0, xinFailFactor: 0, turn: 0 },
      map: [
        { id: 'A1', type: 'fumigate', name: '稀释显影液', desc: '熏染值+8，消耗1奖励' },
        { id: 'A2', type: 'light', name: '接触印相', desc: '点亮痕迹+1' },
        { id: 'B1', type: 'reward', name: '药剂柜', desc: '卯号奖励+1' },
        { id: 'B2', type: 'light', name: '对焦屏', desc: '点亮痕迹+1' },
        { id: 'C1', type: 'reward', name: '急救箱', desc: '卯号奖励+2' },
        { id: 'C2', type: 'fumigate', name: '浓缩液', desc: '熏染值+20，消耗2奖励' }
      ]
    },
    xin: {
      id: 'xin', name: '辛局', subtitle: '隐藏条件',
      initialState: { fumigation: 30, patrolSlots: 3, lightMarks: 0, chenRisk: 0, maoReward: 0, xinFailFactor: 0, hiddenTriggered: false, turn: 0 },
      map: [
        { id: 'A1', type: 'fumigate', name: '主显影槽', desc: '熏染值+12' },
        { id: 'A2', type: 'light', name: '暗室灯', desc: '点亮痕迹+1' },
        { id: 'B1', type: 'hidden', name: '神秘底片', desc: '隐藏条件' },
        { id: 'B2', type: 'suppress', name: '稳定剂', desc: '失败因子-10' },
        { id: 'C1', type: 'light', name: '投影器', desc: '点亮痕迹+2' },
        { id: 'C2', type: 'hidden', name: '密码箱', desc: '隐藏关键节点' }
      ]
    }
  };
  return levels[id];
}

function resetLevel() {
  state.gameState = JSON.parse(JSON.stringify(state.currentLevel.initialState));
  state.gameState._levelId = state.currentLevelId;
  state.actions = [];
  state.events = [];
  state.firedEvents = new Set();
  state.hiddenSeq = [];
  state.selectedCellId = null;
  state.settled = false;
  saveToLocal();
  saveToServer();
  renderAll();
  addEvent('system', '本局已重置，重新开始');
}

async function loadLastReplay() {
  try {
    const res = await fetch(`/api/replay/${state.sessionId}`);
    if (res.ok) {
      const data = await res.json();
      if (confirm(`加载回放？发现 ${data.actions.length} 步操作，当前进度将被覆盖。`)) {
        state.currentLevelId = data.levelId;
        state.actions = data.actions;
        state.gameState = data.state || JSON.parse(JSON.stringify(state.currentLevel.initialState));
        state.gameState._levelId = data.levelId;
        state.events = [];
        state.firedEvents = new Set();
        state.hiddenSeq = [];
        state.settled = false;
        await loadLevel(data.levelId);
        replayActions();
        renderAll();
        saveToLocal();
        addEvent('system', `已从服务器加载 ${state.actions.length} 步回放`);
      }
    } else {
      addEvent('system', '服务器上未找到该会话的回放');
    }
  } catch (e) {
    addEvent('system', '加载失败：无法连接服务器');
  }
}

function replayActions() {
  const actions = state.actions.slice();
  state.actions = [];
  state.events = [];
  state.gameState = JSON.parse(JSON.stringify(state.currentLevel.initialState));
  state.gameState._levelId = state.currentLevelId;
  state.firedEvents = new Set();
  state.hiddenSeq = [];
  for (const a of actions) {
    applyAction(a.cellId, a.players, true);
  }
}

function renderAll() {
  renderLevelTabs();
  renderStateGrid();
  renderMap();
  renderActionBar();
  renderLevelDesc();
  renderEventLog();
  renderReplayTimeline();
  document.getElementById('turnCounter').textContent = `回合 ${state.gameState.turn || 0}`;
}

const TYPE_LABELS = {
  fumigate: '熏染',
  light: '点亮',
  risk: '风险',
  safe: '防护',
  reward: '奖励',
  suppress: '抑制',
  hidden: '隐藏'
};

function renderStateGrid() {
  const s = state.gameState;
  const lvl = state.currentLevelId;
  const cards = [
    { label: '银盐暗房熏染值', value: s.fumigation, max: 100, cls: s.fumigation >= 60 ? 'good' : '' },
    { label: '银盐暗房巡测槽', value: s.patrolSlots, max: 6, cls: '' },
    { label: '银盐暗房点亮痕', value: s.lightMarks, max: 10, cls: s.lightMarks >= 5 ? 'good' : '' }
  ];
  if (lvl === 'chen') {
    cards.push({ label: '辰号风险', value: s.chenRisk, max: 100, cls: s.chenRisk >= 50 ? 'warn' : '' });
  } else if (lvl === 'mao') {
    cards.push({ label: '卯号奖励', value: s.maoReward, max: 10, cls: s.maoReward >= 3 ? 'good' : '' });
  } else if (lvl === 'xin') {
    cards.push({ label: '辛号失败因子', value: s.xinFailFactor, max: 100, cls: s.xinFailFactor >= 30 ? 'warn' : '' });
    if (s.hiddenTriggered) {
      cards.push({ label: '隐藏条件', value: '已触发', max: 1, cls: 'good' });
    }
  }
  const container = document.getElementById('stateGrid');
  container.innerHTML = cards.map(c => `
    <div class="state-card ${c.cls}">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
      <div class="bar"><div class="bar-fill" style="width:${Math.min(100, (c.value / c.max) * 100)}%"></div></div>
    </div>
  `).join('');
}

function renderMap() {
  const usedCells = {};
  state.actions.forEach(a => {
    usedCells[a.cellId] = (usedCells[a.cellId] || 0) + 1;
  });
  const container = document.getElementById('mapGrid');
  container.innerHTML = state.currentLevel.map.map(cell => `
    <div class="map-cell type-${cell.type} ${state.selectedCellId === cell.id ? 'selected' : ''}"
         data-id="${cell.id}">
      <span class="cell-type">${TYPE_LABELS[cell.type] || cell.type}</span>
      <div class="cell-id">${cell.id}</div>
      <div class="cell-name">${cell.name}</div>
      <div class="cell-desc">${cell.desc}</div>
      ${usedCells[cell.id] ? `<span class="cell-used-badge">×${usedCells[cell.id]}</span>` : ''}
    </div>
  `).join('');
  container.querySelectorAll('.map-cell').forEach(el => {
    el.addEventListener('click', () => {
      state.selectedCellId = el.dataset.id;
      renderMap();
      renderActionBar();
    });
  });
}

function renderActionBar() {
  const singleBtn = document.getElementById('actSingleBtn');
  const coopBtn = document.getElementById('actCoopBtn');
  const hasSel = !!state.selectedCellId;
  singleBtn.disabled = !hasSel;
  coopBtn.disabled = !hasSel;
}

function renderLevelDesc() {
  const lvl = state.currentLevel;
  document.getElementById('levelDesc').innerHTML = `
    <strong>${lvl.name} · ${lvl.subtitle}</strong>
    ${lvl.description}
  `;
}

function renderEventLog() {
  const container = document.getElementById('eventLog');
  if (state.events.length === 0) {
    container.innerHTML = `<div class="replay-empty">事件匣待激活...</div>`;
    return;
  }
  container.innerHTML = state.events.slice().reverse().map(ev => `
    <div class="event-item event-${ev.type}">
      <div class="event-turn">回合 ${ev.turn || 0}</div>
      <div class="event-text">${ev.text}</div>
    </div>
  `).join('');
}

function renderReplayTimeline() {
  const container = document.getElementById('replayTimeline');
  if (state.actions.length === 0) {
    container.innerHTML = `<div class="replay-empty">尚无操作记录，开始你的第一步...</div>`;
    return;
  }
  container.innerHTML = state.actions.map((a, i) => {
    const cell = state.currentLevel.map.find(c => c.id === a.cellId);
    return `
      <div class="replay-item ${a.players === 2 ? 'coop' : ''}">
        <div class="replay-turn">${i + 1}</div>
        <div class="replay-info">
          <div class="replay-cell">${cell ? cell.name : a.cellId}</div>
          <div class="replay-mode">${a.players === 2 ? '双人协作' : '单人操作'} · ${a.cellId}</div>
        </div>
      </div>
    `;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function addEvent(type, text) {
  state.events.push({ type, text, turn: state.gameState.turn || 0 });
  renderEventLog();
}

function doAction(players) {
  if (!state.selectedCellId) return;
  if (state.settled) {
    addEvent('system', '本局已结算，请重置后再操作');
    return;
  }
  const cell = state.currentLevel.map.find(c => c.id === state.selectedCellId);
  if (!cell) return;
  applyAction(state.selectedCellId, players, false);
  state.selectedCellId = null;
  saveToLocal();
  saveToServer();
  renderAll();
}

function applyAction(cellId, players, isReplay) {
  const cell = state.currentLevel.map.find(c => c.id === cellId);
  if (!cell) return;
  const s = state.gameState;
  const lvl = state.currentLevelId;
  s.turn = (s.turn || 0) + 1;
  const coop = players === 2;

  switch (cell.type) {
    case 'fumigate':
      if (lvl === 'mao' && cellId === 'A1') {
        if (s.maoReward >= 1) {
          s.maoReward -= 1;
          s.fumigation += 8;
          if (!isReplay) addEvent('action', `操作 ${cell.name}：熏染值+8，消耗卯号奖励×1`);
        } else {
          if (!isReplay) addEvent('action', `操作 ${cell.name} 失败：卯号奖励不足`);
          s.turn--;
          return;
        }
      } else if (lvl === 'mao' && cellId === 'C2') {
        if (s.maoReward >= 2) {
          s.maoReward -= 2;
          s.fumigation += 20;
          if (!isReplay) addEvent('action', `操作 ${cell.name}：熏染值+20，消耗卯号奖励×2`);
        } else {
          if (!isReplay) addEvent('action', `操作 ${cell.name} 失败：卯号奖励不足`);
          s.turn--;
          return;
        }
      } else {
        const gain = coop ? 18 : (cellId === 'B1' ? 10 : 12);
        s.fumigation += gain;
        if (!isReplay) addEvent('action', `${coop ? '双人协作' : '单人操作'} ${cell.name}：熏染值+${gain}`);
      }
      if (lvl === 'xin') s.xinFailFactor += 5;
      break;

    case 'light':
      const marks = coop ? (cellId === 'C1' ? 3 : 2) : 1;
      s.lightMarks += marks;
      if (lvl === 'mao' && cellId === 'B2') s.fumigation = Math.max(0, s.fumigation - 3);
      if (lvl === 'xin') {
        s.xinFailFactor += cellId === 'C1' ? 8 : 3;
        state.hiddenSeq.push(cellId);
      }
      if (!isReplay) addEvent('action', `${coop ? '双人协作' : '单人操作'} ${cell.name}：点亮痕迹+${marks}`);
      break;

    case 'risk':
      s.chenRisk += 20;
      if (!isReplay) addEvent('action', `触发 ${cell.name}：辰号风险+20`);
      break;

    case 'safe':
      s.chenRisk = Math.max(0, s.chenRisk - 15);
      if (!isReplay) addEvent('action', `操作 ${cell.name}：辰号风险-15`);
      break;

    case 'reward':
      const rw = cellId === 'C1' ? 2 : 1;
      s.maoReward += rw;
      if (cellId === 'C1') s.fumigation = Math.max(0, s.fumigation - 5);
      if (!isReplay) addEvent('action', `${coop ? '双人协作' : '单人操作'} ${cell.name}：卯号奖励+${rw}`);
      break;

    case 'suppress':
      s.xinFailFactor = Math.max(0, s.xinFailFactor - 10);
      if (!isReplay) addEvent('action', `操作 ${cell.name}：辛号失败因子-10`);
      break;

    case 'hidden':
      if (lvl === 'xin') {
        state.hiddenSeq.push(cellId);
        if (cellId === 'C2') s.xinFailFactor = Math.max(0, s.xinFailFactor - 15);
        const target = ['A2', 'B1', 'C2'];
        const slice = state.hiddenSeq.slice(-3);
        if (slice.length === 3 && slice.every((v, i) => v === target[i])) {
          s.xinFailFactor = 0;
          s.fumigation += 25;
          s.hiddenTriggered = true;
          if (!isReplay) addEvent('hidden', '★ 隐藏条件触发！按顺序 A2→B1→C2 激活，失败因子清零，熏染值+25');
        } else {
          if (!isReplay) addEvent('action', `操作 ${cell.name}：隐藏节点激活`);
        }
      }
      break;
  }

  state.actions.push({ cellId, players, turn: s.turn });
  checkTurnEvents(isReplay);
}

function checkTurnEvents(isReplay) {
  const s = state.gameState;
  const lvl = state.currentLevelId;
  const triggers = [
    { key: `turn${s.turn}`, lvl: 'all' },
    { key: s.chenRisk >= 50 ? 'risk50' : null, lvl: 'chen' },
    { key: s.xinFailFactor >= 30 ? 'fail30' : null, lvl: 'xin' },
    { key: s.lightMarks >= 2 ? 'marks2' : null, lvl: 'chen' },
    { key: s.maoReward >= 1 ? 'reward1' : null, lvl: 'mao' },
    { key: s.turn >= 2 ? 'turn2xin' : null, lvl: 'xin' }
  ];
  if (lvl === 'xin' && s.turn >= 2) {
    s.xinFailFactor += 3;
  }
  const eventMap = {
    chen: {
      turn3: { text: '暗房通风系统启动，熏染值-5', effect: () => { s.fumigation = Math.max(0, s.fumigation - 5); } },
      marks2: { text: '第一张底片显影成功！获得提示', effect: () => {} },
      risk50: { text: '警报！巡测槽即将锁定', effect: () => {} }
    },
    mao: {
      turn5: { text: '药剂挥发！熏染值-10', effect: () => { s.fumigation = Math.max(0, s.fumigation - 10); } },
      reward1: { text: '找到备用药剂！', effect: () => {} },
      turn10: { text: '时间紧迫，巡测槽短暂+1', effect: () => { s.patrolSlots += 1; } }
    },
    xin: {
      turn2: { text: '辛号因子开始累积...每回合+3', effect: () => {} },
      fail30: { text: '警告：失败因子逼近临界值', effect: () => {} }
    }
  };
  const evs = eventMap[lvl] || {};
  for (const key of Object.keys(evs)) {
    if (state.firedEvents.has(key)) continue;
    let match = false;
    if (key.startsWith('turn')) {
      const tn = parseInt(key.replace('turn', ''));
      if (!isNaN(tn) && s.turn === tn) match = true;
    } else if (key === 'risk50' && s.chenRisk >= 50) {
      match = true;
    } else if (key === 'fail30' && s.xinFailFactor >= 30) {
      match = true;
    } else if (key === 'marks2' && s.lightMarks >= 2) {
      match = true;
    } else if (key === 'reward1' && s.maoReward >= 1) {
      match = true;
    }
    if (match) {
      const ev = evs[key];
      state.firedEvents.add(key);
      ev.effect();
      if (!isReplay) addEvent('event', ev.text);
    }
  }
}

async function settleGame() {
  if (state.actions.length === 0) {
    addEvent('system', '尚无操作，无法结算');
    return;
  }
  try {
    addEvent('system', '正在提交后端重算...');
    const res = await fetch('/api/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelId: state.currentLevelId,
        actions: state.actions
      })
    });
    if (!res.ok) throw new Error('结算失败');
    const result = await res.json();
    state.settled = true;
    renderSettlement(result);
    addEvent('system', `结算完成：${result.won ? '胜利' : result.lost ? '失败' : '进行中'}，得分 ${result.score}`);
    saveToLocal();
  } catch (e) {
    const result = localSettle();
    state.settled = true;
    renderSettlement(result);
    addEvent('system', `(本地结算) ${result.won ? '胜利' : result.lost ? '失败' : '进行中'}，得分 ${result.score}`);
  }
}

function localSettle() {
  const backupState = JSON.parse(JSON.stringify(state.gameState));
  const coopSteps = state.actions.filter(a => a.players === 2).length;
  const s = state.gameState;
  let won = false, lost = false;
  if (state.currentLevelId === 'chen') {
    won = s.lightMarks >= 5 && s.fumigation >= 60;
    lost = s.chenRisk >= 100;
  } else if (state.currentLevelId === 'mao') {
    won = s.lightMarks >= 6 && s.fumigation >= 50 && s.maoReward >= 3;
    lost = s.fumigation <= 0 || s.turn > 20;
  } else if (state.currentLevelId === 'xin') {
    won = s.lightMarks >= 7 && s.fumigation >= 70 && s.hiddenTriggered;
    lost = s.xinFailFactor >= 100;
  }
  const score = Math.max(0, Math.floor(
    s.fumigation * 2 + s.lightMarks * 15 + s.maoReward * 10 +
    coopSteps * 20 - s.chenRisk * 0.5 - s.xinFailFactor * 0.8
  ));
  return {
    won, lost, score,
    finalState: backupState,
    coopSteps,
    totalTurns: s.turn,
    steps: state.actions.map((a, i) => ({
      turn: i + 1,
      action: state.currentLevel.map.find(c => c.id === a.cellId)?.name || a.cellId
    })),
    levelName: state.currentLevel.name
  };
}

function renderSettlement(r) {
  const container = document.getElementById('settleContent');
  const fs = r.finalState || {};
  container.innerHTML = `
    <div class="settle-result">
      <div class="verdict ${r.won ? 'win' : r.lost ? 'lose' : ''}">
        <h3>${r.won ? '通关成功' : r.lost ? '挑战失败' : '尚未达胜负条件'}</h3>
        <div class="score">${r.score} 分</div>
      </div>
      <div class="stats">
        <div class="stat-item"><div class="stat-label">总回合数</div><div class="stat-val">${r.totalTurns || 0}</div></div>
        <div class="stat-item"><div class="stat-label">协作步骤</div><div class="stat-val">${r.coopSteps || 0}</div></div>
        <div class="stat-item"><div class="stat-label">熏染值</div><div class="stat-val">${fs.fumigation ?? 0}</div></div>
        <div class="stat-item"><div class="stat-label">点亮痕</div><div class="stat-val">${fs.lightMarks ?? 0}</div></div>
        ${fs.chenRisk !== undefined ? `<div class="stat-item"><div class="stat-label">辰号风险</div><div class="stat-val">${fs.chenRisk}</div></div>` : ''}
        ${fs.maoReward !== undefined ? `<div class="stat-item"><div class="stat-label">卯号奖励</div><div class="stat-val">${fs.maoReward}</div></div>` : ''}
        ${fs.xinFailFactor !== undefined ? `<div class="stat-item"><div class="stat-label">失败因子</div><div class="stat-val">${fs.xinFailFactor}</div></div>` : ''}
        ${fs.hiddenTriggered !== undefined ? `<div class="stat-item"><div class="stat-label">隐藏条件</div><div class="stat-val">${fs.hiddenTriggered ? '已触发' : '未触发'}</div></div>` : ''}
      </div>
      <div class="steps-title">操作明细 (${r.steps ? r.steps.length : 0} 步)</div>
      <div class="steps-list">
        ${(r.steps || []).map(st => `
          <div class="step-item ${st.event ? 'event-step' : ''} ${st.hidden ? 'hidden-step' : ''}">
            <span class="step-turn">T${st.turn}</span>
            <span>${st.event || st.action || '-'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

init();
