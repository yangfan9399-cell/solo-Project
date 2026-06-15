import { createSignal, createEffect, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import type { SeedType } from "../types/game";

interface SeedInfo {
  type: string;
  name: string;
  description: string;
  plantCount: number;
  cablewayCount: number;
  stationCount: number;
  expectedOutcome: string;
}

interface SessionInfo {
  id: string;
  name: string;
  seedType: string;
  phase: string;
  currentTime: number;
  totalRevenue: number;
  created_at: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [seeds, setSeeds] = createSignal<SeedInfo[]>([]);
  const [sessions, setSessions] = createSignal<SessionInfo[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [selectedSeed, setSelectedSeed] = createSignal<SeedType>("normal");

  createEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [seedsRes, gamesRes] = await Promise.all([
        fetch("/api/seeds").then((r) => r.json()),
        fetch("/api/games").then((r) => r.json()),
      ]);

      if (seedsRes.success) {
        setSeeds(seedsRes.data.seeds);
      }
      if (gamesRes.success) {
        setSessions(gamesRes.data);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startGame() {
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedType: selectedSeed() }),
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/game/${data.data.sessionId}`);
      }
    } catch (error) {
      console.error("创建游戏失败:", error);
    }
  }

  function continueGame(sessionId: string) {
    navigate(`/game/${sessionId}`);
  }

  function getSeedColor(type: string): string {
    switch (type) {
      case "normal":
        return "from-green-600 to-green-800";
      case "exception":
        return "from-orange-600 to-red-700";
      case "rollback":
        return "from-blue-600 to-purple-700";
      default:
        return "from-gray-600 to-gray-800";
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

  return (
    <div class="container">
      <header class="text-center mb-8">
        <h1 class="text-xl font-bold mb-2">🌿 悬崖茶园采摘索道调度游戏</h1>
        <p class="text-sm opacity-80">
          调度索道、采摘茶青、避开山风、赶在过午前完成制茶
        </p>
      </header>

      {loading() ? (
        <div class="text-center">加载中...</div>
      ) : (
        <div class="grid" style={{ "grid-template-columns": "1fr 1fr", gap: "24px" }}>
          {/* 选择种子 */}
          <div class="card">
            <h2 class="text-lg font-bold mb-4">选择剧本</h2>
            <div class="flex flex-col gap-4">
              <For each={seeds()}>
                {(seed) => (
                  <div
                    class={`card cursor-pointer transition-all ${
                      selectedSeed() === seed.type
                        ? "ring-2 ring-yellow-400"
                        : ""
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${
                        seed.type === "normal"
                          ? "rgba(76, 175, 80, 0.2)"
                          : seed.type === "exception"
                          ? "rgba(255, 152, 0, 0.2)"
                          : "rgba(33, 150, 243, 0.2)"
                      }, rgba(0,0,0,0.2))`,
                    }}
                    onClick={() => setSelectedSeed(seed.type as SeedType)}
                  >
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="font-bold">{seed.name}</h3>
                      <span
                        class="text-xs px-2 py-1 rounded"
                        style={{
                          background:
                            seed.type === "normal"
                              ? "#4caf50"
                              : seed.type === "exception"
                              ? "#ff9800"
                              : "#2196f3",
                        }}
                      >
                        {seed.type === "normal"
                          ? "简单"
                          : seed.type === "exception"
                          ? "困难"
                          : "挑战"}
                      </span>
                    </div>
                    <p class="text-sm opacity-80 mb-2">{seed.description}</p>
                    <div class="flex gap-4 text-xs opacity-60">
                      <span>🍃 {seed.plantCount} 处茶园</span>
                      <span>🚠 {seed.cablewayCount} 条索道</span>
                      <span>🏭 {seed.stationCount} 个工位</span>
                    </div>
                    <p class="text-xs mt-2 italic opacity-70">
                      预期：{seed.expectedOutcome}
                    </p>
                  </div>
                )}
              </For>
            </div>

            <button
              class="btn btn-primary w-full mt-6"
              style={{ padding: "14px", "font-size": "16px" }}
              onClick={startGame}
            >
              开始游戏
            </button>
          </div>

          {/* 历史局次 */}
          <div class="card">
            <h2 class="text-lg font-bold mb-4">历史局次</h2>
            {sessions().length === 0 ? (
              <div class="text-center opacity-60 py-8">
                暂无游戏记录，开始你的第一局吧！
              </div>
            ) : (
              <div class="flex flex-col gap-3">
                <For each={sessions().slice(0, 10)}>
                  {(session) => (
                    <div
                      class="card flex justify-between items-center cursor-pointer hover:bg-white/5"
                      onClick={() => continueGame(session.id)}
                    >
                      <div>
                        <div class="font-bold">{session.name}</div>
                        <div class="text-xs opacity-60">
                          {getPhaseText(session.phase)} · 收益: ¥
                          {session.totalRevenue}
                        </div>
                      </div>
                      <button class="btn btn-secondary text-sm">
                        {session.phase === "settled" ? "查看" : "继续"}
                      </button>
                    </div>
                  )}
                </For>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 游戏说明 */}
      <div class="card mt-8">
        <h2 class="text-lg font-bold mb-4">游戏玩法</h2>
        <div class="grid" style={{ "grid-template-columns": "repeat(3, 1fr)", gap: "16px" }}>
          <div class="text-sm">
            <h3 class="font-bold mb-2">🗻 海拔与成熟</h3>
            <p class="opacity-80">
              低海拔茶园最早成熟，高海拔最晚。每处茶园都有最佳采摘窗口，过午品质降级。
            </p>
          </div>
          <div class="text-sm">
            <h3 class="font-bold mb-2">🌬️ 山风影响</h3>
            <p class="opacity-80">
              山风会减慢吊篮速度。风力越大减速越明显，可能导致茶青来不及送下山而过午降级。
            </p>
          </div>
          <div class="text-sm">
            <h3 class="font-bold mb-2">⚡ 索道冲突</h3>
            <p class="opacity-80">
              同一索道上吊篮过多会发生冲突，造成延误。合理规划索道占用图是关键。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
