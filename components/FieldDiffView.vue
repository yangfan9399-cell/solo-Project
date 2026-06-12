<template>
  <div class="space-y-2">
    <div
      v-for="(diff, index) in diffs"
      :key="index"
      class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm"
    >
      <span class="shrink-0 badge" :class="diffTypeClass(diff.diffType)">
        {{ diff.fieldLabel }}
      </span>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 text-gray-500">
          <span class="line-through text-gray-400">{{ formatValue(diff.oldValue) }}</span>
          <span class="text-gray-400">→</span>
          <span class="font-medium text-gray-900">{{ formatValue(diff.newValue) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FieldDiffData } from '~/types'
import dayjs from 'dayjs'

const props = defineProps<{
  diffs: FieldDiffData[]
}>()

const formatValue = (val: string) => {
  if (!val) return '-'
  if (val.includes('T') && val.length > 10) {
    return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
  }
  return val
}

const diffTypeClass = (type: string) => {
  switch (type) {
    case 'time':
      return 'bg-blue-100 text-blue-800'
    case 'object':
      return 'bg-purple-100 text-purple-800'
    case 'amount':
      return 'bg-amber-100 text-amber-800'
    case 'conclusion':
      return 'bg-green-100 text-green-800'
    case 'attachment':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>
