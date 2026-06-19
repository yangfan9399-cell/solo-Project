const Board = (function() {
  const state = {
    level: null,
    nodes: {},
    connections: {},
    currentNodeId: null,
    visitedNodeIds: [],
    gameState: null
  };

  const icons = {
    start: '⚓',
    end: '🏁',
    tower: '🗼',
    reward: '💰',
    risk: '⚠',
    event: '✦',
    hidden: '▣'
  };

  function init(levelData, gameState) {
    state.level = levelData;
    state.gameState = gameState;
    state.nodes = {};
    state.connections = {};
    state.currentNodeId = null;
    state.visitedNodeIds = [];

    levelData.map.nodes.forEach(n => {
      state.nodes[n.id] = { ...n };
      state.connections[n.id] = [];
    });

    levelData.map.connections.forEach(([a, b]) => {
      if (state.connections[a]) state.connections[a].push(b);
      if (state.connections[b]) state.connections[b].push(a);
    });

    const startNode = levelData.map.nodes.find(n => n.type === 'start');
    if (startNode) {
      state.currentNodeId = startNode.id;
      state.visitedNodeIds = [startNode.id];
    }

    render();
  }

  function getReachableNodeIds() {
    if (!state.currentNodeId) return [];
    return state.connections[state.currentNodeId] || [];
  }

  function isNodeAccessible(nodeId) {
    const node = state.nodes[nodeId];
    if (!node) return false;

    if (node.type === 'hidden') {
      if (node.hiddenTrigger) {
        const flags = state.gameState.flags || {};
        const allTriggered = node.hiddenTrigger.every(f => flags[f]);
        if (!allTriggered) return false;
      }
    }

    if (node.requireHidden) {
      if (!state.gameState.hiddenFlag) return false;
    }

    return true;
  }

  function moveTo(nodeId) {
    if (!getReachableNodeIds().includes(nodeId)) return { ok: false, error: '该节点不在当前可达范围内' };
    if (!isNodeAccessible(nodeId)) return { ok: false, error: '该节点未解锁，无法进入' };

    const prev = state.currentNodeId;
    state.currentNodeId = nodeId;
    if (!state.visitedNodeIds.includes(nodeId)) {
      state.visitedNodeIds.push(nodeId);
    }

    return { ok: true, prevNodeId: prev, node: state.nodes[nodeId] };
  }

  function undoMove(prevNodeId) {
    const lastIdx = state.visitedNodeIds.lastIndexOf(state.currentNodeId);
    if (lastIdx > 0) {
      state.visitedNodeIds.splice(lastIdx, 1);
    }
    state.currentNodeId = prevNodeId;
  }

  function setGameState(gs) {
    state.gameState = gs;
  }

  function render() {
    renderStats();
    renderMap();
  }

  function renderStats() {
    const gs = state.gameState;
    if (!gs) return;

    const lightPct = Math.min(100, (gs.lightValue / gs.lightTarget) * 100);
    const lightBar = document.getElementById('lightBar');
    const lightValue = document.getElementById('lightValue');
    if (lightBar) lightBar.style.width = lightPct + '%';
    if (lightValue) lightValue.textContent = `${gs.lightValue} / ${gs.lightTarget}`;

    const traceSlots = document.getElementById('traceSlots');
    if (traceSlots) {
      traceSlots.innerHTML = '';
      for (let i = 0; i < gs.traceSlotMax; i++) {
        const slot = document.createElement('div');
        slot.className = 'trace-slot' + (i < gs.usedSteps ? ' filled' : '');
        slot.textContent = i < gs.usedSteps ? (i + 1) : '';
        traceSlots.appendChild(slot);
      }
    }

    const reverseTraces = document.getElementById('reverseTraces');
    if (reverseTraces) {
      reverseTraces.innerHTML = '';
      for (let i = 0; i < gs.traceSlotMax; i++) {
        const slot = document.createElement('div');
        slot.className = 'reverse-trace' + (i < gs.usedSteps ? ' filled' : '');
        slot.textContent = i < gs.usedSteps ? (gs.usedSteps - i) : '';
        reverseTraces.appendChild(slot);
      }
    }

    const riskA = document.getElementById('riskA');
    const rewardD = document.getElementById('rewardD');
    const failB = document.getElementById('failB');
    if (riskA) riskA.textContent = `${gs.riskA} / ${gs.riskAMax}`;
    if (rewardD) rewardD.textContent = gs.rewardD;
    if (failB) failB.textContent = `${gs.failB} / ${gs.failBMax}`;

    const badge = document.getElementById('roundBadge');
    if (badge) badge.textContent = `第 ${gs.usedSteps} 步`;
  }

  function renderMap() {
    const mapEl = document.getElementById('gameMap');
    if (!mapEl || !state.level) return;

    const { cols, rows, nodes } = state.level.map;
    const reachable = getReachableNodeIds();

    mapEl.style.gridTemplateColumns = `repeat(${cols}, 52px)`;
    mapEl.style.gridTemplateRows = `repeat(${rows}, 52px)`;
    mapEl.style.width = (cols * 52 + (cols - 1) * 6) + 'px';
    mapEl.style.height = (rows * 52 + (rows - 1) * 6) + 'px';
    mapEl.innerHTML = '';

    const grid = {};
    nodes.forEach(n => {
      const key = `${n.x},${n.y}`;
      grid[key] = n;
    });

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const key = `${x},${y}`;
        const node = grid[key];
        if (!node) {
          const spacer = document.createElement('div');
          spacer.style.visibility = 'hidden';
          spacer.style.width = '52px';
          spacer.style.height = '52px';
          mapEl.appendChild(spacer);
          continue;
        }

        const el = document.createElement('div');
        el.className = 'map-node';
        el.dataset.nodeId = node.id;

        let displayType = node.type;
        let displayName = node.name;

        if (node.type === 'hidden') {
          const flags = state.gameState.flags || {};
          const triggered = node.hiddenTrigger ? node.hiddenTrigger.every(f => flags[f]) : false;
          if (triggered) {
            el.classList.add('tower');
            displayType = 'tower';
            displayName = node.hiddenName || '已解锁';
            if (state.gameState) state.gameState.hiddenFlag = true;
          } else {
            el.classList.add('hidden');
          }
        } else {
          el.classList.add(node.type);
        }

        if (state.currentNodeId === node.id) el.classList.add('current');
        if (state.visitedNodeIds.includes(node.id) && state.currentNodeId !== node.id) el.classList.add('visited');
        if (reachable.includes(node.id) && isNodeAccessible(node.id)) el.classList.add('reachable');

        const icon = document.createElement('span');
        icon.textContent = icons[displayType] || '◈';
        el.appendChild(icon);

        const label = document.createElement('div');
        label.className = 'map-node-label';
        label.textContent = displayName;
        el.appendChild(label);

        el.addEventListener('click', () => {
          if (typeof window.onNodeClick === 'function') {
            window.onNodeClick(node.id);
          }
        });

        mapEl.appendChild(el);
      }
    }
  }

  function setMessage(msg, type = '') {
    const el = document.getElementById('gameMessage');
    if (!el) return;
    el.className = 'game-message ' + type;
    el.textContent = msg;
  }

  function getCurrentNodeId() { return state.currentNodeId; }
  function getCurrentNode() { return state.nodes[state.currentNodeId]; }
  function getVisitedNodeIds() { return [...state.visitedNodeIds]; }
  function getNode(id) { return state.nodes[id]; }

  function restoreFromSteps(steps) {
    if (!steps || steps.length === 0) return;
    state.visitedNodeIds = [];
    const startNode = state.level.map.nodes.find(n => n.type === 'start');
    if (startNode) state.visitedNodeIds.push(startNode.id);
    steps.forEach(s => {
      if (s.nodeId && !state.visitedNodeIds.includes(s.nodeId)) {
        state.visitedNodeIds.push(s.nodeId);
      }
    });
    const last = steps[steps.length - 1];
    if (last && last.nodeId) state.currentNodeId = last.nodeId;
  }

  return {
    init,
    render,
    renderStats,
    renderMap,
    moveTo,
    undoMove,
    setGameState,
    setMessage,
    getReachableNodeIds,
    isNodeAccessible,
    getCurrentNodeId,
    getCurrentNode,
    getVisitedNodeIds,
    getNode,
    restoreFromSteps
  };
})();
