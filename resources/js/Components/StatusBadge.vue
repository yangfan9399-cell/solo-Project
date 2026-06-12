<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeClass
    ]"
  >
    <span v-if="hasBlocking" class="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
    <span v-if="isArchived" class="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  hasBlocking: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
});

const statusLabels = {
  accepted: '已受理',
  processing: '处理中',
  reviewing: '复核中',
  approved: '已通过',
  archived: '已归档',
  returned: '已退回',
  appealed: '申诉中',
  number_conflict: '编号冲突',
  amount_difference: '金额差异'
};

const statusColors = {
  accepted: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-purple-100 text-purple-800',
  approved: 'bg-teal-100 text-teal-800',
  archived: 'bg-green-100 text-green-800',
  returned: 'bg-red-100 text-red-800',
  appealed: 'bg-orange-100 text-orange-800',
  number_conflict: 'bg-red-100 text-red-800',
  amount_difference: 'bg-red-100 text-red-800'
};

const label = computed(() => statusLabels[props.status] || props.status);
const badgeClass = computed(() => statusColors[props.status] || 'bg-gray-100 text-gray-800');
</script>
