const Settlement = (function() {
  const state = {
    result: null
  };

  function calculate(level, gameState, history, forced = false) {
    const formula = level.settlementFormula;
    const { lightValue, rewardD, riskA, failB, traceSlotMax, usedSteps, hiddenFlag } = gameState;

    const baseScore = lightValue * 10;
    const rewardBonus = rewardD * 6;
    const riskPenalty = riskA * 8;
    const failPenalty = failB * 15;
    const stepBonus = Math.max(0, (traceSlotMax - usedSteps) * 4);
    const hiddenBonus = (hiddenFlag ? 1 : 0) * 200;

    const levelId = level.id;
    let total = baseScore + rewardBonus - riskPenalty - failPenalty + stepBonus + hiddenBonus;
    let baseMult = 10, rewMult = 6, riskMult = 8, failMult = 15, stepMult = 4;

    if (levelId === 'ding') {
      baseMult = 12; rewMult = 8; riskMult = 10; failMult = 20; stepMult = 5;
    } else if (levelId === 'yi') {
      baseMult = 10; rewMult = 6; riskMult = 9; failMult = 18; stepMult = 4;
    }

    const baseScore2 = lightValue * baseMult;
    const rewardBonus2 = rewardD * rewMult;
    const riskPenalty2 = riskA * riskMult;
    const failPenalty2 = failB * failMult;
    const stepBonus2 = Math.max(0, (traceSlotMax - usedSteps) * stepMult);
    total = baseScore2 + rewardBonus2 - riskPenalty2 - failPenalty2 + stepBonus2 + hiddenBonus;

    let rank = '丙';
    if (total >= 800) rank = '甲+';
    else if (total >= 600) rank = '甲';
    else if (total >= 450) rank = '乙+';
    else if (total >= 300) rank = '乙';
    else if (total >= 150) rank = '丙+';

    const victory = gameState.status === 'victory';
    const grade = victory ? rank : '未通过';

    state.result = {
      victory,
      grade,
      total,
      rank,
      level,
      gameState: { ...gameState },
      formula,
      breakdown: {
        baseScore: baseScore2,
        rewardBonus: rewardBonus2,
        riskPenalty: riskPenalty2,
        failPenalty: failPenalty2,
        stepBonus: stepBonus2,
        hiddenBonus: hiddenBonus
      },
      factors: {
        lightValue, rewardD, riskA, failB,
        traceSlotMax, usedSteps, hiddenFlag
      },
      multipliers: {
        baseMult, rewMult, riskMult, failMult, stepMult
      },
      history: history || [],
      forced
    };

    render();
    return state.result;
  }

  function clear() {
    state.result = null;
    const el = document.getElementById('settlementContent');
    const panel = document.querySelector('.settlement-panel');
    if (panel) panel.classList.remove('active');
    if (el) el.innerHTML = '<div class="empty-hint">推演未完成，暂无结算……</div>';
  }

  function render() {
    const el = document.getElementById('settlementContent');
    const panel = document.querySelector('.settlement-panel');
    if (!el) return;

    if (!state.result) {
      if (panel) panel.classList.remove('active');
      el.innerHTML = '<div class="empty-hint">推演未完成，暂无结算……</div>';
      return;
    }

    if (panel) panel.classList.add('active');

    const r = state.result;
    const v = r.victory;

    let html = '';
    html += `<div class="settlement-header ${v ? 'victory' : 'defeat'}">
      <h3>${v ? '推演成功' : '推演失败'}</h3>
      <div class="settlement-subtitle">
        ${r.level.name}　评级：<strong style="font-size:16px;">${r.grade}</strong>
        ${r.forced ? '　<span style="color:var(--accent-light);">·后端重算</span>' : ''}
      </div>
    </div>`;

    html += `<div class="settlement-section">
      <div class="settlement-section-title">⌘ 局面核心指标</div>
      <div class="settlement-grid">
        <div class="settlement-item">
          <div class="settlement-item-label">潮汐钟塔点亮值</div>
          <div class="settlement-item-value" style="color:var(--accent-light)">${r.factors.lightValue}</div>
        </div>
        <div class="settlement-item">
          <div class="settlement-item-label">甲号风险</div>
          <div class="settlement-item-value" style="color:var(--accent-risk)">${r.factors.riskA}</div>
        </div>
        <div class="settlement-item">
          <div class="settlement-item-label">丁号奖励</div>
          <div class="settlement-item-value" style="color:var(--accent-reward)">${r.factors.rewardD}</div>
        </div>
        <div class="settlement-item">
          <div class="settlement-item-label">乙号失败因子</div>
          <div class="settlement-item-value" style="color:var(--accent-fail)">${r.factors.failB}</div>
        </div>
        <div class="settlement-item">
          <div class="settlement-item-label">已用步数 / 上限</div>
          <div class="settlement-item-value">${r.factors.usedSteps} / ${r.factors.traceSlotMax}</div>
        </div>
        <div class="settlement-item">
          <div class="settlement-item-label">隐藏条件</div>
          <div class="settlement-item-value" style="color:${r.factors.hiddenFlag ? 'var(--accent-trace)' : 'var(--text-muted)'}">${r.factors.hiddenFlag ? '已触发' : '未触发'}</div>
        </div>
      </div>
    </div>`;

    html += `<div class="settlement-section">
      <div class="settlement-section-title">☰ 后端结算公式</div>
      <div class="settlement-formula">
        <div class="formula-line"><span>基础分 = 潮汐钟塔点亮值 × ${r.multipliers.baseMult} = ${r.factors.lightValue} × ${r.multipliers.baseMult}</span><span class="pos">+${r.breakdown.baseScore}</span></div>
        <div class="formula-line"><span>奖励加成 = 丁号奖励 × ${r.multipliers.rewMult} = ${r.factors.rewardD} × ${r.multipliers.rewMult}</span><span class="${r.breakdown.rewardBonus >= 0 ? 'pos' : 'neg'}">${r.breakdown.rewardBonus >= 0 ? '+' : ''}${r.breakdown.rewardBonus}</span></div>
        <div class="formula-line"><span>风险惩罚 = 甲号风险 × ${r.multipliers.riskMult} = ${r.factors.riskA} × ${r.multipliers.riskMult}</span><span class="neg">-${r.breakdown.riskPenalty}</span></div>
        <div class="formula-line"><span>失败惩罚 = 乙号失败因子 × ${r.multipliers.failMult} = ${r.factors.failB} × ${r.multipliers.failMult}</span><span class="neg">-${r.breakdown.failPenalty}</span></div>
        <div class="formula-line"><span>步数奖励 = MAX(0, (上限 - 已用) × ${r.multipliers.stepMult}) = MAX(0, (${r.factors.traceSlotMax} - ${r.factors.usedSteps}) × ${r.multipliers.stepMult})</span><span class="pos">+${r.breakdown.stepBonus}</span></div>
        ${r.level.id === 'yi' ? `<div class="formula-line"><span>隐藏奖励 = 触发条件 × 200</span><span class="pos">+${r.breakdown.hiddenBonus}</span></div>` : ''}
        <div class="formula-line formula-result"><span>总分</span><span>${r.total}</span></div>
      </div>
    </div>`;

    if (r.history && r.history.length > 0) {
      html += `<div class="settlement-section">
        <div class="settlement-section-title">⟲ 步骤明细</div>
        <div class="settlement-history">`;
      r.history.forEach((h, i) => {
        const parts = [];
        if (h.deltaLight) parts.push(`点亮${h.deltaLight > 0 ? '+' : ''}${h.deltaLight}`);
        if (h.deltaRisk) parts.push(`风险${h.deltaRisk > 0 ? '+' : ''}${h.deltaRisk}`);
        if (h.deltaReward) parts.push(`奖励${h.deltaReward > 0 ? '+' : ''}${h.deltaReward}`);
        if (h.deltaFail) parts.push(`失败${h.deltaFail > 0 ? '+' : ''}${h.deltaFail}`);
        const delta = parts.join(' ');
        const isPos = (h.deltaLight || 0) + (h.deltaReward || 0) > (h.deltaRisk || 0) + (h.deltaFail || 0);
        html += `<div class="settlement-history-item">
          <div class="step-num">${i + 1}</div>
          <div class="step-action">${h.label || h.nodeName || '步骤'}</div>
          <div class="step-delta ${isPos ? 'positive' : 'negative'}">${delta || '—'}</div>
        </div>`;
      });
      html += `</div></div>`;
    }

    el.innerHTML = html;
  }

  function flash() {
    const panel = document.querySelector('.settlement-panel');
    if (panel) {
      panel.classList.remove('recalc-flash');
      void panel.offsetWidth;
      panel.classList.add('recalc-flash');
    }
  }

  function getResult() { return state.result; }

  return {
    calculate,
    clear,
    render,
    flash,
    getResult
  };
})();
