const STORE_KEY = 'snow_cable_session_v1';

const AppState = {
  sessionId: null,
  gameId: null,
  gameStatus: 'idle',
  currentState: null,
  gameConfig: null,
  availableMoves: [],
  history: [],
  replayIndex: -1,
  viewingSnapshot: null,
  lastSettle: null,
  pendingConfirmMove: null
};

function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }
function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body != null) opts.body = JSON.stringify(body);
  return fetch(path, opts).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  });
}

function showToast(title, msg, type = 'info', duration = 3600) {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { positive: '✦', negative: '⚠', mixed: '✧', flame: '🔥', hidden: '✧', victory: '★', defeat: '✖', info: 'ℹ' };
  toast.innerHTML = `<div class="toast-title">${icons[type] || 'ℹ'} ${title}</div><div class="toast-msg">${msg}</div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 300); }, duration);
}

function formatEffect(effect) {
  const names = {
    railSwitch: '换轨值', translation: '转译槽', rewrite: '复写痕',
    siRisk: '巳号风险', shenReward: '申号奖励', wuFailureFactor: '午号因子',
    unlock_edge: '解锁航线', hiddenUnlocked: '隐藏条件', wuFlame: '焰坛点燃'
  };
  const n = names[effect.type] || effect.type;
  if (effect.type === 'unlock_edge') return { text: `${n}: ${effect.edge}`, cls: 'pos' };
  if (effect.type === 'hiddenUnlocked') return { text: `隐藏结局${effect.value ? '触发' : '关闭'}`, cls: 'pos' };
  if (effect.type === 'wuFlame') return { text: `点燃${{a:'紫',b:'绯',c:'金'}[effect.flame]}焰坛`, cls: 'pos' };
  const v = effect.value;
  const cls = v > 0 && !['siRisk', 'wuFailureFactor'].includes(effect.type) ? 'pos'
    : v < 0 || ['siRisk', 'wuFailureFactor'].includes(effect.type) ? 'neg' : '';
  const sign = v > 0 ? '+' : '';
  return { text: `${n} ${sign}${v}`, cls };
}

async function loadGameList() {
  try {
    const data = await api('GET', '/api/games');
    const listEl = $('#game-list');
    listEl.innerHTML = '';
    const tags = { si: ['教学局', 'tag-si'], shen: ['资源局', 'tag-shen'], wu: ['隐藏局', 'tag-wu'] };
    data.games.forEach(g => {
      const [tagText, tagCls] = tags[g.id] || ['', 'tag-si'];
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <div class="game-card-head">
          <div class="game-card-name">${g.name}</div>
          <div class="game-card-sub">${g.subtitle}</div>
        </div>
        <div class="game-card-desc">${g.description}</div>
        <span class="game-card-tag ${tagCls}">${tagText}</span>
      `;
      card.addEventListener('click', () => { startGame(g.id); hideModal(); });
      listEl.appendChild(card);
    });
  } catch (e) {
    $('#game-list').innerHTML = `<div class="loading">加载失败：${e.message}</div>`;
  }
}

function showModal() { $('#modal-select').classList.remove('hidden'); loadGameList(); }
function hideModal() { $('#modal-select').classList.add('hidden'); }

async function startGame(gameId) {
  try {
    const [cfg, start] = await Promise.all([
      api('GET', `/api/games/${gameId}`),
      api('POST', `/api/sessions/start/${gameId}`)
    ]);
    AppState.sessionId = start.sessionId;
    AppState.gameId = gameId;
    AppState.gameStatus = start.gameStatus;
    AppState.currentState = start.currentState;
    AppState.availableMoves = start.availableMoves || [];
    AppState.gameConfig = cfg;
    AppState.replayIndex = -1;
    AppState.viewingSnapshot = null;
    AppState.history = [];
    AppState.lastSettle = null;
    updateGameHeader();
    toggleWuMode(gameId === 'wu');
    $('#game-name').textContent = cfg.name;
    $('#game-subtitle').textContent = cfg.subtitle;
    renderBoard();
    renderStats();
    renderEvents(true);
    renderReplay();
    renderSettle();
    $('#events-list').innerHTML = `<div class="empty-tip">推演开始！从【${getNodeName(start.currentState.currentNode)}】出发，点击高亮节点进行移动。</div>`;
    await refreshHistory();
    saveLocalSession();
    showToast('推演局启动', cfg.name + ' · ' + cfg.subtitle, 'info');
  } catch (e) {
    showToast('启动失败', e.message, 'negative');
  }
}

