<template>
    <Layout>
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-gray-900">仪表盘</h1>
            <p class="mt-1 text-sm text-gray-500">农产品检测抽样与不合格处置系统</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center">
                                <span class="text-white text-xl font-bold">{{ statistics.total }}</span>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">总样品数</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">{{ statistics.total }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center">
                                <span class="text-white text-xl font-bold">{{ statistics.qualified }}</span>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">合格样品</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">{{ statistics.qualified }} ({{ statistics.qualified_rate }}%)</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-red-500 rounded-md flex items-center justify-center">
                                <span class="text-white text-xl font-bold">{{ statistics.unqualified }}</span>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">不合格样品</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">{{ statistics.unqualified }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
                                <span class="text-white text-xl font-bold">{{ statistics.processing }}</span>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">处置中</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">{{ statistics.processing }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">最近样品</h2>
                <div class="space-y-4">
                    <div v-for="sample in recentSamples" :key="sample.id" class="flex items-center justify-between py-3 border-b border-gray-200">
                        <div>
                            <Link :href="route('samples.show', sample.id)" class="font-medium text-green-600 hover:text-green-700">
                                {{ sample.sample_number }} - {{ sample.product_name }}
                            </Link>
                            <p class="text-sm text-gray-500">{{ sample.origin }}</p>
                        </div>
                        <StatusBadge :status="sample.status" />
                    </div>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">产地分布</h2>
                <div class="space-y-3">
                    <div v-for="origin in statistics.origins" :key="origin.origin" class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">{{ origin.origin }}</span>
                        <div class="flex items-center">
                            <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                    class="bg-green-500 h-2 rounded-full" 
                                    :style="{ width: `${(origin.count / statistics.total) * 100}%` }"
                                ></div>
                            </div>
                            <span class="text-sm font-medium text-gray-700">{{ origin.count }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import Layout from '../../Components/Layout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import { Link } from '@inertiajs/vue3';

defineProps({
    statistics: Object,
    recentSamples: Array,
});
</script>
