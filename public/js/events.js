let _currentEvent = null;

async function loadFullLevelData() {
  const id = Game.getLevelId();
  if (!id) return null;
  if (Game.level) return Game.level;
  const res = await API.getLevel(id);
  if (res.success) {
    Game.level = res.data;
    return res.data;
  }
  return null;
}

async function renderEventsPage() {
  const listEl = document.getElementById('eventsList');
  const trigEl = document.getElementById('triggeredEventsList');

  if (!Game.state) {
    listEl.innerHTML = renderEmpty('🎁', '请先开始一局游戏', '选择关卡后在此触发事件');
    trigEl.innerHTML = renderEmpty('📭', '暂无已触发事件', '');
    return;
  }

  const level = await loadFullLevelData();
  if (!level) {
    listEl.innerHTML = renderEmpty('⚠️', '关卡数据加载失败', '');
    return;
  }

  const evts = Game.getAvailableEvents(level);
  const manualEvts = evts.filter(e => e.trigger === 'manual' && e.status !== 'triggered');
  const autoEvts = evts.filter(e => e.trigger === 'auto' || e.random || e.trigger === 'random');
  const triggered = evts.filter(e => e.status === 'triggered');

  let html = '';
  if (manualEvts.length === 0 && autoEvts.filter(e => e.status === 'available').length === 0) {
    html += renderEmpty('🎁', '暂无可触发事件', '操作更多以解锁事件条件');
  }

  if (manualEvts.length) {
    html += '<h4 style="margin-bottom:12px;color:var(--accent-cyan);">🖐️ 可手动触发</h4>';
    manualEvts.forEach(e => {
      html += renderEventCard(e, level);
    });
  }

  const availableAuto = autoEvts.filter(e => e.status === 'available');
  if (availableAuto.length) {
    html += '<h4 style="margin:24px 0 12px;color:var(--accent-purple);">🔮 条件事件</h4>';
    availableAuto.forEach(e => {
      html += renderEventCard(e, level);
    });
  }

  const lockedAuto = autoEvts.filter(e => e.status === 'locked');
  if (lockedAuto.length) {
    html += '<h4 style="margin:24px 0 12px;color:var(--text-muted);">🔒 待解锁</h4>';
    lockedAuto.forEach(e => {
      html += renderEventCard(e, level);
    });
  }

  listEl.innerHTML = html;

  if (triggered.length === 0) {
    trigEl.innerHTML = renderEmpty('📭', '暂无已触发事件', '操作过程中会自动触发');
  } else {
    trigEl.innerHTML = triggered.map(e => `
      <div style="padding:12px;background:rgba(16,185,129,0.08);border-radius:10px;border-left:3px solid var(--accent-green);margin-bottom:8px;">
        <div style="font-weight:700;font-size:13px;color:var(--accent-green);">✅ ${e.name}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;line-height:1.5;">${e.description || ''}</div>
      </div>
    `).join('');
  }
}

