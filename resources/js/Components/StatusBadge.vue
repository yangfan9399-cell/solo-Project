<template>
    <span class="status-badge" :class="'status-' + color">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: { type: String, required: true },
});

const map = {
    pending: { label: '待受理', color: 'gray' },
    processing: { label: '处理中', color: 'blue' },
    reviewing: { label: '复核中', color: 'yellow' },
    returned: { label: '退回补证', color: 'orange' },
    blocked: { label: '异常阻断', color: 'red' },
    appealing: { label: '申诉中', color: 'purple' },
    archived: { label: '已归档', color: 'green' },
};

const label = computed(() => map[props.status]?.label || props.status);
const color = computed(() => map[props.status]?.color || 'gray');
</script>
