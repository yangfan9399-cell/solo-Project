import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { api } from '~/lib/api';
import type { TraceReport } from '~/types';
import { Search, FileBarChart, Thermometer, AlertTriangle, Package, RotateCcw } from 'lucide-qwik';

export default component$(() => {
  const showModal = useSignal(false);
  const selectedBatchId = useSignal<string | null>(null);
  const searchBatchNo = useSignal('');
  const searchVaccineName = useSignal('');

  const reportsResource = useResource$<any[]>(async () => {
    let url = '/api/trace/reports';
    const params: string[] = [];
    if (searchVaccineName.value) params.push(`vaccine_name=${searchVaccineName.value}`);
    if (params.length > 0) url += '?' + params.join('&');

    const response = await api.get<any[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const traceResource = useResource$<TraceReport | null>(async () => {
    if (!selectedBatchId.value) return null;
    
    const response = await api.get<TraceReport>(`/api/trace/${selectedBatchId.value}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const viewTrace = $(async (batchId: string) => {
    selectedBatchId.value = batchId;
    showModal.value = true;
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'quarantined': return 'warning';
      case 'recalled': return 'danger';
      case 'destroyed': return 'default';
      default: return 'info';
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">追溯报表统计</h1>
          <p class="text-gray-500 mt-1">疫苗批次全链条追溯与质量事件统计</p>
        </div>
      </div>

      <Card>
        <div class="flex flex-wrap gap-4 mb-6">
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium text-gray-700 mb-1">疫苗名称</label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="输入疫苗名称搜索..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchVaccineName.value}
                onInput$={(e) => { searchVaccineName.value = (e.target as HTMLInputElement).value; }}
              />
            </div>
          </div>
          <div class="flex items-end">
            <Button onClick$={() => { reportsResource.track(() => {}); }}>
              <Search class="w-4 h-4 mr-2" />
              查询
            </Button>
          </div>
        </div>

        <Resource
          value={reportsResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(reports) =>
            reports.length === 0 ? (
              <EmptyState message="暂无批次数据" description="系统中暂无疫苗批次记录" />
            ) : (
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">批次号</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">疫苗名称</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生产厂家</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">隔离次数</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">召回次数</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} class="hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium text-gray-900">{report.batch_no}</td>
                        <td class="px-6 py-4 text-gray-600">{report.vaccine_name}</td>
                        <td class="px-6 py-4 text-gray-600">{report.manufacturer}</td>
                        <td class="px-6 py-4">
                          <StatusBadge text={report.status} variant={statusVariant(report.status)} />
                        </td>
                        <td class="px-6 py-4">
                          <span class={report.quarantine_count > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            {report.quarantine_count}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <span class={report.recall_count > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {report.recall_count}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <Button variant="ghost" size="sm" onClick$={() => viewTrace(report.id)}>
                            <FileBarChart class="w-4 h-4 mr-1" />
                            追溯详情
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

      <Modal title="批次追溯详情" isOpen={showModal.value} onClose$={() => { showModal.value = false; }} size="xl">
        <Resource
          value={traceResource}
          onPending={() => <LoadingState />}
          onRejected={(error) => <ErrorState message={error.message} />}
          onResolved={(trace) =>
            trace && (
              <div class="space-y-6">
                <div class="grid grid-cols-3 gap-4">
                  <Card>
                    <div class="text-center">
                      <Thermometer class="w-8 h-8 mx-auto text-blue-500 mb-2" />
                      <p class="text-2xl font-bold text-gray-900">{trace.temperature_history.length}</p>
                      <p class="text-sm text-gray-500">温度记录</p>
                    </div>
                  </Card>
                  <Card>
                    <div class="text-center">
                      <AlertTriangle class="w-8 h-8 mx-auto text-orange-500 mb-2" />
                      <p class="text-2xl font-bold text-gray-900">{trace.deviation_count}</p>
                      <p class="text-sm text-gray-500">温控偏差</p>
                    </div>
                  </Card>
                  <Card>
                    <div class="text-center">
                      <Package class="w-8 h-8 mx-auto text-red-500 mb-2" />
                      <p class="text-2xl font-bold text-gray-900">{trace.quarantine_events.length}</p>
                      <p class="text-sm text-gray-500">隔离记录</p>
                    </div>
                  </Card>
                </div>

                <Card title="隔离事件">
                  {trace.quarantine_events.length === 0 ? (
                    <EmptyState message="无隔离事件" />
                  ) : (
                    <div class="space-y-3">
                      {trace.quarantine_events.map((event: any) => (
                        <div key={event.id} class="p-4 bg-gray-50 rounded-lg">
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-medium text-gray-900">{event.reason}</p>
                              <p class="text-sm text-gray-500">数量: {event.quantity} 支 | 优先级: {event.priority}</p>
                            </div>
                            <StatusBadge text={event.status} variant="warning" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="召回事件">
                  {trace.recall_events.length === 0 ? (
                    <EmptyState message="无召回事件" />
                  ) : (
                    <div class="space-y-3">
                      {trace.recall_events.map((event: any) => (
                        <div key={event.id} class="p-4 bg-gray-50 rounded-lg">
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-medium text-gray-900">{event.recall_no}</p>
                              <p class="text-sm text-gray-500">{event.reason}</p>
                            </div>
                            <span class={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )
          }
        />
      </Modal>
    </div>
  );
});
