let currentRecordId = null;
let currentVersion = null;
let diffVersion1 = null;
let diffVersion2 = null;
let rollbackTargetVersion = null;
let commentVersion = null;
let isRollingBack = false;

async function loadRecords() {
  try {
    const res = await fetch('/api/records');
    const records = await res.json();
    renderRecordList(records);
  } catch (err) {
    console.error('Failed to load records:', err);
  }
}

function renderRecordList(records) {
  const listEl = document.getElementById('recordList');
  listEl.innerHTML = '';
  
  records.forEach(record => {
    const item = document.createElement('div');
    item.className = 'record-item' + (record.id === currentRecordId ? ' active' : '');
    item.onclick = () => selectRecord(record.id);
    
    let badges = `<span class="record-badge badge-version">v${record.currentVersion}</span>`;
    if (record.hasLocked) {
      badges += ` <span class="record-badge badge-locked">🔒已锁定</span>`;
    }
    
    item.innerHTML = `
      <div class="record-item-title">${record.title}</div>
      <div class="record-item-meta">
        <span>${record.versionCount} 个版本</span>
        ${badges}
      </div>
    `;
    listEl.appendChild(item);
  });
}

async function selectRecord(recordId) {
  currentRecordId = recordId;
  currentVersion = null;
  diffVersion1 = null;
  diffVersion2 = null;
  
  loadRecords();
  
  try {
    const res = await fetch(`/api/records/${recordId}`);
    const record = await res.json();
    renderRecordDetail(record);
    
    const latest = record.versions[record.versions.length - 1];
    diffVersion1 = record.versions[0].version;
    diffVersion2 = latest.version;
    currentVersion = latest.version;
    
    loadDiff();
  } catch (err) {
    console.error('Failed to load record:', err);
  }
}

function renderRecordDetail(record) {
  const detailEl = document.getElementById('recordDetail');
  const latestVersion = record.versions[record.versions.length - 1];
  
  detailEl.innerHTML = `
    <div class="detail-header">
      <h2>${record.title}</h2>
      <div class="detail-header-meta">
        <span>📌 当前版本：v${record.currentVersion}</span>
        <span>📊 共 ${record.versions.length} 个版本</span>
        <span>👤 创建者：${latestVersion.createdBy}</span>
      </div>
    </div>
    
    <div class="detail-section">
      <div class="section-header">
        <h3>🌳 版本树</h3>
        <div class="diff-controls">
          <span style="font-size: 12px; color: #666;">对比版本：</span>
          <select class="diff-select" id="diffV1Select" onchange="onDiffVersionChange()"></select>
          <span>→</span>
          <select class="diff-select" id="diffV2Select" onchange="onDiffVersionChange()"></select>
        </div>
      </div>
      <div class="section-body">
        <div class="version-tree-container">
          <div class="version-tree" id="versionTree"></div>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <div class="section-header">
        <h3>📝 字段级差异</h3>
        <span id="diffSummary" style="font-size: 12px; color: #666;"></span>
      </div>
      <div class="section-body" id="diffFields"></div>
    </div>
    
    <div class="detail-section">
      <div class="section-header">
        <h3>🔬 证据差异（显微照片）</h3>
      </div>
      <div class="section-body" id="evidenceDiff"></div>
    </div>
    
    <div class="detail-section">
      <div class="section-header">
        <h3>⚖️ 烘干称重记录对比</h3>
      </div>
      <div class="section-body" id="dryingDiff"></div>
    </div>
    
    <div class="detail-section">
      <div class="section-header">
        <h3>📌 版本信息</h3>
        <div>
          <button class="btn btn-primary btn-sm" onclick="openCommentModal()">💬 评论</button>
          <button class="btn btn-warning btn-sm" onclick="openRollbackModal()">🔄 回滚到此版本</button>
        </div>
      </div>
      <div class="section-body" id="versionInfo"></div>
    </div>
    
    <div class="detail-section">
      <div class="section-header">
        <h3>🔄 回滚历史与影响记录</h3>
      </div>
      <div class="section-body" id="rollbackHistory"></div>
    </div>
  `;
  
  renderVersionTree(record.versions);
  initDiffSelects(record.versions);
  renderVersionInfo(latestVersion);
  renderRollbackHistory(latestVersion);
}

