<script lang="ts">
  import { onMount } from 'svelte';
  import type { GameResult } from '$types';

  let history: GameResult[] = [];
  let loading = true;
  let filter = 'all';
  let sortBy = 'date';

  onMount(async () => {
    await loadHistory();
  });

  async function loadHistory() {
    loading = true;
    let url = '/api/history';
    if (filter === 'victory') {
      url += '?victory=true';
    }
    const res = await fetch(url);
    const data = await res.json();
    history = data.history || [];
    loading = false;
  }

  $: filteredAndSorted = history
    .filter(g => {
      if (filter === 'all') return true;
      if (filter === 'victory') return g.victory;
      if (filter === 'defeat') return !g.victory;
      return g.levelId === parseInt(filter, 10);
    })
    .sort((a, b) => {
      if (sortBy === 'date') return b.completedAt - a.completedAt;
      if (sortBy === 'score') return b.recalculatedScore - a.recalculatedScore;
      if (sortBy === 'rating') {
        const ratings = ['S', 'A', 'B', 'C', 'D', 'F'];
        return ratings.indexOf(a.rating) - ratings.indexOf(b.rating);
      }
      return 0;
    });

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getRatingColor(rating: string): string {
    switch (rating) {
      case 'S': return 'bg-purple-500 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-white';
      case 'D': return 'bg-orange-500 text-white';
      case 'F': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }

  async function viewReplay(gameId: string) {
    window.location.href = `/replay/${gameId}`;
  }

  let stats = { total: 0, victories: 0, totalScore: 0, avgScore: 0 };
  $: {
    stats = {
      total: history.length,
      victories: history.filter(g => g.victory).length,
      totalScore: history.reduce((sum, g) => sum + g.recalculatedScore, 0),
      avgScore: history.length > 0 ? Math.round(history.reduce((sum, g) => sum + g.recalculatedScore, 0) / history.length) : 0
    };
  }
</script>

<div class="history-page">
  <div class="page-header">
    <h1 class="page-title">📊 游戏记录</h1>
    <p class="page-desc">查看你的所有游戏历史和详细统计</p>
  </div>

  <div class="stats-overview">
    <div class="stat-box">
      <span class="stat-icon">🎮</span>
      <span class="stat-num">{stats.total}</span>
      <span class="stat-label">总场次</span>
    </div>
    <div class="stat-box">
      <span class="stat-icon">🏆</span>
      <span class="stat-num">{stats.victories}</span>
      <span class="stat-label">胜利</span>
    </div>
    <div class="stat-box">
      <span class="stat-icon">⭐</span>
      <span class="stat-num">{stats.totalScore.toLocaleString()}</span>
      <span class="stat-label">累计分数</span>
    </div>
    <div class="stat-box">
      <span class="stat-icon">📈</span>
      <span class="stat-num">{stats.avgScore}</span>
      <span class="stat-label">场均分数</span>
    </div>
  </div>

  <div class="filter-bar">
    <div class="filters">
      <span class="filter-label">筛选：</span>
      <button class={`filter-btn ${filter === 'all' ? 'active' : ''}`} on:click={() => filter = 'all'}>
        全部
      </button>
      <button class={`filter-btn ${filter === 'victory' ? 'active' : ''}`} on:click={() => filter = 'victory'}>
        ✓ 胜利
      </button>
      <button class={`filter-btn ${filter === 'defeat' ? 'active' : ''}`} on:click={() => filter = 'defeat'}>
        ✗ 失败
      </button>
      <button class={`filter-btn ${filter === '1' ? 'active' : ''}`} on:click={() => filter = '1'}>
        关卡1
      </button>
      <button class={`filter-btn ${filter === '2' ? 'active' : ''}`} on:click={() => filter = '2'}>
        关卡2
      </button>
      <button class={`filter-btn ${filter === '3' ? 'active' : ''}`} on:click={() => filter = '3'}>
        关卡3
      </button>
    </div>
    <div class="sorters">
      <span class="filter-label">排序：</span>
      <select bind:value={sortBy} class="sort-select">
        <option value="date">最新日期</option>
        <option value="score">最高分数</option>
        <option value="rating">最佳评级</option>
      </select>
    </div>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if filteredAndSorted.length === 0}
    <div class="empty-state">
      <span class="empty-icon">📭</span>
      <h3>暂无游戏记录</h3>
      <p>开始游戏后你的记录将显示在这里</p>
      <a href="/levels" class="btn-link">去挑战关卡 →</a>
    </div>
  {:else}
    <div class="history-table-container">
      <table class="history-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>关卡</th>
            <th>结果</th>
            <th>评级</th>
            <th>分数</th>
            <th>送达</th>
            <th>失败</th>
            <th>用时</th>
            <th>异常处理</th>
            <th>操作次数</th>
            <th>回放</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredAndSorted as game}
            <tr class="history-row">
              <td class="date-cell">{formatDate(game.completedAt)}</td>
              <td>
                <span class="level-badge">关卡 {game.levelId}</span>
              </td>
              <td>
                <span class={`result-badge ${game.victory ? 'victory' : 'defeat'}`}>
                  {game.victory ? '✓ 通关' : '✗ 失败'}
                </span>
              </td>
              <td>
                <span class={`rating-badge ${getRatingColor(game.rating)}`}>
                  {game.rating}
                </span>
              </td>
              <td class="score-cell">
                <div class="score-main">{game.recalculatedScore}</div>
                {#if game.recalculatedScore !== game.finalScore}
                  <div class="score-diff">
                    (前端: {game.finalScore})
                  </div>
                {/if}
              </td>
              <td class="text-center">{game.deliveriesCompleted}</td>
              <td class="text-center">{game.deliveriesFailed}</td>
              <td class="text-center">{formatDuration(game.timeUsed)}</td>
              <td class="text-center">{game.anomaliesResolved}</td>
              <td class="text-center">{game.operationsPerformed}</td>
              <td>
                <button class="replay-btn" on:click={() => viewReplay(game.gameId)}>
                  ▶ 回放
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .history-page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .page-desc {
    color: #94a3b8;
    font-size: 1.1rem;
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-box {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid #334155;
    border-radius: 15px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s;
  }

  .stat-box:hover {
    border-color: #3b82f6;
  }

  .stat-icon {
    display: block;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .stat-num {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: #f1f5f9;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    color: #64748b;
    font-size: 0.9rem;
  }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 12px;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filters,
  .sorters {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .filter-label {
    color: #94a3b8;
    font-size: 0.9rem;
    margin-right: 0.5rem;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    background: rgba(51, 65, 85, 0.5);
    border: 1px solid #475569;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    background: rgba(51, 65, 85, 0.8);
  }

  .filter-btn.active {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-color: #3b82f6;
  }

  .sort-select {
    padding: 0.5rem 1rem;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid #475569;
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .loading {
    text-align: center;
    padding: 4rem;
    font-size: 1.2rem;
    color: #94a3b8;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: rgba(30, 41, 59, 0.6);
    border-radius: 20px;
    border: 1px dashed #475569;
  }

  .empty-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    color: #f1f5f9;
    margin-bottom: 0.5rem;
  }

  .empty-state p {
    color: #94a3b8;
    margin-bottom: 1.5rem;
  }

  .btn-link {
    color: #60a5fa;
    text-decoration: none;
    font-weight: 600;
  }

  .btn-link:hover {
    text-decoration: underline;
  }

  .history-table-container {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid #334155;
    border-radius: 15px;
    overflow: hidden;
    overflow-x: auto;
  }

  .history-table {
    width: 100%;
    border-collapse: collapse;
  }

  .history-table th {
    padding: 1rem;
    text-align: left;
    background: rgba(15, 23, 42, 0.9);
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #334155;
  }

  .history-table td {
    padding: 1rem;
    border-bottom: 1px solid #334155;
    color: #e2e8f0;
  }

  .history-row:hover {
    background: rgba(51, 65, 85, 0.4);
  }

  .history-row:last-child td {
    border-bottom: none;
  }

  .date-cell {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .level-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .result-badge {
    display: inline-block;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .result-badge.victory {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }

  .result-badge.defeat {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }

  .rating-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 1.1rem;
  }

  .score-cell {
    min-width: 120px;
  }

  .score-main {
    font-weight: 700;
    color: #fbbf24;
    font-size: 1.1rem;
  }

  .score-diff {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .text-center {
    text-align: center;
  }

  .replay-btn {
    padding: 0.5rem 1rem;
    background: rgba(167, 139, 250, 0.2);
    color: #a78bfa;
    border: 1px solid rgba(167, 139, 250, 0.4);
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .replay-btn:hover {
    background: rgba(167, 139, 250, 0.3);
  }

  @media (max-width: 768px) {
    .stats-overview {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
