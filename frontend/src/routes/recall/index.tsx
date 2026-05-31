import { component$, useResource$, Resource, useSignal, $, useTask$ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { 
  RecallRecord, 
  UpdateRecallStatusRequest, 
  RecallSiteNotification,
  RecallDetail,
  PendingRecallBatch,
  CreateRecallRequest
} from '~/types';
import { RecallStatusLabels, RecallStatusColors } from '~/types';
import { 
  RotateCcw, CheckCircle, Clock, AlertCircle, Send, Plus, MapPin, 
  Phone, CheckCircle2, XCircle, Loader2, Package, ArrowRight, Trash2
} from 'lucide-qwik';

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

export default component$(() => {
  const showDetailModal = useSignal(false);
  const showPendingModal = useSignal(false);
  const selectedDetail = useSignal<RecallDetail | null>(null);
  const selectedStatus = useSignal<string>('all');
  const refreshSignal = useSignal(0);
  const isSubmitting = useSignal(false);
  const toast = useSignal<ToastState>({ show: false, type: 'success', message: '' });

  useTask$(({ track }) => {
    track(() => toast.value.show);
    if (toast.value.show) {
      const timer = setTimeout(() => {
        toast.value = { ...toast.value, show: false };
      }, 3000);
      return () => clearTimeout(timer);
    }
  });

  const showToast = $((type: 'success' | 'error', message: string) => {
    toast.value = { show: true, type, message };
  });

  const recallsResource = useResource$<RecallRecord[]>(async ({ track }) => {
    track(() => refreshSignal.value);
    track(() => selectedStatus.value);
    let url = '/api/recall-records';
    if (selectedStatus.value !== 'all') {
      url += `?status=${selectedStatus.value}`;
    }
    const response = await api.get<RecallRecord[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const pendingBatchesResource = useResource$<PendingRecallBatch[]>(async ({ track }) => {
    track(() => refreshSignal.value);
    const response = await api.get<PendingRecallBatch[]>('/api/recall-batches/pending');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  });

  const statsResource = useResource$<{
    total: number;
    notified: number;
    inProgress: number;
    completed: number;
    pendingBatches: number;
  }>(async ({ track }) => {
    track(() => refreshSignal.value);
    const [recalls, batches] = await Promise.all([
      api.get<RecallRecord[]>('/api/recall-records'),
      api.get<PendingRecallBatch[]>('/api/recall-batches/pending')
    ]);
    
    const records = recalls.success ? recalls.data || [] : [];
    const pendingCount = batches.success ? (batches.data || []).length : 0;
    
    return {
      total: records.length,
      notified: records.filter(r => r.status === 'notified').length,
      inProgress: records.filter(r => r.status === 'in_progress').length,
      completed: records.filter(r => r.status === 'completed').length,
      pendingBatches: pendingCount,
    };
  });

  const updateStatus = $(async (id: string, status: string) => {
    isSubmitting.value = true;
    try {
      const request: UpdateRecallStatusRequest = {
        status: status as any,
      };
      const response = await api.put(`/api/recall-records/${id}/status`, request);
      if (response.success) {
        refreshSignal.value++;
        const statusLabel = status === 'in_progress' ? '召回进行中' : '召回已完成';
        showToast('success', `${statusLabel}！`);
      } else {
        showToast('error', response.message || '操作失败');
      }
    } catch (e) {
      showToast('error', '网络异常，请稍后重试');
    } finally {
      isSubmitting.value = false;
    }
  });

  const initiateRecall = $(async (batch: PendingRecallBatch) => {
    isSubmitting.value = true;
    try {
      const sites = batch.site_inventories.map(s => s.site_name).join(', ');
      const request: CreateRecallRequest = {
        batch_id: batch.batch_id,
        batch_no: batch.batch_no,
        vaccine_name: batch.vaccine_name,
        total_quantity: batch.total_quantity,
        reason: batch.deviation_reason || '温控偏差召回',
        vaccination_sites: sites,
        quarantine_id: batch.quarantine_id,
      };
      
      const response = await api.post('/api/recall-records', request);
      if (response.success) {
        refreshSignal.value++;
        showToast('success', '召回发起成功！');
      } else {
        showToast('error', response.message || '操作失败');
      }
    } catch (e) {
      showToast('error', '网络异常，请稍后重试');
    } finally {
      isSubmitting.value = false;
    }
  });

  const loadDetail = $(async (id: string) => {
    const response = await api.get<RecallDetail>(`/api/recall-records/${id}/detail`);
    if (response.success && response.data) {
      selectedDetail.value = response.data;
      showDetailModal.value = true;
    } else {
      showToast('error', '加载详情失败');
    }
  });

  const confirmSiteNotification = $(async (notificationId: string, returnedQuantity: number, note: string) => {
    const response = await api.put(`/api/recall-site-notifications/${notificationId}/confirm`, {
      returned_quantity: returnedQuantity,
      note: note,
    });
    if (response.success) {
      refreshSignal.value++;
      if (selectedDetail.value) {
        loadDetail(selectedDetail.value.id);
      }
      showToast('success', '接种点确认成功！');
    } else {
      showToast('error', response.message || '操作失败');
    }
  });

  const getNextStatus = (current: string) => {
    const flow = ['notified', 'in_progress', 'completed'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const nextStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'notified': '开始召回',
      'in_progress': '完成召回',
    };
    return labels[status] || null;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">召回协同</h1>
          <p class="text-gray-500 mt-1">跟踪和管理问题疫苗批次的召回流程，协同接种点完成召回</p>
        </div>
        <Button onClick$={() => { showPendingModal.value = true; }}>
          <Plus class="w-4 h-4 mr-2" />
          发起召回
        </Button>
      </div>

      <Resource
        value={statsResource}
        onPending={() => (
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <div class="h-20 animate-pulse bg-gray-100 rounded" />
              </Card>
            ))}
          </div>
        )}
        onResolved={(stats) => (
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">待发起召回</p>
                  <p class="text-3xl font-bold text-orange-600 mt-1">{stats.pendingBatches}</p>
                </div>
                <Package class="w-10 h-10 text-orange-400" />
              </div>
            </Card>
            <Card>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">召回总数</p>
                  <p class="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <RotateCcw class="w-10 h-10 text-gray-400" />
              </div>
            </Card>
            <Card>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">已通知</p>
                  <p class="text-3xl font-bold text-yellow-600 mt-1">{stats.notified}</p>
                </div>
                <AlertCircle class="w-10 h-10 text-yellow-500" />
              </div>
            </Card>
            <Card>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">召回中</p>
                  <p class="text-3xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
                </div>
                <Clock class="w-10 h-10 text-blue-500" />
              </div>
            </Card>
            <Card>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">已完成</p>
                  <p class="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
                </div>
                <CheckCircle class="w-10 h-10 text-green-500" />
              </div>
            </Card>
          </div>
        )}
      />

      <div class="flex space-x-4">
        <select
          class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={selectedStatus.value}
          onChange$={(e) => { selectedStatus.value = (e.target as HTMLSelectElement).value; }}
        >
          <option value="all">全部状态</option>
          <option value="notified">已通知</option>
          <option value="in_progress">召回中</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <Card title="召回列表">
        <Resource
          value={recallsResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(records) =>
            records.length === 0 ? (
              <EmptyState 
                message="暂无召回记录" 
                description="点击右上角'发起召回'按钮，从待召回批次中发起召回任务。" 
              />
            ) : (
              <div class="space-y-4">
                {records.map((record) => {
                  const nextStatus = getNextStatus(record.status);
                  return (
                    <div
                      key={record.id}
                      class="p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex items-start space-x-4">
                          <div class={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            record.status === 'completed' ? 'bg-green-100' : 
                            record.status === 'in_progress' ? 'bg-blue-100' : 'bg-yellow-100'
                          }`}>
                            <RotateCcw class={`w-6 h-6 ${
                              record.status === 'completed' ? 'text-green-600' : 
                              record.status === 'in_progress' ? 'text-blue-600' : 'text-yellow-600'
                            }`} />
                          </div>
                          <div>
                            <div class="flex items-center space-x-3">
                              <h3 class="font-semibold text-gray-900 text-lg">{record.recall_no}</h3>
                              <span class={`px-3 py-1 rounded-full text-xs font-medium ${RecallStatusColors[record.status]}`}>
                                {RecallStatusLabels[record.status]}
                              </span>
                            </div>
                            <p class="text-gray-600 mt-1">{record.vaccine_name}</p>
                            <p class="text-sm text-gray-500">批次号: {record.batch_no} | 召回数量: {record.total_quantity} 支</p>
                            <p class="text-sm text-gray-500 mt-1">通知时间: {formatDate(record.notified_at)}</p>
                          </div>
                        </div>
                        <div class="flex flex-col items-end space-y-2">
                          {nextStatus && (
                            <Button 
                              size="sm" 
                              onClick$={() => updateStatus(record.id, nextStatus)}
                              disabled={isSubmitting.value}
                              variant={nextStatus === 'completed' ? 'primary' : 'secondary'}
                            >
                              {isSubmitting.value ? (
                                <Loader2 class="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Send class="w-4 h-4 mr-1" />
                              )}
                              {nextStatusLabel(record.status)}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick$={() => loadDetail(record.id)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>

                      <div class="mt-6">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-gray-700">召回进度</span>
                          <span class="text-sm text-gray-500">
                            {record.status === 'completed' ? '100%' : 
                             record.status === 'in_progress' ? '50%' : 
                             record.status === 'notified' ? '20%' : '0%'}
                          </span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div
                            class={`h-2 rounded-full transition-all duration-500 ${
                              record.status === 'completed' ? 'bg-green-600' : 
                              record.status === 'in_progress' ? 'bg-blue-600' : 'bg-yellow-500'
                            }`}
                            style={{
                              width: record.status === 'completed' ? '100%' :
                                     record.status === 'in_progress' ? '50%' :
                                     record.status === 'notified' ? '20%' : '0%'
                            }}
                          />
                        </div>
                        <div class="flex justify-between mt-2 text-xs text-gray-500">
                          <div class="flex items-center">
                            <AlertCircle class="w-3 h-3 mr-1 text-yellow-500" />
                            已通知
                          </div>
                          <div class="flex items-center">
                            <Clock class="w-3 h-3 mr-1 text-blue-500" />
                            进行中
                          </div>
                          <div class="flex items-center">
                            <CheckCircle class="w-3 h-3 mr-1 text-green-500" />
                            已完成
                          </div>
                        </div>
                      </div>

                      <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600">
                          <span class="font-medium">召回原因：</span>
                          {record.reason}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        />
      </Card>

      <Modal 
        title="发起召回" 
        isOpen={showPendingModal.value} 
        onClose$={() => { showPendingModal.value = false; }} 
        size="lg"
      >
        <Resource
          value={pendingBatchesResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(batches) =>
            batches.length === 0 ? (
              <EmptyState 
                message="暂无待召回批次" 
                description="所有已隔离批次均已复核完成。如有需要，请在温控偏差看板中对问题批次进行隔离。" 
              />
            ) : (
              <div class="space-y-4">
                <p class="text-sm text-gray-500 mb-4">以下批次已隔离待复核，选择批次发起召回：</p>
                {batches.map((batch) => (
                  <div 
                    key={batch.batch_id}
                    class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="font-semibold text-gray-900">{batch.vaccine_name}</h4>
                        <p class="text-sm text-gray-500">批次号: {batch.batch_no}</p>
                        <p class="text-sm text-gray-500">生产厂家: {batch.manufacturer}</p>
                        <p class="text-sm text-gray-500">总数量: {batch.total_quantity} 支</p>
                        {batch.deviation_reason && (
                          <p class="text-sm text-orange-600 mt-2">
                            <AlertCircle class="w-4 h-4 inline mr-1" />
                            {batch.deviation_reason}
                          </p>
                        )}
                        <div class="mt-3 flex flex-wrap gap-2">
                          {batch.site_inventories.map((site, idx) => (
                            <span 
                              key={idx}
                              class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                            >
                              <MapPin class="w-3 h-3 mr-1" />
                              {site.site_name}: {site.actual_quantity} 支
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick$={() => {
                          initiateRecall(batch);
                          showPendingModal.value = false;
                        }}
                        disabled={isSubmitting.value}
                      >
                        {isSubmitting.value ? (
                          <Loader2 class="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <ArrowRight class="w-4 h-4 mr-1" />
                        )}
                        发起召回
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        />
      </Modal>

      <Modal 
        title="召回详情" 
        isOpen={showDetailModal.value} 
        onClose$={() => { showDetailModal.value = false; }} 
        size="xl"
      >
        {selectedDetail.value && (() => {
          const detail = selectedDetail.value;
          const confirmedCount = detail.notifications.filter(n => n.confirmed).length;
          const totalCount = detail.notifications.length;
          return (
            <div class="space-y-6">
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-lg">{detail.recall_no}</h3>
                    <p class="text-gray-500">{detail.vaccine_name}</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <StatusBadge 
                      text={`${confirmedCount}/${totalCount} 接种点已确认`}
                      variant={confirmedCount === totalCount ? 'success' : 'info'}
                    />
                    <StatusBadge 
                      text={RecallStatusLabels[detail.status]} 
                      variant={
                        detail.status === 'completed' ? 'success' :
                        detail.status === 'in_progress' ? 'info' :
                        detail.status === 'notified' ? 'warning' : 'danger'
                      }
                    />
                  </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">批次号：</span>
                    <span class="font-medium">{detail.batch_no}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">召回数量：</span>
                    <span class="font-medium">{detail.total_quantity} 支</span>
                  </div>
                  <div>
                    <span class="text-gray-500">通知时间：</span>
                    <span class="font-medium">{formatDate(detail.notified_at)}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">完成时间：</span>
                    <span class="font-medium">{detail.completed_at ? formatDate(detail.completed_at) : '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="font-medium mb-3">召回原因</h4>
                <p class="text-gray-600 bg-gray-50 p-3 rounded-lg">{detail.reason}</p>
              </div>

              <div>
                <h4 class="font-medium mb-3">接种点召回确认状态 ({confirmedCount}/{totalCount})</h4>
                {detail.notifications.length === 0 ? (
                  <p class="text-gray-500">暂无接种点数据</p>
                ) : (
                  <div class="space-y-3 max-h-96 overflow-y-auto">
                    {detail.notifications.map((notification: RecallSiteNotification) => (
                      <div 
                        key={notification.id}
                        class={`flex items-center justify-between p-4 border rounded-lg ${
                          notification.confirmed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div class="flex items-center space-x-4">
                          <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            notification.confirmed ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {notification.confirmed ? (
                              <CheckCircle2 class="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock class="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p class="font-medium">{notification.site_name}</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                              <span>应召回: {notification.quantity} 支</span>
                              {notification.confirmed && notification.returned_quantity !== undefined && (
                                <span class="text-green-600">已交回: {notification.returned_quantity} 支</span>
                              )}
                            </div>
                            {notification.confirmed && notification.confirmed_at && (
                              <p class="text-xs text-green-600 mt-1">
                                确认时间: {formatDate(notification.confirmed_at)}
                              </p>
                            )}
                            {notification.note && (
                              <p class="text-xs text-gray-500 mt-1">备注: {notification.note}</p>
                            )}
                          </div>
                        </div>
                        {!notification.confirmed && (
                          <div class="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick$={async () => {
                                const returned = window.prompt('请输入交回数量：', String(notification.quantity));
                                if (returned !== null) {
                                  const note = window.prompt('请输入备注（可选）：');
                                  confirmSiteNotification(
                                    notification.id, 
                                    parseInt(returned) || 0,
                                    note || ''
                                  );
                                }
                              }}
                            >
                              <Phone class="w-4 h-4 mr-1" />
                              确认交回
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick$={() => { showDetailModal.value = false; }}>
                  关闭
                </Button>
                {getNextStatus(detail.status) && (
                  <Button 
                    onClick$={() => {
                      updateStatus(detail.id, getNextStatus(detail.status)!);
                      showDetailModal.value = false;
                    }}
                    disabled={isSubmitting.value}
                  >
                    {isSubmitting.value ? (
                      <Loader2 class="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    {nextStatusLabel(detail.status)}
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {toast.value.show && (
        <div class="fixed top-4 right-4 z-50 animate-pulse">
          <div
            class={`flex items-center p-4 rounded-lg shadow-lg ${
              toast.value.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {toast.value.type === 'success' ? (
              <CheckCircle class="w-5 h-5 text-green-500 mr-3" />
            ) : (
              <XCircle class="w-5 h-5 text-red-500 mr-3" />
            )}
            <p
              class={`font-medium ${
                toast.value.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {toast.value.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
