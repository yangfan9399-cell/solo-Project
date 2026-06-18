const Settlement = (function () {
  let currentResult = null;

  function init() {
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('refreshSettleBtn').onclick = () => {
      if (App && App.settleGame) App.settleGame();
    };
  }

  async function recalculate(scenarioId, steps, finalState) {
    try {
      const res = await fetch('/api/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, steps, finalState })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      currentResult = data;
      render();
      return data;
    } catch (e) {
      App.toast('后端重算失败: ' + e.message, 'error');
      return null;
    }
  }

  function render() {
    const body = document.getElementById('settleBody');
    if (!currentResult) {
      body.innerHTML = `
        <div class="settle-empty">
          <div class="empty-icon">📋</div>
          <div class="empty-text">完成操作后，点击右上角「结算」按钮<br>后端将按封存值和调度步骤重算结果</div>
        </div>
      `;
      return;
    }

    const r = currentResult;
    let headerClass = '';
    if (r.isHiddenEnding) headerClass = 'hidden';
    else if (r.isWin) headerClass = 'win';
    else if (r.isLoss) headerClass = 'lose';

    const fs = r.finalState || {};
    const t = r.targets || {};

    const targetItems = [
      { label: '封存值达标', current: fs.sealedValue, target: t.sealedValue, achieved: t.sealedValueReached, suffix: `≥ ${t.sealedValue}` },
      { label: '壬号奖励达标', current: fs.renReward, target: t.renReward, achieved: t.renRewardReached, suffix: `≥ ${t.renReward}` },
      { label: '乙号风险控制', current: fs.yiRisk, target: t.maxYiRisk, achieved: t.yiRiskOk, suffix: `≤ ${t.maxYiRisk}` }
    ];

    body.innerHTML = `
      <div class="settle-header ${headerClass}">
        <div class="settle-outcome">${r.outcome}</div>
        <div class="settle-scenario">${r.scenario || ''}</div>
      </div>

      <div class="settle-targets">
        <div class="settle-section-title">🎯 结算目标</div>
        ${targetItems.map(item => `
          <div class="settle-target-item">
            <span class="target-label">${item.label}</span>
            <span class="target-value ${item.achieved ? 'target-pass' : 'target-fail'}">
              ${Math.round(item.current || 0)} / ${item.suffix}
              ${item.achieved ? '✓' : '✗'}
            </span>
          </div>
        `).join('')}
      </div>

      <div class="settle-stats">
        <div class="settle-section-title">📊 最终状态</div>
        ${renderStatItem('盐湖气球封存值', fs.sealedValue)}
        ${renderStatItem('盐湖气球复写槽', fs.rewriteSlots)}
        ${renderStatItem('盐湖气球转译痕', fs.traceMarks)}
        ${renderStatItem('乙号风险', fs.yiRisk, true)}
        ${renderStatItem('壬号奖励', fs.renReward)}
        ${renderStatItem('子号失败因子', fs.ziFailFactor, true)}
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed rgba(45,58,92,0.5);">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:4px;">
            <div style="padding:6px;background:var(--bg-primary);border-radius:6px;text-align:center;">
              <div style="font-size:9px;color:var(--text-muted);">能量</div>
              <div style="font-size:13px;font-weight:700;color:var(--accent-yellow);">⚡ ${Math.round(fs.resources?.energy || 0)}</div>
            </div>
            <div style="padding:6px;background:var(--bg-primary);border-radius:6px;text-align:center;">
              <div style="font-size:9px;color:var(--text-muted);">气囊</div>
              <div style="font-size:13px;font-weight:700;color:var(--accent-orange);">💨 ${Math.round(fs.resources?.gas || 0)}</div>
            </div>
            <div style="padding:6px;background:var(--bg-primary);border-radius:6px;text-align:center;">
              <div style="font-size:9px;color:var(--text-muted);">信号</div>
              <div style="font-size:13px;font-weight:700;color:var(--accent-cyan);">📶 ${Math.round(fs.resources?.signal || 0)}</div>
            </div>
          </div>
        </div>
        ${fs.hiddenUnlocked ? `
          <div style="margin-top:10px;padding:8px;background:linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15));border:1px solid var(--accent-purple);border-radius:8px;text-align:center;">
            <div style="font-size:12px;font-weight:700;color:var(--accent-purple);">✨ 隐藏路径已激活</div>
          </div>
        ` : ''}
      </div>

      ${r.charts ? renderChart(r.charts) : ''}

      <div style="margin-top:12px;">
        <div class="settle-section-title">🔍 步骤审计（后端重算）</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">
          共 ${r.stepResults?.length || 0} 步操作已由后端重算验证
        </div>
        <div style="max-height:120px;overflow:auto;padding:8px;background:var(--bg-primary);border-radius:6px;border:1px solid var(--border-color);">
          ${(r.stepResults || []).map(sr => renderStepAudit(sr)).join('')}
        </div>
      </div>
    `;
  }

  function renderStatItem(label, value, isBad) {
    const v = typeof value === 'number' ? Math.round(value) : (value || 0);
    const color = isBad ? (v > 50 ? 'var(--accent-red)' : 'var(--text-primary)') : 'var(--text-primary)';
    return `
      <div class="settle-stat-item">
        <span class="stat-label-s">${label}</span>
        <span class="stat-value-s" style="color:${color};">${v}</span>
      </div>
    `;
  }

  function renderChart(charts) {
    const sv = charts.sealedValueByStep || [];
    const rw = charts.renRewardByStep || [];
    const rs = charts.yiRiskByStep || [];
    const zf = charts.ziFailByStep || [];
    const len = Math.max(sv.length, rw.length, rs.length, zf.length);
    if (len < 2) return '';

    const w = 300, h = 70, pad = 24;
    const iw = w - pad * 2, ih = h - pad;
    const maxVal = Math.max(...sv, ...rw, ...rs, ...zf, 100);
    const stepX = len > 1 ? iw / (len - 1) : 0;
    const scaleY = ih / maxVal;

    const pathFor = (arr, color) => {
      if (arr.length === 0) return '';
      let d = `M ${pad} ${h - pad - (arr[0] * scaleY)}`;
      for (let i = 1; i < arr.length; i++) {
        d += ` L ${pad + i * stepX} ${h - pad - (arr[i] * scaleY)}`;
      }
      return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
    };

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p =>
      `<line x1="${pad}" y1="${h - pad - p * ih}" x2="${w - pad}" y2="${h - pad - p * ih}" stroke="rgba(45,58,92,0.5)" stroke-dasharray="2 2"/>`
    ).join('');

    return `
      <div class="settle-chart">
        <div class="settle-section-title" style="border-bottom:none;margin-bottom:4px;">📈 趋势图</div>
        <svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          ${gridLines}
          ${pathFor(sv, '#3b82f6')}
          ${pathFor(rw, '#10b981')}
          ${pathFor(rs, '#ef4444')}
          ${pathFor(zf, '#f59e0b')}
          <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="rgba(45,58,92,0.8)"/>
        </svg>
        <div class="chart-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#3b82f6;"></span>封存值</div>
          <div class="legend-item"><span class="legend-dot" style="background:#10b981;"></span>壬号奖励</div>
          <div class="legend-item"><span class="legend-dot" style="background:#ef4444;"></span>乙号风险</div>
          <div class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span>子号失败</div>
        </div>
      </div>
    `;
  }

  function renderStepAudit(sr) {
    const typeLabels = { seal: '封存', rewrite: '复写', dispatch: '调度', signal: '信号', skip: '跳过' };
    const at = sr.action?.type || '?';
    const label = typeLabels[at] || at;
    const sealedDelta = (sr.after?.sealedValue || 0) - (sr.before?.sealedValue || 0);
    const sign = sealedDelta >= 0 ? '+' : '';
    const deltaClass = sealedDelta >= 0 ? 'delta-up' : 'delta-down';
    return `
      <div style="padding:4px 0;font-size:10px;border-bottom:1px solid rgba(45,58,92,0.3);">
        <span style="color:var(--text-muted);">Step${sr.step}</span>
        <span style="margin:0 4px;padding:1px 6px;background:var(--bg-card);border-radius:3px;color:var(--accent-cyan);font-weight:600;">${label}</span>
        <span style="color:var(--text-secondary);">封存值 ${Math.round(sr.before?.sealedValue || 0)}→${Math.round(sr.after?.sealedValue || 0)}</span>
        <span class="detail-stat-delta ${deltaClass}" style="font-weight:700;">${sign}${Math.round(sealedDelta)}</span>
        ${sr.eventApplied ? '<span style="color:var(--accent-purple);margin-left:4px;">🎁</span>' : ''}
        ${sr.hiddenUnlocked ? '<span style="color:var(--accent-pink);margin-left:4px;">✨</span>' : ''}
      </div>
    `;
  }

  function clear() {
    currentResult = null;
    render();
  }

  function getResult() {
    return currentResult;
  }

  return { init, recalculate, render, clear, getResult };
})();
