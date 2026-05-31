import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { DataTable, LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { ColdStorage } from '~/types';
import { Plus, Edit, Trash2, Thermometer } from 'lucide-qwik';

export default component$(() => {
  const resource = useResource$<ColdStorage[]>(async () => {
    const response = await api.get<ColdStorage[]>('/api/cold-storages');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'maintenance': return 'warning';
      case 'decommissioned': return 'danger';
      default: return 'default';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'normal': return '正常运行';
      case 'maintenance': return '维护中';
      case 'decommissioned': return '已停用';
      default: return status;
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">冷库台账</h1>
          <p class="text-gray-500 mt-1">管理疾控中心冷库设备</p>
        </div>
        <Button onClick$={() => {}}>
          <Plus class="w-4 h-4 mr-2" />
          新增冷库
        </Button>
      </div>

      <Card>
        <Resource
          value={resource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(storages) =>
            storages.length === 0 ? (
              <EmptyState message="暂无冷库设备" description="点击右上角按钮添加第一个冷库" />
            ) : (
              <DataTable columns={['设备名称', '编号', '位置', '容量', '温度范围', '状态', '操作']}>
                {storages.map((storage) => (
                  <tr key={storage.id} class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Thermometer class="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">{storage.name}</p>
                          <p class="text-sm text-gray-500">{storage.code}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">{storage.code}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">{storage.location}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{storage.capacity} 支</td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {storage.min_temp}°C ~ {storage.max_temp}°C
                    </td>
                    <td class="px-6 py-4">
                      <StatusBadge text={statusLabel(storage.status)} variant={statusVariant(storage.status)} />
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit class="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 class="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )
          }
        />
      </Card>
    </div>
  );
});
