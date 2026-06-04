import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BookPlus,
  FileText,
  User,
  History,
  Send,
  CornerDownLeft,
} from 'lucide-react';
import type {
  ExceptionDetail,
  ExceptionType,
  CreditStatus,
  RecordStatus,
  HistoryAction,
} from '../../shared/types';
import {
  EXCEPTION_TYPE_LABELS,
  PAYMENT_CHANNEL_LABELS,
  CREDIT_STATUS_LABELS,
  RECORD_STATUS_LABELS,
  HISTORY_ACTION_LABELS,
} from '../../shared/types';

const exceptionTypeColors: Record<ExceptionType, string> = {
  normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  duplicate_deduction: 'bg-red-50 text-red-700 border-red-200',
  paid_not_credited: 'bg-amber-50 text-amber-700 border-amber-200',
  refund_failed: 'bg-purple-50 text-purple-700 border-purple-200',
};

const creditStatusIcons: Record<CreditStatus, React.ReactNode> = {
  credited: <CheckCircle2 size={16} className="text-emerald-500" />,
  not_credited: <XCircle size={16} className="text-red-500" />,
  partially_credited: <AlertTriangle size={16} className="text-amber-500" />,
};

const historyActionIcons: Record<HistoryAction, React.ReactNode> = {
  created: <FileText size={14} className="text-slate-400" />,
  verified: <CheckCircle2 size={14} className="text-emerald-500" />,
  refund_submitted: <Banknote size={14} className="text-amber-500" />,
  supplement_submitted: <BookPlus size={14} className="text-cyan-500" />,
  review_confirmed: <CheckCircle2 size={14} className="text-blue-500" />,
  returned_for_evidence: <RotateCcw size={14} className="text-red-500" />,
  evidence_supplemented: <FileText size={14} className="text-indigo-500" />,
  completed: <CheckCircle2 size={14} className="text-emerald-500" />,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ExceptionDetailData {
  id: string;
  card_no: string;
  holder_name: string;
  amount: number;
  payment_channel: string;
  payment_transaction_no: string;
  transaction_time: string;
  exception_type: ExceptionType;
  credit_status: CreditStatus;
  credit_time: string | null;
  refund_basis: string | null;
  refund_amount: number | null;
  refund_account: string | null;
  responsible_person: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
  histories: {
    id: string;
    exception_id: string;
    operator: string;
    operator_role: string;
    action: HistoryAction;
    remark: string;
    created_at: string;
  }[];
}

export default function ExceptionDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ExceptionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [refundForm, setRefundForm] = useState({ basis: '', amount: '', account: '' });
  const [supplementRemark, setSupplementRemark] = useState('');
  const [reviewRemark, setReviewRemark] = useState('');

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    const res = await fetch(`/api/exceptions/${id}`);
    const json = await res.json();
    setDetail(json);
    setLoading(false);
  }

  async function handleVerify() {
    await fetch(`/api/exceptions/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: '当前经办人' }),
    });
    setActiveAction(null);
    fetchDetail();
  }

  async function handleRefund() {
    if (!refundForm.basis || !refundForm.amount || !refundForm.account) return;
    await fetch(`/api/exceptions/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator: '当前经办人',
        basis: refundForm.basis,
        amount: parseFloat(refundForm.amount),
        account: refundForm.account,
      }),
    });
    setActiveAction(null);
    setRefundForm({ basis: '', amount: '', account: '' });
    fetchDetail();
  }

  async function handleSupplement() {
    await fetch(`/api/exceptions/${id}/supplement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator: '当前经办人',
        remark: supplementRemark || '提交补记账申请，将充值金额直接入账到餐卡',
      }),
    });
    setActiveAction(null);
    setSupplementRemark('');
    fetchDetail();
  }

  async function handleReview(action: 'confirm' | 'return') {
    await fetch(`/api/exceptions/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator: '当前复核人',
        action,
        remark: reviewRemark || (action === 'confirm' ? '复核确认' : '退回补充证据'),
      }),
    });
    setActiveAction(null);
    setReviewRemark('');
    fetchDetail();
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>未找到记录</p>
        <Link to="/" className="text-amber-500 text-sm mt-2 inline-block">返回列表</Link>
      </div>
    );
  }

  const canVerify = detail.status === 'pending' && detail.exception_type === 'normal';
  const canRefund =
    detail.status === 'pending' &&
    ['duplicate_deduction', 'refund_failed'].includes(detail.exception_type);
  const canChoosePath =
    detail.status === 'pending' && detail.exception_type === 'paid_not_credited';
  const canReview = ['refund_submitted', 'supplement_submitted', 'reviewing'].includes(detail.status);
  const canResubmit = detail.status === 'returned';

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-amber-500 transition-colors"
        >
          <ArrowLeft size={16} />
          返回列表
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800">异常详情</h2>
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${exceptionTypeColors[detail.exception_type]}`}>
            {EXCEPTION_TYPE_LABELS[detail.exception_type]}
          </span>
        </div>
        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
          detail.status === 'completed' ? 'bg-emerald-50 text-emerald-600'
            : detail.status === 'pending' ? 'bg-amber-50 text-amber-600'
            : 'bg-blue-50 text-blue-600'
        }`}>
          {RECORD_STATUS_LABELS[detail.status]}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <CreditCard size={15} className="text-amber-500" />
            基本信息
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-6 py-5">
          {[
            ['餐卡号', detail.card_no, true],
            ['持卡人', detail.holder_name, false],
            ['充值金额', `¥${formatMoney(detail.amount)}`, false],
            ['支付渠道', PAYMENT_CHANNEL_LABELS[detail.payment_channel as keyof typeof PAYMENT_CHANNEL_LABELS], false],
            ['支付流水号', detail.payment_transaction_no, true],
            ['交易时间', formatDate(detail.transaction_time), false],
            ['责任人', detail.responsible_person, false],
            ['创建时间', formatDate(detail.created_at), false],
          ].map(([label, value, mono]) => (
            <div key={label as string}>
              <p className="text-xs text-slate-400 mb-1">{label as string}</p>
              <p className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>{value as string}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Banknote size={15} className="text-amber-500" />
            入账状态
          </h3>
        </div>
        <div className="px-6 py-5 flex items-center gap-6">
          <div className="flex items-center gap-2">
            {creditStatusIcons[detail.credit_status]}
            <span className="text-sm font-medium">{CREDIT_STATUS_LABELS[detail.credit_status]}</span>
          </div>
          {detail.credit_time && (
            <p className="text-sm text-slate-500">入账时间：{formatDate(detail.credit_time)}</p>
          )}
        </div>
      </div>

      {detail.refund_basis && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText size={15} className="text-amber-500" />
              退款依据
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 px-6 py-5">
            <div>
              <p className="text-xs text-slate-400 mb-1">退款原因</p>
              <p className="text-sm text-slate-800">{detail.refund_basis}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">退款金额</p>
              <p className="text-sm font-medium text-slate-800" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ¥{formatMoney(detail.refund_amount || 0)}
              </p>
            </div>
            {detail.refund_account && (
              <div>
                <p className="text-xs text-slate-400 mb-1">退款账户</p>
                <p className="text-sm text-slate-800">{detail.refund_account}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {canChoosePath && !activeAction && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50">
            <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-500" />
              选择处理路径
            </h3>
            <p className="text-xs text-amber-600 mt-1">支付成功但未入账，请选择补记账或退款方式处理</p>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveAction('supplement')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50 hover:border-cyan-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <BookPlus size={24} className="text-cyan-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-cyan-800">补记账</p>
                <p className="text-xs text-cyan-600 mt-1">直接将充值金额入账到餐卡</p>
              </div>
            </button>
            <button
              onClick={() => setActiveAction('refund')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Banknote size={24} className="text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-amber-800">退款</p>
                <p className="text-xs text-amber-600 mt-1">原路退回到支付账户</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {canVerify && !activeAction && (
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 size={16} />
            <span>到账正常，点击确认完成核对</span>
          </div>
          <button
            onClick={handleVerify}
            className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
          >
            确认核对
          </button>
        </div>
      )}

      {canRefund && !activeAction && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Banknote size={16} />
            <span>需要发起退款申请</span>
          </div>
          <button
            onClick={() => setActiveAction('refund')}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            发起退款
          </button>
        </div>
      )}

      {canResubmit && !activeAction && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <RotateCcw size={16} />
            <span>已退回补证，请补充证据后重新提交</span>
          </div>
          <button
            onClick={() => setActiveAction('refund')}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            重新发起退款
          </button>
        </div>
      )}

      {activeAction === 'refund' && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50">
            <h3 className="text-sm font-semibold text-amber-800">填写退款信息</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">退款依据</label>
              <textarea
                value={refundForm.basis}
                onChange={(e) => setRefundForm({ ...refundForm, basis: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                rows={2}
                placeholder="请输入退款原因和依据"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">退款金额</label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  placeholder={String(detail.amount)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">退款账户</label>
                <input
                  type="text"
                  value={refundForm.account}
                  onChange={(e) => setRefundForm({ ...refundForm, account: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  placeholder="原路退回账户"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setActiveAction(null)}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1"
              >
                <Send size={14} />
                提交退款
              </button>
            </div>
          </div>
        </div>
      )}

      {activeAction === 'supplement' && (
        <div className="bg-white rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-cyan-100 bg-cyan-50/50">
            <h3 className="text-sm font-semibold text-cyan-800">补记账确认</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="bg-cyan-50 rounded-lg p-4 text-sm text-cyan-700">
              将把充值金额 ¥{formatMoney(detail.amount)} 直接入账到餐卡 {detail.card_no}（持卡人：{detail.holder_name}）
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">备注</label>
              <textarea
                value={supplementRemark}
                onChange={(e) => setSupplementRemark(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                rows={2}
                placeholder="补充说明（可选）"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setActiveAction(null)}
                className="px-4 py-2 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSupplement}
                className="px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-1"
              >
                <BookPlus size={14} />
                确认补记账
              </button>
            </div>
          </div>
        </div>
      )}

      {canReview && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/50">
            <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <User size={15} />
              复核操作
            </h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">复核意见</label>
              <textarea
                value={reviewRemark}
                onChange={(e) => setReviewRemark(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                rows={2}
                placeholder="请输入复核意见"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleReview('return')}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <CornerDownLeft size={14} />
                退回补证
              </button>
              <button
                onClick={() => handleReview('confirm')}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 size={14} />
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <History size={15} className="text-amber-500" />
            处理历史
          </h3>
        </div>
        <div className="px-6 py-5">
          {!detail.histories || detail.histories.length === 0 ? (
            <p className="text-sm text-slate-400">暂无处理记录</p>
          ) : (
            <div className="space-y-0">
              {detail.histories.map((h, i) => (
                <div key={h.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      {historyActionIcons[h.action]}
                    </div>
                    {i < detail.histories.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 my-1" />
                    )}
                  </div>
                  <div className="pb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">
                        {HISTORY_ACTION_LABELS[h.action]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {h.operator_role === 'handler' ? '经办人' : '复核人'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{h.operator}</p>
                    {h.remark && (
                      <p className="text-sm text-slate-600 mt-1.5 bg-slate-50 rounded-lg px-3 py-2">
                        {h.remark}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">{formatDate(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
