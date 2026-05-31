import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { QuarantineRecord, VaccineBatch } from '~/types';
import { QuarantineStatusLabels } from '~/types';
import { Plus, GripVertical, Send, Package, AlertCircle, ChevronUp, ChevronDown } from 'lucide-qwik';

export default component$(() => {
  const showModal = useSignal(false);
  const selectedBatch = useSignal<VaccineBatch | null>(null);
  const reason = useSignal('');
  const priority = useSignal(5);

  const quarantineResource = useResource$<QuarantineRecord[]>(async () => {
    const response = await api.get<QuarantineRecord[]>('/api/quarantine-records');
    if (response.success && response.data) {
      return response.data.sort((a, b) => b.priority - a.priority);
    }
    throw new Error(response.message || '加载失败');
  });

  const batchesResource = useResource$<VaccineBatch[]>(async () => {
    const response = await api.get<VaccineBatch[]>('/api/vaccine-batches?status=normal');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  });

  const updatePriority = $(async (id: string, newPriority: number) => {
    const response = await api.put(`/api/quarantine-records/${id}/priority`, { priority: newPriority });
    if (response.success) {
      quarantineResource.track(() => {});
    }
  });

  const submitForReview = $(async (id: string) => {
    const response = await api.put(`/api/quarantine-records/${id}/submit-review`);
    if (response.success) {
      quarantineResource.track(() => {});
    }
  });

  const createQuarantine = $(async () => {
    if (!selectedBatch.value) return;
    
    const response = await api.post('/api/quarantine-records', {
      batch_id: selectedBatch.value.id,
      batch_no: selectedBatch.value.batch_no,
      vaccine_name: selectedBatch.value.vaccine_name,
      quantity: selectedBatch.value.available_quantity,
      priority: priority.value,
      reason: reason.value,
    });

    if (response.success) {
      showModal.value = false;
      selectedBatch.value = null;
      reason.value = '';
      priority.value = 5;
      quarantineResource.track(() => {});
    }
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case 'quarantined': return 'warning';
      case 'pending_review': return 'info';
      case 'released': return 'success';
      case 'recalled': return 'danger';
      case 'destroyed': return 'default';
      default: return 'default';
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">批次隔离登记</h1>
          <p class="text-gray-500 mt-1">管理温控异常批次的隔离和优先级排序</p>
        </div>
        <Button onClick$={() => { showModal.value = true; }}>
          <Plus class="w-4 h-4 mr-2" />
          新增隔离
        </Button>
      </div>

      <Card>
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-700">
            <AlertCircle class="w-4 h-4 inline mr-1" />
            拖拽卡片或使用上下箭头调整隔离优先级，优先级高的批次将优先复核
          </p>
        </div>

        <Resource
          value={quarantineResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(records) =>
            records.length === 0 ? (
              <EmptyState message="暂无隔离批次" description="点击右上角按钮添加隔离批次" />
            ) : (
              <div class="space-y-3">
                {records.map((record, index) => (
                  <div
                    key={record.id}
                    class="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div class="cursor-move mr-4 text-gray-400">
                      <GripVertical class="w-5 h-5" />
                    </div>
                    <div class="flex items-center space-x-2 mr-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick$={() => updatePriority(record.id, record.priority + 1)}
                      >
                        <ChevronUp class="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === records.length - 1}
                        onClick$={() => updatePriority(record.id, record.priority - 1)}
                      >
                        <ChevronDown class="w-4 h-4" />
                      </Button>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <span class="text-sm font-bold text-primary-600 w-6">#{index + 1}</span>
                        <Package class="w-5 h-5 text-orange-500" />
                        <div>
                          <p class="font-medium text-gray-900">{record.vaccine_name}</p>
                          <p class="text-sm text-gray-500">批次: {record.batch_no} | 数量: {record.quantity}支</p>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-4">
                      <div class="text-sm text-gray-500">
                        <span class="text-xs">优先级: </span>
                        <span class="font-medium text-orange-600">{record.priority}</span>
                      </div>
                      <StatusBadge text={QuarantineStatusLabels[record.status]} variant={statusVariant(record.status)} />
                      {record.status === 'quarantined' && (
                        <Button size="sm" onClick$={() => submitForReview(record.id)}>
                          <Send class="w-4 h-4 mr-1" />
                          提交复核
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        />
      </Card>

      <Modal title="新增批次隔离" isOpen={showModal.value} onClose$={() => { showModal.value = false; }} size="lg">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">选择疫苗批次</label>
            <Resource
              value={batchesResource}
              onPending={() => <div class="text-gray-500">加载中...</div>}
              onResolved={(batches) => (
                <select
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedBatch.value?.id || ''}
                  onChange$={(e) => {
                    const batch = batches.find(b => b.id === (e.target as HTMLSelectElement).value);
                    selectedBatch.value = batch || null;
                  }}
                >
                  <option value="">请选择批次</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.vaccine_name} - {batch.batch_no} (剩余 {batch.available_quantity} 支)
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">隔离原因</label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="请输入隔离原因..."
              value={reason.value}
              onInput$={(e) => { reason.value = (e.target as HTMLTextAreaElement).value; }}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">处理优先级: {priority.value}</label>
            <input
              type="range"
              min="1"
              max="10"
              class="w-full"
              value={priority.value}
              onInput$={(e) => { priority.value = parseInt((e.target as HTMLInputElement).value); }}
            />
            <div class="flex justify-between text-xs text-gray-500">
              <span>低</span>
              <span>高</span>
            </div>
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick$={() => { showModal.value = false; }}>取消</Button>
            <Button onClick$={createQuarantine} disabled={!selectedBatch.value || !reason.value}>
              确认隔离
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});
