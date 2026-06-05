<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">创建处置建议</h1>
            <p class="mt-1 text-sm text-gray-500">{{ sample.sample_number }} - {{ sample.product_name }}</p>
        </div>

        <div v-if="!sample.canBeDisposed" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p class="text-red-700">
                {{ sample.conflict_note || '样品当前状态不允许处置' }}
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">样品信息</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-500">样品编号</span>
                            <span class="font-medium">{{ sample.sample_number }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">产品名称</span>
                            <span class="font-medium">{{ sample.product_name }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">产地</span>
                            <span class="font-medium">{{ sample.origin }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">批次号</span>
                            <span class="font-medium">{{ sample.batch_number }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="sample.inspection_result" class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">检测结果</h2>
                    <div class="mb-3">
                        <span :class="sample.inspection_result.result === 'qualified' ? 'text-green-600' : 'text-red-600'" class="font-medium">
                            {{ sample.inspection_result.result === 'qualified' ? '合格' : sample.inspection_result.result === 'pesticide_exceeded' ? '农残超标' : '其他不合格' }}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600">{{ sample.inspection_result.conclusion }}</p>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg p-6">
                <form @submit.prevent="submit" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">处置动作 *</label>
                        <select
                            v-model="form.action"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                            <option v-for="action in actions" :key="action.value" :value="action.value">
                                {{ action.label }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">处置建议 *</label>
                        <textarea
                            v-model="form.suggestion"
                            rows="5"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="请输入详细的处置建议..."
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-4">
                        <Link :href="route('samples.show', sample.id)" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            取消
                        </Link>
                        <button
                            type="submit"
                            :disabled="processing || !sample.canBeDisposed"
                            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                        >
                            <span v-if="processing">提交中...</span>
                            <span v-else>提交处置建议</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { useForm, Link } from '@inertiajs/vue3';
import Layout from '../../Components/Layout.vue';

const props = defineProps({
    sample: Object,
    actions: Array,
});

const form = useForm({
    action: 'destroy',
    suggestion: '',
});

const submit = () => {
    form.post(route('disposals.store', props.sample.id));
};

const { processing } = form;
</script>
