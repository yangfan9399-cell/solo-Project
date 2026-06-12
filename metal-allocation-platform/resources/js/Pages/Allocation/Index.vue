<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, router } from '@inertiajs/vue3'
import { ref, computed } from 'vue'

defineOptions({ layout: MainLayout })

const props = defineProps({
  allocations: Object,
  filters: Object,
  metalTypes: Array,
  auth: Object,
})

const statusFilter = ref(props.filters?.status || '')
const metalTypeFilter = ref(props.filters?.metal_type || '')
const searchQuery = ref(props.filters?.search || '')

const statusMap = {
  pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '处理中', class: 'bg-blue-100 text-blue-800' },
  reviewing: { label: '复核中', class: 'bg-purple-100 text-purple-800' },
  archived: { label: '已归档', class: 'bg-green-100 text-green-800' },
  blocked: { label: '已阻断', class: 'bg-red-100 text-red-800' },
  appealed: { label: '申诉中', class: 'bg-orange-100 text-orange-800' },
}

function statusBadge(status) {
  return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' }
}

function applyFilters() {
  router.get('/allocations', {
    status: statusFilter.value,
    metal_type: metalTypeFilter.value,
    search: searchQuery.value,
  }, { preserveState: true, preserveScroll: true })
}

function resetFilters() {
  statusFilter.value = ''
  metalTypeFilter.value = ''
  searchQuery.value = ''
  router.get('/allocations', {}, { preserveState: true, preserveScroll: true })
}

const hasDifferences = (allocation) => {
  return allocation.has_differences || allocation.differences_count > 0
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
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">调拨记录管理</h1>
    </div>

    <div class="card mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select v-model="statusFilter" @change="applyFilters" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="reviewing">复核中</option>
            <option value="archived">已归档</option>
            <option value="blocked">已阻断</option>
            <option value="appealed">申诉中</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">贵金属类型</label>
          <select v-model="metalTypeFilter" @change="applyFilters" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="">全部</option>
            <option v-for="type in metalTypes" :key="type" :value="type">{{ metalTypeLabel(type) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input v-model="searchQuery" @keyup.enter="applyFilters" type="text" placeholder="调拨编号/库房名称..." class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div class="flex space-x-2">
          <button @click="applyFilters" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">筛选</button>
          <button @click="resetFilters" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm">重置</button>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">调拨编号</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">来源库房</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标库房</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">贵金属类型</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">数量</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">金额</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">状态</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前责任人</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">差异</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="item in allocations.data" :key="item.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-indigo-600">
                <Link :href="`/allocations/${item.id}`">{{ item.allocation_no }}</Link>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ item.source_vault }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ item.target_vault }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ metalTypeLabel(item.metal_type) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 text-right">{{ item.quantity }}</td>
              <td class="px-4 py-3 text-sm text-gray-700 text-right">{{ item.amount }}</td>
              <td class="px-4 py-3 text-center">
                <span class="status-badge" :class="statusBadge(item.status).class">{{ statusBadge(item.status).label }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ item.current_handler?.name || '-' }}</td>
              <td class="px-4 py-3 text-center">
                <span v-if="hasDifferences(item)" class="inline-flex items-center text-red-600" :title="`${item.differences_count}项差异`">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                  {{ item.differences_count }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex justify-center space-x-2">
                  <Link :href="`/allocations/${item.id}`" class="text-indigo-600 hover:text-indigo-800 text-sm">详情</Link>
                  <Link v-if="item.status !== 'archived'" :href="`/allocations/${item.id}/process`" class="text-blue-600 hover:text-blue-800 text-sm">处理</Link>
                </div>
              </td>
            </tr>
            <tr v-if="allocations.data.length === 0">
              <td colspan="10" class="px-4 py-8 text-center text-gray-500">暂无调拨记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="allocations.links && allocations.links.length > 3" class="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          共 <span class="font-medium">{{ allocations.total }}</span> 条记录
        </div>
        <div class="flex space-x-1">
          <template v-for="link in allocations.links" :key="link.label">
            <Link
              v-if="link.url"
              :href="link.url"
              class="px-3 py-1 text-sm rounded border"
              :class="link.active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              v-html="link.label"
            />
            <span v-else class="px-3 py-1 text-sm rounded border bg-gray-100 text-gray-400 border-gray-200" v-html="link.label"></span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
