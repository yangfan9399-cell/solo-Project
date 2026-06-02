<template>
  <div>
    <div class="flex items-center mb-8">
      <button @click="navigateTo('/tools')" class="mr-4 text-gray-400 hover:text-gray-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ tool?.code }} - {{ tool?.name }}</h1>
        <p class="text-gray-500 mt-1">量具详情</p>
      </div>
      <span class="ml-4 badge" :class="getToolStatusColor(tool?.status || 'available')">
        {{ getToolStatusLabel(tool?.status || 'available') }}
      </span>
      <span v-if="tool?.hasPendingBorrow" class="ml-2 badge badge-yellow">待审批借用</span>
    </div>

    <div v-if="loading && !tool" class="card p-8">
      <LoadingSpinner text="加载量具详情中..." />
    </div>

    <div v-else-if="error" class="card p-8">
      <ErrorState :message="error" @retry="loadAll" />
    </div>

    <div v-else-if="tool" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-gray-500">量具编号</p>
            <p class="font-medium text-gray-900">{{ tool.code }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">量具名称</p>
            <p class="font-medium text-gray-900">{{ tool.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">规格型号</p>
            <p class="font-medium text-gray-900">{{ tool.specification || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">制造厂商</p>
            <p class="font-medium text-gray-900">{{ tool.manufacturer || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">出厂编号</p>
            <p class="font-medium text-gray-900">{{ tool.serialNumber || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">测量范围</p>
            <p class="font-medium text-gray-900">{{ tool.measurementRange || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">精度等级</p>
            <p class="font-medium text-gray-900">{{ tool.accuracy || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">所属部门</p>
            <p class="font-medium text-gray-900">{{ tool.department || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">存放位置</p>
            <p class="font-medium text-gray-900">{{ tool.location || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">校准周期</p>
            <p class="font-medium text-gray-900">{{ tool.calibrationCycleDays }} 天</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">上次校准日期</p>
            <p class="font-medium text-gray-900">{{ tool.lastCalibrationDate || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">下次校准日期</p>
            <p class="font-medium" :class="isCalibrationOverdue(tool.nextCalibrationDate) ? 'text-red-600' : 'text-gray-900'">
              {{ tool.nextCalibrationDate || '-' }}
              <span v-if="isCalibrationOverdue(tool.nextCalibrationDate)" class="text-xs">(逾期)</span>
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">购置日期</p>
            <p class="font-medium text-gray-900">{{ tool.purchaseDate || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">价格</p>
            <p class="font-medium text-gray-900">¥{{ tool.price?.toFixed(2) || '0.00' }}</p>
          </div>
        </div>
        <div v-if="tool.remark" class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-sm text-gray-500">备注</p>
          <p class="text-gray-900 whitespace-pre-line">{{ tool.remark }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <template v-if="currentUser">
          <button
            v-if="canBorrowTool(tool)"
            @click="showBorrowModal = true"
            class="btn btn-primary"
          >
            申请借用
          </button>
          <div
            v-else
            class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center text-sm"
            :title="borrowDisabledReason"
          >
            <svg class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            借用：{{ borrowDisabledReason }}
          </div>
        </template>

        <template v-if="hasRole(['admin', 'quality'])">
          <button
            v-if="canCalibrate"
            @click="showCalibrationModal = true"
            class="btn btn-secondary"
          >
            安排校准
          </button>
          <div
            v-else
            class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center text-sm"
            :title="calibrationDisabledReason"
          >
            <svg class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            校准：{{ calibrationDisabledReason }}
          </div>
        </template>

        <button
          v-if="currentUser"
          @click="showFeedbackModal = true"
          class="btn btn-warning"
        >
          提交异常反馈
        </button>
        <div
          v-else
          class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center text-sm"
        >
          <svg class="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          反馈：请先在右上角选择用户
        </div>

        <button @click="navigateTo('/tools')" class="btn btn-secondary">
          返回列表
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">借用记录</h2>
            <span class="text-sm text-gray-400">{{ borrowRecords.length }} 条</span>
          </div>
          <div v-if="borrowRecords.length === 0" class="py-6 text-center text-gray-400 text-sm">
            暂无借用记录
          </div>
          <div v-else class="space-y-3">
            <div v-for="(record, idx) in borrowRecords" :key="record.id" class="p-3 rounded-lg" :class="idx === 0 ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-900">{{ record.applicantName }}</span>
                <span class="badge" :class="getBorrowStatusColor(record.status)">
                  {{ getBorrowStatusLabel(record.status) }}
                </span>
              </div>
              <p class="text-xs text-gray-500">{{ record.purpose }}</p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-gray-400">预计归还: {{ record.expectedReturnDate }}</span>
                <span class="text-xs text-gray-400">{{ record.createdAt?.split('T')[0] }}</span>
              </div>
              <div v-if="idx === 0 && getBorrowNextHint(record)" class="mt-2 pt-2 border-t border-blue-200 flex items-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-xs text-blue-600">{{ getBorrowNextHint(record) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">校准记录</h2>
            <span class="text-sm text-gray-400">{{ calibrationRecords.length }} 条</span>
          </div>
          <div v-if="calibrationRecords.length === 0" class="py-6 text-center text-gray-400 text-sm">
            暂无校准记录
          </div>
          <div v-else class="space-y-3">
            <div v-for="(record, idx) in calibrationRecords" :key="record.id" class="p-3 rounded-lg" :class="idx === 0 ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50'">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-gray-900">{{ record.plannedDate }}</span>
                <span class="badge" :class="getCalibrationStatusColor(record.status)">
                  {{ getCalibrationStatusLabel(record.status) }}
                </span>
              </div>
              <p v-if="record.calibrationAgency" class="text-xs text-gray-500">机构: {{ record.calibrationAgency }}</p>
              <div class="flex items-center justify-between mt-1">
                <span v-if="record.actualDate" class="text-xs text-gray-400">实际: {{ record.actualDate }}</span>
                <span v-if="record.nextCalibrationDate" class="text-xs text-gray-400">下次: {{ record.nextCalibrationDate }}</span>
              </div>
              <div v-if="idx === 0 && getCalibrationNextHint(record)" class="mt-2 pt-2 border-t border-blue-200 flex items-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-xs text-blue-600">{{ getCalibrationNextHint(record) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">异常反馈</h2>
            <span class="text-sm text-gray-400">{{ feedbackRecords.length }} 条</span>
          </div>
          <div v-if="feedbackRecords.length === 0" class="py-6 text-center text-gray-400 text-sm">
            暂无异常反馈
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(record, idx) in feedbackRecords"
              :key="record.id"
              class="p-3 rounded-lg transition-all duration-500"
              :class="{
                'bg-amber-50 ring-1 ring-amber-300': idx === 0 && highlightNewFeedback,
                'bg-blue-50 ring-1 ring-blue-200': idx === 0 && !highlightNewFeedback,
                'bg-gray-50': idx !== 0
              }"
            >
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900">{{ record.title }}</span>
                  <span v-if="idx === 0 && highlightNewFeedback" class="badge badge-orange">刚刚</span>
                </div>
                <span class="badge" :class="getFeedbackStatusColor(record.status)">
                  {{ getFeedbackStatusLabel(record.status) }}
                </span>
              </div>
              <p class="text-xs text-gray-500">{{ record.type }} · {{ record.reporterName }}</p>
              <p v-if="record.description" class="text-xs text-gray-400 mt-1 line-clamp-2">{{ record.description }}</p>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-gray-400">{{ record.createdAt?.split('T')[0] }}</span>
              </div>
              <div v-if="idx === 0 && getFeedbackNextHint(record)" class="mt-2 pt-2 border-t border-blue-200 flex items-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-xs text-blue-600">{{ getFeedbackNextHint(record) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal v-if="showBorrowModal" title="申请借用" :show="showBorrowModal" @close="showBorrowModal = false">
      <form @submit.prevent="handleBorrow" class="space-y-4">
        <div>
          <label class="label">借用用途 *</label>
          <textarea v-model="borrowForm.purpose" class="input" rows="3" required></textarea>
        </div>
        <div>
          <label class="label">预计归还日期 *</label>
          <input v-model="borrowForm.expectedReturnDate" type="date" class="input" required />
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showBorrowModal = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交申请' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal v-if="showCalibrationModal" title="安排校准" :show="showCalibrationModal" @close="showCalibrationModal = false">
      <form @submit.prevent="handleCalibration" class="space-y-4">
        <div>
          <label class="label">计划校准日期 *</label>
          <input v-model="calibrationForm.plannedDate" type="date" class="input" required />
        </div>
        <div>
          <label class="label">校准机构</label>
          <input v-model="calibrationForm.calibrationAgency" type="text" class="input" />
        </div>
        <div>
          <label class="label">备注</label>
          <textarea v-model="calibrationForm.remark" class="input" rows="3"></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showCalibrationModal = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? '提交中...' : '确认安排' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal v-if="showFeedbackModal" title="提交异常反馈" :show="showFeedbackModal" @close="showFeedbackModal = false">
      <form @submit.prevent="handleFeedback" class="space-y-4">
        <div>
          <label class="label">反馈类型 *</label>
          <select v-model="feedbackForm.type" class="input" required>
            <option value="">请选择</option>
            <option value="量具损坏">量具损坏</option>
            <option value="精度异常">精度异常</option>
            <option value="校准问题">校准问题</option>
            <option value="外观缺陷">外观缺陷</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label class="label">标题 *</label>
          <input v-model="feedbackForm.title" type="text" class="input" required />
        </div>
        <div>
          <label class="label">详细描述 *</label>
          <textarea v-model="feedbackForm.description" class="input" rows="4" required></textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" @click="showFeedbackModal = false" class="btn btn-secondary">取消</button>
          <button type="submit" class="btn btn-warning" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交反馈' }}
          </button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { Tool, BorrowRecord, CalibrationRecord, Feedback } from '../../types'
import {
  canBorrowTool,
  getBorrowDisableReason,
  canCalibrateTool,
  getCalibrationDisableReason,
  getToolStatusLabel,
  getToolStatusColor
} from '../../composables/useTools'
import {
  getBorrowStatusLabel,
  getBorrowStatusColor
} from '../../composables/useBorrows'
import {
  getCalibrationStatusLabel,
  getCalibrationStatusColor
} from '../../composables/useCalibrations'
import {
  getFeedbackStatusLabel,
  getFeedbackStatusColor
} from '../../composables/useFeedbacks'

const route = useRoute()
const { tool, loading, error, fetchTool } = useTools()
const { records: borrowRecords, fetchBorrows, createBorrow } = useBorrows()
const { records: calibrationRecords, fetchCalibrations, createCalibration } = useCalibrations()
const { records: feedbackRecords, fetchFeedbacks, createFeedback } = useFeedbacks()
const { currentUser, hasRole } = useAuth()

const showBorrowModal = ref(false)
const showCalibrationModal = ref(false)
const showFeedbackModal = ref(false)
const submitting = ref(false)
const highlightNewFeedback = ref(false)

const borrowForm = ref({ purpose: '', expectedReturnDate: '' })
const calibrationForm = ref({ plannedDate: '', calibrationAgency: '', remark: '' })
const feedbackForm = ref({ type: '', title: '', description: '' })

const borrowDisabledReason = computed(() => {
  if (!tool.value) return ''
  return getBorrowDisableReason(tool.value)
})

const activeCalibrationCount = computed(() => {
  return calibrationRecords.value.filter(r => r.status === 'scheduled' || r.status === 'in_progress').length
})

const canCalibrate = computed(() => {
  if (!tool.value) return false
  return canCalibrateTool(tool.value, activeCalibrationCount.value)
})

const calibrationDisabledReason = computed(() => {
  if (!tool.value) return ''
  return getCalibrationDisableReason(tool.value, activeCalibrationCount.value)
})

function getToolId(): number {
  return Number(route.params.id)
}

function loadAll() {
  const id = getToolId()
  if (id) {
    fetchTool(id)
    fetchBorrows({ toolId: id })
    fetchCalibrations({ toolId: id })
    fetchFeedbacks({ toolId: id })
  }
}

function isCalibrationOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  return date < today
}

function getBorrowNextHint(record: BorrowRecord): string {
  switch (record.status) {
    case 'pending': return '下一步：等待计量管理员或质量主管审批'
    case 'approved': return '下一步：请前往借用管理完成出库交接'
    case 'borrowed': return '下一步：使用完毕后请及时归还验收'
    case 'overdue': return '注意：已超过预计归还日期，请尽快归还'
    case 'returned': return ''
    case 'rejected': return ''
    default: return ''
  }
}

function getCalibrationNextHint(record: CalibrationRecord): string {
  switch (record.status) {
    case 'scheduled': return '下一步：请在校准管理中点击"开始校准"'
    case 'in_progress': return '下一步：校准完成后请填写校准结果'
    case 'passed': return record.nextCalibrationDate ? `下次校准日期：${record.nextCalibrationDate}` : ''
    case 'failed': return '注意：校准不合格，量具已转入维护状态'
    default: return ''
  }
}

function getFeedbackNextHint(record: Feedback): string {
  switch (record.status) {
    case 'open': return '下一步：等待质量主管处理'
    case 'processing': return '处理中，请关注处理结果'
    case 'resolved': return ''
    case 'closed': return ''
    default: return ''
  }
}

async function refreshAfterAction() {
  const id = getToolId()
  if (id) {
    await fetchTool(id)
    await fetchBorrows({ toolId: id })
    await fetchCalibrations({ toolId: id })
    await fetchFeedbacks({ toolId: id })
  }
}

async function handleBorrow() {
  if (!currentUser.value || !tool.value) return
  submitting.value = true
  try {
    await createBorrow({
      toolId: tool.value.id,
      applicantId: currentUser.value.id,
      applicantName: currentUser.value.name,
      applicantDepartment: currentUser.value.department,
      purpose: borrowForm.value.purpose,
      expectedReturnDate: borrowForm.value.expectedReturnDate
    })
    showBorrowModal.value = false
    borrowForm.value = { purpose: '', expectedReturnDate: '' }
    await refreshAfterAction()
  } catch (e: any) {
    alert(e.message || '申请失败')
  } finally {
    submitting.value = false
  }
}

async function handleCalibration() {
  if (!tool.value) return
  submitting.value = true
  try {
    await createCalibration({
      toolId: tool.value.id,
      plannedDate: calibrationForm.value.plannedDate,
      calibrationAgency: calibrationForm.value.calibrationAgency || undefined,
      remark: calibrationForm.value.remark || undefined
    })
    showCalibrationModal.value = false
    calibrationForm.value = { plannedDate: '', calibrationAgency: '', remark: '' }
    await refreshAfterAction()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleFeedback() {
  if (!currentUser.value || !tool.value) return
  submitting.value = true
  try {
    await createFeedback({
      toolId: tool.value.id,
      toolCode: tool.value.code,
      reporterId: currentUser.value.id,
      reporterName: currentUser.value.name,
      type: feedbackForm.value.type,
      title: feedbackForm.value.title,
      description: feedbackForm.value.description
    })
    showFeedbackModal.value = false
    feedbackForm.value = { type: '', title: '', description: '' }
    highlightNewFeedback.value = true
    await refreshAfterAction()
    setTimeout(() => { highlightNewFeedback.value = false }, 4000)
  } catch (e: any) {
    alert(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

loadAll()
</script>
