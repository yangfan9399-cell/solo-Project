const API_BASE = '';

const state = {
  currentView: 'home',
  sessionId: localStorage.getItem('sujing_session_id') || null,
  game: null,
  session: null,
  currentEventIndex: 0,
  replay: null,
  replayIndex: 0,
  hiddenProgress: null
};

function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => {
    el.className = 'toast';
  }, 2800);
}

function switchView(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
}

async function loadGames() {
  const res = await fetch(API_BASE + '/api/games');
  const games = await res.json();
  const container = document.getElementById('game-list');
  container.innerHTML = games.map(g => `
    <div class="game-card ${g.id}" data-game="${g.id}">
      <h3>${g.name}</h3>
      <div class="game-subtitle">${g.subtitle}</div>
      <div class="game-desc">${g.description}</div>
      <span class="game-tag">点击开始</span>
    </div>
  `).join('');
  container.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => startGame(card.dataset.game));
  });

  if (state.sessionId) {
    try {
      const res2 = await fetch(API_BASE + '/api/sessions/' + state.sessionId);
      if (res2.ok) {
        const data = await res2.json();
        state.session = data.session;
        state.game = data.game;
        state.hiddenProgress = data.hiddenProgress || null;
        if (!state.session.finished) {
          showResumeCard();
        }
      } else {
        localStorage.removeItem('sujing_session_id');
        state.sessionId = null;
      }
    } catch (e) {}
  }
}

function showResumeCard() {
  document.getElementById('resume-section').style.display = 'block';
  document.getElementById('resume-card').innerHTML = `
    <div class="resume-info">
      <h3>${state.game.name}</h3>
      <p>当前回合：${state.session.turn} / ${state.game.winCondition.maxTurns} · 定标值：${state.session.state.calibration}</p>
    </div>
    <div class="resume-action">继续闯关 →</div>
  `;
  document.getElementById('resume-card').addEventListener('click', () => {
    enterGame();
  });
}

async function startGame(gameId) {
  const res = await fetch(API_BASE + '/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, playerA: '玩家A', playerB: '玩家B' })
  });
  if (!res.ok) {
    toast('启动游戏失败', 'error');
    return;
  }
  const data = await res.json();
  state.sessionId = data.sessionId;
  state.game = data.game;
  localStorage.setItem('sujing_session_id', state.sessionId);
  await loadSession();
  enterGame();
  toast(`${data.game.name} 已启动`, 'success');
}

async function loadSession() {
  const res = await fetch(API_BASE + '/api/sessions/' + state.sessionId);
  if (!res.ok) {
    toast('会话加载失败', 'error');
    return;
  }
  const data = await res.json();
  state.session = data.session;
  state.game = data.game;
  state.hiddenProgress = data.hiddenProgress || null;
  if (state.session.finished) {
    showResult(data.session.result);
  }
}

function enterGame() {
  ['tab-board', 'tab-events', 'tab-replay', 'tab-result'].forEach(id => {
    document.getElementById(id).disabled = false;
  });
  document.getElementById('resume-section').style.display = 'none';
  switchView('board');
  renderBoard();
  renderEvents();
}

function renderBoard() {
  document.querySelector('.game-info').innerHTML = `
    <h2>${state.game.name}</h2>
    <p>${state.game.subtitle}</p>
  `;
  document.getElementById('turn-number').textContent = state.session.turn;
  const s = state.session.state;

  setMetric('calibration', s.calibration, 150);
  document.getElementById('metric-slots-used').textContent = s.sealingSlots.used;
  document.getElementById('metric-slots-total').textContent = s.sealingSlots.total;
  document.getElementById('bar-slots').style.width = (s.sealingSlots.total > 0 ? (s.sealingSlots.used / s.sealingSlots.total * 100) : 0) + '%';
  setMetric('shift', s.shiftMarks, 10);
  setMetric('risk', s.unitaryRisk, state.game.winCondition.maxRisk);
  setMetric('reward', s.shenReward, 100);
  setMetric('yin', s.yinFailure, 5);

  renderHiddenProgress();
  renderMap();
  renderActions();
}

function setMetric(name, value, max) {
  document.getElementById('metric-' + name).textContent = value;
  document.getElementById('bar-' + name).style.width = Math.min(100, value / max * 100) + '%';
}

