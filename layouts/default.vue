<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl font-bold text-gray-900">
              🏠 家政保洁订单验收系统
            </h1>
            <nav class="flex space-x-6">
              <NuxtLink
                to="/"
                class="text-sm font-medium transition-colors"
                :class="$route.path === '/' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
              >
                订单列表
              </NuxtLink>
              <NuxtLink
                to="/statistics"
                class="text-sm font-medium transition-colors"
                :class="$route.path === '/statistics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'"
              >
                复盘统计
              </NuxtLink>
            </nav>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">当前角色：</span>
            <select
              v-model="currentRole"
              class="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="customer_service">客服</option>
              <option value="cleaner">保洁员</option>
              <option value="inspector">质检员</option>
              <option value="supervisor">主管</option>
            </select>
          </div>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const currentRole = useState('currentRole', () => 'customer_service');
</script>
