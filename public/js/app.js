const API_BASE = '/api';

let state = {
  currentView: 'staging',
  stagingRecords: [],
  queueRecords: [],
  exportRecords: [],
  selectedId: null,
  currentRecord: null,
  filter: 'all',
  selectedStagingIds: new Set()
};

async function api(url, options = {}) {
  try {
    const res = await fetch(API_BASE + url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}

function formatTime(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getResultClass(result) {
  const map = {
    passed: 'result-passed',
    warning: 'result-warning',
    blocked: 'result-blocked',
    rejudge: 'result-rejudge',
    locked: 'result-locked'
  };
  return map[result] || '';
}

function getResultLabel(result) {
  const map = {
    passed: '通过',
    warning: '警告',
    blocked: '阻断',
    rejudge: '需复判',
    locked: '已锁定'
  };
  return map[result] || result;
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      switchView(view);
    });
  });
}

function switchView(view) {
  state.currentView = view;
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });
  
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  document.getElementById(`panel-${view}`).classList.remove('hidden');
  
  if (view === 'staging') loadStagingRecords();
  if (view === 'queue') loadQueueRecords();
  if (view === 'export') loadExportRecords();
  if (view === 'rules') loadRules();
}

async function loadStatistics() {
  try {
    const stats = await api('/statistics');
    document.getElementById('badge-staging').textContent = stats.staging;
    document.getElementById('badge-queue').textContent = stats.queue;
    document.getElementById('badge-export').textContent = stats.export;
    
    const statsBar = document.getElementById('stats-bar');
    statsBar.innerHTML = `
      <span class="stat-item"><span class="stat-num">${stats.results.passed}</span>通过</span>
      <span class="stat-item"><span class="stat-num">${stats.results.warning}</span>警告</span>
      <span class="stat-item"><span class="stat-num">${stats.results.blocked}</span>阻断</span>
      <span class="stat-item"><span class="stat-num">${stats.results.rejudge}</span>复判</span>
    `;
  } catch (e) {}
}

async function loadStagingRecords() {
  try {
    const records = await api('/records?status=staging');
    state.stagingRecords = records;
    renderStagingList();
  } catch (e) {}
}

function renderStagingList() {
  const list = document.getElementById('staging-list');
  if (state.stagingRecords.length === 0) {
    list.innerHTML = '<p class="panel-tip">暂无暂存记录</p>';
    return;
  }
  
  list.innerHTML = state.stagingRecords.map(rec => `
    <div class="record-card ${rec.locked ? 'locked' : ''}" data-id="${rec.id}">
      <input type="checkbox" class="record-checkbox" data-id="${rec.id}" ${state.selectedStagingIds.has(rec.id) ? 'checked' : ''}>
      <div class="record-info">
        <div class="record-title">
          ${rec.name}
          <span class="record-code">${rec.code}</span>
        </div>
        <div class="record-desc">清晰度 ${rec.clarity}级 · 锈蚀 ${rec.rustLevel}级 · 残缺率 ${rec.incompletenessRate}%</div>
      </div>
    </div>
  `).join('');
  
  list.querySelectorAll('.record-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = cb.dataset.id;
      if (cb.checked) {
        state.selectedStagingIds.add(id);
      } else {
        state.selectedStagingIds.delete(id);
      }
    });
  });
  
  list.querySelectorAll('.record-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      selectRecord(id);
      switchView('detail');
    });
  });
}

async function loadQueueRecords() {
  try {
    const records = await api('/records?status=queue');
    state.queueRecords = records;
    renderQueueList();
  } catch (e) {}
}

