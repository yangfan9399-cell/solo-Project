<template>
    <span :class="badgeClass" class="px-2 py-1 text-xs font-medium rounded">
        {{ statusText }}
    </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String,
        required: true,
    },
});

const statusMap = {
    registered: { text: '已登记', class: 'bg-blue-100 text-blue-800' },
    testing: { text: '检测中', class: 'bg-yellow-100 text-yellow-800' },
    qualified: { text: '合格', class: 'bg-green-100 text-green-800' },
    unqualified: { text: '不合格', class: 'bg-red-100 text-red-800' },
    processing: { text: '处置中', class: 'bg-orange-100 text-orange-800' },
    reinspection_applied: { text: '复检申请中', class: 'bg-purple-100 text-purple-800' },
    returned: { text: '已退回', class: 'bg-gray-100 text-gray-800' },
    archived: { text: '已归档', class: 'bg-gray-100 text-gray-800' },
};

const statusText = computed(() => statusMap[props.status]?.text || '未知');

const badgeClass = computed(() => statusMap[props.status]?.class || 'bg-gray-100 text-gray-800');
</script>
