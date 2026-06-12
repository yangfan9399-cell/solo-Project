<template>
    <div class="card">
        <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-slate-800">差异字段</h3>
            <span class="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">需处理</span>
        </div>
        <div v-if="caseData.blocking_reason" class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="text-xs font-semibold text-red-700 mb-1">阻断原因</div>
            <div class="text-sm text-red-900">{{ caseData.blocking_reason }}</div>
        </div>
        <div v-if="caseData.diff_fields && caseData.diff_fields.length" class="space-y-2">
            <div v-for="(field, idx) in caseData.diff_fields" :key="idx" class="diff-row">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold text-amber-800">{{ field.label }}</span>
                </div>
                <div class="grid grid-cols-3 gap-3 text-xs">
                    <div>
                        <span class="text-slate-500">预期：</span>
                        <span class="text-slate-800 font-medium">{{ formatValue(field.expected) }}</span>
                    </div>
                    <div>
                        <span class="text-slate-500">实际：</span>
                        <span class="text-red-700 font-medium">{{ formatValue(field.actual) }}</span>
                    </div>
                    <div v-if="field.diff !== undefined">
                        <span class="text-slate-500">差异：</span>
                        <span class="font-medium" :class="Number(field.diff) < 0 ? 'text-red-700' : 'text-green-700'">
                            {{ Number(field.diff) > 0 ? '+' : '' }}{{ field.diff }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="caseData.remedy_path" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="text-xs font-semibold text-blue-700 mb-1">补救路径</div>
            <div class="text-sm text-blue-900 whitespace-pre-line">{{ caseData.remedy_path }}</div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    caseData: { type: Object, required: true },
});

function formatValue(v) {
    if (typeof v === 'number') {
        return v.toLocaleString();
    }
    return v;
}
</script>
