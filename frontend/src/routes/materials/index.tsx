import { component$, useStore, $, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Empty } from '~/components/ui/empty';
import { Modal } from '~/components/ui/modal';
import { Loading } from '~/components/ui/loading';
import { MATERIAL_CATEGORY_LABELS } from '~/constants';
import { fetchApi, serverFetch } from '~/utils/api';
import type { Material, MaterialUsage, Process, User } from '~/types';
import clsx from 'clsx';

export const useMaterialsData = routeLoader$(async () => {
  try {
    const [materials, lowStockMaterials, processes, users] = await Promise.all([
      serverFetch<Material[]>('/materials'),
      serverFetch<Material[]>('/materials/low-stock'),
      serverFetch<Process[]>('/processes'),
      serverFetch<User[]>('/users'),
    ]);
    return { materials, lowStockMaterials, processes, users, success: true };
  } catch (e) {
    console.error('Failed to load materials data:', e);
    return { materials: [], lowStockMaterials: [], processes: [], users: [], success: false };
  }
});

export default component$(() => {
  const initialData = useMaterialsData();
  const state = useStore({
    materials: [] as Material[],
    lowStockMaterials: [] as Material[],
    processes: [] as Process[],
    users: [] as User[],
    filterCategory: '',
    searchQuery: '',
    showLowStockOnly: false,
    isUsageModalOpen: false,
    selectedMaterial: null as Material | null,
    isSubmitting: false,
    error: '',
    form: {
      process_id: '',
      material_id: '',
      quantity: 0,
      used_by: '',
    },
  });

  useVisibleTask$(() => {
    state.materials = initialData.value.materials;
    state.lowStockMaterials = initialData.value.lowStockMaterials;
    state.processes = initialData.value.processes;
    state.users = initialData.value.users.filter(u => u.role === 'restorer');
  });

  const filteredMaterials = state.materials.filter(m => {
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

  const getProcessName = (processId: string) => {
    return state.processes.find(p => p.id === processId)?.name || '未知工序';
  };

  const getUserName = (userId: string) => {
    return state.users.find(u => u.id === userId)?.name || '未知用户';
  };

  const openUsageModal = $((material: Material) => {
    state.selectedMaterial = material;
    state.form = {
      process_id: '',
      material_id: material.id,
      quantity: 1,
      used_by: '',
    };
    state.error = '';
    state.isUsageModalOpen = true;
  });

  const closeUsageModal = $(() => {
    state.isUsageModalOpen = false;
    state.selectedMaterial = null;
    state.form = {
      process_id: '',
      material_id: '',
      quantity: 0,
      used_by: '',
    };
    state.error = '';
  });

  const submitUsage = $(async () => {
    if (!state.form.process_id || !state.form.used_by || state.form.quantity <= 0) {
      state.error = '请完整填写所有必填项';
      return;
    }

    if (state.selectedMaterial && state.form.quantity > state.selectedMaterial.stock_quantity) {
      state.error = `库存不足！当前库存：${state.selectedMaterial.stock_quantity} ${state.selectedMaterial.unit}`;
      return;
    }

    state.isSubmitting = true;
    state.error = '';

    try {
      await fetchApi<MaterialUsage>('/material-usages', {
        method: 'POST',
        body: JSON.stringify(state.form),
      });

      // 刷新材料列表和低库存预警
      const [materials, lowStockMaterials] = await Promise.all([
        fetchApi<Material[]>('/materials'),
        fetchApi<Material[]>('/materials/low-stock'),
      ]);
      state.materials = materials;
      state.lowStockMaterials = lowStockMaterials;

      closeUsageModal();
    } catch (e: any) {
      try {
        const errorData = await e.json?.();
        state.error = errorData?.error || '领用失败，请重试';
      } catch {
        state.error = '领用失败，请重试';
      }
    } finally {
      state.isSubmitting = false;
    }
  });

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
        {state.lowStockMaterials.length > 0 && (
          <div class="card mb-6 bg-orange-50 border-orange-200">
            <div class="flex items-start gap-3">
              <span class="text-2xl">⚠️</span>
              <div class="flex-1">
                <h3 class="font-semibold text-orange-800 mb-2">
                  库存预警（{state.lowStockMaterials.length}种材料）
                </h3>
                <div class="flex flex-wrap gap-2">
                  {state.lowStockMaterials.slice(0, 5).map(m => (
                    <span key={m.id} class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {m.name}：{m.stock_quantity}{m.unit} / {m.min_stock}{m.unit}
                    </span>
                  ))}
                  {state.lowStockMaterials.length > 5 && (
                    <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      +{state.lowStockMaterials.length - 5} 种
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
            <p class="text-3xl font-bold">{state.materials.length}</p>
            <p class="text-sm text-gray-500 mt-1">材料总数</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-orange-600">
              {state.lowStockMaterials.length}
            </p>
            <p class="text-sm text-gray-500 mt-1">库存不足</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-green-600">
              {state.materials.filter(m => m.stock_quantity > m.min_stock).length}
            </p>
            <p class="text-sm text-gray-500 mt-1">库存充足</p>
          </div>
          <div class="card text-center">
            <p class="text-3xl font-bold text-red-600">
              {state.materials.filter(m => m.stock_quantity <= 0).length}
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
                      <button 
                        class="flex-1 py-1.5 text-sm bg-antique-100 hover:bg-antique-200 text-antique-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick$={() => openUsageModal(material)}
                        disabled={material.stock_quantity <= 0}
                      >
                        {material.stock_quantity <= 0 ? '已耗尽' : '领用'}
                      </button>
                      <button class="flex-1 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                        详情
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Usage Modal */}
        <Modal
          isOpen={state.isUsageModalOpen}
          onClose$={closeUsageModal}
          title="材料领用"
          size="md"
        >
          {state.selectedMaterial && (
            <div>
              {/* Material Info */}
              <div class="p-4 bg-gray-50 rounded-lg mb-4">
                <h4 class="font-medium text-gray-900">{state.selectedMaterial.name}</h4>
                <div class="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p class="text-gray-500">分类</p>
                    <p>{MATERIAL_CATEGORY_LABELS[state.selectedMaterial.category]}</p>
                  </div>
                  <div>
                    <p class="text-gray-500">当前库存</p>
                    <p class="font-medium">
                      {state.selectedMaterial.stock_quantity} {state.selectedMaterial.unit}
                    </p>
                  </div>
                  <div>
                    <p class="text-gray-500">规格</p>
                    <p>{state.selectedMaterial.specification || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {state.error && (
                <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {state.error}
                </div>
              )}

              {/* Form */}
              <div class="space-y-4">
                <div>
                  <label class="label">关联工序 <span class="text-red-500">*</span></label>
                  <select
                    class="input"
                    value={state.form.process_id}
                    onChange$={(_, el) => state.form.process_id = el.value}
                  >
                    <option value="">请选择工序</option>
                    {state.processes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {getProcessName(p.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="label">领用人 <span class="text-red-500">*</span></label>
                  <select
                    class="input"
                    value={state.form.used_by}
                    onChange$={(_, el) => state.form.used_by = el.value}
                  >
                    <option value="">请选择领用人</option>
                    {state.users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="label">
                    领用数量 <span class="text-red-500">*</span>
                    <span class="text-gray-400 ml-2">（单位：{state.selectedMaterial.unit}）</span>
                  </label>
                  <input
                    type="number"
                    class="input"
                    min="0.01"
                    step="0.01"
                    max={state.selectedMaterial.stock_quantity}
                    value={state.form.quantity.toString()}
                    onInput$={(_, el) => {
                      const val = parseFloat(el.value) || 0;
                      state.form.quantity = val;
                    }}
                  />
                  {state.form.quantity > state.selectedMaterial.stock_quantity && (
                    <p class="text-red-500 text-xs mt-1">
                      超过库存上限！最大可领：{state.selectedMaterial.stock_quantity} {state.selectedMaterial.unit}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div class="flex justify-end gap-3 mt-6">
                <button 
                  class="btn btn-secondary"
                  onClick$={closeUsageModal}
                  disabled={state.isSubmitting}
                >
                  取消
                </button>
                <button 
                  class="btn btn-primary"
                  onClick$={submitUsage}
                  disabled={state.isSubmitting || state.form.quantity <= 0 || state.form.quantity > state.selectedMaterial.stock_quantity}
                >
                  {state.isSubmitting ? <Loading size="sm" /> : '确认领用'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
});
