import { useEffect, useState } from 'react';
import { useTicketStore } from '@/store/ticketStore';
import TicketCard from '@/components/TicketCard';
import { Search, Plus, Filter, ClipboardList, AlertTriangle, CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TicketStatus } from '../../shared/types';

const STATUS_TABS: { key: TicketStatus | 'all'; label: string; icon: typeof Plus; color: string }[] = [
  { key: 'all', label: '全部', icon: ClipboardList, color: 'text-industrial-700' },
  { key: 'pending_review', label: '待复核', icon: Clock, color: 'text-safety-yellow' },
  { key: 'high_risk_incomplete', label: '高风险缺项', icon: AlertTriangle, color: 'text-safety-orange' },
  { key: 'rejected', label: '已驳回', icon: XCircle, color: 'text-safety-red' },
  { key: 'approved', label: '已通过', icon: CheckCircle, color: 'text-safety-green' },
  { key: 'locked', label: '已锁定', icon: Lock, color: 'text-industrial-700' },
];

export default function TicketList() {
  const { tickets, allTickets, fetchTickets, loading, currentUser } = useTicketStore();
  const [status, setStatus] = useState<TicketStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchTickets(status === 'all' ? undefined : status, keyword);
  }, [fetchTickets, status, keyword]);

  const counts = {
    all: 0,
    pending_review: 0,
    rejected: 0,
    approved: 0,
    high_risk_incomplete: 0,
    locked: 0,
  };
  allTickets.forEach((t) => {
    counts.all++;
    counts[t.status]++;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-industrial-900">作业票管理</h2>
          <p className="text-sm text-industrial-500 mt-1">
            以 {currentUser?.name} 身份查看所有作业票，点击卡片查看详情
          </p>
        </div>
        <Link to="/create" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          发起新作业票
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" />
            <input
              type="text"
              placeholder="搜索票号、塔位、作业内容、人员..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-1.5 text-industrial-500 text-sm">
            <Filter className="w-4 h-4" />
            <span>状态筛选：</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = status === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all border-2 ${
                    active
                      ? 'bg-industrial-900 text-white border-industrial-900 shadow'
                      : 'bg-white text-industrial-600 border-industrial-200 hover:border-industrial-400'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : tab.color}`} />
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    active ? 'bg-white/20' : 'bg-industrial-100 text-industrial-600'
                  }`}>
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-industrial-500">加载中...</div>
      ) : tickets.length === 0 ? (
        <div className="card p-16 text-center">
          <ClipboardList className="w-16 h-16 text-industrial-300 mx-auto mb-4" />
          <p className="text-industrial-500 font-medium">暂无匹配的作业票</p>
          <p className="text-sm text-industrial-400 mt-1">尝试调整筛选条件或发起新的作业票</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
