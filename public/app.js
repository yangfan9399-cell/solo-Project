const LS_KEYS = {
  session: 'mw_br_session',
  autoSave: 'mw_br_autosave'
};

const LABELS = {
  rewriteValue: '复写值', convertSlots: '折算槽', peelMarks: '剥离痕',
  xinRisk: '辛号风险', shenReward: '申号奖励', wuFailFactor: '戊号因子',
  beatPhase: '相位', integrity: '完整度', tension: '张力'
};

const CONDITION_CHECKS = {
  xin: {
    win: (s) => s.beatPhase >= 0.48 && s.beatPhase <= 0.52 && s.integrity >= 70,
    fail: (s) => s.xinRisk >= 80 || s.peelMarks >= 5 || s.integrity <= 0
  },
  shen: {
    win: (s) => s.beatPhase >= 0.48 && s.beatPhase <= 0.52 && s.rewriteValue >= 60 && s.integrity >= 60,
    fail: (s) => s.xinRisk >= 75 || s.peelMarks >= 4 || s.integrity <= 0
  },
  wu: {
    win: (s) => s.beatPhase >= 0.48 && s.beatPhase <= 0.52 && s.rewriteValue >= 70 && s.integrity >= 50 && s.peelMarks <= 3,
    fail: (s) => (s.xinRisk + s.peelMarks * 10 + s.tension) * s.wuFailFactor >= 900 || s.integrity <= 0
  }
};

let state = {
  scenarioId: 'xin',
  scenario: null,
  eventPool: [],
  current: null,
  initial: null,
  steps: [],
  sessionId: null,
  autoSave: true,
  settled: false
};

const $ = (id) => document.getElementById(id);

function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function fmtNum(n, digits = 0) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toFixed(digits);
}

function calcDelta(prev, next) {
  const delta = {};
  const keys = ['rewriteValue', 'convertSlots', 'peelMarks', 'xinRisk', 'shenReward', 'wuFailFactor', 'beatPhase', 'integrity', 'tension'];
  for (const k of keys) {
    const diff = +((next[k] || 0) - (prev[k] || 0)).toFixed(4);
    if (Math.abs(diff) > 0.0001) delta[k] = diff;
  }
  return delta;
}

function deltaChip(key, val) {
  const digits = (key === 'beatPhase') ? 4 : 0;
  const sign = val > 0 ? '+' : '';
  const cls = val > 0 ? 'up' : 'down';
  let display = val;
  if (key === 'beatPhase') display = +val.toFixed(4);
  return `<span class="delta-chip ${cls}">${LABELS[key]} ${sign}${fmtNum(display, digits)}</span>`;
}

function effectChip(key, val) {
  const digits = (key === 'beatPhase') ? 2 : 0;
  const sign = val > 0 ? '+' : '';
  const cls = val > 0 ? 'ef-up' : 'ef-down';
  return `<span class="ef-val ${cls}">${LABELS[key]} ${sign}${fmtNum(val, digits)}</span>`;
}

function requireText(req) {
  if (!req) return '';
  return Object.entries(req).map(([k, v]) => `需${LABELS[k] || k}≥${v}`).join('，');
}

function saveSession() {
  const data = {
    scenarioId: state.scenarioId,
    sessionId: state.sessionId,
    initial: state.initial,
    steps: state.steps,
    current: state.current,
    savedAt: Date.now()
  };
  localStorage.setItem(LS_KEYS.session, JSON.stringify(data));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(LS_KEYS.session);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function clearSession() {
  localStorage.removeItem(LS_KEYS.session);
}

async function loadScenarios() {
  const r = await fetch('/api/scenarios');
  const d = await r.json();
  return d.scenarios;
}

async function loadScenario(id) {
  const r = await fetch(`/api/scenario/${id}`);
  return await r.json();
}

async function checkStep(scenarioId, currentState, eventId) {
  const r = await fetch('/api/step/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, currentState, eventId })
  });
  return await r.json();
}

async function saveReplay(sessionId) {
  const r = await fetch('/api/replay/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenarioId: state.scenarioId,
      sessionId,
      initialState: state.initial,
      steps: state.steps,
      finalState: state.current
    })
  });
  return await r.json();
}

async function recalcSettle() {
  const r = await fetch('/api/settle/recalc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenarioId: state.scenarioId,
      steps: state.steps,
      initialState: state.initial
    })
  });
  return await r.json();
}

