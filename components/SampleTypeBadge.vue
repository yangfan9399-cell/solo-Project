<template>
  <span v-if="type" :class="badgeClass">
    {{ SAMPLE_TYPE_LABELS[type as keyof typeof SAMPLE_TYPE_LABELS] }}
  </span>
</template>

<script setup lang="ts">
import { SAMPLE_TYPE_LABELS } from '~/types'
import type { SampleType } from '~/types'

const props = defineProps<{
  type: SampleType | string | null
}>()

const badgeClass = computed(() => {
  const base = 'badge'
  switch (props.type) {
    case 'NORMAL_VERIFICATION':
      return `${base} bg-green-100 text-green-800`
    case 'MISSING_FIELDS':
      return `${base} bg-amber-100 text-amber-800`
    case 'ATTACHMENT_MISMATCH':
      return `${base} bg-red-100 text-red-800`
    case 'REPROCESS':
      return `${base} bg-orange-100 text-orange-800`
    default:
      return `${base} bg-gray-100 text-gray-800`
  }
})
</script>
