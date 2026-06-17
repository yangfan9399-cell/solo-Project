import type { LiftPoint, Performer, MotionPath } from '@/lib/types';
import { liftPointTypeLabel } from '@/lib/utils';
import { alertLevelClasses } from '@/lib/utils';

interface Props {
  liftPoints: LiftPoint[];
  performers: Performer[];
  motionPaths: MotionPath[];
  peakLoads?: Array<{ pointId: string; alertLevel: string; maxLoad: number; utilization: number }>;
  onSelectPoint?: (id: string) => void;
  selectedPointId?: string;
}

export default function StageLayoutCanvas({
  liftPoints,
  performers,
  motionPaths,
  peakLoads = [],
  onSelectPoint,
  selectedPointId,
}: Props) {
  const W = 700;
  const H = 440;
  const pad = 50;
  const allX = liftPoints.length > 0 ? liftPoints.map((p) => p.x) : [0];
  const allY = liftPoints.length > 0 ? liftPoints.map((p) => p.y) : [0];
  const minX = Math.min(...allX, -10);
  const maxX = Math.max(...allX, 10);
  const minY = Math.min(...allY, -10);
  const maxY = Math.max(...allY, 10);
  const scaleX = (W - pad * 2) / Math.max(maxX - minX, 1);
  const scaleY = (H - pad * 2) / Math.max(maxY - minY, 1);
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (W - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = (H - (maxY - minY) * scale) / 2 - minY * scale;

  const toCanvas = (x: number, y: number) => ({
    cx: offsetX + x * scale,
    cy: H - (offsetY + y * scale),
  });

  const peakMap = new Map(peakLoads.map((p) => [p.pointId, p]));

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-md overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/80">
        <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          舞台布局俯视示意图
        </h4>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-400"></span>吊点
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>演员
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-amber-400 rounded"></span>轨迹
          </span>
        </div>
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="stageGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={W} height={H} fill="url(#grid)" />
          <rect x={pad} y={pad} width={W - pad * 2} height={H - pad * 2} fill="url(#stageGrad)" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" rx="8" />
          <text x={W / 2} y={pad - 18} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600">
            观众席 ← → 观众席
          </text>
          <text x={pad + 20} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize="10" transform={`rotate(-90 ${pad + 20} ${H / 2})`}>
            侧台
          </text>
          <text x={W - pad - 20} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize="10" transform={`rotate(90 ${W - pad - 20} ${H / 2})`}>
            侧台
          </text>
          <text x={W / 2} y={H - pad + 30} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="700" letterSpacing="4">
            ✦ 舞 台 面 ✦
          </text>

          {motionPaths.length > 0 && motionPaths.map((mp) => {
            if (mp.waypoints.length < 2) return null;
            const d = mp.waypoints
              .map((wp, i) => {
                const { cx, cy } = toCanvas(wp.x, wp.y);
                return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`;
              })
              .join(' ');
            return (
              <g key={mp.id}>
                <path d={d} stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="6 4" fill="none" opacity="0.8" />
                {mp.waypoints.map((wp) => {
                  const { cx, cy } = toCanvas(wp.x, wp.y);
                  return (
                    <circle key={wp.id} cx={cx} cy={cy} r="3.5" fill="#fbbf24" />
                  );
                })}
              </g>
            );
          })}

          {performers.map((pf, idx) => {
            const baseX = -8 + (idx * 3) % 16;
            const baseY = (idx % 2) * 2 - 1;
            const { cx, cy } = toCanvas(baseX, baseY);
            return (
              <g key={pf.id} transform={`translate(${cx}, ${cy})`}>
                <circle r="10" fill="#10b981" stroke="#065f46" strokeWidth="2" opacity="0.95" />
                <circle r="5" fill="#d1fae5" />
                <text y="24" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="600">{pf.name}</text>
              </g>
            );
          })}

          {liftPoints.map((lp) => {
            const { cx, cy } = toCanvas(lp.x, lp.y);
            const peak = peakMap.get(lp.id);
            const fillColor = peak
              ? peak.alertLevel === 'danger' ? '#ef4444'
              : peak.alertLevel === 'warning' ? '#f59e0b' : '#6366f1'
              : '#6366f1';
            const isSelected = selectedPointId === lp.id;
            return (
              <g
                key={lp.id}
                transform={`translate(${cx}, ${cy})`}
                className="cursor-pointer"
                onClick={() => onSelectPoint?.(lp.id)}
              >
                {isSelected && (
                  <circle r="26" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 2">
                    <animate attributeName="r" values="22;28;22" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r="14" fill={fillColor} stroke="#ffffff" strokeWidth="2" opacity="0.95">
                  {peak?.alertLevel === 'danger' && (
                    <animate attributeName="r" values="13;16;13" dur="1s" repeatCount="indefinite" />
                  )}
                </circle>
                <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">{lp.name.split(' ')[0]}</text>
                <text y="42" textAnchor="middle" fill="#cbd5e1" fontSize="9">{liftPointTypeLabel(lp.type)} · {lp.maxLoad}kg</text>
                {peak && (
                  <g transform="translate(20, -18)">
                    <rect x="0" y="-8" width="52" height="16" rx="8" fill="#0f172a" stroke="#334155" />
                    <text x="26" y="3" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="700">
                      {peak.maxLoad}kg · {peak.utilization}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
