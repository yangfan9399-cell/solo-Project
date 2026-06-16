import { component$, useSignal, useTask$, useVisibleTask$, $, useStore } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import { readGameData, initializeDefaultData } from "~/lib/server/db";
import { StopButton } from "~/components/stop-button/stop-button";
import type { PipeStop, Level } from "~/lib/types";

export const useGameLevelData = routeLoader$(({ params }) => {
  initializeDefaultData();
  const data = readGameData();
  const levelId = parseInt(params.levelId);
  const level = data.levels.find((l) => l.id === levelId);
  const player = data.players.find((p) => p.id === "player_demo");

  if (!level) {
    return {
      level: null as Level | null,
      stops: [] as PipeStop[],
      player: player || null,
      error: "关卡不存在",
    };
  }

  const availableStops = data.stops.filter((s) => level.availableStops.includes(s.id));

  return {
    level,
    stops: availableStops,
    player: player || null,
    error: null,
  };
});

interface GameStateStore {
  currentRound: number;
  totalRounds: number;
  selectedStops: string[];
  targetStops: string[];
  score: number;
  correctCount: number;
  phase: "intro" | "listening" | "selecting" | "result" | "finished";
  timeLeft: number;
  hintUsed: boolean;
  roundStartTime: number;
  results: any[];
  sessionId: string;
  targetCombinations: string[][];
}