async function restoreSession() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    const sess = JSON.parse(raw);
    if (!sess || !sess.sessionId) return false;
    const [cfg, restore] = await Promise.all([
      api('GET', `/api/games/${sess.gameId}`),
      api('POST', '/api/sessions/restore', { sessionData: sess })
    ]);
    AppState.sessionId = restore.sessionId;
    AppState.gameId = sess.gameId;
    AppState.gameStatus = restore.gameStatus;
    AppState.currentState = restore.currentState;
    AppState.availableMoves = restore.availableMoves || [];
    AppState.gameConfig = cfg;
    AppState.replayIndex = -1;
    AppState.viewingSnapshot = null;
    $('#game-name').textContent = cfg.name;
    $('#game-subtitle').textContent = cfg.subtitle;
    toggleWuMode(sess.gameId === 'wu');
    await refreshHistory();
    renderBoard();
    renderStats();
    renderReplay();
    renderSettle();
    updateGameHeader();
    if (AppState.gameStatus === 'playing') {
      showToast('断点续局成功', `已恢复到第 ${restore.currentStep} 步，请继续推演。`, 'positive');
    } else {
      showToast('对局已结束', `恢复到已${AppState.gameStatus === 'victory' ? '胜利' : '失败'}的对局，可重开本局。`, AppState.gameStatus === 'victory' ? 'victory' : 'defeat');
    }
    return true;
  } catch (e) {
    console.warn('恢复失败', e);
    localStorage.removeItem(STORE_KEY);
    return false;
  }
}

async function refreshHistory() {
  if (!AppState.sessionId) return;
  try {
    const data = await api('GET', `/api/sessions/${AppState.sessionId}/history`);
    AppState.history = data.history;
    renderReplay();
    renderEvents(false);
  } catch (e) { console.warn(e); }
}

function saveLocalSession() {
  if (!AppState.sessionId) return;
  const sessData = buildSessionSnapshot();
  localStorage.setItem(STORE_KEY, JSON.stringify(sessData));
}

function buildSessionSnapshot() {
  return {
    sessionId: AppState.sessionId,
    gameId: AppState.gameId,
    gameStatus: AppState.gameStatus,
    currentStep: AppState.currentState?.steps ?? 0,
    history: buildFullHistoryWithState()
  };
}

function buildFullHistoryWithState() {
  if (!AppState.history || AppState.history.length === 0) {
    const baseState = AppState.currentState || {};
    if (!baseState.unlockedEdges) baseState.unlockedEdges = [];
    if (AppState.gameId === 'wu' && !baseState.wuFlames) baseState.wuFlames = { a: false, b: false, c: false };
    return [{ step: 0, action: { type: 'init', description: '推演局初始化' }, state: baseState, eventTriggered: null }];
  }
  return AppState.history;
}

async function doMove(targetNode, useTranslation = false) {
  if (AppState.gameStatus !== 'playing') { showToast('对局已结束', '请重开本局或切换对局', 'info'); return; }
  const valid = AppState.availableMoves.find(m => m.target === targetNode);
  if (!valid) { showToast('无效航线', '请选择高亮的可用航线', 'negative'); return; }
  try {
    const data = await api('POST', `/api/sessions/${AppState.sessionId}/move`, { targetNode, useTranslation });
    AppState.currentState = data.currentState;
    AppState.gameStatus = data.gameStatus;
    AppState.availableMoves = data.availableMoves || [];
    await refreshHistory();
    renderBoard();
    renderStats();
    renderReplay();
    if (data.eventTriggered) {
      renderEvents(false, data.eventTriggered);
      showEventToast(data.eventTriggered);
    }
    if (AppState.gameStatus !== 'playing') {
      showToast(
        AppState.gameStatus === 'victory' ? '★ 推演成功 ★' : '✖ 推演失败 ✖',
        AppState.gameStatus === 'victory' ? '航线已安全抵达终点！' : '航线推演中断，请检查风险或重开本局。',
        AppState.gameStatus
      );
      await doSettle();
    }
    saveLocalSession();
  } catch (e) {
    showToast('行动失败', e.message, 'negative');
  }
}

