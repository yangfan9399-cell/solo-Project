import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { getSessionsByPlayer, getStreakDays, initializeDefaultData, readGameData } from "~/lib/server/db";

export const useHistoryData = routeLoader$(() => {
  initializeDefaultData();
  const data = readGameData();
  const player = data.players.find((p) => p.id === "player_demo");

  let sessions: any[] = [];
  let streak = { current: 0, best: 0, dates: [] as string[] };

  if (player) {
    sessions = getSessionsByPlayer(player.id).slice(0, 20);
    streak = getStreakDays(player.id);
  }

  return {
    player,
    sessions,
    streak,
    levels: data.levels,
  };
});

export default component$(() => {
  const historyData = useHistoryData();
  const { player, sessions, streak, levels } = historyData.value;

  const getLevelName = (levelId: number) => {
    const level = levels.find((l) => l.id === levelId);
    return level?.name || `第 ${levelId} 关`;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const played = streak.dates.includes(dateStr);
      days.push({
        date: dateStr,
        label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        played,
      });
    }
    return days;
  };

  const last7Days = getLast7Days();

  return (
    <div class="history-page container">
      <div class="page-header">
        <h1 class="page-title">🏆 战绩中心</h1>
        <p class="page-subtitle">查看你的游戏记录和连胜成就</p>
      </div>

      <div class="player-profile card">
        <div class="profile-avatar">
          <span class="avatar-icon">🎵</span>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">{player?.name || "玩家"}</h2>
          <div class="profile-stats">
            <span>总得分: <strong>{player?.totalScore || 0}</strong></span>
            <span>总场次: <strong>{player?.totalPlays || 0}</strong></span>
            <span>最高关卡: <strong>第 {player?.highestLevel || 1} 关</strong></span>
          </div>
        </div>
      </div>

      <div class="streak-section card">
        <div class="streak-header">
          <h3>🔥 每日连胜</h3>
          <div class="streak-numbers">
            <span class="streak-current">{streak.current} 天</span>
            <span class="streak-divider">/</span>
            <span class="streak-best">最佳 {streak.best} 天</span>
          </div>
        </div>

        <div class="streak-calendar">
          {last7Days.map((day) => (
            <div key={day.date} class={`streak-day ${day.played ? "played" : "missed"}`}>
              <div class={`day-dot ${day.played ? "active" : ""}`}></div>
              <span class="day-label">{day.label}</span>
            </div>
          ))}
        </div>

        <div class="streak-tip">
          {streak.current > 0
            ? `保持连胜！再坚持 ${7 - streak.current} 天即可获得 7 天连胜奖励`
            : "开始你的第一天连胜吧！"}
        </div>
      </div>

      <div class="history-section card">
        <div class="section-header">
          <h3>📋 游戏记录</h3>
          <span class="record-count">共 {sessions.length} 场</span>
        </div>

        {sessions.length === 0 ? (
          <div class="empty-history">
            <p>还没有游戏记录，快去挑战吧！</p>
            <Link href="/levels" class="btn btn-primary">开始游戏</Link>
          </div>
        ) : (
          <div class="history-list">
            {sessions.map((session) => {
              const percentage = session.maxScore > 0 ? Math.round((session.score / session.maxScore) * 100) : 0;
              const isPass = session.status === "completed";
              const date = new Date(session.startTime);
              const timeStr = date.toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Link
                  key={session.id}
                  href={`/result/${session.id}`}
                  class={`history-item ${isPass ? "pass" : "fail"}`}
                >
                  <div class="history-info">
                    <div class="history-level">
                      第 {session.levelId} 关 · {getLevelName(session.levelId)}
                    </div>
                    <div class="history-time">{timeStr}</div>
                  </div>
                  <div class="history-result">
                    <span class={`result-badge ${isPass ? "pass" : "fail"}`}>
                      {isPass ? "通关" : "失败"}
                    </span>
                    <span class="result-score">{percentage}%</span>
                    {session.stars && session.stars > 0 && (
                      <span class="result-stars">{"⭐".repeat(session.stars)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div class="achievements-section card">
        <h3>🎖️ 成就</h3>
        <div class="achievement-list">
          <div class={`achievement-item ${(player?.totalPlays || 0) >= 1 ? "unlocked" : "locked"}`}>
            <span class="ach-icon">🎮</span>
            <div class="ach-info">
              <span class="ach-name">初次体验</span>
              <span class="ach-desc">完成第一局游戏</span>
            </div>
          </div>
          <div class={`achievement-item ${(player?.totalPlays || 0) >= 10 ? "unlocked" : "locked"}`}>
            <span class="ach-icon">🎯</span>
            <div class="ach-info">
              <span class="ach-name">勤学苦练</span>
              <span class="ach-desc">累计游戏 10 局</span>
            </div>
          </div>
          <div class={`achievement-item ${streak.best >= 3 ? "unlocked" : "locked"}`}>
            <span class="ach-icon">🔥</span>
            <div class="ach-info">
              <span class="ach-name">三连胜</span>
              <span class="ach-desc">连续 3 天打卡</span>
            </div>
          </div>
          <div class={`achievement-item ${streak.best >= 7 ? "unlocked" : "locked"}`}>
            <span class="ach-icon">💪</span>
            <div class="ach-info">
              <span class="ach-name">一周坚持</span>
              <span class="ach-desc">连续 7 天打卡</span>
            </div>
          </div>
          <div class={`achievement-item ${(player?.highestLevel || 1) >= 5 ? "unlocked" : "locked"}`}>
            <span class="ach-icon">🎵</span>
            <div class="ach-info">
              <span class="ach-name">音乐达人</span>
              <span class="ach-desc">通关第 5 关</span>
            </div>
          </div>
          <div class={`achievement-item ${(player?.highestLevel || 1) >= 8 ? "unlocked" : "locked"}`}>
            <span class="ach-icon">👑</span>
            <div class="ach-info">
              <span class="ach-name">管风琴大师</span>
              <span class="ach-desc">通关全部关卡</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
