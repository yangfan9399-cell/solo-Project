import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { getUsers } from '@/api';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const loading = ref(false);

  const isOperator = computed(() => currentUser.value?.role === UserRole.OPERATOR);
  const isQualityInspector = computed(() => currentUser.value?.role === UserRole.QUALITY_INSPECTOR);

  async function loadUsers() {
    loading.value = true;
    try {
      users.value = await getUsers();
    } finally {
      loading.value = false;
    }
  }

  function setCurrentUser(user: User) {
    currentUser.value = user;
  }

  function clearCurrentUser() {
    currentUser.value = null;
  }

  return {
    users,
    currentUser,
    loading,
    isOperator,
    isQualityInspector,
    loadUsers,
    setCurrentUser,
    clearCurrentUser
  };
});
