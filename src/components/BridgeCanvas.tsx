"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { PaperSegment, Point, FoldType, Level } from "@/types/game";

interface BridgeCanvasProps {
  segments: PaperSegment[];
  selectedSegmentId: string | null;
  onSelectSegment: (id: string | null) => void;
  onAddSegment: (start: Point, end: Point, foldType: FoldType) => void;
  onMoveSegment: (id: string, start: Point, end: Point) => void;
  level: Level;
  foldType: FoldType;
  mode: "add" | "select" | "move";
  isSimulating?: boolean;
  breakPoint: Point | null;
  breakSegmentId: string | null;
  weightOnBridge?: number;
  stressMap?: { segmentId: string; maxStress: number }[];
  maxStressThreshold?: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 350;

function getFoldColor(foldType: FoldType): string {
  switch (foldType) {
    case "flat":
      return "#d49a42";
    case "valley":
      return "#a5652c";
    case "mountain":
      return "#c68133";
    case "tube":
      return "#6c4426";
    case "triangle":
      return "#85512b";
    default:
      return "#d49a42";
  }
}

function getFoldLabel(foldType: FoldType): string {
  switch (foldType) {
    case "flat":
      return "平折";
    case "valley":
      return "谷折";
    case "mountain":
      return "山折";
    case "tube":
      return "筒状";
    case "triangle":
      return "三角";
    default:
      return "";
  }
}

function getStressColor(stressRatio: number): string {
  if (stressRatio < 0.3) return "#4ade80";
  if (stressRatio < 0.6) return "#fbbf24";
  if (stressRatio < 0.9) return "#f97316";
  return "#ef4444";
}

export function BridgeCanvas({
  segments,
  selectedSegmentId,
  onSelectSegment,
  onAddSegment,
  onMoveSegment,
  level,
  foldType,
  mode,
  isSimulating = false,
  breakPoint,
  breakSegmentId,
  weightOnBridge = 0,
  stressMap = [],
  maxStressThreshold = 1000,
}: BridgeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [dragging, setDragging] = useState<{
    segmentId: string;
    handle: "start" | "end" | "middle";
    offset: Point;
  } | null>(null);

  const scaleX = CANVAS_WIDTH / 320;
  const scaleY = CANVAS_HEIGHT / 300;

  const svgToGame = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / scaleX;
      const y = (clientY - rect.top) / scaleY;
      return { x, y };
    },
    [scaleX, scaleY]
  );

  const snapToAnchor = useCallback(
    (point: Point): Point => {
      const threshold = 15;
      const leftDist = Math.sqrt(
        (point.x - level.leftAnchor.x) ** 2 + (point.y - level.leftAnchor.y) ** 2
      );
      const rightDist = Math.sqrt(
        (point.x - level.rightAnchor.x) ** 2 + (point.y - level.rightAnchor.y) ** 2
      );

      if (leftDist < threshold) return { ...level.leftAnchor };
      if (rightDist < threshold) return { ...level.rightAnchor };
      return point;
    },
    [level.leftAnchor, level.rightAnchor]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isSimulating) return;

      const point = snapToAnchor(svgToGame(e.clientX, e.clientY));

      if (mode === "add") {
        setDrawStart(point);
      }
    },
    [mode, isSimulating, svgToGame, snapToAnchor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const point = snapToAnchor(svgToGame(e.clientX, e.clientY));
      setMousePos(point);

      if (dragging && mode === "select") {
        const seg = segments.find((s) => s.id === dragging.segmentId);
        if (!seg) return;

        if (dragging.handle === "start") {
          onMoveSegment(seg.id, point, seg.end);
        } else if (dragging.handle === "end") {
          onMoveSegment(seg.id, seg.start, point);
        } else if (dragging.handle === "middle") {
          const dx = point.x - (seg.start.x + seg.end.x) / 2;
          const dy = point.y - (seg.start.y + seg.end.y) / 2;
          onMoveSegment(
            seg.id,
            { x: seg.start.x + dx, y: seg.start.y + dy },
            { x: seg.end.x + dx, y: seg.end.y + dy }
          );
        }
      }
    },
    [dragging, mode, segments, onMoveSegment, svgToGame, snapToAnchor]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isSimulating) return;

      if (mode === "add" && drawStart) {
        const endPoint = snapToAnchor(svgToGame(e.clientX, e.clientY));
        const dist = Math.sqrt(
          (endPoint.x - drawStart.x) ** 2 + (endPoint.y - drawStart.y) ** 2
        );
        if (dist > 10) {
          onAddSegment(drawStart, endPoint, foldType);
        }
        setDrawStart(null);
      }

      if (dragging) {
        setDragging(null);
      }
    },
    [mode, drawStart, isSimulating, onAddSegment, foldType, svgToGame, snapToAnchor, dragging]
  );

  const handleSegmentClick = useCallback(
    (e: React.MouseEvent, segmentId: string) => {
      e.stopPropagation();
      if (mode === "select") {
        onSelectSegment(selectedSegmentId === segmentId ? null : segmentId);
      }
    },
    [mode, selectedSegmentId, onSelectSegment]
  );

  const handleHandleMouseDown = useCallback(
    (e: React.MouseEvent, segmentId: string, handle: "start" | "end") => {
      e.stopPropagation();
      if (mode === "select") {
        onSelectSegment(segmentId);
        const point = svgToGame(e.clientX, e.clientY);
        const seg = segments.find((s) => s.id === segmentId);
        if (seg) {
          const handlePos = handle === "start" ? seg.start : seg.end;
          setDragging({
            segmentId,
            handle,
            offset: { x: point.x - handlePos.x, y: point.y - handlePos.y },
          });
        }
      }
    },
    [mode, segments, onSelectSegment, svgToGame]
  );

  const handleSegmentMouseDown = useCallback(
    (e: React.MouseEvent, segmentId: string) => {
      e.stopPropagation();
      if (mode === "select") {
        onSelectSegment(segmentId);
        const point = svgToGame(e.clientX, e.clientY);
        const seg = segments.find((s) => s.id === segmentId);
        if (seg) {
          setDragging({
            segmentId,
            handle: "middle",
            offset: {
              x: point.x - (seg.start.x + seg.end.x) / 2,
              y: point.y - (seg.start.y + seg.end.y) / 2,
            },
          });
        }
      }
    },
    [mode, onSelectSegment, svgToGame, segments]
  );

  const getSegmentStressRatio = (segmentId: string): number => {
    const entry = stressMap.find((s) => s.segmentId === segmentId);
    if (!entry || maxStressThreshold === 0) return 0;
    return Math.min(1, entry.maxStress / maxStressThreshold);
  };

  useEffect(() => {
    if (mode !== "select") {
      setDragging(null);
    }
  }, [mode]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="bg-gradient-to-b from-sky-100 to-sky-200 rounded-lg border-2 border-amber-700 cursor-crosshair shadow-inner"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setMousePos(null);
          setDragging(null);
          if (drawStart) setDrawStart(null);
        }}
      >
        <defs>
          <pattern
            id="paperTexture"
            patternUnits="userSpaceOnUse"
            width="8"
            height="8"
          >
            <rect width="8" height="8" fill="#fdfaf5" />
            <circle cx="2" cy="2" r="0.5" fill="rgba(133,81,43,0.05)" />
            <circle cx="6" cy="5" r="0.3" fill="rgba(133,81,43,0.05)" />
          </pattern>
        </defs>

        <g transform={`scale(${scaleX}, ${scaleY})`}>
          <rect
            x={0}
            y={240}
            width={320}
            height={60}
            fill="#6b8e6b"
            opacity={0.8}
          />

          <rect
            x={level.leftAnchor.x - 25}
            y={level.leftAnchor.y}
            width={30}
            height={50}
            fill="#4a4a4a"
            stroke="#2a2a2a"
            strokeWidth={1}
          />
          <rect
            x={level.leftAnchor.x - 30}
            y={level.leftAnchor.y - 5}
            width={40}
            height={8}
            fill="#696969"
            stroke="#333"
            strokeWidth={1}
          />

          <rect
            x={level.rightAnchor.x - 5}
            y={level.rightAnchor.y}
            width={30}
            height={50}
            fill="#4a4a4a"
            stroke="#2a2a2a"
            strokeWidth={1}
          />
          <rect
            x={level.rightAnchor.x - 10}
            y={level.rightAnchor.y - 5}
            width={40}
            height={8}
            fill="#696969"
            stroke="#333"
            strokeWidth={1}
          />

          {segments.map((seg) => {
            const isSelected = seg.id === selectedSegmentId;
            const isBroken = seg.id === breakSegmentId;
            const stressRatio = isSimulating ? getSegmentStressRatio(seg.id) : 0;
            const strokeColor = isSimulating
              ? getStressColor(stressRatio)
              : getFoldColor(seg.foldType);

            const midX = (seg.start.x + seg.end.x) / 2;
            const midY = (seg.start.y + seg.end.y) / 2;
            const angle = (Math.atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x) * 180) / Math.PI;

            return (
              <g key={seg.id}>
                <line
                  x1={seg.start.x}
                  y1={seg.start.y}
                  x2={seg.end.x}
                  y2={seg.end.y}
                  stroke={strokeColor}
                  strokeWidth={seg.foldType === "tube" ? 4 : seg.foldType === "triangle" ? 3.5 : 3}
                  strokeLinecap="round"
                  className={`cursor-pointer transition-all ${isBroken ? "stroke-red-600" : ""}`}
                  onClick={(e) => handleSegmentClick(e, seg.id)}
                  onMouseDown={(e) => handleSegmentMouseDown(e, seg.id)}
                />

                {isSelected && mode === "select" && (
                  <>
                    <circle
                      cx={seg.start.x}
                      cy={seg.start.y}
                      r={4}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={1}
                      className="cursor-move"
                      onMouseDown={(e) => handleHandleMouseDown(e, seg.id, "start")}
                    />
                    <circle
                      cx={seg.end.x}
                      cy={seg.end.y}
                      r={4}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={1}
                      className="cursor-move"
                      onMouseDown={(e) => handleHandleMouseDown(e, seg.id, "end")}
                    />
                  </>
                )}

                {isSelected && (
                  <g transform={`translate(${midX}, ${midY - 12}) rotate(${-angle})`}>
                    <rect
                      x={-20}
                      y={-8}
                      width={40}
                      height={14}
                      fill="rgba(255,255,255,0.9)"
                      rx={2}
                      stroke="#d49a42"
                      strokeWidth={0.5}
                    />
                    <text
                      x={0}
                      y={2}
                      fontSize={7}
                      fill="#6c4426"
                      textAnchor="middle"
                      fontFamily="Georgia, serif"
                    >
                      {getFoldLabel(seg.foldType)} {seg.length.toFixed(0)}mm
                    </text>
                  </g>
                )}

                {isBroken && breakPoint && (
                  <g transform={`translate(${breakPoint.x}, ${breakPoint.y})`}>
                    <line
                      x1={-8}
                      y1={-6}
                      x2={8}
                      y2={6}
                      stroke="#ef4444"
                      strokeWidth={2}
                      className="crack-animation"
                    />
                    <line
                      x1={-5}
                      y1={6}
                      x2={5}
                      y2={-4}
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      className="crack-animation"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {drawStart && mousePos && mode === "add" && (
            <line
              x1={drawStart.x}
              y1={drawStart.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke={getFoldColor(foldType)}
              strokeWidth={3}
              strokeDasharray="4,3"
              strokeLinecap="round"
              opacity={0.7}
            />
          )}

          {weightOnBridge > 0 && (
            <g transform={`translate(${160}, ${50})`}>
              <rect
                x={-20}
                y={-15}
                width={40}
                height={20}
                fill="#fbbf24"
                stroke="#d97706"
                strokeWidth={1}
                rx={3}
              />
              <text
                x={0}
                y={-1}
                fontSize={10}
                fill="#78350f"
                textAnchor="middle"
                fontWeight="bold"
                fontFamily="Georgia, serif"
              >
                {weightOnBridge.toFixed(0)}g
              </text>
              <line
                x1={0}
                y1={5}
                x2={0}
                y2={100}
                stroke="#92400e"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
            </g>
          )}

          <text
            x={level.leftAnchor.x - 10}
            y={level.leftAnchor.y - 12}
            fontSize={9}
            fill="#4a4a4a"
            textAnchor="middle"
            fontFamily="Georgia, serif"
          >
            左桥墩
          </text>
          <text
            x={level.rightAnchor.x + 10}
            y={level.rightAnchor.y - 12}
            fontSize={9}
            fill="#4a4a4a"
            textAnchor="middle"
            fontFamily="Georgia, serif"
          >
            右桥墩
          </text>
        </g>
      </svg>

      <div className="absolute bottom-2 left-2 text-xs text-amber-800 bg-white/70 px-2 py-1 rounded">
        跨度: {level.span}mm
      </div>

      {mode === "add" && (
        <div className="absolute top-2 right-2 text-xs text-amber-800 bg-white/70 px-2 py-1 rounded">
          点击拖动绘制纸段
        </div>
      )}
      {mode === "select" && (
        <div className="absolute top-2 right-2 text-xs text-amber-800 bg-white/70 px-2 py-1 rounded">
          点击选择并拖动调整
        </div>
      )}
    </div>
  );
}
