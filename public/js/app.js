const App = (function () {
  let currentScenario = null;
  let currentScenarioId = 'yi';
  let gameState = null;
  let currentRound = 1;
  let scenariosCache = {};
  let scenarioInfoList = [];

  async function init() {
    try {
      scenarioInfoList = await fetchJson('/api/scenarios');
    } catch (e) {
      scenarioInfoList = [
        { id: 'yi', name: '乙局·教学指引', description: '教学演练局', difficulty: '教学', rounds: 8 },
        { id: 'ren', name: '壬局·资源短缺', description: '资源匮乏局', difficulty: '困难', rounds: 9 },
        { id: 'zi', name: '子局·隐藏条件', description: '隐藏条件局', difficulty: '谜团', rounds: 10 }
      ];
    }

    const savedScenarioId = localStorage.getItem('yanhu_balloon_current_scenario');
    if (savedScenarioId && ['yi', 'ren', 'zi'].includes(savedScenarioId)) {
      currentScenarioId = savedScenarioId;
    }

    updateScenarioTabs();
    await loadScenario(currentScenarioId);

    bindGlobalEvents();
    Settlement.init();
  }

  async function loadScenario(id) {
    currentScenarioId = id;
    localStorage.setItem('yanhu_balloon_current_scenario', id);

    try {
      currentScenario = await fetchJson(`/api/scenario/${id}`);
    } catch (e) {
      currentScenario = scenariosCache[id];
    }
    scenariosCache[id] = currentScenario;

    resetGame(true);
    updateScenarioTabs();

    const restoredSteps = Timeline.resetWithScenario();
    if (restoredSteps && restoredSteps.length > 0) {
      replaySteps(restoredSteps);
    }
  }

  function replaySteps(savedSteps) {
    if (!savedSteps || savedSteps.length === 0) return;
    for (const step of savedSteps) {
      if (step.action) {
        applyActionToState(step.action, false);
      }
    }
    currentRound = Math.min(savedSteps.length + 1, currentScenario.rounds);
    const firedIds = savedSteps.filter(s => s.eventApplied).map(s => s.eventApplied);
    EventsBox.init(currentScenario, currentRound);
    firedIds.forEach(id => EventsBox.markFired(id));
    Board.init(currentScenario, gameState);
    Board.render();
    Board.renderMap();
    Timeline.restoreSteps(savedSteps);
    toast(`已恢复 ${savedSteps.length} 步操作记录，当前第 ${currentRound} 回`, 'info');
  }

  function resetGame(keepTimeline) {
    if (!currentScenario) return;
    gameState = JSON.parse(JSON.stringify(currentScenario.initialState));
    if (!gameState.resources) gameState.resources = { energy: 0, gas: 0, signal: 0 };
    if (!gameState.nodeSeals) gameState.nodeSeals = {};
    currentRound = 1;
    EventsBox.init(currentScenario, currentRound);
    Board.init(currentScenario, gameState);
    if (!keepTimeline) {
      Timeline.clear();
      Settlement.clear();
    } else {
      Settlement.clear();
    }
    updateScenarioTabs();
  }

  function bindGlobalEvents() {
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (id === currentScenarioId) return;
        showScenarioConfirm(id);
      };
    });

    document.getElementById('settleBtn').onclick = settleGame;
    document.getElementById('restartBtn').onclick = () => {
      if (confirm('确定重置本局吗？所有进度将被清空。')) {
        resetGame(false);
        toast('本局已重置', 'info');
      }
    };

    Board.onAction(handleAction);
  }

  function showScenarioConfirm(newId) {
    const scenarioName = { yi: '乙局·教学指引', ren: '壬局·资源短缺', zi: '子局·隐藏条件' }[newId];
    if (Timeline.getStepCount() > 0) {
      showModal(`
        <div class="modal-header">
          <div class="modal-title">切换到 ${scenarioName}</div>
          <button class="modal-close" onclick="App.closeModal()">×</button>
        </div>
        <div class="modal-body">
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;margin-bottom:16px;">
            当前局存在操作记录，切换后将：<br>
            <span style="color:var(--accent-yellow);">⚠</span> 当前局进度会被保存（可切换回来继续）<br>
            <span style="color:var(--accent-green);">✓</span> ${scenarioName} 将加载保存的进度或开始新局
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button class="btn btn-cancel" onclick="App.closeModal()">取消</button>
            <button class="btn btn-confirm" onclick="App.confirmSwitchScenario('${newId}')">确认切换</button>
          </div>
        </div>
      `);
    } else {
      loadScenario(newId);
    }
  }

  function confirmSwitchScenario(newId) {
    closeModal();
    loadScenario(newId);
  }

  function updateScenarioTabs() {
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.id === currentScenarioId);
    });
  }

  function handleAction(action) {
    const stateBefore = JSON.parse(JSON.stringify(gameState));
    const eventApplied = applyActionToState(action, true);

    const step = {
      action,
      stateBefore,
      stateAfter: JSON.parse(JSON.stringify(gameState))
    };

    if (eventApplied) {
      step.eventApplied = eventApplied.id;
      step.eventTitle = eventApplied.title;
      step.eventDesc = eventApplied.desc;
    }

    if (gameState.hiddenUnlocked && !stateBefore.hiddenUnlocked) {
      step.hiddenUnlocked = true;
    }

    Timeline.addStep(step);
    Board.updateState(gameState);
    Board.renderMap();
    EventsBox.setRound(currentRound);
    currentRound++;

    checkEndCondition();

    if (currentRound <= currentScenario.rounds) {
      EventsBox.setRound(currentRound);
      const curEv = EventsBox.getCurrentEvent();
      if (curEv) {
        setTimeout(() => toast(`📌 第${currentRound}回：${curEv.title}`, 'info'), 400);
      }
    }
  }

  function applyActionToState(action, doToast) {
    const s = gameState;
    let appliedEvent = null;

    switch (action.type) {
      case 'seal': {
        const node = currentScenario.map.nodes.find(n => n.id === action.nodeId);
        const currentSeal = s.nodeSeals?.[action.nodeId] || 0;
        const maxSeal = Math.min(action.amount || 0, (node?.capacity || 0) - currentSeal, (s.resources.energy || 0) * 2);
        if (maxSeal > 0 && node) {
          s.sealedValue = (s.sealedValue || 0) + maxSeal;
          s.resources.energy -= Math.ceil(maxSeal * 0.5);
          s.traceMarks = (s.traceMarks || 0) + 1;
          s.nodeSeals[action.nodeId] = currentSeal + maxSeal;
          if (action.nodeId === 'B' && (s.nodeSeals['B'] >= 80)) s.prismActivated = true;
          if (action.nodeId === 'C' && (s.nodeSeals['C'] >= 80)) s.echoActivated = true;
          if (doToast) toast(`🔒 封存 ${node.name} +${maxSeal}（能量-${Math.ceil(maxSeal * 0.5)}）`, 'success');
        } else {
          if (doToast) toast('封存失败：条件不满足', 'error');
        }
        break;
      }
      case 'rewrite': {
        if ((s.rewriteSlots || 0) > 0) {
          s.rewriteSlots -= 1;
          s.sealedValue = (s.sealedValue || 0) + (action.bonus || 25);
          const node = currentScenario.map.nodes.find(n => n.id === action.nodeId);
          if (node) node.capacity += 100;
          if (doToast) toast(`✏️ 复写成功！封存值+${action.bonus || 25}`, 'success');
        } else if (doToast) toast('复写槽不足', 'error');
        break;
      }
      case 'dispatch': {
        const edge = currentScenario.map.edges.find(e =>
          (e.from === action.from && e.to === action.to) ||
          (e.from === action.to && e.to === action.from)
        );
        if (edge && (s.resources.gas || 0) >= edge.cost) {
          s.resources.gas -= edge.cost;
          s.traceMarks = (s.traceMarks || 0) + 1;
          s.sealedValue = (s.sealedValue || 0) + Math.floor(edge.maxFlow * 0.2);
          if (doToast) toast(`⚙️ 调度 ${action.from}→${action.to}（气囊-${edge.cost}）`, 'success');
        } else if (doToast) toast('气囊不足，调度失败', 'error');
        break;
      }
      case 'signal': {
        if ((s.resources.signal || 0) >= 20) {
          s.resources.signal -= 20;
          s.renReward = (s.renReward || 0) + 15;
          s.yiRisk = Math.max(0, (s.yiRisk || 0) - 5);
          if (doToast) toast('📡 信号释放：壬号+15，乙号-5', 'success');
        } else if (doToast) toast('信号不足', 'error');
        break;
      }
      case 'skip': {
        s.ziFailFactor = (s.ziFailFactor || 0) + 5;
        if (doToast) toast('⏭️ 跳过回合：子号失败因子+5', 'warn');
        break;
      }
    }

    const roundEvent = EventsBox.getCurrentEvent();
    if (roundEvent && roundEvent.effect) {
      applyEventEffect(roundEvent.effect);
      EventsBox.markFired(roundEvent.id);
      appliedEvent = roundEvent;
      if (doToast) toast(`🎁 事件「${roundEvent.title}」生效`, 'info');
    }

    if (currentScenario.hiddenCondition && !s.hiddenUnlocked && currentScenario.hiddenCondition(s)) {
      s.hiddenUnlocked = true;
      if (currentScenario.hiddenBonus) {
        applyEventEffect(currentScenario.hiddenBonus(s));
      }
      if (doToast) {
        setTimeout(() => showModal(`
          <div class="modal-header">
            <div class="modal-title">✨ 隐藏条件解锁！</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div style="text-align:center;padding:14px;">
              <div style="font-size:48px;margin-bottom:12px;">🚪</div>
              <div style="font-size:18px;font-weight:700;background:linear-gradient(135deg,var(--accent-purple),var(--accent-pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;">虚数门开启！</div>
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.8;margin-bottom:14px;">
                棱镜阵与回响塔的共鸣达到临界值<br>
                通往真结局的隐藏路径已显现
              </div>
              <div style="padding:10px;background:var(--bg-card);border-radius:8px;font-size:11px;color:var(--text-secondary);line-height:1.6;">
                🎯 <b style="color:var(--accent-green);">额外奖励</b><br>
                封存值大幅提升，壬号奖励+50，乙号风险降低
              </div>
            </div>
            <div style="display:flex;justify-content:center;">
              <button class="btn btn-primary" onclick="App.closeModal()">继续</button>
            </div>
          </div>
        `), 300);
      }
    }

    clampState();
    return appliedEvent;
  }

  function applyEventEffect(effect) {
    const s = gameState;
    if (effect.sealedValue) s.sealedValue = (s.sealedValue || 0) + effect.sealedValue;
    if (effect.rewriteSlots) s.rewriteSlots = (s.rewriteSlots || 0) + effect.rewriteSlots;
    if (effect.traceMarks) s.traceMarks = (s.traceMarks || 0) + effect.traceMarks;
    if (effect.yiRisk) s.yiRisk = (s.yiRisk || 0) + effect.yiRisk;
    if (effect.renReward) s.renReward = (s.renReward || 0) + effect.renReward;
    if (effect.ziFailFactor) s.ziFailFactor = (s.ziFailFactor || 0) + effect.ziFailFactor;
    if (effect.resources) {
      if (!s.resources) s.resources = { energy: 0, gas: 0, signal: 0 };
      if (effect.resources.energy) s.resources.energy += effect.resources.energy;
      if (effect.resources.gas) s.resources.gas += effect.resources.gas;
      if (effect.resources.signal) s.resources.signal += effect.resources.signal;
    }
  }

  function clampState() {
    const s = gameState;
    if (s.sealedValue < 0) s.sealedValue = 0;
    if (s.yiRisk < 0) s.yiRisk = 0;
    if (s.ziFailFactor < 0) s.ziFailFactor = 0;
    if (s.renReward < 0) s.renReward = 0;
    if (s.resources) {
      if (s.resources.energy < 0) s.resources.energy = 0;
      if (s.resources.gas < 0) s.resources.gas = 0;
      if (s.resources.signal < 0) s.resources.signal = 0;
    }
  }

  function checkEndCondition() {
    if (isLoss()) {
      toast('💀 已触发失败条件，请结算查看结果', 'error');
      setTimeout(() => settleGame(), 800);
      return;
    }
    if (currentRound > currentScenario.rounds) {
      if (isWin()) {
        toast('🎉 恭喜达成胜利条件！', 'success');
      } else {
        toast('⏰ 回合结束，请结算查看结果', 'warn');
      }
      setTimeout(() => settleGame(), 800);
    }
  }

  function isWin() {
    const s = gameState;
    if (currentScenarioId === 'yi') return s.sealedValue >= 280 && s.renReward >= 60 && s.yiRisk <= 40;
    if (currentScenarioId === 'ren') return s.sealedValue >= 200 && s.renReward >= 80 && s.resources.energy >= 20;
    if (currentScenarioId === 'zi') return s.sealedValue >= 250 && s.renReward >= 50 && s.ziFailFactor < 80;
    return false;
  }

  function isLoss() {
    const s = gameState;
    if (currentScenarioId === 'yi') return s.sealedValue <= 0 || s.ziFailFactor >= 100 || s.rewriteSlots < 0;
    if (currentScenarioId === 'ren') return s.sealedValue <= 0 || s.ziFailFactor >= 100 || s.resources.energy <= 0;
    if (currentScenarioId === 'zi') return s.sealedValue <= 0 || s.ziFailFactor >= 100;
    return false;
  }

  async function settleGame() {
    const btn = document.getElementById('settleBtn');
    btn.disabled = true;
    btn.textContent = '📊 结算中...';
    try {
      const steps = Timeline.getSteps().map(s => ({
        action: s.action,
        eventApplied: s.eventApplied
      }));
      const result = await Settlement.recalculate(currentScenarioId, steps, gameState);
      if (result) {
        let emoji = '📋';
        if (result.isHiddenEnding) emoji = '🌟';
        else if (result.isWin) emoji = '🏆';
        else if (result.isLoss) emoji = '💀';
        showModal(`
          <div class="modal-header">
            <div class="modal-title">${emoji} 结算结果</div>
            <button class="modal-close" onclick="App.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div style="padding:16px;text-align:center;background:linear-gradient(135deg,${
              result.isHiddenEnding ? 'rgba(139,92,246,0.15),rgba(236,72,153,0.15)' :
              result.isWin ? 'rgba(16,185,129,0.12),rgba(20,184,166,0.12)' :
              'rgba(239,68,68,0.12),rgba(249,115,22,0.12)'
            });border-radius:12px;border:1px solid ${
              result.isHiddenEnding ? 'var(--accent-purple)' :
              result.isWin ? 'var(--accent-green)' : 'var(--accent-red)'
            };margin-bottom:14px;">
              <div style="font-size:36px;margin-bottom:6px;">${emoji}</div>
              <div style="font-size:20px;font-weight:700;color:${
                result.isHiddenEnding ? 'var(--accent-purple)' :
                result.isWin ? 'var(--accent-green)' : 'var(--accent-red)'
              };margin-bottom:4px;">${result.outcome}</div>
              <div style="font-size:11px;color:var(--text-muted);">${result.scenario}</div>
            </div>

            <div style="margin-bottom:14px;">
              <div style="font-size:12px;font-weight:700;color:var(--accent-cyan);margin-bottom:6px;">🎯 目标达标</div>
              <div style="background:var(--bg-card);border-radius:8px;padding:8px 10px;border:1px solid var(--border-color);">
                ${targetCheckLine('封存值', result.finalState.sealedValue, '≥', result.targets.sealedValue, result.targets.sealedValueReached)}
                ${targetCheckLine('壬号奖励', result.finalState.renReward, '≥', result.targets.renReward, result.targets.renRewardReached)}
                ${targetCheckLine('乙号风险', result.finalState.yiRisk, '≤', result.targets.maxYiRisk, result.targets.yiRiskOk)}
              </div>
            </div>

            <div style="font-size:11px;color:var(--text-muted);line-height:1.6;margin-bottom:14px;">
              <b style="color:var(--text-secondary);">后端审计：</b>共 ${result.stepResults?.length || 0} 步操作已由 Node.js 后端按封存值和调度步骤独立重算完毕。
            </div>

            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
              <button class="btn btn-cancel" onclick="App.closeModal()">关闭</button>
              <button class="btn btn-warn" onclick="App.closeModal();App.restartCurrent();">重新开始</button>
              ${(!result.isLoss && currentRound <= currentScenario.rounds) ?
                `<button class="btn btn-primary" onclick="App.closeModal();">继续游戏</button>` : ''}
            </div>
          </div>
        `);
      }
    } catch (e) {
      toast('结算失败: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '📊 结算';
    }
  }

  function targetCheckLine(label, current, op, target, pass) {
    return `
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed rgba(45,58,92,0.3);font-size:12px;">
        <span style="color:var(--text-secondary);">${label}</span>
        <span style="font-weight:700;color:${pass ? 'var(--accent-green)' : 'var(--accent-red)'};">
          ${Math.round(current || 0)} ${op} ${target} ${pass ? '✓' : '✗'}
        </span>
      </div>
    `;
  }

  function restartCurrent() {
    if (Timeline.getStepCount() > 0 && !confirm('确定重新开始吗？')) return;
    resetGame(false);
    toast('游戏已重新开始', 'info');
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  function toast(msg, type) {
    const container = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  function showModal(html) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    content.innerHTML = html;
    modal.style.display = 'block';
  }

  function closeModal() {
    document.getElementById('modal').style.display = 'none';
  }

  function getScenarioId() { return currentScenarioId; }
  function getRound() { return currentRound; }

  return {
    init, settleGame, toast, showModal, closeModal,
    confirmSwitchScenario, getScenarioId, getRound, restartCurrent
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
