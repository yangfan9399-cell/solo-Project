import { component$, useResource$, Resource, useSignal, $, useTask$ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { RecallRecord, UpdateRecallStatusRequest, SiteNotification } from '~/types';
import { RecallStatusLabels, RecallStatusColors } from '~/types';
import { RotateCcw, CheckCircle, Clock, AlertCircle, Send, Plus, MapPin, Phone, CheckCircle2, XCircle, Loader2 } from 'lucide-qwik';

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

export default component$(() => {
  const showDetailModal = useSignal(false);
  const selectedRecord = useSignal<RecallRecord | null>(null);
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

  const resource = useResource$<RecallRecord[]>(async ({ track }) => {
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

  const statsResource = useResource$<{
    total: number;
    notified: number;
    inProgress: number;
    completed: number;
  }>(async ({ track }) => {
    track(() => refreshSignal.value);
    const response = await api.get<RecallRecord[]>('/api/recall-records');
    if (response.success && response.data) {
      const records = response.data;
      return {
        total: records.length,
        notified: records.filter(r => r.status === 'notified').length,
        inProgress: records.filter(r => r.status === 'in_progress').length,
        completed: records.filter(r => r.status === 'completed').length,
      };
    }
    return { total: 0, notified: 0, inProgress: 0, completed: 0 };
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

  const parseSites = (sitesStr?: string): SiteNotification[] => {
    if (!sitesStr) return [];
    return sitesStr.split(',').map((name, idx) => ({
      site_id: `site_${idx}`,
      site_name: name.trim(),
      notified: true,
      confirmed: idx === 0,
      confirmed_at: idx === 0 ? new Date().toISOString() : undefined,
    }));
  };

  const openDetail = $(async (record: RecallRecord) => {
    selectedRecord.value = record;
    showDetailModal.value = true;
  });

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
      </div>

      <Resource
        value={statsResource}
        onPending={() => (
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <div class="h-20 animate-pulse bg-gray-100 rounded" />
              </Card>
            ))}
          </div>
        )}
        onResolved={(stats) => (
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <Card>
        <Resource
          value={resource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(records) =>
            records.length === 0 ? (
              <EmptyState 
                message="暂无召回记录" 
                description="系统运行正常，无召回任务。召回任务由疾控复核员在复核流程中发起。" 
              />
            ) : (
              <div class="space-y-4">
                {records.map((record) => {
                  const nextStatus = getNextStatus(record.status);
                  const sites = parseSites(record.vaccination_sites);
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
                            onClick$={() => openDetail(record)}
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

                      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-3 bg-gray-50 rounded-lg">
                          <p class="text-sm text-gray-600">
                            <span class="font-medium">召回原因：</span>
                            {record.reason}
                          </p>
                        </div>
                        <div class="p-3 bg-blue-50 rounded-lg">
                          <p class="text-sm text-blue-700 font-medium mb-2">
                            涉及接种点 ({sites.length})
                          </p>
                          <div class="flex flex-wrap gap-2">
                            {sites.slice(0, 3).map((site, idx) => (
                              <div 
                                key={idx}
                                class={`flex items-center px-2 py-1 rounded text-xs ${
                                  site.confirmed 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {site.confirmed ? (
                                  <CheckCircle2 class="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock class="w-3 h-3 mr-1" />
                                )}
                                {site.site_name}
                              </div>
                            ))}
                            {sites.length > 3 && (
                              <span class="text-xs text-gray-500">+{sites.length - 3}个</span>
                            )}
                          </div>
                        </div>
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
        title="召回详情" 
        isOpen={showDetailModal.value} 
        onClose$={() => { showDetailModal.value = false; }} 
        size="lg"
      >
        {selectedRecord.value && (() => {
          const record = selectedRecord.value;
          const sites = parseSites(record.vaccination_sites);
          return (
            <div class="space-y-6">
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="font-semibold text-lg">{record.recall_no}</h3>
                    <p class="text-gray-500">{record.vaccine_name}</p>
                  </div>
                  <StatusBadge 
                    text={RecallStatusLabels[record.status]} 
                    variant={
                      record.status === 'completed' ? 'success' :
                      record.status === 'in_progress' ? 'info' :
                      record.status === 'notified' ? 'warning' : 'danger'
                    }
                  />
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">批次号：</span>
                    <span class="font-medium">{record.batch_no}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">召回数量：</span>
                    <span class="font-medium">{record.total_quantity} 支</span>
                  </div>
                  <div>
                    <span class="text-gray-500">通知时间：</span>
                    <span class="font-medium">{formatDate(record.notified_at)}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">完成时间：</span>
                    <span class="font-medium">{record.completed_at ? formatDate(record.completed_at) : '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="font-medium mb-3">召回原因</h4>
                <p class="text-gray-600 bg-gray-50 p-3 rounded-lg">{record.reason}</p>
              </div>

              <div>
                <h4 class="font-medium mb-3">接种点通知状态 ({sites.length})</h4>
                {sites.length === 0 ? (
                  <p class="text-gray-500">暂无接种点数据</p>
                ) : (
                  <div class="space-y-2">
                    {sites.map((site, idx) => (
                      <div 
                        key={idx}
                        class="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div class="flex items-center space-x-3">
                          <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            site.confirmed ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {site.confirmed ? (
                              <CheckCircle2 class="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock class="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p class="font-medium">{site.site_name}</p>
                            <div class="flex items-center space-x-3 text-sm text-gray-500">
                              <span class="flex items-center">
                                <MapPin class="w-3 h-3 mr-1" />
                                已通知
                              </span>
                              {site.confirmed && site.confirmed_at && (
                                <span class="flex items-center text-green-600">
                                  <CheckCircle class="w-3 h-3 mr-1" />
                                  {formatDate(site.confirmed_at)} 已确认
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!site.confirmed && (
                          <Button size="sm" variant="secondary">
                            <Phone class="w-4 h-4 mr-1" />
                            催办
                          </Button>
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
                {getNextStatus(record.status) && (
                  <Button 
                    onClick$={() => {
                      updateStatus(record.id, getNextStatus(record.status)!);
                      showDetailModal.value = false;
                    }}
                    disabled={isSubmitting.value}
                  >
                    {isSubmitting.value ? (
                      <Loader2 class="w-4 h-4 mr-1 animate-spin" />
                    ) : null}
                    {nextStatusLabel(record.status)}
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