function renderVersionTree(versions) {
  const treeEl = document.getElementById('versionTree');
  treeEl.innerHTML = '';
  
  versions.forEach((v, index) => {
    if (index > 0) {
      const connector = document.createElement('div');
      connector.className = 'version-connector';
      connector.innerHTML = '→';
      treeEl.appendChild(connector);
    }
    
    const node = document.createElement('div');
    node.className = 'version-node' + 
      (v.version === currentVersion ? ' active' : '') +
      (v.isLocked ? ' locked' : '');
    node.onclick = () => selectVersion(v.version);
    
    const date = new Date(v.createdAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    node.innerHTML = `
      <div class="version-number">v${v.version}${v.isLocked ? ' 🔒' : ''}</div>
      <div class="version-source">${v.source}</div>
      <div class="version-date">${dateStr}</div>
    `;
    treeEl.appendChild(node);
  });
}

function initDiffSelects(versions) {
  const v1Select = document.getElementById('diffV1Select');
  const v2Select = document.getElementById('diffV2Select');
  
  v1Select.innerHTML = '';
  v2Select.innerHTML = '';
  
  versions.forEach(v => {
    const opt1 = document.createElement('option');
    opt1.value = v.version;
    opt1.textContent = `v${v.version} - ${v.source}`;
    opt1.selected = v.version === diffVersion1;
    v1Select.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = v.version;
    opt2.textContent = `v${v.version} - ${v.source}`;
    opt2.selected = v.version === diffVersion2;
    v2Select.appendChild(opt2);
  });
}

function onDiffVersionChange() {
  diffVersion1 = parseInt(document.getElementById('diffV1Select').value);
  diffVersion2 = parseInt(document.getElementById('diffV2Select').value);
  loadDiff();
}

async function loadDiff() {
  if (!currentRecordId || !diffVersion1 || !diffVersion2) return;
  
  try {
    const res = await fetch(`/api/records/${currentRecordId}/diff?v1=${diffVersion1}&v2=${diffVersion2}`);
    const diff = await res.json();
    renderDiff(diff);
  } catch (err) {
    console.error('Failed to load diff:', err);
  }
}

function renderDiff(diff) {
  const summaryEl = document.getElementById('diffSummary');
  const fieldsEl = document.getElementById('diffFields');
  const evidenceEl = document.getElementById('evidenceDiff');
  const dryingEl = document.getElementById('dryingDiff');
  
  const changedCount = diff.fieldDiffs.length;
  summaryEl.textContent = `${changedCount} 处差异`;
  
  fieldsEl.innerHTML = '';
  if (diff.fieldDiffs.length === 0) {
    fieldsEl.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">两个版本数据完全一致</p>';
  } else {
    const rootFields = {};
    diff.fieldDiffs.forEach(d => {
      const rootField = d.path.split('.')[0];
      if (!rootFields[rootField]) {
        rootFields[rootField] = [];
      }
      rootFields[rootField].push(d);
    });
    
    Object.keys(rootFields).forEach(rootField => {
      const subDiffs = rootFields[rootField];
      const category = subDiffs[0].category;
      const label = getFieldLabel(rootField);
      
      const fieldEl = document.createElement('div');
      fieldEl.className = `diff-field changed`;
      
      let oldVal = formatValue(diff.fromVersionData.data[rootField]);
      let newVal = formatValue(diff.toVersionData.data[rootField]);
      
      fieldEl.innerHTML = `
        <div class="diff-field-label">
          ${label}
          <span class="diff-category cat-${category}">${getCategoryName(category)}</span>
        </div>
        <div class="diff-old-value">${oldVal}</div>
        <div class="diff-new-value">${newVal}</div>
      `;
      fieldsEl.appendChild(fieldEl);
    });
  }
  
  evidenceEl.innerHTML = `
    <div class="evidence-compare">
      <div class="evidence-item">
        <div class="evidence-label">v${diff.fromVersion} 版本</div>
        <div class="evidence-placeholder">
          <div class="evidence-icon">📷</div>
          <div>${diff.fromVersionData.data.micrographUrl || '无照片'}</div>
        </div>
      </div>
      <div class="evidence-item">
        <div class="evidence-label">v${diff.toVersion} 版本</div>
        <div class="evidence-placeholder">
          <div class="evidence-icon">📷</div>
          <div>${diff.toVersionData.data.micrographUrl || '无照片'}</div>
        </div>
      </div>
    </div>
    ${diff.evidenceChanged ? '<div class="warning-box" style="margin-top: 12px;">⚠️ 显微照片已变更，请仔细比对证据</div>' : ''}
  `;
  
  const fromDrying = diff.fromVersionData.data.dryingWeighingRecord;
  const toDrying = diff.toVersionData.data.dryingWeighingRecord;
  
  dryingEl.innerHTML = `
    <div class="evidence-compare">
      <div class="evidence-item">
        <div class="evidence-label">v${diff.fromVersion} 烘干记录</div>
        <div class="drying-record">
          <div class="drying-item">
            <div class="drying-value">${fromDrying.dryingTemp}℃</div>
            <div class="drying-label">烘干温度</div>
          </div>
          <div class="drying-item">
            <div class="drying-value">${fromDrying.dryingTime}min</div>
            <div class="drying-label">烘干时间</div>
          </div>
          <div class="drying-item">
            <div class="drying-value">${fromDrying.sampleWeight}g</div>
            <div class="drying-label">样品重量</div>
          </div>
          <div class="drying-item">
            <div class="drying-value">${fromDrying.dryWeight}g</div>
            <div class="drying-label">烘干重量</div>
          </div>
        </div>
      </div>
      <div class="evidence-item">
        <div class="evidence-label">v${diff.toVersion} 烘干记录</div>
        <div class="drying-record">
          <div class="drying-item">
            <div class="drying-value">${toDrying.dryingTemp}℃</div>
            <div class="drying-label">烘干温度</div>
          </div>
          <div class="drying-item">
            <div class="drying-value">${toDrying.dryingTime}min</div>
            <div class="drying-label">烘干时间</div>
          </div>
          <div class="drying-item">
            <div class="drying-value">${toDrying.sampleWeight}g</div>
            <div class="drying-label">样品重量</div>
          </div>
          <div class="drying-item">
            <div class="drying-value">${toDrying.dryWeight}g</div>
            <div class="drying-label">烘干重量</div>
          </div>
        </div>
      </div>
    </div>
    ${diff.dryingChanged ? '<div class="info-box" style="margin-top: 12px;">💡 烘干条件已变更，注意不同烘干条件下的判读差异</div>' : ''}
  `;
}

function getFieldLabel(field) {
  const labels = {
    'fiberLengthDistribution': '纤维长度分布',
    'whiteness': '白度',
    'moistureContent': '含水率',
    'beatingBatchNo': '打浆批号',
    'micrographUrl': '显微照片',
    'dryingWeighingRecord': '烘干称重记录',
    'remark': '备注'
  };
  return labels[field] || field;
}

function getCategoryName(category) {
  const names = {
    'fiber': '纤维',
    'whiteness': '白度',
    'moisture': '含水率',
    'drying': '烘干',
    'evidence': '证据',
    'remark': '备注',
    'batch': '批号'
  };
  return names[category] || category;
}

function formatValue(val) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'object') {
    if (val.value !== undefined) {
      return `${val.value} ${val.unit || ''}`;
    }
    if (val.avg !== undefined) {
      return `平均: ${val.avg}${val.unit || ''} (${val.min}-${val.max})`;
    }
    return JSON.stringify(val);
  }
  return String(val);
}

