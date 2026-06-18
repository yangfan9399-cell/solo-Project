const API_BASE = '';

let currentGameId = null;
let gameState = null;
let selectedStep = null;

const resourceNames = {
  energy: '能量',
  data: '数据',
  time: '时间'
};

const actionNames = {
  init: '游戏开始',
  allocate_resource: '资源调配',
  use_rehearsal: '排演发动',
  calibrate: '定标增幅',
  event_choice: '事件抉择',
  next_turn: '回合推进',
  visit_node: '地图探索'
};

document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkSavedGame();
});

function initEventListeners() {
  document.querySelectorAll('.scenario-card').forEach(card => {
    card.addEventListener('click', () => {
      const scenario = card.dataset.scenario;
      startNewGame(scenario);
    });
  });

  document.getElementById('back-btn').addEventListener('click', backToSelect);
  document.getElementById('modal-back-btn').addEventListener('click', backToSelect);
  document.getElementById('modal-replay-btn').addEventListener('click', replayGame);

  document.getElementById('alloc-btn').addEventListener('click', handleAllocate);
  document.getElementById('rehearsal-btn').addEventListener('click', handleRehearsal);
  document.getElementById('calibrate-btn').addEventListener('click', handleCalibrate);
  document.getElementById('next-turn-btn').addEventListener('click', handleNextTurn);

  document.getElementById('revert-btn').addEventListener('click', handleRevert);
  document.getElementById('recalc-btn').addEventListener('click', handleRecalculate);
}

function checkSavedGame() {
  const savedGameId = localStorage.getItem('stardust_current_game');
  if (savedGameId) {
    loadGame(savedGameId);
  }
}

async function startNewGame(scenarioType) {
  try {
    const response = await fetch(`${API_BASE}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType })
    });
    
    if (!response.ok) {
      const err = await response.json();
      alert(err.error || '创建游戏失败');
      return;
    }

    gameState = await response.json();
    currentGameId = gameState.gameId;
    localStorage.setItem('stardust_current_game', currentGameId);
    
    showGameScreen();
    renderGame();
  } catch (e) {
    console.error('创建游戏失败:', e);
    alert('创建游戏失败，请检查服务是否运行');
  }
}

async function loadGame(gameId) {
  try {
    const response = await fetch(`${API_BASE}/api/games/${gameId}`);
    if (!response.ok) {
      localStorage.removeItem('stardust_current_game');
      return;
    }

    gameState = await response.json();
    currentGameId = gameState.gameId;
    
    showGameScreen();
    renderGame();
    
    if (gameState.status !== 'active') {
      loadSettlement();
    }
  } catch (e) {
    console.error('加载游戏失败:', e);
  }
}

function showGameScreen() {
  document.getElementById('scenario-select').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
}

function backToSelect() {
  document.getElementById('scenario-select').classList.remove('hidden');
  document.getElementById('game-container').classList.add('hidden');
  document.getElementById('game-over-modal').classList.add('hidden');
  currentGameId = null;
  gameState = null;
}

function replayGame() {
  document.getElementById('game-over-modal').classList.add('hidden');
  if (gameState) {
    startNewGame(gameState.scenarioType);
  }
}

async function performAction(actionType, actionData = {}) {
  if (gameState.status !== 'active') return;

  try {
    const response = await fetch(`${API_BASE}/api/games/${currentGameId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionType, actionData })
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.error || '操作失败');
      return;
    }

    gameState = await response.json();
    renderGame();

    if (gameState.status !== 'active') {
      loadSettlement();
      showGameOverModal();
    }
  } catch (e) {
    console.error('操作失败:', e);
    alert('操作失败');
  }
}

function handleAllocate() {
  const resource = document.getElementById('alloc-resource').value;
  const target = document.getElementById('alloc-target').value;
  const amount = parseInt(document.getElementById('alloc-amount').value) || 0;

  if (amount <= 0) {
    alert('请输入有效的数量');
    return;
  }

  performAction('allocate_resource', { resource, target, amount });
}

function handleRehearsal() {
  const action = document.getElementById('rehearsal-action').value;
  performAction('use_rehearsal', { action });
}

