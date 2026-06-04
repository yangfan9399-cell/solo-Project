import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Search,
  Filter,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type {
  ExceptionRecord,
  ExceptionType,
  PaymentChannel,
  RecordStatus,
} from '../../shared/types';
import {
  EXCEPTION_TYPE_LABELS,
  PAYMENT_CHANNEL_LABELS,
  RECORD_STATUS_LABELS,
} from '../../shared/types';

const exceptionTypeColors: Record<ExceptionType, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  duplicate_deduction: 'bg-red-50 text-red-700 border-red-200',
  paid_not_credited: 'bg-amber-50 text-amber-700 border-amber-200',
  refund_failed: 'bg-purple-50 text-purple-700 border-purple-200',
};

const statusColors: Record<RecordStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  verifying: 'bg-blue-50 text-blue-600',
  refund_submitted: 'bg-amber-50 text-amber-600',
  supplement_submitted: 'bg-cyan-50 text-cyan-600',
  reviewing: 'bg-indigo-50 text-indigo-600',
  returned: 'bg-red-50 text-red-600',
  completed: 'bg-emerald-50 text-emerald-600',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ExceptionList() {
  const [records, setRecords] = useState<ExceptionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchCard, setSearchCard] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterChannel) params.set('channel', filterChannel);
    if (filterStatus) params.set('status', filterStatus);
    params.set('limit', '50');
    const res = await fetch(`/api/exceptions?${params.toString()}`);
    const json = await res.json();
    setRecords(json.data || []);
    setTotal(json.total || 0);
    setLoading(false);
  }, [filterType, filterChannel, filterStatus]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = searchCard
    ? records.filter((r) => r.card_no.includes(searchCard) || r.holder_name.includes(searchCard))
    : records;

  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const processingCount = records.filter(
    (r) => !['pending', 'completed'].includes(r.status)
  ).length;
  const completedCount = records.filter((r) => r.status === 'completed').length;
  const totalRefund = records
    .filter((r) => r.refund_amount)
    .reduce((s, r) => s + (r.refund_amount || 0), 0);

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待核对', value: pendingCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: '处理中', value: processingCount, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: '已完成', value: completedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: '退款总额', value: `¥${formatMoney(totalRefund)}`, icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 flex items-center gap-4`}>
            <div className={stat.color}>
              <stat.icon size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter size={14} />
            <span>筛选</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          >
            <option value="">全部类型</option>
            {Object.entries(EXCEPTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          >
            <option value="">全部渠道</option>
            {Object.entries(PAYMENT_CHANNEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          >
            <option value="">全部状态</option>
            {Object.entries(RECORD_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索餐卡号/姓名"
              value={searchCard}
              onChange={(e) => setSearchCard(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
          <button
            onClick={fetchRecords}
            className="text-sm text-slate-500 hover:text-amber-500 transition-colors p-1.5"
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500">
                <th className="text-left font-medium px-5 py-3">异常类型</th>
                <th className="text-left font-medium px-5 py-3">餐卡号</th>
                <th className="text-left font-medium px-5 py-3">持卡人</th>
                <th className="text-right font-medium px-5 py-3">金额</th>
                <th className="text-left font-medium px-5 py-3">支付渠道</th>
                <th className="text-left font-medium px-5 py-3">交易时间</th>
                <th className="text-left font-medium px-5 py-3">状态</th>
                <th className="text-left font-medium px-5 py-3">责任人</th>
                <th className="text-center font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    暂无异常记录
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-100 hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${exceptionTypeColors[r.exception_type]}`}
                      >
                        {EXCEPTION_TYPE_LABELS[r.exception_type]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">{r.card_no}</td>
                    <td className="px-5 py-3.5">{r.holder_name}</td>
                    <td className="px-5 py-3.5 text-right font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ¥{formatMoney(r.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {PAYMENT_CHANNEL_LABELS[r.payment_channel]}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(r.transaction_time)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status]}`}
                      >
                        {RECORD_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{r.responsible_person}</td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        to={`/detail/${r.id}`}
                        className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                      >
                        详情 <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>共 {total} 条记录</span>
            <span>显示 {filtered.length} 条</span>
          </div>
        )}
      </div>
    </div>
  );
}
