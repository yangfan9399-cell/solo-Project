import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "@remix-run/react";
import type { GameSession, LevelConfig, Player } from "~/types";

export default function SessionsPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [levels, setLevels] = useState<Record<string, LevelConfig>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    loadData();
  }, [playerId]);

  async function loadData() {
    setLoading(true);
    const [pRes, sRes, lRes] = await Promise.all([
      fetch(`/api/players?id=${playerId}`).then((r) => r.json()),
      fetch(`/api/sessions?playerId=${playerId}`).then((r) => r.json()),
      fetch("/api/levels").then((r) => r.json()),
    ]);
    setPlayer(pRes.player);
    setSessions(sRes.sessions || []);
    const levelMap: Record<string, LevelConfig> = {};
    for (const lv of lRes.levels || []) {
      levelMap[lv.id] = lv;
    }
    setLevels(levelMap);
    setLoading(false);
  }

  async function handleDelete(sessionId: string) {
    if (!confirm("确定删除此局次记录？")) return;
    const fd = new FormData();
    fd.append("intent", "delete");
    fd.append("sessionId", sessionId);
    await fetch("/api/sessions", { method: "POST", body: fd });
    setSessions(sessions.filter((s) => s.id !== sessionId));
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link to="/" style={{ color: "#8ab4ff", fontSize: 14 }}>← 返回首页</Link>
          <h1 style={{ fontSize: 24, marginTop: 8, color: "#ffd88a" }}>
            📋 {player?.name} 的局次记录
          </h1>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div
          style={{
            background: "#151520",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            border: "1px solid #252535",
          }}
        >
          <p style={{ color: "#888", fontSize: 16, marginBottom: 16 }}>暂无局次记录</p>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#4a7cff",
              color: "#fff",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            开始第一局
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map((s) => {
            const lv = levels[s.levelId];
            const passed = s.status === "completed" && s.score >= (lv?.targetScore ?? 60);
            return (
              <div
                key={s.id}
                style={{
                  background: "#151520",
                  borderRadius: 10,
                  padding: 16,
                  border: "1px solid #252535",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 16, color: "#ddd" }}>
                      {lv?.name || s.levelId}
                    </h3>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background: passed
                          ? "rgba(80, 200, 120, 0.2)"
                          : s.status === "completed"
                          ? "rgba(200, 80, 80, 0.2)"
                          : "rgba(100, 100, 200, 0.2)",
                        color: passed
                          ? "#88ffaa"
                          : s.status === "completed"
                          ? "#ff8888"
                          : "#8ab4ff",
                      }}
                    >
                      {s.status === "in_progress"
                        ? "⏸️ 进行中"
                        : passed
                        ? "✅ 通关"
                        : "❌ 未通关"}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    分数: <span style={{ color: passed ? "#88ffaa" : "#ffaa66", fontSize: 15, fontWeight: 600 }}>{s.score}</span>
                    {` / ${lv?.targetScore ?? "?"} 目标`}
                    <span style={{ margin: "0 8px" }}>|</span>
                    展品: {s.exhibits.length} | 灯光: {s.lights.length}
                    <span style={{ margin: "0 8px" }}>|</span>
                    {formatTime(s.updatedAt)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {s.status === "in_progress" && (
                    <button
                      onClick={() => navigate(`/game/${s.id}`)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "#4a7cff",
                        color: "#fff",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      继续
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 6,
                      border: "1px solid #664444",
                      background: "transparent",
                      color: "#ff8888",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