export default component$(() => {
  const gameData = useGameLevelData();
  const nav = useNavigate();
  const audioReady = useSignal(false);
  const isPlaying = useSignal(false);
  const roundResult = useSignal<any>(null);

  const state = useStore<GameStateStore>({
    currentRound: 0,
    totalRounds: 5,
    selectedStops: [],
    targetStops: [],
    score: 0,
    correctCount: 0,
    phase: "intro",
    timeLeft: 60,
    hintUsed: false,
    roundStartTime: 0,
    results: [],
    sessionId: "",
    targetCombinations: [],
  });

  useVisibleTask$(({ track }) => {
    track(() => state.phase);
    if (state.phase !== "selecting") return;

    const timer = setInterval(() => {
      if (state.timeLeft > 0) {
        state.timeLeft--;
      } else {
        submitAnswer();
      }
    }, 1000);

    return () => clearInterval(timer);
  });

  const initAudio = $(async () => {
    if (typeof window === "undefined") return;
    const { getAudioEngine } = await import("~/lib/audio-engine");
    const engine = getAudioEngine();
    await engine.init();
    engine.resume();
    audioReady.value = true;
  });

  const playTargetSound = $(async () => {
    if (typeof window === "undefined") return;
    const { getAudioEngine } = await import("~/lib/audio-engine");
    const engine = getAudioEngine();
    engine.resume();

    const targetStopObjects = gameData.value.stops.filter((s) =>
      state.targetStops.includes(s.id)
    );

    isPlaying.value = true;

    const notes = gameData.value.level?.phraseNotes || [60, 64, 67, 72];
    await engine.playPhrase(notes, targetStopObjects, 0.35);

    isPlaying.value = false;
  });

  const playCurrentSelection = $(async () => {
    if (typeof window === "undefined") return;
    if (state.selectedStops.length === 0) return;

    const { getAudioEngine } = await import("~/lib/audio-engine");
    const engine = getAudioEngine();
    engine.resume();

    const selectedStopObjects = gameData.value.stops.filter((s) =>
      state.selectedStops.includes(s.id)
    );

    isPlaying.value = true;
    const notes = gameData.value.level?.phraseNotes || [60, 64, 67, 72];
    await engine.playPhrase(notes, selectedStopObjects, 0.35);
    isPlaying.value = false;
  });

  const toggleStop = $(async (stopId: string) => {
    if (state.phase !== "selecting") return;

    if (state.selectedStops.includes(stopId)) {
      state.selectedStops = state.selectedStops.filter((s) => s !== stopId);
    } else {
      state.selectedStops = [...state.selectedStops, stopId];
    }

    if (typeof window !== "undefined") {
      const { getAudioEngine } = await import("~/lib/audio-engine");
      const engine = getAudioEngine();
      engine.resume();

      const selectedStopObjects = gameData.value.stops.filter((s) =>
        state.selectedStops.includes(s.id)
      );

      engine.stopAll();
      if (selectedStopObjects.length > 0) {
        const note = 64;
        engine.playNote(note, selectedStopObjects);
        setTimeout(() => engine.stopNote(note), 200);
      }
    }
  });

  const startGame = $(async () => {
    if (!gameData.value.level) return;

    const level = gameData.value.level;
    const combinations = [...level.targetCombinations]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    state.targetCombinations = combinations;
    state.totalRounds = combinations.length;
    state.currentRound = 1;
    state.score = 0;
    state.correctCount = 0;
    state.results = [];
    state.targetStops = combinations[0];
    state.selectedStops = [];
    state.phase = "listening";
    state.timeLeft = level.timeLimit || 60;
    state.hintUsed = false;
    state.roundStartTime = Date.now();

    await initAudio();

    setTimeout(() => {
      playTargetSound();
      state.phase = "selecting";
      state.roundStartTime = Date.now();
      state.timeLeft = level?.timeLimit || 60;
    }, 500);
  });

  const useHint = $(() => {
    if (state.hintUsed || state.phase !== "selecting") return;
    state.hintUsed = true;

    const correctStops = state.targetStops.filter(
      (s) => !state.selectedStops.includes(s)
    );
    if (correctStops.length > 0) {
      const randomCorrect = correctStops[Math.floor(Math.random() * correctStops.length)];
      if (!state.selectedStops.includes(randomCorrect)) {
        state.selectedStops = [...state.selectedStops, randomCorrect];
      }
    }
  });

  const submitAnswer = $(async () => {
    if (state.phase !== "selecting") return;

    const timeTaken = (Date.now() - state.roundStartTime) / 1000;
    const level = gameData.value.level;
    if (!level) return;

    const response = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetStops: state.targetStops,
        playerStops: state.selectedStops,
        timeTaken: timeTaken.toString(),
        levelId: level.id.toString(),
        hintUsed: state.hintUsed.toString(),
      }),
    });

    const data = await response.json();
    const result = data.result;

    roundResult.value = result;
    state.score += result.score;
    if (result.isCorrect) state.correctCount++;

    state.results.push({
      roundNumber: state.currentRound,
      targetStops: state.targetStops,
      playerStops: state.selectedStops,
      score: result.score,
      maxScore: result.maxScore,
      isCorrect: result.isCorrect,
      timeTaken,
      hintUsed: state.hintUsed,
    });

    state.phase = "result";
  });

  const nextRound = $(() => {
    if (state.currentRound >= state.totalRounds) {
      finishGame();
      return;
    }

    state.currentRound++;
    state.targetStops = state.targetCombinations[state.currentRound - 1];
    state.selectedStops = [];
    state.phase = "listening";
    state.hintUsed = false;
    state.timeLeft = gameData.value.level?.timeLimit || 60;
    state.roundStartTime = Date.now();
    roundResult.value = null;

    setTimeout(() => {
      playTargetSound();
      state.phase = "selecting";
      state.roundStartTime = Date.now();
      state.timeLeft = gameData.value.level?.timeLimit || 60;
    }, 300);
  });

  const finishGame = $(async () => {
    state.phase = "finished";

    const player = gameData.value.player;
    const level = gameData.value.level;
    if (!player || !level) return;

    const sessionResponse = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: player.id,
        levelId: level.id.toString(),
      }),
    });

    const sessionData = await sessionResponse.json();
    if (sessionData.success) {
      const sessionId = sessionData.session.id;

      for (let i = 0; i < state.results.length; i++) {
        const round = state.results[i];
        await fetch("/api/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submitRound",
            sessionId,
            roundNumber: round.roundNumber.toString(),
            targetStops: round.targetStops,
            playerStops: round.playerStops,
            timeTaken: round.timeTaken.toString(),
            hintUsed: round.hintUsed.toString(),
          }),
        });
      }

      state.sessionId = sessionId;
    }
  });

  const goToResult = $(() => {
    if (state.sessionId) {
      nav(`/result/${state.sessionId}`);
    }
  });

  if (gameData.value.error || !gameData.value.level) {
    return (
      <div class="game-page container">
        <div class="card error-card">
          <h2>关卡不存在</h2>
          <p>请返回关卡列表选择有效的关卡。</p>
          <button onClick$={() => nav("/levels")} class="btn btn-primary">
            返回关卡列表
          </button>
        </div>
      </div>
    );
  }

  const level = gameData.value.level;

  return (
    <div class="game-page container">
      <div class="game-header card">
        <div class="game-header-left">
          <h1 class="game-title">第 {level.id} 关：{level.name}</h1>
          <div class="game-progress">
            第 {state.currentRound} / {state.totalRounds} 轮
          </div>
        </div>
        <div class="game-header-right">
          <div class="score-display">
            <span class="score-label">得分</span>
            <span class="score-value">{state.score}</span>
          </div>
          {state.phase === "selecting" && (
            <div class={`timer ${state.timeLeft <= 10 ? "warning" : ""}`}>
              <span class="timer-icon">⏱️</span>
              <span class="timer-value">{state.timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      {state.phase === "intro" && (
        <div class="intro-section card">
          <div class="intro-content">
            <div class="intro-icon">🎹</div>
            <h2>准备好了吗？</h2>
            <p class="intro-desc">
              你将听到 {state.totalRounds} 段管风琴音色，每段都由不同的音栓组合而成。
              仔细聆听，然后选择正确的音栓组合。
            </p>
            <div class="intro-tips">
              <div class="tip-item">
                <span class="tip-icon">🎵</span>
                <span>点击音栓可以试听</span>
              </div>
              <div class="tip-item">
                <span class="tip-icon">💡</span>
                <span>使用提示会扣除 40% 分数</span>
              </div>
              <div class="tip-item">
                <span class="tip-icon">⏰</span>
                <span>时间越快，奖励越多</span>
              </div>
            </div>
            <button onClick$={startGame} class="btn btn-primary btn-lg">
              开始挑战
            </button>
          </div>
        </div>
      )}

      {(state.phase === "listening" || state.phase === "selecting" || state.phase === "result") && (
        <div class="game-content">
          <div class="sound-section card">
            <h3>目标音色</h3>
            <div class={`play-target-btn ${isPlaying.value ? "playing" : ""}`}>
              <button onClick$={playTargetSound} disabled={isPlaying.value} class="btn btn-secondary btn-large">
                {isPlaying.value ? "播放中..." : "🔊 播放目标音色"}
              </button>
            </div>
            {state.phase === "selecting" && (
              <p class="hint-text">仔细聆听音色特点，然后选择你认为正确的音栓组合</p>
            )}
          </div>

          <div class="stops-panel card">
            <div class="panel-header">
              <h3>音栓选择</h3>
              <span class="selected-count">已选 {state.selectedStops.length} 个</span>
            </div>
            <div class="stops-grid">
              {gameData.value.stops.map((stop) => (
                <StopButton
                  key={stop.id}
                  stop={stop}
                  active={state.selectedStops.includes(stop.id)}
                  disabled={state.phase !== "selecting"}
                  onToggle$={toggleStop}
                />
              ))}
            </div>
          </div>

          {state.phase === "selecting" && state.selectedStops.length > 0 && (
            <div class="preview-section card">
              <h3>试听你的组合</h3>
              <button onClick$={playCurrentSelection} disabled={isPlaying.value} class="btn btn-outline">
                {isPlaying.value ? "播放中..." : "🎵 试听当前选择"}
              </button>
            </div>
          )}

          {state.phase === "result" && roundResult.value && (
            <div class={`result-section card ${roundResult.value.isCorrect ? "correct" : "wrong"}`}>
              <div class="result-header">
                <span class="result-icon">{roundResult.value.isCorrect ? "🎉" : "😔"}</span>
                <h3>{roundResult.value.isCorrect ? "回答正确！" : "回答错误"}</h3>
              </div>

              <div class="result-scores">
                <div class="result-score-item">
                  <span class="rs-label">本轮得分</span>
                  <span class="rs-value">+{roundResult.value.score}</span>
                </div>
                <div class="result-score-item">
                  <span class="rs-label">正确音栓</span>
                  <span class="rs-value">{roundResult.value.correctCount} / {state.targetStops.length}</span>
                </div>
                <div class="result-score-item">
                  <span class="rs-label">时间奖励</span>
                  <span class="rs-value">+{roundResult.value.timeBonus}</span>
                </div>
              </div>

              <div class="answer-comparison">
                <div class="answer-col">
                  <h4>正确答案</h4>
                  <div class="answer-stops">
                    {state.targetStops.map((stopId) => {
                      const stop = gameData.value.stops.find((s) => s.id === stopId);
                      return (
                        <span key={stopId} class="answer-tag correct">
                          {stop?.name || stopId}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div class="answer-col">
                  <h4>你的答案</h4>
                  <div class="answer-stops">
                    {state.selectedStops.length === 0 ? (
                      <span class="answer-tag empty">未选择</span>
                    ) : (
                      state.selectedStops.map((stopId) => {
                        const stop = gameData.value.stops.find((s) => s.id === stopId);
                        const isCorrect = state.targetStops.includes(stopId);
                        return (
                          <span key={stopId} class={`answer-tag ${isCorrect ? "correct" : "wrong"}`}>
                            {stop?.name || stopId}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {state.hintUsed && <div class="hint-used">💡 使用了提示 -40% 分数</div>}
            </div>
          )}

          <div class="action-bar">
            {state.phase === "selecting" && (
              <>
                <button onClick$={useHint} disabled={state.hintUsed} class="btn btn-secondary">
                  💡 提示
                </button>
                <button onClick$={submitAnswer} class="btn btn-primary btn-lg">
                  提交答案
                </button>
              </>
            )}
            {state.phase === "result" && (
              <button onClick$={nextRound} class="btn btn-primary btn-lg">
                {state.currentRound >= state.totalRounds ? "查看结果" : "下一轮 →"}
              </button>
            )}
          </div>
        </div>
      )}

      {state.phase === "finished" && (
        <div class="finish-section card">
          <div class="finish-content">
            <div class="finish-icon">🏆</div>
            <h2>游戏结束！</h2>
            <div class="final-score">
              <span class="final-score-label">最终得分</span>
              <span class="final-score-value">{state.score}</span>
            </div>
            <div class="final-stats">
              <div class="final-stat">
                <span class="fs-label">正确数</span>
                <span class="fs-value">{state.correctCount} / {state.totalRounds}</span>
              </div>
              <div class="final-stat">
                <span class="fs-label">正确率</span>
                <span class="fs-value">
                  {Math.round((state.correctCount / state.totalRounds) * 100)}%
                </span>
              </div>
            </div>
            <div class="finish-actions">
              <button onClick$={startGame} class="btn btn-secondary">
                再玩一次
              </button>
              <button onClick$={goToResult} class="btn btn-primary">
                查看详情
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