function handleCalibrate() {
  performAction('calibrate', {});
}

function handleNextTurn() {
  performAction('next_turn', {});
}

function handleEventChoice(choiceId) {
  performAction('event_choice', {
    eventTurn: gameState.currentEvent.turn,
    choiceId
  });
}

async function handleRevert() {
  if (selectedStep === null) {
    alert('请先选择要回退的步骤');
    return;
  }

  if (!confirm(`确定回退到第 ${selectedStep} 步吗？之后的所有操作将被清除。`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/games/${currentGameId}/revert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepNumber: selectedStep })
    });

    if (!response.ok) {
      const err = await response.json();
      alert(err.error || '回退失败');
      return;
    }

    gameState = await response.json();
    selectedStep = null;
    renderGame();
  } catch (e) {
    console.error('回退失败:', e);
    alert('回退失败');
  }
}

async function loadSettlement() {
  try {
    const response = await fetch(`${API_BASE}/api/games/${currentGameId}/settlement`);
    if (response.ok) {
      const settlement = await response.json();
      renderSettlement(settlement);
    }
  } catch (e) {
    console.error('加载结算失败:', e);
  }
}

async function handleRecalculate() {
  try {
    const response = await fetch(`${API_BASE}/api/games/${currentGameId}/settlement/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const settlement = await response.json();
      renderSettlement(settlement);
      alert('已重新结算');
    }
  } catch (e) {
    console.error('重新结算失败:', e);
    alert('重新结算失败');
  }
}

function renderGame() {
  if (!gameState) return;

  document.getElementById('scenario-name').textContent = gameState.scenario.name;
  document.getElementById('current-turn').textContent = gameState.currentTurn;
  document.getElementById('max-turns').textContent = gameState.maxTurns;

  document.getElementById('stardust-strip').textContent = Math.floor(gameState.stardustStrip);
  const stardustPercent = Math.min(100, (gameState.stardustStrip / 300) * 100);
  document.getElementById('stardust-bar').style.width = stardustPercent + '%';

  document.getElementById('rehearsal-slots').textContent = gameState.rehearsalSlots;
  document.getElementById('calibration-marks').textContent = gameState.calibrationMarks;

  document.getElementById('chou-risk').textContent = (gameState.chouRisk * 100).toFixed(1) + '%';
  document.getElementById('chou-risk-bar').style.width = (gameState.chouRisk * 100) + '%';

  document.getElementById('shen-reward').textContent = gameState.shenReward.toFixed(1) + 'x';
  document.getElementById('shen-reward-bar').style.width = Math.min(100, gameState.shenReward * 50) + '%';

  document.getElementById('jia-failure').textContent = (gameState.jiaFailureFactor * 100).toFixed(1) + '%';
  document.getElementById('jia-failure-bar').style.width = (gameState.jiaFailureFactor * 100) + '%';

  renderResources();
  renderSecretSection();
  renderMap();
  renderEvent();
  renderTimeline();

  const isActive = gameState.status === 'active';
  document.getElementById('alloc-btn').disabled = !isActive;
  document.getElementById('rehearsal-btn').disabled = !isActive;
  document.getElementById('calibrate-btn').disabled = !isActive;
  document.getElementById('next-turn-btn').disabled = !isActive;
}

function renderResources() {
  const resourceList = document.getElementById('resource-list');
  resourceList.innerHTML = '';

  const resources = gameState.resources || {};
  for (const [key, name] of Object.entries(resourceNames)) {
    const value = resources[key] || 0;
    const item = document.createElement('div');
    item.className = 'resource-item';
    item.innerHTML = `
      <div class="resource-name">${name}</div>
      <div class="resource-amount">${value}</div>
    `;
    resourceList.appendChild(item);
  }
}

function renderSecretSection() {
  const secretSection = document.getElementById('secret-section');
  const sealsDisplay = document.getElementById('seals-display');
  
  if (gameState.scenarioType === 'jia' || (gameState.resources && gameState.resources.secretSeals > 0)) {
    secretSection.style.display = 'block';
    const seals = gameState.resources.secretSeals || 0;
    sealsDisplay.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
      const seal = document.createElement('div');
      seal.className = 'seal-icon' + (i < seals ? '' : ' empty');
      seal.textContent = i < seals ? '🔮' : '○';
      sealsDisplay.appendChild(seal);
    }
  } else {
    secretSection.style.display = 'none';
  }
}

function computeNodePositions(nodes, svgWidth = 600, svgHeight = 400) {
  const padding = 70;
  const count = nodes.length;
  const positions = {};

  const layers = buildLayers(nodes);
  const layerCount = layers.length;

  layers.forEach((layer, layerIdx) => {
    const layerX = padding + (layerCount === 1 ? (svgWidth - 2 * padding) / 2 :
      (svgWidth - 2 * padding) * (layerIdx / (layerCount - 1)));
    const nodeCount = layer.length;
    layer.forEach((node, nodeIdx) => {
      const y = padding + (nodeCount === 1 ? (svgHeight - 2 * padding) / 2 :
        (svgHeight - 2 * padding) * (nodeIdx / (nodeCount - 1)));
      positions[node.id] = { x: layerX, y };
    });
  });

  return positions;
}

function buildLayers(nodes) {
  const startNodes = nodes.filter(n => n.type === 'start');
  const endNodes = nodes.filter(n => n.type === 'end' || n.type === 'secret_end');
  const middle = nodes.filter(n => n.type !== 'start' && n.type !== 'end' && n.type !== 'secret_end');

  if (startNodes.length === 0) {
    startNodes.push(nodes[0]);
  }
  if (endNodes.length === 0) {
    endNodes.push(nodes[nodes.length - 1]);
  }
  const middleFiltered = middle.filter(n =>
    !startNodes.includes(n) && !endNodes.includes(n)
  );

  const layers = [startNodes];
  if (middleFiltered.length <= 3) {
    if (middleFiltered.length > 0) layers.push(middleFiltered);
  } else {
    const half = Math.ceil(middleFiltered.length / 2);
    layers.push(middleFiltered.slice(0, half));
    layers.push(middleFiltered.slice(half));
  }
  layers.push(endNodes);
  return layers;
}

function getNodeShape(node) {
  switch (node.type) {
    case 'start':
    case 'end':
    case 'secret_end':
      return 'circle';
    case 'secret':
      return 'diamond';
    case 'danger':
      return 'triangle';
    default:
      return 'square';
  }
}

function renderMap() {
  if (!gameState || !gameState.scenario || !gameState.scenario.map) return;

  const map = gameState.scenario.map;
  document.getElementById('map-name').textContent = map.name;

  const connectionsGroup = document.getElementById('map-connections');
  const nodesGroup = document.getElementById('map-nodes');
  connectionsGroup.innerHTML = '';
  nodesGroup.innerHTML = '';

  const positions = computeNodePositions(map.nodes);
  const visitedNodes = gameState.visitedNodes || gameState.resources?.visitedNodes || [];
  const currentNodeId = visitedNodes.length > 0 ? visitedNodes[visitedNodes.length - 1] : null;

  const reachableSet = new Set();
  if (visitedNodes.length === 0) {
    map.nodes.filter(n => n.type === 'start').forEach(n => reachableSet.add(n.id));
  } else {
    map.connections.forEach(([a, b]) => {
      if (a === currentNodeId) reachableSet.add(b);
      if (b === currentNodeId) reachableSet.add(a);
    });
    visitedNodes.forEach(n => reachableSet.delete(n));
  }

  const activeConnections = new Set();
  for (let i = 1; i < visitedNodes.length; i++) {
    const a = visitedNodes[i - 1];
    const b = visitedNodes[i];
    activeConnections.add(`${a}-${b}`);
    activeConnections.add(`${b}-${a}`);
  }

  map.connections.forEach(([a, b]) => {
    const p1 = positions[a];
    const p2 = positions[b];
    if (!p1 || !p2) return;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x);
    line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x);
    line.setAttribute('y2', p2.y);
    line.setAttribute('class', 'map-connection' + (activeConnections.has(`${a}-${b}`) ? ' active' : ''));
    connectionsGroup.appendChild(line);
  });

  map.nodes.forEach(node => {
    const pos = positions[node.id];
    if (!pos) return;

    const isVisited = visitedNodes.includes(node.id);
    const isCurrent = node.id === currentNodeId;
    const isReachable = reachableSet.has(node.id);
    const isLocked = !isVisited && !isCurrent && !isReachable;
    const isActive = gameState.status === 'active';

    let classes = 'map-node';
    if (isCurrent) classes += ' current';
    else if (isVisited) classes += ' visited';
    else if (isReachable && isActive) classes += ' reachable';
    else if (isLocked) classes += ' locked';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', classes);
    g.setAttribute('data-node-id', node.id);

    const shape = getNodeShape(node);
    const size = 18;
    let shapeEl;

    if (shape === 'circle') {
      shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      shapeEl.setAttribute('cx', pos.x);
      shapeEl.setAttribute('cy', pos.y);
      shapeEl.setAttribute('r', size);
      shapeEl.setAttribute('fill', 'rgba(20, 30, 60, 0.8)');
      shapeEl.setAttribute('stroke', 'var(--border-color)');
      shapeEl.setAttribute('stroke-width', '2');
    } else if (shape === 'diamond') {
      shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const points = `${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size},${pos.y}`;
      shapeEl.setAttribute('points', points);
      shapeEl.setAttribute('fill', 'rgba(168, 85, 247, 0.2)');
      shapeEl.setAttribute('stroke', 'var(--border-color)');
      shapeEl.setAttribute('stroke-width', '2');
    } else if (shape === 'triangle') {
      shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const points = `${pos.x},${pos.y - size} ${pos.x + size},${pos.y + size * 0.7} ${pos.x - size},${pos.y + size * 0.7}`;
      shapeEl.setAttribute('points', points);
      shapeEl.setAttribute('fill', 'rgba(239, 68, 68, 0.2)');
      shapeEl.setAttribute('stroke', 'var(--border-color)');
      shapeEl.setAttribute('stroke-width', '2');
    } else {
      shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shapeEl.setAttribute('x', pos.x - size);
      shapeEl.setAttribute('y', pos.y - size);
      shapeEl.setAttribute('width', size * 2);
      shapeEl.setAttribute('height', size * 2);
      shapeEl.setAttribute('rx', '4');
      shapeEl.setAttribute('fill', 'rgba(20, 30, 60, 0.8)');
      shapeEl.setAttribute('stroke', 'var(--border-color)');
      shapeEl.setAttribute('stroke-width', '2');
    }
    g.appendChild(shapeEl);

    const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    iconText.setAttribute('x', pos.x);
    iconText.setAttribute('y', pos.y + 1);
    iconText.setAttribute('text-anchor', 'middle');
    iconText.setAttribute('dominant-baseline', 'central');
    iconText.setAttribute('font-size', '13');
    iconText.setAttribute('pointer-events', 'none');

    let icon = '';
    switch (node.type) {
      case 'start': icon = '🚀'; break;
      case 'end':
      case 'secret_end': icon = '🏁'; break;
      case 'resource': icon = '📦'; break;
      case 'stardust': icon = '✨'; break;
      case 'calibration': icon = '🎯'; break;
      case 'risk': icon = '⚖️'; break;
      case 'reward': icon = '🎁'; break;
      case 'secret': icon = '🔮'; break;
      case 'danger': icon = '☠️'; break;
      default: icon = '◇'; break;
    }
    iconText.textContent = icon;
    g.appendChild(iconText);

    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', pos.x);
    labelText.setAttribute('y', pos.y + 36);
    labelText.setAttribute('class', 'node-label');
    labelText.textContent = node.name;
    g.appendChild(labelText);

    if (isActive && isReachable) {
      g.addEventListener('click', () => handleVisitNode(node.id));
      g.style.cursor = 'pointer';
    }

    nodesGroup.appendChild(g);
  });

  const hintEl = document.getElementById('map-hint');
  if (visitedNodes.length === 0) {
    hintEl.textContent = '🚀 从起点节点开始探索';
  } else if (isActive) {
    hintEl.textContent = `📍 当前: ${getCurrentNodeName(currentNodeId)} · 点击高亮的相邻节点前进`;
  } else {
    hintEl.textContent = gameState.status === 'won' ? '🎉 探索完成！' : '💔 探索已结束';
  }
}

function getCurrentNodeName(nodeId) {
  if (!gameState || !gameState.scenario || !gameState.scenario.map) return '';
  const node = gameState.scenario.map.nodes.find(n => n.id === nodeId);
  return node ? node.name : nodeId;
}

async function handleVisitNode(nodeId) {
  if (!currentGameId) return;
  performAction('visit_node', { nodeId });
}

function renderEvent() {
  const eventContent = document.getElementById('event-content');
  const eventPanel = document.getElementById('event-panel');
  
  if (!gameState.currentEvent) {
    eventContent.innerHTML = '<p class="no-event">当前回合无事件</p>';
    eventPanel.classList.remove('event-active');
    return;
  }

  eventPanel.classList.add('event-active');
  const event = gameState.currentEvent;

  let html = `
    <div class="event-title">📜 ${event.title}</div>
    <p class="event-desc">${event.description}</p>
    <div class="event-choices">
  `;

  for (const choice of event.choices) {
    let disabled = false;
    let reason = '';
    
    if (choice.requires) {
      for (const [key, value] of Object.entries(choice.requires)) {
        const currentVal = key === 'secretSeals'
          ? (gameState.resources.secretSeals || 0)
          : (gameState[key] || 0);
        if (currentVal < value) {
          disabled = true;
          reason = ` (需要 ${value} ${key === 'secretSeals' ? '秘印' : key})`;
          break;
        }
      }
    }

    const isActive = gameState.status === 'active';
    html += `
      <button class="event-choice-btn" 
              data-choice="${choice.id}"
              ${disabled || !isActive ? 'disabled' : ''}>
        ${choice.text}${disabled ? reason : ''}
      </button>
    `;
  }

  html += '</div>';
  eventContent.innerHTML = html;

  eventContent.querySelectorAll('.event-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const choiceId = btn.dataset.choice;
      handleEventChoice(choiceId);
    });
  });
}

function renderTimeline() {
  const timeline = document.getElementById('replay-timeline');
  timeline.innerHTML = '';

  if (!gameState.steps || gameState.steps.length === 0) return;

  for (const step of gameState.steps) {
    const item = document.createElement('div');
    item.className = 'timeline-item' + (selectedStep === step.stepNumber ? ' selected' : '');
    item.dataset.step = step.stepNumber;
    
    const actionName = actionNames[step.actionType] || step.actionType;
    const description = step.actionData.description || getActionDescription(step);

    item.innerHTML = `
      <div class="timeline-step">${step.stepNumber}</div>
      <div class="timeline-content">
        <div class="timeline-action">${actionName}</div>
        <div class="timeline-turn">回合 ${step.turnNumber}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      selectedStep = step.stepNumber;
      document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });

    timeline.appendChild(item);
  }

  timeline.scrollTop = timeline.scrollHeight;
}