function showEventToast(et) {
  showToast(et.name, et.description || '事件触发', et.type || 'mixed', 4200);
}

function renderEvents(reset = false, newEvent = null) {
  const list = $('#events-list');
  if (reset) {
    list.innerHTML = '<div class="empty-tip">推演开始，事件将在此处触发。</div>';
    $('#events-count').textContent = '0';
    return;
  }
  const allEvents = AppState.history.filter(h => h.eventTriggered);
  $('#events-count').textContent = String(allEvents.length);
  if (allEvents.length === 0) {
    list.innerHTML = '<div class="empty-tip">尚未触发事件，探索事件节点以触发。</div>';
    return;
  }
  list.innerHTML = '';
  [...allEvents].reverse().forEach(h => {
    const et = h.eventTriggered;
    const type = et.type || 'mixed';
    const card = document.createElement('div');
    card.className = `event-card ${type}`;
    const effects = [];
    if (et.effects && Array.isArray(et.effects)) {
      et.effects.forEach(ef => {
        const f = formatEffect(ef);
        effects.push(`<span class="effect-tag ${f.cls}">${f.text}</span>`);
      });
    } else {
      const fullCfg = window.__configCache?.[AppState.gameId];
      if (fullCfg && fullCfg.events && fullCfg.events[et.id]) {
        fullCfg.events[et.id].effects.forEach(ef => {
          const f = formatEffect(ef);
          effects.push(`<span class="effect-tag ${f.cls}">${f.text}</span>`);
        });
      }
    }
    card.innerHTML = `
      <div class="event-head">
        <span class="event-name">${et.name}</span>
        <span class="event-step">第 ${h.step} 步</span>
      </div>
      <div class="event-desc">${et.description || ''}</div>
      ${effects.length ? `<div class="event-effects">${effects.join('')}</div>` : ''}
    `;
    list.appendChild(card);
  });
}

function getNodeName(id) {
  if (!AppState.gameConfig) return id;
  const n = (AppState.gameConfig.map?.nodes || []).find(x => x.id === id);
  return n ? n.name : id;
}

function toggleWuMode(show) {
  $('#card-fail').classList.toggle('hidden', !show);
  $('#wu-flames').classList.toggle('hidden', !show);
  $('#flame-legend').classList.toggle('hidden', !show);
}

function updateGameHeader() {
  // header state indicator could be added here
}

function renderStats() {
  const s = AppState.viewingSnapshot || AppState.currentState;
  if (!s) return;
  $('#stat-switch').textContent = s.railSwitchValue ?? 0;
  $('#stat-trans').textContent = s.translationSlots ?? 0;
  $('#stat-rewrite').textContent = s.rewriteTraces ?? 0;
  $('#stat-risk').textContent = s.siRisk ?? 0;
  $('#stat-reward').textContent = s.shenReward ?? 0;
  $('#stat-fail').textContent = Math.max(0, s.wuFailureFactor ?? 0);
  $('#stat-step').textContent = s.steps ?? 0;
  $('#stat-maxstep').textContent = s.maxSteps ?? 0;

  const maxSwitch = Math.max(6, s.railSwitchValue || 0, 8);
  const maxTrans = Math.max(4, s.translationSlots || 0, 4);
  const maxRisk = Math.max(4, s.siRisk || 0, 6);
  const maxFail = Math.max(5, Math.max(0, s.wuFailureFactor || 0), 6);
  $('#bar-switch').style.width = Math.min(100, ((s.railSwitchValue || 0) / maxSwitch) * 100) + '%';
  $('#bar-trans').style.width = Math.min(100, ((s.translationSlots || 0) / maxTrans) * 100) + '%';
  $('#bar-risk').style.width = Math.min(100, ((s.siRisk || 0) / maxRisk) * 100) + '%';
  $('#bar-fail').style.width = Math.min(100, (Math.max(0, s.wuFailureFactor || 0) / maxFail) * 100) + '%';

  if (s.wuFlames) {
    $$('.flame').forEach(el => {
      const f = el.dataset.flame;
      el.classList.remove('lit-purple', 'lit-red', 'lit-gold');
      if (s.wuFlames[f]) {
        const cls = { a: 'lit-purple', b: 'lit-red', c: 'lit-gold' }[f];
        el.classList.add(cls);
      }
    });
  }
}

