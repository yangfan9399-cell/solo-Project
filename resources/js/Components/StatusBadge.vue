<template>
    <span 
        class="badge"
        :class="[
            statusClass,
            isAnomaly ? 'anomaly-badge' : ''
        ]"
    >
        <svg v-if="isAnomaly" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        {{ displayText }}
    </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String,
        required: true
    },
    statusLabel: {
        type: String,
        default: ''
    },
    anomalyType: {
        type: String,
        default: null
    },
    anomalyLabel: {
        type: String,
        default: null
    }
});

const isAnomaly = computed(() => !!props.anomalyType);

const statusClass = computed(() => {
    const map = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'reviewing': 'status-reviewing',
        'appealing': 'status-appealing',
        'archived': 'status-archived',
        'returned': 'status-returned',
    };
    return map[props.status] || 'status-pending';
});

const displayText = computed(() => {
    if (isAnomaly.value) {
        return props.anomalyLabel || props.anomalyType;
    }
    return props.statusLabel || props.status;
});
</script>
