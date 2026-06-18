let _settlementData = null;

async function maybeRefreshSettlement() {
  if (Pages.current === 'settlement') {
    await refreshSettlement();
  }
}

async function refreshSettlement() {
  if (!Game.state) {
    renderEmptySettlement();
    return;
  }
  const levelId = Game.getLevelId();
  const res = await API.calculateSettlement(levelId, Game.state, Game.replay || []);
  if (res.success) {
    _settlementData = res.data;
    renderSettlement(res.data);
  }
}

function renderEmptySettlement() {
  document.getElementById('settlementLevelName').textContent = '';
  const badge = document.getElementById('settlementConditionBadge');
  badge.textContent = '';
  badge.style.cssText = 'display:inline-block;margin-left:16px;padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;';

  const hero = document.getElementById('settlementHero');
  hero.className = 'settlement-hero';
  document.getElementById('settlementStatus').className = 'settlement-status';
  document.getElementById('settlementStatus').textContent = '未开始';
  document.getElementById('settlementScore').textContent = '--';
  const grade = document.getElementById('settlementGrade');
  grade.textContent = '--';
  grade.className = 'settlement-grade';
  document.getElementById('settlementRank').textContent = '--';

  document.getElementById('settlementDetails').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <div class="empty-state-text">请先选择关卡开始游戏</div>
      <div class="empty-state-hint">结算会基于熏染值、协作步骤重新计算</div>
    </div>
  `;
  document.getElementById('settlementBreakdown').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📈</div>
      <div class="empty-state-text">暂无分数数据</div>
    </div>
  `;
  document.getElementById('settlementAchievements').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🏆</div>
      <div class="empty-state-text">暂无成就</div>
    </div>
  `;
}

function getLevelInfo() {
  const id = Game.getLevelId();
  const names = {
    chen: { name: '星尘棋盘双人机关局·辰局', sub: '教学局', color: 'var(--accent-green)' },
    mao: { name: '星尘棋盘双人机关局·卯局', sub: '资源匮乏局', color: 'var(--accent-gold)' },
    xin: { name: '星尘棋盘双人机关局·辛局', sub: '隐藏秘境局', color: 'var(--accent-red)' }
  };
  return names[id] || { name: '未知关卡', sub: '', color: 'var(--accent-purple)' };
}

function renderSettlement(s) {
  const levelInfo = getLevelInfo();
  document.getElementById('settlementLevelName').textContent = levelInfo.name + ' · ' + levelInfo.sub;

  const wc = s.conditions?.win;
  const lc = s.conditions?.lose;

  let statusText = '';
  let statusClass = '';
  let badgeText = '';
  let badgeBg = '';
  let badgeColor = '';

  if (lc && lc.anyMet) {
    const failCond = lc.conditions.find(c => c.met);
    statusText = '💥 挑战失败';
    statusClass = 'lose';
    badgeText = '❌ 失败条件触发：' + (failCond?.name || '');
    badgeBg = 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(249,115,22,0.2))';
    badgeColor = 'var(--accent-red)';
  } else if (wc && wc.allMet) {
    statusText = '🏆 闯关成功！';
    statusClass = 'win';
    badgeText = '✅ 全部胜利条件达成';
    badgeBg = 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(16,185,129,0.15))';
    badgeColor = 'var(--accent-gold)';
  } else if (wc && wc.hiddenMet) {
    statusText = '🔮 隐藏条件胜利！';
    statusClass = 'win';
    badgeText = '✨ 隐藏胜利条件达成：' + (wc.hiddenCondition?.name || '');
    badgeBg = 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.2))';
    badgeColor = 'var(--accent-purple)';
  } else {
    statusText = '⏳ 闯关进行中';
    statusClass = '';
    const metCount = wc?.conditions?.filter(c => c.met).length || 0;
    const totalCount = wc?.conditions?.length || 0;
    badgeText = `🔄 条件进度 ${metCount}/${totalCount}`;
    badgeBg = 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.15))';
    badgeColor = 'var(--accent-cyan)';
  }

  const badge = document.getElementById('settlementConditionBadge');
  badge.textContent = badgeText;
  badge.style.cssText = `display:inline-block;margin-left:16px;padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}40;`;

  const hero = document.getElementById('settlementHero');
  hero.className = 'settlement-hero ' + statusClass;

  const statusEl = document.getElementById('settlementStatus');
  statusEl.className = 'settlement-status ' + statusClass;
  statusEl.textContent = statusText;

  document.getElementById('settlementScore').textContent = s.finalScore;

  const grade = document.getElementById('settlementGrade');
  grade.textContent = s.grade;
  grade.className = 'settlement-grade ' + s.grade;

  document.getElementById('settlementRank').textContent = '称号：' + s.rank;

  renderSettlementDetails(s);
  renderSettlementBreakdown(s);
  renderAchievements(s);
}

function renderSettlementDetails(s) {
  const d = s.details;
  const st = d.steps;
  const wc = s.conditions?.win;
  const lc = s.conditions?.lose;

  let conditionsHtml = '';
  if (wc && wc.conditions && wc.conditions.length) {
    conditionsHtml += `
      <div style="margin-top:12px;padding-top:12px;border-top:2px dashed rgba(148,163,184,0.2);">
        <h4 style="color:var(--accent-gold);margin-bottom:10px;font-size:13px;">🏆 胜利条件（需全部达成）</h4>
        ${wc.conditions.map(c => `
          <div style="display:flex;align-items:center;gap:6px;padding:5px 0;font-size:12px;">
            <span style="color:${c.met ? 'var(--accent-green)' : 'var(--text-muted)'};font-size:14px;">${c.met ? '✅' : '⬜'}</span>
            <span style="${c.met ? 'color:var(--accent-green);font-weight:600;' : 'color:var(--text-muted);'}">${c.display}</span>
          </div>
        `).join('')}
    `;
    if (wc.hiddenCondition) {
      conditionsHtml += `
        <div style="margin-top:8px;padding:8px;background:rgba(168,85,247,0.1);border-radius:8px;border-left:3px solid var(--accent-purple);">
          <div style="font-size:11px;color:var(--accent-purple);font-weight:700;margin-bottom:3px;">🔮 隐藏胜利条件</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;">
            <span style="color:${wc.hiddenCondition.met ? 'var(--accent-purple)' : 'var(--text-muted)'};">${wc.hiddenCondition.met ? '✨' : '🔒'}</span>
            <span style="${wc.hiddenCondition.met ? 'color:var(--accent-purple);font-weight:600;' : 'color:var(--text-muted);'}">${wc.hiddenCondition.display}</span>
          </div>
        </div>
      `;
    }
    conditionsHtml += '</div>';
  }

  if (lc && lc.conditions && lc.conditions.length) {
    conditionsHtml += `
      <div style="margin-top:12px;padding-top:12px;border-top:2px dashed rgba(148,163,184,0.2);">
        <h4 style="color:var(--accent-red);margin-bottom:10px;font-size:13px;">💀 失败条件（触发任一即败）</h4>
        ${lc.conditions.map(c => `
          <div style="display:flex;align-items:center;gap:6px;padding:5px 0;font-size:12px;">
            <span style="color:${c.met ? 'var(--accent-red)' : 'var(--text-muted)'};font-size:14px;">${c.met ? '⚠️' : '✅'}</span>
            <span style="${c.met ? 'color:var(--accent-red);font-weight:600;' : 'color:var(--text-muted);'}">${c.display}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  document.getElementById('settlementDetails').innerHTML = `
    <div style="display:grid;gap:10px;">
      <div class="breakdown-row"><span>🎨 星尘棋盘熏染值</span><span style="font-weight:700;color:var(--accent-gold);">${d.xunran}</span></div>
      <div class="breakdown-row"><span>💡 星尘棋盘点亮痕</span><span style="font-weight:700;">${d.litCells} / ${d.totalCells} (${d.litRatio})</span></div>
      <div class="breakdown-row"><span>📡 星尘棋盘巡测槽（辰号风险）</span><span style="font-weight:700;color:var(--accent-red);">${d.chenRisk}</span></div>
      <div class="breakdown-row"><span>💎 卯号奖励</span><span style="font-weight:700;color:var(--accent-green);">${d.maoReward}</span></div>
      <div class="breakdown-row"><span>☠️ 辛号失败因子</span><span style="font-weight:700;color:var(--accent-pink);">${d.xinFailure}</span></div>
      <div class="breakdown-row"><span>🔄 回合数</span><span style="font-weight:700;">${d.turns}</span></div>
      ${conditionsHtml}
      <div style="margin-top:12px;padding-top:12px;border-top:2px dashed rgba(148,163,184,0.2);">
        <h4 style="color:var(--accent-cyan);margin-bottom:10px;font-size:13px;">👣 协作闯关步骤统计</h4>
        <div class="breakdown-row"><span>总步骤数</span><span style="font-weight:700;">${st.total}</span></div>
        <div class="breakdown-row"><span>🚶 移动步数</span><span>${st.move}</span></div>
        <div class="breakdown-row"><span>💡 点亮步数</span><span>${st.light}</span></div>
        <div class="breakdown-row"><span>🎁 事件触发</span><span>${st.event}</span></div>
        <div class="breakdown-row" style="background:rgba(16,185,129,0.08);padding:8px;border-radius:8px;margin:8px 0;">
          <span style="color:var(--accent-green);font-weight:700;">🤝 协作爆发</span>
          <span style="color:var(--accent-green);font-weight:800;">${st.coop} 次</span>
        </div>
      </div>
    </div>
  `;
}

function renderSettlementBreakdown(s) {
  const b = s.breakdown;
  const rows = [
    { label: '🎨 熏染分（值×2）', val: b.xunranScore, cls: 'positive' },
    { label: '💡 点亮分（点亮率×300）', val: b.litScore, cls: 'positive' },
    { label: '💎 卯号奖励分（×3）', val: b.maoScore, cls: 'positive' },
    { label: '⏱️ 回合奖励', val: b.turnBonus, cls: 'positive' },
    { label: '🤝 协作奖励（×15）', val: b.coopBonus, cls: 'positive' },
    { label: '📡 辰号惩罚（×1.5）', val: -b.chenPenalty, cls: 'negative' },
    { label: '☠️ 辛号惩罚（×2）', val: -b.xinPenalty, cls: 'negative' }
  ];
  document.getElementById('settlementBreakdown').innerHTML = rows.map(r => `
    <div class="breakdown-row">
      <span>${r.label}</span>
      <span class="breakdown-${r.cls}">${r.val > 0 ? '+' : ''}${r.val}</span>
    </div>
  `).join('') + `
    <div class="breakdown-row" style="font-size:12px;color:var(--text-muted);">
      <span>基础分</span><span>+${b.baseScore}</span>
    </div>
    <div class="breakdown-row" style="font-size:12px;color:var(--text-muted);">
      <span>总惩罚</span><span style="color:var(--accent-red);">-${b.penalty}</span>
    </div>
    <div class="breakdown-row total">
      <span>🏁 最终得分</span>
      <span style="background:linear-gradient(135deg,var(--accent-gold),var(--accent-purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${s.finalScore}</span>
    </div>
  `;
}

function renderAchievements(s) {
  const el = document.getElementById('settlementAchievements');
  const ach = s.hiddenAchievements || [];
  if (ach.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏆</div>
        <div class="empty-state-text">暂无成就</div>
        <div class="empty-state-hint">试试不触发辛号因子，或多用协作</div>
      </div>
    `;
    return;
  }
  const icons = {
    perfectionist: '🌟',
    coop_king: '🤴',
    stealth: '🥷',
    pristine: '✨',
    illuminator: '💫'
  };
  el.innerHTML = ach.map(a => `
    <div class="achievement-card">
      <div class="achievement-icon">${icons[a.id] || '🏅'}</div>
      <div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>
    </div>
  `).join('');
}

window.maybeRefreshSettlement = maybeRefreshSettlement;
window.refreshSettlement = refreshSettlement;
