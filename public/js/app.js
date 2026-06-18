const API_BASE = '/api';
const STORAGE_KEY = 'liuli_greenhouse_session';

const state = {
  games: [],
  currentGame: null,
  currentSession: null,
  currentGameData: null,
  replayHistory: [],
  currentReplayStep: 0,
  isReplaying: false,
  replayInterval: null,
  lastDelta: null,
  viewMode: 'latest'
};

async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast('网络请求失败', 'error');
    return null;
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatDelta(value) {
  if (value > 0) return `<span class="delta-positive">+${value}</span>`;
  if (value < 0) return `<span class="delta-negative">${value}</span>`;
  return `<span class="delta-neutral">0</span>`;
}

function getSlotClass(value, gameId) {
  if (gameId === 'bing') {
    if (value >= 30 && value <= 70) return 'good';
    if (value < 15 || value > 85) return 'danger';
    return 'warning';
  }
  if (gameId === 'you') {
    if (value === 66) return 'good';
    if (value < 20 || value > 90) return 'danger';
    return 'warning';
  }
  if (value >= 40 && value <= 80) return 'good';
  if (value < 20 || value > 90) return 'danger';
  return 'warning';
}

function getTargetHint(gameId) {
  if (gameId === 'bing') return '目标: 30-70';
  if (gameId === 'mao') return '目标: 尽可能高';
  if (gameId === 'you') return '目标: 66';
  return '目标: 平衡';
}

async function loadGames() {
  const data = await apiRequest(`${API_BASE}/games`);
  if (data && data.games) {
    state.games = data.games;
    renderGameList();
  }
}