function getActionDescription(step) {
  const data = step.actionData || {};
  switch (step.actionType) {
    case 'allocate_resource':
      return `${resourceNames[data.resource] || data.resource} → ${data.target}`;
    case 'use_rehearsal':
      return data.action;
    case 'event_choice':
      return data.choiceId;
    case 'visit_node':
      return `→ ${data.nodeId || ''}`;
    default:
      return '';
  }
}

function renderSettlement(settlement) {
  const content = document.getElementById('settlement-content');
  const recalcBtn = document.getElementById('recalc-btn');

  recalcBtn.classList.remove('hidden');

  const isWin = settlement.result === '胜利';
  
  let detailsHtml = '';
  const b = settlement.breakdown;
  
  detailsHtml += `<div class="detail-row"><span class="detail-label">基础分 (星尘值)</span><span class="detail-value">${b.baseScore.toFixed(1)}</span></div>`;
  detailsHtml += `<div class="detail-row"><span class="detail-label">效率加成</span><span class="detail-value positive">+${b.efficiencyBonus.toFixed(1)}</span></div>`;
  detailsHtml += `<div class="detail-row"><span class="detail-label">风险惩罚</span><span class="detail-value negative">-${b.riskPenalty.toFixed(1)}</span></div>`;
  detailsHtml += `<div class="detail-row"><span class="detail-label">定标加成</span><span class="detail-value positive">+${b.calibrationBonus.toFixed(1)}</span></div>`;
  detailsHtml += `<div class="detail-row"><span class="detail-label">甲号惩罚</span><span class="detail-value negative">-${b.jiaPenalty.toFixed(1)}</span></div>`;
  if (b.secretBonus) detailsHtml += `<div class="detail-row"><span class="detail-label">秘印加成</span><span class="detail-value positive">+${b.secretBonus.toFixed(1)}</span></div>`;
  if (b.hiddenBonus) detailsHtml += `<div class="detail-row"><span class="detail-label">隐藏结局</span><span class="detail-value positive">+${b.hiddenBonus.toFixed(1)}</span></div>`;
  detailsHtml += `<div class="detail-row"><span class="detail-label">胜负倍率</span><span class="detail-value ${isWin ? 'positive' : ''}">x${b.winMultiplier}</span></div>`;

  content.innerHTML = `
    <div class="settlement-result">
      <div class="settlement-score">${settlement.score.toFixed(1)}</div>
      <div class="settlement-status ${isWin ? 'win' : 'lose'}">${settlement.result}</div>
      <div class="settlement-details">
        ${detailsHtml}
        <div class="detail-row" style="margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 8px;">
          <span class="detail-label">风险等级</span>
          <span class="detail-value">${settlement.riskLevel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">总步骤数</span>
          <span class="detail-value">${settlement.totalSteps}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">资源效率</span>
          <span class="detail-value">${settlement.resourceEfficiency.toFixed(2)}/步</span>
        </div>
      </div>
    </div>
  `;
}

