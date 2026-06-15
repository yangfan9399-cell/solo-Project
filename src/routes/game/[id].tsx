import { createSignal, createEffect, Show, For, onMount } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { minuteToTime } from "../../server/gameData";
import type {
  TeaPlant,
  Cableway,
  ProcessingStation,
  TeaBasket,
  CableConflict,
  WindCondition,
  TeaMaturityHistory,
  GameAction,
  GameSession,
  TeaQuality,
  GameResult,
} from "../../types/game";

interface GameState {
  session: GameSession;
  plants: TeaPlant[];
  cableways: Cableway[];
  stations: ProcessingStation[];
  baskets: TeaBasket[];
  basketPositions?: Record<string, any>;
  conflicts: CableConflict[];
  windHistory: WindCondition[];
  maturityHistory: TeaMaturityHistory[];
  actions: GameAction[];
  fromCache: boolean;
}

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export default function GamePage() {
  const params = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = createSignal<GameState | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [selectedPlant, setSelectedPlant] = createSignal<string | null>(null);
  const [selectedBasket, setSelectedBasket] = createSignal<string | null>(null);
  const [settleResult, setSettleResult] = createSignal<{
    before: GameResult;
    after: GameResult;
    diff: any;
  } | null>(null);
  const [showRollbackPanel, setShowRollbackPanel] = createSignal(false);
  const [rollbackInfo, setRollbackInfo] = createSignal<any>(null);
  const [notifications, setNotifications] = createSignal<Notification[]>([]);

  const sessionId = params.id;

  onMount(() => {
    if (sessionId) {
      loadGameState();
    }
  });

  function showNotification(type: Notification["type"], message: string) {
    const id = `notif-${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }

  async function loadGameState() {
    try {
      setLoading(true);
      const res = await fetch(`/api/games/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setGameState(data.data);
      } else {
        showNotification("error", data.error || "加载失败");
      }
    } catch (error: any) {
      console.error("加载游戏状态失败:", error);
      showNotification("error", "加载游戏状态失败: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function advanceTime(minutes: number) {
    try {
      const res = await fetch(`/api/games/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      const data = await res.json();
      if (data.success) {
        setGameState((prev) =>
          prev
            ? {
                ...prev,
                session: data.data.session,
                windHistory: data.data.windHistory,
                maturityHistory: data.data.maturityHistory,
                conflicts: data.data.conflicts || prev.conflicts,
                stations: data.data.stations || prev.stations,
                actions:
                  data.data.actions && data.data.actions.length > 0
                    ? [...prev.actions, ...data.data.actions.filter((a: GameAction) => !prev.actions.some((ea) => ea.id === a.id))]
                    : prev.actions,
              }
            : null
        );

        const advanced = data.data.timeAdvanced || minutes;
        if (advanced !== minutes) {
          showNotification("warning", `时间推进${advanced}分钟（冲突延误${advanced - minutes}分钟）`);
        } else {
          showNotification("info", `时间推进至 ${minuteToTime(data.data.session.currentTime)}`);
        }
        // 检查是否有新冲突
        if (data.data.conflicts && data.data.conflicts.length > (gameState()?.conflicts.length || 0)) {
          showNotification("warning", "检测到索道冲突！时间被延误");
        }
        // 检查制茶是否完成
        const stations = data.data.stations;
        if (stations) {
          const newlyFinished = stations.filter(
            (s: ProcessingStation) =>
              s.status === "finished" &&
              gameState()?.stations.find((os) => os.id === s.id)?.status !== "finished"
          );
          for (const s of newlyFinished) {
            showNotification("success", `${s.name}：制茶完成！收益已到账`);
          }
        }
      } else {
        showNotification("error", data.error || "推进时间失败");
      }
    } catch (error: any) {
      console.error("推进时间失败:", error);
      showNotification("error", "推进时间失败: " + error.message);
    }
  }

  async function performAction(
    actionType: string,
    targetId: string,
    details: any = {}
  ): Promise<any> {
    try {
      const res = await fetch(`/api/games/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, targetId, details }),
      });
      const data = await res.json();
      if (data.success) {
        await loadGameState();
        if (data.data.message) {
          showNotification("success", data.data.message);
        }
        return data.data;
      } else {
        showNotification("error", data.error || "操作失败");
      }
    } catch (error: any) {
      console.error("操作失败:", error);
      showNotification("error", "操作失败: " + error.message);
    }
    return null;
  }

  async function startGame() {
    await performAction("start_game", sessionId, {});
  }

  async function settleGame() {
    try {
      const res = await fetch(`/api/games/${sessionId}/settle`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSettleResult(data.data);
        await loadGameState();
        showNotification("success", "结算完成！请查看收益对比");
      } else {
        showNotification("error", data.error || "结算失败");
      }
    } catch (error: any) {
      console.error("结算失败:", error);
      showNotification("error", "结算失败: " + error.message);
    }
  }

  async function rollbackGame(fullReset: boolean = false) {
    try {
      const res = await fetch(`/api/games/${sessionId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToSeed: fullReset }),
      });
      const data = await res.json();
      if (data.success) {
        if (fullReset && data.data.state) {
          setGameState({
            session: data.data.state.session,
            plants: data.data.state.plants,
            cableways: data.data.state.cableways,
            stations: data.data.state.stations,
            baskets: data.data.state.baskets,
            basketPositions: {},
            conflicts: [],
            windHistory: [],
            maturityHistory: [],
            actions: [],
            fromCache: true,
          });
          setSettleResult(null);
          setShowRollbackPanel(false);
          setSelectedPlant(null);
          setSelectedBasket(null);
          showNotification("success", "已回滚到初始状态，可重新规划索道占用图");
        }
      } else {
        showNotification("error", data.error || "回滚失败");
      }
    } catch (error: any) {
      console.error("回滚失败:", error);
      showNotification("error", "回滚失败: " + error.message);
    }
  }

  async function checkRollback() {
    try {
      const res = await fetch(`/api/games/${sessionId}/rollback`);
      const data = await res.json();
      if (data.success) {
        setRollbackInfo(data.data);
        setShowRollbackPanel(true);
      } else {
        showNotification("error", data.error || "获取索道占用图失败");
      }
    } catch (error: any) {
      console.error("获取索道占用图失败:", error);
      showNotification("error", "获取索道占用图失败: " + error.message);
    }
  }

  function getQualityClass(quality: string): string {
    switch (quality) {
      case "premium":
        return "quality-premium";
      case "normal":
        return "quality-normal";
      case "degraded":
        return "quality-degraded";
      default:
        return "";
    }
  }

  function getQualityText(quality: string): string {
    switch (quality) {
      case "premium":
        return "特级";
      case "normal":
        return "普通";
      case "degraded":
        return "降级";
      default:
        return quality;
    }
  }

  function getPlantQuality(plant: TeaPlant): { quality: TeaQuality; reason: string } {
    const currentTime = gameState()?.session.currentTime || 0;
    if (currentTime < plant.matureStartTime) {
      return { quality: "normal", reason: "未成熟" };
    }
    if (currentTime <= plant.matureEndTime) {
      return { quality: plant.initialQuality, reason: "最佳采摘期" };
    }
    if (currentTime <= 480) {
      return { quality: "normal", reason: "过午但尚可用" };
    }
    return { quality: "degraded", reason: "过午降级" };
  }

  function getWindText(intensity: number): string {
    const texts = ["无风", "微风", "中风", "强风"];
    return texts[intensity] || "未知";
  }

  function getActionText(action: GameAction): string {
    const details = JSON.parse(action.details || "{}");
    switch (action.actionType) {
      case "schedule_basket":
        return `调度吊篮到 ${details.targetName || "目标"}`;
      case "pick_tea":
        return `采摘 ${details.quantity} 单位 ${getQualityText(details.quality)} 茶青，价值¥${details.subtotal || 0}`;
      case "send_to_station":
        return `送往 ${details.stationName || "工位"} (${details.travelTime || 0}分钟)`;
      case "start_processing":
        return `${details.stationName || "工位"} 开始制茶，耗时${details.duration}分钟`;
      case "finish_processing":
        return `${details.stationName || "工位"} 完成制茶，收益¥${details.revenue || 0}`;
      case "wind_change":
        return `🌬️ ${details.description || `山风变为${details.intensity}级`}`;
      case "quality_degrade":
        return `⚠️ ${details.reason || "品质变化"}`;
      case "conflict_occur":
        return `⚡ ${details.reason || "索道冲突"}（延误${details.duration}分钟）`;
      case "start_game":
        return "🎮 开始游戏";
      default:
        return action.actionType;
    }
  }

  function getPhaseText(phase: string): string {
    switch (phase) {
      case "planning":
        return "规划中";
      case "picking":
        return "采摘中";
      case "processing":
        return "制茶中";
      case "settled":
        return "已结算";
      default:
        return phase;
    }
  }

  // 获取可以制茶完成的工位
  function canFinishStation(station: ProcessingStation): boolean {
    const state = gameState();
    if (!state) return false;
    if (station.status !== "processing") return false;
    if (station.processStartTime === null) return false;
    return state.session.currentTime - station.processStartTime >= station.processDuration;
  }

  // 获取工位剩余制茶时间
  function getStationRemaining(station: ProcessingStation): number {
    const state = gameState();
    if (!state || station.processStartTime === null) return 0;
    const elapsed = state.session.currentTime - station.processStartTime;
    return Math.max(0, station.processDuration - elapsed);
  }

  // 操作步骤向导
  function getStepGuide(): string {
    const state = gameState();
    if (!state) return "";
    const phase = state.session.phase;

    if (phase === "planning") {
      return "规划阶段：查看各海拔茶青成熟时间，规划采摘顺序。准备好后点击「开始游戏」";
    }
    if (phase === "settled") {
      return "游戏已结算。可点击「索道占用图」查看分析，或回滚重算";
    }

    const sb = selectedBasket();
    const sp = selectedPlant();

    if (!sb) {
      return "步骤1：在右侧选择一个采茶吊篮";
    }

    const basket = state.baskets.find((b) => b.id === sb);
    if (!basket) return "";

    if (basket.quantity === 0) {
      if (!sp) {
        return "步骤2：在茶园中点击一处茶树选中，然后点击「采摘茶青」";
      }
      const plant = state.plants.find((p) => p.id === sp);
      if (plant && plant.quantity === 0) {
        return "该茶树已采摘完毕，请选择其他茶树";
      }
      return `步骤2：已选中茶树，点击「采摘茶青」（可采摘最多10单位）`;
    } else {
      // 有茶青，送工位
      const idleStation = state.stations.find((s) => s.status === "idle");
      if (!idleStation) {
        return "暂无空闲工位，请推进时间等待制茶完成";
      }
      return `步骤3：吊篮已有茶青，点击「送往空闲工位」开始制茶`;
    }
  }

  if (loading()) {
    return (
      <div class="container text-center py-12">
        <div class="text-lg">加载游戏中...</div>
      </div>
    );
  }

  if (!gameState()) {
    return (
      <div class="container text-center py-12">
        <div class="text-lg mb-4">游戏不存在</div>
        <button class="btn btn-primary" onClick={() => navigate("/")}>
          返回大厅
        </button>
      </div>
    );
  }

  const state = gameState()!;

  return (
    <div class="container">
      {/* 通知 */}
      <For each={notifications()}>
        {(notif) => (
          <div class={`notification notification-${notif.type}`}>
            {notif.message}
          </div>
        )}
      </For>

      {/* 顶部信息栏 */}
      <div class="card mb-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button class="btn btn-secondary text-sm" onClick={() => navigate("/")}>
            ← 返回
          </button>
          <div>
            <h1 class="text-lg font-bold">{state.session.name}</h1>
            <div class="text-xs opacity-60">
              局次 ID: {state.session.id.slice(0, 12)}... · {getPhaseText(state.session.phase)}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-xs opacity-60">当前时间</div>
            <div class="text-xl font-bold">{minuteToTime(state.session.currentTime)}</div>
          </div>
          <div class="text-center">
            <div class="text-xs opacity-60">山风</div>
            <div class="text-xl font-bold">
              🌬️ {getWindText(state.session.windIntensity)}
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs opacity-60">当前收益</div>
            <div class="text-xl font-bold text-yellow-400">
              ¥{state.session.totalRevenue}
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <Show when={state.session.phase === "planning"}>
            <button
              class="btn btn-primary text-sm"
              onClick={startGame}
              style={{ background: "linear-gradient(135deg, #ff9800, #f57c00)" }}
            >
              🎮 开始游戏
            </button>
          </Show>
          <button
            class="btn btn-secondary text-sm"
            onClick={checkRollback}
            disabled={state.session.phase === "settled"}
          >
            📊 索道占用图
          </button>
          <button
            class="btn btn-primary text-sm"
            onClick={settleGame}
            disabled={state.session.phase === "settled"}
          >
            💰 结算
          </button>
        </div>
      </div>

      {/* 操作步骤向导 */}
      <div class="step-guide">
        <div class="step-guide-title">📋 操作向导</div>
        <div class="step-guide-text">{getStepGuide()}</div>
      </div>

      {/* 时间控制 */}
      <Show when={state.session.phase !== "planning" && state.session.phase !== "settled"}>
        <div class="card mb-4">
          <div class="flex items-center gap-4 mb-3">
            <span class="text-sm font-bold">时间推进</span>
            <div class="flex gap-2">
              <button class="btn btn-secondary text-sm" onClick={() => advanceTime(15)}>
                +15分钟
              </button>
              <button class="btn btn-secondary text-sm" onClick={() => advanceTime(30)}>
                +30分钟
              </button>
              <button class="btn btn-secondary text-sm" onClick={() => advanceTime(60)}>
                +1小时
              </button>
            </div>
          </div>
          <div class="timeline">
            <div
              class="timeline-progress"
              style={{ width: `${(state.session.currentTime / 720) * 100}%` }}
            />
            <div class="timeline-noon" title="正午 12:00 过午降级线" />
            <div class="absolute top-0 left-0 right-0 flex justify-between px-4 text-xs h-full items-center opacity-60">
              <span>6:00 清晨</span>
              <span>12:00 正午(⚠️过午降级)</span>
              <span>18:00 结束</span>
            </div>
          </div>
        </div>
      </Show>

      <div class="grid" style={{ "grid-template-columns": "2fr 1fr", gap: "20px" }}>
        {/* 茶园视图 */}
        <div class="card">
          <h2 class="text-lg font-bold mb-4">🗻 悬崖茶园</h2>
          <div class="tea-garden">
            {/* 海拔分层 */}
            <div
              class="cliff-layer"
              style={{ top: "20%", height: "1px", "border-color": "rgba(255,255,255,0.1)" }}
            >
              <span class="absolute -top-5 left-2 text-xs opacity-50">高海拔 (9:00-13:00成熟)</span>
            </div>
            <div
              class="cliff-layer"
              style={{ top: "50%", height: "1px", "border-color": "rgba(255,255,255,0.1)" }}
            >
              <span class="absolute -top-5 left-2 text-xs opacity-50">中海拔 (8:00-12:00成熟)</span>
            </div>
            <div
              class="cliff-layer"
              style={{ top: "80%", height: "1px", "border-color": "rgba(255,255,255,0.1)" }}
            >
              <span class="absolute -top-5 left-2 text-xs opacity-50">低海拔 (7:00-11:00成熟)</span>
            </div>

            {/* 索道线 */}
            <For each={state.cableways}>
              {(cableway, index) => (
                <div
                  class="cableway-line"
                  style={{
                    left: `${15 + index() * 15}%`,
                    top: "10%",
                    height: "80%",
                    background: `linear-gradient(180deg, rgba(158,158,158,0.6), rgba(158,158,158,0.3))`,
                  }}
                >
                  <span
                    class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap opacity-70"
                  >
                    {cableway.name} (容量{cableway.capacity})
                  </span>
                  {/* 索道上的吊篮标记 */}
                  <For each={state.baskets.filter((b) => b.cableCarId === cableway.id)}>
                    {(basket) => {
                      const pos = state.basketPositions?.[basket.id];
                      const yPercent = pos
                        ? 10 + ((pos.currentY - cableway.startY) / (cableway.endY - cableway.startY)) * 80
                        : 50;
                      return (
                        <div
                          class={`basket-marker ${basket.quantity > 0 ? "basket-marker-filled" : ""}`}
                          style={{
                            left: "50%",
                            top: `${Math.max(5, Math.min(95, yPercent))}%`,
                          }}
                          title={`吊篮${basket.id.slice(-4)}${basket.quantity > 0 ? ` (${basket.quantity}单位)` : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBasket(basket.id);
                          }}
                        >
                          {basket.quantity > 0 ? "🧺" : "⬡"}
                        </div>
                      );
                    }}
                  </For>
                </div>
              )}
            </For>

            {/* 茶树 */}
            <For each={state.plants}>
              {(plant, index) => {
                const { quality, reason } = getPlantQuality(plant);
                const yPos = 10 + (plant.positionY / 500) * 80;
                const xPos = 25 + (index() % 3) * 25;
                const isSelected = selectedPlant() === plant.id;
                const isMature = state.session.currentTime >= plant.matureStartTime && state.session.currentTime <= plant.matureEndTime;
                return (
                  <div
                    class={`tea-plant ${quality === "premium" ? "tea-plant-premium" : ""} ${isSelected ? "ring-2 ring-yellow-400" : ""}`}
                    style={{
                      top: `${yPos}%`,
                      left: `${xPos}%`,
                      opacity: plant.quantity === 0 ? 0.3 : 1,
                      background:
                        quality === "premium"
                          ? isMature
                            ? "radial-gradient(circle, #ffd700, #ff8f00)"
                            : "radial-gradient(circle, #aed581, #7cb342)"
                          : quality === "normal"
                          ? "radial-gradient(circle, #66bb6a, #43a047)"
                          : "radial-gradient(circle, #9e9e9e, #616161)",
                    } as any}
                    title={`${plant.altitude}海拔 · ${getQualityText(quality)} · 剩余${plant.quantity}/${(plant as any)._originalQty || plant.quantity}单位 · ${reason}\n成熟期: ${minuteToTime(plant.matureStartTime)}-${minuteToTime(plant.matureEndTime)}`}
                    onClick={() => plant.quantity > 0 && setSelectedPlant(plant.id)}
                  >
                    {plant.quantity > 0 ? "🍃" : "🥀"}
                    <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap">
                      {plant.quantity}
                    </span>
                  </div>
                );
              }}
            </For>

            {/* 制茶工位 */}
            <For each={state.stations}>
              {(station, index) => {
                const xPos = 10 + index() * 20;
                const canFinish = canFinishStation(station);
                const remaining = getStationRemaining(station);
                return (
                  <div
                    class={`station ${station.status === "processing" ? "processing-pulse" : ""}`}
                    style={{
                      left: `${xPos}%`,
                      bottom: "5px",
                      background:
                        station.status === "processing"
                          ? canFinish
                            ? "linear-gradient(135deg, #4caf50, #2e7d32)"
                            : "linear-gradient(135deg, #ff9800, #f57c00)"
                          : station.status === "finished"
                          ? "linear-gradient(135deg, #4caf50, #388e3c)"
                          : "linear-gradient(135deg, #795548, #5d4037)",
                      border: canFinish ? "2px solid #ffeb3b" : "none",
                    }}
                    title={`${station.name} · ${station.status === "idle" ? "空闲" : station.status === "processing" ? `制茶中，剩${remaining}分` : "已完成"}${canFinish ? " ⚡可完成制茶" : ""}`}
                    onClick={async () => {
                      if (canFinish && state.session.phase !== "settled") {
                        await performAction("finish_processing", station.id, { stationId: station.id });
                      } else if (station.status === "idle" && selectedBasket()) {
                        const basket = state.baskets.find((b) => b.id === selectedBasket());
                        if (basket && basket.quantity > 0) {
                          // 先送往工位，再开始制茶
                          const sendRes = await performAction("send_to_station", station.id, {
                            basketId: selectedBasket(),
                            stationId: station.id,
                          });
                          if (sendRes) {
                            await performAction("start_processing", station.id, {
                              stationId: station.id,
                              basketId: selectedBasket(),
                            });
                          }
                        }
                      }
                    }}
                  >
                    <div class="text-xs">{station.name}</div>
                    <div class="text-[10px] opacity-70">
                      {station.status === "idle"
                        ? "空闲(点击分配)"
                        : station.status === "processing"
                        ? canFinish
                          ? "⚡可完成"
                          : `制茶中 ${remaining}分`
                        : "已完成"}
                    </div>
                  </div>
                );
              }}
            </For>

            {/* 山风指示器 */}
            <div class="wind-indicator">
              🌬️ {getWindText(state.session.windIntensity)}
              {state.session.windIntensity > 0 && (
                <span class="text-xs ml-2 opacity-70">
                  减速 {Math.round([0, 0.15, 0.3, 0.5][state.session.windIntensity] * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 右侧面板 */}
        <div class="flex flex-col gap-4">
          {/* 采茶篮 */}
          <div class="card">
            <h3 class="font-bold mb-3">🧺 采茶篮</h3>
            <div class="flex flex-col gap-2">
              <For each={state.baskets}>
                {(basket) => {
                  const cableway = state.cableways.find((c) => c.id === basket.cableCarId);
                  const isSelected = selectedBasket() === basket.id;
                  return (
                    <div
                      class={`p-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-yellow-500/30 ring-1 ring-yellow-400"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedBasket(basket.id)}
                    >
                      <div class="flex justify-between items-center">
                        <span class="text-sm font-bold">吊篮 {basket.id.slice(-4)}</span>
                        <span class="text-xs opacity-60">{cableway?.name}</span>
                      </div>
                      <div class="flex justify-between items-center mt-1">
                        <span class={`text-sm font-semibold ${getQualityClass(basket.quality)}`}>
                          {basket.quantity > 0
                            ? `${basket.quantity}单位 ${getQualityText(basket.quality)}`
                            : "空篮"}
                        </span>
                        {basket.pickedAt !== null && (
                          <span class="text-xs opacity-50">
                            采于 {minuteToTime(basket.pickedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>

          {/* 操作面板 */}
          <Show when={state.session.phase !== "planning" && state.session.phase !== "settled"}>
            <div class="card">
              <h3 class="font-bold mb-3">🎮 操作</h3>
              <div class="flex flex-col gap-2">
                {/* 调度吊篮到选中茶树 */}
                <Show when={selectedBasket() && selectedPlant()}>
                  <button
                    class="btn btn-primary text-sm w-full"
                    onClick={async () => {
                      const res = await performAction("schedule_basket", selectedBasket()!, {
                        basketId: selectedBasket(),
                        plantId: selectedPlant(),
                      });
                      if (res) {
                        // 调度后自动采摘
                        const plant = state.plants.find((p) => p.id === selectedPlant());
                        const basket = state.baskets.find((b) => b.id === selectedBasket());
                        if (plant && basket && basket.quantity === 0 && plant.quantity > 0) {
                          const qty = Math.min(10, plant.quantity);
                          await performAction("pick_tea", selectedBasket()!, {
                            basketId: selectedBasket(),
                            plantId: selectedPlant(),
                            quantity: qty,
                          });
                        }
                      }
                    }}
                  >
                    🚠 调度→采摘 (选中茶树)
                  </button>
                </Show>

                {/* 调度到空闲工位并制茶 */}
                <button
                  class="btn btn-secondary text-sm w-full"
                  onClick={async () => {
                    if (!selectedBasket()) {
                      showNotification("warning", "请先选择一个吊篮");
                      return;
                    }
                    const basket = state.baskets.find((b) => b.id === selectedBasket());
                    if (!basket || basket.quantity === 0) {
                      showNotification("warning", "请先采摘茶青再送往工位");
                      return;
                    }
                    const station = state.stations.find((s) => s.status === "idle");
                    if (!station) {
                      showNotification("warning", "没有空闲工位，请推进时间等待");
                      return;
                    }
                    // 送往工位
                    const sendRes = await performAction("send_to_station", station.id, {
                      basketId: selectedBasket(),
                      stationId: station.id,
                    });
                    if (sendRes) {
                      // 开始制茶
                      await performAction("start_processing", station.id, {
                        stationId: station.id,
                        basketId: selectedBasket(),
                      });
                    }
                  }}
                >
                  🏭 送往空闲工位制茶
                </button>

                {/* 可完成制茶 */}
                <Show when={state.stations.some((s) => canFinishStation(s))}>
                  <For each={state.stations.filter((s) => canFinishStation(s))}>
                    {(station) => (
                      <button
                        class="btn btn-primary text-sm w-full"
                        style={{ background: "linear-gradient(135deg, #4caf50, #2e7d32)" }}
                        onClick={() =>
                          performAction("finish_processing", station.id, {
                            stationId: station.id,
                          })
                        }
                      >
                        ✅ 完成{station.name}制茶
                      </button>
                    )}
                  </For>
                </Show>
              </div>
              <p class="text-xs opacity-60 mt-3">
                💡 提示：也可直接点击茶园中的茶树和工位进行操作
              </p>
            </div>
          </Show>

          {/* 状态汇总 */}
          <div class="card">
            <h3 class="font-bold mb-3">📊 状态汇总</h3>
            <div class="grid" style={{ "grid-template-columns": "1fr 1fr", gap: "8px" }}>
              <div class="text-sm p-2 bg-white/5 rounded">
                <div class="opacity-60 text-xs">待采茶青</div>
                <div class="font-bold text-lg">
                  {state.plants.reduce((s, p) => s + p.quantity, 0)}
                </div>
              </div>
              <div class="text-sm p-2 bg-white/5 rounded">
                <div class="opacity-60 text-xs">运送中</div>
                <div class="font-bold text-lg">
                  {state.baskets.reduce((s, b) => s + (b.quantity > 0 && b.pickedAt !== null ? b.quantity : 0), 0)}
                </div>
              </div>
              <div class="text-sm p-2 bg-white/5 rounded">
                <div class="opacity-60 text-xs">制茶中</div>
                <div class="font-bold text-lg">
                  {state.stations.filter((s) => s.status === "processing").length}
                </div>
              </div>
              <div class="text-sm p-2 bg-white/5 rounded">
                <div class="opacity-60 text-xs">已完成批次</div>
                <div class="font-bold text-lg">
                  {state.stations.filter((s) => s.status === "finished").length}
                </div>
              </div>
            </div>
          </div>

          {/* 操作记录 */}
          <div class="card">
            <h3 class="font-bold mb-3">📋 操作记录</h3>
            <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
              <For each={[...state.actions].reverse().slice(0, 30)}>
                {(action) => (
                  <div class="text-xs py-1 border-b border-white/5">
                    <span class="opacity-50">[{minuteToTime(action.timestamp)}]</span>{" "}
                    <span>{getActionText(action)}</span>
                  </div>
                )}
              </For>
              {state.actions.length === 0 && (
                <div class="text-xs opacity-50 text-center py-2">
                  {state.session.phase === "planning"
                    ? "准备就绪，点击「开始游戏」开始操作"
                    : "暂无操作记录"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 茶青品质变化追踪 */}
      <div class="card mt-4">
        <h2 class="text-lg font-bold mb-4">📈 茶青品质变化追踪</h2>
        <div class="grid" style={{ "grid-template-columns": "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          <For each={state.plants}>
            {(plant) => {
              const { quality, reason } = getPlantQuality(plant);
              const history = state.maturityHistory.filter(
                (m) => m.teaPlantId === plant.id
              );
              const maturityPercent = Math.min(
                100,
                Math.max(
                  0,
                  ((state.session.currentTime - plant.matureStartTime) /
                    (plant.matureEndTime - plant.matureStartTime)) *
                    100
                )
              );
              return (
                <div class="p-3 rounded-lg bg-white/5">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-bold">茶树 {plant.id.slice(-4)}</span>
                    <span
                      class="text-xs px-2 py-0.5 rounded"
                      style={{
                        background:
                          plant.altitude === "high"
                            ? "#5c6bc0"
                            : plant.altitude === "mid"
                            ? "#7e57c2"
                            : "#8d6e63",
                      }}
                    >
                      {plant.altitude === "high" ? "高海拔" : plant.altitude === "mid" ? "中海拔" : "低海拔"}
                    </span>
                  </div>
                  {/* 成熟度进度条 */}
                  <div class="mb-2">
                    <div
                      style={{
                        height: "6px",
                        background: "rgba(0,0,0,0.3)",
                        "border-radius": "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${maturityPercent}%`,
                          background:
                            quality === "degraded"
                              ? "#f44336"
                              : maturityPercent > 100
                              ? "#ff9800"
                              : "#4caf50",
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                  </div>
                  <div class="text-sm mb-1">
                    当前品质：
                    <span class={`font-semibold ${getQualityClass(quality)}`}>
                      {getQualityText(quality)}
                    </span>
                  </div>
                  <div class="text-xs opacity-60 mb-2">{reason}</div>
                  <div class="text-xs opacity-50">
                    成熟期：{minuteToTime(plant.matureStartTime)} -{" "}
                    {minuteToTime(plant.matureEndTime)}
                  </div>
                  <div class="text-xs opacity-50">
                    剩余量：{plant.quantity} 单位 · ¥{plant.quantity * 50}(最优价)
                  </div>
                  {history.length > 0 && (
                    <div class="mt-2 pt-2 border-t border-white/10">
                      <div class="text-xs opacity-50 mb-1">品质变化：</div>
                      <For each={history.slice(-3)}>
                        {(h) => (
                          <div class="text-xs">
                            {minuteToTime(h.timestamp)} →{" "}
                            <span class={getQualityClass(h.quality)}>{getQualityText(h.quality)}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  )}
                </div>
              );
            }}
          </For>
        </div>
      </div>

      {/* 结算结果弹窗 */}
      <Show when={settleResult()}>
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" style={{ overflow: "auto" }}>
          <div class="card max-w-3xl w-full mx-4 my-8">
            <h2 class="text-xl font-bold mb-4 text-center">💰 收益结算报告</h2>

            <div class="comparison-grid mb-6">
              {/* 结算前 */}
              <div class="revenue-card p-4 rounded-lg">
                <h3 class="font-bold mb-2 text-center text-blue-300">📋 计划预估（最优情况）</h3>
                <div class="revenue-number text-center" style={{ color: "#64b5f6" }}>
                  ¥{settleResult()!.before.totalRevenue}
                </div>
                <div class="text-sm mt-4 space-y-1">
                  <div class="flex justify-between">
                    <span>🍃 总茶青量</span>
                    <span>{settleResult()!.before.totalTeaPicked} 单位</span>
                  </div>
                  <div class="flex justify-between">
                    <span>⭐ 特级茶青(¥50/单位)</span>
                    <span class="quality-premium font-bold">
                      {settleResult()!.before.premiumCount} 单位
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>🟢 普通茶青(¥30/单位)</span>
                    <span class="quality-normal font-bold">
                      {settleResult()!.before.normalCount} 单位
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>⚫ 降级茶青(¥10/单位)</span>
                    <span class="quality-degraded font-bold">
                      {settleResult()!.before.degradedCount} 单位
                    </span>
                  </div>
                </div>
              </div>

              {/* 结算后 */}
              <div class="revenue-card p-4 rounded-lg border-yellow-500/50 border">
                <h3 class="font-bold mb-2 text-center text-yellow-300">🏆 实际结算（按操作记录重算）</h3>
                <div class="revenue-number text-center text-yellow-400">
                  ¥{settleResult()!.after.totalRevenue}
                </div>
                <div class="text-sm mt-4 space-y-1">
                  <div class="flex justify-between">
                    <span>🍃 实际采摘量</span>
                    <span>{settleResult()!.after.totalTeaPicked} 单位</span>
                  </div>
                  <div class="flex justify-between">
                    <span>⭐ 特级茶青(¥50/单位)</span>
                    <span class="quality-premium font-bold">
                      {settleResult()!.after.premiumCount} 单位
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>🟢 普通茶青(¥30/单位)</span>
                    <span class="quality-normal font-bold">
                      {settleResult()!.after.normalCount} 单位
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>⚫ 降级茶青(¥10/单位)</span>
                    <span class="quality-degraded font-bold">
                      {settleResult()!.after.degradedCount} 单位
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 差异分析 */}
            <div class="p-4 rounded-lg bg-white/5 mb-4">
              <h3 class="font-bold mb-3">📊 差异分析（专属记录影响）</h3>
              <div class="grid" style={{ "grid-template-columns": "repeat(4, 1fr)", gap: "12px" }}>
                <div class="text-center p-2 bg-black/20 rounded">
                  <div class="text-xs opacity-60 mb-1">最终收益差异</div>
                  <div
                    class={`text-lg font-bold ${
                      settleResult()!.diff.revenueDiff >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {settleResult()!.diff.revenueDiff >= 0 ? "+" : ""}¥
                    {settleResult()!.diff.revenueDiff}
                  </div>
                  <div class="text-xs opacity-50">
                    {settleResult()!.diff.revenueDiffPercent || 0}%
                  </div>
                </div>
                <div class="text-center p-2 bg-black/20 rounded">
                  <div class="text-xs opacity-60 mb-1">采摘完成率</div>
                  <div class="text-lg font-bold text-blue-400">
                    {settleResult()!.diff.pickedRate || 0}%
                  </div>
                </div>
                <div class="text-center p-2 bg-black/20 rounded">
                  <div class="text-xs opacity-60 mb-1">山风影响次数</div>
                  <div class="text-lg font-bold text-cyan-400">
                    {settleResult()!.after.windAffectedCount}
                  </div>
                </div>
                <div class="text-center p-2 bg-black/20 rounded">
                  <div class="text-xs opacity-60 mb-1">索道冲突次数</div>
                  <div class="text-lg font-bold text-orange-400">
                    {settleResult()!.after.conflictCount}
                  </div>
                </div>
              </div>
            </div>

            {/* 变化原因 & 专属记录详情 */}
            <div class="grid" style={{ "grid-template-columns": "1fr 1fr", gap: "16px", "margin-bottom": "24px" }}>
              <div class="p-4 rounded-lg bg-white/5">
                <h3 class="font-bold mb-2">🔍 变化原因</h3>
                <ul class="text-sm space-y-1 opacity-90">
                  <li>• <b>海拔差异：</b>不同海拔茶青成熟时段不同，错过窗口降级</li>
                  <li>• <b>山风减速：</b>风大时吊篮速度降低，运输耗时增加</li>
                  <li>• <b>索道冲突：</b>吊篮拥挤引发延误，过午茶青品质下降</li>
                  <li>• <b>过午降级：</b>12:00后未采摘茶青从特级降为普通或降级</li>
                </ul>
              </div>
              <div class="p-4 rounded-lg bg-white/5">
                <h3 class="font-bold mb-2">📝 专属数据结构说明</h3>
                <ul class="text-sm space-y-1 opacity-90">
                  <li>• <b>主记录：</b>局次(game_sessions)保存索道调度与时间进度</li>
                  <li>• <b>明细记录：</b>操作(game_actions)保存采茶篮与制茶工位动作</li>
                  <li>• <b>历史记录：</b>成熟史(tea_maturity)保存各海拔品质变化</li>
                  <li>• <b>结果记录：</b>结算(game_results)保存山风影响与最终收益</li>
                </ul>
              </div>
            </div>

            <div class="flex gap-4 justify-center">
              <button
                class="btn btn-secondary"
                onClick={() => {
                  setSettleResult(null);
                }}
              >
                继续查看详情
              </button>
              <button class="btn btn-primary" onClick={() => navigate("/")}>
                返回大厅开始新局
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* 索道占用图面板 */}
      <Show when={showRollbackPanel()}>
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div class="card max-w-2xl w-full mx-4">
            <h2 class="text-xl font-bold mb-4 text-center">📊 索道占用图分析 & 回滚</h2>

            <Show when={rollbackInfo()}>
              <div class="mb-4">
                <h3 class="font-bold mb-3">当前索道占用状态（{minuteToTime(rollbackInfo()!.currentTime)}）</h3>
                <div class="occupancy-chart">
                  <For each={rollbackInfo()!.cableways}>
                    {(cableway: any) => {
                      const baskets = state.baskets.filter(
                        (b) => b.cableCarId === cableway.id
                      );
                      const activeBaskets = baskets.filter(
                        (b) => b.quantity > 0 || b.teaPlantId
                      );
                      const usage = (activeBaskets.length / cableway.capacity) * 100;
                      return (
                        <div class="occupancy-row">
                          <div class="occupancy-label font-bold">{cableway.name}</div>
                          <div class="occupancy-bar">
                            <div
                              class={`occupancy-fill ${
                                usage >= 90 ? "occupancy-conflict" : usage >= 70 ? "" : ""
                              }`}
                              style={{
                                width: `${Math.min(usage, 100)}%`,
                                background:
                                  usage >= 90
                                    ? "linear-gradient(90deg, #f44336, #ff5722)"
                                    : usage >= 70
                                    ? "linear-gradient(90deg, #ff9800, #ffc107)"
                                    : "linear-gradient(90deg, #4caf50, #8bc34a)",
                              }}
                            />
                          </div>
                          <span class="text-xs opacity-80 w-24 text-right font-semibold">
                            占用 {activeBaskets.length}/{cableway.capacity}
                          </span>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </div>

              <Show when={rollbackInfo()!.potentialConflicts?.length > 0}>
                <div class="p-4 rounded-lg bg-orange-500/20 border border-orange-500/50 mb-4">
                  <h3 class="font-bold mb-2 text-orange-300">⚠️ 潜在冲突警告</h3>
                  <div class="flex flex-col gap-2">
                    <For each={rollbackInfo()!.potentialConflicts}>
                      {(conflict: any) => (
                        <div class="text-sm">
                          <span
                            class={`px-2 py-0.5 rounded text-xs mr-2 font-bold ${
                              conflict.severity === "high" ? "bg-red-500" : "bg-yellow-500"
                            }`}
                          >
                            {conflict.severity === "high" ? "高风险" : "中风险"}
                          </span>
                          {conflict.reason}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              <Show when={rollbackInfo()!.potentialConflicts?.length === 0}>
                <div class="p-4 rounded-lg bg-green-500/20 border border-green-500/50 mb-4">
                  <div class="text-green-300 font-bold">✅ 当前索道规划良好，无明显冲突风险</div>
                </div>
              </Show>
            </Show>

            <div class="p-4 rounded-lg bg-white/5 mb-6">
              <h3 class="font-bold mb-2">🔄 回滚说明（种子样本3验证）</h3>
              <p class="text-sm opacity-90 mb-2">
                如果索道占用规划不合理、冲突频繁，可以<b>回滚到种子初始状态</b>，重新规划采摘路线。
                回滚会清除本局面有操作记录，但保留局次 ID。
              </p>
              <p class="text-xs opacity-70">
                💡 这是第三个种子样本"索道占用图需要回滚或重算"的核心验证场景。
              </p>
            </div>

            <div class="flex gap-4 justify-center">
              <button
                class="btn btn-danger"
                onClick={() => rollbackGame(true)}
                disabled={state.session.phase === "settled"}
              >
                🔄 回滚到初始状态重算
              </button>
              <button
                class="btn btn-secondary"
                onClick={() => setShowRollbackPanel(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
