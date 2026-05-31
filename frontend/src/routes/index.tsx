import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card, StatCard } from '~/components/ui/card';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { DashboardStats, TemperatureDeviation, RecallRecord, SiteInventory } from '~/types';
import { RiskLevelColors, RiskLevelLabels, DeviationStatusLabels, RecallStatusLabels, RecallStatusColors } from '~/types';
import {
  ThermometerSnowflake,
  Truck,
  Package,
  AlertTriangle,
  RotateCcw,
  Database,
  ChevronRight,
} from 'lucide-qwik';

export default component$(() => {
  const statsResource = useResource$<DashboardStats>(async () => {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const deviationsResource = useResource$<TemperatureDeviation[]>(async () => {
    const response = await api.get<TemperatureDeviation[]>('/api/temperature-deviations');
    if (response.success && response.data) {
      return response.data.slice(0, 5);
    }
    return [];
  });

  const recallsResource = useResource$<RecallRecord[]>(async () => {
    const response = await api.get<RecallRecord[]>('/api/recall-records');
    if (response.success && response.data) {
      return response.data.slice(0, 5);
    }
    return [];
  });

  const inventoryResource = useResource$<SiteInventory[]>(async () => {
    const response = await api.get<SiteInventory[]>('/api/site-inventories?status=mismatch');
    if (response.success && response.data) {
      return response.data.slice(0, 5);
    }
    return [];
  });

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p class="text-gray-500 mt-1">疫苗冷链温控系统概览</p>
      </div>

      <Resource
        value={statsResource}
        onPending={() => <LoadingState />}
        onRejected={(error) => <ErrorState message={error.message} />}
        onResolved={(stats) => (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="运行中冷库"
              value={stats.active_cold_storages}
              icon={ThermometerSnowflake}
              color="blue"
            />
            <StatCard
              title="活跃转运箱"
              value={stats.active_transport_boxes}
              icon={Truck}
              color="green"
            />
            <StatCard
              title="待处理偏差"
              value={stats.deviations.detected + stats.deviations.processing}
              icon={AlertTriangle}
              trend={stats.deviations.detected > 0 ? 'up' : 'neutral'}
              color="yellow"
            />
            <StatCard
              title="库存不一致"
              value={stats.inventory_mismatches}
              icon={Database}
              color="red"
            />
          </div>
        )}
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="温控偏差预警" subtitle="最近5条记录">
          <Resource
            value={deviationsResource}
            onPending={() => <LoadingState />}
            onRejected={(error) => <ErrorState message={error.message} />}
            onResolved={(deviations) =>
              deviations.length === 0 ? (
                <EmptyState message="暂无偏差记录" />
              ) : (
                <div class="space-y-4">
                  {deviations.map((deviation) => (
                    <div
                      key={deviation.id}
                      class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div class="flex items-center space-x-4">
                        <div class={`w-3 h-3 rounded-full ${deviation.risk_level === 'critical' ? 'bg-red-500' : deviation.risk_level === 'high' ? 'bg-orange-500' : deviation.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <div>
                          <p class="font-medium text-gray-900">{deviation.device_name}</p>
                          <p class="text-sm text-gray-500">持续 {deviation.duration_minutes} 分钟</p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-3">
                        <StatusBadge
                          text={RiskLevelLabels[deviation.risk_level]}
                          variant={deviation.risk_level === 'critical' ? 'danger' : deviation.risk_level === 'high' ? 'warning' : 'info'}
                        />
                        <ChevronRight class="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          />
        </Card>

        <Card title="召回协同" subtitle="最近5条召回记录">
          <Resource
            value={recallsResource}
            onPending={() => <LoadingState />}
            onRejected={(error) => <ErrorState message={error.message} />}
            onResolved={(recalls) =>
              recalls.length === 0 ? (
                <EmptyState message="暂无召回记录" />
              ) : (
                <div class="space-y-4">
                  {recalls.map((recall) => (
                    <div
                      key={recall.id}
                      class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div class="flex items-center space-x-4">
                        <RotateCcw class="w-6 h-6 text-blue-500" />
                        <div>
                          <p class="font-medium text-gray-900">{recall.recall_no}</p>
                          <p class="text-sm text-gray-500">{recall.vaccine_name} - {recall.batch_no}</p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-3">
                        <span class={`px-2.5 py-0.5 rounded-full text-xs font-medium ${RecallStatusColors[recall.status]}`}>
                          {RecallStatusLabels[recall.status]}
                        </span>
                        <ChevronRight class="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          />
        </Card>
      </div>

      <Card title="库存不一致预警" subtitle="接种点库存与预期不符">
        <Resource
          value={inventoryResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(inventories) =>
            inventories.length === 0 ? (
              <EmptyState message="所有库存一致" description="暂无库存不一致记录" />
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">接种点</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">疫苗批次</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">预期数量</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">实际数量</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">差异</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {inventories.map((inv) => (
                      <tr key={inv.id} class="hover:bg-gray-50">
                        <td class="px-4 py-3 text-sm text-gray-900">{inv.batch_no}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">{inv.vaccine_name}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">{inv.expected_quantity}</td>
                        <td class="px-4 py-3 text-sm text-gray-900">{inv.actual_quantity}</td>
                        <td class="px-4 py-3">
                          <span class="text-red-600 font-medium">
                            {inv.actual_quantity - inv.expected_quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        />
      </Card>
    </div>
  );
});
