<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
      <p class="text-gray-500 mt-1">量具管理系统概览</p>
    </div>

    <div v-if="loading" class="space-y-6">
      <LoadingSpinner text="加载数据中..." />
    </div>

    <div v-else-if="error" class="space-y-6">
      <ErrorState :message="error" @retry="loadData" />
    </div>

    <div v-else class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="量具总数" :value="stats?.totalTools || 0" icon="tools" color="blue" />
        <StatCard label="可用量具" :value="stats?.availableTools || 0" icon="check" color="green" />
        <StatCard label="借用中" :value="stats?.borrowedTools || 0" icon="users" color="yellow" />
        <StatCard label="校准中" :value="stats?.calibratingTools || 0" icon="clock" color="blue" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="待审批借用" :value="stats?.pendingBorrows || 0" icon="list" color="yellow" />
        <StatCard label="借用逾期" :value="stats?.overdueBorrows || 0" icon="alert" color="red" />
        <StatCard label="校准即将到期" :value="stats?.calibrationDueSoon || 0" icon="clock" color="yellow" />
        <StatCard label="校准已逾期" :value="stats?.calibrationOverdue || 0" icon="alert" color="red" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">校准到期预警</h2>
            <NuxtLink to="/calibrations" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
          </div>
          
          <div v-if="calibrationAlerts.overdue.length > 0" class="mb-6">
            <h3 class="text-sm font-medium text-red-600 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              已逾期 ({{ calibrationAlerts.overdue.length }})
            </h3>
            <div class="space-y-2">
              <div v-for="item in calibrationAlerts.overdue" :key="item.id" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">{{ item.code }} - {{ item.name }}</p>
                  <p class="text-sm text-gray-500">{{ item.department }}</p>
                </div>
                <span class="text-sm text-red-600 font-medium">逾期 {{ getDaysDiff(item.nextCalibrationDate) }} 天</span>
              </div>
            </div>
          </div>

          <div v-if="calibrationAlerts.dueSoon.length > 0">
            <h3 class="text-sm font-medium text-yellow-600 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              30天内到期 ({{ calibrationAlerts.dueSoon.length }})
            </h3>
            <div class="space-y-2">
              <div v-for="item in calibrationAlerts.dueSoon" :key="item.id" class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-900">{{ item.code }} - {{ item.name }}</p>
                  <p class="text-sm text-gray-500">{{ item.department }}</p>
                </div>
                <span class="text-sm text-yellow-600 font-medium">还有 {{ -getDaysDiff(item.nextCalibrationDate) }} 天</span>
              </div>
            </div>
          </div>

          <EmptyState v-if="calibrationAlerts.overdue.length === 0 && calibrationAlerts.dueSoon.length === 0" title="暂无校准预警" description="所有量具校准状态正常" />
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">借用逾期预警</h2>
            <NuxtLink to="/borrows" class="text-sm text-primary-600 hover:text-primary-700">查看全部</NuxtLink>
          </div>
          
          <div v-if="borrowAlerts.overdue.length > 0" class="space-y-2">
            <div v-for="item in borrowAlerts.overdue" :key="item.id" class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p class="font-medium text-gray-900">{{ item.toolCode }} - {{ item.toolName }}</p>
                <p class="text-sm text-gray-500">{{ item.applicantName }} · {{ item.applicantDepartment }}</p>
              </div>
              <span class="text-sm text-red-600 font-medium">逾期 {{ getDaysDiff(item.expectedReturnDate) }} 天</span>
            </div>
          </div>

          <EmptyState v-else title="暂无借用逾期" description="所有借用记录均在正常期限内" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { stats, calibrationAlerts, borrowAlerts, loading, error, fetchStats, fetchCalibrationAlerts, fetchBorrowAlerts } = useDashboard()

function loadData() {
  fetchStats()
  fetchCalibrationAlerts()
  fetchBorrowAlerts()
}

function getDaysDiff(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

loadData()
</script>
