<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">复检申请</h1>
            <p class="mt-1 text-sm text-gray-500">复检申请列表</p>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
            <form @submit.prevent="search" class="flex gap-4 items-end">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select
                        v-model="form.status"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="">全部状态</option>
                        <option value="pending">待审核</option>
                        <option value="approved">已批准</option>
                        <option value="rejected">已拒绝</option>
                        <option value="completed">已完成</option>
                    </select>
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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样品</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请原因</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请时间</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="request in requests.data" :key="request.id">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <Link :href="route('samples.show', request.sample.id)" class="text-sm font-medium text-green-600 hover:text-green-900">
                                {{ request.sample.sample_number }} - {{ request.sample.product_name }}
                            </Link>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ request.requester?.name }}</div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-500 max-w-xs truncate">{{ request.reason }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="{
                                'bg-yellow-100 text-yellow-800': request.status === 'pending',
                                'bg-green-100 text-green-800': request.status === 'approved',
                                'bg-red-100 text-red-800': request.status === 'rejected',
                                'bg-blue-100 text-blue-800': request.status === 'completed',
                            }" class="px-2 py-1 text-xs font-medium rounded">
                                {{ request.status_name }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ request.created_at }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link :href="route('samples.show', request.sample.id)" class="text-gray-600 hover:text-gray-900">
                                查看详情
                            </Link>
                        </td>
                    </tr>
                    <tr v-if="requests.data.length === 0">
                        <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                            暂无复检申请
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

const props = defineProps({
    requests: Object,
    filters: Object,
});

const form = useForm({
    status: props.filters.status || '',
});

const search = () => {
    router.get(route('reinspections.index'), form.data(), { preserveState: true });
};
</script>
