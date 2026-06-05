<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">确认出库</h3>
      </div>
      <div class="p-6 space-y-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <p class="text-sm text-gray-600">领用单号: {{ requisition.requisitionNo }}</p>
          <p class="text-sm text-gray-600">耗材: {{ requisition.supply.name }}</p>
          <p class="text-sm text-gray-600">申请数量: {{ requisition.applyQuantity }} {{ requisition.supply.unit }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">选择批次</label>
          <select
            v-model="form.supplyBatchId"
            class="w-full border rounded-lg px-3 py-2"
            @change="onBatchChange"
          >
            <option value="">请选择批次</option>
            <option
              v-for="batch in supplyBatches"
              :key="batch.id"
              :value="batch.id"
              :disabled="isBatchExpired(batch.expiredAt)"
            >
              {{ batch.batchNumber }} - 库存: {{ batch.quantity }} - 有效期: {{ formatDate(batch.expiredAt) }}
              <span v-if="isBatchExpired(batch.expiredAt)" class="text-red-500">(已过期)</span>
            </option>
          </select>
        </div>

        <div v-if="selectedBatch">
          <label class="block text-sm font-medium text-gray-700 mb-1">实际出库数量</label>
          <input
            v-model.number="form.actualQuantity"
            type="number"
            min="1"
            :max="selectedBatch.quantity"
            class="w-full border rounded-lg px-3 py-2"
          />
          <p v-if="selectedBatch.quantity < requisition.applyQuantity" class="text-xs text-orange-600 mt-1">
            库存不足，当前库存: {{ selectedBatch.quantity }}
          </p>
          <p v-if="isSelectedBatchExpired" class="text-xs text-red-600 mt-1">
            该批次已过期，请更换批次或撤回申请
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">出库依据</label>
          <textarea
            v-model="form.outboundBasis"
            class="w-full border rounded-lg px-3 py-2"
            rows="2"
            placeholder="请输入出库依据"
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
          :disabled="loading || isSelectedBatchExpired"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {{ loading ? '处理中...' : '确认出库' }}
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

const { data: supplies } = await useFetch('/api/supplies')

const form = ref({
  supplyBatchId: '',
  actualQuantity: 0,
  outboundBasis: ''
})

const selectedBatch = ref<any>(null)
const loading = ref(false)
const error = ref('')

const supplyBatches = computed(() => {
  const supply = (supplies.value as any[])?.find(s => s.id === props.requisition.supplyId)
  return supply?.batches || []
})

const isSelectedBatchExpired = computed(() => {
  if (!selectedBatch.value) return false
  return isBatchExpired(selectedBatch.value.expiredAt)
})

const onBatchChange = () => {
  selectedBatch.value = supplyBatches.value.find((b: any) => b.id === form.value.supplyBatchId)
  if (selectedBatch.value) {
    form.value.actualQuantity = Math.min(props.requisition.applyQuantity, selectedBatch.value.quantity)
  }
}

const isBatchExpired = (date: string | Date) => {
  return new Date(date) < new Date()
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleSubmit = async () => {
  if (!form.value.supplyBatchId || !form.value.actualQuantity) {
    error.value = '请选择批次并填写实际数量'
    return
  }

  if (isSelectedBatchExpired.value) {
    error.value = '该批次已过期，请更换批次'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch(`/api/requisitions/${props.requisition.id}/outbound`, {
      method: 'PUT',
      body: {
        warehouseAdminId: currentUser.value?.id,
        supplyBatchId: form.value.supplyBatchId,
        actualQuantity: form.value.actualQuantity,
        outboundBasis: form.value.outboundBasis
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
