<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold text-gray-800">🔥 燃气安检隐患整改系统</span>
            </div>
            <div class="hidden sm:ml-8 sm:flex sm:space-x-4">
              <Link
                :href="route('dashboard')"
                :class="[
                  'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                  route().current('dashboard') || route().current('dashboard.drilldown')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                📊 看板统计
              </Link>
              <Link
                :href="route('records.index')"
                :class="[
                  'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                  route().current('records.index')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                📋 记录列表
              </Link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">切换身份：</span>
              <Link
                :href="route('login', 'business_specialist')"
                :class="[
                  'px-3 py-1 text-xs rounded',
                  $page.props.auth.user?.role === 'business_specialist'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                业务专员
              </Link>
              <Link
                :href="route('login', 'approval_leader')"
                :class="[
                  'px-3 py-1 text-xs rounded',
                  $page.props.auth.user?.role === 'approval_leader'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                审批负责人
              </Link>
            </div>
            <div v-if="$page.props.auth.user" class="flex items-center space-x-2">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-700">{{ $page.props.auth.user.name }}</p>
                <p class="text-xs text-gray-500">{{ $page.props.auth.user.role_label }} · {{ $page.props.auth.user.department }}</p>
              </div>
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {{ $page.props.auth.user.name.charAt(0) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div v-if="$page.props.flash.success || $page.props.flash.error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div v-if="$page.props.flash.success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
        {{ $page.props.flash.success }}
      </div>
      <div v-if="$page.props.flash.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {{ $page.props.flash.error }}
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
import { Link } from '@inertiajs/vue3';
</script>
