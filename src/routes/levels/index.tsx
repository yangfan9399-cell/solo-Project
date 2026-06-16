import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { readGameData, initializeDefaultData } from "~/lib/server/db";

export const useLevelsData = routeLoader$(() => {
  initializeDefaultData();
  const data = readGameData();
  const player = data.players.find((p) => p.id === "player_demo");
  return {
    levels: data.levels,
    player,
  };
});

export default component$(() => {
  const levelsData = useLevelsData();
  const { levels, player } = levelsData.value;

  const difficultyColors: Record<number, string> = {
    1: "#4ade80",
    2: "#22d3ee",
    3: "#fbbf24",
    4: "#f97316",
    5: "#ef4444",
  };

  const difficultyLabels: Record<number, string> = {
    1: "入门",
    2: "简单",
    3: "中等",
    4: "困难",
    5: "大师",
  };

  return (
    <div class="levels-page container">
      <div class="page-header">
        <h1 class="page-title">关卡选择</h1>
        <p class="page-subtitle">选择一个关卡开始你的管风琴音栓记忆训练</p>
      </div>

      <div class="levels-grid">
        {levels.map((level) => {
        const isLocked = player ? player.highestLevel < level.id : false;
        return (
          <div key={level.id} class={`level-card-large card ${isLocked ? "locked" : ""}`}>
            <div class="level-card-header">
              <div class="level-number-badge">
              {level.id}
              </div>
              <span
                class="difficulty-tag"
                style={{
                  background: difficultyColors[level.difficulty] + "20",
                  color: difficultyColors[level.difficulty],
                }}
              >
                {difficultyLabels[level.difficulty]}
              </span>
            </div>

            <h2 class="level-card-name">{level.name}</h2>
            <p class="level-card-desc">{level.description}</p>

            <div class="level-stats">
              <div class="stat-item">
              <span class="stat-label">难度</span>
              <span class="stat-value" style={{ color: difficultyColors[level.difficulty] }}>
                {"★".repeat(level.difficulty)}
              </span>
              </div>
              <div class="stat-item">
              <span class="stat-label">组合数</span>
              <span class="stat-value">{level.targetCombinations.length}</span>
              </div>
              <div class="stat-item">
              <span class="stat-label">通关分</span>
              <span class="stat-value">{level.passingScore}%</span>
              </div>
              {level.timeLimit && (
                <div class="stat-item">
                <span class="stat-label">时限</span>
                <span class="stat-value">{level.timeLimit}s</span>
                </div>
              )}
            </div>

            <div class="star-thresholds">
              <div class="threshold">
              <span class="threshold-label">⭐ 一星</span>
              <span class="threshold-value">{level.passingScore}%+</span>
              </div>
              <div class="threshold">
              <span class="threshold-label">⭐⭐ 二星</span>
              <span class="threshold-value">{level.stars.twoStar}%+</span>
              </div>
              <div class="threshold">
              <span class="threshold-label">⭐⭐⭐ 三星</span>
              <span class="threshold-value">{level.stars.threeStar}%+</span>
              </div>
            </div>

            {isLocked ? (
              <div class="locked-info">
              <span class="lock-icon">🔒</span>
              <span>通过上一关解锁</span>
              </div>
            ) : (
              <Link href={`/play/${level.id}`} class="btn btn-primary btn-full">
              开始挑战
              </Link>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
});
