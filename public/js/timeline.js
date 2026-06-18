const Timeline = (function () {
  let steps = [];
  let activeStepIndex = -1;
  let playbackTimer = null;

  const ACTION_LABELS = {
    seal: '🔒 封存',
    rewrite: '✏️ 复写',
    dispatch: '⚙️ 调度',
    signal: '📡 信号',
    skip: '⏭️ 跳过'
  };

  function init() {
    steps = loadFromStorage();
    activeStepIndex = -1;
    render();
    bindEvents();
  }

  function loadFromStorage() {
    try {
      const key = getStorageKey();
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToStorage() {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(steps));
    } catch (e) {}
  }

  function getStorageKey() {
    const scenarioId = (App && App.getScenarioId) ? App.getScenarioId() : 'yi';
    return `yanhu_balloon_timeline_${scenarioId}`;
  }

  function addStep(step) {
    steps.push({
      ...step,
      timestamp: Date.now(),
      index: steps.length
    });
    activeStepIndex = steps.length - 1;
    saveToStorage();
    render();
  }

  function getSteps() {
    return steps.slice();
  }

  function getStepCount() {
    return steps.length;
  }

  function clear() {
    steps = [];
    activeStepIndex = -1;
    if (playbackTimer) clearInterval(playbackTimer);
    playbackTimer = null;
    saveToStorage();
    render();
  }

  function resetWithScenario() {
    const saved = loadFromStorage();
    if (saved && saved.length > 0) {
      if (confirm(`检测到本局有 ${saved.length} 步操作记录，是否恢复？\n\n（点击「取消」以重新开始）`)) {
        steps = saved;
        activeStepIndex = steps.length - 1;
        render();
        return steps;
      }
    }
    steps = [];
    activeStepIndex = -1;
    saveToStorage();
    render();
    return [];
  }

  function bindEvents() {
    document.getElementById('playbackBtn').onclick = togglePlayback;
    document.getElementById('clearTimelineBtn').onclick = () => {
      if (confirm('确定清空回放轴？此操作仅清除操作记录，不重置当前局面。')) {
        clear();
        App.toast('回放轴已清空', 'info');
      }
    };
  }

  function togglePlayback() {
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
      App.toast('回放暂停', 'info');
      return;
    }
    if (steps.length === 0) { App.toast('暂无回放记录', 'warn'); return; }

    activeStepIndex = -1;
    render();
    let i = 0;
    playbackTimer = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(playbackTimer);
        playbackTimer = null;
        return;
      }
      activeStepIndex = i;
      render();
      i++;
    }, 800);
    App.toast('开始回放', 'info');
  }

  function render() {
    const track = document.getElementById('timelineTrack');
    const details = document.getElementById('timelineDetails');

    if (steps.length === 0) {
      track.innerHTML = `
        <div style="padding:30px 12px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;opacity:0.4;">📝</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.6;">暂无操作记录<br>在局面盘执行操作将自动保存</div>
        </div>
      `;
      details.innerHTML = `<div class="empty-tip">完成第1步操作后，<br>操作记录将出现在这里</div>`;
      return;
    }

    track.innerHTML = steps.map((s, i) => {
      const isActive = i === activeStepIndex;
      const actionLabel = ACTION_LABELS[s.action?.type] || (s.action?.type || '未知');
      let subInfo = '';
      if (s.action) {
        if (s.action.type === 'seal') subInfo = `${s.action.nodeId || ''} × ${s.action.amount || 0}`;
        else if (s.action.type === 'rewrite') subInfo = `${s.action.nodeId || ''}`;
        else if (s.action.type === 'dispatch') subInfo = `${s.action.from || ''}→${s.action.to || ''}`;
      }
      const eventTag = s.eventApplied ? '<span style="font-size:9px;color:var(--accent-purple);">🎁触发事件</span>' : '';
      const hiddenTag = s.hiddenUnlocked ? '<span style="font-size:9px;color:var(--accent-pink);">✨隐藏解锁</span>' : '';

      return `
        <div class="timeline-node ${isActive ? 'active' : ''}" data-index="${i}">
          <div class="timeline-dot">${i + 1}</div>
          <div class="timeline-info">
            <div class="timeline-info-round">第 ${i + 1} 回</div>
            <div class="timeline-info-action">${actionLabel}</div>
            <div class="timeline-info-meta">${subInfo} ${eventTag} ${hiddenTag}</div>
          </div>
        </div>
      `;
    }).join('');

    track.querySelectorAll('.timeline-node').forEach(el => {
      el.onclick = () => {
        activeStepIndex = parseInt(el.dataset.index);
        render();
      };
    });

    if (activeStepIndex >= 0 && activeStepIndex < steps.length) {
      renderStepDetails(steps[activeStepIndex], activeStepIndex);
    } else if (steps.length > 0) {
      renderStepDetails(steps[steps.length - 1], steps.length - 1, true);
    }
  }

  function renderStepDetails(step, idx, isLatest) {
    const details = document.getElementById('timelineDetails');
    const actionLabel = ACTION_LABELS[step.action?.type] || step.action?.type || '操作';
    const before = step.stateBefore || {};
    const after = step.stateAfter || {};

    let actionDetail = '';
    if (step.action) {
      switch (step.action.type) {
        case 'seal':
          actionDetail = `封存节点 ${step.action.nodeId}，投入 ${step.action.amount} 单位封存值`;
          break;
        case 'rewrite':
          actionDetail = `复写节点 ${step.action.nodeId}，容量+100，获得封存值+${step.action.bonus || 25}`;
          break;
        case 'dispatch':
          actionDetail = `调度资源 ${step.action.from} → ${step.action.to}`;
          break;
        case 'signal':
          actionDetail = `释放信号，获得壬号奖励+15，乙号风险-5`;
          break;
        case 'skip':
          actionDetail = `跳过回合，子号失败因子+5`;
          break;
      }
    }

    const stats = [
      { label: '封存值', key: 'sealedValue', fmt: Math.round },
      { label: '复写槽', key: 'rewriteSlots', fmt: v => v },
      { label: '转译痕', key: 'traceMarks', fmt: v => v },
      { label: '乙号风险', key: 'yiRisk', fmt: Math.round },
      { label: '壬号奖励', key: 'renReward', fmt: Math.round },
      { label: '子号失败', key: 'ziFailFactor', fmt: Math.round }
    ];

    const statHtml = stats.map(st => {
      const b = before[st.key];
      const a = after[st.key];
      const delta = (typeof a === 'number' && typeof b === 'number') ? a - b : 0;
      const cls = delta > 0 ? 'delta-up' : (delta < 0 ? 'delta-down' : '');
      const sign = delta > 0 ? '+' : '';
      const deltaStr = delta !== 0 ? `<span class="detail-stat-delta ${cls}">${sign}${st.fmt(delta)}</span>` : '';
      return `
        <div class="detail-stat">
          <div class="detail-stat-label">${st.label}</div>
          <div class="detail-stat-value">${st.fmt(a ?? 0)}${deltaStr}</div>
        </div>
      `;
    }).join('');

    const resourceHtml = `
      <div style="margin-top:8px;padding:8px;background:var(--bg-card);border-radius:6px;border:1px solid var(--border-color);">
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">资源变化</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:11px;">
          <div>⚡ ${Math.round(after.resources?.energy || 0)}</div>
          <div>💨 ${Math.round(after.resources?.gas || 0)}</div>
          <div>📶 ${Math.round(after.resources?.signal || 0)}</div>
        </div>
      </div>
    `;

    const eventHtml = step.eventApplied ? `
      <div class="detail-event" style="margin-top:8px;">
        <div class="detail-event-title">🎁 已触发事件：${step.eventTitle || step.eventApplied}</div>
        ${step.eventDesc ? `<div class="detail-event-desc">${step.eventDesc}</div>` : ''}
      </div>
    ` : '';

    const hiddenHtml = step.hiddenUnlocked ? `
      <div style="margin-top:8px;padding:8px 10px;background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15));border:1px solid var(--accent-purple);border-radius:8px;">
        <div style="font-size:11px;font-weight:700;color:var(--accent-purple);margin-bottom:2px;">✨ 隐藏条件已解锁！</div>
        <div style="font-size:10px;color:var(--text-secondary);">虚数门开启，真结局路径激活</div>
      </div>
    ` : '';

    details.innerHTML = `
      <div class="detail-header">
        <div class="detail-round">第 ${idx + 1} 回 ${isLatest ? '（最新）' : ''}</div>
        <div class="detail-action-tag">${actionLabel}</div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.5;">${actionDetail || '—'}</div>
      <div class="detail-stats">${statHtml}</div>
      ${resourceHtml}
      ${eventHtml}
      ${hiddenHtml}
    `;
  }

  function restoreSteps(savedSteps) {
    steps = savedSteps || [];
    activeStepIndex = steps.length - 1;
    saveToStorage();
    render();
  }

  return {
    init, addStep, getSteps, getStepCount, clear,
    resetWithScenario, render, restoreSteps
  };
})();
