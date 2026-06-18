const Board = (function () {
  let currentScenario = null;
  let gameState = null;
  let selectedAction = null;
  let selectedNodeId = null;
  let pendingAction = null;
  let actionListeners = [];

  const NODE_COLORS = {
    source: { fill: '#06b6d4', stroke: '#0891b2', glow: 'rgba(6, 182, 212, 0.5)' },
    relay: { fill: '#3b82f6', stroke: '#2563eb', glow: 'rgba(59, 130, 246, 0.5)' },
    target: { fill: '#10b981', stroke: '#059669', glow: 'rgba(16, 185, 129, 0.5)' },
    hazard: { fill: '#f97316', stroke: '#ea580c', glow: 'rgba(249, 115, 22, 0.5)' },
    special: { fill: '#8b5cf6', stroke: '#7c3aed', glow: 'rgba(139, 92, 246, 0.5)' },
    secret: { fill: '#ec4899', stroke: '#db2777', glow: 'rgba(236, 72, 153, 0.5)' }
  };

  const ACTION_LABELS = {
    seal: '封存节点',
    rewrite: '复写槽',
    dispatch: '资源调度',
    signal: '信号释放',
    skip: '跳过回合'
  };

  function init(scenario, state) {
    currentScenario = scenario;
    gameState = state;
    render();
    renderMap();
    bindEvents();
  }

  function updateState(state) {
    gameState = state;
    render();
    renderMap();
  }

  function render() {
    if (!gameState) return;
    const s = gameState;
    document.getElementById('statSealed').textContent = Math.round(s.sealedValue);
    document.getElementById('statRewrite').textContent = s.rewriteSlots;
    document.getElementById('statTrace').textContent = s.traceMarks;
    document.getElementById('statRisk').textContent = Math.round(s.yiRisk);
    document.getElementById('statReward').textContent = Math.round(s.renReward);
    document.getElementById('statFail').textContent = Math.round(s.ziFailFactor);

    const sv = currentScenario?.targetSealedValue || 500;
    const mv = currentScenario?.maxYiRisk || 100;
    const tr = currentScenario?.targetRenReward || 100;
    document.getElementById('barSealed').style.width = Math.min(100, (s.sealedValue / sv) * 100) + '%';
    document.getElementById('barRewrite').style.width = Math.min(100, (s.rewriteSlots / 8) * 100) + '%';
    document.getElementById('barTrace').style.width = Math.min(100, (s.traceMarks / 30) * 100) + '%';
    document.getElementById('barRisk').style.width = Math.min(100, (s.yiRisk / mv) * 100) + '%';
    document.getElementById('barReward').style.width = Math.min(100, (s.renReward / tr) * 100) + '%';
    document.getElementById('barFail').style.width = Math.min(100, (s.ziFailFactor / 100) * 100) + '%';

    document.getElementById('resEnergy').textContent = Math.round(s.resources?.energy || 0);
    document.getElementById('resGas').textContent = Math.round(s.resources?.gas || 0);
    document.getElementById('resSignal').textContent = Math.round(s.resources?.signal || 0);

    if (currentScenario) {
      document.getElementById('targetSealed').textContent = `封存值 ≥ ${currentScenario.targetSealedValue}`;
      document.getElementById('targetSealed').className = 'target-item' + (s.sealedValue >= currentScenario.targetSealedValue ? ' achieved' : '');
      document.getElementById('targetReward').textContent = `壬号奖励 ≥ ${currentScenario.targetRenReward}`;
      document.getElementById('targetReward').className = 'target-item' + (s.renReward >= currentScenario.targetRenReward ? ' achieved' : '');
      document.getElementById('targetRisk').textContent = `乙号风险 ≤ ${currentScenario.maxYiRisk}`;
      document.getElementById('targetRisk').className = 'target-item' + (s.yiRisk <= currentScenario.maxYiRisk ? ' achieved' : (s.yiRisk > currentScenario.maxYiRisk * 1.2 ? ' failed' : ''));
      document.getElementById('scenarioDescContent').textContent = currentScenario.description;
      document.getElementById('roundInfo').textContent = `第 ${getCurrentRound()} / ${currentScenario.rounds} 回`;
    }

    document.querySelectorAll('.panel-actions .btn-icon').forEach(btn => {
      btn.classList.toggle('active', btn.id === selectedAction);
    });
  }

  function renderMap() {
    const svg = document.getElementById('mapSvg');
    if (!currentScenario || !svg) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="balloonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fda4af;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#f472b6;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#c084fc;stop-opacity:1" />
      </linearGradient>
    `;
    svg.innerHTML = '';
    svg.appendChild(defs);

    const hiddenUnlocked = gameState?.hiddenUnlocked;

    currentScenario.map.edges.forEach(edge => {
      if (edge.hidden && !hiddenUnlocked) return;
      const fromNode = currentScenario.map.nodes.find(n => n.id === edge.from);
      const toNode = currentScenario.map.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromNode.x);
      line.setAttribute('y1', fromNode.y);
      line.setAttribute('x2', toNode.x);
      line.setAttribute('y2', toNode.y);
      line.setAttribute('class', 'edge-line' + (edge.hidden ? ' hidden-edge revealed' : ''));
      line.dataset.from = edge.from;
      line.dataset.to = edge.to;
      line.addEventListener('click', () => onEdgeClick(edge));
      svg.appendChild(line);

      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', midX);
      label.setAttribute('y', midY - 6);
      label.setAttribute('class', 'edge-label');
      label.setAttribute('text-anchor', 'middle');
      label.textContent = `⚡${edge.cost} | 📦${edge.maxFlow}`;
      svg.appendChild(label);
    });

    currentScenario.map.nodes.forEach(node => {
      if (node.hidden && !hiddenUnlocked && node.type !== 'secret') return;
      if (node.type === 'secret' && !hiddenUnlocked) return;

      const colors = NODE_COLORS[node.type] || NODE_COLORS.relay;
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'node-group' + (selectedNodeId === node.id ? ' selected' : ''));
      group.dataset.id = node.id;

      const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleBg.setAttribute('cx', node.x);
      circleBg.setAttribute('cy', node.y);
      circleBg.setAttribute('r', 30);
      circleBg.setAttribute('fill', colors.fill);
      circleBg.setAttribute('opacity', 0.15);
      group.appendChild(circleBg);

      const sealPercent = ((gameState?.nodeSeals?.[node.id] || 0) / node.capacity);
      if (sealPercent > 0) {
        const sealCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sealCircle.setAttribute('cx', node.x);
        sealCircle.setAttribute('cy', node.y);
        sealCircle.setAttribute('r', 26);
        sealCircle.setAttribute('fill', 'none');
        sealCircle.setAttribute('stroke', colors.fill);
        sealCircle.setAttribute('stroke-width', 3);
        sealCircle.setAttribute('stroke-dasharray', `${sealPercent * 163} 163`);
        sealCircle.setAttribute('stroke-dashoffset', 40);
        sealCircle.setAttribute('transform', `rotate(-90 ${node.x} ${node.y})`);
        sealCircle.setAttribute('filter', 'url(#glowFilter)');
        group.appendChild(sealCircle);
      }

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', 20);
      circle.setAttribute('fill', colors.fill);
      circle.setAttribute('stroke', colors.stroke);
      circle.setAttribute('stroke-width', 2);
      circle.setAttribute('class', 'node-circle');
      circle.setAttribute('filter', 'url(#glowFilter)');
      group.appendChild(circle);

      if (node.type === 'target') {
        const balloon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        balloon.setAttribute('d', `M${node.x - 8},${node.y + 6} Q${node.x - 10},${node.y - 2} ${node.x - 6},${node.y - 8} L${node.x + 6},${node.y - 8} Q${node.x + 10},${node.y - 2} ${node.x + 8},${node.y + 6} Q${node.x},${node.y + 10} ${node.x - 8},${node.y + 6} Z`);
        balloon.setAttribute('fill', 'url(#balloonGrad)');
        balloon.setAttribute('opacity', 0.9);
        group.appendChild(balloon);
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        string.setAttribute('d', `M${node.x},${node.y + 8} Q${node.x + 2},${node.y + 15} ${node.x - 1},${node.y + 22}`);
        string.setAttribute('stroke', '#64748b');
        string.setAttribute('stroke-width', 1);
        string.setAttribute('fill', 'none');
        group.appendChild(string);
      } else {
        const typeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeIcon.setAttribute('x', node.x);
        typeIcon.setAttribute('y', node.y + 4);
        typeIcon.setAttribute('text-anchor', 'middle');
        typeIcon.setAttribute('font-size', '14');
        typeIcon.setAttribute('fill', 'white');
        typeIcon.setAttribute('pointer-events', 'none');
        const icons = { source: '⛲', relay: '🔗', target: '🎈', hazard: '⚠️', special: '💎', secret: '🚪' };
        typeIcon.textContent = icons[node.type] || '📍';
        group.appendChild(typeIcon);
      }

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', node.x);
      label.setAttribute('y', node.y + 42);
      label.setAttribute('class', 'node-label');
      label.textContent = `${node.id} · ${node.name}`;
      group.appendChild(label);

      const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      sub.setAttribute('x', node.x);
      sub.setAttribute('y', node.y + 54);
      sub.setAttribute('class', 'node-sub');
      const currentSeal = gameState?.nodeSeals?.[node.id] || 0;
      sub.textContent = `封存 ${currentSeal}/${node.capacity}`;
      group.appendChild(sub);

      group.addEventListener('click', () => onNodeClick(node));
      svg.appendChild(group);
    });
  }

  function bindEvents() {
    document.getElementById('actionSeal').onclick = () => selectAction('seal');
    document.getElementById('actionRewrite').onclick = () => selectAction('rewrite');
    document.getElementById('actionDispatch').onclick = () => selectAction('dispatch');
    document.getElementById('actionSignal').onclick = () => selectAction('signal');
    document.getElementById('actionSkip').onclick = () => selectAction('skip');
    document.getElementById('actionCancel').onclick = hideActionPanel;
    document.getElementById('actionConfirm').onclick = confirmAction;
  }

  function selectAction(action) {
    selectedAction = selectedAction === action ? null : action;
    pendingAction = null;
    selectedNodeId = null;
    render();

    if (!selectedAction) { hideActionPanel(); return; }

    if (selectedAction === 'rewrite') {
      if ((gameState.rewriteSlots || 0) <= 0) {
        App.toast('复写槽已耗尽', 'error');
        selectedAction = null;
        render();
        return;
      }
      showRewritePanel();
    } else if (selectedAction === 'signal') {
      if ((gameState.resources?.signal || 0) < 20) {
        App.toast('信号不足（需20）', 'error');
        selectedAction = null;
        render();
        return;
      }
      showSignalPanel();
    } else if (selectedAction === 'skip') {
      showSkipPanel();
    } else if (selectedAction === 'seal') {
      App.toast('请在地图上点击要封存的节点', 'info');
    } else if (selectedAction === 'dispatch') {
      App.toast('请在地图上点击要调度的连线', 'info');
    }
  }

  function onNodeClick(node) {
    if (selectedAction === 'seal') {
      selectedNodeId = node.id;
      renderMap();
      showSealPanel(node);
    } else if (!selectedAction) {
      selectedNodeId = selectedNodeId === node.id ? null : node.id;
      renderMap();
    }
  }

  function onEdgeClick(edge) {
    if (selectedAction === 'dispatch') {
      showDispatchPanel(edge);
    }
  }

  function showSealPanel(node) {
    const panel = document.getElementById('actionPanel');
    const header = document.getElementById('actionPanelHeader');
    const body = document.getElementById('actionPanelBody');
    header.textContent = `封存操作 - ${node.name}`;

    const currentSeal = gameState.nodeSeals?.[node.id] || 0;
    const maxSeal = Math.min(node.capacity - currentSeal, Math.floor((gameState.resources?.energy || 0) * 2));
    const defaultValue = Math.min(50, maxSeal);

    body.innerHTML = `
      <div class="form-group">
        <div class="form-label">节点类型</div>
        <div style="font-size:13px;color:var(--text-primary);font-weight:600;">${typeLabel(node.type)}</div>
      </div>
      <div class="form-group">
        <div class="form-label">当前封存量</div>
        <div style="font-size:13px;color:var(--accent-cyan);font-weight:700;">${currentSeal} / ${node.capacity}</div>
      </div>
      <div class="form-group">
        <div class="form-label">封存能量消耗比（2:1）</div>
        <div style="font-size:11px;color:var(--text-muted);">封存1点 = 消耗0.5能量</div>
      </div>
      <div class="form-group">
        <div class="form-label" style="display:flex;justify-content:space-between;">
          <span>封存数量</span>
          <span class="slider-value" id="sealSliderValue">${defaultValue}</span>
        </div>
        <input type="range" class="form-slider" id="sealSlider" min="0" max="${maxSeal}" value="${defaultValue}" step="5">
      </div>
      <div class="form-group" style="padding:8px;background:var(--bg-tertiary);border-radius:8px;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">预计效果</div>
        <div style="font-size:12px;color:var(--accent-green);font-weight:600;">封存值 +<span id="sealGain">${defaultValue}</span></div>
        <div style="font-size:12px;color:var(--accent-orange);font-weight:600;">能量 -<span id="sealCost">${Math.ceil(defaultValue * 0.5)}</span></div>
      </div>
    `;

    const slider = document.getElementById('sealSlider');
    slider.oninput = () => {
      const v = parseInt(slider.value);
      document.getElementById('sealSliderValue').textContent = v;
      document.getElementById('sealGain').textContent = v;
      document.getElementById('sealCost').textContent = Math.ceil(v * 0.5);
    };

    pendingAction = { type: 'seal', nodeId: node.id };
    panel.style.display = 'block';
  }

  function showRewritePanel() {
    const panel = document.getElementById('actionPanel');
    const header = document.getElementById('actionPanelHeader');
    const body = document.getElementById('actionPanelBody');
    header.textContent = '使用复写槽';

    const availableNodes = currentScenario.map.nodes.filter(n => !n.hidden || gameState.hiddenUnlocked);

    let nodesHtml = availableNodes.map(n => {
      const currentSeal = gameState.nodeSeals?.[n.id] || 0;
      return `<div class="node-option" data-id="${n.id}">
        <div class="node-option-title">${n.id} · ${n.name} (${typeLabel(n.type)})</div>
        <div class="node-option-sub">容量 ${n.capacity}，当前封存 ${currentSeal}</div>
      </div>`;
    }).join('');

    body.innerHTML = `
      <div class="form-group">
        <div class="form-label">复写说明</div>
        <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">消耗1个复写槽，强化指定节点容量。节点容量+100，并立即获得25封存值。</div>
      </div>
      <div class="form-group">
        <div class="form-label">剩余复写槽</div>
        <div style="font-size:20px;font-weight:700;color:var(--accent-purple);">${gameState.rewriteSlots}</div>
      </div>
      <div class="form-group">
        <div class="form-label">选择节点复写</div>
        <div id="rewriteNodes">${nodesHtml}</div>
      </div>
    `;

    let selectedRewriteId = null;
    body.querySelectorAll('#rewriteNodes .node-option').forEach(opt => {
      opt.onclick = () => {
        body.querySelectorAll('#rewriteNodes .node-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedRewriteId = opt.dataset.id;
      };
    });

    pendingAction = {
      type: 'rewrite',
      getSelected: () => selectedRewriteId
    };
    panel.style.display = 'block';
  }

  function showDispatchPanel(edge) {
    const panel = document.getElementById('actionPanel');
    const header = document.getElementById('actionPanelHeader');
    const body = document.getElementById('actionPanelBody');
    header.textContent = `资源调度 - ${edge.from}→${edge.to}`;

    const fromNode = currentScenario.map.nodes.find(n => n.id === edge.from);
    const toNode = currentScenario.map.nodes.find(n => n.id === edge.to);

    body.innerHTML = `
      <div class="form-group">
        <div class="form-label">路径</div>
        <div style="font-size:13px;color:var(--text-primary);font-weight:600;">
          ${fromNode.name} <span style="color:var(--text-muted);">→</span> ${toNode.name}
        </div>
      </div>
      <div class="form-group">
        <div class="form-label">调度消耗（气囊）</div>
        <div style="font-size:18px;font-weight:700;color:var(--accent-orange);">💨 ${edge.cost}</div>
      </div>
      <div class="form-group">
        <div class="form-label">最大流量</div>
        <div style="font-size:13px;color:var(--text-secondary);">📦 ${edge.maxFlow}</div>
      </div>
      <div class="form-group" style="padding:8px;background:var(--bg-tertiary);border-radius:8px;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">预计效果</div>
        <div style="font-size:12px;color:var(--accent-green);font-weight:600;">封存值 +${Math.floor(edge.maxFlow * 0.2)}</div>
        <div style="font-size:12px;color:var(--accent-cyan);font-weight:600;">转译痕 +1</div>
        <div style="font-size:12px;color:var(--accent-red);font-weight:600;">气囊 -${edge.cost}</div>
      </div>
    `;

    pendingAction = {
      type: 'dispatch',
      from: edge.from,
      to: edge.to,
      cost: edge.cost,
      maxFlow: edge.maxFlow
    };
    panel.style.display = 'block';
  }

  function showSignalPanel() {
    const panel = document.getElementById('actionPanel');
    const header = document.getElementById('actionPanelHeader');
    const body = document.getElementById('actionPanelBody');
    header.textContent = '信号释放';

    body.innerHTML = `
      <div class="form-group">
        <div class="form-label">信号说明</div>
        <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">广播通信信号，稳定气球群网络。降低乙号风险并获得壬号奖励。</div>
      </div>
      <div class="form-group" style="padding:10px;background:var(--bg-tertiary);border-radius:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;color:var(--text-muted);">消耗信号</span>
          <span style="font-size:13px;font-weight:700;color:var(--accent-orange);">📶 20</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:12px;color:var(--text-muted);">获得奖励</span>
          <span style="font-size:13px;font-weight:700;color:var(--accent-green);">壬号 +15</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="font-size:12px;color:var(--text-muted);">降低风险</span>
          <span style="font-size:13px;font-weight:700;color:var(--accent-cyan);">乙号 -5</span>
        </div>
      </div>
    `;

    pendingAction = { type: 'signal' };
    panel.style.display = 'block';
  }

  function showSkipPanel() {
    const panel = document.getElementById('actionPanel');
    const header = document.getElementById('actionPanelHeader');
    const body = document.getElementById('actionPanelBody');
    header.textContent = '跳过本回合';

    body.innerHTML = `
      <div class="form-group" style="padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:8px;">
        <div style="font-size:13px;color:var(--accent-red);font-weight:700;margin-bottom:4px;">⚠️ 警告</div>
        <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">跳过本回合将不执行任何操作，但会导致子号失败因子 +5。建议仅在确实无法操作时选择。</div>
      </div>
    `;

    pendingAction = { type: 'skip' };
    panel.style.display = 'block';
  }

  function hideActionPanel() {
    document.getElementById('actionPanel').style.display = 'none';
    pendingAction = null;
  }

  function confirmAction() {
    if (!pendingAction) return;
    let action = { type: pendingAction.type };

    switch (pendingAction.type) {
      case 'seal':
        action.nodeId = pendingAction.nodeId;
        action.amount = parseInt(document.getElementById('sealSlider').value) || 0;
        if (action.amount <= 0) { App.toast('请设置封存数量', 'warn'); return; }
        break;
      case 'rewrite':
        const rid = pendingAction.getSelected ? pendingAction.getSelected() : null;
        if (!rid) { App.toast('请选择节点', 'warn'); return; }
        action.nodeId = rid;
        action.bonus = 25;
        break;
      case 'dispatch':
        action.from = pendingAction.from;
        action.to = pendingAction.to;
        if ((gameState.resources?.gas || 0) < pendingAction.cost) {
          App.toast('气囊不足', 'error'); return;
        }
        break;
      case 'signal':
        if ((gameState.resources?.signal || 0) < 20) {
          App.toast('信号不足', 'error'); return;
        }
        break;
    }

    hideActionPanel();
    selectedAction = null;
    selectedNodeId = null;
    notifyAction(action);
  }

  function notifyAction(action) {
    actionListeners.forEach(fn => { try { fn(action); } catch (e) { console.error(e); } });
  }

  function onAction(fn) {
    if (typeof fn === 'function') actionListeners.push(fn);
  }

  function getCurrentRound() {
    return (App && App.getRound ? App.getRound() : 1);
  }

  function typeLabel(t) {
    return { source: '气源站', relay: '中继点', target: '目标气球群', hazard: '危险带', special: '特殊装置', secret: '机密节点' }[t] || t;
  }

  return { init, updateState, render, renderMap, onAction };
})();
