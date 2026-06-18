import { useEffect } from "react";
import { useGameStore } from "./store/gameStore";
import BoardPanel from "./components/BoardPanel";
import EventBox from "./components/EventBox";
import ReplayTrack from "./components/ReplayTrack";
import SettlementBook from "./components/SettlementBook";
import type { GameLevelId } from "@cbcp/shared";

interface LevelButtonDef {
  id: GameLevelId;
  label: string;
}

const levelButtonDefs: LevelButtonDef[] = [
  { id: "si", label: "巳局·教学" },
  { id: "shen", label: "申局·资源短缺" },
  { id: "wu", label: "午局·隐藏条件" },
];

function App() {
  const {
    currentLevelId,
    levels,
    currentStepIdx,
    steps,
    isPlaying,
    levelsError,
    fetchLevels,
    selectLevel,
  } = useGameStore();

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const currentLevel = levels.find((l) => l.id === currentLevelId);
  const stepDisplay = currentLevel
    ? `${Math.max(currentStepIdx + 1, 0)} / ${steps.length}`
    : "—";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="top-bar">
        <div className="top-bar-logo">
          <span className="top-bar-logo-icon">🪸</span>
          珊瑚钟室路径解谜游戏
        </div>

        <div className="level-buttons">
          {levelButtonDefs.map((def) => {
            const hasLevel = levels.some((l) => l.id === def.id);
            return (
              <button
                key={def.id}
                className={`level-btn ${
                  currentLevelId === def.id ? "active" : ""
                }`}
                onClick={() => selectLevel(def.id)}
                disabled={!hasLevel}
                title={!hasLevel ? "关卡尚未加载" : def.label}
              >
                {def.label}
              </button>
            );
          })}
        </div>

        <div className="top-bar-status">
          <span
            className={`status-chip ${isPlaying && currentLevel ? "playing" : ""}`}
          >
            {isPlaying && currentLevel ? "🟢 当前局进行中" : "⚪ 待开始"}
          </span>
          <span className="status-chip">
            步数：<b style={{ color: "var(--coral-gold)" }}>{stepDisplay}</b>
          </span>
          <span className="status-save-indicator">
            <span className="status-save-dot" />
            自动保存中
          </span>
        </div>
      </header>

      <main className="main-grid">
        {!currentLevel ? (
          <div className="welcome-screen">
            <div className="welcome-icon">🪸</div>
            <div className="welcome-title">珊瑚钟室</div>
            <div className="welcome-subtitle">
              请选择上方关卡开始珊瑚钟室路径解谜之旅
              <br />
              <span style={{ fontSize: 13, opacity: 0.8 }}>
                巳局·教学 / 申局·资源短缺 / 午局·隐藏条件
              </span>
            </div>
            {levelsError ? (
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: "rgba(230, 57, 70, 0.1)",
                  border: "1px solid rgba(230, 57, 70, 0.35)",
                  fontSize: 14,
                  color: "#ffb0b0",
                  maxWidth: 420,
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                ⚠️ {levelsError}
                <br />
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  请确认后端服务已启动（端口 41621）后刷新页面
                </span>
              </div>
            ) : (
              <div className="welcome-hints">
              <div className="welcome-hint-card">
                <div className="welcome-hint-card-title">🎯 目标</div>
                从起点走到终点，同时在六维数值场上满足关卡胜利公式
              </div>
              <div className="welcome-hint-card">
                <div className="welcome-hint-card-title">🧩 路径</div>
                点击高亮的相邻格子移动；每一步会触发换轨值累加与事件
              </div>
              <div className="welcome-hint-card">
                <div className="welcome-hint-card-title">⚖️ 结算</div>
                走到满意位置后点"后端结算"，由独立后端重算并给出最终胜负
              </div>
            </div>
            )}
          </div>
        ) : (
          <>
            <BoardPanel />
            <EventBox />
            <ReplayTrack />
            <SettlementBook />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
