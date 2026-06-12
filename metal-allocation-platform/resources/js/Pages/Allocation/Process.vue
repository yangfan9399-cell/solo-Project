<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link, router, useForm, usePage } from '@inertiajs/vue3'
import { ref, computed } from 'vue'

defineOptions({ layout: MainLayout })

const page = usePage()

const props = defineProps({
  allocation: Object,
})

const isBusinessSpecialist = computed(() => page.props.auth?.user?.role === 'business_specialist')
const isReviewManager = computed(() => page.props.auth?.user?.role === 'approval_manager')

const processForm = useForm({
  description: '',
  basis: '',
  quantity: props.allocation.quantity || '',
  amount: props.allocation.amount || '',
})

const onsiteForm = useForm({
  description: '',
})

const attachmentForm = useForm({
  file: null,
  description: '',
})

const conclusionForm = useForm({
  conclusion: '',
})

const returnForm = useForm({
  reason: '',
  remediation_path: '',
})

const appealForm = useForm({
  reason: '',
})

const appealResolveForm = useForm({
  action: 'resolved',
  description: '',
})

const showReturnForm = ref(false)
const fileInput = ref(null)

const statusMap = {
  pending: { label: '待处理', class: 'bg-yellow-100 text-yellow-800' },
  processing: { label: '处理中', class: 'bg-blue-100 text-blue-800' },
  reviewing: { label: '复核中', class: 'bg-purple-100 text-purple-800' },
  archived: { label: '已归档', class: 'bg-green-100 text-green-800' },
  blocked: { label: '已阻断', class: 'bg-red-100 text-red-800' },
  appealed: { label: '申诉中', class: 'bg-orange-100 text-orange-800' },
}

const nodeTypeMap = {
  created: { label: '创建', class: 'bg-gray-100 text-gray-800' },
  submitted: { label: '提交', class: 'bg-blue-100 text-blue-800' },
  processed: { label: '处理完成', class: 'bg-green-100 text-green-800' },
  reviewed: { label: '复核', class: 'bg-purple-100 text-purple-800' },
  archived: { label: '归档', class: 'bg-green-100 text-green-800' },
  blocked: { label: '阻断', class: 'bg-red-100 text-red-800' },
  appealed: { label: '申诉', class: 'bg-orange-100 text-orange-800' },
  appeal_resolved: { label: '申诉处理', class: 'bg-indigo-100 text-indigo-800' },
  returned: { label: '退回', class: 'bg-yellow-100 text-yellow-800' },
}

function statusBadge(status) {
  return statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' }
}

