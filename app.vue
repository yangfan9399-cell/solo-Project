<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-800">医院耗材领用核销平台</h1>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">角色：</span>
              <select
                v-model="selectedRole"
                class="text-sm border rounded px-3 py-1"
              >
                <option value="">全部</option>
                <option value="NURSE">护士站经办人</option>
                <option value="WAREHOUSE_ADMIN">库房管理员</option>
                <option value="DEPARTMENT_REVIEWER">科室复核人</option>
              </select>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500">用户：</span>
              <select
                v-model="selectedUserId"
                class="text-sm border rounded px-3 py-1"
              >
                <option value="">请选择用户</option>
                <option v-for="user in filteredUsers" :key="user.id" :value="user.id">
                  {{ user.name }} - {{ user.department?.name || '无科室' }}
                </option>
              </select>
            </div>
            <div v-if="currentUser" class="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
              {{ currentUser.name }} ({{ roleLabels[currentUser.role] }})
              <span v-if="currentUser.department" class="text-gray-400"> - {{ currentUser.department.name }}</span>
            </div>
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
const selectedRole = ref<string>('')
const selectedUserId = ref<string>('')
const currentUser = ref<any>(null)
const currentRole = ref<string>('')

const roleLabels: Record<string, string> = {
  NURSE: '护士站经办人',
  WAREHOUSE_ADMIN: '库房管理员',
  DEPARTMENT_REVIEWER: '科室复核人'
}

provide('currentRole', currentRole)
provide('currentUser', currentUser)

const { data: users } = await useFetch('/api/users')

const filteredUsers = computed(() => {
  if (!users.value) return []
  if (!selectedRole.value) return users.value as any[]
  return (users.value as any[]).filter(u => u.role === selectedRole.value)
})

watch(selectedRole, (role) => {
  const filtered = filteredUsers.value
  if (role && filtered.length > 0) {
    const firstUser = filtered[0]
    selectedUserId.value = firstUser.id
    currentUser.value = firstUser
    currentRole.value = firstUser.role
  } else if (!role) {
    selectedUserId.value = ''
    currentUser.value = null
    currentRole.value = ''
  }
}, { immediate: true })

watch(selectedUserId, (userId) => {
  if (userId && users.value) {
    const user = (users.value as any[]).find(u => u.id === userId)
    if (user) {
      currentUser.value = user
      currentRole.value = user.role
      if (selectedRole.value !== user.role) {
        selectedRole.value = user.role
      }
    }
  } else {
    currentUser.value = null
    currentRole.value = ''
  }
})
</script>
