<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">复盘统计</h2>
      <p class="text-gray-500 text-sm mt-1">按服务类型、城市、返工原因和赔付金额多维度分析</p>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <p class="text-sm text-gray-500">总订单数</p>
        <p class="text-2xl font-bold text-gray-900 mt-2">{{ stats?.totalOrders || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <p class="text-sm text-gray-500">已完成订单</p>
        <p class="text-2xl font-bold text-green-600 mt-2">{{ stats?.completedOrders || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <p class="text-sm text-gray-500">返工订单</p>
        <p class="text-2xl font-bold text-orange-600 mt-2">{{ stats?.reworkOrders || 0 }}</p>
      </div>
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <p class="text-sm text-gray-500">总营收</p>
        <p class="text-2xl font-bold text-blue-600 mt-2">¥{{ stats?.totalRevenue || '0.00' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="w-1 h-5 bg-blue-500 rounded mr-2"></span>
          按服务类型统计
        </h3>
        <div class="space-y-4">
          <div
            v-for="(item, type) in stats?.byServiceType || {}"
            :key="type"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-medium text-gray-900">{{ getServiceTypeLabel(type) }}</span>
              <span class="text-blue-600 font-bold">¥{{ item.totalPrice }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-600">
              <span>订单数：{{ item.count }} 单</span>
              <span v-if="item.reworkCount > 0" class="text-orange-600">
                返工：{{ item.reworkCount }} 单
              </span>
            </div>
            <div v-if="item.compensationCount > 0" class="flex justify-between text-sm text-red-600 mt-2">
              <span>赔付：{{ item.compensationCount }} 单</span>
              <span>¥{{ item.compensationAmount }}</span>
            </div>
            <div class="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-500 rounded-full transition-all"
                :style="{ width: getTypePercentage(type) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="w-1 h-5 bg-green-500 rounded mr-2"></span>
          按城市统计
        </h3>
        <div class="space-y-4">
          <div
            v-for="(item, city) in stats?.byCity || {}"
            :key="city"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="font-medium text-gray-900">{{ city }}</span>
              <span class="text-green-600 font-bold">¥{{ item.totalPrice }}</span>
            </div>
            <div class="text-sm text-gray-600">
              订单数：{{ item.count }} 单
            </div>
            <div v-if="item.compensationCount > 0" class="flex justify-between text-sm text-red-600 mt-2">
              <span>赔付：{{ item.compensationCount }} 单</span>
              <span>¥{{ item.compensationAmount }}</span>
            </div>
            <div class="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-green-500 rounded-full transition-all"
                :style="{ width: getCityPercentage(city) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="w-1 h-5 bg-orange-500 rounded mr-2"></span>
          返工原因分布
        </h3>
        <div class="space-y-4">
          <div
            v-for="(item, reason) in stats?.byReworkReason || {}"
            :key="reason"
            class="p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium text-gray-900">{{ getReworkReasonLabel(reason) }}</span>
              <span class="text-orange-600 font-bold">{{ item.count }} 单</span>
            </div>
            <div v-if="item.compensationCount > 0" class="flex justify-between text-sm text-red-600 mb-2">
              <span>赔付：{{ item.compensationCount }} 单</span>
              <span>¥{{ item.compensationAmount }}</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-orange-500 rounded-full transition-all"
                :style="{ width: getReworkPercentage(reason) + '%' }"
              ></div>
            </div>
          </div>
          <div v-if="Object.keys(stats?.byReworkReason || {}).length === 0" class="text-center py-4">
            <p class="text-gray-400 text-sm">暂无返工记录</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="w-1 h-5 bg-red-500 rounded mr-2"></span>
          赔付金额统计
        </h3>
        <div class="text-center py-4">
          <p class="text-sm text-gray-500 mb-2">累计赔付金额</p>
          <p class="text-4xl font-bold text-red-600">¥{{ stats?.totalCompensation || '0.00' }}</p>
          <p class="text-sm text-gray-500 mt-3">赔付单数：{{ stats?.compensationCount || 0 }} 单</p>
        </div>
        <div class="mt-6 pt-6 border-t border-gray-100">
          <h4 class="text-sm font-medium text-gray-700 mb-3">赔付类型分布</h4>
          <div class="space-y-3">
            <div
              v-for="(item, type) in stats?.byCompensationRuleType || {}"
              :key="type"
              class="flex justify-between items-center text-sm"
            >
              <span class="text-gray-600">{{ getCompensationRuleTypeLabel(type) }}</span>
              <div class="flex items-center space-x-3">
                <span class="text-gray-500">{{ item.count }} 单</span>
                <span class="text-red-600 font-medium">¥{{ item.totalAmount }}</span>
              </div>
            </div>
            <div v-if="Object.keys(stats?.byCompensationRuleType || {}).length === 0" class="text-center py-2">
              <p class="text-gray-400 text-xs">暂无赔付记录</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span class="w-1 h-5 bg-purple-500 rounded mr-2"></span>
        综合指标
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">完成率</p>
          <p class="text-xl font-bold text-green-600 mt-1">{{ completionRate }}%</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">返工率</p>
          <p class="text-xl font-bold text-orange-600 mt-1">{{ reworkRate }}%</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">平均客单价</p>
          <p class="text-xl font-bold text-blue-600 mt-1">¥{{ avgOrderValue }}</p>
        </div>
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-500">赔付率</p>
          <p class="text-xl font-bold text-red-600 mt-1">{{ compensationRate }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Statistics } from '~/types';
import { getServiceTypeLabel, getReworkReasonLabel, getCompensationRuleTypeLabel } from '~/utils/format';

const { data } = await useFetch('/api/statistics');

const stats = computed<Statistics | null>(() => data.value?.data || null);

const completionRate = computed(() => {
  if (!stats.value || stats.value.totalOrders === 0) return '0.0';
  return ((stats.value.completedOrders / stats.value.totalOrders) * 100).toFixed(1);
});

const reworkRate = computed(() => {
  if (!stats.value || stats.value.totalOrders === 0) return '0.0';
  return ((stats.value.reworkOrders / stats.value.totalOrders) * 100).toFixed(1);
});

const avgOrderValue = computed(() => {
  if (!stats.value || stats.value.totalOrders === 0) return '0.00';
  return (parseFloat(stats.value.totalRevenue) / stats.value.totalOrders).toFixed(2);
});

const compensationRate = computed(() => {
  if (!stats.value || stats.value.totalOrders === 0) return '0.0';
  return ((stats.value.compensationCount / stats.value.totalOrders) * 100).toFixed(1);
});

function getTypePercentage(type: string): number {
  if (!stats.value) return 0;
  const total = stats.value.totalOrders;
  if (total === 0) return 0;
  const count = stats.value.byServiceType[type]?.count || 0;
  return Math.round((count / total) * 100);
}

function getCityPercentage(city: string): number {
  if (!stats.value) return 0;
  const total = stats.value.totalOrders;
  if (total === 0) return 0;
  const count = stats.value.byCity[city]?.count || 0;
  return Math.round((count / total) * 100);
}

function getReworkPercentage(reason: string): number {
  if (!stats.value) return 0;
  const total = Object.values(stats.value.byReworkReason).reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return 0;
  const count = stats.value.byReworkReason[reason]?.count || 0;
  return Math.round((count / total) * 100);
}
</script>
