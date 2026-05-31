import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { TemperatureDeviation, RiskLaneGroup } from '~/types';
import { RiskLevelLabels, RiskLevelColors, DeviationStatusLabels } from '~/types';
import { AlertTriangle, Clock, MapPin, Filter, Eye } from 'lucide-qwik';

export default component$(() => {
  const selectedStatus = useSignal<string>('all');
  const selectedRisk = useSignal<string>('all');
  const viewMode = useSignal<'list' | 'kanban'>('kanban');

  const deviationsResource = useResource$<TemperatureDeviation[]>(async () => {
    let url = '/api/temperature-deviations';
    const params: string[] = [];
    if (selectedStatus.value !== 'all') params.push(`status=${selectedStatus.value}`);
    if (selectedRisk.value !== 'all') params.push(`risk_level=${selectedRisk.value}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const response = await api.get<TemperatureDeviation[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const riskLanesResource = useResource$<RiskLaneGroup[]>(async () => {
    const response = await api.get<RiskLaneGroup[]>('/api/temperature-deviations/risk-lanes');
    if (response.success && response.data) {
      return response.data;
    }
    return [];
  });

  const riskVariant = (risk: string) => {
    switch (risk) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">温控偏差看板</h1>
          <p class="text-gray-500 mt-1">监控和处理冷链温度异常事件</p>
        </div>
        <div class="flex space-x-3">
          <div class="flex bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode.value === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick$={() => { viewMode.value = 'list'; }}
            >
              列表视图
            </Button>
            <Button
              variant={viewMode.value === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick$={() => { viewMode.value = 'kanban'; }}
            >
              风险泳道
            </Button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-4">
        <div class="flex items-center space-x-2">
          <Filter class="w-4 h-4 text-gray-500" />
          <select
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedStatus.value}
            onChange$={(e) => { selectedStatus.value = (e.target as HTMLSelectElement).value; }}
          >
            <option value="all">全部状态</option>
            <option value="detected">已发现</option>
            <option value="processing">处理中</option>
            <option value="verified">已核实</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <AlertTriangle class="w-4 h-4 text-gray-500" />
          <select
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedRisk.value}
            onChange$={(e) => { selectedRisk.value = (e.target as HTMLSelectElement).value; }}
          >
            <option value="all">全部风险</option>
            <option value="critical">极高风险</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
        </div>
      </div>

      {viewMode.value === 'kanban' ? (
        <Resource
          value={riskLanesResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(lanes) => (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {lanes.map((lane) => (
                <Card key={lane.temp_zone} class="h-full">
                  <div class="mb-4">
                    <h3 class="font-semibold text-gray-900">{lane.temp_zone}</h3>
                    <p class="text-sm text-gray-500">{lane.duration_range}</p>
                    <div class="mt-2 text-2xl font-bold text-primary-600">{lane.items.length}</div>
                  </div>
                  <div class="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                    {lane.items.length === 0 ? (
                      <p class="text-sm text-gray-400 text-center py-8">暂无异常</p>
                    ) : (
                      lane.items.map((deviation) => (
                        <div
                          key={deviation.id}
                          class="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div class="flex items-start justify-between mb-2">
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${RiskLevelColors[deviation.risk_level]}`}>
                              {RiskLevelLabels[deviation.risk_level]}
                            </span>
                            <StatusBadge text={DeviationStatusLabels[deviation.status]} variant="info" />
                          </div>
                          <p class="font-medium text-gray-900 text-sm mb-1">{deviation.device_name}</p>
                          <div class="flex items-center text-xs text-gray-500 mb-2">
                            <Clock class="w-3 h-3 mr-1" />
                            持续 {deviation.duration_minutes} 分钟
                          </div>
                          <div class="flex items-center justify-between">
                            <div class="text-xs text-gray-500">
                              {deviation.max_temp && <span>最高 {deviation.max_temp}°C</span>}
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye class="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        />
      ) : (
        <Card>
          <Resource
            value={deviationsResource}
            onPending={() => <LoadingState />}
            onRejected={(error) => <ErrorState message={error.message} />}
            onResolved={(deviations) =>
              deviations.length === 0 ? (
                <EmptyState message="暂无偏差记录" description="系统运行正常，无温度偏差事件" />
              ) : (
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">偏差类型</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">持续时间</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">温度范围</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">风险等级</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      {deviations.map((deviation) => (
                        <tr key={deviation.id} class="hover:bg-gray-50">
                          <td class="px-6 py-4">
                            <div class="flex items-center">
                              <MapPin class="w-4 h-4 text-gray-400 mr-2" />
                              <span class="text-sm font-medium text-gray-900">{deviation.device_name}</span>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-500">
                            {deviation.deviation_type === 'over_temp' ? '超温' : deviation.deviation_type === 'under_temp' ? '低温' : '波动'}
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-900">{deviation.duration_minutes} 分钟</td>
                          <td class="px-6 py-4 text-sm text-gray-500">
                            {deviation.min_temp}°C ~ {deviation.max_temp}°C
                          </td>
                          <td class="px-6 py-4">
                            <StatusBadge text={RiskLevelLabels[deviation.risk_level]} variant={riskVariant(deviation.risk_level)} />
                          </td>
                          <td class="px-6 py-4">
                            <span class="text-sm text-gray-600">{DeviationStatusLabels[deviation.status]}</span>
                          </td>
                          <td class="px-6 py-4">
                            <Button variant="ghost" size="sm">
                              <Eye class="w-4 h-4" />
                            </Button>
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
      )}
    </div>
  );
});