function renderQueueList() {
  const list = document.getElementById('queue-list');
  let records = state.queueRecords;
  
  if (state.filter !== 'all') {
    records = records.filter(r => r.finalResult === state.filter);
  }
  
  if (records.length === 0) {
    list.innerHTML = '<p class="panel-tip">暂无记录</p>';
    return;
  }
  
  list.innerHTML = records.map(rec => `
    <div class="record-card ${rec.locked ? 'locked' : ''} ${state.selectedId === rec.id ? 'selected' : ''}" data-id="${rec.id}">
      <div class="record-info">
        <div class="record-title">
          ${rec.name}
          <span class="record-code">${rec.code}</span>
          <span class="result-badge ${getResultClass(rec.finalResult)}">${rec.finalResultLabel || '-'}</span>
        </div>
        <div class="record-desc">清晰度 ${rec.clarity}级 · 锈蚀 ${rec.rustLevel}级 · 残缺率 ${rec.incompletenessRate}% · 方位：${rec.wellOrientationLabel || '-'}</div>
        ${rec.textConflict ? `<div class="record-desc" style="color:#ff4d4f;">⚠ 释文存在${rec.textConflict.conflictCount}处冲突</div>` : ''}
      </div>
    </div>
  `).join('');
  
  list.querySelectorAll('.record-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      selectRecord(id);
    });
  });
}

async function selectRecord(id) {
  state.selectedId = id;
  try {
    const record = await api(`/records/${id}`);
    state.currentRecord = record;
    renderDetail();
    renderQueueList();
  } catch (e) {}
}

function renderDetail() {
  const rec = state.currentRecord;
  if (!rec) return;
  
  document.getElementById('detail-empty').classList.add('hidden');
  document.getElementById('detail-content').classList.remove('hidden');
  
  document.getElementById('detail-name').textContent = rec.name;
  document.getElementById('detail-code').textContent = rec.code;
  document.getElementById('detail-orientation').textContent = rec.wellOrientationLabel || '-';
  
  const resultBadge = document.getElementById('detail-result');
  resultBadge.textContent = rec.finalResultLabel || '-';
  resultBadge.className = `result-badge ${getResultClass(rec.finalResult)}`;
  
  document.getElementById('detail-rubbing').innerHTML = generateRubbingSVG(rec);
  document.getElementById('detail-old-text').textContent = rec.oldText || '-';
  document.getElementById('detail-current-text').value = rec.currentText || '';
  
  const clarityPct = (6 - rec.clarity) / 5 * 100;
  const rustPct = rec.rustLevel / 5 * 100;
  const incompletePct = rec.incompletenessRate;
  
  document.getElementById('metric-clarity').style.width = clarityPct + '%';
  document.getElementById('metric-rust').style.width = rustPct + '%';
  document.getElementById('metric-incomplete').style.width = Math.min(incompletePct, 100) + '%';
  
  document.getElementById('metric-clarity-val').textContent = rec.clarity + '级';
  document.getElementById('metric-rust-val').textContent = rec.rustLevel + '级';
  document.getElementById('metric-incomplete-val').textContent = rec.incompletenessRate + '%';
  
  if (rec.textConflict) {
    document.getElementById('text-conflict-warning').classList.remove('hidden');
    document.getElementById('conflict-detail').classList.remove('hidden');
    renderConflictList(rec.textConflict);
  } else {
    document.getElementById('text-conflict-warning').classList.add('hidden');
    document.getElementById('conflict-detail').classList.add('hidden');
  }
  
  renderHistory(rec.operationHistory || []);
  
  const lockBtn = document.getElementById('btn-lock');
  lockBtn.textContent = rec.locked ? '解锁' : '锁定';
  lockBtn.className = rec.locked ? 'btn btn-secondary' : 'btn btn-info';
  
  const isLocked = rec.locked;
  document.getElementById('btn-judge-pass').disabled = isLocked;
  document.getElementById('btn-judge-block').disabled = isLocked;
  document.getElementById('btn-save-text').disabled = isLocked;
  document.getElementById('detail-current-text').disabled = isLocked;
  document.getElementById('btn-add-export').disabled = isLocked || rec.finalResult === 'blocked';
}

