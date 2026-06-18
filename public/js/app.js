class NightVoyageGame {
  constructor() {
    this.gameId = 'chou';
    this.sessionId = null;
    this.gameState = null;
    this.gameInfo = null;
    this.replayData = [];
    this.replayIndex = -1;
    this.isReplayMode = false;
    this.isPlaying = false;
    this.playInterval = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadFromStorage();
  }

  bindEvents() {
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const gameId = e.target.dataset.game;
        this.switchGame(gameId);
      });
    });

    document.getElementById('endTurnBtn').addEventListener('click', () => {
      this.endTurn();
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
      this.restartGame();
    });

    document.querySelectorAll('.slot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const slotType = e.target.dataset.slot;
        this.useSlot(slotType);
      });
    });

    document.getElementById('replayPrev').addEventListener('click', () => {
      this.replayStep(-1);
    });

    document.getElementById('replayNext').addEventListener('click', () => {
      this.replayStep(1);
    });

    document.getElementById('replayPlay').addEventListener('click', () => {
      this.togglePlay();
    });

    document.getElementById('replayResume').addEventListener('click', () => {
      this.resumeFromReplay();
    });

    document.getElementById('viewSettlementBtn').addEventListener('click', () => {
      this.showSettlement();
    });

    document.getElementById('closeSettlementBtn').addEventListener('click', () => {
      this.hideSettlement();
    });

    document.getElementById('replayFromSettlementBtn').addEventListener('click', () => {
      this.hideSettlement();
      this.enterReplayMode();
    });

    document.getElementById('playAgainBtn').addEventListener('click', () => {
      this.hideStatusOverlay();
      this.restartGame();
    });
  }

  loadFromStorage() {
    const savedGameId = localStorage.getItem('nvpb_gameId');
    const savedSessionId = localStorage.getItem('nvpb_sessionId');
    const savedReplay = localStorage.getItem('nvpb_replay');
    
    if (savedGameId) {
      this.gameId = savedGameId;
      this.updateGameTabs();
    }
    
    if (savedReplay) {
      try {
        this.replayData = JSON.parse(savedReplay);
      } catch (e) {
        this.replayData = [];
      }
    }
    
    if (savedSessionId) {
      this.sessionId = savedSessionId;
      this.loadSession();
    } else if (this.replayData.length > 0) {
      this.restoreFromLocalReplay();
    } else {
      this.startNewGame();
    }
  }

  saveToStorage() {
    localStorage.setItem('nvpb_gameId', this.gameId);
    if (this.sessionId) {
      localStorage.setItem('nvpb_sessionId', this.sessionId);
    }
    if (this.replayData.length > 0) {
      localStorage.setItem('nvpb_replay', JSON.stringify(this.replayData));
    }
  }

  updateGameTabs() {
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.game === this.gameId);
    });
  }

  async switchGame(gameId) {
    if (gameId === this.gameId) return;
    
    this.gameId = gameId;
    this.updateGameTabs();
    this.showLoading();
    
    this.sessionId = null;
    this.replayData = [];
    this.replayIndex = -1;
    this.isReplayMode = false;
    
    localStorage.removeItem('nvpb_sessionId');
    localStorage.removeItem('nvpb_replay');
    
    await this.startNewGame();
    this.hideLoading();
  }

  async startNewGame() {
    try {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.sessionId = sessionId;
      
      const response = await fetch(`/api/games/${this.gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await response.json();
      this.gameState = data.state;
      this.sessionId = data.sessionId;
      
      await this.loadGameInfo();
      
      this.replayData = [{
        turn: 0,
        action: 'start',
        state: JSON.parse(JSON.stringify(this.gameState)),
        timestamp: Date.now()
      }];
      
      this.renderAll();
      this.saveToStorage();
      this.saveReplayToServer();
      
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }

  async loadSession() {
    try {
      const response = await fetch(`/api/sessions/${this.sessionId}`);
      if (!response.ok) throw new Error('Session not found');
      
      const data = await response.json();
      this.gameState = data.state;
      
      await this.loadGameInfo();
      await this.loadReplay();
      
      this.renderAll();
    } catch (error) {
      console.error('Failed to load session from server:', error);
      this.restoreFromLocalReplay();
    }
  }

  async restoreFromLocalReplay() {
    if (this.replayData.length === 0) {
      this.startNewGame();
      return;
    }
    
    const lastStep = this.replayData[this.replayData.length - 1];
    const lastState = lastStep.state;
    
    if (!lastState || !lastState.gameId) {
      this.startNewGame();
      return;
    }
    
    this.gameId = lastState.gameId;
    this.updateGameTabs();
    this.gameState = JSON.parse(JSON.stringify(lastState));
    this.replayIndex = this.replayData.length - 1;
    
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.gameState.sessionId = this.sessionId;
    
    await this.loadGameInfo();
    
    this.renderAll();
    
    this.saveToStorage();
    await this.saveReplayToServer();
  }

  async loadGameInfo() {
    try {
      const response = await fetch(`/api/games/${this.gameId}`);
      const data = await response.json();
      this.gameInfo = data.game;
    } catch (error) {
      console.error('Failed to load game info:', error);
    }
  }

  async loadReplay() {
    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/replay`);
      if (!response.ok) throw new Error('Replay not found');
      
      const data = await response.json();
      this.replayData = data.replay;
      this.replayIndex = this.replayData.length - 1;
    } catch (error) {
      console.error('Failed to load replay:', error);
    }
  }

  async saveReplayToServer() {
    try {
      await fetch('/api/replay/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          replayData: this.replayData
        })
      });
    } catch (error) {
      console.error('Failed to save replay:', error);
    }
  }

  async endTurn() {
    if (this.isReplayMode || this.gameState.status !== 'playing') return;
    
    this.showLoading();
    
    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_turn' })
      });
      
      const data = await response.json();
      this.gameState = data.state;
      
      this.replayData.push({
        turn: this.gameState.turn,
        action: 'end_turn',
        state: JSON.parse(JSON.stringify(this.gameState)),
        timestamp: Date.now()
      });
      this.replayIndex = this.replayData.length - 1;
      
      this.renderAll();
      this.saveToStorage();
      this.saveReplayToServer();
      
      this.checkGameEnd();
      
    } catch (error) {
      console.error('Failed to end turn:', error);
    }
    
    this.hideLoading();
  }

  async moveToNode(nodeId) {
    if (this.isReplayMode || this.gameState.status !== 'playing') return;
    
    if (nodeId === this.gameState.currentNode) return;
    
    const reachable = this.getReachableNodes();
    if (!reachable.includes(nodeId)) return;
    
    this.showLoading();
    
    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'move',
          payload: { nodeId }
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || '移动失败');
        this.hideLoading();
        return;
      }
      
      const data = await response.json();
      this.gameState = data.state;
      
      this.replayData.push({
        turn: this.gameState.turn,
        action: 'move',
        payload: { nodeId },
        state: JSON.parse(JSON.stringify(this.gameState)),
        timestamp: Date.now()
      });
      this.replayIndex = this.replayData.length - 1;
      
      this.renderAll();
      this.saveToStorage();
      this.saveReplayToServer();
      
      this.checkGameEnd();
      
    } catch (error) {
      console.error('Failed to move:', error);
    }
    
    this.hideLoading();
  }

  async useSlot(slotType) {
    if (this.isReplayMode || this.gameState.status !== 'playing') return;
    
    if (this.gameState.usedSlots >= this.gameState.rehearsalSlots) {
      alert('排演槽已用尽！');
      return;
    }
    
    this.showLoading();
    
    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'use_slot',
          payload: { type: slotType }
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || '使用排演槽失败');
        this.hideLoading();
        return;
      }
      
      const data = await response.json();
      this.gameState = data.state;
      
      this.replayData.push({
        turn: this.gameState.turn,
        action: 'use_slot',
        payload: { type: slotType },
        state: JSON.parse(JSON.stringify(this.gameState)),
        timestamp: Date.now()
      });
      this.replayIndex = this.replayData.length - 1;
      
      this.renderAll();
      this.saveToStorage();
      this.saveReplayToServer();
      
      this.checkGameEnd();
      
    } catch (error) {
      console.error('Failed to use slot:', error);
    }
    
    this.hideLoading();
  }

  getReachableNodes() {
    if (!this.gameInfo) return [];
    
    const currentNode = this.gameState.currentNode;
    const reachable = [];
    
    for (const route of this.gameInfo.map.routes) {
      if (route[0] === currentNode) {
        reachable.push(route[1]);
      } else if (route[1] === currentNode) {
        reachable.push(route[0]);
      }
    }
    
    return reachable;
  }

  checkGameEnd() {
    if (this.gameState.status === 'won') {
      this.showStatusOverlay('🎉', '胜利！', '恭喜你成功驾驭夜航纸船！');
    } else if (this.gameState.status === 'lost') {
      this.showStatusOverlay('💔', '失败...', '纸船在夜海中迷失了方向...');
    }
  }

  renderAll() {
    this.renderStatus();
    this.renderResources();
    this.renderSlots();
    this.renderMap();
    this.renderEvents();
    this.renderReplayTimeline();
    this.updateActionButtons();
  }

  renderStatus() {
    const state = this.gameState;
    
    document.getElementById('strippingValue').textContent = Math.floor(state.strippingValue);
    document.getElementById('maxStrippingValue').textContent = state.maxStrippingValue;
    
    const stripPercent = (state.strippingValue / state.maxStrippingValue) * 100;
    document.getElementById('strippingBar').style.width = `${stripPercent}%`;
    
    document.getElementById('calibrationMarks').textContent = state.calibrationMarks.toFixed(1);
    document.getElementById('targetCalibration').textContent = state.targetCalibration;
    
    const calPercent = (state.calibrationMarks / state.targetCalibration) * 100;
    document.getElementById('calibrationBar').style.width = `${Math.min(100, calPercent)}%`;
    
    document.getElementById('chouRisk').textContent = Math.floor(state.chouRisk * 100);
    document.getElementById('shenReward').textContent = Math.floor(state.shenReward * 100);
    document.getElementById('jiaFailureFactor').textContent = Math.floor(state.jiaFailureFactor * 100);
    document.getElementById('currentTurn').textContent = state.turn;
    document.getElementById('maxTurns').textContent = state.maxTurns;
  }

  renderResources() {
    const resources = this.gameState.resources;
    document.getElementById('paperValue').textContent = resources.paper;
    document.getElementById('inkValue').textContent = resources.ink;
    document.getElementById('lightValue').textContent = resources.light;
  }

  renderSlots() {
    const container = document.getElementById('slotsContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < this.gameState.rehearsalSlots; i++) {
      const dot = document.createElement('div');
      dot.className = `slot-dot ${i < this.gameState.usedSlots ? 'used' : ''}`;
      container.appendChild(dot);
    }
    
    document.getElementById('usedSlots').textContent = this.gameState.usedSlots;
    document.getElementById('rehearsalSlots').textContent = this.gameState.rehearsalSlots;
    
    const slotBtns = document.querySelectorAll('.slot-btn');
    const disabled = this.gameState.usedSlots >= this.gameState.rehearsalSlots || this.gameState.status !== 'playing' || this.isReplayMode;
    slotBtns.forEach(btn => {
      btn.disabled = disabled;
    });
  }

  renderMap() {
    if (!this.gameInfo) return;
    
    const mapContainer = document.getElementById('gameMap');
    const nodes = this.gameInfo.map.nodes;
    const routes = this.gameInfo.map.routes;
    const reachable = this.getReachableNodes();
    const currentNode = this.gameState.currentNode;
    const visitedNodes = this.gameState.visitedNodes;
    
    let svg = `<svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">`;
    
    for (const route of routes) {
      const n1 = nodes.find(n => n.id === route[0]);
      const n2 = nodes.find(n => n.id === route[1]);
      if (!n1 || !n2) continue;
      
      let routeClass = 'map-route';
      if (visitedNodes.includes(route[0]) && visitedNodes.includes(route[1])) {
        routeClass += ' active';
      }
      if ((reachable.includes(route[0]) && route[1] === currentNode) ||
          (reachable.includes(route[1]) && route[0] === currentNode)) {
        routeClass += ' reachable';
      }
      
      svg += `<line class="${routeClass}" x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" />`;
    }
    
    for (const node of nodes) {
      let nodeClass = 'map-node';
      if (node.id === currentNode) nodeClass += ' current';
      else if (visitedNodes.includes(node.id)) nodeClass += ' visited';
      else if (reachable.includes(node.id)) nodeClass += ' reachable';
      
      const isClickable = reachable.includes(node.id) && !this.isReplayMode && this.gameState.status === 'playing';
      
      svg += `<g class="${nodeClass}" data-node="${node.id}" ${isClickable ? 'style="cursor:pointer;"' : ''}>`;
      svg += `<circle cx="${node.x}" cy="${node.y}" r="4" />`;
      svg += `<text x="${node.x}" y="${node.y + 8}" text-anchor="middle">${node.name}</text>`;
      if (node.id === currentNode) {
        svg += `<text x="${node.x}" y="${node.y - 5}" text-anchor="middle" class="boat-icon" style="font-size:6px;">⛵</text>`;
      }
      svg += `</g>`;
    }
    
    svg += `</svg>`;
    mapContainer.innerHTML = svg;
    
    mapContainer.querySelectorAll('.map-node.reachable').forEach(el => {
      el.addEventListener('click', () => {
        const nodeId = el.dataset.node;
        this.moveToNode(nodeId);
      });
    });
  }

  renderEvents() {
    const eventBox = document.getElementById('eventBox');
    const eventLog = document.getElementById('eventLog');
    
    const eventLogItems = this.gameState.eventLog || [];
    
    if (eventLogItems.length === 0) {
      eventBox.innerHTML = '<div class="event-placeholder">事件将在各回合触发...</div>';
    } else {
      const latestEvent = eventLogItems[eventLogItems.length - 1];
      eventBox.innerHTML = `
        <div class="event-item ${latestEvent.type}">
          <div class="event-name">
            <span class="event-type-tag">第${latestEvent.turn}回合</span>
            ${latestEvent.name}
          </div>
          <div class="event-description">${latestEvent.description}</div>
        </div>
      `;
    }
    
    eventLog.innerHTML = '';
    for (let i = eventLogItems.length - 1; i >= 0; i--) {
      const event = eventLogItems[i];
      const item = document.createElement('div');
      item.className = 'event-log-item';
      item.innerHTML = `
        <div class="event-log-turn">第 ${event.turn} 回合</div>
        <div><strong>${event.name}</strong>：${event.description}</div>
      `;
      eventLog.appendChild(item);
    }
  }

  renderReplayTimeline() {
    const timeline = document.getElementById('replayTimeline');
    timeline.innerHTML = '';
    
    for (let i = 0; i < this.replayData.length; i++) {
      const step = this.replayData[i];
      const stepEl = document.createElement('div');
      stepEl.className = `replay-step ${i === this.replayIndex ? 'active' : ''}`;
      
      let actionLabel = '';
      switch (step.action) {
        case 'start': actionLabel = '开始'; break;
        case 'move': actionLabel = '移动'; break;
        case 'use_slot': actionLabel = '排演'; break;
        case 'end_turn': actionLabel = '回合'; break;
        default: actionLabel = step.action;
      }
      
      stepEl.innerHTML = `
        <div class="step-turn">${step.turn}</div>
        <div class="step-action">${actionLabel}</div>
      `;
      
      stepEl.addEventListener('click', () => {
        this.jumpToStep(i);
      });
      
      timeline.appendChild(stepEl);
    }
  }

  updateActionButtons() {
    const endBtn = document.getElementById('endTurnBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    const canAct = !this.isReplayMode && this.gameState.status === 'playing';
    endBtn.disabled = !canAct;
  }

  enterReplayMode() {
    if (this.replayData.length === 0) return;
    
    this.isReplayMode = true;
    this.replayIndex = 0;
    this.gameState = JSON.parse(JSON.stringify(this.replayData[0].state));
    
    this.renderAll();
  }

  exitReplayMode() {
    this.isReplayMode = false;
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    
    if (this.replayData.length > 0) {
      this.replayIndex = this.replayData.length - 1;
      this.gameState = JSON.parse(JSON.stringify(this.replayData[this.replayIndex].state));
    }
    
    this.renderAll();
  }

  resumeFromReplay() {
    this.exitReplayMode();
  }

  replayStep(direction) {
    const newIndex = this.replayIndex + direction;
    
    if (newIndex < 0 || newIndex >= this.replayData.length) return;
    
    if (!this.isReplayMode) {
      this.isReplayMode = true;
    }
    
    this.replayIndex = newIndex;
    this.gameState = JSON.parse(JSON.stringify(this.replayData[newIndex].state));
    
    this.renderAll();
  }

  jumpToStep(index) {
    if (index < 0 || index >= this.replayData.length) return;
    
    if (!this.isReplayMode) {
      this.isReplayMode = true;
    }
    
    this.replayIndex = index;
    this.gameState = JSON.parse(JSON.stringify(this.replayData[index].state));
    
    this.renderAll();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pausePlay();
    } else {
      this.startPlay();
    }
  }

  startPlay() {
    if (!this.isReplayMode) {
      this.isReplayMode = true;
      this.replayIndex = 0;
      this.gameState = JSON.parse(JSON.stringify(this.replayData[0].state));
      this.renderAll();
    }
    
    this.isPlaying = true;
    document.getElementById('replayPlay').textContent = '⏸ 暂停';
    
    this.playInterval = setInterval(() => {
      if (this.replayIndex < this.replayData.length - 1) {
        this.replayStep(1);
      } else {
        this.pausePlay();
      }
    }, 1000);
  }

  pausePlay() {
    this.isPlaying = false;
    document.getElementById('replayPlay').textContent = '▶ 播放';
    
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
  }

  async showSettlement() {
    this.showLoading();
    
    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      this.renderSettlement(data.settlement);
      document.getElementById('settlementSection').style.display = 'block';
      
    } catch (error) {
      console.error('Failed to get settlement:', error);
    }
    
    this.hideLoading();
  }

  renderSettlement(settlement) {
    const content = document.getElementById('settlementContent');
    const s = settlement.finalState;
    const stats = settlement.statistics;
    
    content.innerHTML = `
      <div class="settlement-stats">
        <div class="settlement-stat">
          <div class="settlement-stat-label">游戏</div>
          <div class="settlement-stat-value" style="font-size:16px;">${settlement.gameName}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">最终状态</div>
          <div class="settlement-stat-value" style="color:${s.status === 'won' ? 'var(--status-success)' : 'var(--status-danger)'}">
            ${s.status === 'won' ? '胜利' : '失败'}
          </div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">夜航纸船剥离值</div>
          <div class="settlement-stat-value" style="color:var(--accent-gold)">${Math.floor(s.strippingValue)}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">夜航纸船定标痕</div>
          <div class="settlement-stat-value" style="color:var(--accent-cyan)">${s.calibrationMarks.toFixed(1)} / ${s.targetCalibration}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">丑号风险</div>
          <div class="settlement-stat-value" style="color:var(--status-danger)">${Math.floor(s.chouRisk * 100)}%</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">申号奖励</div>
          <div class="settlement-stat-value" style="color:var(--status-success)">${Math.floor(s.shenReward * 100)}%</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">甲号失败因子</div>
          <div class="settlement-stat-value" style="color:var(--accent-purple)">${Math.floor(s.jiaFailureFactor * 100)}%</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">回合数</div>
          <div class="settlement-stat-value">${stats.turnsPlayed} / ${s.maxTurns}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">访问节点</div>
          <div class="settlement-stat-value">${stats.nodesVisited}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">排演槽使用</div>
          <div class="settlement-stat-value">${stats.slotsUsed}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">风险事件</div>
          <div class="settlement-stat-value" style="color:var(--status-danger)">${stats.totalRiskEvents}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">奖励事件</div>
          <div class="settlement-stat-value" style="color:var(--status-success)">${stats.totalRewardEvents}</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">效率</div>
          <div class="settlement-stat-value" style="font-size:16px;">${settlement.efficiency} 定标痕/回合</div>
        </div>
        <div class="settlement-stat">
          <div class="settlement-stat-label">资源消耗</div>
          <div class="settlement-stat-value" style="font-size:14px;">
            📜${stats.totalResourcesUsed.paper} 🖋️${stats.totalResourcesUsed.ink} 💡${stats.totalResourcesUsed.light}
          </div>
        </div>
      </div>
      <div class="settlement-score">
        <div class="settlement-score-label">最终得分</div>
        <div class="settlement-score-value">${settlement.score}</div>
        <div class="settlement-rank">${settlement.rank}级</div>
      </div>
    `;
  }

  hideSettlement() {
    document.getElementById('settlementSection').style.display = 'none';
  }

  restartGame() {
    this.hideStatusOverlay();
    this.hideSettlement();
    this.startNewGame();
  }

  showStatusOverlay(icon, title, desc) {
    document.getElementById('statusIcon').textContent = icon;
    document.getElementById('statusTitle').textContent = title;
    document.getElementById('statusDesc').textContent = desc;
    document.getElementById('gameStatusOverlay').style.display = 'flex';
  }

  hideStatusOverlay() {
    document.getElementById('gameStatusOverlay').style.display = 'none';
  }

  showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
  }

  hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.game = new NightVoyageGame();
});
