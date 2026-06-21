import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketStore } from '@/store/ticketStore';
import { riskLabels, riskColors, statusLabels, statusColors, formatDateTime } from '@/utils/format';
import type { WorkTicket } from '../../shared/types';
import {
  ArrowLeft, Printer, Edit3, Lock, AlertCircle, User, ClipboardCheck,
  Clock, Wrench, Shield, ListChecks, History, AlertTriangle, CheckCircle2, XCircle, FileText
} from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTicket, currentUser, lockTicket, printTicket, fetchUsers } = useTicketStore();
  const [ticket, setTicket] = useState<WorkTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    if (id) {
      (async () => {
        setLoading(true);
        const t = await fetchTicket(id);
        setTicket(t);
        setLoading(false);
      })();
    }
  }, [id, fetchTicket, fetchUsers]);

  const handleLock = async () => {
    if (!ticket || !currentUser) return;
    setActionLoading(true);
    const r = await lockTicket(ticket.id, currentUser.id);
    setActionLoading(false);
    if (!r.success) {
      setError(r.error || '锁定失败');
    } else {
      const t = await fetchTicket(ticket.id);
      setTicket(t);
    }
  };

  const handlePrint = async () => {
    if (!ticket) return;
    await printTicket(ticket.id);
    const t = await fetchTicket(ticket.id);
    setTicket(t);
    window.print();
  };

  if (loading) {
    return <div className="text-center py-20 text-industrial-500">加载中...</div>;
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <AlertCircle className="w-16 h-16 text-industrial-300 mx-auto mb-4" />
        <p className="text-industrial-700 font-medium">作业票不存在或已被删除</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </button>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: typeof AlertCircle; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-industrial-100">
      <div className="w-10 h-10 rounded bg-industrial-800 text-white flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-bold text-industrial-900 text-base">{title}</h4>
        {subtitle && <p className="text-xs text-industrial-500">{subtitle}</p>}
      </div>
    </div>
  );

  const ConfirmBadge = ({ initiator, reviewer }: { initiator: boolean; reviewer: boolean }) => (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${initiator ? 'bg-safety-green/15 text-safety-green' : 'bg-industrial-100 text-industrial-400'}`}>
        {initiator ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        发起人确认
      </span>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${reviewer ? 'bg-safety-green/15 text-safety-green' : 'bg-industrial-100 text-industrial-400'}`}>
        {reviewer ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        复核人确认
      </span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="no-print flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary !px-3 !py-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-industrial-900">作业票详情</h2>
            <p className="text-sm text-industrial-500 mt-0.5 font-mono">{ticket.ticketNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status === 'rejected' && ticket.initiatorId === currentUser?.id && (
            <button onClick={() => navigate(`/create/${ticket.id}`)} className="btn-warning inline-flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> 修改并重新提交
            </button>
          )}
          {ticket.status === 'approved' && !ticket.isLocked && ticket.reviewerId === currentUser?.id && (
            <button onClick={handleLock} disabled={actionLoading} className="btn-primary inline-flex items-center gap-2">
              <Lock className="w-4 h-4" /> 锁定作业票
            </button>
          )}
          {(ticket.status === 'approved' || ticket.status === 'locked') && (
            <button onClick={handlePrint} className="btn-secondary inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              打印预览
              {ticket.printVersion > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-industrial-100 text-industrial-600 ml-1">
                  V{ticket.printVersion}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="no-print mb-4 p-4 rounded bg-red-50 border border-red-200 text-safety-red text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      <div className="print-area card p-10 bg-white">
        <div className="border-b-4 border-industrial-900 pb-6 mb-8 text-center">
          <h1 className="text-3xl font-bold text-industrial-900 tracking-widest">桅骨风电场作业票</h1>
          <p className="text-industrial-600 mt-2">WIND TURBINE WORK ORDER — DOUBLE VERIFICATION</p>
          <div className="mt-5 flex justify-center items-center gap-6 flex-wrap">
            <div className="font-mono text-lg font-bold text-industrial-800">票号：{ticket.ticketNo}</div>
            <span className={`badge text-sm px-4 py-1.5 ${statusColors[ticket.status]}`}>
              {ticket.isLocked && <Lock className="w-3.5 h-3.5 mr-1.5" />}
              {statusLabels[ticket.status]}
            </span>
            {ticket.printVersion > 0 && (
              <div className="text-xs text-industrial-400 font-mono">打印版本：V{ticket.printVersion}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <div className="text-xs text-industrial-500 uppercase tracking-wide mb-1">塔位</div>
            <div className="text-xl font-bold text-industrial-900">{ticket.towerPosition}</div>
            <div className="mt-2"><ConfirmBadge initiator={ticket.towerConfirmedByInitiator} reviewer={ticket.towerConfirmedByReviewer} /></div>
          </div>
          <div>
            <div className="text-xs text-industrial-500 uppercase tracking-wide mb-1">风险等级</div>
            <div className="text-xl font-bold inline-flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${riskColors[ticket.riskLevel]}`} />
              <span className={
                ticket.riskLevel === 'high' ? 'text-safety-red' :
                ticket.riskLevel === 'medium' ? 'text-safety-yellow' : 'text-safety-green'
              }>
                {riskLabels[ticket.riskLevel]}
              </span>
            </div>
            <div className="mt-2"><ConfirmBadge initiator={ticket.riskConfirmedByInitiator} reviewer={ticket.riskConfirmedByReviewer} /></div>
          </div>
          <div>
            <div className="text-xs text-industrial-500 uppercase tracking-wide mb-1">创建时间</div>
            <div className="text-base font-semibold text-industrial-800">{formatDateTime(ticket.createdAt)}</div>
            <div className="text-xs text-industrial-500 mt-1">更新时间：{formatDateTime(ticket.updatedAt)}</div>
          </div>
        </div>

        <section className="mb-8">
          <SectionHeader icon={FileText} title="作业内容描述" />
          <div className="bg-industrial-50 rounded p-5 text-industrial-800 leading-relaxed">
            {ticket.workDescription}
          </div>
        </section>

        <section className="mb-8">
          <SectionHeader icon={ListChecks} title="作业步骤" subtitle="需发起人、复核人逐项确认" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-industrial-200 text-industrial-600">
                <th className="text-left py-2.5 w-16">序号</th>
                <th className="text-left py-2.5">内容</th>
                <th className="text-center py-2.5 w-24">发起人</th>
                <th className="text-center py-2.5 w-24">复核人</th>
              </tr>
            </thead>
            <tbody>
              {ticket.workSteps.map((s, i) => (
                <tr key={s.id} className="border-b border-industrial-100">
                  <td className="py-3 font-bold text-industrial-700">{i + 1}</td>
                  <td className="py-3 text-industrial-800">{s.description}</td>
                  <td className="text-center py-3">
                    {s.confirmedByInitiator ? <CheckCircle2 className="w-5 h-5 text-safety-green mx-auto" /> : <XCircle className="w-5 h-5 text-industrial-300 mx-auto" />}
                  </td>
                  <td className="text-center py-3">
                    {s.confirmedByReviewer ? <CheckCircle2 className="w-5 h-5 text-safety-green mx-auto" /> : <XCircle className="w-5 h-5 text-industrial-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <SectionHeader icon={Shield} title="隔离措施" subtitle="高风险作业必须所有措施均已落实" />
          {ticket.riskLevel === 'high' && ticket.isolationMeasures.some((m) => !m.implemented) && (
            <div className="mb-4 p-3 rounded bg-orange-50 border border-orange-200 text-safety-orange text-sm flex items-center gap-2 print:text-black print:bg-transparent print:border">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              高风险作业隔离措施存在未落实项，需补齐后方可通过
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-industrial-200 text-industrial-600">
                <th className="text-left py-2.5 w-16">序号</th>
                <th className="text-left py-2.5">措施描述</th>
                <th className="text-center py-2.5 w-20">状态</th>
                <th className="text-center py-2.5 w-24">发起人</th>
                <th className="text-center py-2.5 w-24">复核人</th>
              </tr>
            </thead>
            <tbody>
              {ticket.isolationMeasures.map((m, i) => (
                <tr key={m.id} className="border-b border-industrial-100">
                  <td className="py-3 font-bold text-industrial-700">{i + 1}</td>
                  <td className="py-3 text-industrial-800">{m.description}</td>
                  <td className="text-center py-3">
                    <span className={`badge text-xs ${m.implemented ? 'bg-safety-green/15 text-safety-green border border-safety-green/30' : 'bg-safety-red/15 text-safety-red border border-safety-red/30'}`}>
                      {m.implemented ? '已落实' : '未落实'}
                    </span>
                  </td>
                  <td className="text-center py-3">
                    {m.confirmedByInitiator ? <CheckCircle2 className="w-5 h-5 text-safety-green mx-auto" /> : <XCircle className="w-5 h-5 text-industrial-300 mx-auto" />}
                  </td>
                  <td className="text-center py-3">
                    {m.confirmedByReviewer ? <CheckCircle2 className="w-5 h-5 text-safety-green mx-auto" /> : <XCircle className="w-5 h-5 text-industrial-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <SectionHeader icon={Wrench} title="工具清单" />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-industrial-200 text-industrial-600">
                <th className="text-left py-2.5 w-16">序号</th>
                <th className="text-left py-2.5">工具名称</th>
                <th className="text-center py-2.5 w-20">数量</th>
                <th className="text-center py-2.5 w-24">发起人</th>
                <th className="text-center py-2.5 w-24">复核人</th>
              </tr>
            </thead>
            <tbody>
              {ticket.tools.map((tl, i) => (
                <tr key={tl.id} className="border-b border-industrial-100">
                  <td className="py-3 font-bold text-industrial-700">{i + 1}</td>
                  <td className="py-3 text-industrial-800">{tl.name}</td>
                  <td className="text-center py-3 font-semibold">× {tl.quantity}</td>
                  <td className="text-center py-3">
                    {tl.confirmedByInitiator ? <CheckCircle2 className="w-5 h-5 text-safety-green mx-auto" /> : <XCircle className="w-5 h-5 text-industrial-300 mx-auto" />}
                  </td>
                  <td className="text-center py-3">
                    {tl.confirmedByReviewer ? <CheckCircle2 className="w-5 h-5 text-safety-green mx-auto" /> : <XCircle className="w-5 h-5 text-industrial-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {ticket.rejectionHistory.length > 0 && (
          <section className="mb-8 print:break-before-page">
            <SectionHeader icon={History} title="驳回修改记录" subtitle={`共 ${ticket.rejectionHistory.length} 次驳回`} />
            <div className="space-y-3">
              {ticket.rejectionHistory.map((r, idx) => (
                <div key={r.id} className="p-4 rounded bg-red-50 border-2 border-red-100 print:bg-white print:border-gray-300">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-safety-red" />
                      <span className="font-bold text-safety-red">第 {idx + 1} 次驳回</span>
                    </div>
                    <span className="text-industrial-500">{formatDateTime(r.timestamp)}</span>
                  </div>
                  <div className="text-xs text-industrial-500 mb-2">驳回人：{r.rejectedByName}</div>
                  <div className="text-industrial-800">{r.reason}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="pt-6 border-t-4 border-industrial-900">
          <SectionHeader icon={User} title="双人签核记录" />
          <div className="grid grid-cols-2 gap-10 mt-6">
            {['initiator', 'reviewer'].map((role) => {
              const record = ticket.signOffs.find((s) => s.role === role);
              const name = role === 'initiator' ? ticket.initiatorName : ticket.reviewerName;
              return (
                <div key={role} className="text-center">
                  <div className="text-sm text-industrial-500 mb-2">
                    {role === 'initiator' ? '发起人签字' : '复核人签字'}
                  </div>
                  <div className="h-24 border-b-2 border-industrial-300 flex items-end justify-center pb-2">
                    {record ? (
                      <span className="text-2xl font-bold text-industrial-800" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {record.userName}
                      </span>
                    ) : (
                      <span className="text-industrial-300 text-sm">（尚未签核）</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-semibold text-industrial-800">{name}</span>
                    {record && (
                      <span className="text-industrial-500 ml-3">{formatDateTime(record.timestamp)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {ticket.isLocked && (
          <div className="mt-8 p-4 rounded bg-industrial-800 text-white text-center">
            <Lock className="w-5 h-5 inline mr-2" />
            此作业票已锁定，不可修改
          </div>
        )}
      </div>

      <div className="no-print mt-4 text-center text-xs text-industrial-400">
        桅骨风电 · 双人复核作业票系统 · 版本号 V{ticket.printVersion || 0}
      </div>
    </div>
  );
}
