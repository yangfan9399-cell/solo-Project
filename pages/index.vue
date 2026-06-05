<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">领用记录列表</h2>
      <button
        v-if="currentRole === 'NURSE'"
        @click="showCreateModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        新建申请
      </button>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">领用单号</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">耗材名称</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请科室</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请数量</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">实际数量</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存数量</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="req in requisitions" :key="req.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
              {{ req.requisitionNo }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ req.supply.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ req.department.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ req.applyQuantity }} {{ req.supply.unit }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ req.actualQuantity || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <div class="flex flex-col">
                <span :class="getStockClass(req)">
                  {{ req.supplyBatch?.quantity || '-' }}
                </span>
                <span v-if="isBatchExpired(req.supplyBatch?.expiredAt)" class="text-xs text-red-500">已过期</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(req.status)">
                {{ getStatusLabel(req.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                @click="navigateTo(`/requisition/${req.id}`)"
                class="text-blue-600 hover:text-blue-800 mr-3"
              >
                详情
              </button>
              <template v-if="currentRole === 'WAREHOUSE_ADMIN' && req.status === 'PENDING'">
                <button
                  @click="handleOutbound(req)"
                  :disabled="isBatchExpired(req.supplyBatch?.expiredAt)"
                  class="text-green-600 hover:text-green-800 mr-2 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  出库
                </button>
                <button
                  @click="handleRestock(req)"
                  class="text-orange-600 hover:text-orange-800"
                >
                  补货
                </button>
                <span v-if="isBatchExpired(req.supplyBatch?.expiredAt)" class="text-xs text-red-500 ml-2 block">批次已过期</span>
              </template>
              <template v-if="req.status === 'PENDING' && (isBatchExpired(req.supplyBatch?.expiredAt) || currentRole === 'NURSE')">
                <button
                  v-if="canCancel(req)"
                  @click="handleCancel(req)"
                  class="text-gray-600 hover:text-gray-800 ml-2"
                >
                  撤回
                </button>
              </template>
              <template v-if="currentRole === 'DEPARTMENT_REVIEWER'">
                <template v-if="req.status === 'OUTBOUND'">
                  <template v-if="isSameDepartment(req)">
                    <button
                      @click="handleVerify(req)"
                      class="text-green-600 hover:text-green-800 mr-2"
                    >
                      核销
                    </button>
                    <button
                      @click="handleReturn(req)"
                      class="text-red-600 hover:text-red-800"
                    >
                      退回
                    </button>
                  </template>
                  <span v-else class="text-xs text-gray-400" title="仅同科室复核人可操作">非本科室</span>
                </template>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CreateRequisitionModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="fetchRequisitions"
    />

    <OutboundModal
      v-if="showOutboundModal"
      :requisition="selectedRequisition"
      @close="showOutboundModal = false"
      @updated="fetchRequisitions"
    />

    <RestockModal
      v-if="showRestockModal"
      :requisition="selectedRequisition"
      @close="showRestockModal = false"
      @updated="fetchRequisitions"
    />

    <VerifyModal
      v-if="showVerifyModal"
      :requisition="selectedRequisition"
      @close="showVerifyModal = false"
      @updated="fetchRequisitions"
    />

    <ReturnModal
      v-if="showReturnModal"
      :requisition="selectedRequisition"
      @close="showReturnModal = false"
      @updated="fetchRequisitions"
    />

    <CancelModal
      v-if="showCancelModal"
      :requisition="selectedRequisition"
      @close="showCancelModal = false"
      @updated="fetchRequisitions"
    />
  </div>
</template>

<script setup lang="ts">
const currentRole = inject<Ref<string>>('currentRole', ref(''))
const currentUser = inject<Ref<any>>('currentUser', ref(null))

const { data: requisitions, refresh: fetchRequisitions } = await useFetch('/api/requisitions')

const showCreateModal = ref(false)
const showOutboundModal = ref(false)
const showRestockModal = ref(false)
const showVerifyModal = ref(false)
const showReturnModal = ref(false)
const showCancelModal = ref(false)
const selectedRequisition = ref<any>(null)

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

const getStockClass = (req: any) => {
  if (!req.supplyBatch) return 'text-gray-500'
  if (req.supplyBatch.quantity < req.applyQuantity) return 'text-red-600 font-medium'
  return 'text-gray-500'
}

const handleOutbound = (req: any) => {
  selectedRequisition.value = req
  showOutboundModal.value = true
}

const handleRestock = (req: any) => {
  selectedRequisition.value = req
  showRestockModal.value = true
}

const handleVerify = (req: any) => {
  selectedRequisition.value = req
  showVerifyModal.value = true
}

const handleReturn = (req: any) => {
  selectedRequisition.value = req
  showReturnModal.value = true
}

const handleCancel = (req: any) => {
  selectedRequisition.value = req
  showCancelModal.value = true
}

const isBatchExpired = (expiredAt: string | Date | null | undefined) => {
  if (!expiredAt) return false
  return new Date(expiredAt) < new Date()
}

const canCancel = (req: any) => {
  if (!currentUser.value) return false
  return currentUser.value.departmentId === req.departmentId
}

const isSameDepartment = (req: any) => {
  if (!currentUser.value) return false
  return currentUser.value.departmentId === req.departmentId
}
</script>
