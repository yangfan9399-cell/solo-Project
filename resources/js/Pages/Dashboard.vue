<template>
  <Layout title="仪表盘">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">总申请数</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <ClipboardList class="w-6 h-6 text-primary-500" />
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待审核</p>
            <p class="text-3xl font-bold text-gray-800 mt-1">{{ stats.submitted + stats.engineer_approved + stats.fire_approved }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock class="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已批准</p>
            <p class="text-3xl font-bold text-success-600 mt-1">{{ stats.approved }}</p>
          </div>
          <div class="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
            <CheckCircle class="w-6 h-6 text-success-500" />
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">已退回</p>
            <p class="text-3xl font-bold text-danger-600 mt-1">{{ stats.rejected }}</p>
          </div>
          <div class="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
            <XCircle class="w-6 h-6 text-danger-500" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between">
        <span>最近申请</span>
        <button @click="$inertia.visit('/applications')" class="text-sm text-primary-600 hover:text-primary-700">
          查看全部
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">商户名称</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">楼层/铺位</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">施工周期</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recent" :key="item.id" class="border-b border-gray-50 hover:bg-gray-50">
              <td class="py-3 px-4 text-sm text-gray-800">{{ item.merchant_name }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ item.floor }}F / {{ item.shop_number }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}</td>
              <td class="py-3 px-4">
                <span :class="['px-2 py-1 rounded-full text-xs font-medium', item.status_class]">
                  {{ item.status_text }}
                </span>
              </td>
              <td class="py-3 px-4">
                <button @click="$inertia.visit(`/applications/${item.id}`)" class="text-sm text-primary-600 hover:text-primary-700">
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import Layout from '../Shared/Layout.vue'
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-vue-next'

defineProps({
  stats: Object,
  recent: Array
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>
