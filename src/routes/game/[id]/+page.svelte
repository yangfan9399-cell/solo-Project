<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { page } from '$app/stores';
  import type { GameState, Level, Capsule, ActiveAnomaly } from '$types';
  import { tickGame, adjustValve, switchJunction, resolveAnomaly } from '$lib/gameEngine';

  let gameId: string;
  let gameState: GameState | null = null;
  let level: Level | null = null;
  let loading = true;
  let gameLoop: number | null = null;
  let lastTickTime = 0;
  let showResult = false;
  let resultData: any = null;
  let calculating = false;
  let syncTimer: number | null = null;

  $: if (gameState) {
    timeRemaining = level ? Math.max(0, level.timeLimit - gameState.currentTime) : 0;
    timeProgress = level ? (gameState.currentTime / level.timeLimit) * 100 : 0;
  }

  let timeRemaining = 0;
  let timeProgress = 0;

  async function syncGameStateToServer(): Promise<void> {
    if (!gameState) return;
    try {
      await fetch(`/api/game/${gameState.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState)
      });
    } catch (e) {
      console.error('Sync error:', e);
    }
  }

  onMount(async () => {
    gameId = $page.params.id;
    
    const stateRes = await fetch(`/api/game/${gameId}`);
    const stateData = await stateRes.json();
    
    if (stateData.error) {
      window.location.href = '/levels';
      return;
    }
    
    const loadedState = stateData.gameState;
    
    if (!loadedState) {
      window.location.href = '/levels';
      return;
    }
    
    gameState = loadedState;
    
    const levelRes = await fetch(`/api/levels/${loadedState.levelId}`);
    const levelData = await levelRes.json();
    level = levelData.level;

    if (!level) {
      const fallbackRes = await fetch('/api/levels');
      const fallbackData = await fallbackRes.json();
      const allLevels: Level[] = fallbackData.levels || [];
      level = allLevels.find(l => l.id === loadedState.levelId) || null;
    }
    
    loading = false;
    
    if (!loadedState.isGameOver) {
      startGameLoop();
      syncTimer = window.setInterval(syncGameStateToServer, 3000);
    } else {
      showResult = true;
      await calculateResult();
    }
  });

  onDestroy(() => {
    stopGameLoop();
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
    if (gameState && !gameState.isGameOver) {
      syncGameStateToServer();
    }
  });

  function startGameLoop() {
    lastTickTime = performance.now();
    gameLoop = requestAnimationFrame(loop);
  }

  function stopGameLoop() {
    if (gameLoop !== null) {
      cancelAnimationFrame(gameLoop);
      gameLoop = null;
    }
  }

  function loop(currentTime: number) {
    if (!gameState || !level) return;
    
    const deltaTime = (currentTime - lastTickTime) / 1000;
    lastTickTime = currentTime;
    
    if (!gameState.isPaused && !gameState.isGameOver) {
      gameState = tickGame(gameState, level, deltaTime);
      
      if (gameState.isGameOver) {
        stopGameLoop();
        if (syncTimer) {
          clearInterval(syncTimer);
          syncTimer = null;
        }
        syncGameStateToServer().then(() => {
          showResult = true;
          calculateResult();
        });
      }
    }
    
    gameLoop = requestAnimationFrame(loop);
  }

  async function calculateResult() {
    if (!gameState || calculating) return;
    
    calculating = true;
    try {
      const res = await fetch(`/api/game/${gameState.id}/recalculate`, {
        method: 'POST'
      });
      resultData = await res.json();
    } catch (e) {
      console.error('Calculate result error:', e);
    }
    calculating = false;
  }

  function handleValveChange(valveId: string, event: Event) {
    if (!gameState || gameState.isPaused || gameState.isGameOver) return;
    
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    
    gameState = adjustValve(gameState, valveId, value);
  }

  function handleJunctionClick(junctionId: string) {
    if (!gameState || gameState.isPaused || gameState.isGameOver) return;
    
    gameState = switchJunction(gameState, junctionId);
  }

  function handleResolveAnomaly(anomalyId: string) {
    if (!gameState || gameState.isPaused || gameState.isGameOver) return;
    
    gameState = resolveAnomaly(gameState, anomalyId);
  }

  async function handleUndo() {
    if (!gameState || gameState.isGameOver) return;
    
    const res = await fetch(`/api/game/${gameState.id}/undo`, {
      method: 'POST'
    });
    
    const data = await res.json();
    if (data.gameState) {
      gameState = data.gameState;
    }
  }

  async function togglePause() {
    if (!gameState || gameState.isGameOver) return;
    gameState.isPaused = !gameState.isPaused;
    await syncGameStateToServer();
  }

  function getCapsulePosition(capsule: Capsule): { x: number; y: number } {
    if (!gameState || !level) return { x: 0, y: 0 };
    
    const getPos = (id: string) => {
      const valve = gameState!.valves.find(v => v.id === id);
      if (valve) return { x: valve.x, y: valve.y };
      const junction = gameState!.junctions.find(j => j.id === id);
      if (junction) return { x: junction.x, y: junction.y };
      const station = gameState!.stations.find(s => s.id === id);
      if (station) return { x: station.x, y: station.y };
      return { x: 0, y: 0 };
    };
    
    const from = getPos(capsule.currentNodeId);
    const to = getPos(capsule.targetNodeId);
    
    return {
      x: from.x + (to.x - from.x) * capsule.progress,
      y: from.y + (to.y - from.y) * capsule.progress
    };
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical': return '#f87171';
      case 'express': return '#fbbf24';
      default: return '#60a5fa';
    }
  }

  function getAnomalyTypeIcon(type: string): string {
    switch (type) {
      case 'pressure_surge': return '🌊';
      case 'pipe_leak': return '💧';
      case 'junction_failure': return '⚡';
      case 'power_outage': return '🔌';
      default: return '⚠️';
    }
  }

  function exitGame() {
    window.location.href = '/levels';
  }

  function playAgain() {
    if (level) {
      startLevel(level.id);
    }
  }

  async function startLevel(levelId: number) {
    const res = await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId })
    });
    
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/game/${data.gameState.id}`;
    }
  }

  $: activeAnomalies = gameState?.activeAnomalies.filter(a => !a.resolved) || [];
  $: waitingCapsules = gameState?.capsules.filter(c => c.status === 'waiting') || [];
  $: movingCapsules = gameState?.capsules.filter(c => c.status === 'moving' || c.status === 'delayed') || [];
  $: deliveredCapsules = gameState?.capsules.filter(c => c.status === 'delivered') || [];
</script>

<div class="game-page">
  {#if loading}
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <p>正在加载游戏...</p>
    </div>
  {:else if gameState && level}
    <div class="game-container">
      <div class="game-hud">
        <div class="hud-left">
          <div class="hud-item">
            <span class="hud-icon">🏷️</span>
            <span class="hud-label">关卡</span>
            <span class="hud-value">{level.name}</span>
          </div>
          <div class="hud-item">
            <span class="hud-icon">⏱️</span>
            <span class="hud-label">剩余时间</span>
            <span class="hud-value {timeRemaining < 30 ? 'text-red-400' : ''}">
              {Math.floor(timeRemaining / 60)}:{Math.floor(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        
        <div class="hud-center">
          <div class="time-bar-container">
            <div class="time-bar" style="width: {100 - timeProgress}%"></div>
          </div>
        </div>

        <div class="hud-right">
          <div class="hud-item">
            <span class="hud-icon">🎯</span>
            <span class="hud-label">送达</span>
            <span class="hud-value">{gameState.deliveriesCompleted}/{level.targetDeliveries}</span>
          </div>
          <div class="hud-item">
            <span class="hud-icon">🏆</span>
            <span class="hud-label">分数</span>
            <span class="hud-value text-yellow-400">{gameState.score}</span>
          </div>
          <div class="hud-actions">
            <button class="hud-btn" on:click={handleUndo} disabled={gameState.operationHistory.length === 0} title="撤销">
              ↩️
            </button>
            <button class="hud-btn" on:click={togglePause} title={gameState.isPaused ? '继续' : '暂停'}>
              {gameState.isPaused ? '▶️' : '⏸️'}
            </button>
          </div>
        </div>
      </div>

      {#if gameState.isPaused && !gameState.isGameOver}
        <div class="pause-overlay">
          <div class="pause-card">
            <h2>⏸️ 游戏暂停</h2>
            <button class="btn-primary" on:click={togglePause}>继续游戏</button>
            <button class="btn-secondary" on:click={exitGame}>退出关卡</button>
          </div>
        </div>
      {/if}

      <div class="game-layout">
        <div class="game-canvas-container">
          <svg class="game-canvas" viewBox="0 0 800 600">
            {#each level.pipes as pipe}
              {@const fromPos = gameState.valves.find(v => v.id === pipe.from) || 
                gameState.junctions.find(j => j.id === pipe.from) || 
                gameState.stations.find(s => s.id === pipe.from)}
              {@const toPos = gameState.valves.find(v => v.id === pipe.to) || 
                gameState.junctions.find(j => j.id === pipe.to) || 
                gameState.stations.find(s => s.id === pipe.to)}
              {#if fromPos && toPos}
                {@const hasAnomaly = activeAnomalies.some(a => a.config.targetId === pipe.id)}
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={hasAnomaly ? '#ef4444' : '#3b82f6'}
                  stroke-width={hasAnomaly ? '6' : '4'}
                  stroke-opacity={hasAnomaly ? '0.8' : '0.6'}
                  stroke-dasharray={hasAnomaly ? '10,5' : 'none'}
                />
              {/if}
            {/each}

            {#each gameState.stations as station}
              <g class="station" transform={`translate(${station.x}, ${station.y})`}>
                <circle
                  r="25"
                  fill={station.type === 'origin' ? '#10b981' : station.type === 'destination' ? '#8b5cf6' : '#f59e0b'}
                  stroke="#fff"
                  stroke-width="2"
                />
                <text text-anchor="middle" dy="-35" fill="#fff" font-size="12" font-weight="600">
                  {station.name}
                </text>
                <text text-anchor="middle" dy="5" fill="#fff" font-size="14">
                  {station.type === 'origin' ? '📤' : station.type === 'destination' ? '📥' : '🔄'}
                </text>
                {#if station.queue.length > 0}
                  <circle cx="20" cy="-20" r="10" fill="#ef4444" />
                  <text x="20" y="-16" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">
                    {station.queue.length}
                  </text>
                {/if}
              </g>
            {/each}

            {#each gameState.valves as valve}
              <g class="valve" transform={`translate(${valve.x}, ${valve.y})`}>
                <circle
                  r="20"
                  fill={valve.isOpen ? '#3b82f6' : '#6b7280'}
                  stroke="#fff"
                  stroke-width="2"
                  class="valve-node"
                />
                <text text-anchor="middle" dy="-28" fill="#fff" font-size="10" font-weight="600">
                  气压: {Math.round(valve.pressure)}
                </text>
                <text text-anchor="middle" dy="5" fill="#fff" font-size="14">🔧</text>
              </g>
            {/each}

            {#each gameState.junctions as junction}
              <g 
                class="junction" 
                transform={`translate(${junction.x}, ${junction.y})`}
                on:click={() => handleJunctionClick(junction.id)}
                class:cursor-pointer={!gameState.isPaused && !gameState.isGameOver}
              >
                <circle
                  r="22"
                  fill={junction.active ? '#f59e0b' : '#6b7280'}
                  stroke="#fff"
                  stroke-width="2"
                />
                <text text-anchor="middle" dy="-30" fill="#fff" font-size="10" font-weight="600">
                  {junction.type === 'split' ? '分流' : junction.type === 'merge' ? '合流' : '转向'}
                </text>
                <text text-anchor="middle" dy="5" fill="#fff" font-size="14">🔀</text>
                <text text-anchor="middle" dy="25" fill="#94a3b8" font-size="10">
                  {junction.direction === 'up' ? '↑' : junction.direction === 'down' ? '↓' : junction.direction === 'left' ? '←' : '→'}
                </text>
              </g>
            {/each}

            {#each movingCapsules as capsule}
              {@const pos = getCapsulePosition(capsule)}
              <g class="capsule" transform={`translate(${pos.x}, ${pos.y})`}>
                <circle
                  r="12"
                  fill={getPriorityColor(capsule.priority)}
                  stroke="#fff"
                  stroke-width="2"
                />
                <text text-anchor="middle" dy="4" fill="#fff" font-size="10">
                  {capsule.priority === 'critical' ? '❗' : capsule.priority === 'express' ? '⚡' : '📦'}
                </text>
                {#if capsule.status === 'delayed'}
                  <text text-anchor="middle" dy="-20" fill="#f87171" font-size="8" font-weight="700">
                    延迟!
                  </text>
                {/if}
              </g>
            {/each}
          </svg>
        </div>

        <div class="game-sidebar">
          <div class="sidebar-section">
            <h3>🌡️ 阀门控制</h3>
            <div class="valve-controls">
              {#each gameState.valves as valve}
                <div class="valve-control">
                  <div class="valve-info">
                    <span class="valve-label">{valve.id}</span>
                    <span class="valve-pressure">{Math.round(valve.pressure)}</span>
                  </div>
                  <input
                    type="range"
                    min={valve.minPressure}
                    max={valve.maxPressure}
                    step="1"
                    value={valve.pressure}
                    on:input={(e) => handleValveChange(valve.id, e)}
                    disabled={gameState.isPaused || gameState.isGameOver}
                    class="pressure-slider"
                  />
                  <div class="valve-range">
                    <span>{valve.minPressure}</span>
                    <span class="target-pressure">目标: {valve.targetPressure}</span>
                    <span>{valve.maxPressure}</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          {#if activeAnomalies.length > 0}
            <div class="sidebar-section anomalies-section">
              <h3>⚠️ 管道异常</h3>
              <div class="anomaly-list">
                {#each activeAnomalies as anomaly}
                  <div class="anomaly-item">
                    <div class="anomaly-header">
                      <span class="anomaly-icon">{getAnomalyTypeIcon(anomaly.config.type)}</span>
                      <span class="anomaly-title">{anomaly.config.description}</span>
                    </div>
                    <div class="anomaly-info">
                      <span class="anomaly-target">影响: {anomaly.config.targetId}</span>
                      <span class="anomaly-time">剩余: {Math.ceil(anomaly.remainingTime)}s</span>
                    </div>
                    <div class="anomaly-timer">
                      <div 
                        class="anomaly-progress" 
                        style="width: {(anomaly.remainingTime / anomaly.config.duration) * 100}%"
                      ></div>
                    </div>
                    <button 
                      class="resolve-btn"
                      on:click={() => handleResolveAnomaly(anomaly.config.id)}
                      disabled={gameState.isPaused || gameState.isGameOver}
                    >
                      🔧 紧急处理 (+{200 * anomaly.config.severity}分)
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="sidebar-section">
            <h3>📦 包裹状态</h3>
            <div class="capsule-stats">
              <div class="stat-row">
                <span class="stat-label">等待中</span>
                <span class="stat-count">{waitingCapsules.length}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">运输中</span>
                <span class="stat-count">{movingCapsules.length}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">已送达</span>
                <span class="stat-count text-green-400">{deliveredCapsules.length}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">已失败</span>
                <span class="stat-count text-red-400">{gameState.deliveriesFailed}</span>
              </div>
            </div>
          </div>

          {#if waitingCapsules.length > 0}
            <div class="sidebar-section">
              <h3>🕒 等待队列</h3>
              <div class="queue-list">
                {#each waitingCapsules.slice(0, 5) as capsule}
                  <div class="queue-item">
                    <span class="priority-dot" style="background: {getPriorityColor(capsule.priority)}"></span>
                    <span class="queue-cargo">{capsule.cargo}</span>
                    <span class="queue-time">{Math.max(0, capsule.maxDeliveryTime - capsule.deliveryTime)}s</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>

      {#if showResult && resultData}
        <div class="result-overlay">
          <div class="result-card">
            <div class="result-header {resultData.gameResult.victory ? 'victory' : 'defeat'}">
              <span class="result-icon">
                {resultData.gameResult.victory ? '🎉' : '😢'}
              </span>
              <h2>
                {resultData.gameResult.victory ? '关卡通过！' : '挑战失败'}
              </h2>
              <div class="result-rating {resultData.gameResult.rating}">
                {resultData.gameResult.rating}
              </div>
            </div>

            <div class="result-body">
              <div class="score-comparison">
                <div class="score-item">
                  <span class="score-label">前端计算</span>
                  <span class="score-value">{resultData.gameResult.finalScore}</span>
                </div>
                <div class="score-arrow">→</div>
                <div class="score-item verified">
                  <span class="score-label">✅ 后端重算</span>
                  <span class="score-value">{resultData.gameResult.recalculatedScore}</span>
                </div>
                {#if resultData.scoreDifference !== 0}
                  <div class="score-diff {resultData.scoreDifference > 0 ? 'positive' : 'negative'}">
                    {resultData.scoreDifference > 0 ? '+' : ''}{resultData.scoreDifference}
                  </div>
                {/if}
              </div>

              <div class="score-breakdown">
                <h4>📊 分数明细</h4>
                <div class="breakdown-grid">
                  <div class="breakdown-item">
                    <span>基础送达分</span>
                    <span class="text-green-400">+{resultData.recalculatedBreakdown.baseDeliveryScore}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>准时奖励</span>
                    <span class="text-green-400">+{resultData.recalculatedBreakdown.onTimeBonus}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>优先级奖励</span>
                    <span class="text-green-400">+{resultData.recalculatedBreakdown.priorityBonus}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>异常处理奖励</span>
                    <span class="text-green-400">+{resultData.recalculatedBreakdown.anomalyResolutionBonus}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>时间奖励</span>
                    <span class="text-green-400">+{resultData.recalculatedBreakdown.timeBonus}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>效率奖励</span>
                    <span class="text-green-400">+{resultData.recalculatedBreakdown.efficiencyBonus}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>延迟扣分</span>
                    <span class="text-red-400">-{resultData.recalculatedBreakdown.delayPenalty}</span>
                  </div>
                  <div class="breakdown-item">
                    <span>丢失扣分</span>
                    <span class="text-red-400">-{resultData.recalculatedBreakdown.lossPenalty}</span>
                  </div>
                </div>
              </div>

              <div class="result-stats">
                <div class="stat-item">
                  <span class="stat-icon">📦</span>
                  <span class="stat-text">完成送达</span>
                  <span class="stat-num">{resultData.gameResult.deliveriesCompleted}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">❌</span>
                  <span class="stat-text">配送失败</span>
                  <span class="stat-num">{resultData.gameResult.deliveriesFailed}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">⏱️</span>
                  <span class="stat-text">用时</span>
                  <span class="stat-num">{Math.floor(resultData.gameResult.timeUsed)}秒</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🔧</span>
                  <span class="stat-text">异常处理</span>
                  <span class="stat-num">{resultData.gameResult.anomaliesResolved}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">🎮</span>
                  <span class="stat-text">操作次数</span>
                  <span class="stat-num">{resultData.gameResult.operationsPerformed}</span>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn-secondary" on:click={exitGame}>返回关卡</button>
              <button class="btn-primary" on:click={playAgain}>
                {resultData.gameResult.victory ? '🔄 再来一局' : '💪 重新挑战'}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .game-page {
    min-height: 100vh;
  }

  .loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 1rem;
    color: #94a3b8;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #334155;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .game-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .game-hud {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid #334155;
    border-radius: 15px;
    align-items: center;
  }

  .hud-left,
  .hud-right {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .hud-right {
    justify-content: flex-end;
  }

  .hud-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .hud-icon {
    font-size: 1rem;
  }

  .hud-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .hud-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .hud-actions {
    display: flex;
    gap: 0.5rem;
  }

  .hud-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(51, 65, 85, 0.5);
    border: 1px solid #475569;
    border-radius: 10px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hud-btn:hover:not(:disabled) {
    background: rgba(51, 65, 85, 0.8);
    border-color: #3b82f6;
  }

  .hud-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .time-bar-container {
    height: 8px;
    background: rgba(51, 65, 85, 0.5);
    border-radius: 4px;
    overflow: hidden;
  }

  .time-bar {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%);
    transition: width 0.3s;
  }

  .pause-overlay,
  .result-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .pause-card {
    background: linear-gradient(145deg, #1e3a5f 0%, #0f172a 100%);
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    border: 2px solid #3b82f6;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pause-card h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #f1f5f9;
  }

  .game-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1rem;
  }

  .game-canvas-container {
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
    border: 1px solid #334155;
    border-radius: 15px;
    overflow: hidden;
    aspect-ratio: 4/3;
  }

  .game-canvas {
    width: 100%;
    height: 100%;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .valve-node {
    transition: fill 0.2s;
  }

  .game-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }

  .sidebar-section {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1rem;
  }

  .sidebar-section h3 {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #f1f5f9;
  }

  .anomalies-section {
    border-color: #ef4444;
    animation: pulse-border 2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%, 100% { border-color: #ef4444; }
    50% { border-color: #f87171; }
  }

  .valve-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .valve-control {
    background: rgba(15, 23, 42, 0.6);
    border-radius: 10px;
    padding: 0.75rem;
  }

  .valve-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .valve-label {
    font-weight: 600;
    color: #60a5fa;
  }

  .valve-pressure {
    font-weight: 700;
    color: #fbbf24;
  }

  .pressure-slider {
    width: 100%;
    height: 6px;
    background: rgba(51, 65, 85, 0.8);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .pressure-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #fff;
  }

  .pressure-slider:disabled {
    opacity: 0.5;
  }

  .valve-range {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.5rem;
  }

  .target-pressure {
    color: #10b981;
    font-weight: 600;
  }

  .anomaly-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .anomaly-item {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 10px;
    padding: 0.75rem;
  }

  .anomaly-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .anomaly-icon {
    font-size: 1.25rem;
  }

  .anomaly-title {
    font-weight: 600;
    color: #fca5a5;
  }

  .anomaly-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .anomaly-timer {
    height: 4px;
    background: rgba(239, 68, 68, 0.2);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .anomaly-progress {
    height: 100%;
    background: #ef4444;
    transition: width 0.3s;
  }

  .resolve-btn {
    width: 100%;
    padding: 0.5rem;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #ef4444;
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .resolve-btn:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.3);
  }

  .resolve-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .capsule-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 8px;
  }

  .stat-label {
    color: #94a3b8;
  }

  .stat-count {
    font-weight: 700;
    color: #f1f5f9;
  }

  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .queue-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .queue-cargo {
    flex: 1;
    color: #e2e8f0;
  }

  .queue-time {
    color: #fbbf24;
    font-weight: 600;
  }

  .result-card {
    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
    border: 2px solid #334155;
    border-radius: 20px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .result-header {
    padding: 2rem;
    text-align: center;
    border-bottom: 1px solid #334155;
  }

  .result-header.victory {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, transparent 100%);
    border-bottom-color: #10b981;
  }

  .result-header.defeat {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, transparent 100%);
    border-bottom-color: #ef4444;
  }

  .result-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .result-header h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #f1f5f9;
  }

  .result-rating {
    display: inline-block;
    width: 60px;
    height: 60px;
    line-height: 60px;
    border-radius: 50%;
    font-size: 2rem;
    font-weight: 800;
    color: white;
  }

  .result-rating.S { background: linear-gradient(135deg, #a855f7, #7c3aed); }
  .result-rating.A { background: linear-gradient(135deg, #10b981, #059669); }
  .result-rating.B { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  .result-rating.C { background: linear-gradient(135deg, #f59e0b, #d97706); }
  .result-rating.D { background: linear-gradient(135deg, #f97316, #ea580c); }
  .result-rating.F { background: linear-gradient(135deg, #ef4444, #dc2626); }

  .result-body {
    padding: 2rem;
  }

  .score-comparison {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 12px;
  }

  .score-item {
    text-align: center;
  }

  .score-item.verified {
    padding: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
  }

  .score-label {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 0.25rem;
  }

  .score-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: #fbbf24;
  }

  .score-arrow {
    font-size: 1.5rem;
    color: #64748b;
  }

  .score-diff {
    font-weight: 700;
    font-size: 1.25rem;
  }

  .score-diff.positive { color: #10b981; }
  .score-diff.negative { color: #ef4444; }

  .score-breakdown h4 {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #f1f5f9;
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .result-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .stat-item {
    text-align: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 10px;
  }

  .stat-icon {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .stat-text {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .stat-num {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .result-actions {
    display: flex;
    gap: 1rem;
    padding: 0 2rem 2rem;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    padding: 1rem;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
    font-size: 1rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
  }

  .btn-secondary {
    background: rgba(51, 65, 85, 0.5);
    color: #e2e8f0;
    border: 1px solid #475569;
  }

  .btn-primary:hover,
  .btn-secondary:hover {
    transform: translateY(-2px);
  }

  .text-yellow-400 { color: #facc15; }
  .text-red-400 { color: #f87171; }
  .text-green-400 { color: #4ade80; }

  @media (max-width: 1024px) {
    .game-layout {
      grid-template-columns: 1fr;
    }
    
    .game-hud {
      grid-template-columns: 1fr;
      text-align: center;
    }
    
    .hud-left,
    .hud-right {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
</style>
