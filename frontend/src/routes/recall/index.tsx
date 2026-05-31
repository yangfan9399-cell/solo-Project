import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { api } from '~/lib/api';
import type { RecallRecord } from '~/types';
import { RecallStatusLabels, RecallStatusColors } from '~/types';
import { Plus, RotateCcw, CheckCircle, Clock, AlertCircle, Send } from 'lucide-qwik';

export default component$(() => {
  const showModal = useSignal(false);
  const selectedStatus = useSignal<string>('all');

  const resource = useResource$<RecallRecord[]>(async () => {
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

  const updateStatus = $(async (id: string, status: string) => {
    const response = await api.put(`/api/recall-records/${id}/status`, { status });
    if (response.success) {
      resource.track(() => {});
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

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">召回协同</h1>
          <p class="text-gray-500 mt-1">跟踪和管理问题疫苗批次的召回流程</p>
        </div>
        <Button onClick$={() => { showModal.value = true; }}>
          <Plus class="w-4 h-4 mr-2" />
          发起召回
        </Button>
      </div>

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
              <EmptyState message="暂无召回记录" description="系统运行正常，无召回任务" />
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
                          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <RotateCcw class="w-6 h-6 text-blue-600" />
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
                          </div>
                        </div>
                        <div class="flex items-center space-x-2">
                          {nextStatus && (
                            <Button size="sm" onClick$={() => updateStatus(record.id, nextStatus)}>
                              <Send class="w-4 h-4 mr-1" />
                              {nextStatusLabel(record.status)}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div class="mt-6">
                        <div class="flex items-center justify-between mb-2">
                          <span class="text-sm font-medium text-gray-700">召回进度</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div
                            class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: record.status === 'completed' ? '100%' :
                                     record.status === 'in_progress' ? '50%' :
                                     record.status === 'notified' ? '20%' : '0%'
                            }}
                          />
                        </div>
                        <div class="flex justify-between mt-2 text-xs text-gray-500">
                          <div class="flex items-center">
                            <AlertCircle class="w-3 h-3 mr-1" />
                            已通知
                          </div>
                          <div class="flex items-center">
                            <Clock class="w-3 h-3 mr-1" />
                            进行中
                          </div>
                          <div class="flex items-center">
                            <CheckCircle class="w-3 h-3 mr-1" />
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

      <Modal title="发起召回" isOpen={showModal.value} onClose$={() => { showModal.value = false; }} size="lg">
        <div class="space-y-4">
          <p class="text-gray-500">请在复核流程中发起召回，此功能暂用于演示。</p>
          <div class="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick$={() => { showModal.value = false; }}>关闭</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
