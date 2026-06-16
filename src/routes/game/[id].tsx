import { createSignal, createEffect, Show, For, onCleanup } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { getLevelById } from "~/data/levels";
import {
  initGameState,
  performSonarScan,
  excavateCell,
  nextDive,
  checkGameEnd,
  getPositionLabel,
  getSonarStrengthColor,
  countTotalSonarScans
} from "~/utils/gameLogic";
import type { GameState, HistoryAction, Relic, ScoreCalculationResponse, GameSession } from "~/types/game";
import {
  submitScore,
  type SubmitScoreResponse,
  getActiveSession,
  createGameSession,
  updateGameSession,
  completeGameSession,
  abandonGameSession
} from "~/utils/apiClient";

type Tool = "sonar" | "excavate";

export default function GamePage() {
  const params = useParams();
  const navigate = useNavigate();
  const levelId = params.id;

  const [level, setLevel] = createSignal<ReturnType<typeof getLevelById>>(undefined);
  const [gameState, setGameState] = createSignal<GameState | null>(null);
  const [selectedTool, setSelectedTool] = createSignal<Tool>("sonar");
  const [history, setHistory] = createSignal<HistoryAction[]>([]);
  const [showResult, setShowResult] = createSignal(false);
  const [scoreResult, setScoreResult] = createSignal<SubmitScoreResponse | null>(null);
  const [discoveryPopup, setDiscoveryPopup] = createSignal<Relic | null>(null);
  const [sessionId, setSessionId] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [sessionRestored, setSessionRestored] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  const saveSessionToBackend = async (
    state: GameState,
    hist: HistoryAction[]
  ) => {
    const sid = sessionId();
    if (!sid || state.gameStatus !== "playing") return;

    setSaving(true);
    try {
      await updateGameSession(sid, state, hist);
    } catch (e) {
      console.error("Failed to save session:", e);
    }
    setSaving(false);
  };

  createEffect(() => {
    const lvl = getLevelById(levelId || "");
    setLevel(lvl);

    if (lvl) {
      setLoading(true);
      getActiveSession(lvl.id)
        .then(async ({ session }) => {
          if (session) {
            const confirmRestore = confirm(
              "检测到未完成的游戏进程，是否继续？\n\n" +
                `已进行 ${session.history.length} 步操作，` +
                `发现 ${session.gameState.discoveredRelics.length} 件遗物`
            );

            if (confirmRestore) {
              setGameState(session.gameState);
              setHistory(session.history);
              setSessionId(session.id);
              setSessionRestored(true);
              setLoading(false);
              return;
            } else {
              await abandonGameSession(session.id);
            }
          }

          const newState = initGameState(lvl);
          const newSession = await createGameSession(lvl.id, newState);
          setGameState(newState);
          setHistory([]);
          setSessionId(newSession.id);
          setSessionRestored(false);
          setLoading(false);
        })
        .catch((e) => {
          console.error("Session load error:", e);
          const newState = initGameState(lvl);
          setGameState(newState);
          setHistory([]);
          setLoading(false);
        });
    }
  });

  onCleanup(() => {
    const sid = sessionId();
    const state = gameState();
    if (sid && state && state.gameStatus === "playing") {
      saveSessionToBackend(state, history()).catch(() => {});
    }
  });

  const handleCellClick = (row: number, col: number) => {
    const state = gameState();
    if (!state || state.gameStatus !== "playing") return;

    let newState = state;
    let newHistory = history();
    let shouldSave = false;

    if (selectedTool() === "sonar") {
      const result = performSonarScan(state, { row, col });
      if (result) {
        newState = result.state;
        newHistory = [...history(), result.action];
        setGameState(newState);
        setHistory(newHistory);
        shouldSave = true;
      }
    } else {
      const result = excavateCell(state, { row, col });
      if (result) {
        newState = result.state;
        newHistory = [...history(), result.action];
        setGameState(newState);
        setHistory(newHistory);
        shouldSave = true;

        if (result.discoveredRelic) {
          setDiscoveryPopup(result.discoveredRelic);
          setTimeout(() => setDiscoveryPopup(null), 2500);
        }

        const lvl = level();
        if (lvl) {
          const endCheck = checkGameEnd(result.state, lvl.requiredRelics);
          if (endCheck.ended) {
            endGame(result.state, endCheck.won);
            return;
          }
        }
      }
    }

    if (shouldSave && sessionId()) {
      saveSessionToBackend(newState, newHistory);
    }
  };

  const handleNextDive = () => {
    const state = gameState();
    if (!state) return;

    const result = nextDive(state);
    if (result) {
      const newHistory = [...history(), result.action];
      setGameState(result.state);
      setHistory(newHistory);

      if (sessionId()) {
        saveSessionToBackend(result.state, newHistory);
      }
    }
  };

  const handleUndo = () => {
    const h = history();
    if (h.length === 0) return;

    const lastAction = h[h.length - 1];
    const newHistory = h.slice(0, -1);
    const newState: GameState = {
      ...(gameState() as GameState),
      cells: lastAction.previousState.cells,
      discoveredRelics: lastAction.previousState.discoveredRelics,
      score: lastAction.previousState.score,
      currentDive: lastAction.previousState.currentDive,
      gameStatus: "playing"
    };

    setGameState(newState);
    setHistory(newHistory);
    setShowResult(false);

    if (sessionId()) {
      saveSessionToBackend(newState, newHistory);
    }
  };

  const endGame = async (state: GameState, won: boolean) => {
    const lvl = level();
    if (!lvl) return;

    const timeElapsed = Date.now() - state.startTime;
    const totalSonarScans = countTotalSonarScans(state);

    setGameState((prev) =>
      prev ? { ...prev, gameStatus: won ? "won" : "lost" } : prev
    );

    const sid = sessionId();
    if (sid) {
      try {
        await completeGameSession(sid);
      } catch (e) {
        console.error("Failed to complete session:", e);
      }
    }

    try {
      const result = await submitScore({
        levelId: state.levelId,
        relicsFound: state.discoveredRelics,
        divesUsed: state.currentDive.diveNumber,
        totalSonarScans,
        timeElapsed,
        won,
        relicsFoundCount: state.discoveredRelics.length
      });
      setScoreResult(result);
    } catch (e) {
      console.error("Score submission failed:", e);
      setScoreResult({
        baseScore: state.score,
        relicBonus: 0,
        efficiencyBonus: 0,
        timeBonus: 0,
        totalScore: state.score,
        rank: won ? "B" : "D",
        saved: false,
        playerTotalScore: 0,
        isNewHighScore: false
      });
    }

    setTimeout(() => setShowResult(true), 800);
  };

  const restartGame = async () => {
    const lvl = level();
    if (!lvl) return;

    const sid = sessionId();
    if (sid) {
      try {
        await abandonGameSession(sid);
      } catch (e) {
        console.error("Failed to abandon session:", e);
      }
    }

    const newState = initGameState(lvl);
    const newSession = await createGameSession(lvl.id, newState);
    setGameState(newState);
    setHistory([]);
    setShowResult(false);
    setScoreResult(null);
    setSessionId(newSession.id);
    setSessionRestored(false);
  };

  const goBack = async () => {
    const sid = sessionId();
    const state = gameState();
    if (sid && state && state.gameStatus === "playing") {
      await saveSessionToBackend(state, history());
    }
    navigate("/");
  };

  const lvl = level();
  const state = gameState();

  if (loading() || !lvl || !state) {
    return (
      <div class="game-page">
        <div class="loading">{loading() ? "加载中..." : "加载失败"}</div>
      </div>
    );
  }

  const canUseSonar = state.currentDive.sonarUsed < state.sonarPerDive;
  const canNextDive = state.currentDive.diveNumber < state.maxDives;
  const canUndo = history().length > 0;

  const sonarRemaining = state.sonarPerDive - state.currentDive.sonarUsed;

  return (
    <div class="game-page">
      <Show when={sessionRestored()}>
        <div class="session-restore-banner">
          ✅ 已恢复上次游戏进程
        </div>
      </Show>

      <Show when={saving()}>
        <div class="saving-indicator">
          💾 保存中...
        </div>
      </Show>

      <div class="game-header">
        <button class="btn btn-back" onClick={goBack}>
          ← 返回
        </button>
        <h1>{lvl.name}</h1>
        <div class="score-display">
          分数: <span class="score-value">{state.score}</span>
        </div>
      </div>

      <div class="game-stats-bar">
        <div class="stat-item">
          <span class="stat-label">潜次</span>
          <span class="stat-value">
            {state.currentDive.diveNumber} / {state.maxDives}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">声呐次数</span>
          <span class="stat-value">{sonarRemaining}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">浑浊度</span>
          <span class="stat-value">{lvl.turbidity}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已发现遗物</span>
          <span class="stat-value">
            {state.discoveredRelics.length} / {lvl.requiredRelics}
          </span>
        </div>
      </div>

      <div class="game-main">
        <div class="game-sidebar">
          <div class="tool-panel">
            <h3>探测工具</h3>
            <div class="tool-buttons">
              <button
                class={`tool-btn ${selectedTool() === "sonar" ? "active" : ""}`}
                onClick={() => setSelectedTool("sonar")}
                classList={{ disabled: !canUseSonar }}
              >
                📡 声呐扫描
              </button>
              <button
                class={`tool-btn ${selectedTool() === "excavate" ? "active" : ""}`}
                onClick={() => setSelectedTool("excavate")}
              >
                ⛏️ 发掘
              </button>
            </div>
          </div>

          <div class="action-panel">
            <button
              class="btn btn-action"
              onClick={handleNextDive}
              disabled={!canNextDive || state.gameStatus !== "playing"}
            >
              🌊 下一潜
            </button>
            <button
              class="btn btn-action btn-undo"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              ↩️ 撤销 ({history().length})
            </button>
            <button class="btn btn-action btn-restart" onClick={restartGame}>
              🔄 重新开始
            </button>
          </div>

          <div class="discovery-log">
            <h3>发现日志</h3>
            <div class="log-list">
              <For each={state.relics.filter((r) => r.discovered)}>
                {(relic) => (
                  <div class="log-item">
                    <span class="log-icon">🏺</span>
                    <div class="log-info">
                      <div class="log-name">{relic.name}</div>
                      <div class="log-era">{relic.era}</div>
                    </div>
                    <div class="log-points">+{relic.points}</div>
                  </div>
                )}
              </For>
              {state.discoveredRelics.length === 0 && (
                <div class="log-empty">尚未发现遗物</div>
              )}
            </div>
          </div>
        </div>

        <div class="game-grid-container">
          <div class="grid-wrapper">
            <div class="grid-header-row">
              <div class="grid-corner"></div>
              <For each={Array.from({ length: state.gridSize })}>
                {(_, i) => (
                  <div class="grid-header-cell">
                    {String.fromCharCode(65 + i())}
                  </div>
                )}
              </For>
            </div>
            <For each={state.cells}>
              {(row, rowIdx) => (
                <div class="grid-row">
                  <div class="grid-row-header">{rowIdx() + 1}</div>
                  <For each={row}>
                    {(cell, colIdx) => {
                      const isDiscovered =
                        cell.excavated &&
                        cell.hasRelic &&
                        cell.relicId &&
                        state.relics.find((r) => r.id === cell.relicId)?.discovered;

                      return (
                        <button
                          class={`grid-cell ${cell.sonarScanned ? "scanned" : ""} ${
                            cell.excavated ? "excavated" : ""
                          } ${isDiscovered ? "has-relic" : ""} ${
                            selectedTool() === "sonar" && !cell.sonarScanned && canUseSonar
                              ? "hover-sonar"
                              : ""
                          }`}
                          onClick={() => handleCellClick(rowIdx(), colIdx())}
                          disabled={
                            state.gameStatus !== "playing" ||
                            (selectedTool() === "sonar" &&
                              (cell.sonarScanned || !canUseSonar))
                          }
                          title={getPositionLabel(rowIdx(), colIdx())}
                        >
                          <Show when={cell.sonarScanned && !cell.excavated}>
                            <div
                              class="sonar-indicator"
                              style={{
                                background: `radial-gradient(circle, ${getSonarStrengthColor(
                                  cell.sonarStrength
                                )} ${cell.sonarStrength}%, transparent 70%)`
                              }}
                            >
                              {cell.sonarStrength}
                            </div>
                          </Show>
                          <Show when={cell.excavated}>
                            <Show when={cell.hasRelic && isDiscovered}>
                              <span class="relic-icon">🏺</span>
                            </Show>
                            <Show when={!cell.hasRelic}>
                              <span class="empty-icon">·</span>
                            </Show>
                          </Show>
                        </button>
                      );
                    }}
                  </For>
                </div>
              )}
            </For>
          </div>

          <div class="grid-legend">
            <div class="legend-item">
              <span class="legend-color" style={{ background: "#74c0fc" }}></span>
              <span>弱信号</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style={{ background: "#ffd43b" }}></span>
              <span>中等信号</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style={{ background: "#ff6b6b" }}></span>
              <span>强信号</span>
            </div>
            <div class="legend-item">
              <span class="legend-icon">🏺</span>
              <span>已发现遗物</span>
            </div>
          </div>
        </div>
      </div>

      <Show when={discoveryPopup()}>
        <div class="discovery-popup">
          <div class="popup-content">
            <div class="popup-icon">🎉</div>
            <h3>发现遗物！</h3>
            <div class="popup-relic-name">{discoveryPopup()?.name}</div>
            <div class="popup-relic-era">{discoveryPopup()?.era}</div>
            <div class="popup-points">+{discoveryPopup()?.points} 分</div>
          </div>
        </div>
      </Show>

      <Show when={showResult()}>
        <div class="result-modal">
          <div class="result-content">
            <div class={`result-header ${state.gameStatus}`}>
              <h2>{state.gameStatus === "won" ? "🎉 探索成功！" : "💔 探索失败"}</h2>
            </div>

            <div class="result-body">
              <div class="result-rank">
                <div class="rank-label">评级</div>
                <div class={`rank-value rank-${scoreResult()?.rank}`}>
                  {scoreResult()?.rank || "-"}
                </div>
              </div>

              <Show when={scoreResult()?.isNewHighScore}>
                <div class="new-highscore-badge">🏆 新纪录！</div>
              </Show>

              <div class="result-score-breakdown">
                <div class="score-item">
                  <span>基础分数</span>
                  <span>{scoreResult()?.baseScore || 0}</span>
                </div>
                <div class="score-item">
                  <span>遗物数量加成</span>
                  <span>+{scoreResult()?.relicBonus || 0}</span>
                </div>
                <div class="score-item">
                  <span>效率加成</span>
                  <span>+{scoreResult()?.efficiencyBonus || 0}</span>
                </div>
                <div class="score-item">
                  <span>时间加成</span>
                  <span>+{scoreResult()?.timeBonus || 0}</span>
                </div>
                <div class="score-item total">
                  <span>总分</span>
                  <span>{scoreResult()?.totalScore || 0}</span>
                </div>
              </div>

              <div class="result-stats">
                <div>
                  <span>使用潜次：</span>
                  <strong>{state.currentDive.diveNumber}</strong>
                </div>
                <div>
                  <span>发现遗物：</span>
                  <strong>
                    {state.discoveredRelics.length} / {lvl.relics.length}
                  </strong>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <button class="btn btn-primary" onClick={restartGame}>
                🔄 再玩一次
              </button>
              <button class="btn btn-secondary" onClick={goBack}>
                🏠 返回首页
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
