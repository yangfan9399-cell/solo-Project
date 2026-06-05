<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">补货</h3>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">领用单号: {{ requisition.requisitionNo }}</p>
          <p class="text-sm text-gray-600">耗材: {{ requisition.supply.name }}</p>
          <p class="text-sm text-gray-600">申请数量: {{ requisition.applyQuantity }} {{ requisition.supply.unit }}</p>
          <p v-if="requisition.supplyBatch" class="text-sm text-orange-600">
            当前库存: {{ requisition.supplyBatch.quantity }} {{ requisition.supply.unit }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">补货数量</label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="请输入补货数量"
          />
          <p v-if="requisition.supplyBatch" class="text-xs text-gray-500 mt-1">
            补货后库存: {{ (requisition.supplyBatch?.quantity || 0) + form.quantity }} {{ requisition.supply.unit }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            v-model="form.remark"
            class="w-full border rounded-lg px-3 py-2"
            rows="2"
            placeholder="请输入备注"
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
          class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {{ loading ? '处理中...' : '确认补货' }}
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
  quantity: 10,
  remark: ''
})

const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!form.value.quantity) {
    error.value = '请填写补货数量'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch(`/api/requisitions/${props.requisition.id}/restock`, {
      method: 'PUT',
      body: {
        warehouseAdminId: currentUser.value?.id,
        quantity: form.value.quantity,
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
