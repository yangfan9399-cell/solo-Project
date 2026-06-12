<template>
  <span :class="badgeClass">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  level: {
    type: String,
    required: true
  }
});

const labels = {
  general: '一般',
  major: '较大',
  serious: '重大'
};

const colors = {
  general: 'bg-green-100 text-green-800',
  major: 'bg-yellow-100 text-yellow-800',
  serious: 'bg-red-100 text-red-800'
};

const label = computed(() => labels[props.level] || props.level);
const badgeClass = computed(() => 
  `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[props.level] || 'bg-gray-100 text-gray-800'}`
);
</script>
