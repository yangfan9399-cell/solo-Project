<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <ClipboardList class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">商户装修审批系统</h1>
              <p class="text-sm text-gray-500">围挡审批与消防材料复核</p>
            </div>
          </div>
          <nav class="flex items-center space-x-1">
            <button
              v-for="item in navItems"
              :key="item.path"
              @click="$inertia.visit(item.path)"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              :class="currentPath === item.path ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              <component :is="item.icon" class="w-5 h-5 inline-block mr-2" />
              {{ item.label }}
            </button>
          </nav>
        </div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ClipboardList, LayoutDashboard, FileText, KanbanSquare } from 'lucide-vue-next'

defineProps({
  title: String
})

const currentPath = ref(window.location.pathname)

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/applications', label: '申请列表', icon: FileText },
  { path: '/kanban', label: '看板统计', icon: KanbanSquare },
]
</script>