async function initSession(scenarioId, useReplayId = null) {
  const r = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, replayId: useReplayId })
  });
  return await r.json();
}

function renderScenarios(list) {
  const wrap = $('scenarioSwitcher');
  wrap.innerHTML = list.map(sc => `
    <button class="scenario-btn ${sc.id === state.scenarioId ? 'active' : ''}" data-id="${sc.id}">
      <span class="sc-icon">${sc.icon}</span>
      <span class="sc-name">${sc.id.toUpperCase()}局</span>
      <span class="sc-diff">${sc.difficulty}</span>
    </button>
  `).join('');
  wrap.querySelectorAll('.scenario-btn').forEach(b => {
    b.addEventListener('click', () => switchScenario(b.dataset.id));
  });
}

function renderMap() {
  const svg = $('mapSvg');
  const mapData = state.scenario && state.scenario.map;
  const s = state.current;

  if (!mapData || !svg) return;

  $('mapTitle').textContent = `${mapData.legend ? mapData.legend.title : mapData.name || '地图'}`;
  $('mapHint').textContent = mapData.legend ? mapData.legend.hint : '';

  const stage = $('mapStage');
  if (stage) stage.style.background = `radial-gradient(ellipse at center, ${mapData.background} 0%, #050810 100%)`;

  const accent = mapData.accentColor || '#6ea8ff';
  const nodesById = {};
  (mapData.nodes || []).forEach(n => nodesById[n.id] = n);

  const edgesSvg = (mapData.edges || []).map((e, i) => {
    const from = nodesById[e.from];
    const to = nodesById[e.to];
    if (!from || !to) return '';
    const active = state.steps.some(st => {
      const role = from.role + '-' + to.role;
      return st.eventName.includes(from.label.split('·')[1] || from.label) ||
             st.eventName.includes(to.label.split('·')[1] || to.label);
    });
    return `<line class="map-edge ${active ? 'active' : ''}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" style="${active ? `stroke:${accent}` : ''}" />`;
  }).join('');

  let centerDecor = '';
  if (mapData.type === 'beat-calibrator' && s) {
    const cx = mapData.center.x;
    const cy = mapData.center.y;
    const angle = (s.beatPhase * 360) - 90;
    const handLen = 70;
    const tx = cx + handLen * Math.cos(angle * Math.PI / 180);
    const ty = cy + handLen * Math.sin(angle * Math.PI / 180);
    centerDecor = `
      <circle class="map-center-glow" cx="${cx}" cy="${cy}" r="40" style="stroke:${accent}" />
      <circle cx="${cx}" cy="${cy}" r="28" fill="none" stroke="${accent}" stroke-width="1" opacity="0.5" />
      <path class="map-zone-target" d="M${cx},${cy} m-34,0 a34,34 0 0,1 68,0 a34,34 0 0,1 -68,0" transform="rotate(-14 ${cx} ${cy})" stroke-dasharray="12 80" fill="none" />
      <line class="map-phase-hand" x1="${cx}" y1="${cy}" x2="${tx}" y2="${ty}" />
      <circle cx="${cx}" cy="${cy}" r="6" fill="#fff" filter="drop-shadow(0 0 8px #fff)" />
    `;
  } else if (mapData.type === 'abyss-forge' && mapData.center) {
    const cx = mapData.center.x;
    const cy = mapData.center.y;
    const coreReady = s && s.convertSlots >= 5 && s.shenReward >= 6;
    const usedHidden = state.steps.some(st => st.eventId === 'wu_e6');
    centerDecor = `
      <circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="${accent}" stroke-width="1" opacity="0.3" />
      <circle cx="${cx}" cy="${cy}" r="38" fill="none" stroke="${accent}" stroke-width="1" opacity="0.5" stroke-dasharray="3 6" />
      <circle cx="${cx}" cy="${cy}" r="26" fill="${usedHidden ? 'rgba(255,210,122,0.25)' : (coreReady ? 'rgba(200,92,255,0.15)' : 'rgba(10,14,23,0.8)')}" stroke="${usedHidden ? '#ffd27a' : (coreReady ? accent : '#2a3a5c')}" stroke-width="2" filter="${coreReady || usedHidden ? 'drop-shadow(0 0 15px ' + (usedHidden ? '#ffd27a' : accent) + ')' : ''}" />
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${usedHidden ? '#ffd27a' : (coreReady ? '#fff' : '#5a6680')}" font-size="14" font-weight="700">${usedHidden ? '★' : (coreReady ? '◈' : '◇')}</text>
    `;
  } else if (mapData.type === 'resource-mine' && mapData.center) {
    const cx = mapData.center.x;
    const cy = mapData.center.y;
    centerDecor = `
      <circle cx="${cx}" cy="${cy}" r="35" fill="rgba(78,214,163,0.05)" stroke="${accent}" stroke-width="1" stroke-dasharray="5 5" opacity="0.5" />
      <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="${accent}" font-size="11" font-weight="600">矿道中枢</text>
    `;
  }

  function nodeState(n) {
    if (!s) return '';
    const role = n.role;
    if (mapData.type === 'beat-calibrator') {
      if (role === 'phase') return s.beatPhase >= 0.48 && s.beatPhase <= 0.52 ? 'lit-gold' : (Math.abs(s.beatPhase - 0.5) < 0.15 ? 'lit' : '');
      if (role === 'calibrator') return s.beatPhase !== state.initial.beatPhase ? 'lit' : '';
      if (role === 'rewrite') return s.rewriteValue >= 55 ? 'lit-green' : (s.rewriteValue > 48 ? 'lit' : '');
      if (role === 'welder') return s.integrity < 100 && s.integrity >= 70 ? 'lit-green' : (s.integrity < 70 ? 'danger' : '');
      if (role === 'purge') return s.xinRisk < 15 ? 'lit-green' : (s.xinRisk < 40 ? 'lit' : (s.xinRisk > 60 ? 'danger' : ''));
      if (role === 'pulse') return s.tension < 30 ? 'lit-green' : (s.tension < 60 ? 'lit' : 'danger');
      if (role === 'slot') return s.convertSlots >= 2 ? 'lit-gold' : (s.convertSlots >= 1 ? 'lit' : '');
    }
    if (mapData.type === 'resource-mine') {
      if (role === 'reward') return s.shenReward >= 5 ? 'lit-gold' : (s.shenReward > 0 ? 'lit' : '');
      if (role === 'exchange') return s.convertSlots >= 3 ? 'lit-gold' : (s.convertSlots >= 1 ? 'lit' : '');
      if (role === 'inject') return s.shenReward >= 0 ? (s.xinRisk > 50 ? 'danger' : 'lit') : '';
      if (role === 'deep') return s.rewriteValue >= 60 ? 'lit-green' : (s.rewriteValue >= 40 ? 'lit' : '');
      if (role === 'repair') return s.integrity >= 80 ? 'lit-green' : (s.integrity >= 60 ? 'lit' : 'danger');
      if (role === 'release') return s.tension < 50 ? 'lit-green' : (s.tension < 70 ? 'lit' : 'danger');
      if (role === 'reverse') return s.beatPhase < 0.5 ? 'lit' : '';
    }
    if (mapData.type === 'abyss-forge') {
      if (role === 'abyss') return Math.abs(s.beatPhase - 0.5) < 0.2 ? 'lit' : (Math.abs(s.beatPhase - 0.5) < 0.1 ? 'lit-gold' : '');
      if (role === 'burst') return s.shenReward >= 6 ? 'lit-gold' : (s.shenReward >= 3 ? 'lit' : '');
      if (role === 'lattice') return s.rewriteValue >= 70 ? 'lit-green' : (s.rewriteValue >= 40 ? 'lit' : '');
      if (role === 'dual-repair') return s.integrity >= 70 ? 'lit-green' : (s.integrity >= 50 ? 'lit' : 'danger');
      if (role === 'suppress') return s.wuFailFactor <= 4 ? 'lit-green' : (s.wuFailFactor <= 6 ? 'lit' : 'danger');
      if (role === 'hedge') return s.xinRisk < 30 ? 'lit-green' : (s.xinRisk < 60 ? 'lit' : 'danger');
      if (role === 'hidden-core') return s.convertSlots >= 5 && s.shenReward >= 6 ? 'lit-purple' : '';
    }
    return '';
  }

  const nodesSvg = (mapData.nodes || []).map(n => {
    const st = nodeState(n);
    const r = (n.role === 'phase' || n.role === 'hidden-core') ? 20 : 16;
    return `
      <g class="map-node ${st}" data-id="${n.id}" data-role="${n.role}">
        <circle class="node-circle" cx="${n.x}" cy="${n.y}" r="${r}" />
        <text class="node-label" x="${n.x}" y="${n.y - r - 6}">${n.label}</text>
        <text class="node-role" x="${n.x}" y="${n.y + 3}">${n.role}</text>
      </g>
    `;
  }).join('');

  svg.innerHTML = `
    <defs>
      <radialGradient id="mapBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${mapData.background}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#050810" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect width="600" height="400" fill="url(#mapBg)" />
    ${edgesSvg}
    ${centerDecor}
    ${nodesSvg}
  `;
}

