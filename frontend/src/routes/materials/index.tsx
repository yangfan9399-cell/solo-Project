import { component$, useStore, $ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { MATERIAL_CATEGORY_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Material } from '~/types';
import clsx from 'clsx';

export const useMaterialsData = routeLoader$(async () => {
  try {
    const [materials, lowStockMaterials] = await Promise.all([
      serverFetch<Material[]>('/materials'),
      serverFetch<Material[]>('/materials/low-stock'),
    ]);
    return { materials, lowStockMaterials };
  } catch (e) {
    return { materials: [], lowStockMaterials: [] };
  }
});

export default component$(() => {
  const data = useMaterialsData();
  const state = useStore({
    filterCategory: '',
    searchQuery: '',
    showLowStockOnly: false,
  });

  const filteredMaterials = data.value.materials.filter(m => {
    const matchCategory = !state.filterCategory || m.category === state.filterCategory;
    const matchSearch = !state.searchQuery || 
      m.name.includes(state.searchQuery) ||
      m.specification?.includes(state.searchQuery);
    const matchLowStock = !state.showLowStockOnly || m.stock_quantity <= m.min_stock;
    return matchCategory && matchSearch && matchLowStock;
  });

  const getStockStatus = (material: Material) => {
    if (material.stock_quantity <= 0) return { text: '已耗尽', class: 'text-red-600 bg-red-100' };
    if (material.stock_quantity <= material.min_stock) return { text: '库存不足', class: 'text-orange-600 bg-orange-100' };
    return { text: '库存充足', class: 'text-green-600 bg-green-100' };
  };

  return (
    <Layout>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">材料管理</h1>
            <p class="text-gray-500 mt-1">修复材料库存与领用管理</p>
          </div>
          <button class="btn btn-primary">
            + 新增材料
          </button>
        </div>

        {/* Low Stock Alert */}
        {data.value.lowStockMaterials.length > 0 && (
          <div class="card mb-6 bg-orange-50 border-orange-200">
            <div class="flex items-start gap-3">
              <span class="text-2xl">⚠️</span>
              <div class="flex-1">
                <h3 class="font-semibold text-orange-800 mb-2">
                  库存预警（{data.value.lowStockMaterials.length}种材料）
                </h3>
                <div class="flex flex-wrap gap-2">
                  {data.value.lowStockMaterials.slice(0, 5).map(m => (
                    <span key={m.id} class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {m.name}：{m.stock_quantity}{m.unit} / {m.min_stock}{m.unit}
                    </span>
                  ))}
                  {data.value.lowStockMaterials.length > 5 && (
                    <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      +{data.value.lowStockMaterials.length - 5} 种
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div class="grid grid-cols-4 gap-4 mb-6">
          <div class="card text-center">
            <p class="text-3xl font-bold">{data.value.materials.length}</p>
            <p class="text-sm text-gray-500 mt-1">材料总数</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-orange-600">
              {data.value.lowStockMaterials.length}
            </p>
            <p class="text-sm text-gray-500 mt-1">库存不足</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-green-600">
              {data.value.materials.filter(m => m.stock_quantity > m.min_stock).length}
            </p>
            <p class="text-sm text-gray-500 mt-1">库存充足</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-red-600">
              {data.value.materials.filter(m => m.stock_quantity <= 0).length}
            </p>
            <p class="text-sm text-gray-500 mt-1">已耗尽</p>
          </div>
        </div>

        {/* Filters */}
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="label">搜索</label>
              <input
                type="text"
                class="input"
                placeholder="搜索材料名称、规格..."
                value={state.searchQuery}
                onInput$={(_, el) => state.searchQuery = el.value}
              />
            </div>
            <div class="flex-1 min-w-[200px]">
              <label class="label">分类</label>
              <select
                class="input"
                value={state.filterCategory}
                onChange$={(_, el) => state.filterCategory = el.value}
              >
                <option value="">全部分类</option>
                <option value="paper">纸张</option>
                <option value="adhesive">胶粘剂</option>
                <option value="tool">工具</option>
                <option value="chemical">化学品</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                id="lowStock"
                checked={state.showLowStockOnly}
                onChange$={(_, el) => state.showLowStockOnly = el.checked}
              />
              <label for="lowStock" class="text-sm text-gray-700 cursor-pointer">
                仅显示库存不足
              </label>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div class="card">
          {filteredMaterials.length === 0 ? (
            <Empty title="暂无材料数据" />
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map(material => {
                const status = getStockStatus(material);
                return (
                  <div 
                    key={material.id} 
                    class={clsx(
                      'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                      material.stock_quantity <= material.min_stock 
                        ? 'border-orange-300 bg-orange-50/50' 
                        : 'border-gray-200'
                    )}
                  >
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <h3 class="font-semibold">{material.name}</h3>
                        <p class="text-xs text-gray-500">
                          {MATERIAL_CATEGORY_LABELS[material.category]}
                          {material.specification && ` · ${material.specification}`}
                        </p>
                      </div>
                      <span class={clsx('badge text-xs', status.class)}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p class="text-gray-500">当前库存</p>
                        <p class="font-medium">
                          {material.stock_quantity} {material.unit}
                        </p>
                      </div>
                      <div>
                        <p class="text-gray-500">最低库存</p>
                        <p class="font-medium">
                          {material.min_stock} {material.unit}
                        </p>
                      </div>
                    </div>

                    {material.supplier && (
                      <p class="text-xs text-gray-500 mb-3">
                        供应商：{material.supplier}
                      </p>
                    )}

                    <div class="flex gap-2">
                      <button class="flex-1 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                        领用
                      </button>
                      <button class="flex-1 py-1.5 text-sm bg-antique-100 hover:bg-antique-200 text-antique-700 rounded transition-colors">
                        详情
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
});
