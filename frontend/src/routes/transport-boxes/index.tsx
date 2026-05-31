import { component$, useResource$, Resource } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { DataTable, LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { TransportBox } from '~/types';
import { Plus, Edit, Trash2, Truck } from 'lucide-qwik';

export default component$(() => {
  const resource = useResource$<TransportBox[]>(async () => {
    const response = await api.get<TransportBox[]>('/api/transport-boxes');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case 'idle': return 'success';
      case 'in_transit': return 'info';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'idle': return '空闲';
      case 'in_transit': return '运输中';
      case 'maintenance': return '维护中';
      default: return status;
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">转运箱管理</h1>
          <p class="text-gray-500 mt-1">管理疫苗转运冷藏箱设备</p>
        </div>
        <Button onClick$={() => {}}>
          <Plus class="w-4 h-4 mr-2" />
          新增转运箱
        </Button>
      </div>

      <Card>
        <Resource
          value={resource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(boxes) =>
            boxes.length === 0 ? (
              <EmptyState message="暂无转运箱设备" description="点击右上角按钮添加第一个转运箱" />
            ) : (
              <DataTable columns={['设备名称', '型号', '位置', '容量', '温度范围', '状态', '操作']}>
                {boxes.map((box) => (
                  <tr key={box.id} class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Truck class="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">{box.name}</p>
                          <p class="text-sm text-gray-500">{box.code}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">{box.model || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">{box.current_location || '-'}</td>
                    <td class="px-6 py-4 text-sm text-gray-900">{box.capacity} 支</td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {box.min_temp}°C ~ {box.max_temp}°C
                    </td>
                    <td class="px-6 py-4">
                      <StatusBadge text={statusLabel(box.status)} variant={statusVariant(box.status)} />
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