function nodeTypeBadge(type) {
  return nodeTypeMap[type] || { label: type, class: 'bg-gray-100 text-gray-800' }
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

function formatAmount(val) {
  if (val === null || val === undefined) return '-'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function submitAccept() {
  router.post(`/allocations/${props.allocation.id}/accept`, {})
}

function submitProcess() {
  processForm.post(`/allocations/${props.allocation.id}/complete-process`, {
    onSuccess: () => processForm.reset(),
  })
}

function submitOnsite() {
  onsiteForm.post(`/allocations/${props.allocation.id}/notes`, {
    onSuccess: () => onsiteForm.reset(),
  })
}

function submitAttachment() {
  if (!attachmentForm.file) return
  attachmentForm.post(`/allocations/${props.allocation.id}/attachments`, {
    onSuccess: () => {
      attachmentForm.reset()
      if (fileInput.value) fileInput.value.value = ''
    },
  })
}

function onFileChange(e) {
  attachmentForm.file = e.target.files[0]
}

function submitArchive() {
  conclusionForm.post(`/allocations/${props.allocation.id}/confirm`, {
    onSuccess: () => conclusionForm.reset(),
  })
}

function submitReturn() {
  returnForm.post(`/allocations/${props.allocation.id}/return`, {
    onSuccess: () => {
      returnForm.reset()
      showReturnForm.value = false
    },
  })
}

function submitReadonlyArchive() {
  router.post(`/allocations/${props.allocation.id}/archive-readonly`, {})
}

function submitAppeal() {
  appealForm.post(`/allocations/${props.allocation.id}/appeal`, {
    onSuccess: () => appealForm.reset(),
  })
}

function submitAppealResolve(approved) {
  appealResolveForm.action = approved ? 'resolved' : 'rejected'
  appealResolveForm.post(`/allocations/${props.allocation.id}/handle-appeal`, {
    onSuccess: () => appealResolveForm.reset(),
  })
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-3">
        <Link :href="`/allocations/${allocation.id}`" class="text-indigo-600 hover:text-indigo-800 text-sm">&larr; 返回详情</Link>
        <h1 class="text-2xl font-bold text-gray-900">处理台 {{ allocation.allocation_no }}</h1>
        <span class="status-badge" :class="statusBadge(allocation.status).class">{{ statusBadge(allocation.status).label }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div v-if="isBusinessSpecialist && (allocation.status === 'processing' || allocation.status === 'pending')" class="card border-l-4 border-blue-500">
          <h2 class="text-lg font-semibold text-blue-800 mb-4">业务专员操作区</h2>

          <div v-if="allocation.status === 'pending'" class="mb-4">
            <button @click="submitAccept" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">受理</button>
          </div>

          <div v-if="allocation.status === 'processing'" class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">补充业务记录</h3>
            <div class="space-y-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">描述</label>
                <textarea v-model="processForm.description" rows="3" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="请输入业务处理描述..."></textarea>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">依据</label>
                <input v-model="processForm.basis" type="text" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="处理依据..." />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">数量修正</label>
                  <input v-model="processForm.quantity" type="number" step="0.01" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">金额修正</label>
                  <input v-model="processForm.amount" type="number" step="0.01" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                </div>
              </div>
              <button @click="submitProcess" :disabled="processForm.processing" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">提交处理完成</button>
            </div>
          </div>

          <div v-if="allocation.status === 'processing'" class="border-t pt-4 mb-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">添加现场说明</h3>
            <div class="flex space-x-2">
              <input v-model="onsiteForm.description" type="text" class="flex-1 border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="现场说明..." />
              <button @click="submitOnsite" :disabled="onsiteForm.processing" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm disabled:opacity-50">添加</button>
            </div>
          </div>

          <div v-if="allocation.status === 'processing'" class="border-t pt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">上传证据附件</h3>
            <div class="space-y-2">
              <input ref="fileInput" @change="onFileChange" type="file" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              <input v-model="attachmentForm.description" type="text" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="附件描述..." />
              <button @click="submitAttachment" :disabled="attachmentForm.processing || !attachmentForm.file" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-50">上传附件</button>
            </div>
          </div>
        </div>

        <div v-if="isReviewManager && (allocation.status === 'reviewing' || allocation.status === 'appealed')" class="card border-l-4 border-purple-500">
          <h2 class="text-lg font-semibold text-purple-800 mb-4">审批负责人操作区</h2>

          <div class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">确认结论</h3>
            <div class="space-y-3">
              <textarea v-model="conclusionForm.conclusion" rows="3" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="请输入审批结论..."></textarea>
              <div class="flex space-x-2">
                <button @click="submitArchive" :disabled="conclusionForm.processing" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50">确认归档</button>
                <button @click="showReturnForm = !showReturnForm" class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm">退回补证</button>
                <button @click="submitReadonlyArchive" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">只读归档</button>
              </div>
            </div>
          </div>

          <div v-if="showReturnForm" class="border-t pt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">退回原因</h3>
            <div class="space-y-2">
              <textarea v-model="returnForm.reason" rows="2" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="请说明退回原因..."></textarea>
              <input v-model="returnForm.remediation_path" type="text" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="补救路径（选填）..." />
              <button @click="submitReturn" :disabled="returnForm.processing" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50">确认退回</button>
            </div>
          </div>
        </div>

        <div v-if="allocation.status === 'reviewing'" class="card border-l-4 border-orange-500">
          <h2 class="text-lg font-semibold text-orange-800 mb-4">申诉区域</h2>

          <div v-if="isBusinessSpecialist" class="mb-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">提交申诉</h3>
            <div class="space-y-2">
              <textarea v-model="appealForm.reason" rows="2" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="请说明申诉理由..."></textarea>
              <button @click="submitAppeal" :disabled="appealForm.processing" class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm disabled:opacity-50">提交申诉</button>
            </div>
          </div>

          <div v-if="isReviewManager" class="border-t pt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">处理申诉</h3>
            <div class="space-y-2">
              <textarea v-model="appealResolveForm.description" rows="2" class="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" placeholder="申诉处理意见..."></textarea>
              <div class="flex space-x-2">
                <button @click="submitAppealResolve(true)" :disabled="appealResolveForm.processing" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50">申诉通过</button>
                <button @click="submitAppealResolve(false)" :disabled="appealResolveForm.processing" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50">申诉驳回</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">基本信息摘要</h2>
          <dl class="space-y-2">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">调拨编号</dt>
              <dd class="text-sm font-medium text-gray-900">{{ allocation.allocation_no }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">来源库房</dt>
              <dd class="text-sm text-gray-900">{{ allocation.source_vault }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">目标库房</dt>
              <dd class="text-sm text-gray-900">{{ allocation.target_vault }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">贵金属类型</dt>
              <dd class="text-sm text-gray-900">{{ metalTypeLabel(allocation.metal_type) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">数量</dt>
              <dd class="text-sm text-gray-900">{{ allocation.quantity }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">金额</dt>
              <dd class="text-sm text-gray-900">{{ formatAmount(allocation.amount) }}</dd>
            </div>
            <div class="flex justify-between items-center">
              <dt class="text-sm text-gray-500">当前状态</dt>
              <dd><span class="status-badge" :class="statusBadge(allocation.status).class">{{ statusBadge(allocation.status).label }}</span></dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">当前责任人</dt>
              <dd class="text-sm text-gray-900">{{ allocation.current_handler?.name || '未分配' }}</dd>
            </div>
          </dl>
        </div>

        <div v-if="allocation.status === 'blocked' || allocation.status === 'appealed'" class="card border-l-4 border-red-400">
          <h2 class="text-sm font-semibold text-red-800 mb-2">阻断信息</h2>
          <p class="text-sm text-gray-700"><span class="font-medium">原因：</span>{{ allocation.blocking_reason || '-' }}</p>
          <p class="text-sm text-gray-700 mt-1"><span class="font-medium">补救路径：</span>{{ allocation.remediation_path || '-' }}</p>
        </div>

        <div v-if="allocation.differences && allocation.differences.length > 0" class="card border-l-4 border-orange-400">
          <h2 class="text-sm font-semibold text-orange-800 mb-2">差异信息</h2>
          <div v-for="(diff, idx) in allocation.differences" :key="idx" class="text-sm mb-2">
            <span class="font-medium text-gray-700">{{ diff.field_name }}:</span>
            <span class="text-gray-600"> 预期 {{ diff.expected_value }} → 实际 {{ diff.actual_value }}</span>
          </div>
        </div>

        <div class="card">
          <h2 class="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">历史节点</h2>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div v-for="(node, idx) in allocation.nodes" :key="idx" class="flex items-start space-x-2">
              <span class="status-badge text-xs flex-shrink-0 mt-0.5" :class="nodeTypeBadge(node.node_type).class">{{ nodeTypeBadge(node.node_type).label }}</span>
              <div class="min-w-0">
                <div class="text-xs text-gray-900">{{ node.handler?.name || '系统' }} - {{ node.description || '-' }}</div>
                <div class="text-xs text-gray-400">{{ node.created_at }}</div>
              </div>
            </div>
            <div v-if="!allocation.nodes || allocation.nodes.length === 0" class="text-xs text-gray-500">暂无历史记录</div>
          </div>
        </div>

        <div v-if="allocation.attachments && allocation.attachments.length > 0" class="card">
          <h2 class="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">附件列表</h2>
          <div class="space-y-2">
            <div v-for="(att, idx) in allocation.attachments" :key="idx" class="flex items-center text-xs text-indigo-600">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
              {{ att.file_name || '附件' }}
              <span v-if="att.uploader" class="text-gray-400 ml-1">({{ att.uploader?.name || '-' }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
