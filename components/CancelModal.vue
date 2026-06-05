<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">撤回申请</h3>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">领用单号: {{ requisition.requisitionNo }}</p>
          <p class="text-sm text-gray-600">耗材: {{ requisition.supply.name }}</p>
          <p class="text-sm text-gray-600">申请数量: {{ requisition.applyQuantity }} {{ requisition.supply.unit }}</p>
          <p v-if="isBatchExpired" class="text-sm text-red-600 mt-2">
            ⚠️ 该批次已过期，建议撤回后更换批次
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">撤回原因</label>
          <textarea
            v-model="form.remark"
            class="w-full border rounded-lg px-3 py-2"
            rows="2"
            placeholder="请输入撤回原因"
          ></textarea>
        </div>

        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
      </div>
      <div class="p-6 border-t flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {{ loading ? '处理中...' : '确认撤回' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  requisition: any
}>()

const currentUser = inject<Ref<any>>('currentUser', ref(null))
const emit = defineEmits(['close', 'updated'])

const form = ref({
  remark: ''
})

const loading = ref(false)
const error = ref('')

const isBatchExpired = computed(() => {
  if (!props.requisition.supplyBatch?.expiredAt) return false
  return new Date(props.requisition.supplyBatch.expiredAt) < new Date()
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    await $fetch(`/api/requisitions/${props.requisition.id}/cancel`, {
      method: 'PUT',
      body: {
        operatorId: currentUser.value?.id,
        remark: form.value.remark
      }
    })
    emit('updated')
    emit('close')
  } catch (e: any) {
    error.value = e.data?.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
