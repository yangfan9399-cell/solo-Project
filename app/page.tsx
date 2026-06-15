"use client";

import { useState, useEffect, useCallback } from "react";
import TideTimeline from "@/components/TideTimeline";
import Catalog from "@/components/Catalog";
import Notebook from "@/components/Notebook";
import RecoveryPanel from "@/components/RecoveryPanel";
import PoolSelector from "@/components/PoolSelector";
import ResultPanel from "@/components/ResultPanel";
import HistoryPanel from "@/components/HistoryPanel";
import type {
  GameSession,
  ObservationRecord,
  NotebookEntry,
  RecoveryTask,
  SessionResult,
  Species,
  PoolLocation,
  HistoricalCondition,
} from "@/lib/types";

type Tab = "game" | "catalog" | "notebook" | "recovery" | "result" | "history";

export default function HomePage() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [pools, setPools] = useState<PoolLocation[]>([]);
  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [historicalConditions, setHistoricalConditions] = useState<HistoricalCondition[]>([]);
  const [pastSessions, setPastSessions] = useState<GameSession[]>([]);

  const [tab, setTab] = useState<Tab>("game");
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    const res = await fetch("/api/catalog");
    const data = await res.json();
    setSpecies(data.species);
    setPools(data.pools);
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    setHistoricalConditions(data.conditions);
    setPastSessions(data.sessions);
  }, []);

  const startNewGame = useCallback(async () => {
    const res = await fetch("/api/session", { method: "POST" });
    const newSession: GameSession = await res.json();
    setSession(newSession);
    setObservations([]);
    setNotebookEntries([]);
    setRecoveryTasks([]);
    setResult(null);
    setTab("game");
    await loadHistory();
  }, [loadHistory]);

  const initSeedData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    await loadCatalog();
    await loadHistory();
    setSession(null);
    setLoading(false);
    alert(data.message || "种子数据已初始化");
  }, [loadCatalog, loadHistory]);

  const loadSession = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/session?sessionId=${sessionId}`);
    if (!res.ok) return;
    const loaded: GameSession = await res.json();
    setSession(loaded);

    const recordsRes = await fetch(`/api/records?sessionId=${sessionId}`);
    const recordsData = await recordsRes.json();
    setObservations(recordsData.observations || []);
    setNotebookEntries(recordsData.notebook || []);
    setResult(recordsData.result || null);

    const recoveryRes = await fetch(`/api/recovery?sessionId=${sessionId}`);
    const recoveryData = await recoveryRes.json();
    setRecoveryTasks(recoveryData.tasks || []);

    setTab(loaded.status === "completed" ? "result" : "game");
  }, []);

  const handleObserve = useCallback(
    async (poolId: string, trampled: boolean, note?: string) => {
      if (!session) return;
      const res = await fetch("/api/observe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, poolId, trampled, note }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSession(data.session);
      if (data.observations?.length > 0) {
        setObservations((prev) => [...prev, ...data.observations]);
      }
      if (data.session.status === "completed") {
        const recordsRes = await fetch(`/api/records?sessionId=${session.id}`);
        const recordsData = await recordsRes.json();
        setResult(recordsData.result || null);
        const recoveryRes = await fetch(`/api/recovery?sessionId=${session.id}`);
        const recoveryData = await recoveryRes.json();
        setRecoveryTasks(recoveryData.tasks || []);
        setTab("result");
      }
      await loadHistory();
    },
    [session, loadHistory]
  );

  const handleAddNote = useCallback(
    async (speciesId: string, content: string) => {
      if (!session) return;
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, speciesId, content }),
      });
      if (res.ok) {
        const entry: NotebookEntry = await res.json();
        setNotebookEntries((prev) => [...prev, entry]);
      }
    },
    [session]
  );

  const handleCompleteRecovery = useCallback(
    async (taskId: string) => {
      if (!session) return;

      const res = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, sessionId: session.id, recalculate: true }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setRecoveryTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
      );
      if (data.result) {
        setResult(data.result);
      }
      if (session) {
        const updatedSession = await fetch(`/api/session?sessionId=${session.id}`).then((r) => r.json());
        setSession(updatedSession);
      }
      await loadHistory();
    },
    [session, loadHistory]
  );

  const handleRecalculate = useCallback(async () => {
    if (!session) return;
    const res = await fetch(`/api/records?sessionId=${session.id}`);
    const data = await res.json();
    setResult(data.result || null);
  }, [session]);

  useEffect(() => {
    const init = async () => {
      await loadCatalog();
      await loadHistory();
      setLoading(false);
    };
    init();
  }, [loadCatalog, loadHistory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-wave mb-3">🌊</div>
          <p className="text-slate-600">加载海岛潮池生态数据中...</p>
        </div>
      </div>
    );
  }

  const observedIds = new Set(observations.map((o) => o.speciesId));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-black text-sky-800 mb-1">
          🏝️ 海岛潮池生态观察
        </h1>
        <p className="text-sm text-slate-500">
          在涨落潮之间探索潮池，记录生物出现的秘密
        </p>
      </header>

      {!session ? (
        <div className="max-w-md mx-auto">
          <div className="pool-card text-center mb-4">
            <div className="text-5xl mb-3">🦀🌸🐟</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">欢迎来到潮池观察站</h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              一局游戏有 <b>8 个时间步</b>，涵盖完整的潮汐周期。
              <br />
              选择正确的潮位和地点，观察螃蟹、海葵和小鱼。
              <br />
              注意不要踩踏过多生物，否则会降低生态评分！
            </p>
            <button onClick={startNewGame} className="btn-primary w-full text-base py-3 mb-2">
              🌊 开始新的观察
            </button>
            <button
              onClick={initSeedData}
              className="w-full text-sm py-2 px-4 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300"
            >
              🌱 初始化种子数据（3个样本场景）
            </button>
          </div>
          {pastSessions.length > 0 && (
            <HistoryPanel
              conditions={historicalConditions}
              sessions={pastSessions}
              onLoadSession={loadSession}
            />
          )}
        </div>
      ) : (
        <>
          <div className="bg-white/90 backdrop-blur rounded-xl shadow-md p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">研究积分</div>
                  <div className="text-xl font-bold text-sky-700">🔬 {session.researchPoints}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">生态评分</div>
                  <div
                    className={`text-xl font-bold ${
                      session.ecoScore >= 80
                        ? "text-emerald-600"
                        : session.ecoScore >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    🌿 {session.ecoScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">踩踏次数</div>
                  <div className="text-xl font-bold text-slate-700">👣 {session.tramplingCount}</div>
                </div>
              </div>
              <button
                onClick={startNewGame}
                className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                🔄 新一局
              </button>
            </div>
            <TideTimeline
              currentStep={session.timeStep}
              totalSteps={session.totalSteps}
              route={session.route}
            />
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { id: "game", label: "🏝️ 观察", show: true },
              { id: "catalog", label: "📖 图鉴", show: true },
              { id: "notebook", label: "📝 笔记", show: observations.length > 0 },
              { id: "recovery", label: "🌿 恢复", show: session.status === "completed" },
              { id: "result", label: "🏆 结算", show: session.status === "completed" },
              { id: "history", label: "📚 档案", show: true },
            ]
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    tab === t.id
                      ? "bg-sky-600 text-white shadow-md"
                      : "bg-white/70 text-slate-600 hover:bg-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tab === "game" && (
              <>
                <PoolSelector pools={pools} session={session} onObserve={handleObserve} />
                <Catalog species={species} observedIds={observedIds} />
              </>
            )}

            {tab === "catalog" && (
              <div className="lg:col-span-2">
                <Catalog species={species} observedIds={observedIds} />
              </div>
            )}

            {tab === "notebook" && (
              <div className="lg:col-span-2">
                <Notebook
                  sessionId={session.id}
                  observations={observations}
                  notebookEntries={notebookEntries}
                  onAddNote={handleAddNote}
                />
              </div>
            )}

            {tab === "recovery" && (
              <div className="lg:col-span-2">
                <RecoveryPanel tasks={recoveryTasks} onComplete={handleCompleteRecovery} />
              </div>
            )}

            {tab === "result" && result && (
              <>
                <ResultPanel
                  result={result}
                  session={session}
                  onRecalculate={handleRecalculate}
                  onNewGame={startNewGame}
                />
                <RecoveryPanel tasks={recoveryTasks} onComplete={handleCompleteRecovery} />
              </>
            )}

            {tab === "history" && (
              <div className="lg:col-span-2">
                <HistoryPanel
                  conditions={historicalConditions}
                  sessions={pastSessions}
                  onLoadSession={loadSession}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
