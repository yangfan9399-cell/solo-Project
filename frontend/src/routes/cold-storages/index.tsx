import { component$, useResource$, Resource, useSignal, $ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { DataTable, LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { Modal } from '~/components/ui/modal';
import { api } from '~/lib/api';
import type { ColdStorage } from '~/types';
import { Plus, Edit, Trash2, Thermometer, X, Save } from 'lucide-qwik';

export default component$(() => {
  const showModal = useSignal(false);
  const showDeleteModal = useSignal(false);
  const editingItem = useSignal<ColdStorage | null>(null);
  const deletingItem = useSignal<ColdStorage | null>(null);
  const refreshSignal = useSignal(0);

  const formData = useSignal({
    name: '',
    code: '',
    location: '',
    capacity: 1000,
    min_temp: 2,
    max_temp: 8,
    status: 'normal' as ColdStorage['status'],
  });

  const errors = useSignal<Record<string, string>>({});

  const resource = useResource$<ColdStorage[]>(async ({ track }) => {
    track(() => refreshSignal.value);
    const response = await api.get<ColdStorage[]>('/api/cold-storages');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const validateForm = $(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.value.name.trim()) newErrors.name = '请输入冷库名称';
    if (!formData.value.code.trim()) newErrors.code = '请输入设备编号';
    if (!formData.value.location.trim()) newErrors.location = '请输入位置';
    if (formData.value.capacity <= 0) newErrors.capacity = '容量必须大于0';
    if (formData.value.min_temp >= formData.value.max_temp) {
      newErrors.temp = '最低温度必须小于最高温度';
    }
    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
  });

  const openCreate = $(() => {
    editingItem.value = null;
    formData.value = {
      name: '',
      code: '',
      location: '',
      capacity: 1000,
      min_temp: 2,
      max_temp: 8,
      status: 'normal',
    };
    errors.value = {};
    showModal.value = true;
  });

  const openEdit = $((item: ColdStorage) => {
    editingItem.value = item;
    formData.value = {
      name: item.name,
      code: item.code,
      location: item.location,
      capacity: item.capacity,
      min_temp: item.min_temp,
      max_temp: item.max_temp,
      status: item.status,
    };
    errors.value = {};
    showModal.value = true;
  });

  const openDelete = $((item: ColdStorage) => {
    deletingItem.value = item;
    showDeleteModal.value = true;
  });

  const handleSubmit = $(async () => {
    if (!validateForm()) return;

    let response;
    if (editingItem.value) {
      response = await api.put(`/api/cold-storages/${editingItem.value.id}`, formData.value);
    } else {
      response = await api.post('/api/cold-storages', formData.value);
    }

    if (response.success) {
      showModal.value = false;
      editingItem.value = null;
      refreshSignal.value++;
    } else {
      errors.value = { submit: response.message || '操作失败' };
    }
  });

  const handleDelete = $(async () => {
    if (!deletingItem.value) return;

    const response = await api.delete(`/api/cold-storages/${deletingItem.value.id}`);
    if (response.success) {
      showDeleteModal.value = false;
      deletingItem.value = null;
      refreshSignal.value++;
    }
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
        <Button onClick$={openCreate}>
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
                        <Button variant="ghost" size="sm" onClick$={() => openEdit(storage)}>
                          <Edit class="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick$={() => openDelete(storage)}>
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

      <Modal
        title={editingItem.value ? '编辑冷库' : '新增冷库'}
        isOpen={showModal.value}
        onClose$={() => { showModal.value = false; }}
        size="lg"
      >
        <div class="space-y-4">
          {errors.value.submit && (
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.value.submit}
            </div>
          )}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                冷库名称 <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                class={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.value.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="如：1号疫苗冷库"
                value={formData.value.name}
                onInput$={(e) => { formData.value.name = (e.target as HTMLInputElement).value; }}
              />
              {errors.value.name && <p class="text-red-500 text-xs mt-1">{errors.value.name}</p>}
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                设备编号 <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                class={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.value.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="如：LK-001"
                value={formData.value.code}
                onInput$={(e) => { formData.value.code = (e.target as HTMLInputElement).value; }}
              />
              {errors.value.code && <p class="text-red-500 text-xs mt-1">{errors.value.code}</p>}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              位置 <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              class={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.value.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="如：疾控中心大楼一层"
              value={formData.value.location}
              onInput$={(e) => { formData.value.location = (e.target as HTMLInputElement).value; }}
            />
            {errors.value.location && <p class="text-red-500 text-xs mt-1">{errors.value.location}</p>}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              容量（支）<span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              class={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.value.capacity ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formData.value.capacity}
              onInput$={(e) => { formData.value.capacity = parseInt((e.target as HTMLInputElement).value) || 0; }}
            />
            {errors.value.capacity && <p class="text-red-500 text-xs mt-1">{errors.value.capacity}</p>}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">最低温度 (°C)</label>
              <input
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.value.min_temp}
                onInput$={(e) => { formData.value.min_temp = parseFloat((e.target as HTMLInputElement).value) || 0; }}
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">最高温度 (°C)</label>
              <input
                type="number"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.value.max_temp}
                onInput$={(e) => { formData.value.max_temp = parseFloat((e.target as HTMLInputElement).value) || 0; }}
              />
            </div>
          </div>
          {errors.value.temp && <p class="text-red-500 text-xs">{errors.value.temp}</p>}

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.value.status}
              onChange$={(e) => { formData.value.status = (e.target as HTMLSelectElement).value as any; }}
            >
              <option value="normal">正常运行</option>
              <option value="maintenance">维护中</option>
              <option value="decommissioned">已停用</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick$={() => { showModal.value = false; }}>
              <X class="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button onClick$={handleSubmit}>
              <Save class="w-4 h-4 mr-1" />
              {editingItem.value ? '保存修改' : '创建设备'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="确认删除"
        isOpen={showDeleteModal.value}
        onClose$={() => { showDeleteModal.value = false; }}
        size="md"
      >
        {deletingItem.value && (
          <div class="space-y-4">
            <div class="p-4 bg-red-50 rounded-lg border border-red-200">
              <p class="text-red-700">
                确定要删除冷库 <span class="font-semibold">{deletingItem.value.name}</span> 吗？
              </p>
              <p class="text-sm text-red-600 mt-1">此操作不可撤销，相关数据将被永久删除。</p>
            </div>
            <div class="flex justify-end space-x-3">
              <Button variant="secondary" onClick$={() => { showDeleteModal.value = false; }}>
                取消
              </Button>
              <Button variant="danger" onClick$={handleDelete}>
                <Trash2 class="w-4 h-4 mr-1" />
                确认删除
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
});
