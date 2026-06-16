<script lang="ts">
  import { onMount } from 'svelte';
  import type { Level, GameResult } from '$types';
  import { seedLevels } from '$lib/seedData';

  let levels: Level[] = [];
  let history: GameResult[] = [];
  let loading = true;

  onMount(async () => {
    const [levelsRes, historyRes] = await Promise.all([
      fetch('/api/levels'),
      fetch('/api/history')
    ]);
    
    const levelsData = await levelsRes.json();
    const historyData = await historyRes.json();
    
    levels = levelsData.levels || seedLevels;
    history = historyData.history || [];
    loading = false;
  });

  function getBestScore(levelId: number): number | null {
    const levelGames = history.filter(h => h.levelId === levelId && h.victory);
    if (levelGames.length === 0) return null;
    return Math.max(...levelGames.map(g => g.recalculatedScore));
  }

  function getBestRating(levelId: number): string | null {
    const levelGames = history.filter(h => h.levelId === levelId && h.victory);
    if (levelGames.length === 0) return null;
    const ratings = ['S', 'A', 'B', 'C', 'D', 'F'];
    return levelGames.reduce((best, g) => 
      ratings.indexOf(g.rating) < ratings.indexOf(best) ? g.rating : best, 'F'
    );
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

  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/40';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  }

  function getRatingColor(rating: string): string {
    switch (rating) {
      case 'S': return 'text-purple-400';
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }
</script>

<div class="levels-page">
  <div class="page-header">
    <h1 class="page-title">🗺️ 关卡选择</h1>
    <p class="page-desc">选择一个关卡开始你的物流调度之旅</p>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else}
    <div class="levels-list">
      {#each levels as level}
        <div class="level-card-large">
          <div class="level-card-header">
            <div class="level-number">
              <span class="level-num">{level.id}</span>
            </div>
            <div class="level-badge {getDifficultyColor(level.difficulty)}">
              {level.difficulty === 'easy' ? '简单' : level.difficulty === 'medium' ? '中等' : '困难'}
            </div>
          </div>
          
          <div class="level-card-body">
            <h2 class="level-title">{level.name}</h2>
            <p class="level-description">{level.description}</p>
            
            <div class="level-objectives">
              <div class="objective">
                <span class="obj-icon">🎯</span>
                <span class="obj-label">目标送达</span>
                <span class="obj-value">{level.targetDeliveries} 个包裹</span>
              </div>
              <div class="objective">
                <span class="obj-icon">⏱️</span>
                <span class="obj-label">时间限制</span>
                <span class="obj-value">{level.timeLimit} 秒</span>
              </div>
              <div class="objective">
                <span class="obj-icon">🏆</span>
                <span class="obj-label">最低分数</span>
                <span class="obj-value">{level.minScore} 分</span>
              </div>
            </div>

            <div class="level-components">
              <div class="component">
                <span class="comp-icon">🔧</span>
                <span>{level.valves.length} 阀门</span>
              </div>
              <div class="component">
                <span class="comp-icon">🔀</span>
                <span>{level.junctions.length} 节点</span>
              </div>
              <div class="component">
                <span class="comp-icon">📍</span>
                <span>{level.stations.length} 站点</span>
              </div>
              <div class="component">
                <span class="comp-icon">⚠️</span>
                <span>{level.anomalies.length} 异常</span>
              </div>
            </div>

            {#if getBestScore(level.id)}
              <div class="level-best">
                <div class="best-item">
                  <span class="best-label">最高分</span>
                  <span class="best-value text-yellow-400">{getBestScore(level.id)} 分</span>
                </div>
                <div class="best-item">
                  <span class="best-label">最佳评级</span>
                  <span class="best-value {getRatingColor(getBestRating(level.id) || '')}">{getBestRating(level.id)}</span>
                </div>
              </div>
            {/if}
          </div>

          <div class="level-card-footer">
            <button class="btn-start" on:click={() => startLevel(level.id)}>
              {#if getBestScore(level.id)}
                🔄 再次挑战
              {:else}
                🚀 开始挑战
              {/if}
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .levels-page {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    text-align: center;
    margin-bottom: 3rem;
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

  .loading {
    text-align: center;
    padding: 4rem;
    font-size: 1.2rem;
    color: #94a3b8;
  }

  .levels-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
  }

  .level-card-large {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid #334155;
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
  }

  .level-card-large:hover {
    transform: translateY(-8px);
    border-color: #3b82f6;
    box-shadow: 0 20px 60px rgba(59, 130, 246, 0.2);
  }

  .level-card-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #334155;
  }

  .level-number {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .level-num {
    font-size: 1.5rem;
    font-weight: 800;
    color: white;
  }

  .level-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid;
  }

  .level-card-body {
    padding: 1.5rem;
    flex: 1;
  }

  .level-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    color: #f1f5f9;
  }

  .level-description {
    color: #94a3b8;
    line-height: 1.7;
    margin-bottom: 1.5rem;
    min-height: 60px;
  }

  .level-objectives {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .objective {
    text-align: center;
    padding: 0.75rem;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 10px;
  }

  .obj-icon {
    display: block;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .obj-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .obj-value {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: #e2e8f0;
  }

  .level-components {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .component {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(51, 65, 85, 0.5);
    border-radius: 8px;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .comp-icon {
    font-size: 1rem;
  }

  .level-best {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed #334155;
  }

  .best-item {
    flex: 1;
    text-align: center;
  }

  .best-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .best-value {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .level-card-footer {
    padding: 1rem 1.5rem 1.5rem;
  }

  .btn-start {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-start:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
  }

  .text-yellow-400 { color: #facc15; }
  .text-purple-400 { color: #c084fc; }
  .text-green-400 { color: #4ade80; }
  .text-blue-400 { color: #60a5fa; }
  .text-orange-400 { color: #fb923c; }
  .text-red-400 { color: #f87171; }
</style>