function generateRubbingSVG(rec) {
  const seed = rec.id.charCodeAt(rec.id.length - 1);
  const chars = rec.currentText.replace(/[□\s]/g, '').substring(0, 20) || '古井铭文';
  const hasRust = rec.rustLevel >= 3;
  const hasCracks = rec.incompletenessRate > 20;
  const isBlurry = rec.clarity >= 4;
  
  let rustSpots = '';
  if (hasRust) {
    for (let i = 0; i < rec.rustLevel * 3; i++) {
      const x = (seed * (i+1) * 37) % 280 + 10;
      const y = (seed * (i+1) * 53) % 160 + 20;
      const r = 3 + (i % 4);
      rustSpots += `<circle cx="${x}" cy="${y}" r="${r}" fill="#8B4513" opacity="0.4"/>`;
    }
  }
  
  let cracks = '';
  if (hasCracks) {
    cracks = `
      <path d="M30,40 L45,80 L35,120 L50,160" stroke="#666" stroke-width="1" fill="none" opacity="0.6"/>
      <path d="M200,30 L210,70 L195,110" stroke="#666" stroke-width="1" fill="none" opacity="0.5"/>
    `;
  }
  
  const textY = 100;
  const fontSize = 18;
  const charSpacing = 22;
  const startX = 30;
  
  let textElements = '';
  for (let i = 0; i < chars.length; i++) {
    const x = startX + i * charSpacing;
    const y = textY;
    const missing = (seed + i * 7) % 100 < rec.incompletenessRate / 2;
    if (missing) {
      textElements += `<text x="${x}" y="${y}" font-family="STSong, SimSun, serif" font-size="${fontSize}" fill="#999" opacity="0.5">□</text>`;
    } else {
      textElements += `<text x="${x}" y="${y}" font-family="STSong, SimSun, serif" font-size="${fontSize}" fill="#2c1810">${chars[i]}</text>`;
    }
  }
  
  const blurFilter = isBlurry ? 'filter="blur(1.5px)"' : '';
  
  return `
    <svg width="300" height="200" viewBox="0 0 300 200" ${blurFilter}>
      <rect x="5" y="5" width="290" height="190" fill="#f5ecd7" stroke="#c9b896" stroke-width="2" rx="4"/>
      <rect x="15" y="15" width="270" height="170" fill="#ebe0c8" stroke="#b8a882" stroke-width="1" rx="2"/>
      ${rustSpots}
      ${cracks}
      ${textElements}
      <text x="150" y="160" font-family="STSong, SimSun, serif" font-size="12" fill="#666" text-anchor="middle">—— ${rec.code} ——</text>
    </svg>
  `;
}

function renderConflictList(conflict) {
  const list = document.getElementById('conflict-list');
  if (!conflict || !conflict.conflicts) return;
  
  list.innerHTML = conflict.conflicts.map(c => `
    <div class="conflict-item">
      第 ${c.position} 字：旧释文"<strong style="color:#ff4d4f">${c.oldChar}</strong>" → 补读"<strong style="color:#1890ff">${c.newChar}</strong>"
    </div>
  `).join('');
}

function renderHistory(history) {
  const timeline = document.getElementById('history-timeline');
  const typeLabels = {
    import: '导入',
    submit: '提交判读',
    update: '更新信息',
    lock: '锁定',
    unlock: '解锁',
    manual_judge: '人工判读',
    add_export: '加入导出',
    remove_export: '移出导出',
    recalculate: '重算'
  };
  
  timeline.innerHTML = history.slice().reverse().map(h => `
    <div class="history-item">
      <div class="history-content">
        <div class="history-type">${typeLabels[h.type] || h.type}</div>
        <div class="history-meta">${h.operator} · ${formatTime(h.time)}</div>
        <div class="history-remark">${h.remark || ''}</div>
      </div>
    </div>
  `).join('');
}

async function loadRules() {
  try {
    const rules = await api('/rules');
    renderRules(rules);
    renderRuleHits();
  } catch (e) {}
}

function renderRules(rules) {
  const container = document.getElementById('rules-container');
  container.innerHTML = rules.map(r => `
    <div class="rule-card">
      <h4>${r.name} <span class="rule-priority">优先级 ${r.priority}</span></h4>
      <p class="rule-desc">${r.description}</p>
    </div>
  `).join('');
}

