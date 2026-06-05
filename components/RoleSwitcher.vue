<script setup lang="ts">
import { ref } from 'vue'
import type { UserRole } from '~/composables/mockData'
import { roleLabels, mockUsers } from '~/composables/mockData'
import { useClaimStore } from '~/composables/useClaimStore'

const { currentRole, currentUser, setRole } = useClaimStore()

const isDropdownOpen = ref(false)

const roles: UserRole[] = ['HANDLER', 'REVIEWER', 'APPROVER']

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function selectRole(role: UserRole) {
  setRole(role)
  isDropdownOpen.value = false
}

function closeDropdown() {
  isDropdownOpen.value = false
}
</script>

<template>
  <div class="role-switcher">
    <button class="role-switcher-trigger" @click="toggleDropdown" @blur="closeDropdown">
      <img v-if="currentUser?.avatar" :src="currentUser.avatar" :alt="currentUser.name" class="avatar" />
      <div class="role-info">
        <span class="user-name">{{ currentUser?.name }}</span>
        <span class="role-label">{{ roleLabels[currentRole] }}</span>
      </div>
      <svg class="dropdown-icon" :class="{ open: isDropdownOpen }" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    <div v-if="isDropdownOpen" class="role-dropdown">
      <button
        v-for="role in roles"
        :key="role"
        :class="['role-option', { active: currentRole === role }]"
        @mousedown.prevent="selectRole(role)"
      >
        <img :src="mockUsers.find(u => u.role === role)?.avatar" :alt="roleLabels[role]" class="option-avatar" />
        <div class="option-info">
          <span class="option-name">{{ mockUsers.find(u => u.role === role)?.name }}</span>
          <span class="option-role">{{ roleLabels[role] }}</span>
        </div>
        <svg v-if="currentRole === role" class="check-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.role-switcher {
  position: relative;
}

.role-switcher-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.role-switcher-trigger:hover {
  border-color: var(--gray-300);
  background-color: var(--gray-50);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--gray-100);
}

.role-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-800);
}

.role-label {
  font-size: 11px;
  color: var(--gray-500);
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  color: var(--gray-400);
  transition: transform 0.2s ease;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.role-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  padding: 4px;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
}

.role-option:hover {
  background-color: var(--gray-50);
}

.role-option.active {
  background-color: #eff6ff;
}

.option-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--gray-100);
}

.option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.option-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
}

.option-role {
  font-size: 12px;
  color: var(--gray-500);
}

.check-icon {
  width: 18px;
  height: 18px;
  color: var(--primary-color);
}
</style>
