<template>
    <AppLayout title="案件列表" subtitle="所有借还清点与遗失追责记录">
        <div class="space-y-4">
            <div class="card">
                <div class="flex items-center gap-4">
                    <input
                        v-model="search"
                        type="text"
                        placeholder="搜索案件编号、标题、责任人..."
                        class="input flex-1"
                        @input="debouncedFilter"
                    />
                    <select v-model="statusFilter" class="select w-40" @change="applyFilter">
                        <option value="">全部状态</option>
                        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <select v-model="typeFilter" class="select w-40" @change="applyFilter">
                        <option value="">全部类型</option>
                        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <button class="btn btn-secondary" @click="resetFilter">重置</button>
                </div>
            </div>

            <div class="grid grid-cols-5 gap-3 mb-2">
                <div class="card text-center cursor-pointer hover:shadow-md transition" :class="{ 'ring-2 ring-blue-500': !statusFilter }" @click="statusFilter=''; applyFilter()">
                    <div class="text-lg font-bold text-slate-800">{{ stats.total }}</div>
                    <div class="text-xs text-slate-500">全部</div>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-md transition" :class="{ 'ring-2 ring-blue-500': statusFilter==='pending' }" @click="statusFilter='pending'; applyFilter()">
                    <div class="text-lg font-bold text-slate-600">{{ stats.pending }}</div>
                    <div class="text-xs text-slate-500">待受理</div>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-md transition" :class="{ 'ring-2 ring-blue-500': statusFilter==='processing' }" @click="statusFilter='processing'; applyFilter()">
                    <div class="text-lg font-bold text-blue-600">{{ stats.processing }}</div>
                    <div class="text-xs text-slate-500">处理中</div>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-md transition" :class="{ 'ring-2 ring-blue-500': statusFilter==='blocked' }" @click="statusFilter='blocked'; applyFilter()">
                    <div class="text-lg font-bold text-red-600">{{ stats.blocked }}</div>
                    <div class="text-xs text-slate-500">异常/申诉</div>
                </div>
                <div class="card text-center cursor-pointer hover:shadow-md transition" :class="{ 'ring-2 ring-blue-500': statusFilter==='archived' }" @click="statusFilter='archived'; applyFilter()">
                    <div class="text-lg font-bold text-green-600">{{ stats.archived }}</div>
                    <div class="text-xs text-slate-500">已归档</div>
                </div>
            </div>

            <div class="card">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-xs text-slate-500 border-b">
                            <th class="pb-3 font-medium">案件编号</th>
                            <th class="pb-3 font-medium">标题/摘要</th>
                            <th class="pb-3 font-medium">类型</th>
                            <th class="pb-3 font-medium">状态</th>
                            <th class="pb-3 font-medium">责任人</th>
                            <th class="pb-3 font-medium">事发时间</th>
                            <th class="pb-3 font-medium">异常</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="c in cases.data"
                            :key="c.id"
                            class="border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                            @click="router.visit(route('cases.show', c.id))"
                        >
                            <td class="py-3 align-top">
                                <div class="font-mono text-xs text-slate-600 font-medium">{{ c.case_number }}</div>
                                <div class="text-xs text-slate-400 mt-0.5">{{ getSummary(c) }}</div>
                            </td>
                            <td class="py-3 align-top">
                                <div class="font-medium text-slate-800">{{ c.title }}</div>
                                <div class="text-xs text-slate-500 mt-1 line-clamp-2">{{ c.source_description }}</div>
                                <div v-if="c.is_archived" class="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                                    📦 已归档只读
                                </div>
                            </td>
                            <td class="py-3 align-top"><TypeBadge :type="c.type" /></td>
                            <td class="py-3 align-top"><StatusBadge :status="c.status" /></td>
                            <td class="py-3 align-top">
                                <div class="text-slate-700">{{ c.current_responsible }}</div>
                                <div class="text-xs text-slate-400 mt-0.5">{{ c.tools?.length || 0 }} 件工具</div>
                                <div v-if="c.tools && c.tools.length" class="text-xs text-slate-500 mt-0.5">
                                    数量 {{ c.tools.reduce((s,t) => s + Number(t.actual_quantity), 0) }}/{{ c.tools.reduce((s,t) => s + Number(t.expected_quantity), 0) }}
                                    · ¥{{ c.tools.reduce((s,t) => s + Number(t.actual_amount), 0).toLocaleString() }}/{{ c.tools.reduce((s,t) => s + Number(t.expected_amount), 0).toLocaleString() }}
                                </div>
                            </td>
                            <td class="py-3 align-top text-slate-500 text-xs">{{ c.incident_at }}</td>
                            <td class="py-3 align-top">
                                <div v-if="hasBlocking(c)" class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                                    ⚠ 存在异常
                                </div>
                                <div v-else class="text-xs text-slate-400">—</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="mt-4 flex items-center justify-between text-sm">
                    <div class="text-slate-500 text-xs">共 {{ cases.total }} 条记录</div>
                    <div class="flex items-center gap-2">
                        <button
                            class="btn btn-secondary text-xs"
                            :disabled="!cases.prev_page_url"
                            @click="goToPage(cases.current_page - 1)"
                        >上一页</button>
                        <span class="text-slate-600">{{ cases.current_page }} / {{ cases.last_page }}</span>
                        <button
                            class="btn btn-secondary text-xs"
                            :disabled="!cases.next_page_url"
                            @click="goToPage(cases.current_page + 1)"
                        >下一页</button>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { router } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import TypeBadge from '../../Components/TypeBadge.vue';

