<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">签证材料管理系统</h1>
          </div>
          <nav class="flex space-x-4">
            <NuxtLink to="/" class="px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50">批次管理</NuxtLink>
            <NuxtLink to="/stats" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900">数据复盘</NuxtLink>
          </nav>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
