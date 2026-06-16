<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { Player } from '$types';

  let player: Player | null = null;
  let showSetup = false;
  let playerName = '';

  onMount(async () => {
    await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    
    const res = await fetch('/api/player');
    const data = await res.json();
    player = data.player;
    if (!player) {
      showSetup = true;
    }
  });

  async function createPlayer() {
    if (!playerName.trim()) return;
    
    const res = await fetch('/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName.trim() })
    });
    
    const data = await res.json();
    if (data.player) {
      player = data.player;
      showSetup = false;
    }
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('zh-CN');
  }
</script>

<div class="app-container">
  {#if showSetup}
    <div class="setup-overlay">
      <div class="setup-card">
        <h1>🚇 城市地下物流管道调压游戏</h1>
        <p class="subtitle">欢迎成为物流调度员！</p>
        <p class="description">
          你将负责管理城市地下物流管道系统，通过调节阀门气压、控制分拣节点，
          将胶囊包裹准时送到目的地。注意应对管道异常，确保物流畅通！
        </p>
        <div class="input-group">
          <label for="playerName">请输入你的调度员代号：</label>
          <input
            id="playerName"
            type="text"
            bind:value={playerName}
            placeholder="例如：管道大师"
            maxlength={20}
            on:keydown={(e) => e.key === 'Enter' && createPlayer()}
          />
        </div>
        <button class="btn-primary" on:click={createPlayer} disabled={!playerName.trim()}>
          开始职业生涯
        </button>
      </div>
    </div>
  {/if}

  <header class="app-header">
    <div class="logo">
      <span class="logo-icon">🚇</span>
      <span class="logo-text">ULogistics</span>
    </div>
    <nav class="nav-links">
      <a href="/" class:current={$page.url.pathname === '/'}>首页</a>
      <a href="/levels" class:current={$page.url.pathname === '/levels'}>关卡</a>
      <a href="/history" class:current={$page.url.pathname === '/history'}>记录</a>
      {#if player}
        <div class="player-info">
          <span class="player-name">{player.name}</span>
          <span class="player-score">🏆 {player.totalScore}</span>
        </div>
      {/if}
    </nav>
  </header>

  <main class="app-main">
    <slot />
  </main>

  <footer class="app-footer">
    <p>城市地下物流管道调压游戏 v1.0 | 调节气压 · 精准分拣 · 准时送达</p>
  </footer>
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: #e2e8f0;
  }

  .setup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .setup-card {
    background: linear-gradient(145deg, #1e3a5f 0%, #0f172a 100%);
    padding: 3rem;
    border-radius: 20px;
    max-width: 500px;
    text-align: center;
    border: 2px solid #3b82f6;
    box-shadow: 0 0 60px rgba(59, 130, 246, 0.3);
  }

  .setup-card h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #60a5fa;
  }

  .subtitle {
    color: #94a3b8;
    margin-bottom: 1.5rem;
  }

  .description {
    color: #cbd5e1;
    line-height: 1.8;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .input-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }

  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #94a3b8;
  }

  .input-group input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid #334155;
    border-radius: 10px;
    color: #f1f5f9;
    font-size: 1rem;
    transition: border-color 0.3s;
  }

  .input-group input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .btn-primary {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .app-header {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #334155;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-icon {
    font-size: 1.75rem;
  }

  .logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    align-items: center;
  }

  .nav-links a {
    color: #94a3b8;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
  }

  .nav-links a:hover {
    color: #f1f5f9;
  }

  .nav-links a.current {
    color: #60a5fa;
    border-bottom-color: #60a5fa;
  }

  .player-info {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 1px solid #334155;
  }

  .player-name {
    color: #f1f5f9;
    font-weight: 600;
  }

  .player-score {
    color: #fbbf24;
    font-weight: 600;
  }

  .app-main {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .app-footer {
    text-align: center;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.9);
    border-top: 1px solid #334155;
    color: #64748b;
    font-size: 0.9rem;
  }
</style>