function renderBoard() {
  const cfg = AppState.gameConfig;
  if (!cfg || !cfg.map) return;
  const s = AppState.viewingSnapshot || AppState.currentState;
  const nodes = cfg.map.nodes;
  const edges = cfg.map.edges;
  const path = s.path || [];
  const current = s.currentNode;
  const unlocked = s.unlockedEdges || [];
  const visitedSet = new Set(path);
  const availableSet = new Set((AppState.viewingSnapshot ? [] : AppState.availableMoves).map(m => m.target));

  const defs = $('#board-svg defs');
  if (!$('#pathGradient')) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    g.setAttribute('id', 'pathGradient');
    g.setAttribute('x1', '0'); g.setAttribute('y1', '0'); g.setAttribute('x2', '1'); g.setAttribute('y2', '1');
    g.innerHTML = `
      <stop offset="0%" stop-color="#ffd56b"/>
      <stop offset="50%" stop-color="#ff8a95"/>
      <stop offset="100%" stop-color="#b7a4ff"/>
    `;
    defs.appendChild(g);
  }

  const edgesGroup = $('#edges-group');
  edgesGroup.innerHTML = '';
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const pathSet = new Set();
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    pathSet.add(`${a}-${b}`);
    pathSet.add(`${b}-${a}`);
  }

  edges.forEach(e => {
    const a = nodeMap[e.from], b = nodeMap[e.to];
    if (!a || !b) return;
    const isUnlocked = !e.locked || unlocked.includes(`${e.from}-${e.to}`) || unlocked.includes(`${e.to}-${e.from}`);
    const isAvailable = !AppState.viewingSnapshot && AppState.availableMoves.some(m =>
      (m.from === e.from && m.to === e.to) || (m.from === e.to && m.to === e.from)
    );
    const isTraveled = pathSet.has(`${e.from}-${e.to}`);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ox = -dy / len * 12, oy = dx / len * 12;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    let cls = 'edge-line ' + (e.type || 'normal');
    if (!isUnlocked) cls += ' locked';
    if (isAvailable && !AppState.viewingSnapshot) cls += ' available';
    if (isTraveled) cls += ' traveled';
    line.setAttribute('class', cls);
    line.addEventListener('click', () => {
      if (AppState.viewingSnapshot) return;
      const target = e.from === current ? e.to : e.from;
      if (availableSet.has(target)) confirmMove(target, e);
    });
    edgesGroup.appendChild(line);

    const labelText = `⚡${e.switchReq}` + (e.cost > 1 ? ` · ${e.cost}` : '');
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', mx + ox * 0.3);
    label.setAttribute('y', my + oy * 0.3);
    label.setAttribute('class', 'edge-label' + (isAvailable ? ' available' : ''));
    label.textContent = isUnlocked ? labelText : '🔒';
    edgesGroup.appendChild(label);
  });

  const pathGroup = $('#path-group');
  pathGroup.innerHTML = '';
  if (path.length > 1) {
    let d = `M ${nodeMap[path[0]].x} ${nodeMap[path[0]].y}`;
    for (let i = 1; i < path.length; i++) {
      const n = nodeMap[path[i]];
      d += ` L ${n.x} ${n.y}`;
    }
    const pg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pg.setAttribute('d', d);
    pg.setAttribute('class', 'path-line');
    pathGroup.appendChild(pg);
  }

  const nodesGroup = $('#nodes-group');
  nodesGroup.innerHTML = '';
  nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let cls = 'node-group node-' + (n.type || 'normal');
    if (n.id === current) cls += ' current';
    else if (visitedSet.has(n.id)) cls += ' visited';
    if (availableSet.has(n.id) && !AppState.viewingSnapshot) cls += ' available-target';
    g.setAttribute('class', cls);
    g.setAttribute('transform', `translate(${n.x},${n.y})`);
    const r = 18;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', r);
    circle.setAttribute('class', 'node-circle');
    g.appendChild(circle);
    const iconMap = { start: '◉', target: '★', normal: '●', event: '✦', reward: '◆', danger: '⚠', flame: '✱' };
    const icon = iconMap[n.type || 'normal'] || '●';
    const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t1.setAttribute('y', 2);
    t1.setAttribute('class', 'node-text');
    t1.textContent = icon;
    g.appendChild(t1);
    const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t2.setAttribute('y', n.type === 'flame' ? 38 : 34);
    t2.setAttribute('class', 'node-subtext');
    t2.textContent = n.name;
    g.appendChild(t2);
    g.addEventListener('click', () => {
      if (AppState.viewingSnapshot) return;
      if (availableSet.has(n.id)) {
        const edge = edges.find(e =>
          ((e.from === current && e.to === n.id) || (e.to === current && e.from === n.id))
        );
        confirmMove(n.id, edge);
      }
    });
    nodesGroup.appendChild(g);
  });
}

