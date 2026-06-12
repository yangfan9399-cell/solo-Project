<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({
  email: '',
})

function loginAs(email) {
  form.email = email
  form.post('/login', {
    onSuccess: () => form.reset(),
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-2xl font-bold text-gray-900 text-center mb-2">贵金属调拨复核平台</h1>
      <p class="text-sm text-gray-500 text-center mb-8">请选择角色快捷登录</p>

      <div class="space-y-4">
        <button
          @click="loginAs('zhangsan@example.com')"
          :disabled="form.processing"
          class="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          张三（业务专员）
        </button>

        <button
          @click="loginAs('lisi@example.com')"
          :disabled="form.processing"
          class="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          李四（审批负责人）
        </button>
      </div>

      <div v-if="form.errors.email" class="mt-4 text-center text-sm text-red-600">{{ form.errors.email }}</div>
    </div>
  </div>
</template>
