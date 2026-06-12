<template>
    <div class="timeline">
        <div v-for="(node, idx) in nodes" :key="node.id" class="timeline-item">
            <div class="flex items-center gap-2 text-sm mb-1">
                <span class="font-medium text-slate-800">{{ nodeLabels[node.node_type] || node.node_type }}</span>
                <StatusBadge :status="node.status" />
                <span class="text-slate-400 text-xs ml-auto">{{ node.created_at }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{{ node.operator_name }}</span>
                <span>·</span>
                <span>{{ node.operator_role === 'approver' ? '审批负责人' : '业务专员' }}</span>
            </div>
            <p class="text-sm text-slate-700 leading-relaxed">{{ node.content }}</p>
            <div v-if="node.changes && Object.keys(node.changes).length" class="mt-2 p-2 bg-slate-50 rounded text-xs">
                <div class="font-medium text-slate-600 mb-1">变更字段：</div>
                <div v-for="(v, k) in node.changes" :key="k" class="text-slate-500">
                    {{ k }}: {{ JSON.stringify(v) }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue';

defineProps({
    nodes: { type: Array, required: true },
});

const nodeLabels = {
    report: '受理登记',
    accept: '受理确认',
    process: '处理提交',
    review: '复核审批',
    return: '退回补证',
    appeal: '当事人申诉',
    archive: '归档',
    reopen: '重新处理',
    update: '信息更新',
};
</script>
