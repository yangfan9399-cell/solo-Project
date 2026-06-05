<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">医院耗材领用核销平台</h1>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">当前角色：{{ currentRoleLabel }}</span>
            <select
              v-model="currentRole"
              class="text-sm border rounded px-3 py-1"
            >
              <option value="NURSE">护士站经办人</option>
              <option value="WAREHOUSE_ADMIN">库房管理员</option>
              <option value="DEPARTMENT_REVIEWER">科室复核人</option>
            </select>
          </div>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-6">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const currentRole = ref<string>('NURSE')
const currentUser = ref<any>(null)

const roleLabels: Record<string, string> = {
  NURSE: '护士站经办人',
  WAREHOUSE_ADMIN: '库房管理员',
  DEPARTMENT_REVIEWER: '科室复核人'
}

const currentRoleLabel = computed(() => roleLabels[currentRole.value] || '')

provide('currentRole', currentRole)
provide('currentUser', currentUser)

const { data: users } = await useFetch('/api/users')

watch(currentRole, (role) => {
  if (users.value) {
    const user = (users.value as any[]).find(u => u.role === role)
    currentUser.value = user
  }
}, { immediate: true })
</script>
