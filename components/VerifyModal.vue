<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">核销确认</h3>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">领用单号: {{ requisition.requisitionNo }}</p>
          <p class="text-sm text-gray-600">耗材: {{ requisition.supply.name }}</p>
          <p class="text-sm text-gray-600">申请科室: {{ requisition.department.name }}</p>
          <p class="text-sm text-gray-600">实际出库: {{ requisition.actualQuantity }} {{ requisition.supply.unit }}</p>
          <p class="text-sm text-gray-600">出库管理员: {{ requisition.warehouseAdmin?.name }}</p>
          <p v-if="!isSameDepartment" class="text-sm text-red-600 mt-2">
            ⚠️ 您不属于该科室，无法执行核销操作
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">核销意见</label>
          <textarea
            v-model="form.reviewOpinion"
            class="w-full border rounded-lg px-3 py-2"
            rows="3"
            placeholder="请输入核销意见"
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
          :disabled="loading || !isSameDepartment"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {{ loading ? '处理中...' : '确认核销' }}
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
  reviewOpinion: ''
})

const loading = ref(false)
const error = ref('')

const isSameDepartment = computed(() => {
  if (!currentUser.value) return false
  return currentUser.value.departmentId === props.requisition.departmentId
})

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    await $fetch(`/api/requisitions/${props.requisition.id}/verify`, {
      method: 'PUT',
      body: {
        reviewerId: currentUser.value?.id,
        reviewOpinion: form.value.reviewOpinion
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
