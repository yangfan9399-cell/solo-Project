import { useEffect, useMemo, useState } from "react";
import type {
  ExhibitDef,
  GameSession,
  HeatmapCell,
  LevelConfig,
  LightSource,
  PlacedExhibit,
  ScoreBreakdown,
} from "~/types";

type Tool = "select" | "exhibit" | "light" | "remove";

interface Props {
  level: LevelConfig;
  exhibitDefs: Record<string, ExhibitDef>;
  session: GameSession;
  onApply: (
    exhibits: PlacedExhibit[],
    lights: LightSource[],
    opType: string,
    opData: Record<string, unknown>
  ) => void;
  onComplete: (score: number) => void;
  onQuit: () => void;
}

interface ExhibitDetailInfo {
  id: string;
  defId: string;
  lightLevel: number;
  safe: boolean;
  safetyScore: number;
}

export function GameBoard({
  level,
  exhibitDefs,
  session,
  onApply,
  onComplete,
  onQuit,
}: Props) {
  const CELL = 48;

  const [exhibits, setExhibits] = useState<PlacedExhibit[]>(session.exhibits);
  const [lights, setLights] = useState<LightSource[]>(session.lights);
  const [tool, setTool] = useState<Tool>("select");
  const [selectedExhibitDef, setSelectedExhibitDef] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightIntensity, setLightIntensity] = useState(60);
  const [lightRadius, setLightRadius] = useState(4);
  const [heatmap, setHeatmap] = useState<number[][]>([]);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [exhibitDetails, setExhibitDetails] = useState<ExhibitDetailInfo[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [history, setHistory] = useState<{ exhibits: PlacedExhibit[]; lights: LightSource[] }[]>(
    []
  );

  const pathSet = useMemo(
    () => new Set(level.pathCells.map((p) => `${p.x},${p.y}`)),
    [level]
  );

  useEffect(() => {
    recalcScore();
  }, [exhibits, lights]);

  async function recalcScore() {
    setCalculating(true);
    const fd = new FormData();
    fd.append("sessionId", session.id);
    fd.append("exhibits", JSON.stringify(exhibits));
    fd.append("lights", JSON.stringify(lights));
    const res = await fetch("/api/score", { method: "POST", body: fd }).then((r) =>
      r.json()
    );
    if (res.score) {
      setScore(res.score);
      setHeatmap(res.heatmap);
      setExhibitDetails(res.exhibitDetails || []);
    }
    setCalculating(false);
  }

  function pushHistory() {
    setHistory((h) => [...h, { exhibits: JSON.parse(JSON.stringify(exhibits)), lights: JSON.parse(JSON.stringify(lights)) }]);
  }

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setExhibits(last.exhibits);
    setLights(last.lights);
    setHistory((h) => h.slice(0, -1));
  }

  function isValidPosition(x: number, y: number, size: { w: number; h: number }, selfId?: string): boolean {
    if (x < 0 || y < 0 || x + size.w > level.gridW || y + size.h > level.gridH) return false;
    const occupied = new Set<string>();
    for (const p of exhibits) {
      if (selfId && p.id === selfId) continue;
      const def = exhibitDefs[p.defId];
      if (!def) continue;
      for (let dy = 0; dy < def.size.h; dy++) {
        for (let dx = 0; dx < def.size.w; dx++) {
          occupied.add(`${p.x + dx},${p.y + dy}`);
        }
      }
    }
    for (let dy = 0; dy < size.h; dy++) {
      for (let dx = 0; dx < size.w; dx++) {
        const key = `${x + dx},${y + dy}`;
        if (occupied.has(key) || pathSet.has(key)) return false;
      }
    }
    return true;
  }

  function handleCellClick(x: number, y: number) {
    if (tool === "exhibit" && selectedExhibitDef) {
      const def = exhibitDefs[selectedExhibitDef];
      if (!def) return;
      if (!isValidPosition(x, y, def.size)) return;
      pushHistory();
      const newEx: PlacedExhibit = {
        id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        defId: selectedExhibitDef,
        x,
        y,
      };
      const next = [...exhibits, newEx];
      setExhibits(next);
      onApply(next, lights, "PLACE_EXHIBIT", { exhibit: newEx });
    } else if (tool === "light") {
      if (lights.length >= level.availableLights) return;
      if (pathSet.has(`${x},${y}`)) return;
      pushHistory();
      const newLight: LightSource = {
        id: `lt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x,
        y,
        intensity: lightIntensity,
        radius: lightRadius,
      };
      const next = [...lights, newLight];
      setLights(next);
      onApply(exhibits, next, "PLACE_LIGHT", { light: newLight });
    } else if (tool === "select") {
      const ex = exhibits.find((e) => {
        const def = exhibitDefs[e.defId];
        return def && x >= e.x && x < e.x + def.size.w && y >= e.y && y < e.y + def.size.h;
      });
      const lt = lights.find((l) => l.x === x && l.y === y);
      if (ex) setSelectedId(ex.id);
      else if (lt) setSelectedId(lt.id);
      else setSelectedId(null);
    } else if (tool === "remove") {
      const exIdx = exhibits.findIndex((e) => {
        const def = exhibitDefs[e.defId];
        return def && x >= e.x && x < e.x + def.size.w && y >= e.y && y < e.y + def.size.h;
      });
      if (exIdx >= 0) {
        pushHistory();
        const removed = exhibits[exIdx];
        const next = exhibits.filter((_, i) => i !== exIdx);
        setExhibits(next);
        onApply(next, lights, "REMOVE_EXHIBIT", { id: removed.id });
        return;
      }
      const ltIdx = lights.findIndex((l) => l.x === x && l.y === y);
      if (ltIdx >= 0) {
        pushHistory();
        const removed = lights[ltIdx];
        const next = lights.filter((_, i) => i !== ltIdx);
        setLights(next);
        onApply(exhibits, next, "REMOVE_LIGHT", { id: removed.id });
      }
    }
  }

  function updateSelectedLight() {
    if (!selectedId) return;
    const idx = lights.findIndex((l) => l.id === selectedId);
    if (idx < 0) return;
    pushHistory();
    const next = [...lights];
    next[idx] = { ...next[idx], intensity: lightIntensity, radius: lightRadius };
    setLights(next);
    onApply(exhibits, next, "ADJUST_LIGHT", {
      id: selectedId,
      intensity: lightIntensity,
      radius: lightRadius,
    });
  }

  const selectedExhibit = selectedId ? exhibits.find((e) => e.id === selectedId) : null;
  const selectedLight = selectedId ? lights.find((l) => l.id === selectedId) : null;

  useEffect(() => {
    if (selectedLight) {
      setLightIntensity(selectedLight.intensity);
      setLightRadius(selectedLight.radius);
    }
  }, [selectedId]);

  function heatColor(v: number): string {
    if (v <= 0) return "rgba(0,0,0,0)";
    if (v < 20) return `rgba(0, 80, 180, ${v / 60})`;
    if (v < 45) return `rgba(0, 180, 120, ${v / 80})`;
    if (v < 70) return `rgba(255, 200, 0, ${v / 120})`;
    return `rgba(255, 80, 50, ${Math.min(0.7, v / 100)})`;
  }

  const totalLight = lights.reduce((s, l) => s + l.intensity * l.radius, 0);
  const allExhibitsPlaced = exhibits.length > 0 && exhibitDetails.every((d) => d.safe);

  return (
    <div style={{ display: "flex", gap: 16, height: "100%" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, color: "#ffd88a" }}>{level.name}</h2>
            <p style={{ fontSize: 13, color: "#666" }}>{level.description}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={undo} disabled={history.length === 0} style={btnStyle("#555", "#fff")}>
              ↶ 撤销
            </button>
            <button onClick={() => setShowHeatmap(!showHeatmap)} style={btnStyle("#333", "#fff")}>
              {showHeatmap ? "隐藏" : "显示"}热图
            </button>
            <button onClick={onQuit} style={btnStyle("#884444", "#fff")}>
              退出
            </button>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background: "#0d0d15",
            borderRadius: 8,
            padding: 12,
            border: "1px solid #252535",
            display: "inline-block",
          }}
        >
          <div
            style={{
              position: "relative",
              width: level.gridW * CELL,
              height: level.gridH * CELL,
              background: "#13131d",
            }}
          >
            {Array.from({ length: level.gridH }).map((_, y) =>
              Array.from({ length: level.gridW }).map((_, x) => {
                const isPath = pathSet.has(`${x},${y}`);
                const isEntrance = level.entrance.x === x && level.entrance.y === y;
                const isExit = level.exit.x === x && level.exit.y === y;
                const heat = heatmap[y]?.[x] ?? 0;
                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    style={{
                      position: "absolute",
                      left: x * CELL,
                      top: y * CELL,
                      width: CELL,
                      height: CELL,
                      border: "1px solid #1e1e2a",
                      background: isEntrance
                        ? "rgba(80, 200, 120, 0.25)"
                        : isExit
                        ? "rgba(200, 80, 120, 0.25)"
                        : isPath
                        ? "#1a1a28"
                        : "#13131d",
                      cursor: tool === "select" ? "pointer" : "crosshair",
                      boxShadow: showHeatmap ? `inset 0 0 ${Math.min(40, heat * 0.5)}px ${heatColor(heat)}` : "none",
                    }}
                  >
                    {isEntrance && (
                      <span style={cellLabelStyle()}>入口</span>
                    )}
                    {isExit && (
                      <span style={cellLabelStyle()}>出口</span>
                    )}
                  </div>
                );
              })
            )}

            {exhibits.map((ex) => {
              const def = exhibitDefs[ex.defId];
              if (!def) return null;
              const detail = exhibitDetails.find((d) => d.id === ex.id);
              const isSelected = selectedId === ex.id;
              return (
                <div
                  key={ex.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool === "select") setSelectedId(ex.id);
                    else if (tool === "remove") handleCellClick(ex.x, ex.y);
                  }}
                  style={{
                    position: "absolute",
                    left: ex.x * CELL + 2,
                    top: ex.y * CELL + 2,
                    width: def.size.w * CELL - 4,
                    height: def.size.h * CELL - 4,
                    background: detail?.safe ? "rgba(80, 160, 100, 0.35)" : "rgba(180, 80, 80, 0.35)",
                    border: isSelected ? "2px solid #ffd88a" : `2px solid ${detail?.safe ? "#6aaa88" : "#aa6666"}`,
                    borderRadius: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: tool === "remove" ? "not-allowed" : "pointer",
                    fontSize: 12,
                    color: "#fff",
                    pointerEvents: tool === "exhibit" || tool === "light" ? "none" : "auto",
                  }}
                >
                  <div style={{ fontSize: 20 }}>{exhibitEmoji(def.type)}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>{def.name}</div>
                  {detail && (
                    <div style={{ fontSize: 10, color: detail.safe ? "#aaffcc" : "#ffaaaa", marginTop: 2 }}>
                      💡 {detail.lightLevel}
                    </div>
                  )}
                </div>
              );
            })}

            {lights.map((l) => {
              const isSelected = selectedId === l.id;
              return (
                <div
                  key={l.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool === "select") setSelectedId(l.id);
                    else if (tool === "remove") handleCellClick(l.x, l.y);
                  }}
                  style={{
                    position: "absolute",
                    left: l.x * CELL + CELL / 2 - 14,
                    top: l.y * CELL + CELL / 2 - 14,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isSelected ? "#ffd88a" : `rgba(255, 220, 100, ${l.intensity / 120 + 0.3})`,
                    border: isSelected ? "3px solid #fff" : "2px solid #ffaa44",
                    boxShadow: `0 0 ${l.intensity / 3}px ${l.intensity / 2}px rgba(255, 200, 80, ${l.intensity / 200})`,
                    cursor: tool === "remove" ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5,
                  }}
                >
                  <span style={{ fontSize: 14 }}>💡</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={panelStyle()}>
          <h3 style={{ fontSize: 15, marginBottom: 10, color: "#ffd88a" }}>🛠️ 工具</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            <button onClick={() => setTool("select")} style={toolBtnStyle(tool === "select")}>
              👆 选择
            </button>
            <button onClick={() => setTool("remove")} style={toolBtnStyle(tool === "remove")}>
              🗑️ 移除
            </button>
            <button onClick={() => setTool("exhibit")} style={toolBtnStyle(tool === "exhibit")}>
              🖼️ 放展品
            </button>
            <button onClick={() => setTool("light")} style={toolBtnStyle(tool === "light")}>
              💡 放灯光
            </button>
          </div>
        </div>

        {tool === "exhibit" && (
          <div style={panelStyle()}>
            <h3 style={{ fontSize: 15, marginBottom: 10, color: "#ffd88a" }}>🖼️ 选择展品</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {level.availableExhibits.map((id) => {
                const def = exhibitDefs[id];
                if (!def) return null;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedExhibitDef(id)}
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderRadius: 6,
                      border: selectedExhibitDef === id ? "2px solid #ffd88a" : "1px solid #333",
                      background: selectedExhibitDef === id ? "#2a2515" : "#1a1a24",
                      color: "#ccc",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>
                        {exhibitEmoji(def.type)} {def.name}
                      </span>
                      <span style={{ fontSize: 11, color: "#888" }}>
                        {def.size.w}×{def.size.h}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
                      适宜光线: {def.lightMin}-{def.lightMax} | 敏感: {def.sensitivity.toFixed(1)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tool === "light" && (
          <div style={panelStyle()}>
            <h3 style={{ fontSize: 15, marginBottom: 10, color: "#ffd88a" }}>
              💡 灯光 ({lights.length}/{level.availableLights})
            </h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "#aaa", display: "block", marginBottom: 4 }}>
                强度: {lightIntensity}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "#aaa", display: "block", marginBottom: 4 }}>
                范围: {lightRadius}
              </label>
              <input
                type="range"
                min={1}
                max={8}
                value={lightRadius}
                onChange={(e) => setLightRadius(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <p style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
              点击网格放置灯光（避开路径）
            </p>
          </div>
        )}

        {selectedLight && tool === "select" && (
          <div style={panelStyle()}>
            <h3 style={{ fontSize: 15, marginBottom: 10, color: "#ffd88a" }}>💡 调整灯光</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "#aaa", display: "block", marginBottom: 4 }}>
                强度: {lightIntensity}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "#aaa", display: "block", marginBottom: 4 }}>
                范围: {lightRadius}
              </label>
              <input
                type="range"
                min={1}
                max={8}
                value={lightRadius}
                onChange={(e) => setLightRadius(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>
            <button onClick={updateSelectedLight} style={{ ...btnStyle("#4a7cff", "#fff"), width: "100%" }}>
              应用调整
            </button>
          </div>
        )}

        <div style={panelStyle()}>
          <h3 style={{ fontSize: 15, marginBottom: 10, color: "#ffd88a" }}>📊 实时评分</h3>
          {score ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: "#aaa" }}>总分</span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color:
                      score.total >= level.targetScore
                        ? "#88ffaa"
                        : score.total >= level.targetScore * 0.7
                        ? "#ffd88a"
                        : "#ff8888",
                  }}
                >
                  {score.total}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
                目标: {level.targetScore} 分
              </div>
              <ScoreRow label="展品安全" value={score.exhibitSafety} />
              <ScoreRow label="灯光效率" value={score.lightEfficiency} />
              <ScoreRow label="路径可见" value={score.pathVisibility} />
              <ScoreRow label="布局质量" value={score.placementQuality} />
              {score.penalty > 0 && (
                <ScoreRow label="⚠️ 扣分" value={-score.penalty} negative />
              )}
              <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
                灯光总功率: {totalLight}/{level.maxLightTotal}
              </div>
            </div>
          ) : (
            <p style={{ color: "#666", fontSize: 13 }}>正在计算...</p>
          )}
        </div>

        <button
          onClick={() => score && onComplete(score.total)}
          disabled={!score || calculating}
          style={{
            padding: "14px",
            borderRadius: 8,
            border: "none",
            background:
              score && score.total >= level.targetScore && allExhibitsPlaced
                ? "#4aaa6a"
                : "#4a7cff",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {score && score.total >= level.targetScore && allExhibitsPlaced
            ? "🎉 完成布展"
            : "提交结算"}
        </button>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: negative ? "#ff8888" : "#ccc" }}>{value}</span>
    </div>
  );
}

function exhibitEmoji(type: string): string {
  switch (type) {
    case "painting":
      return "🖼️";
    case "sculpture":
      return "🗿";
    case "relic":
      return "🏺";
    case "photograph":
      return "📷";
    default:
      return "🎨";
  }
}

function btnStyle(bg: string, color: string) {
  return {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: bg,
    color,
    fontSize: 13,
    cursor: "pointer" as const,
  };
}

function toolBtnStyle(active: boolean) {
  return {
    padding: "8px",
    borderRadius: 6,
    border: active ? "2px solid #ffd88a" : "1px solid #333",
    background: active ? "#2a2515" : "#1a1a24",
    color: active ? "#ffd88a" : "#aaa",
    fontSize: 13,
    cursor: "pointer" as const,
  };
}

function panelStyle() {
  return {
    background: "#151520",
    borderRadius: 8,
    padding: 14,
    border: "1px solid #252535",
  };
}

function cellLabelStyle() {
  return {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 10,
    color: "#888",
  };
}
