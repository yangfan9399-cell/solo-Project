<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-bold text-gray-900">
            城市排水泵站值守告警处置与交接复核系统
          </h1>
          <nav class="flex gap-1 ml-8">
            <NuxtLink
              to="/"
              class="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              :class="{ 'bg-primary-100 text-primary-700': route.path === '/' }"
            >
              列表
            </NuxtLink>
            <NuxtLink
              to="/process"
              class="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              :class="{ 'bg-primary-100 text-primary-700': route.path === '/process' }"
            >
              处理台
            </NuxtLink>
            <NuxtLink
              to="/review"
              class="px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              :class="{ 'bg-primary-100 text-primary-700': route.path === '/review' }"
            >
              复盘
            </NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <UserSelector />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
