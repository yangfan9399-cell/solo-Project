const EventsBox = (function () {
  let currentScenario = null;
  let firedEvents = [];
  let currentRound = 1;

  const TYPE_LABELS = {
    guide: '指引',
    reward: '奖励',
    risk: '风险',
    warn: '警告',
    choice: '抉择',
    hazard: '灾害',
    mystery: '谜团',
    hint: '提示',
    bonus: '奖励'
  };

  function init(scenario, round) {
    currentScenario = scenario;
    currentRound = round || 1;
    firedEvents = [];
    render();
  }

  function setRound(round, firedIds) {
    currentRound = round;
    if (firedIds) firedEvents = firedIds.slice();
    render();
  }

  function markFired(eventId) {
    if (!firedEvents.includes(eventId)) firedEvents.push(eventId);
    render();
  }

  function getFiredIds() {
    return firedEvents.slice();
  }

  function render() {
    if (!currentScenario) return;
    const list = document.getElementById('eventsList');
    const total = (currentScenario.events || []).length;
    document.getElementById('eventFired').textContent = firedEvents.length;
    document.getElementById('eventTotal').textContent = total;

    const events = [...(currentScenario.events || [])].sort((a, b) => a.round - b.round);

    list.innerHTML = events.map(ev => {
      const isFired = firedEvents.includes(ev.id);
      const isCurrent = !isFired && ev.round === currentRound;
      const isUpcoming = !isFired && ev.round > currentRound;
      const isPast = !isFired && ev.round < currentRound;
      const type = ev.type || 'info';
      const typeLabel = TYPE_LABELS[type] || '事件';

      let classes = `event-card ${type}`;
      if (isFired) classes += ' fired';
      if (isCurrent) classes += ' current';

      return `
        <div class="${classes}" data-id="${ev.id}">
          <div class="event-header">
            <span class="event-round">第${ev.round}回</span>
            <span class="event-type">${typeLabel}</span>
            <span class="event-title">${escapeHtml(ev.title)}</span>
          </div>
          <div class="event-desc">${escapeHtml(ev.desc)}${renderEffectPreview(ev.effect)}</div>
          ${isCurrent ? '<div style="margin-top:6px;padding:4px 8px;background:rgba(59,130,246,0.12);border-radius:4px;font-size:10px;color:var(--accent-cyan);font-weight:600;">▶ 当前回合触发</div>' : ''}
          ${isPast && !isFired ? '<div style="margin-top:6px;padding:4px 8px;background:rgba(249,115,22,0.1);border-radius:4px;font-size:10px;color:var(--accent-orange);font-weight:600;">⚠ 错过触发时机</div>' : ''}
          ${isUpcoming ? '<div style="margin-top:6px;font-size:10px;color:var(--text-muted);">⏳ 待触发</div>' : ''}
        </div>
      `;
    }).join('');
  }

  function renderEffectPreview(effect) {
    if (!effect) return '';
    const parts = [];
    if (effect.sealedValue) parts.push(formatDelta('封存值', effect.sealedValue));
    if (effect.rewriteSlots) parts.push(formatDelta('复写槽', effect.rewriteSlots));
    if (effect.yiRisk) parts.push(formatDelta('乙号风险', effect.yiRisk));
    if (effect.renReward) parts.push(formatDelta('壬号奖励', effect.renReward));
    if (effect.ziFailFactor) parts.push(formatDelta('子号失败因子', effect.ziFailFactor));
    if (effect.resources) {
      if (effect.resources.energy) parts.push(formatDelta('能量', effect.resources.energy));
      if (effect.resources.gas) parts.push(formatDelta('气囊', effect.resources.gas));
      if (effect.resources.signal) parts.push(formatDelta('信号', effect.resources.signal));
    }
    if (parts.length === 0) return '';
    return `<div style="margin-top:6px;font-size:10px;line-height:1.6;">${parts.join('')}</div>`;
  }

  function formatDelta(label, value) {
    const isUp = value > 0;
    const color = isUp ? 'color:var(--accent-green);' : 'color:var(--accent-red);';
    const sign = isUp ? '+' : '';
    return `<span style="margin-right:8px;padding:1px 5px;background:var(--bg-primary);border-radius:3px;${color}font-weight:700;">${label} ${sign}${value}</span>`;
  }

  function getCurrentEvent() {
    if (!currentScenario) return null;
    return (currentScenario.events || []).find(e =>
      e.round === currentRound && !firedEvents.includes(e.id)
    );
  }

  function getAllRoundEvents(round) {
    if (!currentScenario) return [];
    return (currentScenario.events || []).filter(e => e.round === round);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  return { init, setRound, markFired, getFiredIds, render, getCurrentEvent, getAllRoundEvents };
})();
