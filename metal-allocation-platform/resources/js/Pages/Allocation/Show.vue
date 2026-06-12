<script setup>
import MainLayout from '@/Layouts/MainLayout.vue'
import { Link } from '@inertiajs/vue3'

defineOptions({ layout: MainLayout })

const props = defineProps({
  allocation: Object,
  auth: Object,
})

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

function formatAmount(val) {
  if (val === null || val === undefined) return '-'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateTime(dt) {
  if (!dt) return '-'
  return dt
}

const roleMap = {
  business_specialist: '业务专员',
  approval_manager: '审批负责人',
}

function roleLabel(role) {
  return roleMap[role] || role || ''
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

const unitMap = {
  g: '克',
  kg: '千克',
  oz: '盎司',
}

function unitLabel(unit) {
  return unitMap[unit] || unit
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-3">
        <Link href="/allocations" class="text-indigo-600 hover:text-indigo-800 text-sm">&larr; 返回列表</Link>
        <h1 class="text-2xl font-bold text-gray-900">调拨详情 {{ allocation.allocation_no }}</h1>
        <span class="status-badge" :class="statusBadge(allocation.status).class">{{ statusBadge(allocation.status).label }}</span>
      </div>
      <Link v-if="allocation.status !== 'archived'" :href="`/allocations/${allocation.id}/process`" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">进入处理台</Link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">基本信息</h2>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3">
          <dt class="text-sm text-gray-500">调拨编号</dt>
          <dd class="text-sm font-medium text-gray-900">{{ allocation.allocation_no }}</dd>
          <dt class="text-sm text-gray-500">来源库房</dt>
          <dd class="text-sm text-gray-900">{{ allocation.source_vault }}</dd>
          <dt class="text-sm text-gray-500">目标库房</dt>
          <dd class="text-sm text-gray-900">{{ allocation.target_vault }}</dd>
          <dt class="text-sm text-gray-500">贵金属类型</dt>
          <dd class="text-sm text-gray-900">{{ metalTypeLabel(allocation.metal_type) }}</dd>
          <dt class="text-sm text-gray-500">数量</dt>
          <dd class="text-sm text-gray-900">{{ allocation.quantity }}</dd>
          <dt class="text-sm text-gray-500">金额</dt>
          <dd class="text-sm text-gray-900">{{ formatAmount(allocation.amount) }}</dd>
          <dt class="text-sm text-gray-500">状态</dt>
          <dd><span class="status-badge" :class="statusBadge(allocation.status).class">{{ statusBadge(allocation.status).label }}</span></dd>
        </dl>
      </div>

      <div>
        <div class="card mb-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">当前责任人</h2>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
              {{ allocation.current_handler?.name?.charAt(0) || '?' }}
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">{{ allocation.current_handler?.name || '未分配' }}</div>
              <div class="text-xs text-gray-500">{{ allocation.current_handler?.role ? roleLabel(allocation.current_handler.role) : '-' }}</div>
            </div>
          </div>
        </div>

        <div v-if="allocation.conclusion" class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">结论信息</h2>
          <p class="text-sm text-gray-700">{{ allocation.conclusion }}</p>
        </div>
      </div>
    </div>

    <div v-if="allocation.status === 'blocked' || allocation.status === 'appealed'" class="card mb-6 border-l-4 border-red-500">
      <h2 class="text-lg font-semibold text-red-800 mb-4">阻断信息</h2>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3">
        <dt class="text-sm text-gray-500">阻断原因</dt>
        <dd class="text-sm text-red-700 font-medium">{{ allocation.blocking_reason || '-' }}</dd>
        <dt class="text-sm text-gray-500">补救路径</dt>
        <dd class="text-sm text-gray-900">{{ allocation.remediation_path || '-' }}</dd>
      </dl>
    </div>

    <div v-if="allocation.differences && allocation.differences.length > 0" class="card mb-6 border-l-4 border-orange-500">
      <h2 class="text-lg font-semibold text-orange-800 mb-4">差异信息</h2>
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">差异字段</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">预期值</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">实际值</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">差异</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(diff, idx) in allocation.differences" :key="idx">
            <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ diff.field_name }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ diff.expected_value }}</td>
            <td class="px-4 py-2 text-sm text-gray-700">{{ diff.actual_value }}</td>
            <td class="px-4 py-2 text-sm text-red-600 font-medium">{{ diff.diff_description || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card mb-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">历史节点</h2>
      <div class="flow-root">
        <ul class="-mb-8">
          <li v-for="(node, idx) in allocation.nodes" :key="idx">
            <div class="relative pb-8">
              <span v-if="idx !== allocation.nodes.length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
              <div class="relative flex space-x-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ring-8 ring-white" :class="nodeTypeBadge(node.node_type).class">
                  <span class="text-xs font-bold">{{ nodeTypeBadge(node.node_type).label.charAt(0) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <span class="status-badge text-xs" :class="nodeTypeBadge(node.node_type).class">{{ nodeTypeBadge(node.node_type).label }}</span>
                    <span class="text-sm font-medium text-gray-900">{{ node.handler?.name || '系统' }}</span>
                    <span class="text-xs text-gray-500">{{ node.handler?.role ? roleLabel(node.handler.role) : '' }}</span>
                  </div>
                  <div class="mt-1 text-sm text-gray-700">{{ node.description || '-' }}</div>
                  <div class="mt-1 text-xs text-gray-400">{{ formatDateTime(node.created_at) }}</div>

                  <div v-if="node.before_data || node.after_data" class="mt-3 bg-gray-50 rounded p-3 text-xs">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <span class="font-medium text-gray-500">变更前:</span>
                        <pre class="mt-1 text-gray-600 whitespace-pre-wrap">{{ JSON.stringify(node.before_data, null, 2) }}</pre>
                      </div>
                      <div>
                        <span class="font-medium text-gray-500">变更后:</span>
                        <pre class="mt-1 text-gray-600 whitespace-pre-wrap">{{ JSON.stringify(node.after_data, null, 2) }}</pre>
                      </div>
                    </div>
                  </div>

                  <div v-if="node.differences && node.differences.length > 0" class="mt-3">
                    <div v-for="(diff, di) in node.differences" :key="di" class="bg-orange-50 border border-orange-200 rounded p-2 mb-2 text-xs">
                      <span class="font-medium text-orange-700">{{ diff.field_name }}:</span>
                      <span class="text-gray-600"> 预期 {{ diff.expected_value }} → 实际 {{ diff.actual_value }}</span>
                    </div>
                  </div>

                  <div v-if="node.attachments && node.attachments.length > 0" class="mt-3 flex flex-wrap gap-2">
                    <span v-for="(att, ai) in node.attachments" :key="ai" class="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-indigo-600">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                      {{ att.file_name || '附件' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div v-if="!allocation.nodes || allocation.nodes.length === 0" class="text-center text-gray-500 py-4">暂无历史记录</div>
    </div>

    <div v-if="allocation.attachments && allocation.attachments.length > 0" class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">附件列表</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="(att, idx) in allocation.attachments" :key="idx" class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <svg class="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <div class="min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">{{ att.file_name || '附件' }}</div>
            <div v-if="att.description" class="text-xs text-gray-500 truncate">{{ att.description }}</div>
            <div v-if="att.uploader" class="text-xs text-gray-400">上传者: {{ att.uploader?.name || '-' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
