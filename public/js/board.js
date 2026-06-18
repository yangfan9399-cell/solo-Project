let _boardSize = 5;
let _replayIndex = -1;
let _replayPlaying = false;
let _replayTimer = null;

function renderBoard() {
  const boardEl = document.getElementById('chessboard');
  const state = getDisplayState();
  if (!state) {
    boardEl.innerHTML = '<div style="padding:40px;color:var(--text-muted);text-align:center;">🎮 请选择关卡开始</div>';
    return;
  }

  const size = state.boardSize;
  _boardSize = size;
  boardEl.style.gridTemplateColumns = `repeat(${size}, 60px)`;
  boardEl.innerHTML = '';

  const cellSize = 64;
  const padding = 16;
  const boardWidth = size * cellSize + padding * 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const cell = state.cells.find(c => c.x === x && c.y === y) || {};
      const el = document.createElement('div');
      el.className = 'cell';
      if (cell.lit) el.classList.add('lit');
      if (cell.blocked) el.classList.add('blocked');
      if (cell.sensor) {
        el.classList.add('sensor');
        if (state.sensorsActivated?.includes(`${x},${y}`)) el.classList.add('activated');
      }
      if (cell.reward) el.classList.add('reward');
      if (cell.hazard) el.classList.add('hazard');
      if (cell.goal) el.classList.add('goal');
      if (cell.start) el.classList.add('start');
      el.onclick = () => handleCellClick(x, y);
      el.title = `(${x},${y})${cell.lit?' · 已点亮':''}${cell.sensor?' · 巡测槽':''}${cell.reward?' · 卯号奖励':''}${cell.hazard?' · 辛号失败因子':''}${cell.goal?' · 目标':''}${cell.blocked?' · 障碍':''}`;
      boardEl.appendChild(el);
    }
  }

  state.players.forEach(p => {
    const token = document.createElement('div');
    token.className = `player-token p${p.id}`;
    if (state.currentPlayer === p.id && getDisplayStateIdx() === -1) token.classList.add('active');
    const totalPad = padding;
    const offsetX = totalPad + p.x * cellSize + (cellSize / 2 - 19);
    const offsetY = totalPad + p.y * cellSize + (cellSize / 2 - 19);
    token.style.position = 'absolute';
    token.style.left = offsetX + 'px';
    token.style.top = offsetY + 'px';
    token.textContent = p.id;
    boardEl.appendChild(token);
  });
}

function getDisplayState() {
  if (_replayIndex >= 0 && Game.replay[_replayIndex]) {
    return Game.replay[_replayIndex].stateAfter;
  }
  return Game.state;
}

function getDisplayStateIdx() {
  return _replayIndex;
}

function handleCellClick(x, y) {
  if (_replayIndex >= 0) return;
  if (!Game.state || Game.state.phase !== 'play') return;

  const cp = Game.currentPlayer();
  if (!cp) return;
  const dx = x - cp.x;
  const dy = y - cp.y;
  const dist = Math.abs(dx) + Math.abs(dy);
  if (dist === 1) {
    doMove(dx, dy);
  } else if (dist === 0) {
    lightCurrentCell();
  }
}

function moveCurrentPlayer(dx, dy) {
  if (_replayIndex >= 0) return;
  doMove(dx, dy);
}

async function doMove(dx, dy) {
  if (!Game.state || Game.state.phase !== 'play') return;
  const action = { playerId: Game.state.currentPlayer, type: 'move', dx, dy };
  const result = await Game.doAction(action);
  handleActionResult(result);
}

function lightCurrentCell() {
  if (_replayIndex >= 0) return;
  doLight();
}

async function doLight() {
  if (!Game.state || Game.state.phase !== 'play') return;
  const action = { playerId: Game.state.currentPlayer, type: 'light' };
  const result = await Game.doAction(action);
  handleActionResult(result);
}

async function doCoop() {
  if (_replayIndex >= 0) return;
  if (!Game.state || Game.state.phase !== 'play') return;
  const action = { playerId: Game.state.currentPlayer, type: 'coop' };
  const result = await Game.doAction(action);
  handleActionResult(result);
}

async function endTurn() {
  if (_replayIndex >= 0) return;
  if (!Game.state || Game.state.phase !== 'play') return;
  const action = { playerId: Game.state.currentPlayer, type: 'endTurn' };
  const result = await Game.doAction(action);
  handleActionResult(result);
}

function handleActionResult(result) {
  if (!result.valid) {
    showToast(result.message, 'error');
  } else {
    showToast(result.message, 'success');
  }
  renderAll();
  refreshReplayUI();
  maybeRefreshSettlement();
}