function renderBoard() {
  const s = state.current;
  if (!s) return;

  $('scenarioSubtitle').textContent = state.scenario ? `${state.scenario.icon} ${state.scenario.name}` : '—';
  $('sessionTag').textContent = state.sessionId ? state.sessionId.slice(-8) : '未连接';

  $('rewriteValueVal').textContent = fmtNum(s.rewriteValue);
  $('convertSlotsVal').textContent = fmtNum(s.convertSlots);
  $('peelMarksVal').textContent = fmtNum(s.peelMarks);
  $('xinRiskVal').textContent = fmtNum(s.xinRisk);
  $('shenRewardVal').textContent = fmtNum(s.shenReward);
  $('wuFailFactorVal').textContent = fmtNum(s.wuFailFactor);
  $('integrityVal').textContent = fmtNum(s.integrity);
  $('tensionVal').textContent = fmtNum(s.tension);
  $('beatPhaseVal').textContent = s.beatPhase.toFixed(4);
  $('phasePointer').style.left = (s.beatPhase * 100) + '%';

  $('stepsVal').textContent = state.steps.length;
  $('maxStepsVal').textContent = state.scenario ? state.scenario.maxSteps : '—';
  $('winDesc').textContent = state.scenario ? state.scenario.winCondition.description : '—';
  $('failDesc').textContent = state.scenario ? state.scenario.failCondition.description : '—';

  $('barRewrite').style.width = Math.min(100, s.rewriteValue) + '%';
  $('barXin').style.width = s.xinRisk + '%';
  $('barShen').style.width = Math.min(100, s.shenReward * 5) + '%';
  $('barWu').style.width = Math.min(100, s.wuFailFactor * 8) + '%';
  $('barIntegrity').style.width = s.integrity + '%';
  $('barTension').style.width = s.tension + '%';

  const slotsEl = $('slotsDots');
  const maxSlots = Math.max(s.convertSlots, 3);
  slotsEl.innerHTML = '';
  for (let i = 0; i < maxSlots; i++) {
    const d = document.createElement('div');
    d.className = 'slot-dot' + (i >= s.convertSlots ? ' empty' : '');
    slotsEl.appendChild(d);
  }

  const peelEl = $('peelScratches');
  peelEl.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const d = document.createElement('div');
    d.className = 'peel-scr' + (i >= s.peelMarks ? ' light' : '');
    peelEl.appendChild(d);
  }

  if (state.scenario && state.scenario.tutorial && state.steps.length < state.scenario.tutorial.length) {
    const box = $('tutorialBox');
    box.style.display = 'block';
    const tip = state.scenario.tutorial[state.steps.length];
    box.innerHTML = `<span class="t-line">💡 ${tip}</span>`;
  } else {
    $('tutorialBox').style.display = 'none';
  }
}

