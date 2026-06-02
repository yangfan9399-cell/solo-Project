<template>
  <div class="flex items-center justify-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span v-if="text" class="ml-3 text-gray-500">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>
