'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { 
  getStatusLabel, 
  getStatusColor, 
  getDocumentTypeLabel,
  getDocumentStatusLabel,
  OrderStatus
} from '@/lib/mockData';
import { useOrderStore } from '@/lib/orderStore';

type ModalType = 'approve' | 'reject' | 'archive' | 'supplement' | 'classification' | 'amount' | null;

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { orders, loading, fetchOrder, approveOrder, rejectOrder, archiveOrder, supplementDocuments, resolveClassification, resolveAmountDiscrepancy, useMockFallback } = useOrderStore();
  const order = orders.find(o => o.id === params.id);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id);
    }
  }, [params.id, fetchOrder]);
  
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [supplementNotes, setSupplementNotes] = useState('');
  const [finalHsCode, setFinalHsCode] = useState('');
  const [classificationNotes, setClassificationNotes] = useState('');
  const [correctedAmount, setCorrectedAmount] = useState('');
  const [amountNotes, setAmountNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (order?.classificationNote) {
      setFinalHsCode(order.classificationNote.suggestedHsCode);
    }
    if (order?.amountDiscrepancy) {
      setCorrectedAmount(order.amountDiscrepancy.actualAmount.toString());
    }
  }, [order]);

  if (loading && !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const canApprove = order.status === 'UNDER_REVIEW';
  const canReject = order.status === 'UNDER_REVIEW' || order.status === 'INVOICE_MISMATCH' || order.status === 'CLASSIFICATION_CONFLICT' || order.status === 'ID_MISSING';
  const canArchive = order.status === 'APPROVED' || order.status === 'REJECTED';
  const canSupplement = order.status === 'ID_MISSING' || order.status === 'DOCUMENTS_INCOMPLETE';
  const canResolveClassification = order.status === 'CLASSIFICATION_CONFLICT';
  const canResolveAmount = order.status === 'INVOICE_MISMATCH';
  const hasAmountMismatch = order.status === 'INVOICE_MISMATCH' && order.amountDiscrepancy && !order.amountDiscrepancy.resolved;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveOrder(order.id, '李明');
      showToast('订单已放行', 'success');
      setShowModal(null);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('请输入退回原因', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await rejectOrder(order.id, '李明', rejectReason);
      showToast('订单已退回', 'success');
      setShowModal(null);
      setRejectReason('');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await archiveOrder(order.id, '系统');
      showToast('订单已归档', 'success');
      setShowModal(null);
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSupplement = async () => {
    if (!supplementNotes.trim()) {
      showToast('请输入补充说明', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await supplementDocuments(order.id, '张伟', supplementNotes);
      showToast('资料补充完成，已提交关务复核', 'success');
      setShowModal(null);
      setSupplementNotes('');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveClassification = async () => {
    if (!finalHsCode.trim()) {
      showToast('请输入最终HS编码', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await resolveClassification(order.id, '张伟', finalHsCode, classificationNotes);
      showToast('归类说明已确认，已提交关务复核', 'success');
      setShowModal(null);
      setClassificationNotes('');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveAmount = async () => {
    const amount = parseFloat(correctedAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('请输入有效金额', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      await resolveAmountDiscrepancy(order.id, '张伟', amount, amountNotes);
      showToast('金额更正完成，已提交关务复核', 'success');
      setShowModal(null);
      setAmountNotes('');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const documentStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'MISSING': return 'bg-red-100 text-red-800';
      case 'MISMATCH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/" className="text-gray-500 hover:text-primary">
            ← 返回列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">订单详情</h1>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status as OrderStatus)}`}>
            {getStatusLabel(order.status as OrderStatus)}
          </span>
          {useMockFallback && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              ⚠️ 演示模式
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canSupplement && (
            <button
              onClick={() => setShowModal('supplement')}
              disabled={isProcessing}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📝 补资料
            </button>
          )}
          {canResolveClassification && (
            <button
              onClick={() => setShowModal('classification')}
              disabled={isProcessing}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🏷️ 归类说明
            </button>
          )}
          {canResolveAmount && (
            <button
              onClick={() => setShowModal('amount')}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              💰 更正金额
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => setShowModal('approve')}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ 确认放行
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setShowModal('reject')}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✗ 退回
            </button>
          )}
          {canArchive && (
            <button
              onClick={() => setShowModal('archive')}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📁 归档
            </button>
          )}
        </div>
      </div>

      {hasAmountMismatch && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-500 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-medium text-red-800 mb-2">发票金额不符 - 无法放行</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-500">申报金额</div>
                  <div className="text-lg font-bold text-gray-800">¥{order.amountDiscrepancy!.declaredAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">实际金额</div>
                  <div className="text-lg font-bold text-red-600">¥{order.amountDiscrepancy!.actualAmount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">差异金额</div>
                  <div className="text-lg font-bold text-red-600">+¥{order.amountDiscrepancy!.difference.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">差异比例</div>
                  <div className="text-lg font-bold text-red-600">+{order.amountDiscrepancy!.differencePercent}%</div>
                </div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-sm font-medium text-gray-700 mb-1">差异来源：</div>
                <div className="text-sm text-gray-600">{order.amountDiscrepancy!.discrepancySource}</div>
              </div>
              <div className="bg-white rounded p-3 mt-2">
                <div className="text-sm font-medium text-gray-700 mb-1">更正路径：</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">{order.amountDiscrepancy!.correctionPath}</div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowModal('amount')}
                  className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                >
                  💰 更正金额
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {order.classificationNote && !order.classificationNote.resolved && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-orange-500 text-xl">📋</div>
            <div className="flex-1">
              <h3 className="font-medium text-orange-800 mb-2">品名归类冲突</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-500">商品名称</div>
                  <div className="font-medium text-gray-800">{order.classificationNote.itemName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">申报HS编码</div>
                  <div className="font-medium text-orange-600">{order.classificationNote.declaredHsCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">建议HS编码</div>
                  <div className="font-medium text-green-600">{order.classificationNote.suggestedHsCode}</div>
                </div>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-sm font-medium text-gray-700 mb-1">归类说明：</div>
                <div className="text-sm text-gray-600">{order.classificationNote.reason}</div>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowModal('classification')}
                  className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                >
                  🏷️ 确认归类
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 订单基本信息</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">订单号</div>
                <div className="font-medium text-gray-800">{order.orderNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">来源平台</div>
                <div className="font-medium text-gray-800">{order.source}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">来源订单号</div>
                <div className="font-medium text-gray-800">{order.sourceOrderNo || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">运单号</div>
                <div className="font-medium text-gray-800">{order.trackingNumber || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">始发国</div>
                <div className="font-medium text-gray-800">{order.country}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">商品品类</div>
                <div className="font-medium text-gray-800">{order.category}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">申报价值</div>
                <div className="font-medium text-gray-800">¥{order.declaredValue.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">创建时间</div>
                <div className="font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📦 商品明细</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">商品名称</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">申报品名</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">HS编码</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">数量</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">单价</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">总价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{item.name}</div>
                        {item.classificationNote && (
                          <div className="text-xs text-orange-600">{item.classificationNote}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.declaredName}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm">{item.hsCode || '-'}</div>
                        {item.declaredHsCode && item.declaredHsCode !== item.hsCode && (
                          <div className="text-xs text-orange-600">申报: {item.declaredHsCode}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">¥{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">¥{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📄 单证资料</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.documents.map(doc => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      📄
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{getDocumentTypeLabel(doc.type)}</div>
                      <div className="text-sm text-gray-500">{doc.name}</div>
                      {doc.notes && (
                        <div className="text-xs text-red-600">{doc.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${documentStatusColor(doc.status)}`}>
                      {getDocumentStatusLabel(doc.status)}
                    </span>
                    {doc.uploadedBy && (
                      <div className="text-xs text-gray-500 mt-1">上传: {doc.uploadedBy}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {canSupplement && (
              <div className="mt-4">
                <button
                  onClick={() => setShowModal('supplement')}
                  className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  📝 补充资料
                </button>
              </div>
            )}
          </div>

          {order.clearanceBasis && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">✅ 放行依据</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">清关方式</div>
                    <div className="font-medium text-gray-800">{order.clearanceBasis.basisType}</div>
                  </div>
                  {order.clearanceBasis.regulationReference && (
                    <div>
                      <div className="text-sm text-gray-500">法规依据</div>
                      <div className="font-medium text-gray-800">{order.clearanceBasis.regulationReference}</div>
                    </div>
                  )}
                </div>
                {order.clearanceBasis.explanation && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-500">说明</div>
                    <div className="text-gray-700">{order.clearanceBasis.explanation}</div>
                  </div>
                )}
                {order.clearanceBasis.approvedBy && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="text-sm text-gray-500">批准人</div>
                    <div className="font-medium text-gray-800">{order.clearanceBasis.approvedBy}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👤 收件人信息</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">姓名</div>
                <div className="font-medium text-gray-800">{order.recipientName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">证件类型</div>
                <div className="font-medium text-gray-800">{order.recipientIdType || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">证件号码</div>
                <div className="font-medium text-gray-800 font-mono">
                  {order.recipientIdNumber || (
                    <span className="text-red-600">⚠️ 缺失</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👥 责任人</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">单证经办人</div>
                  <div className="font-medium text-gray-800">{order.documentHandlerName || '未分配'}</div>
                </div>
                <div className="text-blue-600">📝</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">关务复核人</div>
                  <div className="font-medium text-gray-800">{order.customsReviewerName || '未分配'}</div>
                </div>
                <div className="text-green-600">✅</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📜 处理节点</h2>
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {order.historyNodes.map((node, index) => (
                  <div key={node.id} className="relative pl-8">
                    <div className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      index === order.historyNodes.length - 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{node.action}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(node.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {node.operator} ({node.role})
                      </div>
                      {node.notes && (
                        <div className="text-sm text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                          {node.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {showModal === 'approve' && '确认放行'}
              {showModal === 'reject' && '确认退回'}
              {showModal === 'archive' && '确认归档'}
              {showModal === 'supplement' && '补充资料'}
              {showModal === 'classification' && '确认归类'}
              {showModal === 'amount' && '更正金额'}
            </h3>

            {showModal === 'approve' && (
              <p className="text-gray-600 mb-6">
                确定要放行此订单吗？放行后将进入清关流程。
              </p>
            )}

            {showModal === 'reject' && (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  确定要退回此订单吗？请在备注中说明退回原因。
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请输入退回原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>
            )}

            {showModal === 'archive' && (
              <p className="text-gray-600 mb-6">
                确定要归档此订单吗？归档后将从待处理列表移除。
              </p>
            )}

            {showModal === 'supplement' && (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  补充缺失的资料后提交关务复核。
                </p>
                <textarea
                  value={supplementNotes}
                  onChange={(e) => setSupplementNotes(e.target.value)}
                  placeholder="请输入补充说明..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                />
              </div>
            )}

            {showModal === 'classification' && (
              <div className="mb-6 space-y-4">
                <p className="text-gray-600">
                  确认最终HS编码后提交关务复核。
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最终HS编码</label>
                  <input
                    type="text"
                    value={finalHsCode}
                    onChange={(e) => setFinalHsCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
                  <textarea
                    value={classificationNotes}
                    onChange={(e) => setClassificationNotes(e.target.value)}
                    placeholder="请输入归类说明..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  />
                </div>
              </div>
            )}

            {showModal === 'amount' && (
              <div className="mb-6 space-y-4">
                <p className="text-gray-600">
                  更正金额后提交关务复核。更正后放行按钮将启用。
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更正后金额</label>
                  <input
                    type="number"
                    value={correctedAmount}
                    onChange={(e) => setCorrectedAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更正说明</label>
                  <textarea
                    value={amountNotes}
                    onChange={(e) => setAmountNotes(e.target.value)}
                    placeholder="请输入金额更正说明..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (showModal === 'approve') handleApprove();
                  else if (showModal === 'reject') handleReject();
                  else if (showModal === 'archive') handleArchive();
                  else if (showModal === 'supplement') handleSupplement();
                  else if (showModal === 'classification') handleResolveClassification();
                  else if (showModal === 'amount') handleResolveAmount();
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  showModal === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  showModal === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  showModal === 'archive' ? 'bg-gray-600 hover:bg-gray-700' :
                  showModal === 'supplement' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  showModal === 'classification' ? 'bg-orange-500 hover:bg-orange-600' :
                  'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
