function refreshReplayUI() {
  renderReplayTimeline();
  updateReplayCounter();
  updateReplayPreview();
}

function renderReplayTimeline() {
  const tl = document.getElementById('replayTimeline');
  const steps = Game.replay;
  if (!steps || steps.length === 0) {
    tl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏪</div>
        <div class="empty-state-text">暂无回放记录</div>
        <div class="empty-state-hint">完成操作后步骤会自动记录</div>
      </div>
    `;
    return;
  }

  tl.innerHTML = steps.map((s, i) => {
    const isCurrent = i === window._getReplayIndex();
    const a = s.action || {};
    const titleMap = {
      move: `玩家${a.playerId}移动 (${a.dx>0?'→':a.dx<0?'←':''}${a.dy>0?'↓':a.dy<0?'↑':''})`,
      light: `玩家${a.playerId}点亮当前格`,
      coop: `玩家${a.playerId}发起协作`,
      endTurn: `玩家${a.playerId}结束回合`,
      triggerEvent: `触发事件：${shortEventId(a.eventId)}`
    };
    const iconMap = { move:'🚶', light:'💡', coop:'🤝', endTurn:'⏭️', triggerEvent:'🎁' };
    const typeClass = a.type || 'info';
    return `
      <div class="replay-step ${isCurrent ? 'current' : ''}" onclick="jumpToReplayStep(${i})">
        <div class="replay-step-num">${i + 1}</div>
        <div class="replay-step-content">
          <div class="replay-step-title">
            <span style="margin-right:6px;">${iconMap[a.type] || '📋'}</span>
            ${titleMap[a.type] || a.type}
          </div>
          <div class="replay-step-desc">${s.message || ''}</div>
          ${s.events && s.events.length ? `<div style="font-size:10px;color:var(--accent-gold);margin-top:4px;">📌 ${s.events.map(e=>e.message).join('；')}</div>` : ''}
          <div class="replay-step-time">${UI.formatDate(s.timestamp)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function shortEventId(id) {
  if (!id) return '事件';
  const m = {
    chen_tutorial_move: '辰·移动指引',
    chen_tutorial_light: '辰·点亮指引',
    chen_tutorial_coop: '辰·协作指引',
    chen_rand_gift: '辰·星尘馈赠',
    chen_rand_wind: '辰·星云流转',
    mao_survival_boost: '卯·生存补给',
    mao_risk_barrier: '卯·巡测屏障',
    mao_rand_drain: '卯·能量波动',
    mao_rand_bonus: '卯·隐秘宝箱',
    mao_hidden_light: '卯·区域净化',
    xin_safe_path: '辛·安全路径',
    xin_reinforce: '辛·防护结界',
    xin_super_coop: '辛·极限协作',
    xin_rand_trap: '辛·陷阱松动',
    xin_rand_storm: '辛·星尘风暴'
  };
  return m[id] || id;
}

window._getReplayIndex = () => {
  return window.getDisplayStateIdx ? window.getDisplayStateIdx() : -1;
};

function jumpToReplayStep(i) {
  stopReplay();
  const newIdx = (i < 0 || i >= Game.replay.length) ? -1 : i;
  window._setReplayIndex(newIdx);
  renderBoard();
  renderPlayers();
  renderMetrics();
  renderBoardInfo();
  renderGoals();
  refreshReplayUI();
}

function replayJump(target) {
  const max = Game.replay.length;
  if (target <= 0) jumpToReplayStep(-1);
  else if (target >= max) jumpToReplayStep(max - 1);
  else jumpToReplayStep(target - 1);
}

function replayPrev() {
  const cur = window._getReplayIndex();
  if (cur === -1) {
    if (Game.replay.length > 0) jumpToReplayStep(Game.replay.length - 1);
  } else if (cur > 0) {
    jumpToReplayStep(cur - 1);
  } else {
    jumpToReplayStep(-1);
  }
}

function replayNext() {
  const cur = window._getReplayIndex();
  const max = Game.replay.length;
  if (cur === -1) {
    if (max > 0) jumpToReplayStep(0);
  } else if (cur < max - 1) {
    jumpToReplayStep(cur + 1);
  }
}

function toggleReplay() {
  if (window._getReplayPlaying()) {
    stopReplay();
  } else {
    startReplay();
  }
}

function startReplay() {
  if (!Game.replay || Game.replay.length === 0) return;
  const startIdx = window._getReplayIndex();
  let idx = (startIdx === -1 || startIdx >= Game.replay.length - 1) ? 0 : startIdx + 1;
  window._setReplayPlaying(true);
  updateReplayButton();
  jumpToReplayStep(idx - 1);
  const tick = () => {
    if (!window._getReplayPlaying()) return;
    if (idx >= Game.replay.length) {
      stopReplay();
      return;
    }
    jumpToReplayStep(idx);
    idx++;
    window._setReplayTimer(setTimeout(tick, 800));
  };
  window._setReplayTimer(setTimeout(tick, 600));
}

function stopReplay() {
  window._setReplayPlaying(false);
  if (window._getReplayTimer()) {
    clearTimeout(window._getReplayTimer());
    window._setReplayTimer(null);
  }
  updateReplayButton();
}

function updateReplayButton() {
  const btn = document.getElementById('btnReplayPlay');
  if (!btn) return;
  if (window._getReplayPlaying()) {
    btn.innerHTML = '⏸️ 暂停';
  } else {
    btn.innerHTML = '▶️ 播放';
  }
}

function updateReplayCounter() {
  const total = Game.replay ? Game.replay.length : 0;
  const cur = window._getReplayIndex();
  const displayCur = cur === -1 ? 0 : cur + 1;
  const counter = document.getElementById('replayCounter');
  const fill = document.getElementById('replayProgressFill');
  if (counter) counter.textContent = `${displayCur} / ${total}`;
  if (fill) fill.style.width = total === 0 ? '0%' : `${(displayCur / total) * 100}%`;
}

function updateReplayPreview() {
  const preview = document.getElementById('replayPreview');
  const cur = window._getReplayIndex();
  const step = (cur >= 0 && Game.replay[cur]) ? Game.replay[cur] : null;
  if (!step) {
    preview.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👀</div>
        <div class="empty-state-text">选择步骤查看详情</div>
        <div class="empty-state-hint">点击时间轴上的步骤</div>
      </div>
    `;
    return;
  }

  const s = step.stateAfter;
  const a = step.action || {};
  const typeLabels = {
    move: '移动操作',
    light: '点亮操作',
    coop: '协作操作',
    endTurn: '回合结束',
    triggerEvent: '事件触发'
  };

  let eventsHtml = '';
  if (step.events && step.events.length) {
    eventsHtml = '<h4 style="color:var(--accent-gold);margin:16px 0 8px;font-size:13px;">📌 触发事件</h4>' +
      step.events.map(e => `
        <div style="padding:8px;background:rgba(245,158,11,0.1);border-radius:8px;font-size:12px;margin-bottom:6px;">
          <strong>${e.type}</strong>：${e.message}
        </div>
      `).join('');
  }

  preview.innerHTML = `
    <div style="font-size:13px;">
      <div style="padding:10px;background:var(--card-bg);border-radius:10px;margin-bottom:12px;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">操作类型</div>
        <div style="font-weight:700;color:var(--accent-purple);">${typeLabels[a.type] || a.type}</div>
      </div>

      <h4 style="color:var(--accent-cyan);margin:0 0 8px;font-size:13px;">📊 操作后状态</h4>
      <div class="metrics-grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px;">
        <div class="metric-card metric-xunran" style="padding:8px;">
          <div class="metric-label" style="font-size:10px;">熏染值</div>
          <div class="metric-value" style="font-size:18px;">${s.xunran}</div>
        </div>
        <div class="metric-card metric-chen" style="padding:8px;">
          <div class="metric-label" style="font-size:10px;">辰号风险</div>
          <div class="metric-value" style="font-size:18px;">${s.chenRisk}</div>
        </div>
        <div class="metric-card metric-mao" style="padding:8px;">
          <div class="metric-label" style="font-size:10px;">卯号奖励</div>
          <div class="metric-value" style="font-size:18px;">${s.maoReward}</div>
        </div>
        <div class="metric-card metric-xin" style="padding:8px;">
          <div class="metric-label" style="font-size:10px;">辛号因子</div>
          <div class="metric-value" style="font-size:18px;">${s.xinFailure}</div>
        </div>
      </div>

      <h4 style="color:var(--accent-cyan);margin:0 0 8px;font-size:13px;">👤 玩家位置/能量</h4>
      ${s.players.map(p => `
        <div style="padding:8px;background:rgba(0,0,0,0.2);border-radius:8px;margin-bottom:6px;font-size:12px;">
          <strong style="color:${p.color};">${p.name}</strong> @ (${p.x},${p.y}) · ⚡${p.energy}
        </div>
      `).join('')}

      ${eventsHtml}

      <div style="margin-top:16px;font-size:11px;color:var(--text-muted);">
        ⏱️ ${UI.formatDate(step.timestamp)} · 回合 ${s.turn} · 总步数 ${s.stepCount}
      </div>
    </div>
  `;
}

window.refreshReplayUI = refreshReplayUI;
window.renderReplayTimeline = renderReplayTimeline;
window.jumpToReplayStep = jumpToReplayStep;
window.replayJump = replayJump;
window.replayPrev = replayPrev;
window.replayNext = replayNext;
window.toggleReplay = toggleReplay;
window.startReplay = startReplay;
window.stopReplay = stopReplay;