function renderGameList() {
  const container = document.getElementById('gameList');
  container.innerHTML = state.games.map(game => `
    <div class="game-card ${state.currentGame === game.id ? 'active' : ''}" data-game="${game.id}">
      <div class="game-card-name">${game.name}</div>
      <div class="game-card-desc">${game.description}</div>
      <div class="game-card-meta">
        <span class="difficulty-badge difficulty-${game.difficulty}">${game.difficulty}</span>
        <span>${game.maxSteps}步</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => selectGame(card.dataset.game));
  });
}

async function selectGame(gameId) {
  stopReplay();
  
  const savedSession = localStorage.getItem(`${STORAGE_KEY}_${gameId}`);
  
  if (savedSession) {
    try {
      const sessionData = JSON.parse(savedSession);
      const data = await apiRequest(`${API_BASE}/sessions/${sessionData.sessionId}`);
      if (data && data.session) {
        state.currentSession = data.session;
        state.currentGame = gameId;
        state.lastDelta = null;
        state.currentReplayStep = data.session.currentStep;
        state.viewMode = 'latest';
        await loadGameData(gameId);
        await loadReplayHistory();
        saveCurrentSession();
        renderAll();
        if (data.session.isFinished) {
          showToast(`恢复 ${state.currentGameData.name}（已结束，可查看结算）`, 'info');
        } else {
          showToast(`恢复之前的 ${state.currentGameData.name} 进度`, 'info');
        }
        return;
      }
    } catch (e) {
      console.log('No valid saved session, starting new');
    }
  }

  const data = await apiRequest(`${API_BASE}/sessions`, {
    method: 'POST',
    body: JSON.stringify({ gameId })
  });

  if (data && data.session) {
    state.currentSession = data.session;
    state.currentGame = gameId;
    state.currentReplayStep = 0;
    state.viewMode = 'latest';
    state.lastDelta = null;
    await loadGameData(gameId);
    await loadReplayHistory();
    saveCurrentSession();
    renderAll();
    showToast(`开始 ${state.currentGameData.name}`, 'success');
  }
}

async function loadGameData(gameId) {
  const data = await apiRequest(`${API_BASE}/games/${gameId}`);
  if (data) {
    state.currentGameData = data;
    document.body.className = `theme-${data.map.theme}`;
  }
}

async function loadReplayHistory() {
  if (!state.currentSession) return;
  const data = await apiRequest(`${API_BASE}/sessions/${state.currentSession.sessionId}/replay`);
  if (data) {
    state.replayHistory = data.history;
    state.currentReplayStep = data.currentStep;
    state.viewMode = 'latest';
  }
}

function saveCurrentSession() {
  if (state.currentSession && state.currentGame) {
    localStorage.setItem(`${STORAGE_KEY}_${state.currentGame}`, JSON.stringify({
      sessionId: state.currentSession.sessionId,
      gameId: state.currentGame,
      savedAt: Date.now()
    }));
    localStorage.setItem(STORAGE_KEY, state.currentGame);
  }
}

function renderAll() {
  renderGameList();
  renderBoard();
  renderEvents();
  renderReplayTimeline();
  renderGameInfo();
  updateHeader();
  updateSettleButton();
}

function updateHeader() {
  document.getElementById('currentGame').textContent = 
    state.currentGameData ? state.currentGameData.name : '未选择游戏';
  document.getElementById('stepCount').textContent = 
    state.currentSession ? state.currentSession.currentStep : 0;
  document.getElementById('maxSteps').textContent = 
    state.currentGameData ? state.currentGameData.maxSteps : '-';
}

function getDisplayState() {
  if (state.viewMode === 'replay' && state.replayHistory[state.currentReplayStep]) {
    return state.replayHistory[state.currentReplayStep].state;
  }
  return state.currentSession ? state.currentSession.currentState : null;
}

function renderBoard() {
  const displayState = getDisplayState();
  if (!displayState) return;

  const invertedEl = document.getElementById('invertedValue');
  const invertedDeltaEl = document.getElementById('invertedDelta');
  
  invertedEl.textContent = displayState.invertedValue;
  if (state.lastDelta && state.viewMode === 'latest') {
    invertedDeltaEl.innerHTML = formatDelta(state.lastDelta.invertedValue);
    invertedEl.classList.add('changed');
    setTimeout(() => invertedEl.classList.remove('changed'), 500);
  } else {
    invertedDeltaEl.innerHTML = '';
  }

  renderBalanceSlots(displayState);
  renderMeasureTraces(displayState);
  renderStatusFactors(displayState);
}

function renderBalanceSlots(displayState) {
  const container = document.getElementById('balanceSlots');
  const slots = state.currentGameData.map.slots;
  const values = displayState.balanceSlots;
  const secretUnlocked = displayState.secretUnlocked;

  container.innerHTML = slots.map((slot, i) => {
    const value = values[i] || 0;
    const isHidden = slot.hidden && !secretUnlocked;
    const fillHeight = Math.min(100, Math.max(0, value));
    const slotClass = getSlotClass(value, state.currentGame);
    const unlocked = slot.hidden && secretUnlocked;
    
    return `
      <div class="balance-slot ${isHidden ? 'hidden-slot' : ''} ${unlocked ? 'unlocked' : ''}" data-slot="${i}">
        <div class="slot-name">${slot.name}</div>
        <div class="slot-bar">
          <div class="slot-fill ${slotClass} ${state.lastDelta && state.viewMode === 'latest' && (state.lastDelta.balanceSlots[i] !== 0) ? 'changed' : ''}" 
               style="height: ${fillHeight}%"></div>
        </div>
        <div class="slot-value">${isHidden ? '?' : value}</div>
        <div class="slot-delta">
          ${state.lastDelta && state.viewMode === 'latest' && !isHidden ? formatDelta(state.lastDelta.balanceSlots[i]) : ''}
        </div>
        <div class="slot-target">${isHidden ? '???' : getTargetHint(state.currentGame)}</div>
      </div>
    `;
  }).join('');
}

function renderMeasureTraces(displayState) {
  const container = document.getElementById('tracesChart');
  const traces = displayState.measureTraces || [];
  const maxValue = Math.max(...traces.map(t => t.value), 100);
  
  container.innerHTML = traces.map(trace => {
    const height = (trace.value / maxValue) * 100;
    let traceClass = '';
    if (trace.secret) traceClass = 'secret';
    else if (trace.stable) traceClass = 'stable';
    else traceClass = 'unstable';
    
    return `<div class="trace-bar ${traceClass}" 
                style="height: ${Math.max(5, height)}%" 
                data-value="${trace.value}"></div>`;
  }).join('');
}

function renderStatusFactors(displayState) {
  const factors = ['riskC', 'rewardM', 'failureY'];
  const names = ['riskC', 'rewardM', 'failureY'];
  
  factors.forEach((factor, i) => {
    const el = document.getElementById(factor);
    const deltaEl = document.getElementById(`${factor}Delta`);
    
    el.textContent = displayState[factor];
    
    if (state.lastDelta && state.viewMode === 'latest') {
      const delta = state.lastDelta[names[i]];
      deltaEl.innerHTML = formatDelta(delta);
      el.classList.add('changed');
      setTimeout(() => el.classList.remove('changed'), 500);
    } else {
      deltaEl.innerHTML = '';
    }
  });

  const htFactor = document.getElementById('hiddenTriggerFactor');
  const htEl = document.getElementById('hiddenTrigger');
  const htDeltaEl = document.getElementById('hiddenTriggerDelta');
  
  if (displayState.hiddenTrigger !== undefined) {
    htFactor.style.display = '';
    htEl.textContent = displayState.hiddenTrigger;
    if (state.lastDelta && state.viewMode === 'latest' && state.lastDelta.hiddenTrigger) {
      htDeltaEl.innerHTML = formatDelta(state.lastDelta.hiddenTrigger);
      htEl.classList.add('changed');
      setTimeout(() => htEl.classList.remove('changed'), 500);
    } else {
      htDeltaEl.innerHTML = '';
    }
  } else {
    htFactor.style.display = 'none';
  }
}

function renderEvents() {
  const container = document.getElementById('eventsGrid');
  
  if (!state.currentGameData || !state.currentSession) {
    container.innerHTML = '<div class="empty-state">选择游戏后加载事件</div>';
    return;
  }

  const displayState = getDisplayState();
  const isDisabled = state.currentSession.isFinished || state.viewMode === 'replay';

  container.innerHTML = state.currentGameData.events.map(event => {
    let canAfford = true;
    if (event.cost) {
      if (event.cost.riskC && displayState.riskC < event.cost.riskC) canAfford = false;
      if (event.cost.rewardM && displayState.rewardM < event.cost.rewardM) canAfford = false;
    }

    const costTags = [];
    if (event.cost) {
      if (event.cost.riskC) costTags.push(`<span class="cost-tag cost-risk">丙号-${event.cost.riskC}</span>`);
      if (event.cost.rewardM) costTags.push(`<span class="cost-tag cost-reward">卯号-${event.cost.rewardM}</span>`);
    }
    if (costTags.length === 0) costTags.push(`<span class="cost-tag cost-free">免费</span>`);

    return `
      <div class="event-card ${(isDisabled || !canAfford) ? 'disabled' : ''}" data-event="${event.id}">
        <div class="event-name">${event.name}</div>
        <div class="event-description">${event.description}</div>
        <div class="event-cost">${costTags.join('')}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('click', () => {
      if (!card.classList.contains('disabled')) {
        executeEvent(card.dataset.event, card);
      }
    });
  });
}

