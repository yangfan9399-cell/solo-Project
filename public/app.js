const API_BASE = '/api';

let currentCaseId = null;
let currentV1Id = null;
let currentV2Id = null;
let caseData = null;

async function api(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  setTimeout(() => {
    toast.className = 'toast';
  }, 2500);
}

async function loadCases() {
  try {
    const data = await api('/cases');
    renderCaseList(data.cases);
  } catch (e) {
    showToast('加载案例列表失败', 'error');
  }
}

function renderCaseList(cases) {
  const list = document.getElementById('case-list');
  list.innerHTML = cases.map(c => {
    const typeLabels = {
      normal: '正常修订',
      mistake: '证据误换',
      reversal: '结论反转',
      locked: '锁定拒改',
      special: '特殊场景'
    };
    return `
      <div class="case-item ${currentCaseId === c.id ? 'active' : ''}" data-id="${c.id}">
        <div class="case-item-title">${c.name}</div>
        <div class="case-item-desc">${c.description}</div>
        <div class="case-item-meta">
          <span class="case-tag ${c.type}">${typeLabels[c.type] || c.type}</span>
          <span class="case-tag">${c.versionCount}个版本</span>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.case-item').forEach(item => {
    item.addEventListener('click', () => {
      selectCase(item.dataset.id);
    });
  });
}

async function selectCase(caseId) {
  currentCaseId = caseId;
  try {
    caseData = await api(`/cases/${caseId}`);
    const versions = caseData.versions;
    if (versions.length >= 2) {
      currentV1Id = versions[0].id;
      currentV2Id = versions[versions.length - 1].id;
    } else if (versions.length === 1) {
      currentV1Id = versions[0].id;
      currentV2Id = versions[0].id;
    }
    renderCaseDetail();
    loadCases();
  } catch (e) {
    showToast('加载案例详情失败', 'error');
  }
}

function renderCaseDetail() {
  const detail = document.getElementById('case-detail');
  const versions = caseData.versions;

  detail.innerHTML = `
    <div class="case-header">
      <div class="case-title">${caseData.name}</div>
      <div class="case-description">${caseData.description}</div>
      <div class="version-selector">
        <div class="version-select">
          <label>版本 A（对比基准）</label>
          <select id="v1-select">
            ${versions.map(v => `
              <option value="${v.id}" ${v.id === currentV1Id ? 'selected' : ''}>${v.versionName}</option>
            `).join('')}
          </select>
        </div>
        <div class="version-arrow">→</div>
        <div class="version-select">
          <label>版本 B（当前版本）</label>
          <select id="v2-select">
            ${versions.map(v => `
              <option value="${v.id}" ${v.id === currentV2Id ? 'selected' : ''}>${v.versionName}</option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <div id="lock-section"></div>

    <div class="panel">
      <div class="panel-header">
        <span>📎 证据对照</span>
        <span class="badge">压印样张 & 配方批号</span>
      </div>
      <div class="panel-body">
        <div id="evidence-compare" class="evidence-compare"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <span>📊 字段差异</span>
        <span class="badge" id="diff-count-badge">0项变化</span>
      </div>
      <div class="panel-body">
        <div id="diff-content"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <span>⚠️ 结论变化分析</span>
      </div>
      <div class="panel-body">
        <div id="analysis-content"></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <span>💬 人工评论</span>
        <span class="badge" id="comment-count-badge">0条</span>
      </div>
      <div class="panel-body">
        <div id="comments-content" class="comments-section"></div>
      </div>
    </div>
  `;

  document.getElementById('v1-select').addEventListener('change', (e) => {
    currentV1Id = e.target.value;
    loadDiff();
  });
  document.getElementById('v2-select').addEventListener('change', (e) => {
    currentV2Id = e.target.value;
    loadDiff();
  });

  loadDiff();
}

async function loadDiff() {
  const v1 = caseData.versions.find(v => v.id === currentV1Id);
  const v2 = caseData.versions.find(v => v.id === currentV2Id);

  renderEvidenceCompare(v1, v2);
  renderLockSection(v2);

  if (currentV1Id === currentV2Id) {
    renderSameVersion();
    renderComments(v2);
    return;
  }

  try {
    const data = await api(`/cases/${currentCaseId}/diff/${currentV1Id}/${currentV2Id}`);
    renderDiffTable(data.differences);
    renderAnalysis(data.analysis);
    document.getElementById('diff-count-badge').textContent = `${data.differences.length}项变化`;
  } catch (e) {
    showToast('加载差异数据失败', 'error');
  }

  renderComments(v2);
}

function renderSameVersion() {
  document.getElementById('diff-content').innerHTML = `
    <div class="no-diff">请选择两个不同的版本进行对比</div>
  `;
  document.getElementById('analysis-content').innerHTML = `
    <div class="no-diff">请选择两个不同的版本进行对比</div>
  `;
  document.getElementById('diff-count-badge').textContent = '0项变化';
}

function getEdgeClass(value) {
  if (value >= 85) return 'edge-good';
  if (value >= 70) return 'edge-fair';
  return 'edge-poor';
}

function renderEvidenceCompare(v1, v2) {
  const container = document.getElementById('evidence-compare');

  const renderCard = (v) => {
    const edgeVal = v.fields.edgeClarity.value;
    const tempVal = v.fields.storageTemp.value;
    const isHighTemp = tempVal >= 35;
    const edgeClass = getEdgeClass(edgeVal);
    const sampleText = v.sealSample.replace(/_/g, ' ').toUpperCase();

    return `
      <div class="evidence-card">
        <div class="evidence-card-header">
          <span>${v.versionName}</span>
          ${v.isLocked ? '<span class="lock-badge">🔒 已锁定</span>' : ''}
        </div>
        <div class="seal-sample">
          <div class="seal-imprint ${edgeClass} ${isHighTemp ? 'high-temp' : ''}">
            ${sampleText.substring(0, 8)}
          </div>
        </div>
        <div class="evidence-info">
          <div class="evidence-info-row">
            <span class="evidence-info-label">压印样张</span>
            <span class="evidence-info-value">${v.sealSample}</span>
          </div>
          <div class="evidence-info-row">
            <span class="evidence-info-label">配方批号</span>
            <span class="evidence-info-value">${v.formulaBatch}</span>
          </div>
          <div class="evidence-info-row">
            <span class="evidence-info-label">操作人</span>
            <span class="evidence-info-value">${v.operator}</span>
          </div>
          <div class="evidence-info-row">
            <span class="evidence-info-label">创建时间</span>
            <span class="evidence-info-value">${v.createTime}</span>
          </div>
          <div class="evidence-info-row">
            <span class="evidence-info-label">整体结论</span>
            <span class="diff-conclusion conclusion-${v.overallConclusion}">${v.overallConclusion}</span>
          </div>
        </div>
      </div>
    `;
  };

  container.innerHTML = renderCard(v1) + renderCard(v2);
}

function renderDiffTable(diffs) {
  const container = document.getElementById('diff-content');

  if (diffs.length === 0) {
    container.innerHTML = '<div class="no-diff">两个版本完全一致，无差异</div>';
    return;
  }

  const basicDiffs = diffs.filter(d => d.type === 'basic');
  const fieldDiffs = diffs.filter(d => d.type === 'field');

  let html = '<table class="diff-table">';
  html += '<thead><tr><th>字段</th><th>版本 A</th><th>版本 B</th><th>变化</th></tr></thead>';
  html += '<tbody>';

  basicDiffs.forEach(d => {
    html += `
      <tr>
        <td class="diff-field-name">${d.label}</td>
        <td class="diff-old">${d.oldValue}</td>
        <td class="diff-new">${d.newValue}</td>
        <td><span style="color:#fa8c16;">变更</span></td>
      </tr>
    `;
  });

  fieldDiffs.forEach(d => {
    const oldVal = d.oldValue + d.oldUnit;
    const newVal = d.newValue + d.newUnit;
    html += `
      <tr>
        <td class="diff-field-name">${d.label}</td>
        <td>
          <div>${d.valueChanged ? `<span class="diff-old">${oldVal}</span>` : oldVal}</div>
          <div style="margin-top:4px;"><span class="diff-conclusion conclusion-${d.oldConclusion}">${d.oldConclusion}</span></div>
        </td>
        <td>
          <div>${d.valueChanged ? `<span class="diff-new">${newVal}</span>` : newVal}</div>
          <div style="margin-top:4px;"><span class="diff-conclusion conclusion-${d.newConclusion}">${d.newConclusion}</span></div>
        </td>
        <td>
          ${d.conclusionChanged ? '<span style="color:#f5222d;font-weight:500;">结论变更</span>' : '<span style="color:#fa8c16;">数值变更</span>'}
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function renderAnalysis(analysis) {
  const container = document.getElementById('analysis-content');

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    danger: '🚨',
    success: '✅'
  };

  const fieldItems = analysis.filter(a => a.type === 'field');
  const otherItems = analysis.filter(a => a.type !== 'field');

  let html = '<div class="analysis-list">';

  fieldItems.forEach(a => {
    const valueClass = a.valueChanged ? 'analysis-value-new' : 'analysis-value-same';
    const oldValueClass = a.valueChanged ? 'analysis-value-old' : 'analysis-value-same';
    const oldConclusionClass = a.conclusionChanged ? 'analysis-value-old' : 'analysis-value-same';
    const newConclusionClass = a.conclusionChanged ? 'analysis-value-new' : 'analysis-value-same';

    html += `
      <div class="analysis-item ${a.level}">
        <div class="analysis-icon">${icons[a.level] || 'ℹ️'}</div>
        <div class="analysis-content" style="flex:1;">
          <div class="analysis-field">${a.field}</div>
          <div class="analysis-message">${a.message}</div>
          <div class="analysis-values">
            <div class="analysis-value-item">
              <span class="analysis-value-label">版本 A 数值</span>
              <span class="${oldValueClass}">${a.oldValue}${a.oldUnit}</span>
            </div>
            <div class="analysis-value-item">
              <span class="analysis-value-label">版本 B 数值</span>
              <span class="${valueClass}">${a.newValue}${a.newUnit}</span>
            </div>
            <div class="analysis-value-item">
              <span class="analysis-value-label">版本 A 结论</span>
              <span class="${oldConclusionClass}">${a.oldConclusion}</span>
            </div>
            <div class="analysis-value-item">
              <span class="analysis-value-label">版本 B 结论</span>
              <span class="${newConclusionClass}">${a.newConclusion}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  otherItems.forEach(a => {
    html += `
      <div class="analysis-item ${a.level}">
        <div class="analysis-icon">${icons[a.level] || 'ℹ️'}</div>
        <div class="analysis-content">
          <div class="analysis-field">${a.field}</div>
          <div class="analysis-message">${a.message}</div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function renderLockSection(version) {
  const container = document.getElementById('lock-section');

  container.innerHTML = `
    <div class="lock-section">
      <div class="lock-info">
        <div class="lock-icon">${version.isLocked ? '🔒' : '🔓'}</div>
        <div class="lock-text">
          <strong>当前状态：${version.isLocked ? '已锁定' : '未锁定'}</strong>
          <div>${version.isLocked ? '此版本已锁定，无法添加评论或修改' : '此版本未锁定，可以添加评论'}</div>
        </div>
      </div>
      <div>
        ${version.isLocked
          ? `<button class="btn btn-secondary" id="btn-unlock" ${currentV2Id !== caseData.currentVersionId ? 'disabled' : ''}>解锁版本</button>`
          : `<button class="btn btn-danger" id="btn-lock">锁定版本</button>`
        }
      </div>
    </div>
  `;

  const lockBtn = document.getElementById('btn-lock');
  const unlockBtn = document.getElementById('btn-unlock');

  if (lockBtn) {
    lockBtn.addEventListener('click', lockVersion);
  }
  if (unlockBtn) {
    unlockBtn.addEventListener('click', unlockVersion);
  }
}

async function lockVersion() {
  if (!confirm('确定要锁定此版本吗？锁定后将无法添加评论。')) return;
  try {
    await api(`/cases/${currentCaseId}/versions/${currentV2Id}/lock`, { method: 'POST' });
    showToast('版本已锁定', 'success');
    selectCase(currentCaseId);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function unlockVersion() {
  if (!confirm('确定要解锁此版本吗？')) return;
  try {
    await api(`/cases/${currentCaseId}/versions/${currentV2Id}/unlock`, { method: 'POST' });
    showToast('版本已解锁', 'success');
    selectCase(currentCaseId);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderComments(version) {
  const container = document.getElementById('comments-content');
  document.getElementById('comment-count-badge').textContent = `${version.comments.length}条`;

  const canComment = !version.isLocked;

  container.innerHTML = `
    <div class="comment-list">
      ${version.comments.length === 0
        ? '<div class="no-diff" style="padding:20px;">暂无评论</div>'
        : version.comments.map(c => `
          <div class="comment-item ${c.author === '系统' ? 'system' : ''}">
            <div class="comment-header">
              <span class="comment-author">${c.author}</span>
              <span class="comment-time">${c.time}</span>
            </div>
            <div class="comment-content">${c.content}</div>
          </div>
        `).join('')
      }
    </div>

    ${canComment ? `
      <div class="comment-form">
        <div class="comment-inputs">
          <input type="text" id="comment-author" placeholder="您的称呼" />
        </div>
        <textarea id="comment-content" placeholder="输入您的评论..."></textarea>
        <div class="comment-form-actions">
          <button class="btn btn-primary" id="btn-submit-comment">提交评论</button>
        </div>
      </div>
    ` : `
      <div style="text-align:center;color:#8c8c8c;padding:12px;background:#fafafa;border-radius:4px;">
        🔒 版本已锁定，无法添加评论
      </div>
    `}
  `;

  const submitBtn = document.getElementById('btn-submit-comment');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitComment);
  }
}

async function submitComment() {
  const author = document.getElementById('comment-author').value.trim();
  const content = document.getElementById('comment-content').value.trim();

  if (!author) {
    showToast('请输入您的称呼', 'warning');
    return;
  }
  if (!content) {
    showToast('请输入评论内容', 'warning');
    return;
  }

  try {
    await api(`/cases/${currentCaseId}/versions/${currentV2Id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author, content })
    });
    showToast('评论已提交', 'success');
    selectCase(currentCaseId);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function resetData() {
  if (!confirm('确定要重置所有数据吗？评论和锁定状态都会恢复初始状态。')) return;
  try {
    await api('/reset', { method: 'POST' });
    showToast('数据已重置', 'success');
    currentCaseId = null;
    caseData = null;
    document.getElementById('case-detail').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>请从左侧选择一个案例查看版本差异</p>
      </div>
    `;
    loadCases();
  } catch (e) {
    showToast('重置失败', 'error');
  }
}

function init() {
  document.getElementById('btn-reset').addEventListener('click', resetData);
  loadCases();
}

document.addEventListener('DOMContentLoaded', init);
