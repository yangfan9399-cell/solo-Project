<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900">订单列表</h2>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600">状态筛选：</label>
          <select
            v-model="statusFilter"
            class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="pending">待派单</option>
            <option value="assigned">已派单</option>
            <option value="completed">待验收</option>
            <option value="inspection_passed">验收通过</option>
            <option value="inspection_failed">验收不通过</option>
            <option value="rework">返工中</option>
            <option value="rework_timeout">返工超时</option>
            <option value="compensation_pending">赔付待裁决</option>
            <option value="compensation_approved">赔付已批准</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="pending" class="text-center py-12">
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
        @click="goToDetail(order.id)"
      >
        <div class="flex justify-between items-start mb-3">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ order.orderNo }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ getServiceTypeLabel(order.serviceType) }}</p>
          </div>
          <span
            class="px-2.5 py-0.5 rounded-full text-xs font-medium"
            :class="[getStatusInfo(order.status).color, getStatusInfo(order.status).bgColor]"
          >
            {{ getStatusInfo(order.status).label }}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex items-start">
            <span class="text-gray-400 w-14 flex-shrink-0">客户：</span>
            <span class="text-gray-700">{{ order.customer?.name }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-gray-400 w-14 flex-shrink-0">地址：</span>
            <span class="text-gray-700 line-clamp-2">{{ order.address }}</span>
          </div>
          <div class="flex items-start">
            <span class="text-gray-400 w-14 flex-shrink-0">预约：</span>
            <span class="text-gray-700">{{ formatDate(order.scheduledTime) }}</span>
          </div>
          <div class="flex items-start" v-if="order.cleaner">
            <span class="text-gray-400 w-14 flex-shrink-0">保洁：</span>
            <span class="text-gray-700">{{ order.cleaner.name }} ({{ order.cleaner.level }})</span>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span class="text-lg font-bold text-blue-600">¥{{ order.price }}</span>
          <span class="text-xs text-gray-400">{{ order.city }}</span>
        </div>
      </div>
    </div>

    <div v-if="!pending && orders.length === 0" class="text-center py-12">
      <p class="text-gray-500">暂无订单数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Order } from '~/types';
import { formatDate, getStatusInfo, getServiceTypeLabel } from '~/utils/format';

const statusFilter = ref('');

const { data, pending, refresh } = await useFetch('/api/orders', {
  query: computed(() => ({
    status: statusFilter.value || undefined,
  })),
  watch: [statusFilter],
});

const orders = computed<Order[]>(() => {
  return data.value?.data || [];
});

function goToDetail(id: number) {
  navigateTo(`/orders/${id}`);
}
</script>