async function selectVersion(versionNum) {
  currentVersion = versionNum;
  
  try {
    const res = await fetch(`/api/records/${currentRecordId}/versions/${versionNum}`);
    const version = await res.json();
    renderVersionInfo(version);
    renderRollbackHistory(version);
  } catch (err) {
    console.error('Failed to load version:', err);
  }
  
  if (currentRecordId) {
    const recordRes = await fetch(`/api/records/${currentRecordId}`);
    const record = await recordRes.json();
    renderVersionTree(record.versions);
  }
}

function renderVersionInfo(version) {
  const infoEl = document.getElementById('versionInfo');
  const date = new Date(version.createdAt);
  const dateStr = date.toLocaleString('zh-CN');
  
  infoEl.innerHTML = `
    <div class="version-info-grid">
      <div class="info-item">
        <div class="info-label">版本号</div>
        <div class="info-value">v${version.version}</div>
      </div>
      <div class="info-item">
        <div class="info-label">版本来源</div>
        <div class="info-value">${version.source}</div>
      </div>
      <div class="info-item">
        <div class="info-label">创建时间</div>
        <div class="info-value">${dateStr}</div>
      </div>
      <div class="info-item">
        <div class="info-label">创建者</div>
        <div class="info-value">${version.createdBy}</div>
      </div>
      <div class="info-item">
        <div class="info-label">锁定状态</div>
        <div class="info-value ${version.isLocked ? 'locked' : ''}">
          ${version.isLocked ? '🔒 已锁定' : '🔓 未锁定'}
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">打浆批号</div>
        <div class="info-value">${version.data.beatingBatchNo}</div>
      </div>
    </div>
    <div style="margin-top: 12px;">
      <div class="info-label" style="margin-bottom: 4px;">修订理由</div>
      <div style="padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 13px;">
        ${version.reason}
      </div>
    </div>
    <div style="margin-top: 12px;">
      <div class="info-label" style="margin-bottom: 4px;">备注</div>
      <div style="padding: 10px; background: #e8f5e9; border-radius: 6px; font-size: 13px; color: #2e7d32;">
        ${version.data.remark || '-'}
      </div>
    </div>
  `;
}