async function executeEvent(eventId, cardElement) {
  if (!state.currentSession) return;

  cardElement.classList.add('executing');
  setTimeout(() => cardElement.classList.remove('executing'), 500);

  const wasSecret = state.currentSession.currentState.secretUnlocked;

  const data = await apiRequest(`${API_BASE}/sessions/${state.currentSession.sessionId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ eventId })
  });

  if (data && data.success) {
    state.currentSession = data.session;
    state.lastDelta = data.delta;
    state.currentReplayStep = data.session.currentStep;
    state.viewMode = 'latest';
    
    await loadReplayHistory();
    saveCurrentSession();
    renderAll();

    if (!wasSecret && data.session.currentState.secretUnlocked) {
      showSecretAnimation();
    }

    if (data.result) {
      showResultModal(data.result);
      updateSettleButton();
    }
  } else if (data && data.error) {
    showToast(data.error, 'error');
  }
}

function showSecretAnimation() {
  const el = document.createElement('div');
  el.className = 'secret-unlocked';
  el.textContent = '✦ 隐藏裂隙解锁 ✦';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
  showToast('隐藏条件已触发！第四配平槽解锁', 'info');
}

function showResultModal(result) {
  const modal = document.getElementById('resultModal');
  const title = document.getElementById('resultTitle');
  const message = document.getElementById('resultMessage');

  title.textContent = result.type === 'win' ? '🎉 修复成功！' : '💔 修复失败';
  message.textContent = result.message;

  modal.classList.remove('hidden');
}

function renderReplayTimeline() {
  const container = document.getElementById('replayTimeline');
  
  if (state.replayHistory.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
    return;
  }

  container.innerHTML = state.replayHistory.map((step, i) => {
    let stepClass = 'timeline-step';
    if (i === state.currentReplayStep && state.viewMode === 'replay') stepClass += ' active';
    if (i === state.replayHistory.length - 1 && state.viewMode === 'latest') stepClass += ' active';
    if (step.result && step.result.type === 'win') stepClass += ' win';
    if (step.result && step.result.type === 'lose') stepClass += ' lose';

    return `
      <div class="${stepClass}" data-step="${i}">
        <div class="step-number">${i}</div>
        <div class="step-name">${step.eventName || '开始'}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.timeline-step').forEach(el => {
    el.addEventListener('click', () => {
      stopReplay();
      const step = parseInt(el.dataset.step);
      state.currentReplayStep = step;
      state.viewMode = 'replay';
      renderBoard();
      renderEvents();
      renderReplayDetail(step);
      updateReplayControls();
      
      document.querySelectorAll('.timeline-step').forEach(s => s.classList.remove('active'));
      el.classList.add('active');
    });
  });

  updateReplayControls();
}

