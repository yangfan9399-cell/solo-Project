<template>
  <span :class="['badge', NODE_TYPE_COLORS[type]]">
    {{ NODE_TYPE_LABELS[type] }}
  </span>
</template>

<script setup lang="ts">
import { NODE_TYPE_LABELS, NODE_TYPE_COLORS, NodeType } from '~/types'

defineProps<{
  type: NodeType
}>()
</script>