function renderPlayers() {
  const state = getDisplayState();
  const panel = document.getElementById('playersPanel');
  if (!state) { panel.innerHTML = ''; return; }

  panel.innerHTML = state.players.map(p => {
    const active = state.currentPlayer === p.id && getDisplayStateIdx() === -1;
    const maxEnergy = getLevelConfig().playerEnergy ?? 3;
    const energyPct = (p.energy / maxEnergy) * 100;
    return `
      <div class="player-info-card p${p.id} ${active ? 'active' : ''}">
        <div class="player-name-row">
          <div class="player-name">${active ? '▶ ' : ''}${p.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">(${p.x}, ${p.y})</div>
        </div>
        <div class="player-energy-bar">
          <div class="player-energy-fill" style="width:${energyPct}%;"></div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">
          ⚡ 能量：${p.energy} / ${maxEnergy}
        </div>
      </div>
    `;
  }).join('');
}

function getLevelConfig() {
  if (Game.level) return Game.level;
  const id = Game.getLevelId();
  const defaults = { chen: { playerEnergy: 4, energyPerTurn: 3, loseCondition: { turn: 15 }, winCondition: {} }, mao: { playerEnergy: 2, energyPerTurn: 1, loseCondition: { turn: 25 }, winCondition: {} }, xin: { playerEnergy: 3, energyPerTurn: 2, loseCondition: { turn: 30 }, winCondition: {} } };
  return defaults[id] || defaults.chen;
}

function renderMetrics() {
  const state = getDisplayState();
  const panel = document.getElementById('metricsPanel');
  if (!state) { panel.innerHTML = ''; return; }

  const items = [
    { cls: 'metric-xunran', label: '熏染值', value: state.xunran, max: 100, suffix: '' },
    { cls: 'metric-chen', label: '辰号风险', value: state.chenRisk, max: 100, suffix: '' },
    { cls: 'metric-mao', label: '卯号奖励', value: state.maoReward, max: Math.max(50, state.maoReward * 2), suffix: '' },
    { cls: 'metric-xin', label: '辛号失败因子', value: state.xinFailure, max: 100, suffix: '' }
  ];

  panel.innerHTML = items.map(m => `
    <div class="metric-card ${m.cls}">
      <div class="metric-label">${m.label}</div>
      <div class="metric-value">${m.value}<span style="font-size:12px;font-weight:600;color:var(--text-muted);">${m.suffix}</span></div>
      <div class="metric-bar">
        <div class="metric-bar-fill" style="width:${Math.min(100, (m.value/m.max)*100)}%;"></div>
      </div>
    </div>
  `).join('');
}

function renderBoardInfo() {
  const state = getDisplayState();
  if (!state) return;
  document.getElementById('turnIndicator').textContent = state.turn;
  const pname = state.currentPlayer === 1 ? '玩家甲行动' : '玩家乙行动';
  const badge = document.getElementById('playerTurnBadge');
  badge.textContent = getDisplayStateIdx() >= 0 ? '回放模式' : pname;
  badge.style.background = state.currentPlayer === 1
    ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
    : 'linear-gradient(135deg, #dc2626, #f97316)';
  if (getDisplayStateIdx() >= 0) {
    badge.style.background = 'linear-gradient(135deg, #f59e0b, #ec4899)';
  }
  document.getElementById('stepCount').textContent = state.stepCount;

  const banner = document.getElementById('phaseBanner');
  banner.className = 'phase-banner';
  if (state.phase === 'win') {
    banner.classList.add('win');
    banner.textContent = '🏆 恭喜闯关成功！前往结算簿查看成绩';
  } else if (state.phase === 'lose') {
    banner.classList.add('lose');
    banner.textContent = '💥 闯关失败！前往结算簿查看原因';
  }
}

function renderEventLog() {
  const log = Game.messageLog;
  const el = document.getElementById('eventLog');
  if (!log || log.length === 0) {
    el.innerHTML = '<div class="event-item">🎮 游戏开始，祝闯关顺利！</div>';
    return;
  }
  el.innerHTML = log.slice(0, 50).map(m => `
    <div class="event-item ${m.type || ''}">
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;">${UI.formatTime(m.time)}</div>
      ${m.text}
    </div>
  `).join('');
}

