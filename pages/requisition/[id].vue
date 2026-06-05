<template>
  <div v-if="requisition" class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <button
          @click="navigateTo('/')"
          class="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </button>
        <h2 class="text-2xl font-bold text-gray-800">领用详情</h2>
        <span :class="getStatusClass(requisition.status)">
          {{ getStatusLabel(requisition.status) }}
        </span>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">基本信息</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm text-gray-500">领用单号</span>
          <p class="font-medium">{{ requisition.requisitionNo }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">申请时间</span>
          <p class="font-medium">{{ formatDate(requisition.createdAt) }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">申请科室</span>
          <p class="font-medium">{{ requisition.department.name }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">经办人</span>
          <p class="font-medium">{{ requisition.nurse.name }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">耗材信息</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm text-gray-500">耗材名称</span>
          <p class="font-medium">{{ requisition.supply.name }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">耗材编码</span>
          <p class="font-medium">{{ requisition.supply.code }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">规格型号</span>
          <p class="font-medium">{{ requisition.supply.spec }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">计量单位</span>
          <p class="font-medium">{{ requisition.supply.unit }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6" v-if="requisition.supplyBatch">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">批次与库存</h3>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <span class="text-sm text-gray-500">批次号</span>
          <p class="font-medium">{{ requisition.supplyBatch.batchNumber }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">库存数量</span>
          <p class="font-medium">{{ currentStock }} {{ requisition.supply.unit }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">有效期至</span>
          <p class="font-medium" :class="{ 'text-red-600': isBatchExpired }">
            {{ formatDate(requisition.supplyBatch.expiredAt) }}
            <span v-if="isBatchExpired" class="text-xs ml-2">(已过期)</span>
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">数量信息</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <span class="text-sm text-gray-500">申请数量</span>
          <p class="font-medium text-lg">{{ requisition.applyQuantity }} {{ requisition.supply.unit }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">实际出库数量</span>
          <p class="font-medium text-lg">{{ requisition.actualQuantity || '-' }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">出库与核销</h3>
      <div class="space-y-4">
        <div>
          <span class="text-sm text-gray-500">使用说明</span>
          <p class="mt-1">{{ requisition.usageDescription || '-' }}</p>
        </div>
        <div v-if="requisition.warehouseAdmin">
          <span class="text-sm text-gray-500">出库管理员</span>
          <p class="mt-1">{{ requisition.warehouseAdmin.name }}</p>
        </div>
        <div v-if="requisition.outboundBasis">
          <span class="text-sm text-gray-500">出库依据</span>
          <p class="mt-1">{{ requisition.outboundBasis }}</p>
        </div>
        <div v-if="requisition.reviewer">
          <span class="text-sm text-gray-500">核销人</span>
          <p class="mt-1">{{ requisition.reviewer.name }}</p>
        </div>
        <div v-if="requisition.reviewOpinion">
          <span class="text-sm text-gray-500">核销意见</span>
          <p class="mt-1">{{ requisition.reviewOpinion }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">历史节点</h3>
      <div class="space-y-4">
        <div
          v-for="(item, index) in requisition.history"
          :key="item.id"
          class="flex items-start"
        >
          <div class="flex flex-col items-center mr-4">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <div v-if="index < requisition.history.length - 1" class="w-0.5 h-12 bg-gray-200"></div>
          </div>
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span :class="getStatusClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
              <span class="text-sm text-gray-500">{{ item.operator.name }}</span>
              <span class="text-sm text-gray-400">{{ formatDate(item.createdAt) }}</span>
            </div>
            <p v-if="item.remark" class="mt-1 text-sm text-gray-600">{{ item.remark }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="inventoryCheck" class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">库存一致性校验</h3>
      <div
        v-for="item in inventoryCheck.details"
        :key="item.batchId"
        class="flex items-center justify-between py-2 border-b last:border-0"
      >
        <div>
          <span class="font-medium">{{ item.supplyName }}</span>
          <span class="text-sm text-gray-500 ml-2">({{ item.batchNumber }})</span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm">批次库存: {{ item.batchQuantity }}</span>
          <span class="text-sm">已出库: {{ item.outboundQuantity }}</span>
          <span :class="item.isConsistent ? 'text-green-600' : 'text-red-600'">
            {{ item.isConsistent ? '✓ 一致' : '✗ 不一致' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: requisition } = await useFetch(`/api/requisitions/${id}`)
const { data: inventoryCheck } = await useFetch('/api/inventory/verify')

const currentStock = ref(0)
const isBatchExpired = ref(false)

watch(requisition, (req) => {
  if (req?.supplyBatch) {
    currentStock.value = req.supplyBatch.quantity
    isBatchExpired.value = new Date(req.supplyBatch.expiredAt) < new Date()
  }
}, { immediate: true })

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: '待处理',
    APPROVED: '已批准',
    REJECTED: '已拒绝',
    OUTBOUND: '已出库',
    VERIFIED: '已核销',
    RETURNED: '已退回',
    CANCELLED: '已取消'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PENDING: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    APPROVED: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    REJECTED: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    OUTBOUND: 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800',
    VERIFIED: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    RETURNED: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
    CANCELLED: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
  }
  return classes[status] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}
</script>
