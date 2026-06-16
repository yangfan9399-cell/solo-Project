<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { GameResult, Level } from '$types';

  let gameResult: GameResult | null = null;
  let level: Level | null = null;
  let loading = true;

  onMount(async () => {
    const gameId = $page.params.gameId;
    
    const res = await fetch(`/api/replay/${gameId}`);
    const data = await res.json();
    
    if (data.error) {
      window.location.href = '/history';
      return;
    }
    
    gameResult = data.gameResult;
    level = data.level;
    loading = false;
  });

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  }

  function getRatingColor(rating: string): string {
    switch (rating) {
      case 'S': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'A': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'B': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'C': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'D': return 'bg-gradient-to-r from-orange-500 to-red-400';
      case 'F': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-gray-500';
    }
  }

  function getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  }

  function goBack() {
    window.location.href = '/history';
  }

  async function playAgain() {
    if (gameResult) {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: gameResult.levelId })
      });
      
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/game/${data.gameState.id}`;
      }
    }
  }
</script>

<div class="replay-page">
  {#if loading}
    <div class="loading-screen">
      <div class="loading-spinner"></div>
      <p>加载回放数据...</p>
    </div>
  {:else if gameResult && level}
    <div class="replay-container">
      <button class="back-btn" on:click={goBack}>← 返回记录</button>
      
      <div class="replay-header">
        <h1 class="replay-title">🎬 游戏回放</h1>
        <p class="replay-date">{formatDate(gameResult.completedAt)}</p>
      </div>

      <div class="replay-content">
        <div class="result-banner {gameResult.victory ? 'victory' : 'defeat'}">
          <div class="result-icon">{gameResult.victory ? '🎉' : '😢'}</div>
          <div class="result-text">
            <h2>{gameResult.victory ? '挑战成功！' : '挑战失败'}</h2>
            <p>{level.name} · {getDifficultyLabel(level.difficulty)}</p>
          </div>
          <div class={`rating-badge ${getRatingColor(gameResult.rating)}`}>
            {gameResult.rating}
          </div>
        </div>

        <div class="score-section">
          <h3>🏆 最终分数</h3>
          <div class="score-display">
            <div class="score-item">
              <span class="score-label">前端计算</span>
              <span class="score-value">{gameResult.finalScore}</span>
            </div>
            <div class="score-arrow">→</div>
            <div class="score-item verified">
              <span class="score-label">✅ 后端验证</span>
              <span class="score-value">{gameResult.recalculatedScore}</span>
            </div>
            {#if gameResult.recalculatedScore !== gameResult.finalScore}
              <div class="score-diff {gameResult.recalculatedScore > gameResult.finalScore ? 'positive' : 'negative'}">
                {gameResult.recalculatedScore > gameResult.finalScore ? '+' : ''}
                {gameResult.recalculatedScore - gameResult.finalScore}
              </div>
            {/if}
          </div>
          <p class="score-note">
            最终分数由后端根据完整操作历史重新计算，确保公平公正
          </p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">📦</span>
            <span class="stat-label">完成送达</span>
            <span class="stat-value">{gameResult.deliveriesCompleted}</span>
            <span class="stat-target">/ {level.targetDeliveries}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">❌</span>
            <span class="stat-label">配送失败</span>
            <span class="stat-value text-red-400">{gameResult.deliveriesFailed}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">⏱️</span>
            <span class="stat-label">用时</span>
            <span class="stat-value">{formatDuration(gameResult.timeUsed)}</span>
            <span class="stat-target">/ {formatDuration(level.timeLimit)}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🔧</span>
            <span class="stat-label">异常处理</span>
            <span class="stat-value text-green-400">{gameResult.anomaliesResolved}</span>
            <span class="stat-target">/ {level.anomalies.length}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🎮</span>
            <span class="stat-label">操作次数</span>
            <span class="stat-value">{gameResult.operationsPerformed}</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📊</span>
            <span class="stat-label">成功率</span>
            <span class="stat-value">
              {Math.round((gameResult.deliveriesCompleted / (gameResult.deliveriesCompleted + gameResult.deliveriesFailed)) * 100) || 0}%
            </span>
          </div>
        </div>

        <div class="level-info">
          <h3>🗺️ 关卡信息</h3>
          <div class="level-details">
            <p><strong>目标：</strong>{level.description}</p>
            <div class="level-components">
              <span>🔧 {level.valves.length} 阀门</span>
              <span>🔀 {level.junctions.length} 节点</span>
              <span>📍 {level.stations.length} 站点</span>
              <span>⚠️ {level.anomalies.length} 异常</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-secondary" on:click={goBack}>返回记录</button>
          <button class="btn-primary" on:click={playAgain}>🔄 再来一局</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .replay-page {
    min-height: 100vh;
    padding: 2rem;
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

  .replay-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .back-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: 2rem;
    padding: 0.5rem 0;
    transition: color 0.2s;
  }

  .back-btn:hover {
    color: #f1f5f9;
  }

  .replay-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .replay-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .replay-date {
    color: #64748b;
  }

  .replay-content {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 2rem;
  }

  .result-banner {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
    border-radius: 15px;
    margin-bottom: 2rem;
  }

  .result-banner.victory {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .result-banner.defeat {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .result-icon {
    font-size: 3rem;
  }

  .result-text h2 {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
    color: #f1f5f9;
  }

  .result-text p {
    color: #94a3b8;
  }

  .rating-badge {
    margin-left: auto;
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
  }

  .score-section {
    text-align: center;
    margin-bottom: 2rem;
    padding: 2rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 15px;
  }

  .score-section h3 {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
    color: #f1f5f9;
  }

  .score-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .score-item {
    text-align: center;
  }

  .score-item.verified {
    padding: 1rem 1.5rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 10px;
  }

  .score-label {
    display: block;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
  }

  .score-value {
    font-size: 2rem;
    font-weight: 800;
    color: #fbbf24;
  }

  .score-arrow {
    font-size: 1.5rem;
    color: #64748b;
  }

  .score-diff {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .score-diff.positive { color: #10b981; }
  .score-diff.negative { color: #ef4444; }

  .score-note {
    color: #64748b;
    font-size: 0.9rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    text-align: center;
    padding: 1.25rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 12px;
    border: 1px solid #334155;
  }

  .stat-icon {
    display: block;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .stat-target {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .level-info {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 12px;
  }

  .level-info h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #f1f5f9;
  }

  .level-details p {
    color: #94a3b8;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .level-components {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .level-components span {
    padding: 0.5rem 1rem;
    background: rgba(51, 65, 85, 0.5);
    border-radius: 20px;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .actions {
    display: flex;
    gap: 1rem;
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

  .text-red-400 { color: #f87171; }
  .text-green-400 { color: #4ade80; }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .result-banner {
      flex-direction: column;
      text-align: center;
    }
    
    .rating-badge {
      margin-left: 0;
    }
  }
</style>
