async function init() {
  const restored = Game.restoreFromLocal();
  if (restored && Game.state) {
    hideLevelModal();
    renderAll();
    refreshReplayUI();
    if (Pages.current === 'settlement') {
      await refreshSettlement();
    } else if (Pages.current === 'events') {
      await renderEventsPage();
    }
  } else {
    await showLevelList();
  }
  bindKeyboard();
}

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (Pages.current !== 'board') return;
    if (window._getReplayIndex() >= 0) return;
    if (!Game.state || Game.state.phase !== 'play') return;
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W': e.preventDefault(); moveCurrentPlayer(0, -1); break;
      case 'ArrowDown': case 's': case 'S': e.preventDefault(); moveCurrentPlayer(0, 1); break;
      case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); moveCurrentPlayer(-1, 0); break;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); moveCurrentPlayer(1, 0); break;
      case ' ': case 'Enter': e.preventDefault(); lightCurrentCell(); break;
      case 'e': case 'E': e.preventDefault(); doCoop(); break;
      case 'q': case 'Q': e.preventDefault(); endTurn(); break;
    }
  });
}

function switchTab(page) {
  Pages.set(page);
  if (page === 'events') renderEventsPage();
  if (page === 'replay') refreshReplayUI();
  if (page === 'settlement') refreshSettlement();
  if (page === 'board') renderAll();
}

async function showLevelList() {
  const res = await API.getLevels();
  const listEl = document.getElementById('levelList');
  if (!res.success) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>加载关卡失败</div></div>';
    return;
  }
  listEl.innerHTML = res.data.map(l => `
    <div class="level-card" onclick="selectLevel('${l.id}')">
      <div class="level-card-header">
        <div class="level-name">${l.name}</div>
        <div class="level-difficulty ${UI.difficultyClass(l.difficulty)}">${l.difficulty}</div>
      </div>
      <div class="level-subtitle">${l.subtitle}</div>
      <div class="level-desc">${l.description}</div>
      <div class="level-stats">
        <div class="stat-mini">
          <div class="stat-mini-label">棋盘</div>
          <div class="stat-mini-value">${l.boardSize}×${l.boardSize}</div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-label">起始能量</div>
          <div class="stat-mini-value">${l.playerEnergy}</div>
        </div>
        <div class="stat-mini">
          <div class="stat-mini-label">事件数</div>
          <div class="stat-mini-value">${(l.events||[]).length}</div>
        </div>
      </div>
    </div>
  `).join('');
  await showSavedGames();
}

async function showSavedGames() {
  const res = await API.getSaves();
  const el = document.getElementById('savedGamesList');
  if (!res.success || !res.data || res.data.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px;">📭 暂无存档</div>';
    return;
  }
  el.innerHTML = res.data.slice(0, 10).map(s => {
    const levelNames = { chen: '辰局', mao: '卯局', xin: '辛局' };
    const ln = levelNames[s.levelId] || s.levelId;
    const md = s.metadata || {};
    return `
      <div class="save-card">
        <div>
          <div class="save-info-name">${md.levelName || ln} · ${md.phase === 'win' ? '🏆 已通关' : md.phase === 'lose' ? '💥 失败' : '进行中'}</div>
          <div class="save-info-meta">
            回合 ${md.turn || '-'} · 更新于 ${UI.formatDate(s.updatedAt)} · 步骤 ${s.replay?.length || 0}
          </div>
        </div>
        <div class="save-actions">
          <button class="btn btn-primary btn-sm" onclick="loadSaveGame('${s.id}')">📂 读取</button>
          <button class="btn btn-outline btn-sm" onclick="deleteSaveGame('${s.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

async function selectLevel(levelId) {
  const ok = await Game.startNewLevel(levelId);
  if (ok) {
    hideLevelModal();
    switchTab('board');
    renderAll();
    refreshReplayUI();
    showToast(`🎮 开始：${{chen:'辰局',mao:'卯局',xin:'辛局'}[levelId]}`, 'success');
  } else {
    showToast('关卡初始化失败', 'error');
  }
}

async function loadSaveGame(saveId) {
  const res = await API.getSave(saveId);
  if (!res.success) {
    showToast('读取存档失败', 'error');
    return;
  }
  Game.loadSave(res.data);
  if (!Game.level) {
    const lr = await API.getLevel(res.data.levelId);
    if (lr.success) Game.level = lr.data;
  }
  hideLevelModal();
  switchTab('board');
  renderAll();
  refreshReplayUI();
  showToast('📂 存档读取成功', 'success');
}

async function deleteSaveGame(saveId) {
  if (!confirm('确定删除此存档？')) return;
  const res = await API.deleteSave(saveId);
  if (res.success) {
    showToast('🗑️ 已删除', 'success');
    await showSavedGames();
  } else {
    showToast('删除失败', 'error');
  }
}

function clearLocalData() {
  if (!confirm('确定清除本地进度？（服务器存档不受影响）')) return;
  Store.clear();
  Game.state = null;
  Game.level = null;
  Game.replay = [];
  Game.saveId = null;
  Game.messageLog = [];
  showToast('🧹 本地进度已清除', 'success');
  renderAll();
  location.reload();
}

function showLevelSelect() {
  document.getElementById('levelModal').classList.add('active');
  showLevelList();
}

function hideLevelModal() {
  document.getElementById('levelModal').classList.remove('active');
}

window.switchTab = switchTab;
window.selectLevel = selectLevel;
window.loadSaveGame = loadSaveGame;
window.deleteSaveGame = deleteSaveGame;
window.clearLocalData = clearLocalData;
window.showLevelSelect = showLevelSelect;
window.showToast = showToast;

document.addEventListener('DOMContentLoaded', init);
