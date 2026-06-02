<template>
  <div class="text-center py-12">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
      <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    </div>
    <h3 class="text-lg font-medium text-gray-900 mb-1">出错了</h3>
    <p class="text-gray-500 mb-4">{{ message }}</p>
    <button @click="$emit('retry')" class="btn btn-primary">
      重试
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()

defineEmits<{
  retry: []
}>()
</script>
