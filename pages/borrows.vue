<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">借用管理</h1>
        <p class="text-gray-500 mt-1">管理量具的借用、审批、交接和归还</p>
      </div>
    </div>

    <div class="card p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="label">状态筛选</label>
          <select v-model="statusFilter" class="input" @change="loadBorrows">
            <option value="all">全部状态</option>
            <option value="pending">待审批</option>
            <option value="approved">已审批</option>
            <option value="rejected">已拒绝</option>
            <option value="borrowed">借用中</option>
            <option value="returned">已归还</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="loadBorrows" class="btn btn-secondary w-full">
            刷新
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card p-8">
      <LoadingSpinner text="加载借用记录中..." />
    </div>

    <div v-else-if="error" class="card p-8">
      <ErrorState :message="error" @retry="loadBorrows" />
    </div>

    <div v-else class="card overflow-hidden">
      <EmptyState v-if="records.length === 0" title="暂无借用记录" description="您可以在量具详情页申请借用" />
      
      <table v-else class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">量具信息</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用途</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预计归还</th>
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
            <td class="px-6 py-4 whitespace-nowrap">
              <p class="text-sm text-gray-900">{{ record.applicantName }}</p>
              <p class="text-xs text-gray-500">{{ record.applicantDepartment }}</p>
            </td>
            <td class="px-6 py-4">
              <p class="text-sm text-gray-900 max-w-xs truncate">{{ record.purpose }}</p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="isOverdue(record) ? 'text-red-600 font-medium' : 'text-gray-500'">
                {{ record.expectedReturnDate }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="badge" :class="getBorrowStatusColor(record.status)">
                {{ getBorrowStatusLabel(record.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
              <button v-if="record.status === 'pending' && hasRole(['admin', 'quality'])" @click="showApproveModal(record)" class="text-green-600 hover:text-green-700">审批</button>
              <button v-if="record.status === 'approved' && hasRole(['admin'])" @click="handleHandover(record)" class="text-blue-600 hover:text-blue-700">交接</button>
              <button v-if="(record.status === 'borrowed' || record.status === 'overdue') && hasRole(['admin'])" @click="showReturnModal(record)" class="text-primary-600 hover:text-primary-700">归还</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal v-if="showApprove" title="审批借用申请" :show="showApprove" @close="showApprove = false">
      <div v-if="selectedRecord" class="mb-6">
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <p class="text-sm text-gray-500">量具</p>
          <p class="font-medium">{{ selectedRecord.toolCode }} - {{ selectedRecord.toolName }}</p>
          <p class="text-sm text-gray-500 mt-2">申请人</p>
          <p class="font-medium">{{ selectedRecord.applicantName }} - {{ selectedRecord.applicantDepartment }}</p>
          <p class="text-sm text-gray-500 mt-2">用途</p>
          <p class="font-medium">{{ selectedRecord.purpose }}</p>
          <p class="text-sm text-gray-500 mt-2">预计归还</p>
          <p class="font-medium">{{ selectedRecord.expectedReturnDate }}</p>
        </div>
        <div>
          <label class="label">审批意见</label>
          <textarea v-model="approveRemark" class="input" rows="3"></textarea>
        </div>
      </div>
      <div class="flex justify-end space-x-3">
        <button @click="showApprove = false" class="btn btn-secondary">取消</button>
        <button @click="handleApprove(false)" class="btn btn-danger" :disabled="submitting">拒绝</button>
        <button @click="handleApprove(true)" class="btn btn-success" :disabled="submitting">通过</button>
      </div>
    </Modal>

    <Modal v-if="showReturn" title="归还验收" :show="showReturn" @close="showReturn = false">
      <div v-if="selectedRecord" class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-500">量具</p>
          <p class="font-medium">{{ selectedRecord.toolCode }} - {{ selectedRecord.toolName }}</p>
        </div>
        <div>
          <label class="label">归还状态 *</label>
          <select v-model="returnCondition" class="input" required>
            <option value="完好">完好</option>
            <option value="轻微磨损">轻微磨损</option>
            <option value="损坏">损坏</option>
          </select>
        </div>
        <div>
          <label class="label">备注</label>
          <textarea v-model="returnRemark" class="input" rows="3"></textarea>
        </div>
      </div>
      <div class="flex justify-end space-x-3 pt-4">
        <button @click="showReturn = false" class="btn btn-secondary">取消</button>
        <button @click="handleReturnConfirm" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '处理中...' : '确认归还' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import type { BorrowRecord } from '../types'

const { records, loading, error, fetchBorrows, approveBorrow, handoverBorrow, returnBorrow } = useBorrows()
const { currentUser, hasRole } = useAuth()

const statusFilter = ref('all')
const showApprove = ref(false)
const showReturn = ref(false)
const submitting = ref(false)
const selectedRecord = ref<BorrowRecord | null>(null)
const approveRemark = ref('')
const returnCondition = ref('完好')
const returnRemark = ref('')

function loadBorrows() {
  fetchBorrows({ status: statusFilter.value })
}

function isOverdue(record: BorrowRecord): boolean {
  if (record.status !== 'borrowed' && record.status !== 'overdue') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(record.expectedReturnDate)
  return date < today
}

function showApproveModal(record: BorrowRecord) {
  selectedRecord.value = record
  approveRemark.value = ''
  showApprove.value = true
}

function showReturnModal(record: BorrowRecord) {
  selectedRecord.value = record
  returnCondition.value = '完好'
  returnRemark.value = ''
  showReturn.value = true
}

async function handleApprove(approved: boolean) {
  if (!selectedRecord.value || !currentUser.value) return
  submitting.value = true
  try {
    await approveBorrow(selectedRecord.value.id, approved, currentUser.value.id, currentUser.value.name, approveRemark.value)
    showApprove.value = false
    loadBorrows()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleHandover(record: BorrowRecord) {
  if (!currentUser.value) return
  if (!confirm('确认交接该量具？')) return
  submitting.value = true
  try {
    await handoverBorrow(record.id, currentUser.value.id, currentUser.value.name)
    loadBorrows()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleReturnConfirm() {
  if (!selectedRecord.value || !currentUser.value) return
  submitting.value = true
  try {
    await returnBorrow(selectedRecord.value.id, currentUser.value.id, currentUser.value.name, returnCondition.value + ' ' + returnRemark.value)
    showReturn.value = false
    loadBorrows()
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

loadBorrows()
</script>
