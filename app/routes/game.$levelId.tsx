import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { getDb, getAll, getOne } from "~/lib/db";
import type { Level, WaferImage, DefectAnnotation, DefectType, GameSession } from "~/lib/db";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const db = await getDb();
  const levelId = Number(params.levelId);
  const level = getOne<Level>(db, "SELECT * FROM levels WHERE id = ?", [levelId]);
  if (!level) {
    throw new Response("关卡未找到", { status: 404 });
  }
  const images = getAll<WaferImage>(db, "SELECT * FROM wafer_images WHERE level_id = ?", [levelId]);

  const url = new URL(request.url);
  const playerId = Number(url.searchParams.get("playerId")) || 1;

  let existingSession: GameSession | null = null;
  const inProgress = getOne<GameSession>(
    db,
    "SELECT * FROM game_sessions WHERE player_id = ? AND level_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1",
    [playerId, levelId]
  );
  if (inProgress) {
    existingSession = inProgress;
  }

  return json({ level, images, existingSession, playerId });
}

type DrawState = {
  isDrawing: boolean;
  startX: number;
  startY: number;
};

const allDefectColors: Record<DefectType, { stroke: string; fill: string; label: string }> = {
  scratch: { stroke: "#ff6b6b", fill: "rgba(255,107,107,0.15)", label: "划伤" },
  particle: { stroke: "#ffd43b", fill: "rgba(255,212,59,0.15)", label: "颗粒" },
  edge: { stroke: "#69db7c", fill: "rgba(105,219,124,0.15)", label: "边缘" },
};

async function saveToHistory(
  sessionId: number,
  operationType: "add" | "remove" | "modify",
  before: DefectAnnotation[] | null,
  after: DefectAnnotation[],
  elapsed: number
) {
  const form = new FormData();
  form.append("id", String(sessionId));
  form.append("annotations_json", JSON.stringify(after));
  form.append("elapsed_seconds", String(elapsed));
  form.append("operation_type", operationType);
  form.append("annotation_before_json", before ? JSON.stringify(before) : "null");
  form.append("annotation_after_json", JSON.stringify(after));
  await fetch("/api/sessions", { method: "PATCH", body: form });
}