function renderGoals() {
  const state = getDisplayState();
  const panel = document.getElementById('goalPanel');
  if (!state) { panel.innerHTML = ''; return; }
  const id = Game.getLevelId();
  const goals = {
    chen: [
      { text: '熏染值达到 70', done: state.xunran >= 70, val: `${state.xunran}/70` },
      { text: '任一玩家到达目标格', done: state.cells.find(c => c.goal) && state.players.some(p => p.x === state.cells.find(c=>c.goal).x && p.y === state.cells.find(c=>c.goal).y), val: '' },
      { text: '15 回合内完成', done: state.turn <= 15, val: `回合 ${state.turn}/15` }
    ],
    mao: [
      { text: '熏染值达到 80', done: state.xunran >= 80, val: `${state.xunran}/80` },
      { text: '点亮 70% 格子', done: (() => { const lit = state.cells.filter(c=>c.lit).length; const tot = state.cells.filter(c=>!c.blocked).length; return (lit/tot) >= 0.7; })(), val: `${state.cells.filter(c=>c.lit).length}/${state.cells.filter(c=>!c.blocked).length}` },
      { text: '25 回合内完成', done: state.turn <= 25, val: `回合 ${state.turn}/25` }
    ],
    xin: [
      { text: '熏染值达到 85', done: state.xunran >= 85, val: `${state.xunran}/85` },
      { text: '任一玩家到达目标格', done: state.cells.find(c => c.goal) && state.players.some(p => { const g = state.cells.find(cc=>cc.goal); return g && p.x === g.x && p.y === g.y; }), val: '' },
      { text: '30 回合内完成', done: state.turn <= 30, val: `回合 ${state.turn}/30` },
      { text: '🔥 隐藏：辛号失败因子保持0', done: state.xinFailure === 0, val: `当前 ${state.xinFailure}` }
    ]
  };
  const g = goals[id] || goals.chen;
  panel.innerHTML = g.map(gg => `
    <div style="display:flex;align-items:center;gap:6px;padding:4px 0;">
      <span style="color:${gg.done ? 'var(--accent-green)' : 'var(--text-muted)'};">${gg.done ? '✅' : '⬜'}</span>
      <span style="${gg.done ? 'color:var(--accent-green);font-weight:600;' : ''}">${gg.text}</span>
      ${gg.val ? `<span style="margin-left:auto;font-size:10px;color:var(--text-muted);">${gg.val}</span>` : ''}
    </div>
  `).join('');
}

function renderAll() {
  renderBoard();
  renderPlayers();
  renderMetrics();
  renderBoardInfo();
  renderEventLog();
  renderGoals();
  updateLevelInfoBar();
}

function updateLevelInfoBar() {
  const bar = document.getElementById('levelInfoBar');
  if (!Game.state) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  const id = Game.getLevelId();
  const names = { chen: '星尘棋盘双人机关局·辰局', mao: '星尘棋盘双人机关局·卯局', xin: '星尘棋盘双人机关局·辛局' };
  const subs = { chen: '教学局·循循善诱', mao: '资源匮乏·分秒必争', xin: '隐藏秘境·慎之又慎' };
  document.getElementById('levelNameBadge').textContent = names[id];
  document.getElementById('levelSubtitleBadge').textContent = subs[id];
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    document.body.appendChild(toast);
  }
  const colors = {
    success: 'linear-gradient(135deg,#10b981,#06b6d4)',
    error: 'linear-gradient(135deg,#ef4444,#f97316)',
    info: 'linear-gradient(135deg,#3b82f6,#8b5cf6)'
  };
  Object.assign(toast.style, {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%) translateY(-20px)',
    padding: '12px 28px',
    borderRadius: '30px',
    background: colors[type] || colors.info,
    color: 'white',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    zIndex: '2000',
    opacity: '0',
    transition: 'all 0.3s ease'
  });
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
  }, 2000);
}

async function saveGame() {
  const ok = await Game.save();
  showToast(ok ? '💾 已保存到服务器存档' : '保存失败', ok ? 'success' : 'error');
}

window.renderBoard = renderBoard;
window.renderPlayers = renderPlayers;
window.renderMetrics = renderMetrics;
window.renderBoardInfo = renderBoardInfo;
window.renderEventLog = renderEventLog;
window.renderGoals = renderGoals;
window.renderAll = renderAll;
window.moveCurrentPlayer = moveCurrentPlayer;
window.lightCurrentCell = lightCurrentCell;
window.doCoop = doCoop;
window.endTurn = endTurn;
window.saveGame = saveGame;
window.getDisplayState = getDisplayState;
window.getDisplayStateIdx = () => _replayIndex;
window._setReplayIndex = (i) => { _replayIndex = i; };
window._getReplayPlaying = () => _replayPlaying;
window._setReplayPlaying = (v) => { _replayPlaying = v; };
window._setReplayTimer = (t) => { _replayTimer = t; };
window._getReplayTimer = () => _replayTimer;
