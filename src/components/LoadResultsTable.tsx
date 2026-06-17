import type { LoadCalculationResult } from '@/lib/types';
import Badge from './Badge';
import { alertLabel } from '@/lib/utils';

interface Props {
  results: LoadCalculationResult[];
  title?: string;
  compact?: boolean;
}

export default function LoadResultsTable({ results, title = '载荷计算结果', compact }: Props) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        <p className="font-medium">暂无计算数据</p>
        <p className="text-sm mt-1">请配置吊点、演员和运动路径后重新计算</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-slate-200 bg-white overflow-hidden ${compact ? '' : 'shadow-sm'}`}>
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h4 className="font-semibold text-slate-800">{title}</h4>
        <span className="text-xs text-slate-500">共 {results.length} 条记录</span>
      </div>
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="text-left text-slate-600 text-xs uppercase tracking-wider">
              <th className="px-4 py-2 font-semibold">吊点</th>
              <th className="px-4 py-2 font-semibold text-right">静载(kg)</th>
              <th className="px-4 py-2 font-semibold text-right">动载(kg)</th>
              <th className="px-4 py-2 font-semibold text-right">冲击载(kg)</th>
              <th className="px-4 py-2 font-semibold text-right">峰值(kg)</th>
              <th className="px-4 py-2 font-semibold text-right">角度(°)</th>
              <th className="px-4 py-2 font-semibold text-right">利用率</th>
              <th className="px-4 py-2 font-semibold text-right">安全系数</th>
              <th className="px-4 py-2 font-semibold text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((r, idx) => {
              const danger = r.alertLevel === 'danger';
              const warn = r.alertLevel === 'warning';
              const rowClass = danger
                ? 'bg-red-50 hover:bg-red-100 transition'
                : warn
                ? 'bg-amber-50/50 hover:bg-amber-50 transition'
                : 'hover:bg-slate-50 transition';
              return (
                <tr key={`${r.pointId}-${idx}`} className={rowClass}>
                  <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                    {r.pointName}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{r.staticLoad}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{r.dynamicLoad}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{r.impactLoad}</td>
                  <td className={
                    'px-4 py-2.5 text-right font-mono font-bold ' +
                    (danger ? 'text-red-700' : warn ? 'text-amber-700' : 'text-slate-900')
                  }>
                    {r.maxLoad}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-600">{r.tensionAngle}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={
                            'h-full rounded-full ' +
                            (r.utilization >= 95
                              ? 'bg-red-500'
                              : r.utilization >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500')
                          }
                          style={{ width: `${Math.min(r.utilization, 100)}%` }}
                        />
                      </div>
                      <span className={
                        'font-mono text-xs font-semibold w-12 text-right ' +
                        (danger ? 'text-red-700' : warn ? 'text-amber-700' : 'text-slate-700')
                      }>
                        {r.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className={
                    'px-4 py-2.5 text-right font-mono font-semibold ' +
                    (r.safetyFactor < r.designSafetyFactor
                      ? 'text-red-700'
                      : r.safetyFactor < r.designSafetyFactor * 1.2
                      ? 'text-amber-700'
                      : 'text-emerald-700')
                  }>
                    {r.safetyFactor} / {r.designSafetyFactor}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge label={alertLabel(r.alertLevel)} variant={r.alertLevel} pulse={danger} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
