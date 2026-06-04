<template>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <button @click="$router.push('/')" class="text-gray-500 hover:text-gray-700">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900">复盘统计</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">总工单</div>
          <div class="text-3xl font-bold text-gray-900">{{ summary.totalOrders }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">已归档</div>
          <div class="text-3xl font-bold text-green-600">{{ summary.archivedOrders }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">平均维修时长</div>
          <div class="text-3xl font-bold text-blue-600">{{ summary.avgRepairDuration }} <span class="text-lg">分钟</span></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">总费用</div>
          <div class="text-3xl font-bold text-purple-600">¥{{ summary.totalFee?.toFixed(2) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">配件费用</div>
          <div class="text-3xl font-bold text-orange-600">¥{{ summary.totalPartsFee?.toFixed(2) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">人工费用</div>
          <div class="text-3xl font-bold text-indigo-600">¥{{ summary.totalLaborFee?.toFixed(2) }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">重复报修工单</div>
          <div class="text-3xl font-bold text-red-600">{{ summary.repeatOrders }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-500 mb-1">重复率</div>
          <div class="text-3xl font-bold text-red-500">{{ summary.repeatRate }}%</div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">按故障类型统计</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">故障类型</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单数量</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均时长</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">重复工单</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">配件费用</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">人工费用</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总费用</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="item in byFaultType" :key="item.faultType">
                <td class="px-4 py-3 font-medium">{{ FaultTypeLabel[item.faultType] || item.faultType }}</td>
                <td class="px-4 py-3">{{ item.count }}</td>
                <td class="px-4 py-3">{{ item.avgDuration }} 分钟</td>
                <td class="px-4 py-3">{{ item.repeatCount }}</td>
                <td class="px-4 py-3">¥{{ item.totalPartsFee?.toFixed(2) }}</td>
                <td class="px-4 py-3">¥{{ item.totalLaborFee?.toFixed(2) }}</td>
                <td class="px-4 py-3 font-medium">¥{{ item.totalFee?.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">按站点统计</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">站点</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单数量</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均时长</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">重复工单</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">配件费用</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">人工费用</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总费用</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="item in byStation" :key="item.stationId">
                <td class="px-4 py-3 font-medium">{{ item.stationName }}</td>
                <td class="px-4 py-3">{{ item.count }}</td>
                <td class="px-4 py-3">{{ item.avgDuration }} 分钟</td>
                <td class="px-4 py-3">{{ item.repeatCount }}</td>
                <td class="px-4 py-3">¥{{ item.totalPartsFee?.toFixed(2) }}</td>
                <td class="px-4 py-3">¥{{ item.totalLaborFee?.toFixed(2) }}</td>
                <td class="px-4 py-3 font-medium">¥{{ item.totalFee?.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">按维修时长统计</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时长区间</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单数量</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均时长</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总费用</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in byRepairDuration" :key="item.durationRange">
                  <td class="px-4 py-3 font-medium">{{ item.durationRange }}</td>
                  <td class="px-4 py-3">{{ item.count }}</td>
                  <td class="px-4 py-3">{{ item.avgDuration }} 分钟</td>
                  <td class="px-4 py-3 font-medium">¥{{ item.totalFee?.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">按返工次数统计</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">返工次数</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">工单数量</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均时长</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总费用</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in byRepeatCount" :key="item.repeatCount">
                  <td class="px-4 py-3 font-medium">{{ item.repeatCount }} 次</td>
                  <td class="px-4 py-3">{{ item.count }}</td>
                  <td class="px-4 py-3">{{ item.avgDuration }} 分钟</td>
                  <td class="px-4 py-3 font-medium">¥{{ item.totalFee?.toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { workOrderApi } from '@/api'
import { FaultTypeLabel } from '@/constants'

const loading = ref(true)
const summary = ref<any>({})
const byFaultType = ref<any[]>([])
const byStation = ref<any[]>([])
const byRepairDuration = ref<any[]>([])
const byRepeatCount = ref<any[]>([])

const loadData = async () => {
  loading.value = true
  try {
    const [
      summaryRes,
      faultTypeRes,
      stationRes,
      durationRes,
      repeatRes
    ] = await Promise.all([
      workOrderApi.getReviewSummary(),
      workOrderApi.getReviewByFaultType(),
      workOrderApi.getReviewByStation(),
      workOrderApi.getReviewByRepairDuration(),
      workOrderApi.getReviewByRepeatCount()
    ])

    summary.value = summaryRes
    byFaultType.value = faultTypeRes
    byStation.value = stationRes
    byRepairDuration.value = durationRes
    byRepeatCount.value = repeatRes
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
