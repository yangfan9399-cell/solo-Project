<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link } from '@inertiajs/vue3'

defineOptions({ layout: MainLayout })

const props = defineProps({
  statusCounts: Object,
  metalTypeStats: Array,
  anomalies: Object,
  differenceStats: Array,
  auth: Object,
})

function formatAmount(val) {
  if (val === null || val === undefined) return '0.00'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const metalTypeMap = {
  gold: '黄金',
  silver: '白银',
  platinum: '铂金',
  palladium: '钯金',
}

function metalTypeLabel(type) {
  return metalTypeMap[type] || type
}

const statusCards = [
  {
    key: 'pending_processing_reviewing',
    label: '待处理/处理中/复核中',
    count: (props.statusCounts?.pending || 0) + (props.statusCounts?.processing || 0) + (props.statusCounts?.reviewing || 0),
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    filter: 'status=pending,processing,reviewing',
  },
  {
    key: 'archived',
    label: '已归档',
    count: props.statusCounts?.archived || 0,
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    filter: 'status=archived',
  },
  {
    key: 'blocked',
    label: '异常（已阻断）',
    count: props.statusCounts?.blocked || 0,
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
    filter: 'status=blocked',
  },
  {
    key: 'appealed',
    label: '申诉中',
    count: props.statusCounts?.appealed || 0,
    icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    filter: 'status=appealed',
  },
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">复盘看板</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Link
        v-for="card in statusCards"
        :key="card.key"
        :href="`/dashboard/drill-down?${card.filter}`"
        class="card flex items-center p-5 cursor-pointer transition transform hover:scale-105 hover:shadow-lg"
      >
        <div class="w-12 h-12 rounded-lg flex items-center justify-center mr-4" :class="card.color">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="card.icon" />
          </svg>
        </div>
        <div>
          <div class="text-2xl font-bold text-gray-900">{{ card.count }}</div>
          <div class="text-xs text-gray-500">{{ card.label }}</div>
        </div>
      </Link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">贵金属类型分布</h2>
        <div v-if="metalTypeStats && metalTypeStats.length > 0">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">贵金属类型</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">数量</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">金额合计</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(item, idx) in metalTypeStats" :key="idx" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ metalTypeLabel(item.metal_type) }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 text-right">{{ item.count }}</td>
                <td class="px-4 py-2 text-sm text-gray-700 text-right">{{ formatAmount(item.total_amount) }}</td>
                <td class="px-4 py-2 text-center">
                  <Link :href="`/dashboard/drill-down?metal_type=${encodeURIComponent(item.metal_type)}`" class="text-indigo-600 hover:text-indigo-800 text-sm">查看</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center text-gray-500 py-4 text-sm">暂无数据</div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">差异统计</h2>
        <div v-if="differenceStats && differenceStats.length > 0">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">差异字段</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">差异次数</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(item, idx) in differenceStats" :key="idx" class="hover:bg-gray-50">
                <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ item.field_name }}</td>
                <td class="px-4 py-2 text-sm text-red-600 font-medium text-right">{{ item.count }}</td>
                <td class="px-4 py-2 text-center">
                  <Link :href="`/dashboard/drill-down?difference_field=${encodeURIComponent(item.field_name)}`" class="text-indigo-600 hover:text-indigo-800 text-sm">查看</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center text-gray-500 py-4 text-sm">暂无差异记录</div>
      </div>
    </div>

    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">异常记录</h2>
      <div v-if="anomalies && anomalies.length > 0">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">调拨编号</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">贵金属类型</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">金额</th>
              <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">状态</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">当前责任人</th>
              <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="item in anomalies" :key="item.id" class="hover:bg-gray-50">
              <td class="px-4 py-2 text-sm font-medium text-indigo-600">
                <Link :href="`/allocations/${item.id}`">{{ item.allocation_no }}</Link>
              </td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.metal_type }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 text-right">{{ formatAmount(item.amount) }}</td>
              <td class="px-4 py-2 text-center">
                <span v-if="item.status === 'blocked'" class="status-badge bg-red-100 text-red-800">已阻断</span>
                <span v-else-if="item.status === 'appealed'" class="status-badge bg-orange-100 text-orange-800">申诉中</span>
                <span v-else class="status-badge bg-gray-100 text-gray-800">{{ item.status }}</span>
              </td>
              <td class="px-4 py-2 text-sm text-gray-700">{{ item.current_handler?.name || '-' }}</td>
              <td class="px-4 py-2 text-center">
                <div class="flex justify-center space-x-2">
                  <Link :href="`/allocations/${item.id}`" class="text-indigo-600 hover:text-indigo-800 text-sm">详情</Link>
                  <Link :href="`/allocations/${item.id}/process`" class="text-blue-600 hover:text-blue-800 text-sm">处理</Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="mt-3 text-right">
          <Link href="/dashboard/drill-down?status=blocked,appealed" class="text-indigo-600 hover:text-indigo-800 text-sm">查看全部异常记录 &rarr;</Link>
        </div>
      </div>
      <div v-else class="text-center text-gray-500 py-4 text-sm">暂无异常记录</div>
    </div>
  </div>
</template>
