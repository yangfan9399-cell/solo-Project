<script lang="ts">
  import { onMount } from 'svelte';
  import type { Player, GameResult, Level } from '$types';
  import { getPlayer, getGameHistory, getLevels } from '$lib/storage';
  import { seedLevels } from '$lib/seedData';

  let player: Player | null = null;
  let history: GameResult[] = [];
  let levels: Level[] = [];
  let stats = {
    totalGames: 0,
    winRate: 0,
    avgScore: 0,
    bestRating: '-'
  };

  onMount(async () => {
    player = getPlayer();
    
    const historyRes = await fetch('/api/history?limit=5');
    const historyData = await historyRes.json();
    history = historyData.history || [];

    const levelsRes = await fetch('/api/levels');
    const levelsData = await levelsRes.json();
    levels = levelsData.levels || seedLevels;

    if (player && history.length > 0) {
      stats.totalGames = player.gamesPlayed;
      stats.winRate = player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0;
      stats.avgScore = player.gamesPlayed > 0 ? Math.round(player.totalScore / player.gamesPlayed) : 0;
      
      const ratings = ['S', 'A', 'B', 'C', 'D', 'F'];
      const bestResult = history.find(h => h.victory);
      if (bestResult) {
        stats.bestRating = bestResult.rating;
      }
    }
  });

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  function getDifficultyBg(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 border-green-500/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'hard': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
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

<div class="home-page">
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="gradient-text">城市地下物流</span>
        <br />
        <span class="hero-subtitle">管道调压游戏</span>
      </h1>
      <p class="hero-desc">
        操纵复杂的地下管道网络，调节气压阀门，控制分拣节点，
        将胶囊包裹准时送达目的地。你准备好成为最优秀的物流调度员了吗？
      </p>
      <div class="hero-actions">
        <a href="/levels" class="btn btn-primary">
          🎮 开始游戏
        </a>
        <a href="/history" class="btn btn-secondary">
          📊 查看记录
        </a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="pipe-animation">
        <div class="pipe main-pipe"></div>
        <div class="capsule capsule-1">📦</div>
        <div class="capsule capsule-2">💊</div>
        <div class="valve valve-1">🔧</div>
        <div class="junction junction-1">🔀</div>
      </div>
    </div>
  </section>

  {#if player}
    <section class="stats-section">
      <h2 class="section-title">📈 调度员档案</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{player.totalScore.toLocaleString()}</div>
          <div class="stat-label">总积分</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{stats.totalGames}</div>
          <div class="stat-label">游戏场次</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{stats.winRate}%</div>
          <div class="stat-label">通关率</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value {getRatingColor(stats.bestRating)}">{stats.bestRating}</div>
          <div class="stat-label">最佳评级</div>
        </div>
      </div>
    </section>
  {/if}

  <section class="levels-preview">
    <h2 class="section-title">🗺️ 关卡预览</h2>
    <div class="levels-grid">
      {#each levels as level}
        <div class="level-card {getDifficultyBg(level.difficulty)}">
          <div class="level-header">
            <span class="level-id">关卡 {level.id}</span>
            <span class="level-difficulty {getDifficultyColor(level.difficulty)}">
              {level.difficulty === 'easy' ? '简单' : level.difficulty === 'medium' ? '中等' : '困难'}
            </span>
          </div>
          <h3 class="level-name">{level.name}</h3>
          <p class="level-desc">{level.description}</p>
          <div class="level-stats">
            <span>⏱️ {level.timeLimit}秒</span>
            <span>📦 {level.targetDeliveries}个包裹</span>
            <span>🎯 {level.minScore}分</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  {#if history.length > 0}
    <section class="recent-games">
      <h2 class="section-title">🕒 最近游戏</h2>
      <div class="games-list">
        {#each history as game}
          <div class="game-item">
            <div class="game-info">
              <span class="game-level">关卡 {game.levelId}</span>
              <span class="game-date">{formatDate(game.completedAt)}</span>
            </div>
            <div class="game-result">
              <span class="game-rating {getRatingColor(game.rating)}">{game.rating}</span>
              <span class="game-score">{game.recalculatedScore}分</span>
              <span class="game-victory {game.victory ? 'text-green-400' : 'text-red-400'}">
                {game.victory ? '✓ 通关' : '✗ 失败'}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section class="features">
    <h2 class="section-title">🎮 游戏特色</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🌡️</div>
        <h3>气压调节</h3>
        <p>精确控制每个阀门的气压，决定胶囊包裹的运行速度。压力太高或太低都会影响效率！</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔀</div>
        <h3>分拣控制</h3>
        <p>在关键节点切换分拣方向，将包裹送往正确的目的地。稍不留神就会送错地方！</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💊</div>
        <h3>胶囊物流</h3>
        <p>监控每个胶囊包裹的实时状态，优先处理紧急物资，确保准时送达。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚠️</div>
        <h3>异常处理</h3>
        <p>应对管道泄漏、压力骤升、设备故障等突发情况，考验你的应急反应能力！</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⏪</div>
        <h3>操作回溯</h3>
        <p>每一步操作都被记录，可以随时撤销错误操作，或者回放整场游戏分析得失。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🏆</div>
        <h3>后端计分</h3>
        <p>最终分数由后端根据完整操作历史重新计算，确保公平公正，杜绝作弊！</p>
      </div>
    </div>
  </section>
</div>

<style>
  .home-page {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
    padding: 2rem 0;
  }

  .hero-title {
    font-size: 3rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 1rem;
  }

  .gradient-text {
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: 2rem;
    color: #f1f5f9;
  }

  .hero-desc {
    color: #94a3b8;
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 2rem;
  }

  .hero-actions {
    display: flex;
    gap: 1rem;
  }

  .btn {
    padding: 0.875rem 1.75rem;
    border-radius: 10px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: rgba(51, 65, 85, 0.5);
    color: #e2e8f0;
    border: 1px solid #475569;
  }

  .btn-secondary:hover {
    background: rgba(51, 65, 85, 0.8);
    border-color: #60a5fa;
  }

  .hero-visual {
    position: relative;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pipe-animation {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .main-pipe {
    position: absolute;
    top: 50%;
    left: 10%;
    right: 10%;
    height: 20px;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
    border-radius: 10px;
    transform: translateY(-50%);
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
  }

  .capsule {
    position: absolute;
    font-size: 2rem;
    animation: moveCapsule 4s linear infinite;
  }

  .capsule-1 {
    animation-delay: 0s;
  }

  .capsule-2 {
    animation-delay: 2s;
  }

  @keyframes moveCapsule {
    0% { left: 10%; top: 50%; transform: translate(-50%, -50%); }
    100% { left: 90%; top: 50%; transform: translate(-50%, -50%); }
  }

  .valve {
    position: absolute;
    font-size: 2.5rem;
    left: 30%;
    top: 35%;
    animation: pulse 2s ease-in-out infinite;
  }

  .junction {
    position: absolute;
    font-size: 2.5rem;
    right: 25%;
    top: 35%;
    animation: pulse 2s ease-in-out infinite 1s;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .section-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: #f1f5f9;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }

  .stat-card {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid #334155;
    border-radius: 15px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    border-color: #3b82f6;
  }

  .stat-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .levels-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .level-card {
    border-radius: 15px;
    padding: 1.5rem;
    border: 1px solid;
    transition: all 0.3s;
  }

  .level-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .level-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .level-id {
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .level-difficulty {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.3);
  }

  .level-name {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #f1f5f9;
  }

  .level-desc {
    color: #94a3b8;
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .level-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #64748b;
  }

  .games-list {
    background: rgba(30, 41, 59, 0.8);
    border-radius: 15px;
    border: 1px solid #334155;
    overflow: hidden;
  }

  .game-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #334155;
    transition: background 0.2s;
  }

  .game-item:last-child {
    border-bottom: none;
  }

  .game-item:hover {
    background: rgba(51, 65, 85, 0.5);
  }

  .game-info {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .game-level {
    font-weight: 600;
    color: #60a5fa;
  }

  .game-date {
    color: #64748b;
    font-size: 0.9rem;
  }

  .game-result {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .game-rating {
    font-size: 1.5rem;
    font-weight: 800;
  }

  .game-score {
    font-weight: 600;
    color: #fbbf24;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .feature-card {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid #334155;
    border-radius: 15px;
    padding: 1.75rem;
    transition: all 0.3s;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    border-color: #a78bfa;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: #f1f5f9;
  }

  .feature-card p {
    color: #94a3b8;
    line-height: 1.7;
    font-size: 0.95rem;
  }

  .text-green-400 { color: #4ade80; }
  .text-yellow-400 { color: #facc15; }
  .text-red-400 { color: #f87171; }
  .text-purple-400 { color: #c084fc; }
  .text-blue-400 { color: #60a5fa; }
  .text-orange-400 { color: #fb923c; }
  .text-gray-400 { color: #9ca3af; }

  @media (max-width: 1024px) {
    .hero {
      grid-template-columns: 1fr;
    }
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .levels-grid,
    .features-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
