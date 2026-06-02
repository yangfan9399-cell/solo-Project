<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">校准管理</h1>
        <p class="text-gray-500 mt-1">管理量具的校准计划和记录</p>
      </div>
      <button v-if="hasRole(['admin', 'quality'])" @click="showCreateModal = true" class="btn btn-primary">
        + 安排校准
      </button>
    </div>

    <div class="card p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="label">状态筛选</label>
          <select v-model="statusFilter" class="input" @change="loadCalibrations">
            <option value="all">全部状态</option>
            <option value="scheduled">计划中</option>
            <option value="in_progress">进行中</option>
            <option value="passed">已通过</option>
            <option value="failed">未通过</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="loadCalibrations" class="btn btn-secondary w-full">
            刷新
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card p-8">
      <LoadingSpinner text="加载校准记录中..." />
    </div>

    <div v-else-if="error" class="card p-8">
      <ErrorState :message="error" @retry="loadCalibrations" />
    </div>

    <div v-else class="card overflow-hidden">
      <EmptyState v-if="records.length === 0" title="暂无校准记录" description="点击右上角按钮安排校准" />
      
      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">量具信息</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">计划日期</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实际日期</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">校准机构</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="record in records" :key="record.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <p class="font-medium text-gray-900">{{ record.toolCode }}</p>
              <p class="text-sm text-gray-500">{{ record.toolName }}</p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.plannedDate }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.actualDate || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ record.calibrationAgency || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="badge" :class="getCalibrationStatusColor(record.status)">
                {{ getCalibrationStatusLabel(record.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
              <button v-if="record.status === 'scheduled' && hasRole(['admin', 'quality'])" @click="handleStart(record)" class="text-blue-600 hover:text-blue-700">开始</button>
              <button v-if="(record.status === 'scheduled' || record.status === 'in_progress') && hasRole(['admin', 'quality'])" @click="showCompleteModal(record)" class="text-green-600 hover:text-green-700">完成</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="showCreateModal" title="安排校准" :show="showCreateModal" @close="showCreateModal = false">
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <label class="label">选择量具 *</label>
          <select v-model="formData.toolId" class="input" required>
            <option value="">请选择量具</option>
            <option v-for="tool in availableTools" :key="tool.id" :value="tool.id">
              {{ tool.code }} - {{ tool.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="label">计划校准日期 *</label>
          <input v-model="formData.plannedDate" type="date" class="input" required />
        </div>
        <div>
          <label class="label">校准机构</label>
          <input v-model="formData.calibrationAgency" type="text" class="input" />
        </div>
        <div>
          <label class="label">备注</label>
          <textarea v-model="formData.remark" class="input" rows="3"></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showCreateModal = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认安排' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal v-if="showComplete" title="完成校准" :show="showComplete" @close="showComplete = false">
      <form @submit.prevent="handleCompleteConfirm" class="space-y-4">
        <div v-if="selectedRecord">
          <div class="bg-gray-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-500">量具</p>
            <p class="font-medium">{{ selectedRecord.toolCode }} - {{ selectedRecord.toolName }}</p>
          </div>
        </div>
        <div>
          <label class="label">校准结果 *</label>
          <select v-model="completeForm.passed" class="input" required>
            <option :value="true">通过</option>
            <option :value="false">不通过</option>
          </select>
        </div>
        <div>
          <label class="label">实际校准日期 *</label>
          <input v-model="completeForm.actualDate" type="date" class="input" required />
        </div>
        <div>
          <label class="label">证书编号</label>
          <input v-model="completeForm.certificateNumber" type="text" class="input" />
        </div>
        <div>
          <label class="label">下次校准日期</label>
          <input v-model="completeForm.nextCalibrationDate" type="date" class="input" />
        </div>
        <div>
          <label class="label">校准费用(元)</label>
          <input v-model.number="completeForm.cost" type="number" class="input" min="0" step="0.01" />
        </div>
        <div>
          <label class="label">校准结果说明</label>
          <textarea v-model="completeForm.result" class="input" rows="3"></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showComplete = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认完成' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { CalibrationRecord, Tool } from '../types'

const { records, loading, error, fetchCalibrations, createCalibration, startCalibration, completeCalibration } = useCalibrations()
const { tools, fetchTools } = useTools()
const { currentUser, hasRole } = useAuth()

const statusFilter = ref('all')
const showCreateModal = ref(false)
const showComplete = ref(false)
const submitting = ref(false)
const selectedRecord = ref<CalibrationRecord | null>(null)

const formData = ref({
  toolId: 0,
  plannedDate: '',
  calibrationAgency: '',
  remark: ''
})

const completeForm = ref({
  passed: true,
  actualDate: '',
  certificateNumber: '',
  nextCalibrationDate: '',
  cost: 0,
  result: ''
})

const availableTools = computed(() => {
  return tools.value.filter(t => t.status !== 'scrapped')
})

function loadCalibrations() {
  fetchCalibrations({ status: statusFilter.value })
}

function showCompleteModal(record: CalibrationRecord) {
  selectedRecord.value = record
  completeForm.value = {
    passed: true,
    actualDate: new Date().toISOString().split('T')[0],
    certificateNumber: '',
    nextCalibrationDate: '',
    cost: 0,
    result: ''
  }
  showComplete.value = true
}

async function handleCreate() {
  if (!formData.value.toolId) return
  submitting.value = true
  try {
    await createCalibration({
      toolId: formData.value.toolId,
      plannedDate: formData.value.plannedDate,
      calibrationAgency: formData.value.calibrationAgency || undefined,
      remark: formData.value.remark || undefined
    })
    showCreateModal.value = false
    loadCalibrations()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleStart(record: CalibrationRecord) {
  if (!confirm('确认开始校准？')) return
  submitting.value = true
  try {
    await startCalibration(record.id)
    loadCalibrations()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleCompleteConfirm() {
  if (!selectedRecord.value) return
  submitting.value = true
  try {
    await completeCalibration(selectedRecord.value.id, {
      passed: completeForm.value.passed,
      actualDate: completeForm.value.actualDate,
      certificateNumber: completeForm.value.certificateNumber || undefined,
      result: completeForm.value.result || undefined,
      nextCalibrationDate: completeForm.value.nextCalibrationDate || undefined,
      cost: completeForm.value.cost || undefined,
      remark: ''
    })
    showComplete.value = false
    loadCalibrations()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

loadCalibrations()
fetchTools()
</script>