function renderRuleHits() {
  const hitDetail = document.getElementById('hit-detail');
  const rec = state.currentRecord;
  
  if (!rec) {
    hitDetail.innerHTML = '<p class="panel-tip">请选择一条记录查看规则命中情况</p>';
    return;
  }
  
  const ruleResults = rec.ruleResults || [];
  const priorityLabels = {
    rule_quality_block: '优先级 1',
    rule_inscription_rejudge: '优先级 2',
    rule_pass_standard: '优先级 3'
  };
  
  let rulesHtml = '';
  ruleResults.forEach((rr, idx) => {
    const hitClass = rr.hit ? 'rule-hit-yes' : 'rule-hit-no';
    const hitIcon = rr.hit ? '✓' : '✗';
    const hitLabel = rr.hit ? '命中' : '未命中';
    
    let reasonsHtml = '';
    if (rr.reasons && rr.reasons.length > 0) {
      reasonsHtml = rr.reasons.map(r => `<div class="hit-reason">${r}</div>`).join('');
    } else if (!rr.hit) {
      reasonsHtml = `<div class="hit-reason miss">各项指标未满足触发条件</div>`;
    }
    
    rulesHtml += `
      <div class="rule-result-card ${hitClass}">
        <div class="rule-result-header">
          <span class="rule-result-icon ${hitClass}">${hitIcon}</span>
          <div class="rule-result-title">
            <h5>${rr.ruleName} <span class="rule-priority">${priorityLabels[rr.ruleId] || ''}</span></h5>
            <span class="rule-result-status">${hitLabel} · ${rr.resultLabel}</span>
          </div>
        </div>
        <div class="rule-result-reasons">
          ${reasonsHtml}
        </div>
      </div>
    `;
  });
  
  const finalRule = rec.hitRule;
  let finalHtml = '';
  if (finalRule) {
    finalHtml = `
      <div class="final-result-section">
        <h4>最终判定结果</h4>
        <div class="final-result-card">
          <div class="final-rule-name">${finalRule.ruleName}</div>
          <div class="hit-reasons">
            ${finalRule.reasons.map(r => `<div class="hit-reason">${r}</div>`).join('')}
          </div>
          <div class="hit-result">
            <span>判定结果：</span>
            <span class="result-badge ${getResultClass(rec.finalResult)}">${rec.finalResultLabel}</span>
          </div>
          ${rec.rejudgeCount ? `<p style="margin-top:10px; font-size:12px; color:#666;">复判次数：${rec.rejudgeCount}次</p>` : ''}
        </div>
      </div>
    `;
  }
  
  if (rec.finalResult === 'locked') {
    rulesHtml += `
      <div class="rule-result-card rule-hit-locked">
        <div class="rule-result-header">
          <span class="rule-result-icon rule-hit-locked">🔒</span>
          <div class="rule-result-title">
            <h5>记录锁定</h5>
            <span class="rule-result-status">已锁定 · 规则不生效</span>
          </div>
        </div>
        <div class="rule-result-reasons">
          <div class="hit-reason">该记录已被管理员锁定，规则判定暂不生效</div>
        </div>
      </div>
    `;
    
    finalHtml = `
      <div class="final-result-section">
        <h4>当前状态</h4>
        <div class="final-result-card">
          <div class="final-rule-name">已锁定</div>
          <div class="hit-reasons">
            <div class="hit-reason">管理员已锁定此记录，待进一步考证</div>
          </div>
          <div class="hit-result">
            <span>状态：</span>
            <span class="result-badge result-locked">已锁定</span>
          </div>
          ${rec.rejudgeCount ? `<p style="margin-top:10px; font-size:12px; color:#666;">复判次数：${rec.rejudgeCount}次</p>` : ''}
        </div>
      </div>
    `;
  }
  
  hitDetail.innerHTML = `
    <div class="all-rule-results">
      <h4>三条规则逐条判定结果</h4>
      ${rulesHtml}
    </div>
    ${finalHtml}
  `;
}

async function loadExportRecords() {
  try {
    const records = await api('/export');
    state.exportRecords = records;
    renderExportList();
    renderExportSummary();
  } catch (e) {}
}

