<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">故障工单管理</h1>
      <div class="flex gap-3">
        <button
          @click="$router.push('/review')"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          复盘统计
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            v-model="filters.status"
            @change="loadOrders"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部状态</option>
            <option v-for="(label, key) in WorkOrderStatusLabel" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">故障类型</label>
          <select
            v-model="filters.faultType"
            @change="loadOrders"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部类型</option>
            <option v-for="(label, key) in FaultTypeLabel" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">站点</label>
          <select
            v-model="filters.stationId"
            @change="loadOrders"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部站点</option>
            <option v-for="station in StationList" :key="station.id" :value="station.id">
              {{ station.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input
            v-model="filters.keyword"
            @keyup.enter="loadOrders"
            type="text"
            placeholder="工单编号/设备编号/站点"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex gap-2">
          <button
            @click="loadOrders"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            搜索
          </button>
          <button
            @click="resetFilters"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            重置
          </button>
        </div>
        <div class="text-sm text-gray-500">共 {{ total }} 条记录</div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工单编号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">故障来源</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">故障类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">站点</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span class="font-medium text-blue-600">{{ order.orderNo }}</span>
                <span v-if="order.isRepeat" class="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                  重复报修 x{{ order.repeatCount }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2 py-1 text-xs font-medium rounded-full', WorkOrderStatusColor[order.status]]">
                {{ WorkOrderStatusLabel[order.status] }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ FaultSourceLabel[order.faultSource] }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ FaultTypeLabel[order.faultType] }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ order.deviceNo }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ order.stationName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ order.assigneeName || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                @click="$router.push(`/order/${order.id}`)"
                class="text-blue-600 hover:text-blue-800"
              >
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="9" class="px-6 py-12 text-center text-gray-500">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="total > pageSize" class="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
        <div class="text-sm text-gray-500">
          显示 {{ (page - 1) * pageSize + 1 }} - {{ Math.min(page * pageSize, total) }} 条
        </div>
        <div class="flex gap-2">
          <button
            @click="changePage(page - 1)"
            :disabled="page === 1"
            class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span class="px-3 py-1">{{ page }} / {{ totalPages }}</span>
          <button
            @click="changePage(page + 1)"
            :disabled="page >= totalPages"
            class="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { workOrderApi, type WorkOrder } from '@/api'
import {
  WorkOrderStatusLabel,
  WorkOrderStatusColor,
  FaultSourceLabel,
  FaultTypeLabel,
  StationList
} from '@/constants'

const orders = ref<WorkOrder[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  status: '',
  faultType: '',
  stationId: '',
  keyword: ''
})

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const loadOrders = async () => {
  try {
    const result = await workOrderApi.getList({
      ...filters.value,
      page: page.value,
      pageSize: pageSize.value
    })
    orders.value = result.items
    total.value = result.total
  } catch (error) {
    console.error('加载工单列表失败:', error)
  }
}

const resetFilters = () => {
  filters.value = {
    status: '',
    faultType: '',
    stationId: '',
    keyword: ''
  }
  page.value = 1
  loadOrders()
}

const changePage = (newPage: number) => {
  page.value = newPage
  loadOrders()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadOrders()
})
</script>