function confirmMove(targetNode, edge) {
  const canUseTrans = AppState.currentState.translationSlots > 0 && edge && edge.switchReq > 0;
  const swNeed = (edge && edge.switchReq) || 0;
  const cur = AppState.currentState;
  const hasEnough = cur.railSwitchValue >= swNeed;
  const hasEnoughWithTrans = canUseTrans && cur.railSwitchValue >= Math.max(0, swNeed - 1);

  if (!hasEnough && !hasEnoughWithTrans) {
    showToast('换轨值不足', `需要 ${swNeed}，当前 ${cur.railSwitchValue}。${canUseTrans ? '可消耗转译槽减免 1 点换轨值。' : ''}`, 'negative');
    return;
  }

  if (!hasEnough && hasEnoughWithTrans) {
    if (confirm(`换轨值不足（需要 ${swNeed} / 当前 ${cur.railSwitchValue}）。\n是否消耗 1 个转译槽减免 1 点换轨值，完成此移动？`)) {
      doMove(targetNode, true);
    }
    return;
  }

  if (canUseTrans && swNeed > 0) {
    if (confirm(`前往【${getNodeName(targetNode)}】需要换轨值 ${swNeed}（当前 ${cur.railSwitchValue}）。\n\n[确定] 普通移动\n[取消] 消耗 1 转译槽（剩 ${cur.translationSlots}）减免 1 换轨值 + 增加 1 复写痕`)) {
      doMove(targetNode, false);
    } else {
      doMove(targetNode, true);
    }
    return;
  }

  doMove(targetNode, false);
}

function renderReplay() {
  const axis = $('#replay-axis');
  if (!AppState.history || AppState.history.length === 0) {
    axis.innerHTML = '<div class="empty-tip">尚无推演步骤，开始行动后将在此处记录。</div>';
    return;
  }
  axis.innerHTML = '';
  const latestIdx = AppState.history.length - 1;
  AppState.history.forEach((h, i) => {
    const item = document.createElement('div');
    let cls = 'step-item';
    if (AppState.replayIndex === i) cls += ' active';
    if (i === latestIdx && AppState.replayIndex < 0) cls += ' latest active';
    if (i === latestIdx && AppState.replayIndex === latestIdx) cls += ' latest';
    item.className = cls;
    const action = h.action || { type: 'init', description: '初始化' };
    const state = h.state || {};
    let sub = `节点: ${state.currentNode || '—'}`;
    if (action.switchUsed != null) sub += ` · 换轨${action.switchUsed}`;
    if (action.translationUsed) sub += ' · 转译';
    item.innerHTML = `
      <div class="step-num">${h.step}</div>
      <div class="step-content">
        <div class="step-action">${action.description || action.type || '—'}</div>
        <div class="step-sub">${sub}</div>
      </div>
      ${h.eventTriggered ? '<div class="step-event-dot" title="事件触发"></div>' : ''}
    `;
    item.addEventListener('click', () => viewReplayStep(i));
    axis.appendChild(item);
  });
  updateReplayStatus();
  axis.scrollTop = axis.scrollHeight;
}

