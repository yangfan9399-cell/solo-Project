"use client";

import { useEffect, useRef, useState } from "react";
import type { TargetPoint } from "@/lib/types";

interface Props {
  points: TargetPoint[];
  archiveId: string;
  onUpdate?: (pts: TargetPoint[]) => void;
  readOnly?: boolean;
}

const RINGS = [
  { r: 1.0, color: "#ffffff", stroke: "#ccc" },
  { r: 0.9, color: "#231f20", stroke: "#000" },
  { r: 0.8, color: "#0051a5", stroke: "#003e7d" },
  { r: 0.7, color: "#e4002b", stroke: "#b00020" },
  { r: 0.6, color: "#f5c518", stroke: "#d4a815" },
  { r: 0.5, color: "#f5c518", stroke: "#d4a815" },
  { r: 0.4, color: "#e4002b", stroke: "#b00020" },
  { r: 0.3, color: "#0051a5", stroke: "#003e7d" },
  { r: 0.2, color: "#231f20", stroke: "#000" },
  { r: 0.1, color: "#f5c518", stroke: "#d4a815" },
];

function calcScore(x: number, y: number): number {
  const d = Math.sqrt(x * x + y * y);
  if (d <= 0.1) return 10;
  if (d <= 0.2) return 9;
  if (d <= 0.3) return 8;
  if (d <= 0.4) return 7;
  if (d <= 0.5) return 6;
  if (d <= 0.6) return 5;
  if (d <= 0.7) return 4;
  if (d <= 0.8) return 3;
  if (d <= 0.9) return 2;
  if (d <= 1.0) return 1;
  return 0;
}

export default function TargetBoard({ points, archiveId, onUpdate, readOnly }: Props) {
  const [local, setLocal] = useState<TargetPoint[]>(points);
  const [distance, setDistance] = useState(points[0]?.distance ?? 70);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setLocal(points);
  }, [points]);

  const savePoints = async (pts: TargetPoint[]) => {
    const res = await fetch(`/api/archives/${archiveId}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pts),
    });
    if (res.ok) {
      const saved = await res.json();
      setLocal(saved);
      onUpdate?.(saved);
    }
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const unit = rect.width / 2.4;
    const x = (e.clientX - rect.left - cx) / unit;
    const y = (e.clientY - rect.top - cy) / unit;
    if (Math.sqrt(x * x + y * y) > 1.15) return;
    const newPoint: TargetPoint = {
      id: "",
      archiveId,
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      score: calcScore(x, y),
      distance,
      arrowNumber: local.length + 1,
      shotAt: new Date().toISOString(),
    };
    const next = [...local, newPoint];
    savePoints(next);
  };

  const removePoint = (idx: number) => {
    if (readOnly) return;
    const next = local.filter((_, i) => i !== idx).map((p, i) => ({ ...p, arrowNumber: i + 1 }));
    savePoints(next);
  };

  const clear = () => {
    if (readOnly) return;
    savePoints([]);
  };

  const total = local.reduce((s, p) => s + p.score, 0);
  const avgX = local.length ? local.reduce((s, p) => s + p.x, 0) / local.length : 0;
  const avgY = local.length ? local.reduce((s, p) => s + p.y, 0) / local.length : 0;
  const spread = local.length
    ? Math.sqrt(local.reduce((s, p) => s + (p.x - avgX) ** 2 + (p.y - avgY) ** 2, 0) / local.length)
    : 0;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg p-3 border border-leather-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-bow-dark">🎯 靶纸标点</h4>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-leather-600">距离(m):</label>
              <input
                type="number"
                className="input !py-1 !w-20 text-sm"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
              />
              <button className="btn btn-secondary !py-1 text-sm" onClick={clear}>清空</button>
            </div>
          )}
        </div>
        <svg
          ref={svgRef}
          viewBox="-1.2 -1.2 2.4 2.4"
          className="w-full aspect-square cursor-crosshair select-none"
          onClick={handleClick}
        >
          {RINGS.map((r, i) => (
            <circle key={i} cx="0" cy="0" r={r.r} fill={r.color} stroke={r.stroke} strokeWidth="0.01" />
          ))}
          <line x1="-1.15" y1="0" x2="1.15" y2="0" stroke="#999" strokeWidth="0.008" />
          <line x1="0" y1="-1.15" x2="0" y2="1.15" stroke="#999" strokeWidth="0.008" />
          {local.length > 0 && (
            <circle cx={avgX} cy={avgY} r={spread} fill="rgba(0,100,200,0.15)" stroke="#0051a5" strokeWidth="0.015" strokeDasharray="0.04 0.04" />
          )}
          {local.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="0.05" fill="#e4002b" stroke="#fff" strokeWidth="0.015" />
              <text x={p.x} y={p.y + 0.015} textAnchor="middle" fontSize="0.055" fill="#fff" fontWeight="bold">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
        <p className="text-xs text-leather-500 mt-2">{readOnly ? "只读模式" : "点击靶纸添加箭矢位置；点击表格行可删除"}</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="stat !py-3">
            <span className="text-xl font-bold text-bow">{local.length}</span>
            <span className="text-xs text-leather-600">箭矢数</span>
          </div>
          <div className="stat !py-3">
            <span className="text-xl font-bold text-target-red">{total}</span>
            <span className="text-xs text-leather-600">总环数</span>
          </div>
          <div className="stat !py-3">
            <span className="text-xl font-bold text-target-blue">
              {local.length ? (total / local.length).toFixed(2) : "0"}
            </span>
            <span className="text-xs text-leather-600">平均环值</span>
          </div>
        </div>
        <div className="card !p-3">
          <h5 className="text-sm font-semibold mb-2 text-bow-dark">散布分析</h5>
          <div className="text-sm text-leather-700 space-y-1">
            <p>平均弹着点 (X,Y): <span className="font-mono">({avgX.toFixed(3)}, {avgY.toFixed(3)})</span></p>
            <p>散布半径 σ: <span className="font-mono">{spread.toFixed(3)}</span></p>
            <p>距离: <span className="font-mono">{distance} m</span></p>
          </div>
        </div>
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-leather-100 text-leather-700">
              <tr>
                <th className="py-1 px-2 text-left">#</th>
                <th className="py-1 px-2 text-left">X</th>
                <th className="py-1 px-2 text-left">Y</th>
                <th className="py-1 px-2 text-left">环</th>
                {!readOnly && <th className="py-1 px-2 text-left">操作</th>}
              </tr>
            </thead>
            <tbody>
              {local.map((p, i) => (
                <tr key={i} className="border-t border-leather-100 hover:bg-leather-50">
                  <td className="py-1 px-2 font-mono">{i + 1}</td>
                  <td className="py-1 px-2 font-mono">{p.x.toFixed(3)}</td>
                  <td className="py-1 px-2 font-mono">{p.y.toFixed(3)}</td>
                  <td className="py-1 px-2 font-bold text-target-red">{p.score}</td>
                  {!readOnly && (
                    <td className="py-1 px-2">
                      <button className="text-red-600 hover:underline" onClick={() => removePoint(i)}>删</button>
                    </td>
                  )}
                </tr>
              ))}
              {local.length === 0 && (
                <tr><td colSpan={readOnly ? 4 : 5} className="py-4 text-center text-leather-500">暂无标点数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
