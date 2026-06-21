import type { TicketStatus, RiskLevel } from '../../shared/types';
import { statusLabels, statusColors, riskLabels, riskColors, formatDateTime } from '@/utils/format';
import { Clock, User, AlertTriangle, CheckCircle, XCircle, Lock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TicketCardProps {
  ticket: {
    id: string;
    ticketNo: string;
    towerPosition: string;
    workDescription: string;
    initiatorName: string;
    reviewerName: string;
    status: TicketStatus;
    riskLevel: RiskLevel;
    isLocked: boolean;
    updatedAt: string;
    rejectionHistory: Array<{ id: string }>;
  };
}

export default function TicketCard({ ticket }: TicketCardProps) {
  return (
    <div className="card p-5 border-l-4 border-l-industrial-800 relative overflow-hidden">
      {ticket.status === 'high_risk_incomplete' && (
        <div className="absolute top-0 right-0 bg-safety-orange/10 px-3 py-1 border-l border-b border-safety-orange/30 rounded-bl">
          <div className="flex items-center gap-1 text-xs font-semibold text-safety-orange">
            <AlertTriangle className="w-3 h-3" />
            高风险待补齐
          </div>
        </div>
      )}
      {ticket.isLocked && (
        <div className="absolute top-0 right-0 bg-industrial-700/10 px-3 py-1 border-l border-b border-industrial-700/30 rounded-bl">
          <div className="flex items-center gap-1 text-xs font-semibold text-industrial-700">
            <Lock className="w-3 h-3" />
            已锁定
          </div>
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3 pr-20">
        <div>
          <div className="font-mono text-sm font-bold text-industrial-800 tracking-wide">{ticket.ticketNo}</div>
          <div className="mt-1 font-bold text-lg text-industrial-900">{ticket.towerPosition}</div>
        </div>
        <span className={`badge ${statusColors[ticket.status]} whitespace-nowrap`}>
          {ticket.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
          {ticket.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
          {ticket.status === 'pending_review' && <Clock className="w-3 h-3 mr-1" />}
          {statusLabels[ticket.status]}
        </span>
      </div>

      <p className="text-industrial-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        {ticket.workDescription}
      </p>

      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5 text-industrial-600">
          <User className="w-3.5 h-3.5 text-industrial-400" />
          <span>发起人：</span>
          <span className="font-semibold text-industrial-800">{ticket.initiatorName}</span>
        </div>
        <div className="text-industrial-300">→</div>
        <div className="flex items-center gap-1.5 text-industrial-600">
          <User className="w-3.5 h-3.5 text-industrial-400" />
          <span>复核人：</span>
          <span className="font-semibold text-industrial-800">{ticket.reviewerName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-industrial-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-industrial-500">风险等级：</span>
            <span className={`inline-flex items-center gap-1.5`}>
              <span className={`w-2.5 h-2.5 rounded-full ${riskColors[ticket.riskLevel]}`} />
              <span className={`text-xs font-bold ${
                ticket.riskLevel === 'high' ? 'text-safety-red' :
                ticket.riskLevel === 'medium' ? 'text-safety-yellow' : 'text-safety-green'
              }`}>
                {riskLabels[ticket.riskLevel]}
              </span>
            </span>
          </div>
          {ticket.rejectionHistory.length > 0 && (
            <span className="badge bg-red-50 text-safety-red border border-red-200">
              驳回 {ticket.rejectionHistory.length} 次
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-industrial-400">
            更新于 {formatDateTime(ticket.updatedAt)}
          </span>
          <Link
            to={`/ticket/${ticket.id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-semibold text-industrial-700 bg-industrial-50 hover:bg-industrial-100 border border-industrial-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            查看
          </Link>
        </div>
      </div>
    </div>
  );
}
