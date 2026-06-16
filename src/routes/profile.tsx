import { createSignal, createEffect, For } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { getPlayerProfile, updatePlayerName, getGameHistory, resetPlayerData } from "~/utils/storage";
import { levels } from "~/data/levels";
import type { PlayerProfile, GameHistory } from "~/types/game";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = createSignal<PlayerProfile | null>(null);
  const [history, setHistory] = createSignal<GameHistory[]>([]);
  const [editing, setEditing] = createSignal(false);
  const [newName, setNewName] = createSignal("");

  createEffect(() => {
    setProfile(getPlayerProfile());
    setHistory(getGameHistory());
  });

  const handleEditName = () => {
    setNewName(profile()?.name || "");
    setEditing(true);
  };

  const handleSaveName = () => {
    if (newName().trim()) {
      const updated = updatePlayerName(newName().trim());
      setProfile(updated);
    }
    setEditing(false);
  };

  const handleReset = () => {
    if (confirm("确定要重置所有游戏数据吗？此操作不可撤销。")) {
      const newProfile = resetPlayerData();
      setProfile(newProfile);
      setHistory([]);
    }
  };

  const getLevelName = (levelId: string) => {
    return levels.find((l) => l.id === levelId)?.name || levelId;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const p = profile();

  if (!p) {
    return <div class="profile-page">加载中...</div>;
  }

  return (
    <div class="profile-page">
      <div class="profile-header">
        <button class="btn btn-back" onClick={() => navigate("/")}>
          ← 返回
        </button>
        <h1>👤 玩家档案</h1>
      </div>

      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar">🤿</div>
        </div>

        <div class="info-section">
          <div class="name-row">
            {editing() ? (
              <div class="name-edit">
                <input
                  type="text"
                  value={newName()}
                  onInput={(e) => setNewName(e.target.value)}
                  maxLength={20}
                />
                <button class="btn btn-small btn-primary" onClick={handleSaveName}>
                  保存
                </button>
                <button class="btn btn-small" onClick={() => setEditing(false)}>
                  取消
                </button>
              </div>
            ) : (
              <>
                <h2>{p.name}</h2>
                <button class="btn btn-small btn-edit" onClick={handleEditName}>
                  ✏️ 编辑
                </button>
              </>
            )}
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-number">{p.totalScore}</div>
              <div class="stat-label">总分数</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{p.gamesPlayed}</div>
              <div class="stat-label">游戏次数</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{p.completedLevels.length}</div>
              <div class="stat-label">通关关卡</div>
            </div>
          </div>
        </div>
      </div>

      <div class="high-scores">
        <h3>🏆 最高分记录</h3>
        <div class="score-list">
          <For each={levels}>
            {(level) => (
              <div class="score-item">
                <span class="score-level">{level.name}</span>
                <span class="score-value">
                  {p.highestScores[level.id] || "-"}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="game-history">
        <h3>📜 游戏记录</h3>
        {history().length > 0 ? (
          <div class="history-list">
            <For each={history().slice(0, 20)}>
              {(entry) => (
                <div class={`history-item ${entry.won ? "won" : "lost"}`}>
                  <div class="history-icon">{entry.won ? "✅" : "❌"}</div>
                  <div class="history-info">
                    <div class="history-level">{getLevelName(entry.levelId)}</div>
                    <div class="history-detail">
                      {entry.divesUsed} 潜次 · {entry.relicsFound} 件遗物
                    </div>
                  </div>
                  <div class="history-score">{entry.score} 分</div>
                  <div class="history-date">{formatDate(entry.timestamp)}</div>
                </div>
              )}
            </For>
          </div>
        ) : (
          <div class="history-empty">
            还没有游戏记录，开始你的第一次探索吧！
          </div>
        )}
      </div>

      <div class="danger-zone">
        <button class="btn btn-danger" onClick={handleReset}>
          🗑️ 重置所有数据
        </button>
      </div>
    </div>
  );
}
