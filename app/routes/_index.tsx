import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import { useState } from "react";
import { getDb, getAll, getOne } from "~/lib/db";
import type { Level, Player } from "~/lib/db";

export async function loader({ request }: LoaderFunctionArgs) {
  const db = await getDb();
  const levels = getAll<Level>(db, "SELECT * FROM levels ORDER BY order_index ASC");

  const url = new URL(request.url);
  const playerId = url.searchParams.get("playerId");
  let player: Player | null = null;
  if (playerId) {
    player = getOne<Player>(db, "SELECT * FROM players WHERE id = ?", [Number(playerId)]) ?? null;
  }

  return json({ levels, player });
}

const defectTypeLabels: Record<string, string> = {
  scratch: "划伤",
  particle: "颗粒",
  edge: "边缘",
};

export default function Index() {
  const { levels, player } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(player);
  const [loading, setLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  async function handleEnter() {
    if (!playerName.trim()) return;
    setLoading(true);
    setPlayerError(null);
    try {
      const form = new FormData();
      form.append("name", playerName.trim());
      const res = await fetch("/api/players", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "创建失败" }));
        setPlayerError(errData.error || "创建失败");
        return;
      }
      const data = (await res.json()) as Player;
      setCurrentPlayer(data);
    } catch {
      setPlayerError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="py-12 text-center">
        <h1 className="text-5xl font-bold text-wafer-400 tracking-wider">
          晶圆缺陷扫描判读游戏
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          扮演晶圆质检工程师，精准识别并标注缺陷，守护芯片良率
        </p>
      </header>

      <section className="max-w-md mx-auto mb-12 px-4">
        {!currentPlayer ? (
          <div>
            <div className="flex gap-3">
              <input
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setPlayerError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleEnter()}
                placeholder="输入工程师代号"
                className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-100 placeholder-gray-500 focus:border-wafer-500 focus:outline-none focus:ring-1 focus:ring-wafer-500"
              />
              <button
                onClick={handleEnter}
                disabled={loading || !playerName.trim()}
                className="rounded-lg bg-wafer-600 px-6 py-3 font-semibold text-white hover:bg-wafer-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "..." : "进入工位"}
              </button>
            </div>
            {playerError && (
              <p className="mt-2 text-sm text-red-400">{playerError}</p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 flex items-center justify-between">
            <div>
              <span className="text-gray-400">工程师：</span>
              <span className="font-semibold text-wafer-300">
                {currentPlayer.name}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-500">总分 </span>
                <span className="text-wafer-400 font-bold">
                  {currentPlayer.total_score}
                </span>
              </div>
              <div>
                <span className="text-gray-500">通关 </span>
                <span className="text-wafer-400 font-bold">
                  {currentPlayer.levels_completed}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-gray-200">选择关卡</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {levels.map((level) => {
            const defectTypes: string[] = JSON.parse(level.defect_types);
            return (
              <Link
                key={level.id}
                to={
                  currentPlayer
                    ? `/game/${level.id}?playerId=${currentPlayer.id}`
                    : "#"
                }
                onClick={(e) => {
                  if (!currentPlayer) {
                    e.preventDefault();
                  }
                }}
                className={`group block rounded-xl border p-5 transition-all ${
                  currentPlayer
                    ? "border-gray-700 bg-gray-900 hover:border-wafer-500 hover:bg-gray-800"
                    : "border-gray-800 bg-gray-900/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-100 group-hover:text-wafer-300">
                    {level.name}
                  </h3>
                  <div className="flex gap-0.5">
                    {Array.from({ length: level.difficulty }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{level.description}</p>
                <div className="flex gap-2 mb-3">
                  {defectTypes.map((dt) => (
                    <span
                      key={dt}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        dt === "scratch"
                          ? "bg-red-900/40 text-red-300"
                          : dt === "particle"
                          ? "bg-yellow-900/40 text-yellow-300"
                          : "bg-green-900/40 text-green-300"
                      }`}
                    >
                      {defectTypeLabels[dt] || dt}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    目标准确率 {(level.target_precision * 100).toFixed(0)}%
                  </span>
                  <span>
                    限时 {level.time_limit_seconds}秒
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
