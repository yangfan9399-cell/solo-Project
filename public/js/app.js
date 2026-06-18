class LiuliGame {
  constructor() {
    this.currentGameId = 'yi';
    this.gameConfig = null;
    this.currentState = null;
    this.history = [];
    this.isEnded = false;
    this.result = null;
    this.replayIndex = -1;
    this.isReplaying = false;
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.checkSavedGame();
    this.updateActiveTab();
    await this.loadGame(this.currentGameId);
  }

  bindEvents() {
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const gameId = tab.dataset.game;
        this.switchGame(gameId);
      });
    });

    document.getElementById('replayPrev').addEventListener('click', () => this.replayPrev());
    document.getElementById('replayNext').addEventListener('click', () => this.replayNext());
    document.getElementById('replayCurrent').addEventListener('click', () => this.replayCurrent());
    document.getElementById('viewSettlementBtn').addEventListener('click', () => this.viewSettlement());
    document.getElementById('resetGameBtn').addEventListener('click', () => this.resetGame());
    document.getElementById('modalCloseBtn').addEventListener('click', () => this.closeModal());
  }

  updateActiveTab() {
    document.querySelectorAll('.game-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.game === this.currentGameId);
    });
  }

  async checkSavedGame() {
    try {
      const res = await fetch('/api/save/current');
      const data = await res.json();
      if (data.hasSave) {
        this.currentGameId = data.gameId;
      }
    } catch (e) {
      console.error('检查存档失败', e);
    }
  }

  async switchGame(gameId) {
    this.currentGameId = gameId;
    this.updateActiveTab();
    await this.loadGame(gameId);
  }

  async loadGame(gameId) {
    try {
      const [configRes, stateRes] = await Promise.all([
        fetch(`/api/game/${gameId}/config`),
        fetch(`/api/game/${gameId}/state`)
      ]);

      if (configRes.ok) {
        this.gameConfig = await configRes.json();
      }

      if (stateRes.ok) {
        const stateData = await stateRes.json();
        this.currentState = stateData.currentState;
        this.history = stateData.history;
        this.isEnded = stateData.isEnded;
        this.result = stateData.result;
        this.replayIndex = this.history.length - 1;
      } else {
        await this.startGame(gameId);
        return;
      }

      this.renderAll();
    } catch (e) {
      console.error('加载游戏失败', e);
      this.showModal('错误', '加载游戏数据失败');
    }
  }

  async startGame(gameId) {
    try {
      const res = await fetch(`/api/game/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      this.currentState = data.currentState;
      this.history = data.history;
      this.isEnded = data.isEnded;
      this.result = null;
      this.replayIndex = 0;
      this.renderAll();
    } catch (e) {
      console.error('开始游戏失败', e);
    }
  }

  async applyEvent(eventId) {
    if (this.isEnded || this.isReplaying) return;

    try {
      const res = await fetch(`/api/game/${this.currentGameId}/apply-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (!res.ok) {
        const err = await res.json();
        this.showModal('无法执行', err.error || '资源不足或其他错误');
        return;
      }

      const data = await res.json();
      this.currentState = data.currentState;
      this.history = data.history;
      this.isEnded = data.isEnded;
      this.result = data.result;
      this.replayIndex = this.history.length - 1;

      this.renderAll();

      if (this.isEnded && this.result) {
        setTimeout(() => {
          this.showSettlementModal();
        }, 300);
      }
    } catch (e) {
      console.error('执行事件失败', e);
    }
  }

  async resetGame() {
    if (!confirm('确定要重置本局吗？所有进度将丢失。')) return;

    try {
      const res = await fetch(`/api/game/${this.currentGameId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      this.currentState = data.currentState;
      this.history = data.history;
      this.isEnded = data.isEnded;
      this.result = null;
      this.replayIndex = 0;
      this.isReplaying = false;
      this.renderAll();
    } catch (e) {
      console.error('重置游戏失败', e);
    }
  }

  replayPrev() {
    if (this.replayIndex > 0) {
      this.replayIndex--;
      this.isReplaying = true;
      this.renderReplayState();
    }
  }

  replayNext() {
    if (this.replayIndex < this.history.length - 1) {
      this.replayIndex++;
      if (this.replayIndex === this.history.length - 1) {
        this.isReplaying = false;
      }
      this.renderReplayState();
    }
  }

  replayCurrent() {
    this.replayIndex = this.history.length - 1;
    this.isReplaying = false;
    this.renderAll();
  }

  renderReplayState() {
    const entry = this.history[this.replayIndex];
    if (entry) {
      this.renderState(entry.state);
      this.renderTimeline();
    }
  }

  renderAll() {
    this.renderGameInfo();
    this.renderState(this.currentState);
    this.renderEvents();
    this.renderTimeline();
    this.renderSettlement();
    this.renderMap();
  }

  renderGameInfo() {
    if (!this.gameConfig) return;
    document.getElementById('gameName').textContent = this.gameConfig.name;
    document.getElementById('gameDifficulty').textContent = this.gameConfig.difficulty;

    const win = this.gameConfig.winCondition;
    const lose = this.gameConfig.loseCondition;

    let winText = '';
    if (win.type === 'sealedValue') winText = `封存值 ≥ ${win.target}`;
    else if (win.type === 'renReward') winText = `壬号奖励 ≥ ${win.target}`;

    let loseText = '';
    if (lose.type === 'yiRisk') loseText = `乙号风险 ≥ ${lose.target}`;
    else if (lose.type === 'sealedValue') loseText = `封存值 ≤ ${lose.target}`;
    else if (lose.type === 'ziFailure') loseText = `子号失败因子 ≥ ${lose.target}`;

    document.getElementById('winCondition').textContent = winText;
    document.getElementById('loseCondition').textContent = loseText;
  }

  renderState(state) {
    document.getElementById('sealedValue').textContent = state.sealedValue;
    document.getElementById('rewriteSlots').textContent = state.rewriteSlots;
    document.getElementById('translationTraces').textContent = state.translationTraces;
    document.getElementById('yiRisk').textContent = state.yiRisk;
    document.getElementById('renReward').textContent = state.renReward;
    document.getElementById('ziFailure').textContent = state.ziFailure;

    const maxTurns = this.gameConfig ? this.gameConfig.maxTurns : 8;
    const currentTurn = Math.min(state.turn, maxTurns);
    document.getElementById('turnDisplay').textContent = `${currentTurn} / ${maxTurns}`;

    const winTarget = this.gameConfig?.winCondition?.target || 200;
    const sealedPct = Math.min(100, (state.sealedValue / winTarget) * 100);
    document.getElementById('sealedBar').style.width = `${sealedPct}%`;

    const loseTarget = this.gameConfig?.loseCondition?.target || 100;
    if (this.gameConfig?.loseCondition?.type === 'yiRisk') {
      const yiPct = Math.min(100, (state.yiRisk / loseTarget) * 100);
      document.getElementById('yiRiskBar').style.width = `${yiPct}%`;
      document.getElementById('ziFailureBar').style.width = '0%';
    } else if (this.gameConfig?.loseCondition?.type === 'ziFailure') {
      const ziPct = Math.min(100, (state.ziFailure / loseTarget) * 100);
      document.getElementById('ziFailureBar').style.width = `${ziPct}%`;
      document.getElementById('yiRiskBar').style.width = '0%';
    } else {
      document.getElementById('yiRiskBar').style.width = `${state.yiRisk}%`;
      document.getElementById('ziFailureBar').style.width = `${state.ziFailure}%`;
    }
  }

  renderEvents() {
    const container = document.getElementById('eventsList');
    if (!this.gameConfig || !this.currentState) {
      container.innerHTML = '<p style="color:#8892b0;font-size:13px;">加载中...</p>';
      return;
    }

    const events = this.gameConfig.events;
    container.innerHTML = events.map(event => {
      const canAfford = this.canAffordEvent(event);
      const disabled = !canAfford || this.isEnded || this.isReplaying;

      const costText = Object.entries(event.cost || {})
        .map(([key, val]) => {
          const labels = {
            rewriteSlots: '复写槽',
            translationTraces: '转译痕',
            sealedValue: '封存值'
          };
          return `${labels[key] || key} -${val}`;
        }).join(' ');

      return `
        <div class="event-card ${disabled ? 'disabled' : ''}" data-event-id="${event.id}">
          <div class="event-name">${event.name}</div>
          <div class="event-desc">${event.desc}</div>
          ${costText ? `<div class="event-cost"><span>${costText}</span></div>` : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        const eventId = card.dataset.eventId;
        this.applyEvent(eventId);
      });
    });
  }

  canAffordEvent(event) {
    if (!this.currentState) return false;
    for (const [key, value] of Object.entries(event.cost || {})) {
      if (this.currentState[key] === undefined || this.currentState[key] < value) {
        return false;
      }
    }
    return true;
  }

  renderTimeline() {
    const container = document.getElementById('replayTimeline');
    if (!this.history || this.history.length === 0) {
      container.innerHTML = '<p style="color:#8892b0;font-size:12px;">暂无记录</p>';
      return;
    }

    container.innerHTML = this.history.map((entry, idx) => {
      const isActive = idx === this.replayIndex;
      let eventName = '初始状态';
      if (entry.type === 'event' && entry.eventName) {
        eventName = entry.eventName;
      }

      const state = entry.state;
      const statePreview = `封${state.sealedValue} 复${state.rewriteSlots} 转${state.translationTraces}`;

      return `
        <div class="timeline-item ${isActive ? 'active' : ''}" data-step="${idx}">
          <div class="timeline-step">第 ${idx} 步</div>
          <div class="timeline-event">${eventName}</div>
          <div class="timeline-state-preview">${statePreview}</div>
        </div>
      `;
    }).reverse().join('');

    container.querySelectorAll('.timeline-item').forEach(item => {
      item.addEventListener('click', () => {
        const step = parseInt(item.dataset.step);
        this.replayIndex = step;
        this.isReplaying = step < this.history.length - 1;
        this.renderReplayState();
      });
    });
  }

  renderSettlement() {
    const container = document.getElementById('settlementContent');
    
    if (!this.isEnded || !this.result) {
      container.innerHTML = '<p class="settlement-placeholder">游戏进行中...</p>';
      return;
    }

    const r = this.result;
    let statusClass = 'win';
    let statusText = '胜利';
    if (r.hiddenTriggered) {
      statusClass = 'hidden';
      statusText = '隐藏结局';
    } else if (r.lose) {
      statusClass = 'lose';
      statusText = '失败';
    }

    container.innerHTML = `
      <div class="settlement-result">
        <div class="settlement-status ${statusClass}">${statusText}</div>
        <div class="settlement-message">${r.message}</div>
        <div class="settlement-score">${r.score} 分</div>
        <div class="settlement-stats">
          <div class="settlement-stat">
            <span class="settlement-stat-label">总步数</span>
            <span class="settlement-stat-value">${r.steps}</span>
          </div>
          <div class="settlement-stat">
            <span class="settlement-stat-label">封存值</span>
            <span class="settlement-stat-value">${r.finalState.sealedValue}</span>
          </div>
          <div class="settlement-stat">
            <span class="settlement-stat-label">乙号风险</span>
            <span class="settlement-stat-value">${r.finalState.yiRisk}</span>
          </div>
          <div class="settlement-stat">
            <span class="settlement-stat-label">壬号奖励</span>
            <span class="settlement-stat-value">${r.finalState.renReward}</span>
          </div>
          <div class="settlement-stat">
            <span class="settlement-stat-label">子号失败</span>
            <span class="settlement-stat-value">${r.finalState.ziFailure}</span>
          </div>
          <div class="settlement-stat">
            <span class="settlement-stat-label">复写槽</span>
            <span class="settlement-stat-value">${r.finalState.rewriteSlots}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderMap() {
    const svg = document.getElementById('gameMap');
    if (!this.gameConfig || !this.gameConfig.mapNodes) return;

    const nodes = this.gameConfig.mapNodes;
    const turn = this.currentState ? this.currentState.turn : 1;
    const activeIdx = Math.min(turn - 1, nodes.length - 1);

    let linesHtml = '';
    for (let i = 0; i < nodes.length - 1; i++) {
      const n1 = nodes[i];
      const n2 = nodes[i + 1];
      linesHtml += `<line class="map-line" x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" />`;
    }

    let nodesHtml = nodes.map((node, idx) => `
      <g>
        <circle class="map-node ${idx <= activeIdx ? 'active' : ''}" 
                cx="${node.x}" cy="${node.y}" r="3" />
        <text class="map-node-label" x="${node.x}" y="${node.y - 4}">
          ${node.label}
        </text>
      </g>
    `).join('');

    svg.innerHTML = linesHtml + nodesHtml;
  }

  async viewSettlement() {
    try {
      const res = await fetch(`/api/game/${this.currentGameId}/settlement`);
      const data = await res.json();
      if (data.settlement) {
        this.result = data.settlement;
        this.showSettlementModal();
      }
    } catch (e) {
      console.error('获取结算失败', e);
    }
  }

  showSettlementModal() {
    if (!this.result) return;
    const r = this.result;
    let statusText = r.hiddenTriggered ? '隐藏结局触发！' : (r.win ? '胜利！' : '失败...');
    this.showModal(statusText, `${r.message}\n\n最终得分：${r.score} 分`);
  }

  showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modal').classList.remove('hidden');
  }

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LiuliGame();
});