function renderReplayDetail(stepIndex) {
  const container = document.getElementById('replayDetail');
  const step = state.replayHistory[stepIndex];
  
  if (!step) {
    container.innerHTML = '<div class="empty-state">选择步骤查看详情</div>';
    return;
  }

  const s = step.state;
  const d = step.delta;
  
  let html = `
    <div class="detail-row">
      <span class="detail-label">步骤</span>
      <span class="detail-value">${step.step}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">事件</span>
      <span class="detail-value">${step.eventName || '-'}</span>
    </div>
  `;

  if (d) {
    html += `
      <div class="detail-row">
        <span class="detail-label">倒排值</span>
        <span class="detail-value">${s.invertedValue} ${formatDelta(d.invertedValue)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">配平槽</span>
        <span class="detail-value">[${s.balanceSlots.join(', ')}]</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">丙号风险</span>
        <span class="detail-value">${s.riskC} ${formatDelta(d.riskC)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">卯号奖励</span>
        <span class="detail-value">${s.rewardM} ${formatDelta(d.rewardM)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">酉号因子</span>
        <span class="detail-value">${s.failureY} ${formatDelta(d.failureY)}</span>
      </div>
    `;
    if (s.hiddenTrigger !== undefined) {
      html += `
        <div class="detail-row">
          <span class="detail-label">隐藏触发</span>
          <span class="detail-value">${s.hiddenTrigger} ${d.hiddenTrigger ? formatDelta(d.hiddenTrigger) : ''}</span>
        </div>
      `;
    }
    if (d.secretUnlocked === true) {
      html += `
        <div class="detail-row">
          <span class="detail-label">隐藏解锁</span>
          <span class="detail-value" style="color: #a78bfa;">✓ 已触发</span>
        </div>
      `;
    }
  } else {
    html += `
      <div class="detail-row">
        <span class="detail-label">倒排值</span>
        <span class="detail-value">${s.invertedValue}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">配平槽</span>
        <span class="detail-value">[${s.balanceSlots.join(', ')}]</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">丙号风险</span>
        <span class="detail-value">${s.riskC}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">卯号奖励</span>
        <span class="detail-value">${s.rewardM}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">酉号因子</span>
        <span class="detail-value">${s.failureY}</span>
      </div>
    `;
  }

  if (step.result) {
    html += `
      <div class="detail-row" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <span class="detail-label">结果</span>
        <span class="detail-value" style="color: ${step.result.type === 'win' ? '#4ade80' : '#f87171'};">
          ${step.result.type === 'win' ? '胜利' : '失败'}
        </span>
      </div>
    `;
  }

  container.innerHTML = html;
}

function updateReplayControls() {
  const prevBtn = document.getElementById('btnReplayPrev');
  const playBtn = document.getElementById('btnReplayPlay');
  const nextBtn = document.getElementById('btnReplayNext');
  const latestBtn = document.getElementById('btnReplayLatest');

  const maxStep = state.replayHistory.length - 1;
  
  prevBtn.disabled = state.currentReplayStep <= 0;
  nextBtn.disabled = state.currentReplayStep >= maxStep;
  latestBtn.disabled = state.viewMode === 'latest' || state.currentReplayStep >= maxStep;
  
  playBtn.classList.toggle('playing', state.isReplaying);
  playBtn.textContent = state.isReplaying ? '⏸' : '▶';
}

function stepReplay(direction) {
  stopReplay();
  const maxStep = state.replayHistory.length - 1;
  const newStep = Math.max(0, Math.min(maxStep, state.currentReplayStep + direction));
  
  if (newStep !== state.currentReplayStep) {
    state.currentReplayStep = newStep;
    state.viewMode = 'replay';
    renderBoard();
    renderEvents();
    renderReplayDetail(newStep);
    renderReplayTimeline();
  }
}

function toggleReplay() {
  if (state.isReplaying) {
    stopReplay();
  } else {
    startReplay();
  }
}

