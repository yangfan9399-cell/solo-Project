const state = {
  currentFilter: '',
  selectedId: null,
  selectedResult: null,
  specimens: [],
  responsiblePersons: []
};

const api = {
  async get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`请求失败: ${res.status}`);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`请求失败: ${res.status}`);
    return res.json();
  }
};

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = 'toast'; }, 2800);
}

function formatDateTime(str) {
  if (!str) return '-';
  const d = new Date(str);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusClass(status) {
  if (status === '待分诊') return 'status-pending';
  if (status === '处理中') return 'status-processing';
  if (status === '已关闭') return 'status-closed';
  return '';
}

async function loadStats() {
  try {
    const s = await api.get('/api/stats');
    document.getElementById('stat-pending').textContent = s.pending;
    document.getElementById('stat-processing').textContent = s.processing;
    document.getElementById('stat-closed').textContent = s.closed;
    if (s.deadlineWarning > 0) {
      document.getElementById('warning-card').style.display = '';
      document.getElementById('stat-warning').textContent = s.deadlineWarning;
    }
  } catch (e) {
    console.warn('统计加载失败', e);
  }
}

async function loadQueue() {
  const listEl = document.getElementById('queue-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';

  try {
    const url = state.currentFilter
      ? `/api/specimens/queue?status=${encodeURIComponent(state.currentFilter)}`
      : '/api/specimens/queue';
    state.specimens = await api.get(url);

    if (state.specimens.length === 0) {
      listEl.innerHTML = '<div class="loading">暂无数据</div>';
      return;
    }

    listEl.innerHTML = state.specimens.map(s => {
      const active = s.id === state.selectedId ? 'active' : '';
      const sc = statusClass(s.triage_status);
      const coords = s.collection_coords.split(',');
      const coordShort = coords.length === 2
        ? `${parseFloat(coords[0]).toFixed(2)}, ${parseFloat(coords[1]).toFixed(2)}`
        : s.collection_coords;
      const retestBadge = s.retest_group
        ? `<span class="queue-retest-badge" title="${s.retest_group.group_name}">🔄 ${s.retest_group.season}复测</span>`
        : '';

      return `
        <div class="queue-item ${sc} ${active}" data-id="${s.id}">
          ${retestBadge}
          <div class="queue-top">
            <span class="queue-spec-no mono">${s.specimen_no}</span>
            <span class="status-tag status-${s.triage_status}">${s.triage_status}</span>
          </div>
          <div class="queue-species">${s.species}</div>
          <div class="queue-abnormal">${s.abnormal_type}</div>
          <div class="queue-meta" style="margin-top:8px;">
            <div class="queue-meta-row">
              <span>📍 ${s.collection_location.split('-').pop()}</span>
              <span>🏔️ ${s.altitude}m</span>
            </div>
            <div class="queue-meta-row">
              <span>🗓️ ${s.collection_date}</span>
              <span>🌐 ${coordShort}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.queue-item').forEach(el => {
      el.addEventListener('click', () => {
        state.selectedId = parseInt(el.dataset.id);
        loadQueue();
        loadDetail();
      });
    });
  } catch (e) {
    listEl.innerHTML = `<div class="loading" style="color:var(--accent-red);">加载失败：${e.message}</div>`;
  }
}

async function loadDetail() {
  if (!state.selectedId) return;

  try {
    const s = await api.get(`/api/specimens/${state.selectedId}`);

    document.getElementById('no-selection-hint').style.display = 'none';
    document.getElementById('detail-container').style.display = 'flex';

    document.getElementById('d-specimen-no').textContent = s.specimen_no;
    document.getElementById('d-species').textContent = s.species;
    document.getElementById('d-abnormal-type').textContent = s.abnormal_type;
    document.getElementById('d-category').textContent = s.belong_category || '未分类';
    const statusEl = document.getElementById('d-status');
    statusEl.textContent = s.triage_status;
    statusEl.className = `status-tag status-${s.triage_status}`;
    const resultEl = document.getElementById('d-result');
    resultEl.textContent = s.triage_result || '未判定';
    resultEl.className = 'tag';
    if (s.triage_result === '误报') resultEl.className += ' tag-warning';
    else if (s.triage_result === '已确认') resultEl.style.cssText = 'background:var(--accent-green-bg);color:var(--accent-green);';
    else if (s.triage_result) resultEl.style.cssText = 'background:var(--accent-blue-bg);color:var(--accent-blue);';

    document.getElementById('d-altitude').textContent = s.altitude;
    document.getElementById('d-substrate').textContent = s.substrate;
    document.getElementById('d-spore').textContent = s.spore_density;
    document.getElementById('d-humidity').textContent = s.humidity_exposure;
    document.getElementById('d-micro').textContent = s.micro_slide;
    document.getElementById('d-coords').textContent = s.collection_coords;
    document.getElementById('d-location').textContent = s.collection_location;
    document.getElementById('d-date').textContent = s.collection_date;
    document.getElementById('d-collector').textContent = s.collector;
    document.getElementById('d-desc').textContent = s.abnormal_desc;

    const retestSection = document.getElementById('section-retest');
    if (s.retest_comparison) {
      retestSection.style.display = 'block';
      const rc = s.retest_comparison;
      document.getElementById('retest-group-name').textContent = rc.group_name;
      document.getElementById('retest-group-id').textContent = '复测组：' + rc.group_id;
      document.getElementById('retest-current-season').textContent = rc.current_season;

      document.getElementById('retest-cat-from').textContent = rc.category_change.from;
      document.getElementById('retest-from-season').textContent = rc.first.season;
      document.getElementById('retest-from-no').textContent = rc.first.specimen_no;
      document.getElementById('retest-cat-to').textContent = rc.category_change.to;
      document.getElementById('retest-to-season').textContent = rc.second.season;
      document.getElementById('retest-to-no').textContent = rc.second.specimen_no;
      document.getElementById('retest-change-summary').textContent = rc.category_change_summary;

      document.getElementById('retest-ctx-location').textContent = rc.shared_context.collection_location;
      document.getElementById('retest-ctx-coords').textContent = rc.shared_context.collection_coords;
      document.getElementById('retest-ctx-altitude').textContent = rc.shared_context.altitude;
      document.getElementById('retest-ctx-substrate').textContent = rc.shared_context.substrate;

      document.getElementById('retest-spring-no').textContent = rc.first.specimen_no;
      document.getElementById('retest-autumn-no').textContent = rc.second.specimen_no;
      document.getElementById('retest-spring-date').textContent = rc.first.collection_date;
      document.getElementById('retest-autumn-date').textContent = rc.second.collection_date;
      document.getElementById('retest-spring-collector').textContent = rc.first.collector;
      document.getElementById('retest-autumn-collector').textContent = rc.second.collector;
      document.getElementById('retest-spring-type').textContent = rc.first.abnormal_type;
      document.getElementById('retest-autumn-type').textContent = rc.second.abnormal_type;
      document.getElementById('retest-spring-spore').textContent = rc.first.spore_density;
      document.getElementById('retest-autumn-spore').textContent = rc.second.spore_density;
      document.getElementById('retest-spring-micro').textContent = rc.first.micro_slide;
      document.getElementById('retest-autumn-micro').textContent = rc.second.micro_slide;
      document.getElementById('retest-spring-cat').textContent = rc.first.belong_category;
      document.getElementById('retest-autumn-cat').textContent = rc.second.belong_category;
      const springStatusEl = document.getElementById('retest-spring-status');
      springStatusEl.textContent = rc.first.triage_status;
      springStatusEl.className = `status-tag status-${rc.first.triage_status}`;
      const autumnStatusEl = document.getElementById('retest-autumn-status');
      autumnStatusEl.textContent = rc.second.triage_status;
      autumnStatusEl.className = `status-tag status-${rc.second.triage_status}`;

      document.getElementById('retest-jump-target').textContent = rc.paired_specimen_no;
      const jumpBtn = document.getElementById('retest-jump-btn');
      jumpBtn.onclick = () => {
        state.selectedId = s.retest_group.paired_specimen_id;
        loadQueue();
        loadDetail();
        showToast('已跳转至关联复测标本');
      };
    } else {
      retestSection.style.display = 'none';
    }

    if (s.responsible_name) {
      document.getElementById('resp-name').textContent = s.responsible_name;
      document.getElementById('resp-role').textContent = s.responsible_role || '';
    } else {
      document.getElementById('resp-name').textContent = '未分配';
      document.getElementById('resp-role').textContent = '';
    }

    if (s.deadline) {
      document.getElementById('deadline').value = s.deadline;
    } else {
      document.getElementById('deadline').value = '';
    }

    const sc = s.similar_cases || [];
    document.getElementById('similar-count').textContent = sc.length;
    const sl = document.getElementById('similar-list');
    if (sc.length === 0) {
      sl.innerHTML = '<div class="empty-similar">暂无相似案例</div>';
    } else {
      sl.innerHTML = sc.map(c => {
        const scorePct = Math.round(c.similarity_score * 100);
        return `
          <div class="similar-card" data-id="${c.similar_id}">
            <div class="similarity-bar">
              <span class="similarity-score">相似度 ${scorePct}%</span>
              <div class="score-bar-track">
                <div class="score-bar-fill" style="width:${scorePct}%"></div>
              </div>
            </div>
            <div class="similar-top">
              <span class="similar-spec mono">${c.specimen_no}</span>
              <span class="similar-status status-${c.triage_status}" style="background:${c.triage_status==='已关闭'?'#eee':c.triage_status==='处理中'?'var(--accent-blue-bg)':'var(--accent-amber-bg)'};color:${c.triage_status==='已关闭'?'var(--text-muted)':c.triage_status==='处理中'?'var(--accent-blue)':'#a37820'};">${c.triage_status}</span>
            </div>
            <div class="similar-species">${c.species}</div>
            <div class="similar-meta">
              <span>📍 ${c.collection_location.split('-').pop()}</span>
              <span>🏔️ ${c.altitude}m</span>
              <span>📎 ${c.substrate.split('（')[0]}</span>
            </div>
            <div class="similar-reason">🔗 ${c.similarity_reason}</div>
          </div>
        `;
      }).join('');

      sl.querySelectorAll('.similar-card').forEach(el => {
        el.addEventListener('click', () => {
          state.selectedId = parseInt(el.dataset.id);
          loadQueue();
          loadDetail();
          showToast('已跳转至关联案例');
        });
      });
    }

    const tl = document.getElementById('timeline');
    const records = s.triage_records || [];
    if (records.length === 0) {
      tl.innerHTML = '<div class="empty-similar">暂无分诊记录</div>';
    } else {
      tl.innerHTML = records.map(r => `
        <div class="timeline-item action-${r.action}">
          <div class="timeline-dot">
            ${r.action === '分诊' ? '✅' : r.action === '改派' ? '🔄' : r.action === '创建' ? '📥' : '📝'}
          </div>
          <div class="timeline-content">
            <div class="timeline-action">
              <span>${r.action}</span>
              <span class="timeline-time">${formatDateTime(r.created_at)}</span>
            </div>
            <div class="timeline-detail">${r.detail}</div>
            <span class="timeline-operator">操作人：${r.operator === 'system' ? '系统' : r.operator}</span>
          </div>
        </div>
      `).join('');
    }

    resetTriageUI();

  } catch (e) {
    showToast(`详情加载失败：${e.message}`, 'error');
  }
}

function resetTriageUI() {
  state.selectedResult = null;
  document.querySelectorAll('.triage-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('note-section').style.display = 'none';
  document.getElementById('triage-note').value = '';
  document.getElementById('close-reason').value = '';
  document.getElementById('close-note').value = '';
  document.getElementById('close-options').style.display = 'none';
}

async function loadResponsiblePersons() {
  try {
    state.responsiblePersons = await api.get('/api/responsible-persons');
    const sel = document.getElementById('new-responsible');
    sel.innerHTML = state.responsiblePersons.map(p =>
      `<option value="${p.id}">${p.name}（${p.role}）${p.status !== '在岗' ? ' - ' + p.status : ''}</option>`
    ).join('');
  } catch (e) {
    console.warn('责任人加载失败', e);
  }
}

function initTriageButtons() {
  document.querySelectorAll('.triage-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state.selectedId) {
        showToast('请先选择一条异常记录', 'warning');
        return;
      }
      state.selectedResult = btn.dataset.result;
      document.querySelectorAll('.triage-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const noteSec = document.getElementById('note-section');
      noteSec.style.display = 'block';

      const needClose = state.selectedResult === '误报' || state.selectedResult === '已确认';
      document.getElementById('close-options').style.display = needClose ? 'flex' : 'none';

      const note = document.getElementById('triage-note');
      if (state.selectedResult === '误报') note.placeholder = '说明误判原因，如：数据录入错误、正常变异范围等';
      else if (state.selectedResult === '需补证') note.placeholder = '请填写需要补充的证据，如：补充显微照片、重新采集、DNA测序等';
      else if (state.selectedResult === '需复核') note.placeholder = '请填写复核要点，如：请专家复核孢子形态、建议跨季节复测等';
      else if (state.selectedResult === '已确认') note.placeholder = '请填写确认结论，如：异常类型确认、建议归档分类等';
    });
  });

  document.getElementById('cancel-triage').addEventListener('click', resetTriageUI);

  document.getElementById('submit-triage').addEventListener('click', async () => {
    if (!state.selectedResult) return;
    if (!state.selectedId) return;

    const needClose = state.selectedResult === '误报' || state.selectedResult === '已确认';
    const closeReason = needClose ? document.getElementById('close-reason').value : null;
    const closeNote = needClose ? document.getElementById('close-note').value : null;

    if (needClose && !closeReason) {
      showToast('请选择关闭原因', 'warning');
      return;
    }

    try {
      await api.post(`/api/specimens/${state.selectedId}/triage`, {
        result: state.selectedResult,
        note: document.getElementById('triage-note').value || null,
        deadline: document.getElementById('deadline').value || null,
        close_reason: closeReason,
        close_note: closeNote,
        operator: '当前用户'
      });
      showToast(`分诊成功：已判定为「${state.selectedResult}」`);
      loadStats();
      loadQueue();
      loadDetail();
    } catch (e) {
      showToast(`分诊失败：${e.message}`, 'error');
    }
  });
}

function initReassignModal() {
  const modal = document.getElementById('reassign-modal');
  const openBtn = document.getElementById('reassign-btn');
  const closeBtn = document.getElementById('close-modal');
  const cancelBtn = document.getElementById('cancel-reassign');
  const confirmBtn = document.getElementById('confirm-reassign');

  const open = () => {
    if (!state.selectedId) {
      showToast('请先选择一条异常记录', 'warning');
      return;
    }
    modal.style.display = 'flex';
    document.getElementById('reassign-reason').value = '';
  };
  const close = () => { modal.style.display = 'none'; };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  cancelBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  confirmBtn.addEventListener('click', async () => {
    const rid = document.getElementById('new-responsible').value;
    const reason = document.getElementById('reassign-reason').value;
    if (!rid) { showToast('请选择责任人', 'warning'); return; }
    try {
      await api.post(`/api/specimens/${state.selectedId}/reassign`, {
        responsible_id: parseInt(rid),
        reason,
        operator: '当前用户'
      });
      showToast('改派成功');
      close();
      loadQueue();
      loadDetail();
    } catch (e) {
      showToast(`改派失败：${e.message}`, 'error');
    }
  });
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentFilter = btn.dataset.status;
      loadQueue();
    });
  });
}

function initDeadline() {
  document.getElementById('set-deadline-btn').addEventListener('click', async () => {
    if (!state.selectedId) {
      showToast('请先选择一条异常记录', 'warning');
      return;
    }
    const deadline = document.getElementById('deadline').value;
    if (!deadline) {
      showToast('请选择处理时限日期', 'warning');
      return;
    }
    try {
      await api.post(`/api/specimens/${state.selectedId}/triage`, {
        result: state.selectedResult || '需补证',
        deadline,
        operator: '当前用户'
      });
      showToast(`处理时限已设置为 ${deadline}`);
      loadStats();
      loadDetail();
    } catch (e) {
      showToast(`设置失败：${e.message}`, 'error');
    }
  });
}

async function init() {
  initFilters();
  initTriageButtons();
  initReassignModal();
  initDeadline();

  await loadStats();
  await loadResponsiblePersons();
  await loadQueue();

  if (state.specimens.length > 0) {
    state.selectedId = state.specimens[0].id;
    loadQueue();
    loadDetail();
  }
}

document.addEventListener('DOMContentLoaded', init);
