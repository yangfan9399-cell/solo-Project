<template>
  <div v-if="batch">
    <div class="flex justify-between items-start mb-6">
      <div>
        <NuxtLink to="/" class="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">← 返回列表</NuxtLink>
        <h2 class="text-2xl font-bold text-gray-900">{{ batch.batchNo }} - {{ batch.country }}</h2>
        <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
          <span>状态: <span :class="getStatusClass(batch.status)" class="px-2 py-1 text-xs font-medium rounded">{{ getStatusText(batch.status) }}</span></span>
          <span>经办人: {{ batch.createdBy.name }}</span>
          <span v-if="batch.reviewedBy">复核人: {{ batch.reviewedBy.name }}</span>
          <span>创建时间: {{ formatDate(batch.createdAt) }}</span>
        </div>
      </div>
      <div class="flex space-x-2">
        <button v-if="batch.status !== 'SUBMITTED' && batch.status !== 'ARCHIVED'" 
                @click="updateStatus('SUBMITTED')" 
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          确认递签
        </button>
        <button v-if="batch.status !== 'REJECTED' && batch.status !== 'ARCHIVED'" 
                @click="showRejectModal = true" 
                class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
          退回补正
        </button>
        <button v-if="batch.status !== 'ARCHIVED'" 
                @click="updateStatus('ARCHIVED')" 
                class="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
          归档
        </button>
      </div>
    </div>

    <div v-if="passportExpiredAlert" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div>
          <p class="text-red-700 font-medium">护照过期警告</p>
          <p class="text-red-600 text-sm mt-1">{{ passportExpiredAlert }}</p>
          <p class="text-red-600 text-sm">请先通知游客换证或将其移出此批次后再递签。</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
      {{ error }}
    </div>

    <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-700">
      {{ success }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">游客列表 ({{ batch.tourists.length }}人)</h3>
            <span class="text-sm text-gray-500">经办人可进行材料补正处理</span>
          </div>
          <div class="divide-y divide-gray-200">
            <div v-for="tourist in batch.tourists" :key="tourist.id" class="p-6">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h4 class="text-lg font-medium text-gray-900">{{ tourist.name }}</h4>
                    <span v-if="tourist.isPassportExpired" class="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">护照过期</span>
                    <span v-else-if="tourist.isPassportExpiringSoon" class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">护照即将过期</span>
                    <span v-if="tourist.visaResult" :class="getVisaResultClass(tourist.visaResult)" class="px-2 py-1 text-xs font-medium rounded">
                      {{ getVisaResultText(tourist.visaResult) }}
                    </span>
                  </div>
                  <div class="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>护照号: {{ tourist.passportNo }}</div>
                    <div>有效期至: {{ formatDate(tourist.passportExpire) }}</div>
                    <div v-if="tourist.phone">联系电话: {{ tourist.phone }}</div>
                  </div>
                  <div v-if="tourist.batchNotes" class="mt-2 text-sm text-orange-600">
                    备注: {{ tourist.batchNotes }}
                  </div>
                </div>
                <div class="flex flex-col items-end space-y-2">
                  <div v-if="batch.status === 'SUBMITTED'" class="flex items-center space-x-2">
                    <select @change="updateVisaResult(tourist.id, ($event.target as HTMLSelectElement).value)" 
                            class="border rounded px-2 py-1 text-sm">
                      <option value="">更新出签结果</option>
                      <option value="PENDING" :selected="tourist.visaResult === 'PENDING'">待补充</option>
                      <option value="APPROVED" :selected="tourist.visaResult === 'APPROVED'">已出签</option>
                      <option value="REJECTED" :selected="tourist.visaResult === 'REJECTED'">拒签</option>
                    </select>
                  </div>
                  <button v-if="tourist.isPassportExpired && batch.status !== 'ARCHIVED'"
                          @click="confirmRemoveTourist(tourist)"
                          class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                    移出批次
                  </button>
                </div>
              </div>

              <div class="mt-4">
                <div class="flex items-center justify-between mb-2">
                  <h5 class="text-sm font-medium text-gray-700">材料清单</h5>
                  <span class="text-xs text-gray-500">点击材料卡片可编辑状态和补正说明</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div v-for="material in tourist.materials" :key="material.id" 
                       :class="getMaterialCardClass(material.status)" 
                       class="p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                       @click="openMaterialEdit(tourist, material)">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">{{ material.type }}</span>
                      <span :class="getMaterialStatusClass(material.status)" class="text-xs font-medium">
                        {{ getMaterialStatusText(material.status) }}
                      </span>
                    </div>
                    <div v-if="material.notes" class="mt-1 text-xs text-gray-500 line-clamp-1">
                      {{ material.notes }}
                    </div>
                    <div class="mt-2 text-xs text-gray-400">
                      点击编辑 →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">最近改动</h3>
            <p class="text-sm text-gray-500 mt-1">包含材料补正、出签结果、批次操作</p>
          </div>
          <div class="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            <div v-for="log in batch.allActivityLogs" :key="log.id" class="p-4">
              <div class="flex items-start">
                <div class="flex-shrink-0 w-2 h-2 mt-2 rounded-full" :class="getLogDotColor(log.type)"></div>
                <div class="ml-3 flex-1">
                  <div class="flex items-center space-x-2">
                    <p class="text-sm font-medium text-gray-900">{{ log.user.name }}</p>
                    <span :class="getLogBadgeClass(log.type)" class="px-2 py-0.5 text-xs font-medium rounded">
                      {{ getLogTypeText(log.type) }}
                    </span>
                  </div>
                  <div v-if="log.type === 'MATERIAL'" class="mt-1">
                    <p class="text-sm text-gray-700">
                      <span class="font-medium text-blue-600">{{ log.touristName }}</span>
                      的
                      <span class="font-medium">{{ log.materialType }}</span>
                    </p>
                    <p v-if="log.notes" class="text-xs text-gray-500 mt-1">{{ log.notes }}</p>
                  </div>
                  <div v-else class="mt-1">
                    <p class="text-sm text-gray-600">{{ getActionText(log.action) }}</p>
                    <p v-if="log.notes" class="text-xs text-gray-500 mt-1">{{ log.notes }}</p>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDateTime(log.createdAt) }}</p>
                </div>
              </div>
            </div>
            <div v-if="batch.allActivityLogs.length === 0" class="p-4 text-center text-gray-500 text-sm">
              暂无操作记录
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">批次摘要</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">游客总数</span>
              <span class="font-medium">{{ batch.tourists.length }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">材料齐全</span>
              <span class="font-medium text-green-600">{{ completeCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">有问题</span>
              <span class="font-medium text-red-600">{{ issueCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">已出签</span>
              <span class="font-medium text-blue-600">{{ approvedCount }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">待补结果</span>
              <span class="font-medium text-yellow-600">{{ pendingResultCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-4">退回补正说明</h3>
        <textarea v-model="rejectNotes" class="w-full border rounded-lg p-3 text-sm" rows="4" placeholder="请输入退回原因和补正说明..."></textarea>
        <div class="mt-4 flex justify-end space-x-3">
          <button @click="showRejectModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
          <button @click="confirmReject" class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">确认退回</button>
        </div>
      </div>
    </div>

    <div v-if="showMaterialModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-2">材料补正处理</h3>
        <p class="text-sm text-gray-500 mb-4">
          游客: {{ editingTourist?.name }} | 材料: {{ editingMaterial?.type }}
        </p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">材料状态</label>
            <select v-model="materialEditForm.status" class="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="COMPLETE">齐全</option>
              <option value="PENDING">待提交</option>
              <option value="REJECTED">不合格</option>
              <option value="EXPIRED">已过期</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">补正说明</label>
            <textarea v-model="materialEditForm.notes" class="w-full border rounded-lg p-3 text-sm" rows="3" placeholder="请输入补正说明..."></textarea>
          </div>
        </div>

        <div class="mt-4 flex justify-end space-x-3">
          <button @click="showMaterialModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
          <button @click="saveMaterialStatus" class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showRemoveModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-2">确认移出批次</h3>
        <p class="text-sm text-gray-600 mb-4">
          确定要将 <span class="font-medium text-red-600">{{ removingTourist?.name }}</span> 移出当前批次吗？
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">移出原因</label>
          <textarea v-model="removeReason" class="w-full border rounded-lg p-3 text-sm" rows="2" placeholder="请输入移出原因..."></textarea>
        </div>

        <div class="mt-4 flex justify-end space-x-3">
          <button @click="showRemoveModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
          <button @click="confirmRemove" class="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">确认移出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TouristWithDetails, AuditLogEntry, MaterialWithStatus } from '~/types'

interface MaterialAuditLog {
  id: string
  type: 'MATERIAL'
  touristName: string
  materialType: string
  action: string
  notes: string | null
  createdAt: string
  user: { name: string }
}

interface BatchAuditLog {
  id: string
  type: 'BATCH'
  action: string
  notes: string | null
  createdAt: string
  user: { name: string }
}

type ActivityLog = MaterialAuditLog | BatchAuditLog

const route = useRoute()
const batch = ref<{
  id: number
  batchNo: string
  country: string
  status: string
  submitDate: string | null
  createdAt: string
  updatedAt: string
  createdBy: { name: string }
  reviewedBy?: { name: string } | null
  tourists: TouristWithDetails[]
  auditLogs: AuditLogEntry[]
  materialAudits: MaterialAuditLog[]
  allActivityLogs: ActivityLog[]
} | null>(null)

const error = ref('')
const success = ref('')
const showRejectModal = ref(false)
const rejectNotes = ref('')

const showMaterialModal = ref(false)
const editingTourist = ref<TouristWithDetails | null>(null)
const editingMaterial = ref<MaterialWithStatus | null>(null)
const materialEditForm = ref({
  status: '',
  notes: ''
})

const showRemoveModal = ref(false)
const removingTourist = ref<TouristWithDetails | null>(null)
const removeReason = ref('')

const passportExpiredAlert = computed(() => {
  if (!batch.value) return ''
  const expired = batch.value.tourists.filter(t => t.isPassportExpired)
  if (expired.length === 0) return ''
  return `以下游客护照已过期：${expired.map(t => t.name).join('、')}`
})

const completeCount = computed(() => {
  if (!batch.value) return 0
  return batch.value.tourists.filter(t => 
    t.materials.every(m => m.status === 'COMPLETE')
  ).length
})

const issueCount = computed(() => {
  if (!batch.value) return 0
  return batch.value.tourists.filter(t => 
    t.materials.some(m => m.status !== 'COMPLETE') || t.isPassportExpired
  ).length
})

const approvedCount = computed(() => {
  if (!batch.value) return 0
  return batch.value.tourists.filter(t => t.visaResult === 'APPROVED').length
})

const pendingResultCount = computed(() => {
  if (!batch.value) return 0
  return batch.value.tourists.filter(t => t.visaResult === 'PENDING').length
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

const getMaterialCardClass = (status: string) => {
  const classes: Record<string, string> = {
    COMPLETE: 'bg-green-50 border-green-200',
    PENDING: 'bg-gray-50 border-gray-200',
    REJECTED: 'bg-red-50 border-red-200',
    EXPIRED: 'bg-red-50 border-red-200',
    EXPIRING_SOON: 'bg-yellow-50 border-yellow-200'
  }
  return classes[status] || 'bg-gray-50 border-gray-200'
}

const getMaterialStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    COMPLETE: 'text-green-600',
    PENDING: 'text-gray-600',
    REJECTED: 'text-red-600',
    EXPIRED: 'text-red-600',
    EXPIRING_SOON: 'text-yellow-600'
  }
  return classes[status] || 'text-gray-600'
}

const getMaterialStatusText = (status: string) => {
  const texts: Record<string, string> = {
    COMPLETE: '齐全',
    PENDING: '待提交',
    REJECTED: '不合格',
    EXPIRED: '已过期',
    EXPIRING_SOON: '即将过期'
  }
  return texts[status] || status
}

const getVisaResultClass = (result: string) => {
  const classes: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  }
  return classes[result] || 'bg-gray-100 text-gray-800'
}

const getVisaResultText = (result: string) => {
  const texts: Record<string, string> = {
    PENDING: '出签结果待补',
    APPROVED: '已出签',
    REJECTED: '拒签'
  }
  return texts[result] || result
}

const getActionText = (action: string) => {
  const texts: Record<string, string> = {
    CREATE_BATCH: '创建批次',
    ADD_TOURIST: '添加游客',
    REMOVE_TOURIST: '移除游客',
    SUBMIT: '确认递签',
    REJECT: '退回补正',
    ARCHIVE: '归档',
    UPDATE_STATUS: '更新状态',
    UPDATE_VISA_RESULT: '更新出签结果',
    UPDATE_MATERIAL: '更新材料状态'
  }
  return texts[action] || action
}

const getLogDotColor = (type: string) => {
  const colors: Record<string, string> = {
    MATERIAL: 'bg-green-500',
    BATCH: 'bg-blue-500'
  }
  return colors[type] || 'bg-gray-500'
}

const getLogBadgeClass = (type: string) => {
  const classes: Record<string, string> = {
    MATERIAL: 'bg-green-100 text-green-800',
    BATCH: 'bg-blue-100 text-blue-800'
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const getLogTypeText = (type: string) => {
  const texts: Record<string, string> = {
    MATERIAL: '材料',
    BATCH: '批次'
  }
  return texts[type] || type
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date: string | Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const clearMessages = () => {
  error.value = ''
  success.value = ''
}

const showSuccess = (msg: string) => {
  success.value = msg
  setTimeout(() => { success.value = '' }, 3000)
}

const updateStatus = async (status: string) => {
  clearMessages()
  try {
    await $fetch(`/api/batches/${route.params.id}/status`, {
      method: 'POST',
      body: { status, notes: status === 'SUBMITTED' ? '确认递签' : status === 'ARCHIVED' ? '归档完成' : '' }
    })
    await fetchBatch()
    showSuccess('状态更新成功')
  } catch (e: any) {
    error.value = e.data?.message || '操作失败'
  }
}

const confirmReject = async () => {
  clearMessages()
  try {
    await $fetch(`/api/batches/${route.params.id}/status`, {
      method: 'POST',
      body: { status: 'REJECTED', notes: rejectNotes.value }
    })
    showRejectModal.value = false
    rejectNotes.value = ''
    await fetchBatch()
    showSuccess('退回补正成功')
  } catch (e: any) {
    error.value = e.data?.message || '操作失败'
  }
}

const updateVisaResult = async (touristId: number, result: string) => {
  clearMessages()
  try {
    await $fetch(`/api/batches/${route.params.id}/tourists/${touristId}`, {
      method: 'POST',
      body: { visaResult: result || null, userId: 1 }
    })
    await fetchBatch()
    showSuccess('出签结果更新成功')
  } catch (e: any) {
    error.value = e.data?.message || '更新失败'
  }
}

const openMaterialEdit = (tourist: TouristWithDetails, material: MaterialWithStatus) => {
  editingTourist.value = tourist
  editingMaterial.value = material
  materialEditForm.value = {
    status: material.status,
    notes: material.notes || ''
  }
  showMaterialModal.value = true
}

const saveMaterialStatus = async () => {
  if (!editingMaterial.value) return
  clearMessages()
  try {
    await $fetch(`/api/materials/${editingMaterial.value.id}`, {
      method: 'PATCH',
      body: {
        status: materialEditForm.value.status,
        notes: materialEditForm.value.notes,
        userId: 1
      }
    })
    showMaterialModal.value = false
    await fetchBatch()
    showSuccess('材料状态更新成功')
  } catch (e: any) {
    error.value = e.data?.message || '更新失败'
  }
}

const confirmRemoveTourist = (tourist: TouristWithDetails) => {
  removingTourist.value = tourist
  removeReason.value = '护照过期'
  showRemoveModal.value = true
}

const confirmRemove = async () => {
  if (!removingTourist.value) return
  clearMessages()
  try {
    await $fetch(`/api/batches/${route.params.id}/tourists/${removingTourist.value.id}`, {
      method: 'DELETE',
      body: {
        userId: 1,
        reason: removeReason.value
      }
    })
    showRemoveModal.value = false
    removingTourist.value = null
    removeReason.value = ''
    await fetchBatch()
    showSuccess('游客已移出批次')
  } catch (e: any) {
    error.value = e.data?.message || '操作失败'
  }
}

const fetchBatch = async () => {
  batch.value = await $fetch(`/api/batches/${route.params.id}`)
}

onMounted(fetchBatch)
</script>
