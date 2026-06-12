<template>
    <AppLayout title="看板统计" subtitle="全局案件汇总与多维分析">
        <div class="space-y-6">
            <div class="grid grid-cols-5 gap-4">
                <div class="card cursor-pointer hover:shadow-md transition" @click="goToList()">
                    <div class="text-xs text-slate-500">案件总数</div>
                    <div class="text-2xl font-bold text-slate-800 mt-1">{{ stats.total }}</div>
                    <div class="text-xs text-slate-400 mt-1">全部记录</div>
                </div>
                <div class="card cursor-pointer hover:shadow-md transition" @click="goToList({ status: 'pending' })">
                    <div class="text-xs text-slate-500">待受理</div>
                    <div class="text-2xl font-bold text-slate-600 mt-1">{{ stats.pending }}</div>
                    <div class="text-xs text-slate-400 mt-1">点击查看</div>
                </div>
                <div class="card cursor-pointer hover:shadow-md transition" @click="goToList({ status: 'processing' })">
                    <div class="text-xs text-slate-500">处理中</div>
                    <div class="text-2xl font-bold text-blue-600 mt-1">{{ stats.processing }}</div>
                    <div class="text-xs text-slate-400 mt-1">处理/复核阶段</div>
                </div>
                <div class="card cursor-pointer hover:shadow-md transition" @click="goToList({ status: 'blocked' })">
                    <div class="text-xs text-slate-500">异常/申诉</div>
                    <div class="text-2xl font-bold text-red-600 mt-1">{{ stats.blocked }}</div>
                    <div class="text-xs text-slate-400 mt-1">阻断/退回/申诉</div>
                </div>
                <div class="card cursor-pointer hover:shadow-md transition" @click="goToList({ status: 'archived' })">
                    <div class="text-xs text-slate-500">已归档</div>
                    <div class="text-2xl font-bold text-green-600 mt-1">{{ stats.archived }}</div>
                    <div class="text-xs text-slate-400 mt-1">结案封存</div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6">
                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">按案件类型分布</h3>
                    <div class="space-y-3">
                        <div
                            v-for="item in stats.byType"
                            :key="item.type"
                            class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                            @click="goToList({ type: item.type })"
                        >
                            <div class="flex items-center gap-3">
                                <TypeBadge :type="item.type" />
                                <span class="text-sm text-slate-700">{{ item.name }}</span>
                            </div>
                            <span class="text-lg font-bold text-slate-800">{{ item.value }}</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">按处理状态分布</h3>
                    <div class="space-y-2">
                        <div
                            v-for="item in stats.byStatus"
                            :key="item.status"
                            class="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer transition"
                            @click="goToList({ status: item.status })"
                        >
                            <StatusBadge :status="item.status" />
                            <span class="text-sm font-medium text-slate-700">{{ item.value }} 件</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">工具清点汇总</h3>
                    <div class="space-y-4">
                        <div class="p-3 bg-slate-50 rounded-lg">
                            <div class="text-xs text-slate-500">工具数量</div>
                            <div class="flex items-end gap-3 mt-1">
                                <span class="text-xl font-bold text-slate-800">{{ stats.totalToolsActual }}</span>
                                <span class="text-xs text-slate-400">/ {{ stats.totalToolsExpected }} 预期</span>
                                <span
                                    class="text-xs font-medium"
                                    :class="stats.toolsDiff < 0 ? 'text-red-600' : 'text-green-600'"
                                >
                                    差异 {{ stats.toolsDiff > 0 ? '+' : '' }}{{ stats.toolsDiff }}
                                </span>
                            </div>
                        </div>
                        <div class="p-3 bg-slate-50 rounded-lg">
                            <div class="text-xs text-slate-500">金额合计（元）</div>
                            <div class="flex items-end gap-3 mt-1">
                                <span class="text-xl font-bold text-slate-800">¥{{ stats.totalAmountActual?.toLocaleString() }}</span>
                                <span class="text-xs text-slate-400">/ ¥{{ stats.totalAmountExpected?.toLocaleString() }}</span>
                                <span
                                    class="text-xs font-medium"
                                    :class="stats.amountDiff < 0 ? 'text-red-600' : 'text-green-600'"
                                >
                                    差异 ¥{{ stats.amountDiff > 0 ? '+' : '' }}{{ stats.amountDiff?.toLocaleString() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-slate-800">最近案件动态</h3>
                    <Link :href="route('cases.index')" class="text-sm text-blue-600 hover:underline">查看全部 →</Link>
                </div>
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-xs text-slate-500 border-b">
                            <th class="pb-2 font-medium">案件编号</th>
                            <th class="pb-2 font-medium">标题</th>
                            <th class="pb-2 font-medium">类型</th>
                            <th class="pb-2 font-medium">状态</th>
                            <th class="pb-2 font-medium">当前责任人</th>
                            <th class="pb-2 font-medium">最近更新</th>
                            <th class="pb-2 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in recentCases" :key="c.id" class="border-b last:border-0 hover:bg-slate-50">
                            <td class="py-3 font-mono text-xs text-slate-600">{{ c.case_number }}</td>
                            <td class="py-3 text-slate-800">{{ c.title }}</td>
                            <td class="py-3"><TypeBadge :type="c.type" /></td>
                            <td class="py-3"><StatusBadge :status="c.status" /></td>
                            <td class="py-3 text-slate-600">{{ c.current_responsible }}</td>
                            <td class="py-3 text-slate-500 text-xs">{{ c.updated_at }}</td>
                            <td class="py-3">
                                <Link :href="route('cases.show', c.id)" class="text-blue-600 hover:underline text-xs">查看</Link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { router, Link } from '@inertiajs/vue3';
import AppLayout from '../Layouts/AppLayout.vue';
import StatusBadge from '../Components/StatusBadge.vue';
import TypeBadge from '../Components/TypeBadge.vue';

defineProps({
    stats: { type: Object, required: true },
    recentCases: { type: Array, required: true },
});

function goToList(filter = {}) {
    router.get(route('cases.index'), filter);
}
</script>
