<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">复盘查询</h1>
            <p class="mt-1 text-sm text-gray-500">按条件查询历史检测记录</p>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
            <form @submit.prevent="search" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">产地</label>
                    <select
                        v-model="form.origin"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="">全部产地</option>
                        <option v-for="origin in origins" :key="origin" :value="origin">{{ origin }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">问题类型</label>
                    <select
                        v-model="form.problem_type"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="">全部类型</option>
                        <option v-for="type in problem_types" :key="type.value" :value="type.value">{{ type.label }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">处置结果</label>
                    <select
                        v-model="form.disposal_result"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="">全部结果</option>
                        <option v-for="result in disposal_results" :key="result.value" :value="result.value">{{ result.label }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                    <input
                        v-model="form.date_from"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                    <input
                        v-model="form.date_to"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div class="flex items-end">
                    <button type="submit" class="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700">
                        查询
                    </button>
                </div>
            </form>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样品编号</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产地</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检测结果</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处置结果</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="sample in samples.data" :key="sample.id">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">{{ sample.sample_number }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ sample.product_name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ sample.origin }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span v-if="sample.inspection_result" :class="{
                                'text-green-600': sample.inspection_result.result === 'qualified',
                                'text-red-600': sample.inspection_result.result !== 'qualified',
                            }" class="text-sm">
                                {{ sample.inspection_result.result === 'qualified' ? '合格' : sample.inspection_result.result === 'pesticide_exceeded' ? '农残超标' : '其他不合格' }}
                            </span>
                            <span v-else class="text-gray-400 text-sm">未检测</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span v-if="sample.disposal" class="text-sm text-gray-600">
                                {{ sample.disposal.action_name }}
                            </span>
                            <span v-else class="text-gray-400 text-sm">未处置</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <StatusBadge :status="sample.status" />
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link :href="route('samples.show', sample.id)" class="text-green-600 hover:text-green-900">查看</Link>
                        </td>
                    </tr>
                    <tr v-if="samples.data.length === 0">
                        <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                            暂无符合条件的记录
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">共 {{ samples.total }} 条记录</span>
                </div>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { router, useForm, Link } from '@inertiajs/vue3';
import Layout from '../../Components/Layout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';

const props = defineProps({
    samples: Object,
    filters: Object,
    origins: Array,
    problem_types: Array,
    disposal_results: Array,
});

const form = useForm({
    origin: props.filters.origin || '',
    problem_type: props.filters.problem_type || '',
    disposal_result: props.filters.disposal_result || '',
    date_from: props.filters.date_from || '',
    date_to: props.filters.date_to || '',
});

const search = () => {
    router.get(route('review.index'), form.data(), { preserveState: true });
};
</script>
