<template>
    <span class="type-badge" :class="'type-' + color">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    type: { type: String, required: true },
});

const map = {
    normal: { label: '正常归档', color: 'green' },
    code_conflict: { label: '编号冲突', color: 'red' },
    quantity_diff: { label: '数量/金额差异', color: 'orange' },
    appeal: { label: '当事人申诉', color: 'purple' },
};

const label = computed(() => map[props.type]?.label || props.type);
const color = computed(() => map[props.type]?.color || 'gray');
</script>
