<template>
    <Layout>
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">样品管理</h1>
                <p class="mt-1 text-sm text-gray-500">查看和管理所有检测样品</p>
            </div>
            <Link
                v-if="$page.props.auth.user.role === 'sampler' || $page.props.auth.user.role === 'reviewer'"
                :href="route('samples.create')"
                class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 active:bg-green-900 focus:outline-none focus:border-green-900 focus:ring focus:ring-green-300 disabled:opacity-25 transition"
            >
                新增样品
            </Link>
        </div>

        <div class="bg-white shadow rounded-lg p-6 mb-6">
            <form @submit.prevent="search" class="flex gap-4 items-end">
                <div class="flex-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
                    <input
                        v-model="form.search"
                        type="text"
                        placeholder="样品编号、产品名称、产地..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select
                        v-model="form.status"
                        class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                        <option value="">全部状态</option>
                        <option value="registered">已登记</option>
                        <option value="testing">检测中</option>
                        <option value="qualified">合格</option>
                        <option value="unqualified">不合格</option>
                        <option value="processing">处置中</option>
                        <option value="reinspection_applied">复检申请中</option>
                        <option value="returned">已退回</option>
                        <option value="archived">已归档</option>
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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样品编号</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产地</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">抽样员</th>
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
                            <div v-if="sample.conflict_sample" class="text-xs text-yellow-700 mt-1">
                                冲突来源: {{ sample.conflict_sample.sample_number }} - {{ sample.conflict_sample.product_name }}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">{{ sample.product_name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ sample.origin }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-500">{{ sample.sampler?.name }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <StatusBadge :status="sample.status" />
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link :href="route('samples.show', sample.id)" class="text-green-600 hover:text-green-900">查看</Link>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">共 {{ samples.total }} 条记录</span>
                    <div class="flex gap-2">
                        <button
                            v-if="samples.prev_page_url"
                            @click="changePage(samples.current_page - 1)"
                            class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                            上一页
                        </button>
                        <button
                            v-if="samples.next_page_url"
                            @click="changePage(samples.current_page + 1)"
                            class="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                            下一页
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { ref } from 'vue';
import { router, useForm, Link } from '@inertiajs/vue3';
import Layout from '../../Components/Layout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';

const props = defineProps({
    samples: Object,
    filters: Object,
});

const form = useForm({
    search: props.filters.search || '',
    status: props.filters.status || '',
});

const search = () => {
    router.get(route('samples.index'), form.data(), { preserveState: true });
};

const changePage = (page) => {
    router.get(route('samples.index'), { ...form.data(), page }, { preserveState: true });
};
</script>