function renderEvents() {
  const list = $('eventList');
  if (!state.eventPool.length) {
    list.innerHTML = '<div class="empty-hint">加载事件中...</div>';
    return;
  }
  list.innerHTML = state.eventPool.map(ev => {
    const canAfford = state.current.convertSlots >= ev.cost;
    let meetReq = true;
    if (ev.require) {
      for (const [k, v] of Object.entries(ev.require)) {
        if ((state.current[k] || 0) < v) { meetReq = false; break; }
      }
    }
    const disabled = !canAfford || !meetReq || state.settled;

    const effectHtml = Object.entries(ev.effect || {}).map(([k, v]) => effectChip(k, v)).join('');
    const tagsHtml = (ev.tags || []).map(t => {
      let cls = '';
      if (['高风险操作', '高损'].includes(t)) cls = 'risky';
      if (['奖励', '兑换'].includes(t)) cls = 'reward';
      if (['关键', '核心增益', '隐藏', '终局'].includes(t)) cls = 'key';
      return `<span class="event-tag ${cls}">${t}</span>`;
    }).join('');

    const showHidden = !ev.hidden || state.current.shenReward >= 4;

    if (ev.hidden && !showHidden) {
      return `
        <div class="event-card disabled hidden-card">
          <div class="event-card-head">
            <span class="event-name">？？？</span>
            <span class="event-cost ${ev.cost === 0 ? 'free' : ''}">◆${ev.cost}</span>
          </div>
          <div class="event-tags"><span class="event-tag key">隐藏事件</span></div>
          <div class="event-flavor" style="border:none;">条件不足，无法检视此工序。</div>
        </div>
      `;
    }

    return `
      <div class="event-card ${disabled ? 'disabled' : ''} ${ev.hidden ? 'hidden-card' : ''}" data-id="${ev.id}">
        <div class="event-card-head">
          <span class="event-name">${ev.name}</span>
          <span class="event-cost ${ev.cost === 0 ? 'free' : ''}">${ev.cost === 0 ? '免费' : '◆' + ev.cost}</span>
        </div>
        <div class="event-tags">${tagsHtml}</div>
        <div class="event-effect">${effectHtml}</div>
        ${ev.require ? `<div class="event-require">${requireText(ev.require)}${!meetReq ? ' ✗' : ' ✓'}</div>` : ''}
        <div class="event-flavor">"${ev.flavor}"</div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.event-card:not(.disabled)').forEach(c => {
    c.addEventListener('click', () => executeStep(c.dataset.id));
  });
}

function renderReplay() {
  const track = $('axisTrack');
  const pct = state.scenario ? (state.steps.length / state.scenario.maxSteps * 100) : 0;
  track.innerHTML = `<div class="axis-progress" style="width:${Math.min(100, pct)}%"></div>`;

  const tl = $('axisTimeline');
  let html = '';
  for (let i = 0; i < state.steps.length; i++) {
    html += `<div class="tl-node ${i === state.steps.length - 1 ? 'current' : ''}" data-idx="${i}">${i + 1}</div>`;
  }
  if (!html) html = '<div style="font-size:11px;color:var(--text-faint);padding:4px;">尚未记录步骤</div>';
  tl.innerHTML = html;

  tl.querySelectorAll('.tl-node').forEach(n => {
    n.addEventListener('click', () => {
      const idx = parseInt(n.dataset.idx);
      showToast(`第 ${idx + 1} 步：${state.steps[idx].eventName}`);
    });
  });

  const list = $('replayList');
  if (!state.steps.length) {
    list.innerHTML = '<div class="empty-hint">尚未执行任何步骤。<br>操作将在此记录，刷新后自动继续当前局。</div>';
    return;
  }
  list.innerHTML = state.steps.map((s, i) => {
    const chips = Object.entries(s.delta || {}).map(([k, v]) => deltaChip(k, v)).join('');
    return `
      <div class="step-item">
        <div class="step-num">${i + 1}</div>
        <div class="step-info">
          <div class="step-event">${s.eventName}</div>
          <div class="step-delta">${chips}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSettlement(settlement) {
  const wrap = $('settleContent');
  if (!settlement) {
    wrap.innerHTML = `
      <div class="settle-empty">
        <div class="settle-icon">✧</div>
        <p>完成操作后提交结算<br>后端将根据陨铁工坊复写值及时序修复步骤重算</p>
      </div>
    `;
    return;
  }

  const cls = settlement.hiddenUnlocked ? 'hidden' : (settlement.win ? 'win' : 'fail');
  const verdict = settlement.hiddenUnlocked
    ? `★ ${settlement.endingName} ★`
    : (settlement.win ? '修 复 成 功' : '修 复 失 败');

  const bd = settlement.breakdown || {};
  const bdEntries = Object.entries(bd).filter(([k]) => k !== 'hiddenBonus');
  const hiddenBonus = bd.hiddenBonus || 0;

  let total = 0;
  const bdItems = bdEntries.map(([k, v]) => {
    total += v;
    const cls2 = v > 0 ? 'plus' : (v < 0 ? 'minus' : '');
    const label = {
      base: '胜/败基准分', rewriteValue: '复写值加成', integrity: '完整度加成',
      shenReward: '申号奖励加成', xinRisk: '辛号风险惩罚', peelMarks: '剥离痕惩罚',
      wuFailFactor: '戊号因子惩罚', stepPenalty: '步数惩罚'
    }[k] || k;
    return `<div class="bd-item"><span class="bd-label">${label}</span><span class="bd-value ${cls2}">${v > 0 ? '+' : ''}${v}</span></div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="settle-result">
      ${settlement.hiddenUnlocked ? `<div class="settle-ending">✦ 解锁隐藏结局：${settlement.endingName} ✦</div>` : ''}
      <div class="settle-header ${cls}">
        <div class="settle-verdict">${verdict}</div>
        <div class="settle-rank">${settlement.rank}</div>
      </div>
      <div class="settle-score-box">
        <div class="settle-score-label">总 评 分</div>
        <div class="settle-score">${settlement.score.toLocaleString()}</div>
      </div>
      <div class="settle-breakdown">
        ${bdItems}
        ${hiddenBonus ? `<div class="bd-item"><span class="bd-label">★ 隐藏结局奖励</span><span class="bd-value bonus">+${hiddenBonus}</span></div>` : ''}
        <div class="bd-item bd-total">
          <span class="bd-label">最 终 结 算</span>
          <span class="bd-value">${settlement.score.toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
}

function renderAll() {
  renderMap();
  renderBoard();
  renderEvents();
  renderReplay();
}

async function executeStep(eventId) {
  if (state.settled) {
    showToast('当前局已结算，请重置或切换局面', 'warn');
    return;
  }
  if (state.scenario && state.steps.length >= state.scenario.maxSteps) {
    showToast('已达到步数上限，请结算', 'warn');
    return;
  }
  const result = await checkStep(state.scenarioId, state.current, eventId);
  if (!result.valid) {
    showToast('操作无效：' + result.reason, 'err');
    $('panelEvents').classList.add('shake');
    setTimeout(() => $('panelEvents').classList.remove('shake'), 400);
    return;
  }

  const ev = result.event;
  const next = result.nextState;
  const delta = calcDelta(state.current, next);

  state.steps.push({
    step: state.steps.length + 1,
    eventId: ev.id,
    eventName: ev.name,
    cost: ev.cost,
    delta,
    stateAfter: { ...next },
    timestamp: Date.now()
  });
  state.current = next;

  $('panelBoard').classList.add('panel-glow');
  setTimeout(() => $('panelBoard').classList.remove('panel-glow'), 1000);

  showToast(`第${state.steps.length}步：${ev.name}`, 'ok');

  if (state.autoSave) {
    await saveReplay(state.sessionId).then(d => {
      if (d.replayId) state.sessionId = d.replayId;
      saveSession();
    }).catch(() => saveSession());
  } else {
    saveSession();
  }

  renderAll();
  autoCheckEnd();
}

function autoCheckEnd() {
  if (!state.scenario) return;
  const s = state.current;
  const steps = state.steps.length;
  const maxSteps = state.scenario.maxSteps;
  const checks = CONDITION_CHECKS[state.scenarioId];
  if (!checks) return;

  if (checks.fail(s) || steps >= maxSteps) {
    showToast('已触发终局条件，请点击结算', 'warn');
  } else if (checks.win(s)) {
    showToast('已达成胜利条件，可点击结算', 'ok');
  }
}

async function doSettle() {
  if (!state.steps.length) {
    showToast('尚未执行任何步骤', 'warn');
    return;
  }
  showToast('正在后端按复写值重算结算...', '');
  try {
    const d = await recalcSettle();
    if (d.finalState) state.current = d.finalState;
    if (d.replayedSteps) {
      for (let i = 0; i < d.replayedSteps.length && i < state.steps.length; i++) {
        state.steps[i].stateAfter = d.replayedSteps[i].stateAfter;
      }
    }
    state.settled = true;
    renderBoard();
    renderEvents();
    renderSettlement(d.settlement);
    const sc = d.settlement;
    if (sc.hiddenUnlocked) {
      showToast(`★ 解锁隐藏结局：${sc.endingName}！`, 'ok');
    } else if (sc.win) {
      showToast(`修复成功！评级 ${sc.rank}，得分 ${sc.score}`, 'ok');
    } else {
      showToast(`修复失败。评级 ${sc.rank}`, 'err');
    }
    await saveReplay(state.sessionId).then(d => {
      if (d.replayId) state.sessionId = d.replayId;
      saveSession();
    }).catch(() => saveSession());
  } catch (e) {
    console.error(e);
    showToast('结算失败：' + e.message, 'err');
  }
}

async function doRecalc() {
  if (!state.steps.length) {
    showToast('尚无步骤可重算', 'warn');
    return;
  }
  showToast('后端重算中...', '');
  try {
    const d = await recalcSettle();
    if (d.finalState) state.current = d.finalState;
    renderAll();
    showToast(`重算完成，共 ${d.replayedSteps.length} 步`, 'ok');
  } catch (e) {
    showToast('重算失败：' + e.message, 'err');
  }
}

async function doSaveNow() {
  try {
    const d = await saveReplay(state.sessionId);
    if (d.replayId) {
      state.sessionId = d.replayId;
      saveSession();
      showToast(`已保存到回放轴：${d.replayId.slice(-8)}`, 'ok');
      if (d.settlement && state.steps.length) {
        renderSettlement(d.settlement);
      }
    }
  } catch (e) {
    saveSession();
    showToast('本地保存成功（离线）', 'warn');
  }
}

async function switchScenario(id) {
  state.scenarioId = id;
  state.settled = false;
  state.steps = [];
  state.current = null;
  state.initial = null;
  state.sessionId = null;
  state.eventPool = [];
  state.scenario = null;
  clearSession();
  renderSettlement(null);
  await bootstrap();
}

async function resetCurrent() {
  state.settled = false;
  state.steps = [];
  state.current = { ...state.initial };
  state.sessionId = null;
  clearSession();
  const sess = await initSession(state.scenarioId);
  state.sessionId = sess.sessionId;
  saveSession();
  renderSettlement(null);
  renderAll();
  showToast('已重置当前局', 'ok');
}

function toggleAutoSave() {
  state.autoSave = !state.autoSave;
  localStorage.setItem(LS_KEYS.autoSave, state.autoSave ? '1' : '0');
  $('btnAutoSave').textContent = (state.autoSave ? '◉' : '○') + ' 自动保存';
  $('btnAutoSave').style.color = state.autoSave ? 'var(--ok)' : 'var(--text-dim)';
  showToast('自动保存已' + (state.autoSave ? '开启' : '关闭'), '');
}

async function bootstrap() {
  try {
    const saved = loadSession();
    const savedAs = localStorage.getItem(LS_KEYS.autoSave);
    if (savedAs !== null) state.autoSave = savedAs === '1';
    $('btnAutoSave').textContent = (state.autoSave ? '◉' : '○') + ' 自动保存';
    $('btnAutoSave').style.color = state.autoSave ? 'var(--ok)' : 'var(--text-dim)';

    const scenarios = await loadScenarios();

    if (saved && saved.scenarioId) {
      state.scenarioId = saved.scenarioId;
    }
    renderScenarios(scenarios);

    const data = await loadScenario(state.scenarioId);
    state.scenario = data.scenario;
    state.eventPool = data.eventPool;

    let resumed = false;
    if (saved && saved.scenarioId === state.scenarioId && saved.steps && saved.steps.length) {
      try {
        const sess = await initSession(state.scenarioId, saved.sessionId);
        if (sess.resumed) {
          state.sessionId = sess.sessionId;
          state.initial = saved.initial || data.initialState;
          state.current = saved.current || saved.initial || data.initialState;
          state.steps = saved.steps;
          resumed = true;
          showToast(`已继续 ${state.scenario.id.toUpperCase()}局（${state.steps.length}步）`, 'ok');
        }
      } catch { }
    }

    if (!resumed) {
      state.initial = data.initialState;
      state.current = { ...data.initialState };
      const sess = await initSession(state.scenarioId);
      state.sessionId = sess.sessionId;
    }

    renderAll();
    if (resumed && state.steps.length) {
      try {
        const d = await recalcSettle();
        if (d.finalState) state.current = d.finalState;
        renderBoard();
      } catch { }
    }

  } catch (e) {
    console.error(e);
    showToast('启动失败：' + e.message, 'err');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  $('btnSettle').addEventListener('click', doSettle);
  $('btnRecalc').addEventListener('click', doRecalc);
  $('btnSaveNow').addEventListener('click', doSaveNow);
  $('btnNewSession').addEventListener('click', resetCurrent);
  $('btnAutoSave').addEventListener('click', toggleAutoSave);
  bootstrap();
});
