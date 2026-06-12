<script setup>
import { Link, usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()

const roleLabel = computed(() => {
  const role = page.props.auth?.user?.role
  const map = {
    business_specialist: '业务专员',
    approval_manager: '审批负责人',
  }
  return map[role] || role || '未分配'
})

const roleBadgeClass = computed(() => {
  const role = page.props.auth?.user?.role
  if (role === 'business_specialist') return 'bg-blue-600'
  if (role === 'approval_manager') return 'bg-purple-600'
  return 'bg-gray-600'
})

function switchRole() {
  const currentRole = page.props.auth?.user?.role
  const targetRole = currentRole === 'business_specialist' ? 'approval_manager' : 'business_specialist'
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/switch-role'
  const token = document.createElement('input')
  token.type = 'hidden'
  token.name = '_token'
  token.value = document.querySelector('meta[name="csrf-token"]')?.content || ''
  const roleInput = document.createElement('input')
  roleInput.type = 'hidden'
  roleInput.name = 'role'
  roleInput.value = targetRole
  form.appendChild(token)
  form.appendChild(roleInput)
  document.body.appendChild(form)
  form.submit()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-indigo-900 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <Link href="/" class="text-xl font-bold">贵金属调拨复核平台</Link>
            <div class="hidden md:flex space-x-4">
              <Link href="/allocations" class="nav-link" :class="{ 'bg-indigo-700': $page.url.startsWith('/allocations') }">调拨记录</Link>
              <Link href="/dashboard" class="nav-link" :class="{ 'bg-indigo-700': $page.url.startsWith('/dashboard') }">复盘看板</Link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm">{{ $page.props.auth?.user?.name }}</span>
            <span class="text-xs px-2 py-1 rounded" :class="roleBadgeClass">{{ roleLabel }}</span>
            <button @click="switchRole" class="text-xs bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded">切换角色</button>
            <form method="POST" action="/logout">
              <input type="hidden" name="_token" :value="$page.props.csrf_token">
              <button type="submit" class="text-xs bg-red-700 hover:bg-red-600 px-3 py-1 rounded">退出</button>
            </form>
          </div>
        </div>
      </div>
    </nav>

    <div v-if="$page.props.flash?.success" class="max-w-7xl mx-auto mt-4 px-4">
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">{{ $page.props.flash.success }}</div>
    </div>
    <div v-if="$page.props.flash?.error" class="max-w-7xl mx-auto mt-4 px-4">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{{ $page.props.flash.error }}</div>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>
  </div>
</template>
