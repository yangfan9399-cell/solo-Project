import { createSignal, createEffect, Show, For } from "solid-js";
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
import type { GameState, HistoryAction, Relic, ScoreCalculationResponse } from "~/types/game";
import { submitScore, type SubmitScoreResponse } from "~/utils/apiClient";

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

  createEffect(() => {
    const lvl = getLevelById(levelId || "");
    setLevel(lvl);
    if (lvl) {
      const state = initGameState(lvl);
      setGameState(state);
      setHistory([]);
    }
  });

  const handleCellClick = (row: number, col: number) => {
    const state = gameState();
    if (!state || state.gameStatus !== "playing") return;

    if (selectedTool() === "sonar") {
      const result = performSonarScan(state, { row, col });
      if (result) {
        setGameState(result.state);
        setHistory((h) => [...h, result.action]);
      }
    } else {
      const result = excavateCell(state, { row, col });
      if (result) {
        setGameState(result.state);
        setHistory((h) => [...h, result.action]);

        if (result.discoveredRelic) {
          setDiscoveryPopup(result.discoveredRelic);
          setTimeout(() => setDiscoveryPopup(null), 2500);
        }

        const lvl = level();
        if (lvl) {
          const endCheck = checkGameEnd(result.state, lvl.requiredRelics);
          if (endCheck.ended) {
            endGame(result.state, endCheck.won);
          }
        }
      }
    }
  };

  const handleNextDive = () => {
    const state = gameState();
    if (!state) return;

    const result = nextDive(state);
    if (result) {
      setGameState(result.state);
      setHistory((h) => [...h, result.action]);
    }
  };

  const handleUndo = () => {
    const h = history();
    if (h.length === 0) return;

    const lastAction = h[h.length - 1];
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cells: lastAction.previousState.cells,
        discoveredRelics: lastAction.previousState.discoveredRelics,
        score: lastAction.previousState.score,
        currentDive: lastAction.previousState.currentDive,
        gameStatus: "playing"
      };
    });
    setHistory((prev) => prev.slice(0, -1));
    setShowResult(false);
  };

  const endGame = async (state: GameState, won: boolean) => {
    const lvl = level();
    if (!lvl) return;

    const timeElapsed = Date.now() - state.startTime;
    const totalSonarScans = countTotalSonarScans(state);

    setGameState((prev) =>
      prev ? { ...prev, gameStatus: won ? "won" : "lost" } : prev
    );

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

  const restartGame = () => {
    const lvl = level();
    if (lvl) {
      setGameState(initGameState(lvl));
      setHistory([]);
      setShowResult(false);
      setScoreResult(null);
    }
  };

  const goBack = () => {
    navigate("/");
  };

  const lvl = level();
  const state = gameState();

  if (!lvl || !state) {
    return (
      <div class="game-page">
        <div class="loading">加载中...</div>
      </div>
    );
  }

  const canUseSonar = state.currentDive.sonarUsed < state.sonarPerDive;
  const canNextDive = state.currentDive.diveNumber < state.maxDives;
  const canUndo = history().length > 0;

  const sonarRemaining = state.sonarPerDive - state.currentDive.sonarUsed;

  return (
    <div class="game-page">
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