const props = defineProps({
    cases: { type: Object, required: true },
    filters: { type: Object, default: () => ({}) },
    stats: { type: Object, required: true },
    statusOptions: { type: Array, required: true },
    typeOptions: { type: Array, required: true },
});

const search = ref(props.filters.search || '');
const statusFilter = ref(props.filters.status || '');
const typeFilter = ref(props.filters.type || '');

let timer = null;
function debouncedFilter() {
    clearTimeout(timer);
    timer = setTimeout(applyFilter, 300);
}

function applyFilter() {
    router.get(route('cases.index'), {
        search: search.value,
        status: statusFilter.value,
        type: typeFilter.value,
    }, { preserveState: true });
}

function resetFilter() {
    search.value = '';
    statusFilter.value = '';
    typeFilter.value = '';
    applyFilter();
}

function goToPage(page) {
    router.get(route('cases.index'), {
        page,
        search: search.value,
        status: statusFilter.value,
        type: typeFilter.value,
    }, { preserveState: true });
}

function hasBlocking(c) {
    return c.blocking_reason || (c.diff_fields && c.diff_fields.length);
}

function getSummary(c) {
    const typeLabel = {
        normal: '正常归档', code_conflict: '编号冲突',
        quantity_diff: '数量/金额差异', appeal: '当事人申诉',
    }[c.type] || c.type;
    let s = `${typeLabel}`;
    if (hasBlocking(c)) s += ' · 存在异常';
    if (c.tools && c.tools.length) {
        const qtyDiff = c.tools.reduce((s,t) => s + Number(t.actual_quantity), 0) - c.tools.reduce((s,t) => s + Number(t.expected_quantity), 0);
        const amtDiff = c.tools.reduce((s,t) => s + Number(t.actual_amount), 0) - c.tools.reduce((s,t) => s + Number(t.expected_amount), 0);
        if (qtyDiff !== 0 || amtDiff !== 0) {
            const parts = [];
            if (qtyDiff !== 0) parts.push(`数量差异${qtyDiff > 0 ? '+' : ''}${qtyDiff}`);
            if (amtDiff !== 0) parts.push(`金额差异${amtDiff > 0 ? '+' : ''}¥${amtDiff.toLocaleString()}`);
            s += ' · ' + parts.join('、');
        }
    }
    return s;
}
</script>
