import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { routeLoader$, useNavigate, Link } from "@builder.io/qwik-city";
import { getSession, readGameData, initializeDefaultData } from "~/lib/server/db";
import { calculateSessionFinalScore } from "~/lib/server/scoring";

export const useResultData = routeLoader$(({ params }) => {
  initializeDefaultData();
  const sessionId = params.sessionId;
  const session = getSession(sessionId);
  const data = readGameData();
  const level = data.levels.find((l) => l.id === session?.levelId);
  const player = data.players.find((p) => p.id === session?.playerId);

  if (!session || !level) {
    return {
      session: null,
      level: null,
      player: null,
      finalResult: null,
      error: "游戏记录不存在",
    };
  }

  const finalResult = session.status === "playing"
    ? calculateSessionFinalScore(session.rounds, level)
    : {
        totalScore: session.score,
        maxScore: session.maxScore,
        percentage: session.maxScore > 0 ? Math.round((session.score / session.maxScore) * 100) : 0,
        stars: session.stars || 0,
        passed: session.status === "completed",
        correctCount: session.correctCount,
        totalRounds: session.totalRounds,
      };

  return {
    session,
    level,
    player,
    finalResult,
    error: null,
  };
});

export default component$(() => {
  const resultData = useResultData();
  const nav = useNavigate();
  const { session, level, player, finalResult, error } = resultData.value;

  if (error || !session || !level || !finalResult) {
    return (
      <div class="result-page container">
        <div class="card error-card">
          <h2>记录不存在</h2>
          <p>找不到对应的游戏记录。</p>
          <Link href="/levels" class="btn btn-primary">返回关卡</Link>
        </div>
      </div>
    );
  }

  const stars = finalResult.stars;
  const passed = finalResult.passed;

  return (
    <div class="result-page container">
      <div class={`result-header card ${passed ? "pass" : "fail"}`}>
        <div class="result-badge">
          {passed ? "🎉 恭喜通关！" : "😔 挑战失败"}
        </div>
        <div class="stars-display">
          {[1, 2, 3].map((i) => (
            <span key={i} class={`star ${i <= stars ? "filled" : ""}`}>
              ⭐
            </span>
          ))}
        </div>
        <h1 class="result-title">
          第 {level.id} 关：{level.name}
        </h1>
      </div>

      <div class="score-breakdown card">
        <h2>得分详情</h2>
        <div class="score-overview">
          <div class="main-score">
            <span class="score-label">总得分</span>
            <span class="score-value">{finalResult.totalScore}</span>
            <span class="score-max">/ {finalResult.maxScore}</span>
          </div>
          <div class="score-percentage">
            <div class="percentage-ring" style={{ '--percentage': finalResult.percentage }}>
              <span>{finalResult.percentage}%</span>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">正确轮数</span>
            <span class="stat-value">{finalResult.correctCount} / {finalResult.totalRounds}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正确率</span>
            <span class="stat-value">{Math.round((finalResult.correctCount / finalResult.totalRounds) * 100)}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">难度</span>
            <span class="stat-value">{"★".repeat(level.difficulty)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">通关要求</span>
            <span class="stat-value">{level.passingScore}%</span>
          </div>
        </div>
      </div>

      <div class="rounds-detail card">
        <h2>每轮详情</h2>
        <div class="rounds-list">
          {session.rounds.map((round, idx) => (
            <div key={idx} class={`round-item ${round.isCorrect ? "correct" : "wrong"}`}>
              <div class="round-header">
                <span class="round-number">第 {round.roundNumber} 轮</span>
                <span class={`round-status ${round.isCorrect ? "correct" : "wrong"}`}>
                  {round.isCorrect ? "✓ 正确" : "✗ 错误"}
                </span>
              </div>
              <div class="round-info">
                <span>得分: {round.score} / {round.maxScore}</span>
                <span>用时: {round.timeTaken.toFixed(1)}s</span>
                {round.hintUsed && <span class="hint-badge">💡 使用提示</span>}
              </div>
              <div class="round-stops">
                <div class="stops-col">
                  <span class="col-label">正确:</span>
                  <div class="stop-tags">
                    {round.targetStops.map((s) => (
                      <span key={s} class="stop-tag correct-tag">{s}</span>
                    ))}
                  </div>
                </div>
                <div class="stops-col">
                  <span class="col-label">你的:</span>
                  <div class="stop-tags">
                    {round.playerStops.length === 0 ? (
                      <span class="stop-tag empty-tag">无</span>
                    ) : (
                      round.playerStops.map((s) => (
                        <span
                          key={s}
                          class={`stop-tag ${round.targetStops.includes(s) ? "correct-tag" : "wrong-tag"}`}
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {player && (
        <div class="player-progress card">
          <h2>我的进度</h2>
          <div class="progress-stats">
            <div class="progress-stat">
              <span class="ps-label">累计积分</span>
              <span class="ps-value">{player.totalScore}</span>
            </div>
            <div class="progress-stat">
              <span class="ps-label">当前连胜</span>
              <span class="ps-value">{player.currentStreak} 天</span>
            </div>
            <div class="progress-stat">
              <span class="ps-label">最佳连胜</span>
              <span class="ps-value">{player.bestStreak} 天</span>
            </div>
            <div class="progress-stat">
              <span class="ps-label">已解锁关卡</span>
              <span class="ps-value">{player.highestLevel} / 8</span>
            </div>
          </div>
        </div>
      )}

      <div class="action-buttons">
        <Link href={`/play/${level.id}`} class="btn btn-secondary">
          🔄 再玩一次
        </Link>
        <Link href="/levels" class="btn btn-outline">
          返回关卡
        </Link>
        {passed && level.id < 8 && (
          <Link href={`/play/${level.id + 1}`} class="btn btn-primary">
            下一关 →
          </Link>
        )}
      </div>
    </div>
  );
});
