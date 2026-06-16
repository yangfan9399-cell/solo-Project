import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { readGameData, initializeDefaultData, getStreakDays, getSessionsByPlayer } from "~/lib/server/db";

export const useHomeData = routeLoader$(() => {
  initializeDefaultData();
  const data = readGameData();
  const player = data.players.find((p) => p.id === "player_demo");

  let streak = { current: 0, best: 0, dates: [] as string[] };
  let recentSessions: any[] = [];

  if (player) {
    streak = getStreakDays(player.id);
    recentSessions = getSessionsByPlayer(player.id).slice(0, 5);
  }

  return {
    levels: data.levels,
    player,
    streak,
    recentSessions,
    totalLevels: data.levels.length,
  };
});

export default component$(() => {
  const homeData = useHomeData();
  const { levels, player, streak, recentSessions, totalLevels } = homeData.value;

  const difficultyColors: Record<number, string> = {
    1: "#4ade80",
    2: "#22d3ee",
    3: "#fbbf24",
    4: "#f97316",
    5: "#ef4444",
  };

  return (
    <div class="home-page container">
      <section class="hero card">
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="hero-icon">🎵</span>
            管风琴音栓记忆游戏
          </h1>
          <p class="hero-subtitle">
            通过听音辨色，记忆管风琴音栓的组合，训练你的音乐耳朵和记忆力
          </p>
          <div class="hero-actions">
            <Link href="/levels" class="btn btn-primary btn-lg">
              开始游戏
            </Link>
            <Link href="/levels" class="btn btn-outline btn-lg">
              选择关卡
            </Link>
          </div>
        </div>
        <div class="hero-visual">
          <div class="organ-preview">
            {["principal-8", "flute-8", "oboe-8", "mixture-iii"].map((stopId, i) => {
              return (
                <div
                  key={stopId}
                  class={`pipe-visual pipe-${i + 1}`}
                  style={{
                    height: `${100 + i * 20}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                ></div>
              );
            })}
          </div>
        </div>
      </section>

      <div class="stats-grid grid grid-4">
        <div class="stat-card card">
          <div class="stat-value">{totalLevels}</div>
          <div class="stat-label">关卡总数</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{streak.current}</div>
          <div class="stat-label">当前连胜</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{streak.best}</div>
          <div class="stat-label">最佳连胜</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{player?.totalScore || 0}</div>
          <div class="stat-label">累计积分</div>
        </div>
      </div>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">选择关卡</h2>
          <Link href="/levels" class="section-link">查看全部 →</Link>
        </div>
        <div class="level-cards grid grid-3">
          {levels.slice(0, 3).map((level) => (
            <Link
              key={level.id}
              href={`/play/${level.id}`}
              class={`level-card card ${player && player.highestLevel < level.id ? "locked" : ""}`}
            >
              <div class="level-header">
                <span class="level-number">第 {level.id} 关</span>
                <span
                  class="difficulty-badge"
                  style={{ background: difficultyColors[level.difficulty] }}
                >
                  {"★".repeat(level.difficulty)}
                </span>
              </div>
              <h3 class="level-name">{level.name}</h3>
              <p class="level-desc">{level.description}</p>
              <div class="level-meta">
                <span>{level.targetCombinations.length} 种组合</span>
                <span>通关 {level.passingScore}%</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2 class="section-title">游戏玩法</h2>
        </div>
        <div class="how-to-play grid grid-3">
          <div class="step-card card">
            <div class="step-icon">👂</div>
            <h3>1. 听辨音色</h3>
            <p>播放目标音栓组合的音色，仔细聆听其特点</p>
          </div>
          <div class="step-card card">
            <div class="step-icon">🎛️</div>
            <h3>2. 选择音栓</h3>
            <p>根据记忆，在音栓面板上选择你认为正确的组合</p>
          </div>
          <div class="step-card card">
            <div class="step-icon">✅</div>
            <h3>3. 验证得分</h3>
            <p>提交答案，系统计算得分，错误会记录到错题本</p>
          </div>
        </div>
      </section>

      {recentSessions.length > 0 && (
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">最近战绩</h2>
          </div>
          <div class="recent-games card">
            {recentSessions.map((session) => {
              const level = levels.find((l) => l.id === session.levelId);
              const percentage = session.maxScore > 0 ? Math.round((session.score / session.maxScore) * 100) : 0;
              return (
                <div key={session.id} class="recent-game-item">
                  <div class="game-info">
                    <span class="game-level">第 {session.levelId} 关</span>
                    <span class="game-name">{level?.name || "未知"}</span>
                  </div>
                  <div class="game-score">
                    <span class={`score-badge ${session.status === "completed" ? "pass" : "fail"}`}>
                      {session.status === "completed" ? "通关" : "失败"}
                    </span>
                    <span class="score-text">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
});