function renderHiddenProgress() {
  const container = document.getElementById('hidden-progress');
  if (!state.hiddenProgress) {
    container.style.display = 'none';
    return;
  }
  const p = state.hiddenProgress;
  container.style.display = 'block';

  let timerHtml = '';
  if (p.triggered) {
    timerHtml = '<span class="urgent">★ 已触发！</span>';
  } else if (p.turnPassed) {
    timerHtml = '<span class="urgent">已错过触发时机</span>';
  } else {
    const urgent = p.turnRemaining <= 2 ? ' class="urgent"' : '';
    timerHtml = `剩余 <span${urgent}>${p.turnRemaining}</span> 回合`;
  }

  container.innerHTML = `
    <div class="hidden-progress-header">
      <div class="hidden-progress-title">
        <h3>隐藏条件 · ${p.name}</h3>
        <span class="hidden-progress-badge ${p.triggered ? 'triggered' : ''}">
          ${p.triggered ? '★ 已激活' : '未触发'}
        </span>
      </div>
      <div class="hidden-progress-timer">${timerHtml}</div>
    </div>
    <div class="hidden-progress-desc">${p.description}</div>
    <div class="hidden-requirements">
      ${p.requirements.map(r => `
        <div class="hidden-req-item ${r.met ? 'met' : ''}">
          <div class="req-field">${r.field}</div>
          <div class="req-values">
            <span class="req-current">${r.current}</span>
            <span class="req-target">/ ${r.target}</span>
          </div>
          <div class="req-status">${r.met ? '✓ 已达成' : '还差 ' + Math.max(0, r.target - r.current)}</div>
          <div class="req-bar">
            <div class="req-bar-fill" style="width:${Math.min(100, r.current / r.target * 100)}%"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMap() {
  const container = document.getElementById('board-map');
  const maxX = Math.max(...state.game.map.map(n => n.x));
  const maxY = Math.max(...state.game.map.map(n => n.y));
  const grid = document.createElement('div');
  grid.className = 'map-grid';
  grid.style.gridTemplateColumns = `repeat(${maxX + 1}, 1fr)`;
  const typeNames = {
    start: '起点', end: '终点', puzzle: '谜题', mechanism: '机关',
    event: '事件', hazard: '风险', hidden: '隐藏'
  };
  const sorted = [...state.game.map].sort((a, b) => (a.y * 10 + a.x) - (b.y * 10 + b.x));
  sorted.forEach(node => {
    const div = document.createElement('div');
    div.className = `map-node ${node.type}`;
    div.innerHTML = `
      <div class="node-name">${node.name}</div>
      <div class="node-type">${typeNames[node.type] || node.type}</div>
    `;
    grid.appendChild(div);
  });
  container.innerHTML = '<h3>碎镜书房地图</h3>';
  container.appendChild(grid);
}

function renderActions() {
  const container = document.getElementById('actions-list');
  container.innerHTML = state.game.actions.map(a => {
    const cd = state.session.actionCooldowns[a.id] || 0;
    const costs = [];
    if (a.cost) {
      if (a.cost.sealingSlots) costs.push(`封存槽×${a.cost.sealingSlots}`);
      if (a.cost.shiftMarks) costs.push(`换轨痕×${a.cost.shiftMarks}`);
      if (a.cost.calibration) costs.push(`定标值-${a.cost.calibration}`);
      if (a.cost.shenReward) costs.push(`申号奖励-${a.cost.shenReward}`);
    }
    const disabled = cd > 0;
    return `
      <button class="action-btn" data-action="${a.id}" ${disabled ? 'disabled' : ''}>
        <div class="action-name">${a.name}${cd > 0 ? `（冷却${cd}回合）` : ''}</div>
        <div class="action-desc">${costs.length ? '消耗：' + costs.join('，') : '无消耗'}</div>
      </button>
    `;
  }).join('');
  container.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => executeAction(btn.dataset.action));
  });
  document.getElementById('btn-end-turn').onclick = endGame;
}

