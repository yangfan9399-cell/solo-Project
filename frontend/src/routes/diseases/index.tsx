import { component$, useStore, useTask$, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { StatusBadge } from '~/components/ui/status-badge';
import { DISEASE_TYPE_LABELS, DISEASE_SEVERITY_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Disease, Book } from '~/types';
import clsx from 'clsx';

export const useDiseasesData = routeLoader$(async () => {
  try {
    const [diseases, books] = await Promise.all([
      serverFetch<Disease[]>('/diseases'),
      serverFetch<Book[]>('/books'),
    ]);
    return { diseases, books };
  } catch (e) {
    return { diseases: [], books: [] };
  }
});

export default component$(() => {
  const data = useDiseasesData();
  const state = useStore({
    filterType: '',
    filterSeverity: '',
    activeTab: 'all' as 'all' | 'acidification' | 'moth_damage' | 'mold',
  });

  const getBookTitle = (bookId: string) => {
    return data.value.books.find(b => b.id === bookId)?.title || '未知古籍';
  };

  // Group diseases by type for swimlanes
  const diseaseTypes = ['acidification', 'moth_damage', 'mold', 'tear', 'stain', 'brittleness'];
  
  const getDiseasesByType = (type: string) => {
    return data.value.diseases.filter(d => 
      d.type === type && 
      (!state.filterSeverity || d.severity === state.filterSeverity)
    );
  };

  const severityCounts = {
    mild: data.value.diseases.filter(d => d.severity === 'mild').length,
    moderate: data.value.diseases.filter(d => d.severity === 'moderate').length,
    severe: data.value.diseases.filter(d => d.severity === 'severe').length,
    critical: data.value.diseases.filter(d => d.severity === 'critical').length,
  };

  return (
    <Layout>
      <div class="p-6">
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">病害诊断</h1>
          <p class="text-gray-500 mt-1">纸张病害检测与分类管理</p>
        </div>

        {/* Disease Severity Overview */}
        <div class="grid grid-cols-4 gap-4 mb-6">
          {(['mild', 'moderate', 'severe', 'critical'] as const).map(severity => {
            const colors: Record<string, string> = {
              mild: 'border-green-300 bg-green-50',
              moderate: 'border-yellow-300 bg-yellow-50',
              severe: 'border-orange-300 bg-orange-50',
              critical: 'border-red-300 bg-red-50',
            };
            return (
              <div key={severity} class={`card border-2 ${colors[severity]} text-center`}>
                <p class="text-4xl font-bold">{severityCounts[severity]}</p>
                <p class="text-sm mt-2">{DISEASE_SEVERITY_LABELS[severity]}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="label">病害类型</label>
              <select
                class="input"
                value={state.filterType}
                onChange$={(_, el) => state.filterType = el.value}
              >
                <option value="">全部类型</option>
                {diseaseTypes.map(type => (
                  <option key={type} value={type}>{DISEASE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="label">严重程度</label>
              <select
                class="input"
                value={state.filterSeverity}
                onChange$={(_, el) => state.filterSeverity = el.value}
              >
                <option value="">全部程度</option>
                <option value="mild">轻度</option>
                <option value="moderate">中度</option>
                <option value="severe">重度</option>
                <option value="critical">危重度</option>
              </select>
            </div>
            <div>
              <button class="btn btn-primary">
                + 添加病害记录
              </button>
            </div>
          </div>
        </div>

        {/* Swim Lane View */}
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-4">病害分组泳道</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['acidification', 'moth_damage', 'mold'].map(type => {
              const typeDiseases = getDiseasesByType(type);
              const colors: Record<string, string> = {
                acidification: 'border-amber-400 bg-amber-50',
                moth_damage: 'border-lime-400 bg-lime-50',
                mold: 'border-teal-400 bg-teal-50',
              };
              return (
                <div key={type} class={`card border-t-4 ${colors[type]}`}>
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold">{DISEASE_TYPE_LABELS[type]}</h3>
                    <span class="badge bg-gray-200">
                      {typeDiseases.length} 例
                    </span>
                  </div>
                  {typeDiseases.length === 0 ? (
                    <Empty 
                      title="暂无此类病害" 
                      icon="✅"
                      description="情况良好" 
                    />
                  ) : (
                    <div class="space-y-3 max-h-[400px] overflow-y-auto">
                      {typeDiseases.slice(0, 8).map(disease => (
                        <div 
                          key={disease.id} 
                          class="p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div class="flex items-start justify-between mb-2">
                            <p class="font-medium text-sm line-clamp-1">
                              {getBookTitle(disease.book_id)}
                            </p>
                            <StatusBadge status={disease.severity} type="severity" />
                          </div>
                          <p class="text-xs text-gray-500">
                            {disease.location || '未标注位置'}
                          </p>
                          {disease.description && (
                            <p class="text-xs text-gray-600 mt-1 line-clamp-2">
                              {disease.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* All Diseases List */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">全部病害记录</h2>
          {data.value.diseases.length === 0 ? (
            <Empty title="暂无病害记录" />
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left py-3 px-4 font-medium text-gray-600">古籍</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">病害类型</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">严重程度</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">位置</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">描述</th>
                    <th class="text-left py-3 px-4 font-medium text-gray-600">诊断时间</th>
                  </tr>
                </thead>
                <tbody>
                  {data.value.diseases.map(disease => (
                    <tr key={disease.id} class="border-b hover:bg-gray-50">
                      <td class="py-3 px-4 font-medium">
                        {getBookTitle(disease.book_id)}
                      </td>
                      <td class="py-3 px-4">
                        {DISEASE_TYPE_LABELS[disease.type]}
                      </td>
                      <td class="py-3 px-4">
                        <StatusBadge status={disease.severity} type="severity" />
                      </td>
                      <td class="py-3 px-4 text-gray-600">{disease.location || '-'}</td>
                      <td class="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {disease.description || '-'}
                      </td>
                      <td class="py-3 px-4 text-gray-500 text-sm">
                        {new Date(disease.diagnosed_at).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});