function startReplay() {
  if (state.currentReplayStep >= state.replayHistory.length - 1) {
    state.currentReplayStep = 0;
  }
  
  state.isReplaying = true;
  state.viewMode = 'replay';
  updateReplayControls();
  
  state.replayInterval = setInterval(() => {
    if (state.currentReplayStep < state.replayHistory.length - 1) {
      state.currentReplayStep++;
      renderBoard();
      renderEvents();
      renderReplayDetail(state.currentReplayStep);
      renderReplayTimeline();
    } else {
      stopReplay();
      goToLatest();
    }
  }, 800);
}

function stopReplay() {
  state.isReplaying = false;
  if (state.replayInterval) {
    clearInterval(state.replayInterval);
    state.replayInterval = null;
  }
  updateReplayControls();
}

function goToLatest() {
  stopReplay();
  state.viewMode = 'latest';
  state.currentReplayStep = state.replayHistory.length - 1;
  state.lastDelta = null;
  renderBoard();
  renderEvents();
  renderReplayDetail(state.currentReplayStep);
  renderReplayTimeline();
}

function renderGameInfo() {
  const container = document.getElementById('gameMeta');
  
  if (!state.currentGameData) {
    container.innerHTML = '<div class="empty-state">选择游戏查看详情</div>';
    return;
  }

  const g = state.currentGameData;
  const s = getDisplayState();
  
  container.innerHTML = `
    <div class="meta-row">
      <span class="meta-label">地图</span>
      <span class="meta-value">${g.map.name}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">难度</span>
      <span class="meta-value">${g.difficulty}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">当前步数</span>
      <span class="meta-value">${state.currentSession ? state.currentSession.currentStep : 0} / ${g.maxSteps}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">状态</span>
      <span class="meta-value" style="color: ${state.currentSession?.isFinished ? (state.currentSession.result?.type === 'win' ? '#4ade80' : '#f87171') : '#fbbf24'};">
        ${state.currentSession?.isFinished ? (state.currentSession.result?.type === 'win' ? '已胜利' : '已失败') : '进行中'}
      </span>
    </div>
    ${s?.secretUnlocked ? `
    <div class="meta-row">
      <span class="meta-label">隐藏条件</span>
      <span class="meta-value" style="color: #a78bfa;">✓ 已触发</span>
    </div>
    ` : ''}
    ${state.currentGame === 'you' && s && !s.secretUnlocked ? `
    <div class="meta-row">
      <span class="meta-label">隐藏触发值</span>
      <span class="meta-value" style="color: ${s.hiddenTrigger >= 5 ? '#a78bfa' : (s.hiddenTrigger >= 3 ? '#fbbf24' : '#94a3b8')};">
        ${s.hiddenTrigger} / 5
      </span>
    </div>
    <div class="meta-row">
      <span class="meta-label">前置门槛</span>
      <span class="meta-value" style="color: ${(s.stepCount >= 6 || s.hiddenTrigger >= 3) ? '#4ade80' : '#f87171'};">
        步${s.stepCount || 0}/6 触发${s.hiddenTrigger || 0}/3
      </span>
    </div>
    ` : ''}
    <div class="formula-box win">
      <div style="color: #4ade80; margin-bottom: 0.25rem;">胜利条件:</div>
      ${g.winFormula}
    </div>
    <div class="formula-box lose" style="margin-top: 0.5rem;">
      <div style="color: #f87171; margin-bottom: 0.25rem;">失败条件:</div>
      ${g.loseFormula}
    </div>
  `;
}

function updateSettleButton() {
  const btn = document.getElementById('btnSettle');
  btn.disabled = !state.currentSession;
}

async function requestSettlement() {
  if (!state.currentSession) return;

  const btn = document.getElementById('btnSettle');
  btn.textContent = '结算中...';
  btn.disabled = true;

  const data = await apiRequest(`${API_BASE}/sessions/${state.currentSession.sessionId}/settle`, {
    method: 'POST'
  });

  if (data && data.recalculated) {
    renderSettlement(data);
    showToast('后端结算完成，数据已重算验证', 'success');
  }

  btn.textContent = '重新结算';
  btn.disabled = false;
}