function renderExportSummary() {
  const records = state.exportRecords;
  const summary = document.getElementById('export-summary');
  
  const passed = records.filter(r => r.finalResult === 'passed').length;
  const warning = records.filter(r => r.finalResult === 'warning').length;
  const rejudge = records.filter(r => r.finalResult === 'rejudge').length;
  
  summary.innerHTML = `
    <div class="export-stat">
      <div class="num">${records.length}</div>
      <div class="label">总计</div>
    </div>
    <div class="export-stat">
      <div class="num" style="color:#52c41a">${passed}</div>
      <div class="label">通过</div>
    </div>
    <div class="export-stat">
      <div class="num" style="color:#faad14">${warning}</div>
      <div class="label">警告</div>
    </div>
    <div class="export-stat">
      <div class="num" style="color:#1890ff">${rejudge}</div>
      <div class="label">需复判</div>
    </div>
  `;
}

function renderExportList() {
  const list = document.getElementById('export-list');
  if (state.exportRecords.length === 0) {
    list.innerHTML = '<p class="panel-tip">导出清单为空，请从判读队列添加</p>';
    return;
  }
  
  list.innerHTML = state.exportRecords.map(rec => `
    <div class="record-card" data-id="${rec.id}">
      <div class="record-info">
        <div class="record-title">
          ${rec.name}
          <span class="record-code">${rec.code}</span>
          <span class="result-badge ${getResultClass(rec.finalResult)}">${rec.finalResultLabel}</span>
        </div>
        <div class="record-desc">清晰度 ${rec.clarity}级 · 锈蚀 ${rec.rustLevel}级 · 残缺率 ${rec.incompletenessRate}%</div>
      </div>
      <button class="btn btn-secondary btn-sm btn-remove-export" data-id="${rec.id}">移除</button>
    </div>
  `).join('');
  
  list.querySelectorAll('.record-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-remove-export')) return;
      const id = card.dataset.id;
      selectRecord(id);
      switchView('detail');
    });
  });
  
  list.querySelectorAll('.btn-remove-export').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      try {
        await api(`/records/${id}/export`, { method: 'DELETE' });
        showToast('已从导出清单移除', 'success');
        loadExportRecords();
        loadStatistics();
      } catch (e) {}
    });
  });
}

