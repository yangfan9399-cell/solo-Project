<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">处置管理</h1>
            <p class="mt-1 text-sm text-gray-500">不合格样品处置列表</p>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
            <form @submit.prevent="search" class="flex gap-4 items-end">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                    <input
                        v-model="form.search"
                        type="text"
                        placeholder="样品编号、产品名称..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <button type="submit" class="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700">
                    搜索
                </button>
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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="sample in samples.data" :key="sample.id" :class="{ 'bg-yellow-50': sample.has_conflict }">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <span class="text-sm font-medium text-gray-900">{{ sample.sample_number }}</span>
                                <span v-if="sample.has_conflict" class="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    编号冲突
                                </span>
                            </div>
                            <div v-if="sample.has_conflict" class="text-xs text-yellow-700 mt-1">
                                冲突来源: {{ sample.conflict_sample?.sample_number }} - {{ sample.conflict_sample?.product_name }}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ sample.product_name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ sample.origin }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span v-if="sample.inspection_result" :class="sample.inspection_result.result === 'qualified' ? 'text-green-600' : 'text-red-600'" class="text-sm">
                                {{ sample.inspection_result.result === 'qualified' ? '合格' : sample.inspection_result.result === 'pesticide_exceeded' ? '农残超标' : '其他不合格' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <StatusBadge :status="sample.status" />
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                                v-if="sample.can_be_disposed"
                                :href="route('disposals.create', sample.id)"
                                class="text-orange-600 hover:text-orange-900"
                            >
                                创建处置建议
                            </Link>
                            <span v-if="sample.has_conflict" class="text-gray-400">存在编号冲突</span>
                            <Link
                                v-if="!sample.can_be_disposed && !sample.has_conflict"
                                :href="route('samples.show', sample.id)"
                                class="text-green-600 hover:text-green-900"
                            >
                                查看详情
                            </Link>
                        </td>
                    </tr>
                    <tr v-if="samples.data.length === 0">
                        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                            暂无待处置样品
                        </td>
                    </tr>
                </tbody>
            </table>
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
});

const form = useForm({
    search: props.filters.search || '',
});

const search = () => {
    router.get(route('disposals.index'), form.data(), { preserveState: true });
};
</script>
