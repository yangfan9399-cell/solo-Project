<template>
    <div class="timeline">
        <div v-for="(node, index) in nodes" :key="node.id" class="timeline-item" :class="{ 'timeline-item-inactive': !node.is_active }">
            <div class="timeline-dot" :class="dotClass(node)"></div>
            <div class="timeline-content card p-4">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <div class="flex items-center space-x-2">
                            <span class="font-medium text-gray-900">{{ node.type_label }}</span>
                            <span v-if="!node.is_active" class="text-xs text-gray-400">(已失效)</span>
                        </div>
                        <p class="text-sm text-gray-500">
                            {{ node.operator?.name || '系统' }} · {{ formatDateTime(node.operated_at) }}
                        </p>
                    </div>
                    <StatusBadge 
                        v-if="node.status"
                        :status="node.status"
                        :statusLabel="node.status_label"
                    />
                </div>
                
                <div v-if="node.business_note || node.site_description || node.evidence_note || node.review_opinion" class="text-sm text-gray-700 mb-2 space-y-1">
                    <div v-if="node.business_note">
                        <span class="text-xs text-gray-500">业务记录：</span>{{ node.business_note }}
                    </div>
                    <div v-if="node.site_description">
                        <span class="text-xs text-gray-500">现场说明：</span>{{ node.site_description }}
                    </div>
                    <div v-if="node.evidence_note">
                        <span class="text-xs text-gray-500">证据说明：</span>{{ node.evidence_note }}
                    </div>
                    <div v-if="node.review_opinion">
                        <span class="text-xs text-gray-500">审批意见：</span>{{ node.review_opinion }}
                    </div>
                </div>

                <div v-if="node.changes && node.changes.length > 0" class="mb-2">
                    <p class="text-xs font-medium text-gray-500 mb-1">变更内容：</p>
                    <div class="bg-gray-50 rounded p-2 text-xs space-y-1">
                        <div v-for="(change, idx) in node.changes" :key="idx" class="flex items-center space-x-2">
                            <span class="text-gray-500">{{ change.field_label || change.field }}:</span>
                            <span class="text-red-500 line-through">{{ formatValue(change.old_value || change.old) }}</span>
                            <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span class="text-green-600 font-medium">{{ formatValue(change.new_value || change.new) }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="node.snapshot && showSnapshot" class="mt-3">
                    <button @click="toggleSnapshot(node)" class="text-xs text-blue-600 hover:text-blue-800">
                        {{ node.showSnapshot ? '收起快照' : '查看完整快照' }}
                    </button>
                    <div v-if="node.showSnapshot" class="mt-2 bg-gray-50 rounded p-3 text-xs overflow-x-auto">
                        <pre class="whitespace-pre-wrap">{{ JSON.stringify(node.snapshot, null, 2) }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import StatusBadge from './StatusBadge.vue';

defineProps({
    nodes: {
        type: Array,
        required: true
    },
    showSnapshot: {
        type: Boolean,
        default: false
    }
});

const dotClass = (node) => {
    const typeClass = {
        'receive': 'bg-blue-500',
        'process': 'bg-yellow-500',
        'review': 'bg-purple-500',
        'archive': 'bg-green-500',
        'reopen': 'bg-orange-500',
        'return': 'bg-red-500',
        'appeal': 'bg-indigo-500',
    };
    return typeClass[node.type || node.node_type] || 'bg-gray-400';
};

const formatDateTime = (datetime) => {
    if (!datetime) return '';
    const d = new Date(datetime);
    return d.toLocaleString('zh-CN');
};

const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

const toggleSnapshot = (node) => {
    node.showSnapshot = !node.showSnapshot;
};
</script>
