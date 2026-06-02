<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">异常反馈</h1>
        <p class="text-gray-500 mt-1">管理系统异常和问题反馈</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + 提交反馈
      </button>
    </div>

    <div class="card p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="label">状态筛选</label>
          <select v-model="statusFilter" class="input" @change="loadFeedbacks">
            <option value="all">全部状态</option>
            <option value="open">待处理</option>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="loadFeedbacks" class="btn btn-secondary w-full">
            刷新
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card p-8">
      <LoadingSpinner text="加载反馈记录中..." />
    </div>

    <div v-else-if="error" class="card p-8">
      <ErrorState :message="error" @retry="loadFeedbacks" />
    </div>

    <div v-else class="card overflow-hidden">
      <EmptyState v-if="records.length === 0" title="暂无反馈记录" description="点击右上角按钮提交反馈" />
      
      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交人</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联量具</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="record in records" :key="record.id" class="hover:bg-gray-50">
            <td class="px-6 py-4">
              <p class="font-medium text-gray-900">{{ record.title }}</p>
              <p class="text-sm text-gray-500 truncate max-w-xs">{{ record.description }}</p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.type }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.reporterName }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.toolCode || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="badge" :class="getFeedbackStatusColor(record.status)">
                {{ getFeedbackStatusLabel(record.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
              <button v-if="(record.status === 'open' || record.status === 'processing') && hasRole(['admin', 'quality'])" @click="showHandleModal(record)" class="text-primary-600 hover:text-primary-700">处理</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="showCreateModal" title="提交反馈" :show="showCreateModal" @close="showCreateModal = false">
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="label">反馈类型 *</label>
          <select v-model="formData.type" class="input" required>
            <option value="">请选择</option>
            <option value="量具损坏">量具损坏</option>
            <option value="系统问题">系统问题</option>
            <option value="流程异常">流程异常</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label class="label">关联量具</label>
          <select v-model="formData.toolId" class="input">
            <option value="">无</option>
            <option v-for="tool in tools" :key="tool.id" :value="tool.id">
              {{ tool.code }} - {{ tool.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">标题 *</label>
          <input v-model="formData.title" type="text" class="input" required />
        </div>
        <div>
          <label class="label">详细描述 *</label>
          <textarea v-model="formData.description" class="input" rows="4" required></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showCreateModal = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal v-if="showHandle" title="处理反馈" :show="showHandle" @close="showHandle = false">
      <form @submit.prevent="handleConfirm" class="space-y-4">
        <div v-if="selectedRecord">
          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-500">标题</p>
            <p class="font-medium">{{ selectedRecord.title }}</p>
            <p class="text-sm text-gray-500 mt-2">描述</p>
            <p class="font-medium">{{ selectedRecord.description }}</p>
          </div>
        </div>
        <div>
          <label class="label">处理状态 *</label>
          <select v-model="handleForm.status" class="input" required>
            <option value="processing">处理中</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        <div>
          <label class="label">处理结果 *</label>
          <textarea v-model="handleForm.result" class="input" rows="4" required></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showHandle = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认处理' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { Feedback, FeedbackStatus } from '../types'

const { records, loading, error, fetchFeedbacks, createFeedback, handleFeedback } = useFeedbacks()
const { tools, fetchTools } = useTools()
const { currentUser, hasRole } = useAuth()

const statusFilter = ref('all')
const showCreateModal = ref(false)
const showHandle = ref(false)
const submitting = ref(false)
const selectedRecord = ref<Feedback | null>(null)

const formData = ref({
  type: '',
  toolId: 0,
  title: '',
  description: ''
})

const handleForm = ref({
  status: 'processing' as FeedbackStatus,
  result: ''
})

function loadFeedbacks() {
  fetchFeedbacks({ status: statusFilter.value })
}

function showHandleModal(record: Feedback) {
  selectedRecord.value = record
  handleForm.value = {
    status: 'processing',
    result: ''
  }
  showHandle.value = true
}

async function handleCreate() {
  if (!currentUser.value) {
    alert('请先选择用户身份')
    return
  }
  submitting.value = true
  try {
    const selectedTool = tools.value.find(t => t.id === formData.value.toolId)
    await createFeedback({
      toolId: formData.value.toolId || undefined,
      toolCode: selectedTool?.code,
      reporterId: currentUser.value.id,
      reporterName: currentUser.value.name,
      type: formData.value.type,
      title: formData.value.title,
      description: formData.value.description
    })
    showCreateModal.value = false
    loadFeedbacks()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleConfirm() {
  if (!selectedRecord.value || !currentUser.value) return
  submitting.value = true
  try {
    await handleFeedback(selectedRecord.value.id, {
      status: handleForm.value.status,
      handlerId: currentUser.value.id,
      handlerName: currentUser.value.name,
      result: handleForm.value.result
    })
    showHandle.value = false
    loadFeedbacks()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

loadFeedbacks()
fetchTools()
</script>