function renderEmpty(icon, text, hint) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-text">${text}</div>
      ${hint ? `<div class="empty-state-hint">${hint}</div>` : ''}
    </div>
  `;
}

function renderEventCard(e, level) {
  const statusClass = e.status;
  const typeLabel = { tutorial: '教学', buff: '增益', debuff: '减益', choice: '选择', random: '随机' }[e.type] || '事件';
  const canTrigger = e.status === 'available' && e.trigger === 'manual';

  let costHtml = '';
  if (e.cost) {
    const parts = [];
    if (e.cost.energy) parts.push(`⚡ 消耗${e.cost.energy}能量`);
    if (e.cost.mao) parts.push(`💎 消耗${e.cost.mao}卯号奖励`);
    if (parts.length) costHtml = `<div class="event-card-cost">💰 ${parts.join('，')}</div>`;
  }

  let condHtml = '';
  if (e.condition) {
    const cp = [];
    if (e.condition.minXunran) cp.push(`熏染≥${e.condition.minXunran}（当前${Game.state.xunran}）`);
    if (e.condition.minMaoReward) cp.push(`奖励≥${e.condition.minMaoReward}（当前${Game.state.maoReward}）`);
    if (e.condition.maxChenRisk) cp.push(`风险≤${e.condition.maxChenRisk}（当前${Game.state.chenRisk}）`);
    if (e.condition.turn) cp.push(`回合≥${e.condition.turn}（当前${Game.state.turn}）`);
    if (e.condition.litCells) cp.push(`点亮格≥${e.condition.litCells}（当前${Game.state.cells.filter(c=>c.lit).length}）`);
    if (cp.length) condHtml = `<div style="font-size:11px;color:var(--accent-gold);margin-bottom:8px;">📌 条件：${cp.join('；')}</div>`;
  }

  const effectPreview = renderEffectPreview(e.effect);
  const choicesPreview = e.choices ? e.choices.map((c, i) => `
    <div style="font-size:11px;color:var(--accent-cyan);margin:2px 0;">
      ▶️ ${c.name}${c.effect ? '：' + shortEffect(c.effect) : ''}
    </div>
  `).join('') : '';

  const btn = canTrigger
    ? `<button class="btn btn-gold btn-sm" style="margin-top:8px;" onclick="triggerEvent('${e.id}')">🎯 触发</button>`
    : (e.status === 'locked' ? `<div style="margin-top:8px;font-size:11px;color:var(--accent-red);">🔒 条件未满足</div>` : '');

  return `
    <div class="event-card ${statusClass}">
      <div class="event-card-title">
        <span>${e.name}</span>
        <span class="event-tag ${e.type}">${typeLabel}</span>
      </div>
      ${condHtml}
      <div class="event-card-desc">${e.description || ''}</div>
      ${costHtml}
      ${effectPreview}
      ${choicesPreview}
      ${btn}
    </div>
  `;
}

function renderEffectPreview(effect) {
  if (!effect) return '';
  const parts = [];
  if (effect.xunran) parts.push(`熏染${effect.xunran>0?'+':''}${effect.xunran}`);
  if (effect.chenRisk) parts.push(`辰号风险${effect.chenRisk>0?'+':''}${effect.chenRisk}`);
  if (effect.maoReward) parts.push(`卯号奖励${effect.maoReward>0?'+':''}${effect.maoReward}`);
  if (effect.xinFailure !== undefined) parts.push(`辛号因子${effect.xinFailure>0?'+':''}${effect.xinFailure}`);
  if (effect.energy) parts.push(`能量${effect.energy>0?'+':''}${effect.energy}`);
  if (effect.litAll) parts.push('全部点亮');
  if (effect.litArea) parts.push(`区域点亮(${effect.litArea.x},${effect.litArea.y} r=${effect.litArea.r})`);
  if (parts.length === 0) return '';
  return `<div style="font-size:11px;color:var(--accent-green);margin-bottom:6px;">✨ 效果：${parts.join('，')}</div>`;
}

function shortEffect(effect) {
  if (!effect) return '';
  const parts = [];
  if (effect.xunran) parts.push(`熏染${effect.xunran>0?'+':''}${effect.xunran}`);
  if (effect.maoReward) parts.push(`奖励${effect.maoReward>0?'+':''}${effect.maoReward}`);
  if (effect.energy) parts.push(`能量${effect.energy>0?'+':''}${effect.energy}`);
  return parts.join('，');
}

async function triggerEvent(eventId) {
  if (!Game.state || Game.state.phase !== 'play') return;
  const level = await loadFullLevelData();
  const event = level.events.find(e => e.id === eventId);
  if (!event) return;

  if (event.choices && event.choices.length > 0) {
    _currentEvent = event;
    document.getElementById('eventChoiceTitle').textContent = event.name;
    document.getElementById('eventChoiceDesc').textContent = event.description;
    document.getElementById('eventChoiceList').innerHTML = event.choices.map((c, i) => `
      <button class="choice-btn" onclick="chooseEventOption(${i})">
        <div class="choice-btn-title">选项 ${i + 1}：${c.name}</div>
        <div style="font-size:12px;color:var(--text-muted);">${renderChoiceEffect(c.effect)}</div>
      </button>
    `).join('');
    document.getElementById('eventChoiceModal').classList.add('active');
    return;
  }

  const action = { playerId: Game.state.currentPlayer, type: 'triggerEvent', eventId };
  const result = await Game.doAction(action);
  handleEventResult(result);
}

function renderChoiceEffect(e) {
  if (!e) return '无效果';
  const parts = [];
  if (e.maoReward) parts.push(`卯号奖励${e.maoReward>0?'+':''}${e.maoReward}`);
  if (e.energy) parts.push(`能量${e.energy>0?'+':''}${e.energy}`);
  if (e.xunran) parts.push(`熏染${e.xunran>0?'+':''}${e.xunran}`);
  if (e.litArea) parts.push(`点亮(${e.litArea.x},${e.litArea.y})周围`);
  if (parts.length === 0) return '无立即效果';
  return parts.join('，');
}

async function chooseEventOption(idx) {
  if (!_currentEvent) return;
  const action = {
    playerId: Game.state.currentPlayer,
    type: 'triggerEvent',
    eventId: _currentEvent.id,
    choiceIdx: idx
  };
  closeEventChoice();
  const result = await Game.doAction(action);
  handleEventResult(result);
  _currentEvent = null;
}

function closeEventChoice() {
  document.getElementById('eventChoiceModal').classList.remove('active');
}

function handleEventResult(result) {
  if (!result.valid) {
    showToast(result.message, 'error');
  } else {
    showToast(result.message, 'success');
  }
  renderAll();
  renderEventsPage();
  refreshReplayUI();
  maybeRefreshSettlement();
}

window.renderEventsPage = renderEventsPage;
window.triggerEvent = triggerEvent;
window.chooseEventOption = chooseEventOption;
window.closeEventChoice = closeEventChoice;