function renderRollbackHistory(version) {
  const historyEl = document.getElementById('rollbackHistory');
  
  if (!version.rollbackHistory || version.rollbackHistory.length === 0) {
    historyEl.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">该版本无回滚记录</p>';
    return;
  }
  
  historyEl.innerHTML = '';
  
  version.rollbackHistory.forEach(rb => {
    const rbEl = document.createElement('div');
    rbEl.className = 'rollback-item';
    
    const date = new Date(rb.timestamp);
    const dateStr = date.toLocaleString('zh-CN');
    
    let affectedHtml = '';
    if (rb.affectedRecords && rb.affectedRecords.length > 0) {
      affectedHtml = `
        <div class="affected-records">
          <span style="font-size: 12px; color: #666;">影响记录：</span>
          ${rb.affectedRecords.map(r => `<span class="affected-tag">${r}</span>`).join('')}
        </div>
      `;
    }
    
    rbEl.innerHTML = `
      <div class="rollback-item-header">
        <span class="rollback-version">v${rb.fromVersion} → v${rb.toVersion}${rb.newVersion ? ` (生成 v${rb.newVersion})` : ''}</span>
        <span class="rollback-time">${dateStr}</span>
      </div>
      <div class="rollback-reason">${rb.reason}</div>
      <div class="rollback-operator">操作人：${rb.operator}</div>
      ${affectedHtml}
    `;
    historyEl.appendChild(rbEl);
  });
}

async function openRollbackModal() {
  if (!currentVersion) {
    alert('请先选择一个版本');
    return;
  }
  
  rollbackTargetVersion = currentVersion;
  
  try {
    const res = await fetch(`/api/records/${currentRecordId}/rollback-preview?targetVersion=${currentVersion}`);
    const preview = await res.json();
    renderRollbackPreview(preview);
  } catch (err) {
    console.error('Failed to load rollback preview:', err);
  }
  
  document.getElementById('rollbackModal').classList.remove('hidden');
}

function renderRollbackPreview(preview) {
  const previewEl = document.getElementById('rollbackPreview');
  const confirmBtn = document.getElementById('confirmRollbackBtn');
  
  let html = '';
  
  if (preview.isLatestLocked) {
    html += `
      <div class="warning-box">
        <strong>🔒 版本锁定警告</strong><br>
        当前最新版本（v${preview.fromVersion}）已被锁定，无法执行回滚操作。<br>
        如需回滚，请先解锁最新版本或联系管理员。
      </div>
    `;
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '版本已锁定';
      confirmBtn.classList.remove('btn-danger');
      confirmBtn.classList.add('btn-secondary');
    }
  } else {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '确认回滚';
      confirmBtn.classList.add('btn-danger');
      confirmBtn.classList.remove('btn-secondary');
    }
  }
  
  html += `
    <div class="rollback-preview-summary">
      <div class="preview-item">
        <span class="preview-label">从版本</span>
        <span class="preview-value">v${preview.fromVersion}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">回滚至</span>
        <span class="preview-value">v${preview.toVersion}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">将生成新版本</span>
        <span class="preview-value">v${preview.newVersionNumber}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">受影响字段数</span>
        <span class="preview-value">${preview.affectedFields} 个</span>
      </div>
    </div>
    
    <div class="info-box">
      ℹ️ 回滚操作不会删除历史版本，而是创建一个新的版本，数据内容与目标版本一致，确保历史记录完整可追溯。所有版本变更均记录在案，不可篡改。
    </div>
    
    <h4 style="margin: 16px 0 8px; color: #1e3a5f;">字段变化预览：</h4>
    <div class="diff-fields">
  `;
  
  if (preview.fieldDiffs.length === 0) {
    html += '<p style="color: #666; padding: 12px;">与当前版本数据一致</p>';
  } else {
    preview.fieldDiffs.forEach(d => {
      const rootField = d.path.split('.')[0];
      html += `
        <div class="diff-field changed">
          <div class="diff-field-label">${d.label}</div>
          <div class="diff-old-value">${formatValue(preview.currentData[rootField])}</div>
          <div class="diff-new-value">${formatValue(preview.targetData[rootField])}</div>
        </div>
      `;
    });
  }
  
  html += '</div>';
  
  if (preview.evidenceChanged) {
    html += `<div class="warning-box" style="margin-top: 12px;">
      <strong>⚠️ 证据变更风险</strong><br>
      回滚包含显微照片等证据变更，请确认证据回滚的必要性和合规性。证据变更将被永久记录。
    </div>`;
  }
  
  previewEl.innerHTML = html;
}

