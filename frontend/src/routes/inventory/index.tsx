import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { SiteInventory } from '~/types';
import { Database, AlertTriangle, CheckCircle, Edit3 } from 'lucide-qwik';

export default component$(() => {
  const showModal = useSignal(false);
  const selectedInventory = useSignal<SiteInventory | null>(null);
  const actualQuantity = useSignal(0);
  const refreshSignal = useSignal(0);

  const resource = useResource$<SiteInventory[]>(async ({ track }) => {
    track(() => refreshSignal.value);
    const response = await api.get<SiteInventory[]>('/api/site-inventories');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const openReconcile = $(async (inventory: SiteInventory) => {
    selectedInventory.value = inventory;
    actualQuantity.value = inventory.actual_quantity;
    showModal.value = true;
  });

  const submitReconcile = $(async () => {
    if (!selectedInventory.value) return;

    const response = await api.put(`/api/site-inventories/${selectedInventory.value.id}/reconcile`, {
      actual_quantity: actualQuantity.value,
    });

    if (response.success) {
      showModal.value = false;
      selectedInventory.value = null;
      refreshSignal.value++;
    }
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'mismatch': return 'danger';
      case 'reconciled': return 'info';
      default: return 'default';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'normal': return '账实一致';
      case 'mismatch': return '账实不符';
      case 'reconciled': return '已对账';
      default: return status;
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">接种点库存</h1>
          <p class="text-gray-500 mt-1">管理和核对接种点疫苗库存</p>
        </div>
      </div>

      <Resource
        value={resource}
        onPending={() => (
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <div class="h-20 animate-pulse bg-gray-100 rounded" />
              </Card>
            ))}
          </div>
        )}
        onResolved={(inventories) => {
          const totalCount = inventories.length;
          const mismatchCount = inventories.filter(i => i.status === 'mismatch').length;
          const reconciledCount = inventories.filter(i => i.status === 'reconciled').length;
          return (
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">库存记录</p>
                    <p class="text-3xl font-bold text-blue-600 mt-1">{totalCount}</p>
                  </div>
                  <Database class="w-10 h-10 text-blue-500" />
                </div>
              </Card>
              <Card>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">账实不一致</p>
                    <p class="text-3xl font-bold text-red-600 mt-1">{mismatchCount}</p>
                  </div>
                  <AlertTriangle class="w-10 h-10 text-red-500" />
                </div>
              </Card>
              <Card>
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm text-gray-500">已完成对账</p>
                    <p class="text-3xl font-bold text-green-600 mt-1">{reconciledCount}</p>
                  </div>
                  <CheckCircle class="w-10 h-10 text-green-500" />
                </div>
              </Card>
            </div>
          );
        }}
      />

      <Card title="库存明细">
        <Resource
          value={resource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(inventories) =>
            inventories.length === 0 ? (
              <EmptyState message="暂无库存记录" description="系统中暂无接种点库存数据" />
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">批次号</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">疫苗名称</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">账面数量</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">实际数量</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">差异</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {inventories.map((inv) => {
                      const diff = inv.actual_quantity - inv.expected_quantity;
                      return (
                        <tr key={inv.id} class="hover:bg-gray-50">
                          <td class="px-6 py-4 font-medium text-gray-900">{inv.batch_no}</td>
                          <td class="px-6 py-4 text-gray-600">{inv.vaccine_name}</td>
                          <td class="px-6 py-4 text-gray-900">{inv.expected_quantity}</td>
                          <td class="px-6 py-4 text-gray-900">{inv.actual_quantity}</td>
                          <td class="px-6 py-4">
                            <span class={diff !== 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <StatusBadge text={statusLabel(inv.status)} variant={statusVariant(inv.status)} />
                          </td>
                          <td class="px-6 py-4">
                            {inv.status === 'mismatch' && (
                              <Button variant="ghost" size="sm" onClick$={() => openReconcile(inv)}>
                                <Edit3 class="w-4 h-4 mr-1" />
                                对账
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        />
      </Card>

      <Modal title="库存对账" isOpen={showModal.value} onClose$={() => { showModal.value = false; }} size="md">
        {selectedInventory.value && (
          <div class="space-y-4">
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">{selectedInventory.value.vaccine_name}</h4>
              <p class="text-sm text-gray-500">批次号: {selectedInventory.value.batch_no}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">账面数量</label>
                <div class="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
                  {selectedInventory.value.expected_quantity}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">实际数量</label>
                <input
                  type="number"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={actualQuantity.value}
                  onInput$={(e) => { actualQuantity.value = parseInt((e.target as HTMLInputElement).value) || 0; }}
                />
              </div>
            </div>

            <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p class="text-sm text-yellow-700">
                <AlertTriangle class="w-4 h-4 inline mr-1" />
                确认后将更新库存状态为"已对账"，请确保实际数量准确无误。
              </p>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick$={() => { showModal.value = false; }}>取消</Button>
              <Button onClick$={submitReconcile}>确认对账</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});
