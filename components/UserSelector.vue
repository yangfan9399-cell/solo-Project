<template>
  <div class="flex items-center gap-3">
    <div v-if="currentUser" class="flex items-center gap-2">
      <span class="text-sm text-gray-500">当前用户：</span>
      <span class="font-medium">{{ currentUser.name }}</span>
      <span :class="roleBadgeClass">
        {{ ROLE_LABELS[currentUser.role] }}
      </span>
      <button
        @click="clearUser"
        class="text-sm text-gray-500 hover:text-gray-700"
      >
        切换
      </button>
    </div>
    <div v-else class="flex items-center gap-2">
      <span class="text-sm text-gray-500">请选择用户：</span>
      <select
        @change="onSelect"
        class="input text-sm"
      >
        <option value="">请选择</option>
        <option v-for="user in store.users" :key="user.id" :value="user.id">
          {{ user.name }} ({{ ROLE_LABELS[user.role] }})
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecordsStore } from '~/stores/records'
import { useCurrentUser } from '~/composables/useCurrentUser'
import { ROLE_LABELS, UserRole } from '~/types'

const store = useRecordsStore()
const { currentUser, selectUser, clearUser } = useCurrentUser()

const roleBadgeClass = computed(() => {
  const role = currentUser.value?.role
  const base = 'badge'
  if (role === 'APPLICANT') return `${base} bg-blue-100 text-blue-800`
  if (role === 'REVIEWER') return `${base} bg-purple-100 text-purple-800`
  return `${base} bg-gray-100 text-gray-800`
})

const onSelect = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const user = store.users.find(u => u.id === target.value)
  if (user) selectUser(user)
}
</script>