function showGameOverModal() {
  const modal = document.getElementById('game-over-modal');
  const title = document.getElementById('game-over-title');
  const body = document.getElementById('game-over-body');

  const isWin = gameState.status === 'won';
  
  title.textContent = isWin ? '🎉 胜利！' : '💔 失败...';
  title.style.color = isWin ? 'var(--accent-green)' : 'var(--accent-red)';

  let reason = '';
  const winCond = gameState.scenario.winCondition;
  const failCond = gameState.scenario.failCondition;

  if (isWin) {
    if (winCond.type === 'secret' && gameState.resources.hiddenUnlocked) {
      reason = '🌟 恭喜你发现了隐藏结局！你成功解开了终极封印，获得了星尘棋盘的奥秘。';
    } else {
      reason = `你成功完成了挑战！最终星尘剥离值达到了 ${Math.floor(gameState.stardustStrip)}。`;
    }
  } else {
    reason = getFailReason();
  }

  body.innerHTML = `
    <p style="margin-bottom: 20px; line-height: 1.8; color: var(--text-secondary);">${reason}</p>
    <div style="text-align: center; padding: 20px; background: var(--bg-secondary); border-radius: 10px;">
      <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">最终星尘剥离值</div>
      <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-gold);">${Math.floor(gameState.stardustStrip)}</div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function getFailReason() {
  const failCond = gameState.scenario.failCondition;
  const state = gameState;

  switch (failCond.type) {
    case 'risk_threshold':
      if (state.chouRisk >= failCond.threshold) {
        return `丑号风险突破了 ${(failCond.threshold * 100).toFixed(0)}% 的警戒线，棋局失控了...`;
      }
      return `回合已用尽，但你没有达成胜利条件。`;
    case 'resource_depletion':
      for (const [key, value] of Object.entries(state.resources)) {
        if (key !== 'secretSeals' && key !== 'hiddenUnlocked' && value < 0) {
          return `资源 ${resourceNames[key] || key} 已耗尽，无法继续维持棋局。`;
        }
      }
      return `回合已用尽，但你没有达成胜利条件。`;
    case 'jia_factor':
      if (state.jiaFailureFactor >= failCond.threshold) {
        return `甲号失败因子达到了 ${(failCond.threshold * 100).toFixed(0)}%，引发了灾难性的崩溃...`;
      }
      return `回合已用尽，但你没有达成胜利条件。`;
    default:
      return '棋局结束了。';
  }
}
