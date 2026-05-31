import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { QuarantineRecord } from '~/types';
import { QuarantineStatusLabels } from '~/types';
import { CheckCircle, XCircle, AlertTriangle, Clock, FileText } from 'lucide-qwik';

export default component$(() => {
  const showModal = useSignal(false);
  const selectedRecord = useSignal<QuarantineRecord | null>(null);
  const reviewOpinion = useSignal('');
  const reviewResult = useSignal<'release' | 'recall' | 'destroy'>('release');

  const resource = useResource$<QuarantineRecord[]>(async () => {
    const response = await api.get<QuarantineRecord[]>('/api/quarantine-records?status=pending_review');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const submitReview = $(async () => {
    if (!selectedRecord.value) return;

    const response = await api.post('/api/review-records', {
      quarantine_id: selectedRecord.value.id,
      deviation_id: selectedRecord.value.deviation_id,
      review_opinion: reviewOpinion.value,
      review_result: reviewResult.value,
    });

    if (response.success) {
      showModal.value = false;
      selectedRecord.value = null;
      reviewOpinion.value = '';
      resource.track(() => {});
    }
  });

  const openReview = $(async (record: QuarantineRecord) => {
    selectedRecord.value = record;
    showModal.value = true;
  });

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">复核放行</h1>
          <p class="text-gray-500 mt-1">疾控复核员对隔离批次进行质量评估和放行决策</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">待复核批次</p>
              <p class="text-3xl font-bold text-yellow-600 mt-1">--</p>
            </div>
            <Clock class="w-10 h-10 text-yellow-500" />
          </div>
        </Card>
        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">已放行</p>
              <p class="text-3xl font-bold text-green-600 mt-1">--</p>
            </div>
            <CheckCircle class="w-10 h-10 text-green-500" />
          </div>
        </Card>
        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">已召回/销毁</p>
              <p class="text-3xl font-bold text-red-600 mt-1">--</p>
            </div>
            <XCircle class="w-10 h-10 text-red-500" />
          </div>
        </Card>
      </div>

      <Card title="待复核批次" subtitle="按优先级排序">
        <Resource
          value={resource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(records) =>
            records.length === 0 ? (
              <EmptyState message="暂无待复核批次" description="所有批次已完成复核" />
            ) : (
              <div class="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    class="p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle class="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 class="font-semibold text-gray-900 text-lg">{record.vaccine_name}</h3>
                          <p class="text-gray-500">批次号: {record.batch_no}</p>
                          <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>隔离数量: {record.quantity} 支</span>
                            <span>优先级: {record.priority}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex flex-col items-end space-y-3">
                        <StatusBadge text={QuarantineStatusLabels[record.status]} variant="info" />
                        <Button size="sm" onClick$={() => openReview(record)}>
                          <FileText class="w-4 h-4 mr-1" />
                          复核处理
                        </Button>
                      </div>
                    </div>
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p class="text-sm text-gray-600">
                        <span class="font-medium">隔离原因：</span>
                        {record.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        />
      </Card>

      <Modal title="复核处理" isOpen={showModal.value} onClose$={() => { showModal.value = false; }} size="lg">
        {selectedRecord.value && (
          <div class="space-y-6">
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">批次信息</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="text-gray-500">疫苗名称：</span>{selectedRecord.value.vaccine_name}</div>
                <div><span class="text-gray-500">批次号：</span>{selectedRecord.value.batch_no}</div>
                <div><span class="text-gray-500">隔离数量：</span>{selectedRecord.value.quantity} 支</div>
                <div><span class="text-gray-500">优先级：</span>{selectedRecord.value.priority}</div>
              </div>
            </div>

            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 class="font-medium text-yellow-800 mb-1">隔离原因</h4>
              <p class="text-sm text-yellow-700">{selectedRecord.value.reason}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">复核结论</label>
              <div class="grid grid-cols-3 gap-4">
                {[
                  { value: 'release', label: '放行', icon: CheckCircle, color: 'border-green-500 bg-green-50 text-green-700' },
                  { value: 'recall', label: '召回', icon: AlertTriangle, color: 'border-orange-500 bg-orange-50 text-orange-700' },
                  { value: 'destroy', label: '销毁', icon: XCircle, color: 'border-red-500 bg-red-50 text-red-700' },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick$={() => { reviewResult.value = option.value as any; }}
                      class={`p-4 rounded-lg border-2 transition-all ${
                        reviewResult.value === option.value
                          ? option.color
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon class={`w-8 h-8 mx-auto mb-2 ${reviewResult.value === option.value ? '' : 'text-gray-400'}`} />
                      <p class="font-medium">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">复核意见</label>
              <textarea
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
                placeholder="请输入详细复核意见..."
                value={reviewOpinion.value}
                onInput$={(e) => { reviewOpinion.value = (e.target as HTMLTextAreaElement).value; }}
              />
            </div>

            <div class="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="secondary" onClick$={() => { showModal.value = false; }}>取消</Button>
              <Button 
                onClick$={submitReview} 
                disabled={!reviewOpinion.value}
                variant={reviewResult.value === 'release' ? 'primary' : reviewResult.value === 'recall' ? 'secondary' : 'danger'}
              >
                确认提交
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});
