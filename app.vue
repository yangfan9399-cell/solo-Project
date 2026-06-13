<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🏥</span>
          <span class="logo-text">高值耗材追溯系统</span>
        </div>
        <nav class="nav-menu">
          <NuxtLink to="/" class="nav-item">
            <span>📋</span> 记录列表
          </NuxtLink>
          <NuxtLink to="/dashboard" class="nav-item">
            <span>📊</span> 看板统计
          </NuxtLink>
          <NuxtLink to="/review" class="nav-item">
            <span>⚙️</span> 处理台
          </NuxtLink>
          <NuxtLink to="/review-board" class="nav-item">
            <span>🔍</span> 复盘页
          </NuxtLink>
        </nav>
        <div class="user-info">
          <span class="user-role" :class="currentRole">
            {{ roleText }}
          </span>
          <span class="user-name">{{ currentUser.name }}</span>
          <select class="role-switcher" v-model="selectedRole" @change="switchRole">
            <option value="APPLICANT">申请人</option>
            <option value="PROCESSOR">处理人</option>
            <option value="REVIEWER">复核人</option>
            <option value="ARCHIVIST">归档人</option>
          </select>
        </div>
      </div>
    </header>
    <main class="app-main">
      <div class="container">
        <NuxtPage />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const selectedRole = ref<'APPLICANT' | 'PROCESSOR' | 'REVIEWER' | 'ARCHIVIST'>('APPLICANT')

const users = {
  APPLICANT: { id: 1, name: '张医生', role: 'APPLICANT', department: '骨科' },
  PROCESSOR: { id: 2, name: '李护士', role: 'PROCESSOR', department: '耗材科' },
  REVIEWER: { id: 3, name: '王主任', role: 'REVIEWER', department: '医务科' },
  ARCHIVIST: { id: 4, name: '赵档案', role: 'ARCHIVIST', department: '病案室' }
}

const currentRole = computed(() => selectedRole.value)

const currentUser = computed(() => users[selectedRole.value])

const roleText = computed(() => {
  const map: Record<string, string> = {
    APPLICANT: '申请人',
    PROCESSOR: '处理人',
    REVIEWER: '复核人',
    ARCHIVIST: '归档人'
  }
  return map[selectedRole.value] || ''
})

const switchRole = () => {
  const userState = useState('currentUser', () => currentUser.value)
  userState.value = currentUser.value
  navigateTo('/')
}

const userState = useState('currentUser', () => currentUser.value)

watch(selectedRole, () => {
  userState.value = currentUser.value
}, { immediate: true })
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
}

.logo-icon {
  font-size: 24px;
}

.nav-menu {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  color: #595959;
  text-decoration: none;
  transition: all 0.3s;
  font-size: 14px;
}

.nav-item:hover {
  background: #f0f5ff;
  color: #1890ff;
}

.nav-item.router-link-active {
  background: #e6f0ff;
  color: #1890ff;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-role {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.user-role.APPLICANT {
  background: #e6f7ff;
  color: #1890ff;
}

.user-role.PROCESSOR {
  background: #f6ffed;
  color: #52c41a;
}

.user-role.REVIEWER {
  background: #fffbe6;
  color: #faad14;
}

.user-role.ARCHIVIST {
  background: #f9f0ff;
  color: #722ed1;
}

.user-name {
  color: #262626;
  font-weight: 500;
}

.role-switcher {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.app-main {
  flex: 1;
}
</style>
