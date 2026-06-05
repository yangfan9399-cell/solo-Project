<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  defaultCollapsed?: boolean
}>(), {
  defaultCollapsed: false
})

const collapsed = ref(props.defaultCollapsed)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="section-card card">
    <div class="section-card-header" @click="toggleCollapse">
      <div class="section-card-title">
        <span class="collapse-icon" :class="{ collapsed }">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        <span>{{ title }}</span>
      </div>
      <div class="section-card-actions" @click.stop>
        <slot name="actions"></slot>
      </div>
    </div>
    <div v-show="!collapsed" class="section-card-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.section-card {
  margin-bottom: 16px;
  overflow: hidden;
}

.section-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--gray-200);
  cursor: pointer;
  background-color: var(--gray-50);
  transition: background-color 0.2s;
}

.section-card-header:hover {
  background-color: var(--gray-100);
}

.section-card-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  color: var(--gray-800);
}

.collapse-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: transform 0.2s;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.section-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-card-body {
  padding: 20px;
}
</style>
