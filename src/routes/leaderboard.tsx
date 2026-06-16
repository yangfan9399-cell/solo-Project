import { createSignal, createEffect, For } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { levels } from "~/data/levels";

interface LeaderboardEntry {
  playerName: string;
  score: number;
  rank: string;
  divesUsed: number;
  relicsFound: number;
  timestamp: number;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = createSignal(levels[0]?.id || "level-1");
  const [entries, setEntries] = createSignal<LeaderboardEntry[]>([]);
  const [loading, setLoading] = createSignal(false);

  const fetchLeaderboard = async (levelId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?levelId=${levelId}`);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setEntries([]);
    }
    setLoading(false);
  };

  createEffect(() => {
    fetchLeaderboard(selectedLevel());
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric"
    });
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "S":
        return "#ffd700";
      case "A":
        return "#c0c0c0";
      case "B":
        return "#cd7f32";
      default:
        return "#888";
    }
  };

  return (
    <div class="leaderboard-page">
      <div class="page-header">
        <button class="btn btn-back" onClick={() => navigate("/")}>
          ← 返回
        </button>
        <h1>🏆 排行榜</h1>
      </div>

      <div class="level-tabs">
        <For each={levels}>
          {(level) => (
            <button
              class={`level-tab ${selectedLevel() === level.id ? "active" : ""}`}
              onClick={() => setSelectedLevel(level.id)}
            >
              {level.name}
            </button>
          )}
        </For>
      </div>

      <div class="leaderboard-content">
        {loading() ? (
          <div class="loading">加载中...</div>
        ) : entries().length > 0 ? (
          <div class="leaderboard-list">
            <For each={entries()}>
              {(entry, index) => (
                <div class={`leaderboard-item rank-${index() + 1}`}>
                  <div class="item-rank">
                    {index() < 3 ? (
                      <span class="rank-medal">
                        {index() === 0 ? "🥇" : index() === 1 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span class="rank-number">{index() + 1}</span>
                    )}
                  </div>
                  <div class="item-info">
                    <div class="item-name">{entry.playerName}</div>
                    <div class="item-detail">
                      {entry.divesUsed} 潜次 · {entry.relicsFound} 件遗物
                    </div>
                  </div>
                  <div class="item-score">
                    <div class="score-value">{entry.score}</div>
                    <div
                      class="score-rank"
                      style={{ color: getRankColor(entry.rank) }}
                    >
                      {entry.rank} 级
                    </div>
                  </div>
                  <div class="item-date">{formatDate(entry.timestamp)}</div>
                </div>
              )}
            </For>
          </div>
        ) : (
          <div class="leaderboard-empty">
            <div class="empty-icon">🏆</div>
            <p>暂无排行数据</p>
            <p class="empty-sub">成为第一个上榜的探险家吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
