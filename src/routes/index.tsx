import { A, useNavigate } from "@solidjs/router";
import { For, createEffect, createSignal } from "solid-js";
import { getPlayerProfile } from "~/utils/storage";
import { levels } from "~/data/levels";

export default function Home() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = createSignal("");

  createEffect(() => {
    const profile = getPlayerProfile();
    setPlayerName(profile.name);
  });

  return (
    <div class="home-page">
      <div class="hero-section">
        <h1 class="game-title">🌊 水下考古网格定位游戏</h1>
        <p class="subtitle">Underwater Archaeology Grid Positioning Game</p>
      </div>

      <div class="welcome-card">
        <h2>欢迎回来，{playerName()}！</h2>
        <p>使用声呐探测海底网格，定位并发掘珍贵的古代文物。</p>
      </div>

      <div class="level-selection">
        <h2>选择关卡</h2>
        <div class="level-grid">
          <For each={levels}>
            {(level) => (
              <div class="level-card">
                <div class="level-header">
                  <h3>{level.name}</h3>
                  <span class="difficulty">
                    {level.turbidity < 30 ? "⭐ 简单" : level.turbidity < 60 ? "⭐⭐ 中等" : "⭐⭐⭐ 困难"}
                  </span>
                </div>
                <p class="level-desc">{level.description}</p>
                <div class="level-info">
                  <span>网格: {level.gridSize}×{level.gridSize}</span>
                  <span>潜次: {level.maxDives}</span>
                  <span>遗物: {level.relics.length}件</span>
                </div>
                <button
                  class="btn btn-primary"
                  onClick={() => navigate(`/game/${level.id}`)}
                >
                  开始探索
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="quick-links">
        <A href="/profile" class="btn btn-secondary">
          👤 玩家档案
        </A>
        <A href="/leaderboard" class="btn btn-secondary">
          🏆 排行榜
        </A>
      </div>

      <div class="game-intro">
        <h2>游戏玩法</h2>
        <div class="intro-cards">
          <div class="intro-card">
            <div class="intro-icon">📡</div>
            <h3>声呐探测</h3>
            <p>使用声呐扫描网格，信号越强表示附近越可能有遗物。</p>
          </div>
          <div class="intro-card">
            <div class="intro-icon">🧭</div>
            <h3>绳网坐标</h3>
            <p>网格以字母和数字标记，如 A1、B3，精确定位每个位置。</p>
          </div>
          <div class="intro-card">
            <div class="intro-icon">🌫️</div>
            <h3>浑浊度</h3>
            <p>浑浊度越高，声呐信号越不稳定，需要更多扫描来确认。</p>
          </div>
          <div class="intro-card">
            <div class="intro-icon">📿</div>
            <h3>遗物发掘</h3>
            <p>定位后进行发掘，完整挖出整个遗物才能获得分数。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
