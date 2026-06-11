'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
  REJECT_REASON_LABELS,
  formatDate,
  formatDateTime,
} from '@/lib/constants';

interface Order {
  id: number;
  orderNo: string;
  productName: string;
  category: string;
  quantity: number;
  paperType: string;
  paperWeight: string | null;
  size: string;
  craft: string;
  colorMode: string;
  description: string | null;
  status: string;
  deliveryDate: string;
  originalDeliveryDate: string | null;
  rejectReason: string | null;
  rejectRemark: string | null;
  returnReason: string | null;
  createdAt: string;
  updatedAt: string;
  customerId: number;
  customerName: string;
  contactPerson: string;
  customerPhone: string;
  customerEmail: string | null;
  customerAddress: string | null;
  salesName: string;
}

interface Proof {
  id: number;
  orderId: number;
  version: number;
  imageUrl: string;
  remark: string | null;
  uploadedBy: number;
  colorDeviation: string | null;
  createdAt: string;
}

interface HistoryItem {
  id: number;
  orderId: number;
  status: string;
  operatorId: number | null;
  operatorName: string;
  remark: string | null;
  createdAt: string;
}

export default function OrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('color_deviation');
  const [rejectRemark, setRejectRemark] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [proofRemark, setProofRemark] = useState('');
  const [colorDeviation, setColorDeviation] = useState('');

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data.order);
      setProofs(data.proofs);
      setHistory(data.history);
    }
    setLoading(false);
  };

  const handleStatusChange = async (action: string, data: any = {}) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        operatorId: 1,
        operatorName: '演示用户',
        ...data,
      }),
    });

    if (res.ok) {
      fetchOrderDetail();
      setShowRejectModal(false);
      setShowReturnModal(false);
      setShowProofModal(false);
      setRejectRemark('');
      setReturnReason('');
      setProofRemark('');
      setColorDeviation('');
    } else {
      const err = await res.json();
      alert(err.error || '操作失败');
    }
  };

  const canSubmit = order?.status === 'draft';
  const canUploadProof = order?.status === 'submitted' || order?.status === 'customer_rejected' || order?.status === 'order_returned';
  const canCustomerConfirm = order?.status === 'proof_uploaded';
  const canSendToProduction = order?.status === 'customer_confirmed';
  const canPlaceOrder = order?.status === 'production_review';
  const canReturn = order?.status === 'production_review';

  const isCustomerConfirmed = order?.status === 'customer_confirmed' ||
    order?.status === 'production_review' ||
    order?.status === 'order_placed';

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">订单不存在</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回订单列表
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{order.productName}</h1>
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              订单号：{order.orderNo}
              <span className="mx-2">·</span>
              {CATEGORY_LABELS[order.category as keyof typeof CATEGORY_LABELS] || order.category}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmit && (
              <button
                onClick={() => handleStatusChange('submit')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                提交订单
              </button>
            )}
            {canUploadProof && (
              <button
                onClick={() => setShowProofModal(true)}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
              >
                上传打样
              </button>
            )}
            {canCustomerConfirm && (
              <>
                <button
                  onClick={() => handleStatusChange('customer_confirm')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  客户确认
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                >
                  客户拒绝
                </button>
              </>
            )}
            {canSendToProduction && (
              <button
                onClick={() => handleStatusChange('send_to_production')}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
              >
                提交生产复核
              </button>
            )}
            {canPlaceOrder && (
              <button
                onClick={() => handleStatusChange('place_order')}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
              >
                确认下单
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700"
              >
                退回订单
              </button>
            )}
          </div>
        </div>

        {order.status === 'proof_uploaded' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">提示：</span>
              客户未确认样稿，当前禁止下单生产。请等待客户确认后再提交生产复核。
            </p>
          </div>
        )}

        {order.rejectReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-medium">拒绝原因：</span>
              {REJECT_REASON_LABELS[order.rejectReason as keyof typeof REJECT_REASON_LABELS]}
            </p>
            {order.rejectRemark && (
              <p className="text-sm text-red-700 mt-1">{order.rejectRemark}</p>
            )}
          </div>
        )}

        {order.returnReason && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <span className="font-medium">退回原因：</span>
              {order.returnReason}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'info', label: '订单信息' },
              { id: 'proof', label: '打样稿' },
              { id: 'history', label: '历史记录' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  客户信息
                </h3>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">客户名称</span>
                    <span className="text-sm font-medium text-gray-900">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">联系人</span>
                    <span className="text-sm text-gray-900">{order.contactPerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">联系电话</span>
                    <span className="text-sm text-gray-900">{order.customerPhone}</span>
                  </div>
                  {order.customerEmail && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">邮箱</span>
                      <span className="text-sm text-gray-900">{order.customerEmail}</span>
                    </div>
                  )}
                  {order.customerAddress && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">地址</span>
                      <span className="text-sm text-gray-900 text-right max-w-[60%]">{order.customerAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  交期信息
                </h3>
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">当前交期</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(order.deliveryDate)}</span>
                  </div>
                  {order.originalDeliveryDate && order.originalDeliveryDate !== order.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">原定交期</span>
                      <span className="text-sm text-gray-400 line-through">{formatDate(order.originalDeliveryDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">业务员</span>
                    <span className="text-sm text-gray-900">{order.salesName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">创建时间</span>
                    <span className="text-sm text-gray-900">{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  产品与工艺
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">产品名称</p>
                    <p className="text-sm font-medium text-gray-900">{order.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">数量</p>
                    <p className="text-sm font-medium text-gray-900">{order.quantity.toLocaleString()} 份</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">规格尺寸</p>
                    <p className="text-sm font-medium text-gray-900">{order.size}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">彩色模式</p>
                    <p className="text-sm font-medium text-gray-900">{order.colorMode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">纸张类型</p>
                    <p className="text-sm font-medium text-gray-900">{order.paperType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">纸张克重</p>
                    <p className="text-sm font-medium text-gray-900">{order.paperWeight || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">工艺要求</p>
                    <p className="text-sm font-medium text-gray-900">{order.craft}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">产品品类</p>
                    <p className="text-sm font-medium text-gray-900">
                      {CATEGORY_LABELS[order.category as keyof typeof CATEGORY_LABELS] || order.category}
                    </p>
                  </div>
                </div>
                {order.description && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">备注说明</p>
                    <p className="text-sm text-gray-700">{order.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'proof' && (
            <div>
              {proofs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">暂无打样稿</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {proofs.map((proof) => (
                    <div key={proof.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs text-gray-500">样稿占位图</p>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          第 {proof.version} 版
                        </div>
                        {proof.colorDeviation && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            颜色偏差
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900">版本 v{proof.version}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDateTime(proof.createdAt)}</p>
                        {proof.remark && (
                          <p className="text-xs text-gray-600 mt-2">{proof.remark}</p>
                        )}
                        {proof.colorDeviation && (
                          <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                            颜色问题：{proof.colorDeviation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {history.map((item, index) => (
                  <div key={item.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                      index === history.length - 1 ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-gray-400'
                    }`}></div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]}
                        </span>
                        <span className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500">操作人：{item.operatorName}</p>
                      {item.remark && (
                        <p className="text-sm text-gray-700 mt-2">{item.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">客户拒绝样稿</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">拒绝原因</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {Object.entries(REJECT_REASON_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">详细说明</label>
                <textarea
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  placeholder="请详细说明拒绝原因..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => handleStatusChange('customer_reject', { rejectReason, remark: rejectRemark })}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">退回订单</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">退回原因</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="请填写退回原因..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => handleStatusChange('return_order', { returnReason })}
                className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                disabled={!returnReason.trim()}
              >
                确认退回
              </button>
            </div>
          </div>
        </div>
      )}

      {showProofModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">上传打样</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-500">点击或拖拽上传样稿图片</p>
                <p className="text-xs text-gray-400 mt-1">演示模式：将使用占位图</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">版本说明</label>
                <textarea
                  value={proofRemark}
                  onChange={(e) => setProofRemark(e.target.value)}
                  placeholder="请填写本版打样说明..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">颜色偏差说明（如有）</label>
                <input
                  type="text"
                  value={colorDeviation}
                  onChange={(e) => setColorDeviation(e.target.value)}
                  placeholder="例如：蓝色偏紫"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={() => handleStatusChange('upload_proof', { proofRemark, colorDeviation })}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