async function viewReplayStep(idx) {
  if (!AppState.sessionId) return;
  try {
    const snap = await api('GET', `/api/sessions/${AppState.sessionId}/step/${idx}`);
    AppState.viewingSnapshot = snap.state;
    AppState.replayIndex = idx;
    renderStats();
    renderBoard();
    renderReplay();
  } catch (e) { showToast('回溯失败', e.message, 'negative'); }
}

async function exitReplay() {
  AppState.viewingSnapshot = null;
  AppState.replayIndex = -1;
  renderStats();
  renderBoard();
  renderReplay();
}

function updateReplayStatus() {
  const el = $('#replay-status');
  if (AppState.replayIndex >= 0) {
    el.textContent = `回放第 ${AppState.replayIndex} 步`;
    el.classList.add('viewing');
  } else {
    el.textContent = '实时推演';
    el.classList.remove('viewing');
  }
}

async function revertToStep() {
  if (AppState.replayIndex < 0) { showToast('请先选择步骤', '点击回放轴中的某一步再回溯', 'info'); return; }
  if (AppState.replayIndex === AppState.history.length - 1) { showToast('已是最新步骤', '无需回溯', 'info'); return; }
  if (!confirm(`将回溯到第 ${AppState.replayIndex} 步，之后的步骤将被删除。确认继续？`)) return;
  try {
    const data = await api('POST', `/api/sessions/${AppState.sessionId}/revert/${AppState.replayIndex}`);
    AppState.currentState = data.currentState;
    AppState.gameStatus = data.gameStatus;
    AppState.availableMoves = data.availableMoves || [];
    AppState.viewingSnapshot = null;
    AppState.replayIndex = -1;
    AppState.lastSettle = null;
    await refreshHistory();
    renderBoard();
    renderStats();
    renderReplay();
    renderSettle();
    saveLocalSession();
    showToast('回溯成功', `已回到第 ${data.revertedTo} 步`, 'positive');
  } catch (e) { showToast('回溯失败', e.message, 'negative'); }
}

async function doSettle() {
  if (!AppState.sessionId) return;
  try {
    const data = await api('POST', `/api/sessions/${AppState.sessionId}/settle`);
    AppState.lastSettle = data;
    renderSettle();
  } catch (e) { showToast('结算失败', e.message, 'negative'); }
}

