import { component$, useResource$, Resource, useSignal, $, useTask$ } from '@builder.io/qwik';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { DataTable, LoadingState, ErrorState, EmptyState } from '~/components/ui/table';
import { StatusBadge } from '~/components/ui/status-badge';
import { Modal } from '~/components/ui/modal';
import { api } from '~/lib/api';
import type { TransportBox, CreateTransportBoxRequest, UpdateTransportBoxRequest } from '~/types';
import { Plus, Edit, Trash2, Truck, X, Save, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-qwik';

interface ToastState {
  show: boolean;
  type: 'success' | 'error';
  message: string;
}

export default component$(() => {
  const showModal = useSignal(false);
  const showDeleteModal = useSignal(false);
  const editingItem = useSignal<TransportBox | null>(null);
  const deletingItem = useSignal<TransportBox | null>(null);
  const refreshSignal = useSignal(0);
  const isSubmitting = useSignal(false);
  const toast = useSignal<ToastState>({ show: false, type: 'success', message: '' });

  const formData = useSignal({
    name: '',
    code: '',
    model: '',
    capacity: 500,
    min_temp: 2,
    max_temp: 8,
    current_location: '',
    status: 'idle' as TransportBox['status'],
  });

  const errors = useSignal<Record<string, string>>({});

  useTask$(({ track }) => {
    track(() => toast.value.show);
    if (toast.value.show) {
      const timer = setTimeout(() => {
        toast.value = { ...toast.value, show: false };
      }, 3000);
      return () => clearTimeout(timer);
    }
  });

  const showToast = $((type: 'success' | 'error', message: string) => {
    toast.value = { show: true, type, message };
  });

  const resource = useResource$<TransportBox[]>(async ({ track }) => {
    track(() => refreshSignal.value);
    const response = await api.get<TransportBox[]>('/api/transport-boxes');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || '加载失败');
  });

  const validateForm = $(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.value.name.trim()) newErrors.name = '请输入转运箱名称';
    if (!formData.value.code.trim()) newErrors.code = '请输入设备编号';
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
      model: '',
      capacity: 500,
      min_temp: 2,
      max_temp: 8,
      current_location: '',
      status: 'idle',
    };
    errors.value = {};
    showModal.value = true;
  });

  const openEdit = $((item: TransportBox) => {
    editingItem.value = item;
    formData.value = {
      name: item.name,
      code: item.code,
      model: item.model || '',
      capacity: item.capacity,
      min_temp: item.min_temp,
      max_temp: item.max_temp,
      current_location: item.current_location || '',
      status: item.status,
    };
    errors.value = {};
    showModal.value = true;
  });

  const openDelete = $((item: TransportBox) => {
    deletingItem.value = item;
    showDeleteModal.value = true;
  });

  const handleSubmit = $(async () => {
    if (!validateForm()) return;

    isSubmitting.value = true;
    let response;

    try {
      if (editingItem.value) {
        const request: UpdateTransportBoxRequest = {
          name: formData.value.name,
          code: formData.value.code,
          model: formData.value.model || undefined,
          capacity: formData.value.capacity,
          min_temp: formData.value.min_temp,
          max_temp: formData.value.max_temp,
          current_location: formData.value.current_location || undefined,
          status: formData.value.status,
        };
        response = await api.put(`/api/transport-boxes/${editingItem.value.id}`, request);
      } else {
        const request: CreateTransportBoxRequest = {
          name: formData.value.name,
          code: formData.value.code,
          model: formData.value.model || undefined,
          capacity: formData.value.capacity,
          min_temp: formData.value.min_temp,
          max_temp: formData.value.max_temp,
          current_location: formData.value.current_location || undefined,
        };
        response = await api.post('/api/transport-boxes', request);
      }

      if (response.success) {
        showModal.value = false;
        editingItem.value = null;
        refreshSignal.value++;
        showToast('success', editingItem.value ? '转运箱信息更新成功！' : '转运箱创建成功！');
      } else {
        errors.value = { submit: response.message || '操作失败' };
        showToast('error', response.message || '操作失败');
      }
    } catch (e) {
      showToast('error', '网络异常，请稍后重试');
    } finally {
      isSubmitting.value = false;
    }
  });

  const handleDelete = $(async () => {
    if (!deletingItem.value) return;

    isSubmitting.value = true;
    try {
      const response = await api.delete(`/api/transport-boxes/${deletingItem.value.id}`);
      if (response.success) {
        showDeleteModal.value = false;
        deletingItem.value = null;
        refreshSignal.value++;
        showToast('success', '转运箱删除成功！');
      } else {
        showToast('error', response.message || '删除失败');
      }
    } catch (e) {
      showToast('error', '网络异常，请稍后重试');
    } finally {
      isSubmitting.value = false;
    }
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
        <Button onClick$={openCreate}>
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
                    <td class="px-6 py-4 text-sm text-gray-500">
                      <div class="flex items-center">
                        <MapPin class="w-3 h-3 mr-1" />
                        {box.current_location || '-'}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">{box.capacity} 支</td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {box.min_temp}°C ~ {box.max_temp}°C
                    </td>
                    <td class="px-6 py-4">
                      <StatusBadge text={statusLabel(box.status)} variant={statusVariant(box.status)} />
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick$={() => openEdit(box)}>
                          <Edit class="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick$={() => openDelete(box)}>
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
        title={editingItem.value ? '编辑转运箱' : '新增转运箱'}
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
                转运箱名称 <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                class={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.value.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="如：1号冷链转运箱"
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
                placeholder="如：ZY-001"
                value={formData.value.code}
                onInput$={(e) => { formData.value.code = (e.target as HTMLInputElement).value; }}
              />
              {errors.value.code && <p class="text-red-500 text-xs mt-1">{errors.value.code}</p>}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">型号</label>
              <input
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="如：GSP-20L"
                value={formData.value.model}
                onInput$={(e) => { formData.value.model = (e.target as HTMLInputElement).value; }}
              />
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
            <label class="block text-sm font-medium text-gray-700 mb-1">当前位置</label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="如：疾控中心仓库 / 运输途中"
              value={formData.value.current_location}
              onInput$={(e) => { formData.value.current_location = (e.target as HTMLInputElement).value; }}
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.value.status}
              onChange$={(e) => { formData.value.status = (e.target as HTMLSelectElement).value as any; }}
            >
              <option value="idle">空闲</option>
              <option value="in_transit">运输中</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="secondary" onClick$={() => { showModal.value = false; }} disabled={isSubmitting.value}>
              <X class="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button onClick$={handleSubmit} disabled={isSubmitting.value}>
              {isSubmitting.value ? (
                <Loader2 class="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save class="w-4 h-4 mr-1" />
              )}
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
                确定要删除转运箱 <span class="font-semibold">{deletingItem.value.name}</span> 吗？
              </p>
              <p class="text-sm text-red-600 mt-1">此操作不可撤销，相关数据将被永久删除。</p>
            </div>
            <div class="flex justify-end space-x-3">
              <Button variant="secondary" onClick$={() => { showDeleteModal.value = false; }} disabled={isSubmitting.value}>
                取消
              </Button>
              <Button variant="danger" onClick$={handleDelete} disabled={isSubmitting.value}>
                {isSubmitting.value ? (
                  <Loader2 class="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 class="w-4 h-4 mr-1" />
                )}
                确认删除
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast.value.show && (
        <div class="fixed top-4 right-4 z-50 animate-pulse">
          <div
            class={`flex items-center p-4 rounded-lg shadow-lg ${
              toast.value.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {toast.value.type === 'success' ? (
              <CheckCircle class="w-5 h-5 text-green-500 mr-3" />
            ) : (
              <AlertCircle class="w-5 h-5 text-red-500 mr-3" />
            )}
            <p
              class={`font-medium ${
                toast.value.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {toast.value.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
