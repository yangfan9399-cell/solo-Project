<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">新建领用申请</h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">耗材</label>
          <select
            v-model="form.supplyId"
            class="w-full border rounded-lg px-3 py-2"
            @change="onSupplyChange"
          >
            <option value="">请选择耗材</option>
            <option v-for="supply in supplies" :key="supply.id" :value="supply.id">
              {{ supply.name }} ({{ supply.code }})
            </option>
          </select>
        </div>

        <div v-if="selectedSupply">
          <label class="block text-sm font-medium text-gray-700 mb-1">批次</label>
          <select
            v-model="form.supplyBatchId"
            class="w-full border rounded-lg px-3 py-2"
          >
            <option value="">请选择批次</option>
            <option
              v-for="batch in validBatches"
              :key="batch.id"
              :value="batch.id"
            >
              {{ batch.batchNumber }} - 库存: {{ batch.quantity }} - 有效期: {{ formatDate(batch.expiredAt) }}
              <span v-if="isBatchExpired(batch.expiredAt)" class="text-red-500">(已过期)</span>
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">申请数量</label>
          <input
            v-model.number="form.applyQuantity"
            type="number"
            min="1"
            class="w-full border rounded-lg px-3 py-2"
            placeholder="请输入申请数量"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">使用说明</label>
          <textarea
            v-model="form.usageDescription"
            class="w-full border rounded-lg px-3 py-2"
            rows="3"
            placeholder="请输入使用说明"
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
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? '提交中...' : '提交申请' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const currentUser = inject<Ref<any>>('currentUser', ref(null))

const emit = defineEmits(['close', 'created'])

const { data: supplies } = await useFetch('/api/supplies')
const { data: departments } = await useFetch('/api/departments')

const form = ref({
  supplyId: '',
  supplyBatchId: '',
  applyQuantity: 1,
  usageDescription: ''
})

const selectedSupply = ref<any>(null)
const loading = ref(false)
const error = ref('')

const onSupplyChange = () => {
  selectedSupply.value = (supplies.value as any[])?.find(s => s.id === form.value.supplyId)
  form.value.supplyBatchId = ''
}

const validBatches = computed(() => {
  return selectedSupply.value?.batches || []
})

const isBatchExpired = (date: string | Date) => {
  return new Date(date) < new Date()
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const handleSubmit = async () => {
  if (!form.value.supplyId || !form.value.applyQuantity) {
    error.value = '请填写必填字段'
    return
  }

  if (!currentUser.value) {
    error.value = '未获取到当前用户信息'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/requisitions', {
      method: 'POST',
      body: {
        supplyId: form.value.supplyId,
        supplyBatchId: form.value.supplyBatchId || undefined,
        departmentId: currentUser.value.departmentId,
        nurseId: currentUser.value.id,
        applyQuantity: form.value.applyQuantity,
        usageDescription: form.value.usageDescription
      }
    })
    emit('created')
    emit('close')
  } catch (e: any) {
    error.value = e.data?.message || '提交失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>