function renderSettle() {
  const body = $('#settle-body');
  const s = AppState.lastSettle;
  if (!s) {
    body.innerHTML = '<div class="empty-tip">对局结束或点击"请求后端重算结算"后，将在此处展示详细结算。</div>';
    return;
  }
  const resultCls = s.result === 'victory' ? 'result-victory' : s.result === 'defeat' ? 'result-defeat' : '';
  const resultText = { victory: '✦ 推演成功 ✦', defeat: '✖ 推演失败 ✖', incomplete: '◈ 推演中断 ◈' }[s.result];
  const breakdown = s.detailBreakdown || [];
  const total = breakdown.reduce((a, b) => a + (b.value || 0), 0);

  body.innerHTML = `
    <div class="settle-hero ${resultCls}">
      <div class="settle-grade">${s.grade}</div>
      <div>
        <div class="settle-result-big">${resultText}</div>
        <div class="settle-game-name">${s.gameName} · 共 ${s.totalSteps} 步</div>
      </div>
      <div class="settle-score-big">
        <div class="score-num">${s.score}</div>
        <div class="score-lbl">后 端 重 算 积 分</div>
      </div>
    </div>

    <div class="settle-sections">
      <div class="settle-section">
        <h4>积分明细（后端重算）</h4>
        ${breakdown.map(b => `
          <div class="breakdown-row">
            <span class="breakdown-label">${b.label}</span>
            <span class="breakdown-value ${b.value > 0 ? 'pos' : b.value < 0 ? 'neg' : ''}">${b.value > 0 ? '+' : ''}${b.value}</span>
          </div>
        `).join('')}
        <div class="breakdown-total">
          <span class="breakdown-label">合计</span>
          <span class="breakdown-value">${total > 0 ? '+' : ''}${total}</span>
        </div>
      </div>

      <div class="settle-section">
        <h4>最终局面字段</h4>
        <div class="final-stats">
          <div class="final-stat"><span class="final-stat-label">换轨值</span><span class="final-stat-val">${s.finalState.railSwitchValue}</span></div>
          <div class="final-stat"><span class="final-stat-label">转译槽</span><span class="final-stat-val">${s.finalState.translationSlots}</span></div>
          <div class="final-stat"><span class="final-stat-label">复写痕</span><span class="final-stat-val">${s.finalState.rewriteTraces}</span></div>
          <div class="final-stat"><span class="final-stat-label">巳号风险</span><span class="final-stat-val">${s.finalState.siRisk}</span></div>
          <div class="final-stat"><span class="final-stat-label">申号奖励</span><span class="final-stat-val">${s.finalState.shenReward}</span></div>
          <div class="final-stat"><span class="final-stat-label">午号因子</span><span class="final-stat-val">${Math.max(0, s.finalState.wuFailureFactor || 0)}</span></div>
          <div class="final-stat"><span class="final-stat-label">隐藏条件</span><span class="final-stat-val">${s.finalState.hiddenUnlocked ? '★ 已触发' : '未触发'}</span></div>
          <div class="final-stat"><span class="final-stat-label">总步数</span><span class="final-stat-val">${s.totalSteps}</span></div>
        </div>
      </div>

      <div class="settle-section">
        <h4>完整航线路径</h4>
        <div class="path-string">${(s.finalState.path || []).map(p => p).join(' → ')}</div>
      </div>

      <div class="settle-section">
        <h4>事件触发时间线（${s.eventsFired.length}）</h4>
        ${s.eventsFired.length === 0 ? '<div class="empty-tip" style="padding:20px 8px">本局未触发任何事件</div>' : `
          <div class="events-timeline">
            ${s.eventsFired.map(e => `
              <div class="timeline-item ${e.type || 'mixed'}">
                <div><span class="timeline-step">第${e.step}步</span><span class="timeline-name">${e.name}</span></div>
                <div class="timeline-desc">${e.description || ''}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

function bindEvents() {
  $('#btn-select-game').addEventListener('click', showModal);
  $('#modal-close').addEventListener('click', hideModal);
  $('#modal-select').addEventListener('click', (e) => { if (e.target.id === 'modal-select') hideModal(); });

  $('#btn-new-session').addEventListener('click', async () => {
    if (!AppState.gameId) { showModal(); return; }
    if (AppState.gameStatus === 'playing' && !confirm('当前对局进行中，确定重开？')) return;
    startGame(AppState.gameId);
  });

  $('#btn-save-manual').addEventListener('click', () => {
    saveLocalSession();
    showToast('进度已保存', '当前对局进度已写入本地存储，刷新后可继续。', 'positive', 2500);
  });

  $('#btn-jump-start').addEventListener('click', () => { if (AppState.history.length) viewReplayStep(0); });
  $('#btn-prev').addEventListener('click', () => {
    const target = AppState.replayIndex < 0 ? (AppState.history.length - 2) : (AppState.replayIndex - 1);
    if (target >= 0) viewReplayStep(target);
    else exitReplay();
  });
  $('#btn-next').addEventListener('click', () => {
    if (AppState.replayIndex < 0) return;
    const target = AppState.replayIndex + 1;
    if (target < AppState.history.length) viewReplayStep(target);
    else exitReplay();
  });
  $('#btn-jump-end').addEventListener('click', exitReplay);

  $('#btn-revert').addEventListener('click', revertToStep);
  $('#btn-settle').addEventListener('click', doSettle);
}

async function init() {
  bindEvents();
  loadConfigCache();
  const restored = await restoreSession();
  if (!restored) {
    showModal();
    showToast('欢迎来到雪线缆屋', '请选择一局开始推演。巳局为推荐教学局。', 'info', 5000);
  }
}

async function loadConfigCache() {
  try {
    const list = await api('GET', '/api/games');
    window.__configCache = {};
    for (const g of list.games) {
      try {
        const resp = await fetch(`/api/games/${g.id}`).then(r => r.json());
        window.__configCache[g.id] = { events: (() => {
          const map = {};
          (resp.eventList || []).forEach(e => { map[e.id] = { ...e }; });
          return map;
        })() };
        if (window.__configCache[g.id] && AppState.history) {
          renderEvents(false);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', saveLocalSession);
