<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { UserRole } from '@/types';

const userStore = useUserStore();
const { users, currentUser, loading } = storeToRefs(userStore);
const route = useRoute();

onMounted(async () => {
  await userStore.loadUsers();
  if (users.value.length > 0 && !currentUser.value) {
    userStore.setCurrentUser(users.value[0]);
  }
});

function handleUserChange(event: Event) {
  const select = event.target as HTMLSelectElement;
  const user = users.value.find(u => u.id === select.value);
  if (user) {
    userStore.setCurrentUser(user);
  }
}

const isActive = (path: string) => route.path === path;
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <div>
          <h1>🏭 制造车间工序交接与返修追踪平台</h1>
        </div>
        <nav class="nav-links">
          <a :class="{ 'router-link-active': isActive('/') }" href="/">工单列表</a>
          <a :class="{ 'router-link-active': isActive('/analytics') }" href="/analytics">复盘分析</a>
          <div class="user-selector" v-if="!loading">
            <select :value="currentUser?.id" @change="handleUserChange">
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.badgeNo }})
              </option>
            </select>
            <span v-if="currentUser" class="user-badge" :class="{
              'operator': currentUser.role === UserRole.OPERATOR,
              'quality': currentUser.role === UserRole.QUALITY_INSPECTOR
            }">
              {{ currentUser.role === UserRole.OPERATOR ? '操作员' : '质检员' }}
            </span>
          </div>
        </nav>
      </div>
    </header>
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}
</style>
