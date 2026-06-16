import { component$, Slot } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { readGameData, initializeDefaultData } from "~/lib/server/db";

export const useAppData = routeLoader$(() => {
  initializeDefaultData();
  const data = readGameData();
  const demoPlayer = data.players.find((p) => p.id === "player_demo");
  return {
    player: demoPlayer || null,
    totalLevels: data.levels.length,
  };
});

export default component$(() => {
  const appData = useAppData();

  return (
    <div class="app-layout">
      <header class="app-header">
        <div class="header-content">
          <Link href="/" class="logo">
            <span class="logo-icon">🎹</span>
            <span class="logo-text">管风琴音栓记忆</span>
          </Link>
          <nav class="nav-links">
            <Link href="/" class="nav-link">首页</Link>
            <Link href="/levels" class="nav-link">关卡</Link>
            <Link href="/wrong-answers" class="nav-link">错题本</Link>
            <Link href="/history" class="nav-link">战绩</Link>
          </nav>
          {appData.value.player && (
            <div class="player-info">
              <span class="player-name">{appData.value.player.name}</span>
              <span class="player-score">⭐ {appData.value.player.totalScore}</span>
            </div>
          )}
        </div>
      </header>
      <main class="app-main">
        <Slot />
      </main>
      <footer class="app-footer">
        <p>管风琴音栓组合记忆游戏 - 训练你的耳朵和记忆力</p>
      </footer>
    </div>
  );
});
