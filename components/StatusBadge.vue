<template>
  <span :class="['badge', STATUS_COLORS[status as keyof typeof STATUS_COLORS]]">
    {{ STATUS_LABELS[status as keyof typeof STATUS_LABELS] }}
  </span>
</template>

<script setup lang="ts">
import { STATUS_LABELS, STATUS_COLORS, RecordStatus } from '~/types'

defineProps<{
  status: RecordStatus | string
}>()
</script>
