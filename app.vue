<script setup lang="ts">
import RoleSwitcher from '~/components/RoleSwitcher.vue'
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo">
            <svg viewBox="0 0 32 32" fill="none" class="logo-icon">
              <rect x="2" y="4" width="28" height="24" rx="2" stroke="currentColor" stroke-width="2" />
              <path d="M8 12h16M8 18h12M8 24h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="24" cy="8" r="4" fill="currentColor" />
            </svg>
            <span class="logo-text">理赔卷宗管理系统</span>
          </div>
        </div>
        <div class="header-right">
          <RoleSwitcher />
        </div>
      </div>
    </header>

    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--gray-50);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: var(--primary-color);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-900);
  letter-spacing: -0.3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-main {
  flex: 1;
}

@media (max-width: 640px) {
  .header-content {
    padding: 0 16px;
    height: 56px;
  }

  .logo-text {
    font-size: 16px;
  }
}
</style>
