<template>
  <Layout title="看板统计">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div class="card">
        <div class="card-header flex items-center">
          <BarChart3 class="w-5 h-5 mr-2 text-primary-500" />
          按楼层分布
        </div>
        <div class="space-y-3">
          <div v-for="item in byFloor" :key="item.floor" class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ item.floor }}F</span>
            <div class="flex items-center space-x-3">
              <div class="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div class="h-full bg-primary-500 rounded-full" :style="{ width: (item.count / maxFloorCount * 100) + '%' }"></div>
              </div>
              <span class="text-sm font-medium text-gray-800 w-8">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header flex items-center">
          <Tags class="w-5 h-5 mr-2 text-primary-500" />
          按商户类型分布
        </div>
        <div class="space-y-3">
          <div v-for="item in byType" :key="item.merchant_type" class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ item.merchant_type }}</span>
            <div class="flex items-center space-x-3">
              <div class="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div class="h-full bg-success-500 rounded-full" :style="{ width: (item.count / maxTypeCount * 100) + '%' }"></div>
              </div>
              <span class="text-sm font-medium text-gray-800 w-8">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header flex items-center">
          <AlertTriangle class="w-5 h-5 mr-2 text-warning-500" />
          退回原因统计
        </div>
        <div class="space-y-3">
          <div v-for="item in byRejectReason" :key="item.reject_reason" class="flex items-center justify-between">
            <span class="text-sm text-gray-600 max-w-[200px] truncate" :title="item.reject_reason">{{ item.reject_reason || '未填写' }}</span>
            <div class="flex items-center space-x-3">
              <div class="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div class="h-full bg-danger-500 rounded-full" :style="{ width: (item.count / maxRejectCount * 100) + '%' }"></div>
              </div>
              <span class="text-sm font-medium text-gray-800 w-8">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header flex items-center">
          <CircleDot class="w-5 h-5 mr-2 text-primary-500" />
          按状态分布
        </div>
        <div class="space-y-3">
          <div v-for="item in byStatus" :key="item.status" class="flex items-center justify-between">
            <span class="text-sm text-gray-600">{{ getStatusText(item.status) }}</span>
            <div class="flex items-center space-x-3">
              <div class="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div :class="['h-full rounded-full', getStatusBgColor(item.status)]" :style="{ width: (item.count / maxStatusCount * 100) + '%' }"></div>
              </div>
              <span class="text-sm font-medium text-gray-800 w-8">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between">
        <span class="flex items-center">
          <Clock class="w-5 h-5 mr-2 text-primary-500" />
          审批时长统计
        </span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">商户名称</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">楼层/铺位</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">提交时间</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">审批时长</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedApplications" :key="item.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 text-sm text-gray-800">{{ item.merchant_name }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ item.floor }}F / {{ item.shop_number }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(item.created_at) }}</td>
              <td class="py-3 px-4">
                <div class="flex items-center space-x-2">
                  <div class="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div :class="['h-full rounded-full', getDurationClass(item.approval_days)]" :style="{ width: Math.min(item.approval_days * 10, 100) + '%' }"></div>
                  </div>
                  <span class="text-sm font-medium" :class="getDurationTextClass(item.approval_days)">{{ item.approval_days }}天</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', item.status_class]">
                  {{ item.status_text }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
import Layout from '../Shared/Layout.vue'
import { BarChart3, Tags, AlertTriangle, CircleDot, Clock } from 'lucide-vue-next'

const props = defineProps({
  byFloor: Array,
  byType: Array,
  byRejectReason: Array,
  byStatus: Array,
  applications: Array
})

const maxFloorCount = computed(() => {
  return Math.max(...props.byFloor.map(item => item.count), 1)
})

const maxTypeCount = computed(() => {
  return Math.max(...props.byType.map(item => item.count), 1)
})

const maxRejectCount = computed(() => {
  return Math.max(...props.byRejectReason.map(item => item.count), 1)
})

const maxStatusCount = computed(() => {
  return Math.max(...props.byStatus.map(item => item.count), 1)
})

const sortedApplications = computed(() => {
  return [...props.applications].sort((a, b) => b.approval_days - a.approval_days)
})

const getStatusText = (status) => {
  const map = {
    'pending': '待提交',
    'submitted': '待工程部审核',
    'engineer_approved': '待消防安全员复核',
    'fire_approved': '待运营经理批准',
    'approved': '已批准开工',
    'rejected': '已退回',
    'completed': '已完成',
  }
  return map[status] || status
}

const getStatusBgColor = (status) => {
  const map = {
    'pending': 'bg-yellow-500',
    'submitted': 'bg-blue-500',
    'engineer_approved': 'bg-blue-500',
    'fire_approved': 'bg-blue-500',
    'approved': 'bg-green-500',
    'rejected': 'bg-red-500',
    'completed': 'bg-gray-500',
  }
  return map[status] || 'bg-gray-500'
}

const getDurationClass = (days) => {
  if (days <= 3) return 'bg-success-500'
  if (days <= 7) return 'bg-warning-500'
  return 'bg-danger-500'
}

const getDurationTextClass = (days) => {
  if (days <= 3) return 'text-success-600'
  if (days <= 7) return 'text-warning-600'
  return 'text-danger-600'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>
