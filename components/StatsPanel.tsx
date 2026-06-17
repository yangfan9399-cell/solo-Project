import type { OffsetStat } from '@/lib/types';
import { cn, pxToMm } from '@/lib/utils';

interface Props {
  current: OffsetStat | null;
  history: Array<{ version_no: string; stat: OffsetStat | null }>;
  dpi?: number;
}

export default function StatsPanel({ current, history, dpi = 600 }: Props) {
  const rate = current && current.point_count
    ? Math.round((current.aligned_count / current.point_count) * 100)
    : 0;
  const rateLevel = rate >= 90 ? 'good' : rate >= 70 ? 'warn' : 'bad';

  return (
    <div className="flex flex-col gap-4">
      {current ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <StatBox label="平均偏移" value={current.avg_distance.toFixed(3)} unit="px" sub={`约 ${pxToMm(current.avg_distance, dpi)} mm`} accent={current.avg_distance > 2 ? 'text-rose-700' : 'text-emerald-700'} />
            <StatBox label="最大偏移" value={current.max_distance.toFixed(3)} unit="px" sub={`约 ${pxToMm(current.max_distance, dpi)} mm`} accent={current.max_distance > 3 ? 'text-rose-700' : current.max_distance > 1.5 ? 'text-amber-700' : 'text-emerald-700'} />
            <StatBox label="最小偏移" value={current.min_distance.toFixed(3)} unit="px" sub={`标准差 ${current.std_distance.toFixed(3)}`} />
            <StatBox label="图层 / 控制点" value={`${current.layer_count} / ${current.point_count}`} unit="" sub={`对齐 ${current.aligned_count} · 超标 ${current.misaligned_count}`} />
          </div>
          <div className="stat-card !gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600">控制点达标率 (≤1.5px)</span>
              <span className={cn(
                'font-mono font-bold',
                rateLevel === 'good' ? 'text-emerald-700' : rateLevel === 'warn' ? 'text-amber-700' : 'text-rose-700'
              )}>{rate}%</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  rateLevel === 'good' ? 'bg-emerald-500' : rateLevel === 'warn' ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${rate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-[11px]">
              <div>
                <div className="text-stone-500">平均ΔX</div>
                <div className="font-mono text-ink">{current.avg_delta_x > 0 ? '+' : ''}{current.avg_delta_x.toFixed(3)}px</div>
              </div>
              <div>
                <div className="text-stone-500">平均ΔY</div>
                <div className="font-mono text-ink">{current.avg_delta_y > 0 ? '+' : ''}{current.avg_delta_y.toFixed(3)}px</div>
              </div>
              <div>
                <div className="text-stone-500">偏移离散度</div>
                <div className="font-mono text-ink">σ {current.std_distance.toFixed(3)}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="stat-card justify-center items-center py-8 text-stone-400 text-sm">暂无最新统计数据</div>
      )}
      {history.length > 0 && (
        <div>
          <div className="section-title !text-sm !text-stone-600">各版本偏移趋势</div>
          <div className="mt-2 relative pt-3 pb-1">
            <div className="h-40 relative flex items-end gap-2">
              {(() => {
                const vals = history.map(h => h.stat?.max_distance || 0);
                const max = Math.max(...vals, 1.5);
                return history.map((h, i) => {
                  const v = h.stat?.max_distance || 0;
                  const pct = Math.min(100, (v / max) * 100);
                  const avg = h.stat?.avg_distance || 0;
                  const color = v > 3 ? 'bg-rose-400' : v > 1.5 ? 'bg-amber-400' : 'bg-emerald-400';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[10px] font-mono text-stone-500 opacity-0 group-hover:opacity-100 transition">
                        max {v.toFixed(2)}
                      </div>
                      <div className="w-full flex items-end justify-center gap-0.5 h-32">
                        <div
                          className={`w-1/2 rounded-t-sm transition ${color}`}
                          style={{ height: `${pct}%`, minHeight: '2px' }}
                          title={`${h.version_no} 最大:${v.toFixed(2)}`}
                        ></div>
                        <div
                          className="w-1/4 rounded-t-sm bg-indigo-400"
                          style={{ height: `${Math.min(100, (avg / max) * 100)}%`, minHeight: '1px' }}
                          title={`${h.version_no} 平均:${avg.toFixed(2)}`}
                        ></div>
                      </div>
                      <div className="text-[10px] font-mono text-stone-600">{h.version_no}</div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex gap-3 justify-end text-[10px] text-stone-500 mt-1">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-indigo-400 rounded-sm"></span>平均偏移</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm"></span>最大偏移</span>
              <span className="inline-flex items-center gap-1 text-rose-600">— 阈值 1.5px / 3px</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, unit, sub, accent }: { label: string; value: string; unit?: string; sub?: string; accent?: string }) {
  return (
    <div className="stat-card">
      <div className="text-[11px] text-stone-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <div className={cn('text-xl font-serif font-bold', accent || 'text-ink')}>{value}</div>
        {unit && <div className="text-xs text-stone-500">{unit}</div>}
      </div>
      {sub && <div className="text-[10px] text-stone-500">{sub}</div>}
    </div>
  );
}
