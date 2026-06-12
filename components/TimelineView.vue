<template>
  <div class="relative">
    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
    <div class="space-y-6">
      <div
        v-for="(node, index) in nodes"
        :key="node.id"
        class="relative pl-10"
      >
        <div
          class="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow"
          :class="nodeDotClass(node.nodeType)"
        >
          {{ index + 1 }}
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <NodeBadge :type="node.nodeType" />
              <span class="text-sm text-gray-500">
                {{ node.operatorName }}
              </span>
            </div>
            <span class="text-xs text-gray-400">
              {{ formatTime(node.createdAt) }}
            </span>
          </div>

          <p v-if="node.remark" class="text-gray-700 mb-3">{{ node.remark }}</p>

          <div v-if="node.blockReason" class="mb-3">
            <div class="text-sm font-medium text-red-700 mb-1">阻断原因：</div>
            <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg whitespace-pre-line">
              {{ node.blockReason }}
            </div>
          </div>

          <div v-if="node.remedyPath" class="mb-3">
            <div class="text-sm font-medium text-amber-700 mb-1">补救路径：</div>
            <div class="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg whitespace-pre-line">
              {{ node.remedyPath }}
            </div>
          </div>

          <div v-if="node.fieldDiffs && node.fieldDiffs.length > 0" class="mb-3">
            <div class="text-sm font-medium text-gray-700 mb-2">字段变更：</div>
            <FieldDiffView :diffs="node.fieldDiffs" />
          </div>

          <div v-if="node.attachments && node.attachments.length > 0">
            <div class="text-sm font-medium text-gray-700 mb-2">附件：</div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="att in node.attachments"
                :key="att.url"
                class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
              >
                <span class="text-gray-600">{{ att.name }}</span>
                <span class="text-xs text-gray-400">{{ att.version }}</span>
                <span class="text-xs text-gray-400">{{ formatSize(att.size) }}</span>
              </div>
            </div>
          </div>

          <div v-if="index === 0" class="mt-3 pt-3 border-t border-gray-100">
            <div class="text-xs text-gray-500 mb-1">受理快照：</div>
            <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
              <pre class="whitespace-pre-wrap">{{ JSON.stringify(node.afterSnapshot, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { RecordNodeData, NodeType } from '~/types'

defineProps<{
  nodes: RecordNodeData[]
}>()

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss')

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

const nodeDotClass = (type: NodeType) => {
  switch (type) {
    case 'ACCEPT':
      return 'bg-gray-500 text-white'
    case 'PROCESS':
      return 'bg-blue-500 text-white'
    case 'SUPPLEMENT':
      return 'bg-cyan-500 text-white'
    case 'REVIEW':
      return 'bg-purple-500 text-white'
    case 'ARCHIVE':
      return 'bg-green-500 text-white'
    case 'REJECT':
      return 'bg-red-500 text-white'
    case 'REOPEN':
      return 'bg-orange-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}
</script>