function closeRollbackModal() {
  document.getElementById('rollbackModal').classList.add('hidden');
  rollbackTargetVersion = null;
}

async function confirmRollback() {
  if (isRollingBack) return;
  if (!rollbackTargetVersion) return;
  
  const reason = prompt('请输入回滚理由：', '回滚操作');
  if (!reason) return;
  
  isRollingBack = true;
  const confirmBtn = document.getElementById('confirmRollbackBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = '回滚中...';
  }
  
  try {
    const res = await fetch(`/api/records/${currentRecordId}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetVersion: rollbackTargetVersion,
        reason: reason,
        operator: '当前用户'
      })
    });
    
    if (res.status === 403) {
      const data = await res.json();
      alert('回滚失败：' + data.error);
      return;
    }
    
    if (!res.ok) throw new Error('Rollback failed');
    
    const newVersion = await res.json();
    alert('回滚成功！已生成新版本 v' + newVersion.version);
    closeRollbackModal();
    selectRecord(currentRecordId);
  } catch (err) {
    console.error('Rollback failed:', err);
    alert('回滚失败：' + err.message);
  } finally {
    isRollingBack = false;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = '确认回滚';
    }
  }
}

async function openCommentModal() {
  if (!currentVersion) {
    alert('请先选择一个版本');
    return;
  }
  
  commentVersion = currentVersion;
  
  try {
    const res = await fetch(`/api/records/${currentRecordId}/versions/${currentVersion}`);
    const version = await res.json();
    renderComments(version.comments);
  } catch (err) {
    console.error('Failed to load comments:', err);
  }
  
  document.getElementById('commentModal').classList.remove('hidden');
}

function renderComments(comments) {
  const listEl = document.getElementById('commentList');
  
  if (!comments || comments.length === 0) {
    listEl.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">暂无评论</p>';
    return;
  }
  
  listEl.innerHTML = '';
  comments.forEach(c => {
    const commentEl = document.createElement('div');
    commentEl.className = 'comment-item';
    
    const date = new Date(c.createdAt);
    const dateStr = date.toLocaleString('zh-CN');
    
    commentEl.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${c.author}</span>
        <span class="comment-time">${dateStr}</span>
      </div>
      <div class="comment-content">${c.content}</div>
    `;
    listEl.appendChild(commentEl);
  });
}

function closeCommentModal() {
  document.getElementById('commentModal').classList.add('hidden');
  commentVersion = null;
}

async function submitComment() {
  const author = document.getElementById('commentAuthor').value.trim();
  const content = document.getElementById('commentText').value.trim();
  
  if (!content) {
    alert('请输入评论内容');
    return;
  }
  
  try {
    const res = await fetch(`/api/records/${currentRecordId}/versions/${commentVersion}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content })
    });
    
    if (!res.ok) throw new Error('Failed to submit comment');
    
    const comment = await res.json();
    document.getElementById('commentText').value = '';
    
    const versionRes = await fetch(`/api/records/${currentRecordId}/versions/${commentVersion}`);
    const version = await versionRes.json();
    renderComments(version.comments);
  } catch (err) {
    console.error('Failed to submit comment:', err);
    alert('评论失败：' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRecords();
  
  const confirmRollbackBtn = document.getElementById('confirmRollbackBtn');
  if (confirmRollbackBtn) {
    confirmRollbackBtn.addEventListener('click', confirmRollback);
  }
});
