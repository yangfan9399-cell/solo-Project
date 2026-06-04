import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  PieChart,
  Timer,
  TrendingDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { AggregateStats, ExceptionRecord } from '../../shared/types';

function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BarChart({ data, maxVal, color }: { data: { label: string; value: number }[]; maxVal: number; color: string }) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-24 text-right shrink-0 truncate">{d.label}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${color} transition-all duration-500`}
              style={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-700 w-16 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [drilldownRecords, setDrilldownRecords] = useState<ExceptionRecord[] | null>(null);
  const [drilldownTitle, setDrilldownTitle] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    const res = await fetch('/api/stats');
    const json = await res.json();
    setStats(json);
    setLoading(false);
  }

  async function drilldown(type: string, channel: string, result: string) {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (channel) params.set('channel', channel);
    if (result) params.set('result', result);
    const res = await fetch(`/api/stats/records?${params.toString()}`);
    const json = await res.json();
    setDrilldownRecords(json.data || []);
    setDrilldownTitle(`${type || channel || result} 相关记录`);
  }

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const typeMax = Math.max(...stats.byExceptionType.map((t) => t.count));
  const channelMax = Math.max(...stats.byPaymentChannel.map((t) => t.count));

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <BarChart3 size={20} className="text-amber-500" />
        复盘统计
      </h2>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <PieChart size={15} className="text-amber-500" />
              异常类型分布
            </h3>
            <span className="text-xs text-slate-400">
              共 {stats.byExceptionType.reduce((s, t) => s + t.count, 0)} 条
            </span>
          </div>
          <div className="px-5 py-4">
            <BarChart
              data={stats.byExceptionType.map((t) => ({ label: t.type, value: t.count }))}
              maxVal={typeMax}
              color="bg-amber-400"
            />
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              {stats.byExceptionType.map((t) => (
                <button
                  key={t.type}
                  onClick={() => drilldown(t.type, '', '')}
                  className="w-full flex items-center justify-between text-xs hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors group"
                >
                  <span className="text-slate-600">{t.type}</span>
                  <span className="text-slate-400 group-hover:text-amber-500 flex items-center gap-1">
                    ¥{formatMoney(t.totalAmount)}
                    <ChevronRight size={10} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BarChart3 size={15} className="text-blue-500" />
              支付渠道分布
            </h3>
            <span className="text-xs text-slate-400">
              共 {stats.byPaymentChannel.reduce((s, t) => s + t.count, 0)} 条
            </span>
          </div>
          <div className="px-5 py-4">
            <BarChart
              data={stats.byPaymentChannel.map((t) => ({ label: t.channel, value: t.count }))}
              maxVal={channelMax}
              color="bg-blue-400"
            />
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              {stats.byPaymentChannel.map((t) => (
                <button
                  key={t.channel}
                  onClick={() => drilldown('', t.channel, '')}
                  className="w-full flex items-center justify-between text-xs hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors group"
                >
                  <span className="text-slate-600">{t.channel}</span>
                  <span className="text-slate-400 group-hover:text-blue-500 flex items-center gap-1">
                    ¥{formatMoney(t.totalAmount)}
                    <ChevronRight size={10} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Timer size={15} className="text-emerald-500" />
              处理耗时分析
            </h3>
          </div>
          <div className="px-5 py-4">
            <div className="space-y-4">
              {stats.processingTime.map((t) => (
                <div key={t.type} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{t.type}</span>
                    <span className="text-slate-400">平均 {t.avgHours}h</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            Math.max(...stats.processingTime.map((p) => p.avgHours)) > 0
                              ? (t.avgHours / Math.max(...stats.processingTime.map((p) => p.avgHours))) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>最长: {t.maxHours}h</span>
                    <span>最短: {t.minHours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingDown size={15} className="text-purple-500" />
              退款结果汇总
            </h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            {stats.refundResult.map((r) => {
              const colors: Record<string, string> = {
                '退款成功': 'bg-emerald-50 border-emerald-200 text-emerald-700',
                '退款失败': 'bg-red-50 border-red-200 text-red-700',
                '退款中': 'bg-amber-50 border-amber-200 text-amber-700',
              };
              const iconColors: Record<string, string> = {
                '退款成功': 'text-emerald-500',
                '退款失败': 'text-red-500',
                '退款中': 'text-amber-500',
              };
              return (
                <button
                  key={r.result}
                  onClick={() => drilldown('', '', r.result)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${colors[r.result] || 'bg-slate-50 border-slate-200'} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${iconColors[r.result] || 'text-slate-500'}`}>
                      {r.count}
                    </span>
                    <span className="text-sm font-medium">{r.result}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-70" style={{ fontVariantNumeric: 'tabular-nums' }}>¥{formatMoney(r.totalAmount)}</span>
                    <ExternalLink size={12} className="opacity-50" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {drilldownRecords !== null && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{drilldownTitle}</h3>
            <button
              onClick={() => setDrilldownRecords(null)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              关闭
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500">
                  <th className="text-left font-medium px-5 py-3">餐卡号</th>
                  <th className="text-left font-medium px-5 py-3">持卡人</th>
                  <th className="text-right font-medium px-5 py-3">金额</th>
                  <th className="text-left font-medium px-5 py-3">异常类型</th>
                  <th className="text-left font-medium px-5 py-3">状态</th>
                  <th className="text-center font-medium px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {drilldownRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">无相关记录</td>
                  </tr>
                ) : (
                  drilldownRecords.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-amber-50/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">{r.card_no}</td>
                      <td className="px-5 py-3">{r.holder_name}</td>
                      <td className="px-5 py-3 text-right font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>¥{formatMoney(r.amount)}</td>
                      <td className="px-5 py-3 text-xs">
                        {r.exception_type === 'normal' && '到账正常'}
                        {r.exception_type === 'duplicate_deduction' && '重复扣款'}
                        {r.exception_type === 'paid_not_credited' && '支付成功未入账'}
                        {r.exception_type === 'refund_failed' && '退款失败'}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {r.status === 'pending' && '待核对'}
                        {r.status === 'verifying' && '核对中'}
                        {r.status === 'refund_submitted' && '退款已提交'}
                        {r.status === 'supplement_submitted' && '补记账已提交'}
                        {r.status === 'reviewing' && '复核中'}
                        {r.status === 'returned' && '已退回补证'}
                        {r.status === 'completed' && '已完成'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Link
                          to={`/detail/${r.id}`}
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 justify-center"
                        >
                          详情 <ChevronRight size={10} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
