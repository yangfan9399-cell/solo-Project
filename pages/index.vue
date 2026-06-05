<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">签证批次列表</h2>
      <div class="flex items-center space-x-4">
        <div class="text-sm text-gray-500">
          当前用户: <span class="font-medium">张经办 (团控)</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-500">总批次</div>
        <div class="text-2xl font-bold text-gray-900">{{ batches.length }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-500">待审核</div>
        <div class="text-2xl font-bold text-yellow-600">{{ pendingCount }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-500">已递签</div>
        <div class="text-2xl font-bold text-blue-600">{{ submittedCount }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-500">有问题批次</div>
        <div class="text-2xl font-bold text-red-600">{{ issueCount }}</div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div class="flex space-x-2">
          <span class="text-sm text-gray-500">状态筛选:</span>
          <select v-model="statusFilter" class="border rounded px-2 py-1 text-sm">
            <option value="">全部</option>
            <option value="DRAFT">草稿</option>
            <option value="PENDING_REVIEW">待审核</option>
            <option value="SUBMITTED">已递签</option>
            <option value="REJECTED">已退回</option>
            <option value="ARCHIVED">已归档</option>
          </select>
        </div>
        <div class="text-sm text-gray-500">
          可批量选择进行操作
        </div>
      </div>

      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="rounded">
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">批次号</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">目的地</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">游客/材料齐全/有问题</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">经办人</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="batch in filteredBatches" :key="batch.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <input type="checkbox" v-model="selectedBatches" :value="batch.id" class="rounded">
            </td>
            <td class="px-4 py-3 text-sm font-medium text-blue-600">{{ batch.batchNo }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ batch.country }}</td>
            <td class="px-4 py-3">
              <span :class="getStatusClass(batch.status)" class="px-2 py-1 text-xs font-medium rounded">
                {{ getStatusText(batch.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <span class="text-gray-900">{{ batch.touristCount }}</span>
              <span class="text-gray-400"> / </span>
              <span class="text-green-600">{{ batch.completeCount }}</span>
              <span v-if="batch.issueCount > 0" class="text-gray-400"> / </span>
              <span v-if="batch.issueCount > 0" class="text-red-600">{{ batch.issueCount }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ batch.createdBy.name }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(batch.createdAt) }}</td>
            <td class="px-4 py-3 text-sm">
              <NuxtLink :to="`/batch/${batch.id}`" class="text-blue-600 hover:text-blue-800">
                查看详情
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="selectedBatches.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          已选择 <span class="font-medium">{{ selectedBatches.length }}</span> 个批次
        </div>
        <div class="flex space-x-2">
          <button @click="batchAction('SUBMITTED')" class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            批量递签
          </button>
          <button @click="batchAction('ARCHIVED')" class="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
            批量归档
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BatchWithDetails } from '~/types'

const batches = ref<BatchWithDetails[]>([])
const statusFilter = ref('')
const selectedBatches = ref<number[]>([])
const selectAll = ref(false)
const error = ref('')

const pendingCount = computed(() => batches.value.filter(b => b.status === 'PENDING_REVIEW').length)
const submittedCount = computed(() => batches.value.filter(b => b.status === 'SUBMITTED').length)
const issueCount = computed(() => batches.value.filter(b => b.issueCount > 0).length)

const filteredBatches = computed(() => {
  if (!statusFilter.value) return batches.value
  return batches.value.filter(b => b.status === statusFilter.value)
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
    ARCHIVED: 'bg-green-100 text-green-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    DRAFT: '草稿',
    PENDING_REVIEW: '待审核',
    SUBMITTED: '已递签',
    REJECTED: '已退回',
    ARCHIVED: '已归档'
  }
  return texts[status] || status
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedBatches.value = filteredBatches.value.map(b => b.id)
  } else {
    selectedBatches.value = []
  }
}

const batchAction = async (status: string) => {
  error.value = ''
  for (const id of selectedBatches.value) {
    try {
      await $fetch(`/api/batches/${id}/status`, {
        method: 'POST',
        body: { status, notes: `批量${status === 'SUBMITTED' ? '递签' : '归档'}` }
      })
    } catch (e: any) {
      error.value = e.data?.message || '操作失败'
      return
    }
  }
  await fetchBatches()
  selectedBatches.value = []
  selectAll.value = false
}

const fetchBatches = async () => {
  batches.value = await $fetch('/api/batches')
}

onMounted(fetchBatches)
</script>