export default function Game() {
  const { level, images, existingSession, playerId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const availableDefectTypes: DefectType[] = JSON.parse(level.defect_types);
  const defectColors: Partial<typeof allDefectColors> = {};
  for (const dt of availableDefectTypes) {
    defectColors[dt] = allDefectColors[dt];
  }

  const restoredAnnotations: DefectAnnotation[] = existingSession?.annotations_json
    ? (() => { try { return JSON.parse(existingSession.annotations_json); } catch { return []; } })()
    : [];

  const restoredElapsed = existingSession?.elapsed_seconds ?? 0;
  const restoredTimeLeft = Math.max(0, level.time_limit_seconds - restoredElapsed);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [annotations, setAnnotations] = useState<DefectAnnotation[]>(restoredAnnotations);
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType>(availableDefectTypes[0] ?? "scratch");
  const [drawState, setDrawState] = useState<DrawState>({ isDrawing: false, startX: 0, startY: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [undoStack, setUndoStack] = useState<DefectAnnotation[][]>([restoredAnnotations]);
  const [redoStack, setRedoStack] = useState<DefectAnnotation[][]>([]);
  const [timeLeft, setTimeLeft] = useState(restoredTimeLeft);
  const [sessionId, setSessionId] = useState<number | null>(existingSession?.id ?? null);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentImage = images[currentImageIndex];
  const imageConfig = currentImage
    ? (() => { try { return JSON.parse(currentImage.image_data); } catch { return null; } })()
    : null;

  useEffect(() => {
    if (submitted || restoredTimeLeft === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (sessionId && !submitted) {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setInterval(() => {
        saveToHistory(
          sessionId,
          "modify",
          annotations,
          annotations,
          level.time_limit_seconds - timeLeft
        );
      }, 10000);
      return () => {
        if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      };
    }
  }, [sessionId, submitted]);

  const getSvgCoords = useCallback(
    (e: React.MouseEvent) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  async function ensureSession(): Promise<number> {
    if (sessionId) return sessionId;
    const sessionForm = new FormData();
    sessionForm.append("playerId", String(playerId));
    sessionForm.append("levelId", String(level.id));
    const sessionRes = await fetch("/api/sessions", {
      method: "POST",
      body: sessionForm,
    });
    const sessionData = await sessionRes.json();
    setSessionId(sessionData.id);
    return sessionData.id;
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (submitted) return;
    const { x, y } = getSvgCoords(e);
    setDrawState({ isDrawing: true, startX: x, startY: y });
    setCurrentRect(null);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!drawState.isDrawing || submitted) return;
    const { x, y } = getSvgCoords(e);
    setCurrentRect({
      x: Math.min(drawState.startX, x),
      y: Math.min(drawState.startY, y),
      width: Math.abs(x - drawState.startX),
      height: Math.abs(y - drawState.startY),
    });
  }

  async function handleMouseUp() {
    if (!drawState.isDrawing || submitted) return;
    const beforeAnnotations = [...annotations];
    setDrawState({ isDrawing: false, startX: 0, startY: 0 });

    if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
      const newAnnotation: DefectAnnotation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: selectedDefectType,
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      setUndoStack([...undoStack, newAnnotations]);
      setRedoStack([]);

      const sid = await ensureSession();
      saveToHistory(
        sid,
        "add",
        beforeAnnotations,
        newAnnotations,
        level.time_limit_seconds - timeLeft
      );
    }
    setCurrentRect(null);
  }

  async function handleUndo() {
    if (undoStack.length <= 1) return;
    const beforeAnnotations = [...annotations];
    const newUndoStack = [...undoStack];
    const current = newUndoStack.pop()!;
    setUndoStack(newUndoStack);
    setRedoStack([...redoStack, current]);
    const restored = newUndoStack[newUndoStack.length - 1] || [];
    setAnnotations(restored);

    if (sessionId) {
      saveToHistory(
        sessionId,
        "remove",
        beforeAnnotations,
        restored,
        level.time_limit_seconds - timeLeft
      );
    }
  }

  async function handleRedo() {
    if (redoStack.length === 0) return;
    const beforeAnnotations = [...annotations];
    const newRedoStack = [...redoStack];
    const restored = newRedoStack.pop()!;
    setRedoStack(newRedoStack);
    setUndoStack([...undoStack, restored]);
    setAnnotations(restored);

    if (sessionId) {
      saveToHistory(
        sessionId,
        "add",
        beforeAnnotations,
        restored,
        level.time_limit_seconds - timeLeft
      );
    }
  }

  async function handleClear() {
    if (annotations.length === 0) return;
    const beforeAnnotations = [...annotations];
    setUndoStack([...undoStack, []]);
    setRedoStack([]);
    setAnnotations([]);

    const sid = await ensureSession();
    saveToHistory(
      sid,
      "remove",
      beforeAnnotations,
      [],
      level.time_limit_seconds - timeLeft
    );
  }

  async function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    setSubmitError(null);
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);

    try {
      const sid = await ensureSession();
      const elapsed = level.time_limit_seconds - timeLeft;

      const submitForm = new FormData();
      submitForm.append("sessionId", String(sid));
      submitForm.append("annotations_json", JSON.stringify(annotations));
      submitForm.append("elapsed_seconds", String(elapsed));

      const res = await fetch("/api/submit", {
        method: "POST",
        body: submitForm,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "提交失败" }));
        setSubmitError(errData.error || "提交失败");
        setSubmitted(false);
        return;
      }

      navigate(`/result/${sid}`);
    } catch (err) {
      setSubmitError("网络错误，请重试");
      setSubmitted(false);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const timeWarning = timeLeft <= 30;
  const isRestored = existingSession !== null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-wafer-300">{level.name}</h1>
          <span className="text-sm text-gray-500">
            图像 {currentImageIndex + 1} / {images.length}
            {isRestored && (
              <span className="ml-3 text-yellow-400">● 已恢复上次进度</span>
            )}
          </span>
        </div>
        <div
          className={`font-mono text-2xl font-bold px-4 py-1 rounded-lg ${
            timeWarning
              ? "bg-red-900/50 text-red-400 animate-pulse"
              : "bg-gray-800 text-wafer-300"
          }`}
        >
          {timeDisplay}
        </div>
      </header>

      {submitError && (
        <div className="bg-red-900/80 text-red-200 text-center py-2 text-sm">
          {submitError}
        </div>
      )}

      <div className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div className="canvas-container" style={{ cursor: submitted ? "default" : "crosshair" }}>
            <svg
              ref={svgRef}
              width={imageConfig?.gridCols * imageConfig?.cellSize || 480}
              height={imageConfig?.gridRows * imageConfig?.cellSize || 480}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <rect width="100%" height="100%" fill="#0a0a1a" />
              {imageConfig &&
                Array.from({ length: imageConfig.gridRows }).map((_, r) =>
                  Array.from({ length: imageConfig.gridCols }).map((_, c) => (
                    <circle
                      key={`${r}-${c}`}
                      cx={c * imageConfig.cellSize + imageConfig.cellSize / 2}
                      cy={r * imageConfig.cellSize + imageConfig.cellSize / 2}
                      r={imageConfig.cellSize / 2 - 4}
                      fill="none"
                      stroke="#1a2744"
                      strokeWidth={1}
                    />
                  ))
                )}
              {annotations.map((ann) => (
                <g key={ann.id}>
                  <rect
                    x={ann.x}
                    y={ann.y}
                    width={ann.width}
                    height={ann.height}
                    fill={allDefectColors[ann.type]?.fill || "rgba(255,255,255,0.1)"}
                    stroke={allDefectColors[ann.type]?.stroke || "#ffffff"}
                    strokeWidth={2}
                    strokeDasharray={ann.type === "scratch" ? "6 3" : undefined}
                  />
                  <text
                    x={ann.x + 4}
                    y={ann.y - 4}
                    fill={allDefectColors[ann.type]?.stroke || "#ffffff"}
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {allDefectColors[ann.type]?.label || ann.type}
                  </text>
                </g>
              ))}
              {currentRect && (
                <rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  fill={allDefectColors[selectedDefectType]?.fill || "rgba(255,255,255,0.1)"}
                  stroke={allDefectColors[selectedDefectType]?.stroke || "#ffffff"}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
            </svg>
          </div>
        </div>

        <aside className="w-72 bg-gray-900 border-l border-gray-800 p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              缺陷类型
            </h3>
            <div className="flex flex-col gap-2">
              {availableDefectTypes.map((dt) => (
                <button
                  key={dt}
                  onClick={() => setSelectedDefectType(dt)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    selectedDefectType === dt
                      ? dt === "scratch"
                        ? "bg-red-900/40 border-red-500 text-red-300"
                        : dt === "particle"
                        ? "bg-yellow-900/40 border-yellow-500 text-yellow-300"
                        : "bg-green-900/40 border-green-500 text-green-300"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750"
                  }`}
                >
                  {allDefectColors[dt].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              标注统计
            </h3>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">总标注</span>
                <span className="text-wafer-300 font-mono">{annotations.length}</span>
              </div>
              {availableDefectTypes.map((dt) => (
                <div key={dt} className="flex justify-between">
                  <span className="text-gray-500">{allDefectColors[dt].label}</span>
                  <span className="font-mono" style={{ color: allDefectColors[dt].stroke }}>
                    {annotations.filter((a) => a.type === dt).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length <= 1 || submitted}
              className="flex-1 rounded-lg bg-gray-800 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              撤销
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0 || submitted}
              className="flex-1 rounded-lg bg-gray-800 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              重做
            </button>
          </div>

          <button
            onClick={handleClear}
            disabled={annotations.length === 0 || submitted}
            className="rounded-lg bg-gray-800 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            清空标注
          </button>

          {images.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1);
                }}
                disabled={currentImageIndex === 0}
                className="flex-1 rounded-lg bg-gray-800 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一张
              </button>
              <button
                onClick={() => {
                  if (currentImageIndex < images.length - 1) setCurrentImageIndex(currentImageIndex + 1);
                }}
                disabled={currentImageIndex === images.length - 1}
                className="flex-1 rounded-lg bg-gray-800 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一张
              </button>
            </div>
          )}

          <div className="mt-auto">
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className="w-full rounded-lg bg-wafer-600 py-3 text-base font-semibold text-white hover:bg-wafer-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitted ? "提交中..." : "提交判读"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