async function initEvents() {
  document.getElementById('btn-reset').addEventListener('click', async () => {
    if (!confirm('确定要重置所有数据吗？')) return;
    try {
      await api('/reset', { method: 'POST' });
      showToast('数据已重置', 'success');
      state.selectedId = null;
      state.currentRecord = null;
      state.selectedStagingIds.clear();
      loadAll();
    } catch (e) {}
  });
  
  document.getElementById('btn-import-mock').addEventListener('click', async () => {
    try {
      const mockData = {
        code: 'GJ-2024-' + String(Math.floor(Math.random() * 100)).padStart(3, '0'),
        name: '古井镇新发现' + Math.floor(Math.random() * 10) + '号井',
        clarity: Math.floor(Math.random() * 5) + 1,
        rustLevel: Math.floor(Math.random() * 5) + 1,
        incompletenessRate: Math.floor(Math.random() * 50),
        wellOrientation: ['clear', 'unclear', 'unknown'][Math.floor(Math.random() * 3)],
        wellOrientationLabel: ['正南', '模糊', '无法辨识'][Math.floor(Math.random() * 3)],
        oldText: '舊釋文內容示例 年代不詳',
        currentText: '舊釋文內容示例 年代不詳',
        rubbingImage: 'img/mock.svg'
      };
      await api('/records', {
        method: 'POST',
        body: JSON.stringify(mockData)
      });
      showToast('导入成功', 'success');
      loadStagingRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-submit-queue').addEventListener('click', async () => {
    const ids = Array.from(state.selectedStagingIds);
    if (ids.length === 0) {
      showToast('请先选择要提交的记录', 'warning');
      return;
    }
    try {
      await api('/records/submit', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      showToast(`已提交 ${ids.length} 条记录到判读队列`, 'success');
      state.selectedStagingIds.clear();
      loadAll();
    } catch (e) {}
  });
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderQueueList();
    });
  });
  
  document.getElementById('btn-prev').addEventListener('click', () => {
    navigateRecord(-1);
  });
  
  document.getElementById('btn-next').addEventListener('click', () => {
    navigateRecord(1);
  });
  
  document.getElementById('btn-judge-pass').addEventListener('click', async () => {
    if (!state.currentRecord) return;
    try {
      await api(`/records/${state.currentRecord.id}/judge`, {
        method: 'POST',
        body: JSON.stringify({ result: 'passed', remark: '人工判读通过' })
      });
      showToast('已人工判读为通过', 'success');
      await selectRecord(state.currentRecord.id);
      loadQueueRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-judge-block').addEventListener('click', async () => {
    if (!state.currentRecord) return;
    try {
      await api(`/records/${state.currentRecord.id}/judge`, {
        method: 'POST',
        body: JSON.stringify({ result: 'blocked', remark: '人工判读阻断' })
      });
      showToast('已人工判读为阻断', 'success');
      await selectRecord(state.currentRecord.id);
      loadQueueRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-lock').addEventListener('click', async () => {
    if (!state.currentRecord) return;
    const isLocked = state.currentRecord.locked;
    try {
      if (isLocked) {
        await api(`/records/${state.currentRecord.id}/unlock`, { method: 'POST' });
        showToast('已解锁', 'success');
      } else {
        const reason = prompt('请输入锁定原因：', '待进一步考证');
        if (reason === null) return;
        await api(`/records/${state.currentRecord.id}/lock`, {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
        showToast('已锁定', 'success');
      }
      await selectRecord(state.currentRecord.id);
      loadQueueRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-add-export').addEventListener('click', async () => {
    if (!state.currentRecord) return;
    try {
      await api(`/records/${state.currentRecord.id}/export`, { method: 'POST' });
      showToast('已加入导出清单', 'success');
      await selectRecord(state.currentRecord.id);
      loadQueueRecords();
      loadExportRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-save-text').addEventListener('click', async () => {
    if (!state.currentRecord) return;
    const newText = document.getElementById('detail-current-text').value;
    try {
      const result = await api(`/records/${state.currentRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify({ currentText: newText })
      });
      
      if (result.textConflict && result.textConflict.conflict) {
        showToast(`保存成功，检测到 ${result.textConflict.conflictCount} 处释文冲突`, 'warning');
      } else {
        showToast('释文已保存', 'success');
      }
      
      state.currentRecord = result;
      renderDetail();
      loadQueueRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-recalculate').addEventListener('click', async () => {
    try {
      const result = await api('/export/recalculate', { method: 'POST' });
      showToast(`重算完成，${result.changed} 条记录结果有变更`, result.changed > 0 ? 'warning' : 'success');
      loadExportRecords();
      loadStatistics();
    } catch (e) {}
  });
  
  document.getElementById('btn-export').addEventListener('click', () => {
    if (state.exportRecords.length === 0) {
      showToast('导出清单为空', 'warning');
      return;
    }
    
    const headers = ['编号', '名称', '清晰度', '锈蚀级别', '残缺率(%)', '方位', '判读结果', '释文'];
    const rows = state.exportRecords.map(r => [
      r.code,
      r.name,
      r.clarity + '级',
      r.rustLevel + '级',
      r.incompletenessRate,
      r.wellOrientationLabel || '-',
      r.finalResultLabel,
      r.currentText || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `古井铭牌导出清单_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
  });
}

function navigateRecord(direction) {
  const records = state.queueRecords;
  if (records.length === 0) return;
  
  let idx = records.findIndex(r => r.id === state.selectedId);
  if (idx === -1) idx = 0;
  else idx = (idx + direction + records.length) % records.length;
  
  selectRecord(records[idx].id);
}

async function loadAll() {
  await Promise.all([
    loadStatistics(),
    loadStagingRecords(),
    loadQueueRecords(),
    loadExportRecords()
  ]);
}

async function init() {
  initNavigation();
  initEvents();
  await loadAll();
  
  if (state.queueRecords.length > 0) {
    selectRecord(state.queueRecords[0].id);
  }
}

document.addEventListener('DOMContentLoaded', init);
