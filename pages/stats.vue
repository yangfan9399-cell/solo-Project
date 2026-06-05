<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">数据复盘</h2>
      <button @click="fetchStats" class="px-4 py-2 text-sm text-blue-600 hover:text-blue-800">
        刷新数据
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">处理耗时(平均)</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.processingTime.avg }} <span class="text-sm font-normal text-gray-500">天</span></p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">最快处理</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.processingTime.min }} <span class="text-sm font-normal text-gray-500">天</span></p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-100 rounded-lg">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">最慢处理</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.processingTime.max }} <span class="text-sm font-normal text-gray-500">天</span></p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="p-3 bg-red-100 rounded-lg">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-gray-500">退回次数</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.rejectionCount }} <span class="text-sm font-normal text-gray-500">次</span></p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">按国家统计</h3>
        </div>
        <div class="p-6">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm text-gray-500">
                <th class="pb-3 font-medium">国家</th>
                <th class="pb-3 font-medium">申请数</th>
                <th class="pb-3 font-medium">通过</th>
                <th class="pb-3 font-medium">拒签</th>
                <th class="pb-3 font-medium">通过率</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="country in stats.byCountry" :key="country.country" class="text-sm">
                <td class="py-3 font-medium text-gray-900">{{ country.country }}</td>
                <td class="py-3 text-gray-600">{{ country.count }}</td>
                <td class="py-3 text-green-600">{{ country.approved }}</td>
                <td class="py-3 text-red-600">{{ country.rejected }}</td>
                <td class="py-3">
                  <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div class="bg-green-500 h-2 rounded-full" :style="{ width: getRate(country) + '%' }"></div>
                    </div>
                    <span class="text-gray-600">{{ getRate(country) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">材料问题统计</h3>
        </div>
        <div class="p-6">
          <div v-if="stats.byMaterialIssue.length === 0" class="text-center text-gray-500 py-8">
            暂无材料问题记录
          </div>
          <div v-else class="space-y-4">
            <div v-for="issue in stats.byMaterialIssue" :key="issue.issue" class="flex items-center">
              <div class="w-32 text-sm text-gray-700 truncate" :title="issue.issue">{{ issue.issue }}</div>
              <div class="flex-1 mx-4">
                <div class="bg-gray-200 rounded-full h-3">
                  <div 
                    class="h-3 rounded-full transition-all duration-300" 
                    :class="getIssueBarColor(issue.issue)"
                    :style="{ width: getIssuePercentage(issue.count) + '%' }"
                  ></div>
                </div>
              </div>
              <div class="w-16 text-right text-sm font-medium text-gray-900">{{ issue.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">问题分析说明</h3>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-4 bg-red-50 rounded-lg">
              <h4 class="font-medium text-red-800 mb-2">护照过期问题</h4>
              <p class="text-sm text-red-600">
                发现 {{ getIssueCount('护照过期') }} 例护照过期情况。建议提前3个月提醒游客检查护照有效期，护照有效期不足6个月的游客无法办理签证。
              </p>
            </div>
            <div class="p-4 bg-yellow-50 rounded-lg">
              <h4 class="font-medium text-yellow-800 mb-2">照片规格问题</h4>
              <p class="text-sm text-yellow-600">
                发现 {{ getIssueCount('照片规格不符') }} 例照片不合格。请在收集材料时严格检查，确保为近期2寸白底免冠照片。
              </p>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg">
              <h4 class="font-medium text-blue-800 mb-2">出签结果待补</h4>
              <p class="text-sm text-blue-600">
                请及时跟进已递签批次的出签结果，确保系统数据准确，便于后续统计和复盘。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewStats } from '~/types'

const stats = ref<ReviewStats>({
  byCountry: [],
  byMaterialIssue: [],
  processingTime: { avg: 0, max: 0, min: 0 },
  rejectionCount: 0
})

const getRate = (country: { count: number; approved: number }) => {
  if (country.count === 0) return 0
  return Math.round((country.approved / country.count) * 100)
}

const getIssuePercentage = (count: number) => {
  const maxCount = Math.max(...stats.value.byMaterialIssue.map(i => i.count), 1)
  return Math.round((count / maxCount) * 100)
}

const getIssueBarColor = (issue: string) => {
  if (issue.includes('过期')) return 'bg-red-500'
  if (issue.includes('规格')) return 'bg-orange-500'
  if (issue.includes('待提交')) return 'bg-yellow-500'
  return 'bg-blue-500'
}

const getIssueCount = (issueName: string) => {
  const issue = stats.value.byMaterialIssue.find(i => i.issue === issueName)
  return issue?.count || 0
}

const fetchStats = async () => {
  stats.value = await $fetch('/api/stats')
}

onMounted(fetchStats)
</script>