function renderSettlement(settlement) {
  const container = document.querySelector('.settlement-content');
  const r = settlement.finalResult;
  const s = settlement.score;

  container.innerHTML = `
    <div class="settlement-section">
      <h4>🔍 后端重算结果</h4>
      <div class="meta-row">
        <span class="meta-label">最终判定</span>
        <span class="meta-value" style="color: ${r.win ? '#4ade80' : (r.lose ? '#f87171' : '#fbbf24')};">
          ${r.win ? '✓ 胜利' : (r.lose ? '✗ 失败' : '未完成')}
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">重算步数</span>
        <span class="meta-value">${settlement.steps.length} 步</span>
      </div>
    </div>

    <div class="settlement-section">
      <h4>📊 得分明细</h4>
      <div class="score-row">
        <span>倒排值基础分</span>
        <span class="score-positive">+${s.invertedScore}</span>
      </div>
      <div class="score-row">
        <span>配平平衡分</span>
        <span class="${s.balanceScore < 100 ? 'score-positive' : 'score-negative'}">${200 - s.balanceScore > 0 ? '+' : ''}${200 - s.balanceScore}</span>
      </div>
      <div class="score-row">
        <span>剩余丙号加成</span>
        <span class="score-positive">+${s.riskBonus}</span>
      </div>
      <div class="score-row">
        <span>卯号奖励加成</span>
        <span class="score-positive">+${s.rewardBonus}</span>
      </div>
      <div class="score-row">
        <span>酉号失败惩罚</span>
        <span class="score-negative">-${s.failurePenalty}</span>
      </div>
      <div class="score-row">
        <span>步数消耗</span>
        <span class="score-negative">-${s.stepPenalty}</span>
      </div>
      <div class="score-row total">
        <span>最终得分</span>
        <span style="color: #fbbf24;">${s.total}</span>
      </div>
    </div>

    <div class="settlement-section">
      <h4>📋 最终状态</h4>
      <div class="meta-row">
        <span class="meta-label">倒排值</span>
        <span class="meta-value">${settlement.finalState.invertedValue}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">配平槽</span>
        <span class="meta-value">[${settlement.finalState.balanceSlots.join(', ')}]</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">丙号风险</span>
        <span class="meta-value">${settlement.finalState.riskC}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">卯号奖励</span>
        <span class="meta-value">${settlement.finalState.rewardM}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">酉号因子</span>
        <span class="meta-value">${settlement.finalState.failureY}</span>
      </div>
    </div>

    <div class="settlement-section">
      <h4>📝 逐步验证</h4>
      ${settlement.steps.slice(-5).map(step => `
        <div class="detail-row" style="font-size: 0.7rem;">
          <span class="detail-label">步${step.step}: ${step.eventName}</span>
          <span class="detail-value" style="color: ${step.winCheck ? '#4ade80' : (step.loseCheck ? '#f87171' : '#94a3b8')};">
            ${step.winCheck ? '✓' : (step.loseCheck ? '✗' : '○')}
          </span>
        </div>
      `).join('')}
      ${settlement.steps.length > 5 ? `<div style="text-align: center; color: #64748b; font-size: 0.7rem; margin-top: 0.5rem;">... 共 ${settlement.steps.length} 步验证记录</div>` : ''}
    </div>
  `;
}

async function resetGame() {
  if (!state.currentSession) return;
  
  const data = await apiRequest(`${API_BASE}/sessions/${state.currentSession.sessionId}/reset`, {
    method: 'POST'
  });

  if (data && data.session) {
    state.currentSession = data.session;
    state.lastDelta = null;
    state.currentReplayStep = 0;
    state.viewMode = 'latest';
    stopReplay();
    await loadReplayHistory();
    saveCurrentSession();
    
    document.querySelector('.settlement-content').innerHTML = '<div class="empty-state">完成游戏后查看结算</div>';
    
    renderAll();
    showToast('游戏已重置', 'info');
  }
}

function init() {
  document.getElementById('btnReplayPrev').addEventListener('click', () => stepReplay(-1));
  document.getElementById('btnReplayPlay').addEventListener('click', toggleReplay);
  document.getElementById('btnReplayNext').addEventListener('click', () => stepReplay(1));
  document.getElementById('btnReplayLatest').addEventListener('click', goToLatest);
  document.getElementById('btnSettle').addEventListener('click', requestSettlement);
  
  document.getElementById('btnCloseModal').addEventListener('click', () => {
    document.getElementById('resultModal').classList.add('hidden');
  });
  
  document.getElementById('btnNewGame').addEventListener('click', () => {
    document.getElementById('resultModal').classList.add('hidden');
    resetGame();
  });

  loadGames().then(() => {
    const lastGame = localStorage.getItem(STORAGE_KEY);
    if (lastGame) {
      selectGame(lastGame);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
