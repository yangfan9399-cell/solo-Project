import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import type { LevelConfig, Player } from "~/types";

export default function Index() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [newName, setNewName] = useState("");
  const [levelScores, setLevelScores] = useState<Record<string, { player: Player; score: number }[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("currentPlayer");
    if (saved) {
      setSelectedPlayer(JSON.parse(saved));
    }
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [pRes, lRes] = await Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/levels").then((r) => r.json()),
    ]);
    setPlayers(pRes.players || []);
    setLevels(lRes.levels || []);

    const scores: Record<string, { player: Player; score: number }[]> = {};
    for (const lv of lRes.levels || []) {
      const sRes = await fetch(`/api/levels?id=${lv.id}`).then((r) => r.json());
      scores[lv.id] = (sRes.scores || []).map((s: any) => ({
        player: s.player,
        score: s.session.score,
      }));
    }
    setLevelScores(scores);
    setLoading(false);
  }

  async function handleCreatePlayer() {
    if (!newName.trim()) return;
    const fd = new FormData();
    fd.append("name", newName.trim());
    const res = await fetch("/api/players", { method: "POST", body: fd }).then((r) => r.json());
    if (res.player) {
      setPlayers([res.player, ...players]);
      setSelectedPlayer(res.player);
      localStorage.setItem("currentPlayer", JSON.stringify(res.player));
      setNewName("");
    }
  }

  function handleSelectPlayer(p: Player) {
    setSelectedPlayer(p);
    localStorage.setItem("currentPlayer", JSON.stringify(p));
  }

  async function handleStartLevel(level: LevelConfig) {
    if (!selectedPlayer) return;
    const fd = new FormData();
    fd.append("intent", "create");
    fd.append("playerId", selectedPlayer.id);
    fd.append("levelId", level.id);
    const res = await fetch("/api/sessions", { method: "POST", body: fd }).then((r) => r.json());
    if (res.session) {
      navigate(`/game/${res.session.id}`);
    }
  }

  async function handleViewSessions() {
    if (!selectedPlayer) return;
    navigate(`/sessions/${selectedPlayer.id}`);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <header style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 42, marginBottom: 8, color: "#ffd88a", letterSpacing: 2 }}>
          🏛️ 博物馆夜间布展
        </h1>
        <p style={{ color: "#888", fontSize: 16 }}>
          在夜幕降临前布置展品，调整灯光，让每件艺术品都安全地闪耀
        </p>
      </header>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16, color: "#aaa" }}>👤 选择玩家档案</h2>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPlayer(p)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: selectedPlayer?.id === p.id ? "2px solid #ffd88a" : "2px solid #333",
                background: selectedPlayer?.id === p.id ? "#2a2515" : "#1a1a24",
                color: selectedPlayer?.id === p.id ? "#ffd88a" : "#ccc",
                fontSize: 15,
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="创建新玩家..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreatePlayer()}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a24",
              color: "#fff",
              fontSize: 15,
              width: 240,
            }}
          />
          <button
            onClick={handleCreatePlayer}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#4a7cff",
              color: "#fff",
              fontSize: 15,
            }}
          >
            创建档案
          </button>
          {selectedPlayer && (
            <button
              onClick={handleViewSessions}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #555",
                background: "#1a1a24",
                color: "#ccc",
                fontSize: 15,
                marginLeft: 12,
              }}
            >
              📋 历史局次
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 16, color: "#aaa" }}>🎯 选择关卡</h2>
        {loading ? (
          <p style={{ color: "#666" }}>加载中...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {levels.map((lv) => (
              <div
                key={lv.id}
                style={{
                  background: "#151520",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid #252535",
                }}
              >
                <h3 style={{ fontSize: 18, marginBottom: 8, color: "#ffd88a" }}>{lv.name}</h3>
                <p style={{ color: "#888", fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
                  {lv.description}
                </p>
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#666", marginBottom: 12 }}>
                  <span>展品数: {lv.availableExhibits.length}</span>
                  <span>灯光: {lv.availableLights}</span>
                  <span>目标: {lv.targetScore}分</span>
                </div>
                {(levelScores[lv.id] || []).length > 0 && (
                  <div style={{ marginBottom: 12, padding: "8px 12px", background: "#1a1a28", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>🏆 排行榜</div>
                    {(levelScores[lv.id] || []).slice(0, 3).map((s, i) => (
                      <div key={i} style={{ fontSize: 13, color: "#aaa", display: "flex", justifyContent: "space-between" }}>
                        <span>{i + 1}. {s.player.name}</span>
                        <span style={{ color: "#ffd88a" }}>{s.score}分</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => handleStartLevel(lv)}
                  disabled={!selectedPlayer}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: selectedPlayer ? "#4a7cff" : "#333",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {selectedPlayer ? "▶ 开始布展" : "请先选择玩家"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 48, textAlign: "center", color: "#555", fontSize: 13 }}>
        <p>💡 提示：每件展品对光线敏感度不同，请仔细调整灯光位置和强度</p>
      </footer>
    </div>
  );
}
