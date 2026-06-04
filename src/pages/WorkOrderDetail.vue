<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <button @click="$router.back()" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">工单详情</h1>
        <span v-if="order" :class="['px-3 py-1 text-sm font-medium rounded-full', WorkOrderStatusColor[order.status]]">
          {{ WorkOrderStatusLabel[order.status] }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="order" class="space-y-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">基本信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm text-gray-500 mb-1">工单编号</label>
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ order.orderNo }}</span>
              <span v-if="order.isRepeat" class="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                重复报修 x{{ order.repeatCount }}
              </span>
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">故障来源</label>
            <span class="font-medium">{{ FaultSourceLabel[order.faultSource] }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">故障类型</label>
            <span class="font-medium">{{ FaultTypeLabel[order.faultType] }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">设备编号</label>
            <span class="font-medium">{{ order.deviceNo }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">设备ID</label>
            <span class="font-medium">{{ order.deviceId }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">站点</label>
            <span class="font-medium">{{ order.stationName }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">负责人</label>
            <span class="font-medium">{{ order.assigneeName || '-' }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">维修方式</label>
            <span class="font-medium">{{ order.repairType ? RepairTypeLabel[order.repairType] : '-' }}</span>
          </div>
          <div>
            <label class="block text-sm text-gray-500 mb-1">维修时长</label>
            <span class="font-medium">{{ order.repairDuration ? order.repairDuration + ' 分钟' : '-' }}</span>
          </div>
          <div class="md:col-span-3">
            <label class="block text-sm text-gray-500 mb-1">维修说明</label>
            <p class="text-gray-900">{{ order.repairNote || '-' }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">费用明细</h2>

        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-700 mb-3">配件费用</h3>
          <div v-if="order.partsFees?.length" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">配件名称</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">数量</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">单价</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">小计</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                  <th v-if="order.status === 'disputed'" class="px-4 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="fee in order.partsFees" :key="fee.id" :class="{ 'bg-red-50': fee.isDisputed && !fee.adjustedPrice }">
                  <td class="px-4 py-3">{{ fee.partName }}</td>
                  <td class="px-4 py-3">{{ fee.quantity }}</td>
                  <td class="px-4 py-3">
                    <span v-if="fee.isDisputed && fee.adjustedPrice" class="line-through text-gray-400">¥{{ fee.unitPrice }}</span>
                    <span v-else>¥{{ fee.unitPrice }}</span>
                    <span v-if="fee.isDisputed && fee.adjustedPrice" class="ml-2 text-green-600">¥{{ fee.adjustedPrice }}</span>
                  </td>
                  <td class="px-4 py-3 font-medium">
                    <span v-if="fee.isDisputed && fee.adjustedPrice" class="line-through text-gray-400">¥{{ fee.subtotal }}</span>
                    <span v-else>¥{{ fee.subtotal }}</span>
                    <span v-if="fee.isDisputed && fee.adjustedPrice" class="ml-2 text-green-600">¥{{ fee.adjustedPrice * fee.quantity }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span v-if="fee.isDisputed && !fee.adjustedPrice" class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                      争议中
                    </span>
                    <span v-else-if="fee.isDisputed && fee.adjustedPrice" class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                      已调整
                    </span>
                    <span v-else class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      正常
                    </span>
                  </td>
                  <td v-if="order.status === 'disputed'" class="px-4 py-3">
                    <button
                      v-if="fee.isDisputed && !fee.adjustedPrice"
                      @click="openAdjustModal(fee)"
                      class="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      调整费用
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-gray-500 text-sm">暂无配件费用</p>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-700 mb-3">人工费用</h3>
          <div v-if="order.laborFees?.length" class="flex gap-6">
            <div v-for="fee in order.laborFees" :key="fee.id">
              <span class="text-gray-600">人工费：</span>
              <span class="font-medium text-lg">¥{{ fee.amount }}</span>
            </div>
          </div>
          <p v-else class="text-gray-500 text-sm">暂无人工费用</p>
        </div>

        <div class="border-t pt-4 flex justify-between items-center">
          <div>
            <span class="text-gray-600">费用总计：</span>
            <span class="font-bold text-2xl text-blue-600">¥{{ totalFee }}</span>
          </div>
          <div v-if="hasUnresolvedDispute" class="flex items-center gap-2 text-red-600">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>存在未处理的费用争议，无法归档</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">证据材料</h2>
        <div v-if="order.evidences?.length" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="evidence in order.evidences" :key="evidence.id" class="border rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <span :class="['px-2 py-0.5 text-xs rounded', evidence.type === 'image' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700']">
                {{ evidence.type === 'image' ? '图片' : '文件' }}
              </span>
            </div>
            <p class="font-medium text-sm">{{ evidence.title }}</p>
          </div>
        </div>
        <p v-else class="text-gray-500 text-sm">暂无证据材料</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">处理节点</h2>
        <div class="relative">
          <div v-for="(node, index) in sortedProcessNodes" :key="node.id" class="flex gap-4 pb-6 last:pb-0">
            <div class="flex flex-col items-center">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <div v-if="index < sortedProcessNodes.length - 1" class="w-0.5 h-full bg-gray-200 mt-1"></div>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium">{{ node.action }}</span>
                <span class="text-sm text-gray-500">{{ node.operator }}</span>
                <span class="text-xs text-gray-400">{{ OperatorRoleLabel[node.operatorRole] || node.operatorRole }}</span>
              </div>
              <p v-if="node.note" class="text-sm text-gray-600 mb-1">{{ node.note }}</p>
              <p class="text-xs text-gray-400">{{ formatDate(node.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">操作</h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="order.status === 'pending'"
            @click="openAssignModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            分配工单
          </button>
          <button
            v-if="order.status === 'assigned'"
            @click="openRepairModal"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            开始维修
          </button>
          <button
            v-if="order.status === 'repairing'"
            @click="submitSettlement"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            提交结算
          </button>
          <button
            v-if="order.status === 'pending_settlement'"
            @click="openDisputeModal"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            发起争议
          </button>
          <button
            v-if="order.status === 'pending_settlement' && !hasUnresolvedDispute"
            @click="confirmArchive"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            确认归档
          </button>
          <button
            v-if="order.status === 'disputed' && !hasUnresolvedDispute"
            @click="returnToSettlement"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            退回待结算
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAssignModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">分配工单</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">选择负责人</label>
          <select v-model="assignForm.assigneeId" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="">请选择</option>
            <option v-for="tech in TechnicianList" :key="tech.id" :value="tech.id">{{ tech.name }}</option>
          </select>
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showAssignModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button @click="handleAssign" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确认分配</button>
        </div>
      </div>
    </div>

    <div v-if="showRepairModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">开始维修</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">维修方式</label>
            <select v-model="repairForm.repairType" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="remote_recovery">远程恢复</option>
              <option value="on_site_repair">现场维修</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">维修时长（分钟）</label>
            <input v-model.number="repairForm.repairDuration" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">维修说明</label>
            <textarea v-model="repairForm.repairNote" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showRepairModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button @click="handleRepair" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">确认</button>
        </div>
      </div>
    </div>

    <div v-if="showDisputeModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">发起费用争议</h3>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">争议原因</label>
          <textarea v-model="disputeForm.disputeReason" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="请输入争议原因..."></textarea>
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showDisputeModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button @click="handleDispute" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">确认发起</button>
        </div>
      </div>
    </div>

    <div v-if="showAdjustModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">调整费用</h3>
        <div v-if="currentAdjustFee" class="space-y-4">
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">配件：{{ currentAdjustFee.partName }}</p>
            <p class="text-sm text-gray-600">原单价：¥{{ currentAdjustFee.unitPrice }}</p>
            <p v-if="currentAdjustFee.disputeReason" class="text-sm text-red-600 mt-1">争议原因：{{ currentAdjustFee.disputeReason }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调整后单价</label>
            <input v-model.number="adjustForm.adjustedPrice" type="number" min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调整原因</label>
            <textarea v-model="adjustForm.adjustmentReason" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showAdjustModal = false" class="px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
          <button @click="handleAdjust" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确认调整</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { workOrderApi, type WorkOrder, type PartsFee } from '@/api'
import {
  WorkOrderStatusLabel,
  WorkOrderStatusColor,
  FaultSourceLabel,
  FaultTypeLabel,
  RepairTypeLabel,
  OperatorRoleLabel,
  TechnicianList
} from '@/constants'

const route = useRoute()
const orderId = computed(() => route.params.id as string)

const loading = ref(true)
const order = ref<WorkOrder | null>(null)

const showAssignModal = ref(false)
const showRepairModal = ref(false)
const showDisputeModal = ref(false)
const showAdjustModal = ref(false)

const assignForm = ref({ assigneeId: '' })
const repairForm = ref({ repairType: 'remote_recovery', repairDuration: 30, repairNote: '' })
const disputeForm = ref({ disputeReason: '' })
const adjustForm = ref({ adjustedPrice: 0, adjustmentReason: '' })
const currentAdjustFee = ref<PartsFee | null>(null)

const sortedProcessNodes = computed(() => {
  if (!order.value?.processNodes) return []
  return [...order.value.processNodes].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

const totalFee = computed(() => {
  if (!order.value) return 0
  const partsTotal = (order.value.partsFees || []).reduce((sum, fee) => {
    const price = fee.adjustedPrice ?? fee.unitPrice
    return sum + price * fee.quantity
  }, 0)
  const laborTotal = (order.value.laborFees || []).reduce((sum, fee) => sum + fee.amount, 0)
  return partsTotal + laborTotal
})

const hasUnresolvedDispute = computed(() => {
  if (!order.value?.partsFees) return false
  return order.value.partsFees.some(fee => fee.isDisputed && fee.adjustedPrice === null)
})

const loadOrder = async () => {
  loading.value = true
  try {
    order.value = await workOrderApi.getDetail(orderId.value)
  } catch (error) {
    console.error('加载工单详情失败:', error)
  } finally {
    loading.value = false
  }
}

const openAssignModal = () => {
  assignForm.value.assigneeId = ''
  showAssignModal.value = true
}

const handleAssign = async () => {
  if (!assignForm.value.assigneeId) return
  const tech = TechnicianList.find(t => t.id === assignForm.value.assigneeId)
  if (!tech) return
  try {
    await workOrderApi.assign(orderId.value, {
      assigneeId: tech.id,
      assigneeName: tech.name
    })
    showAssignModal.value = false
    loadOrder()
  } catch (error) {
    console.error('分配失败:', error)
  }
}

const openRepairModal = () => {
  repairForm.value = { repairType: 'remote_recovery', repairDuration: 30, repairNote: '' }
  showRepairModal.value = true
}

const handleRepair = async () => {
  try {
    await workOrderApi.repair(orderId.value, {
      ...repairForm.value,
      operator: order.value?.assigneeName || '技术员'
    })
    showRepairModal.value = false
    loadOrder()
  } catch (error) {
    console.error('维修失败:', error)
  }
}

const submitSettlement = async () => {
  try {
    await workOrderApi.submitSettlement(orderId.value, order.value?.assigneeName || '技术员')
    loadOrder()
  } catch (error) {
    console.error('提交结算失败:', error)
  }
}

const openDisputeModal = () => {
  disputeForm.value.disputeReason = ''
  showDisputeModal.value = true
}

const handleDispute = async () => {
  if (!disputeForm.value.disputeReason) return
  try {
    await workOrderApi.dispute(orderId.value, {
      disputeReason: disputeForm.value.disputeReason,
      operator: '财务复核'
    })
    showDisputeModal.value = false
    loadOrder()
  } catch (error) {
    console.error('发起争议失败:', error)
  }
}

const openAdjustModal = (fee: PartsFee) => {
  currentAdjustFee.value = fee
  adjustForm.value = { adjustedPrice: fee.unitPrice, adjustmentReason: '' }
  showAdjustModal.value = true
}

const handleAdjust = async () => {
  if (!currentAdjustFee.value) return
  try {
    await workOrderApi.adjustFee(orderId.value, {
      feeId: currentAdjustFee.value.id,
      adjustedPrice: adjustForm.value.adjustedPrice,
      adjustmentReason: adjustForm.value.adjustmentReason,
      operator: '财务复核'
    })
    showAdjustModal.value = false
    loadOrder()
  } catch (error) {
    console.error('调整费用失败:', error)
  }
}

const returnToSettlement = async () => {
  try {
    await workOrderApi.returnOrder(orderId.value, '财务复核')
    loadOrder()
  } catch (error) {
    console.error('退回失败:', error)
  }
}

const confirmArchive = async () => {
  try {
    await workOrderApi.confirm(orderId.value, '财务复核')
    loadOrder()
  } catch (error) {
    console.error('归档失败:', error)
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadOrder()
})
</script>
