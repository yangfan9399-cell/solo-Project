import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { getWrongAnswersByPlayer, initializeDefaultData, readGameData } from "~/lib/server/db";

export const useWrongAnswersData = routeLoader$(() => {
  initializeDefaultData();
  const data = readGameData();
  const player = data.players.find((p) => p.id === "player_demo");

  let wrongAnswers: any[] = [];
  if (player) {
    wrongAnswers = getWrongAnswersByPlayer(player.id, 50);
  }

  return {
    wrongAnswers,
    player,
    stops: data.stops,
    levels: data.levels,
  };
});

export default component$(() => {
  const waData = useWrongAnswersData();
  const { wrongAnswers, player, stops, levels } = waData.value;

  const getStopName = (stopId: string) => {
    const stop = stops.find((s) => s.id === stopId);
    return stop?.name || stopId;
  };

  const getLevelName = (levelId: number) => {
    const level = levels.find((l) => l.id === levelId);
    return level?.name || `第 ${levelId} 关`;
  };

  const getSimilarity = (target: string[], playerAns: string[]): number => {
    const targetSet = new Set(target);
    const playerSet = new Set(playerAns);
    let correct = 0;
    for (const s of targetSet) {
      if (playerSet.has(s)) correct++;
    }
    const union = new Set([...targetSet, ...playerSet]).size;
    return union > 0 ? Math.round((correct / union) * 100) : 0;
  };

  const groupedByLevel = wrongAnswers.reduce((acc, wa) => {
    if (!acc[wa.levelId]) {
      acc[wa.levelId] = [];
    }
    acc[wa.levelId].push(wa);
    return acc;
  }, {} as Record<number, any[]>);

  const reviewedCount = wrongAnswers.filter((w) => w.reviewed).length;
  const totalCount = wrongAnswers.length;

  return (
    <div class="wrong-answers-page container">
      <div class="page-header">
        <h1 class="page-title">📝 错题本</h1>
        <p class="page-subtitle">复习你答错的音栓组合，巩固记忆</p>
      </div>

      <div class="stats-row grid grid-3">
        <div class="stat-card card">
          <div class="stat-value">{totalCount}</div>
          <div class="stat-label">错题总数</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{totalCount - reviewedCount}</div>
          <div class="stat-label">待复习</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">{reviewedCount}</div>
          <div class="stat-label">已复习</div>
        </div>
      </div>

      {wrongAnswers.length === 0 ? (
        <div class="empty-state card">
          <div class="empty-icon">🎉</div>
          <h2>太棒了！</h2>
          <p>你还没有错题，继续保持！</p>
          <Link href="/levels" class="btn btn-primary">去挑战</Link>
        </div>
      ) : (
        <div class="wrong-groups">
          {Object.entries(groupedByLevel).map(([levelId, items]) => {
            const typedItems = items as any[];
            return (
              <div key={levelId} class="wrong-group card">
                <div class="group-header">
                  <h3>
                    <Link href={`/play/${levelId}`} class="level-link">
                      第 {levelId} 关：{getLevelName(parseInt(levelId))}
                    </Link>
                  </h3>
                  <span class="group-count">{typedItems.length} 题</span>
                </div>

                <div class="wrong-list">
                  {typedItems.map((item: any) => {
                    const similarity = getSimilarity(item.targetStops, item.playerStops);
                    return (
                      <div key={item.id} class={`wrong-item ${item.reviewed ? "reviewed" : ""}`}>
                        <div class="wrong-item-header">
                          <div class="similarity-badge" style={{
                            background: similarity > 60 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: similarity > 60 ? 'var(--success)' : 'var(--error)'
                          }}>
                            相似度 {similarity}%
                          </div>
                          <div class="wrong-score">
                            {item.score} / {item.maxScore} 分
                          </div>
                        </div>

                        <div class="answer-comparison">
                          <div class="answer-block">
                            <span class="answer-label">正确答案</span>
                            <div class="answer-tags">
                              {item.targetStops.map((stopId: string) => (
                                <span key={stopId} class="answer-tag correct">
                                  {getStopName(stopId)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div class="answer-block">
                            <span class="answer-label">你的答案</span>
                            <div class="answer-tags">
                              {item.playerStops.length === 0 ? (
                                <span class="answer-tag empty">未选择</span>
                              ) : (
                                item.playerStops.map((stopId: string) => {
                                  const isCorrect = item.targetStops.includes(stopId);
                                  return (
                                    <span key={stopId} class={`answer-tag ${isCorrect ? "correct" : "wrong"}`}>
                                      {getStopName(stopId)}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        <div class="wrong-item-footer">
                          <span class="wrong-date">
                            {new Date(item.timestamp).toLocaleDateString('zh-CN')}
                          </span>
                          {item.reviewed ? (
                            <span class="reviewed-badge">✓ 已复习</span>
                          ) : (
                            <span class="review-btn">点击复习</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {wrongAnswers.length > 0 && (
        <div class="practice-cta card">
          <h3>强化练习</h3>
          <p>针对错题进行专项训练，加深记忆</p>
          <div class="cta-buttons">
            <Link href={`/play/${Math.max(...Object.keys(groupedByLevel).map(Number))}`} class="btn btn-primary">
              复习最新错题关卡
            </Link>
          </div>
        </div>
      )}
    </div>
  );
});