async function executeAction(actionId) {
  const res = await fetch(API_BASE + `/api/sessions/${state.sessionId}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId })
  });
  if (!res.ok) {
    const err = await res.json();
    toast(err.error || '操作失败', 'error');
    return;
  }
  const data = await res.json();
  state.session.state = data.state;
  state.session.turn = data.turn;
  state.session.actionCooldowns = data.actionCooldowns;
  state.session.history.push({ action: data.action, event: data.event, state: data.state });
  if (data.hiddenProgress) {
    state.hiddenProgress = data.hiddenProgress;
    if (data.hiddenProgress.triggered && !state.session.hiddenTriggered) {
      state.session.hiddenTriggered = true;
    }
  }

  let msg = `执行：${data.action.name}`;
  if (data.event) {
    msg += ` | 触发事件：${data.event.name}`;
    if (data.event.triggered) {
      msg += ` ★ ${data.event.triggered}达成！`;
    }
  }
  toast(msg, 'success');
  renderBoard();
  renderEvents();

  if (state.session.turn > state.game.winCondition.maxTurns) {
    toast('已达最大回合数，将自动结算', '');
    setTimeout(endGame, 1500);
  }
}

function renderEvents() {
  const container = document.getElementById('events-timeline');
  container.innerHTML = state.game.events.map((ev, idx) => {
    const currentTurn = state.session.turn;
    let cls = 'future';
    if (ev.turn < currentTurn) cls = 'past';
    else if (ev.turn === currentTurn) cls = 'current';
    const triggeredExtra = ev.checkCondition && state.session.hiddenTriggered && ev.turn <= currentTurn
      ? `<div class="event-triggered"><strong>★ 碎镜共鸣已触发！</strong> 获得额外加成：定标值+30，换轨痕+2，申号奖励+25</div>`
      : '';
    return `
      <div class="event-item ${cls}">
        <div class="event-turn">第 ${ev.turn} 回合</div>
        <div class="event-name">${ev.name}</div>
        <div class="event-hint">${ev.hint}</div>
        ${triggeredExtra}
      </div>
    `;
  }).join('');
}

async function endGame() {
  const res = await fetch(API_BASE + `/api/sessions/${state.sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json();
    toast(err.error || '结算失败', 'error');
    return;
  }
  const result = await res.json();
  state.session.finished = true;
  state.session.result = result;
  localStorage.removeItem('sujing_session_id');
  showResult(result);
}

function showResult(result) {
  switchView('result');
  document.getElementById('result-title').textContent = `${state.game.name} · 结算簿`;
  const content = document.getElementById('result-content');
  content.innerHTML = `
    <div class="result-score">
      <div class="score-number">${result.totalScore}</div>
      <div class="score-rank">${result.rank}</div>
      <div class="score-win ${result.win ? 'win' : 'lose'}">${result.win ? '闯关成功' : '闯关失败'}</div>
    </div>
    <div class="result-details">
      <h3>结算明细</h3>
      <div class="detail-row" style="font-weight:bold; color:var(--text-muted); font-size:12px;">
        <div>指标</div><div>当前值</div><div>目标</div><div>通过</div>
      </div>
      ${result.details.map(d => `
        <div class="detail-row">
          <div class="detail-field">${d.field}</div>
          <div class="detail-value">${d.value}</div>
          <div class="detail-target">${d.target}</div>
          <div class="detail-pass ${d.pass ? 'pass' : 'fail'}">${d.pass ? '✓' : '✗'}</div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('btn-back-home').onclick = () => {
    resetAndGoHome();
  };
  document.getElementById('btn-new-game').onclick = () => {
    resetAndGoHome();
  };
}

function resetAndGoHome() {
  state.session = null;
  state.game = null;
  state.sessionId = null;
  localStorage.removeItem('sujing_session_id');
  ['tab-board', 'tab-events', 'tab-replay', 'tab-result'].forEach(id => {
    document.getElementById(id).disabled = true;
  });
  document.querySelector('[data-view="home"]').classList.add('active');
  switchView('home');
  loadGames();
}

async function loadReplay() {
  if (!state.sessionId) {
    toast('无游戏会话可回放', 'error');
    return;
  }
  const res = await fetch(API_BASE + `/api/replays/${state.sessionId}`);
  if (!res.ok) {
    toast('回放加载失败', 'error');
    return;
  }
  const data = await res.json();
  state.replay = data.replay;
  state.game = data.game;
  state.replayIndex = state.replay.length > 0 ? state.replay.length - 1 : 0;
  renderReplay();
}

function renderReplay() {
  const timeline = document.getElementById('replay-timeline');
  timeline.innerHTML = state.replay.length === 0
    ? '<p style="color:var(--text-muted); text-align:center; padding:20px;">暂无回放记录</p>'
    : state.replay.map((step, idx) => {
        let hiddenBadge = '';
        if (step.hiddenProgress) {
          const metCount = step.hiddenProgress.requirements.filter(r => r.met).length;
          const triggered = step.hiddenProgress.triggered;
          hiddenBadge = `<div class="step-hidden ${triggered ? 'triggered' : ''}">${triggered ? '★ ' : ''}隐藏 ${metCount}/3</div>`;
        }
        return `
          <div class="replay-step ${idx === state.replayIndex ? 'active' : ''}" data-idx="${idx}">
            <div class="step-turn">第 ${step.turn} 回合</div>
            <div class="step-action">${step.actionName}</div>
            ${hiddenBadge}
          </div>
        `;
      }).join('');
  timeline.querySelectorAll('.replay-step').forEach(step => {
    step.addEventListener('click', () => {
      state.replayIndex = parseInt(step.dataset.idx);
      renderReplay();
    });
  });

  document.getElementById('replay-progress').textContent =
    state.replay.length === 0 ? '0 / 0' : `${state.replayIndex + 1} / ${state.replay.length}`;

  const statePanel = document.getElementById('replay-state');
  if (state.replay.length > 0) {
    const step = state.replay[state.replayIndex];
    const s = step.state;
    let hiddenHtml = '';
    if (step.hiddenProgress) {
      const p = step.hiddenProgress;
      hiddenHtml = `
        <div class="replay-hidden-section">
          <div class="replay-hidden-header">
            <strong>隐藏条件 · ${p.name}</strong>
            <span class="replay-hidden-badge ${p.triggered ? 'triggered' : ''}">
              ${p.triggered ? '★ 已触发' : (p.turnPassed ? '已错过' : '未触发')}
            </span>
          </div>
          <div class="replay-hidden-reqs">
            ${p.requirements.map(r => `
              <div class="replay-hidden-req ${r.met ? 'met' : ''}">
                <span class="req-field">${r.field}</span>
                <span class="req-value">${r.current}/${r.target}</span>
                <span class="req-status">${r.met ? '✓' : '✗'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    statePanel.innerHTML = `
      <h4>第 ${step.turn} 回合状态快照</h4>
      <div class="state-grid">
        <div class="state-item"><div class="state-label">碎镜书房定标值</div><div class="state-value">${s.calibration}</div></div>
        <div class="state-item"><div class="state-label">封存槽</div><div class="state-value">${s.sealingSlots.used}/${s.sealingSlots.total}</div></div>
        <div class="state-item"><div class="state-label">换轨痕</div><div class="state-value">${s.shiftMarks}</div></div>
        <div class="state-item"><div class="state-label">酉号风险</div><div class="state-value">${s.unitaryRisk}</div></div>
        <div class="state-item"><div class="state-label">申号奖励</div><div class="state-value">${s.shenReward}</div></div>
        <div class="state-item"><div class="state-label">寅号失败因子</div><div class="state-value">${s.yinFailure}</div></div>
      </div>
      ${hiddenHtml}
      ${step.event ? `<p style="margin-top:16px; color:var(--accent-gold); font-size:13px;">事件：${step.event.name} — ${step.event.hint}</p>` : ''}
    `;
  } else {
    statePanel.innerHTML = '<p style="color:var(--text-muted);">开始游戏后，每一步都会自动记录到回放轴。</p>';
  }
}

document.getElementById('replay-prev').addEventListener('click', () => {
  if (state.replayIndex > 0) {
    state.replayIndex--;
    renderReplay();
  }
});
document.getElementById('replay-next').addEventListener('click', () => {
  if (state.replay && state.replayIndex < state.replay.length - 1) {
    state.replayIndex++;
    renderReplay();
  }
});

document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    if (tab.disabled) return;
    const view = tab.dataset.view;
    switchView(view);
    if (view === 'replay') loadReplay();
  });
});

loadGames();
