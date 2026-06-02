<template>
  <div class="min-h-screen flex">
    <aside class="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-primary-600">量具管理系统</h1>
        <p class="text-sm text-gray-500 mt-1">Tooling Calibration System</p>
      </div>
      
      <nav class="p-4">
        <ul class="space-y-1">
          <li>
            <NuxtLink to="/" class="flex items-center px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
              仪表盘
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/tools" class="flex items-center px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
              量具台账
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/borrows" class="flex items-center px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
              借用管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/calibrations" class="flex items-center px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              校准管理
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/feedbacks" class="flex items-center px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
              异常反馈
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col">
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div></div>
          <div class="flex items-center space-x-4">
            <div v-if="currentUser" class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-primary-600 font-medium text-sm">{{ currentUser.name.charAt(0) }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ currentUser.name }}</p>
                <p class="text-xs text-gray-500">{{ getUserRoleLabel(currentUser.role) }} · {{ currentUser.department }}</p>
              </div>
            </div>
            <select 
              v-else 
              class="input max-w-xs"
              @change="handleUserChange"
            >
              <option value="">选择用户身份</option>
              <option v-for="user in users" :key="user.id" :value="JSON.stringify(user)">
                {{ user.name }} - {{ getUserRoleLabel(user.role) }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserRole } from '../types'

const { currentUser, users, setUser } = useAuth()

function getUserRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: '计量管理员',
    operator: '产线领用人',
    quality: '质量主管'
  }
  return labels[role] || role
}

function handleUserChange(event: Event) {
  const target = event.target as HTMLSelectElement
  if (target.value) {
    const user = JSON.parse(target.value)
    setUser(user)
  }
}
</script>
