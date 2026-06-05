<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">录入检测结果</h1>
            <p class="mt-1 text-sm text-gray-500">{{ sample.sample_number }} - {{ sample.product_name }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div class="flex justify-between">
                        <span class="text-gray-500">抽样员</span>
                        <span class="font-medium">{{ sample.sampler?.name }}</span>
                    </div>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg p-6">
                <form @submit.prevent="submit" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">检测日期 *</label>
                        <input
                            v-model="form.inspection_date"
                            type="date"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">检测指标</label>
                        <div class="space-y-3">
                            <div v-for="(indicator, index) in form.indicators" :key="index" class="grid grid-cols-4 gap-3 items-end">
                                <div class="col-span-1">
                                    <span class="text-sm text-gray-600">{{ indicator.name }}</span>
                                </div>
                                <div class="col-span-1">
                                    <span class="text-sm text-gray-500">限值: {{ indicator.limit }} {{ indicator.unit }}</span>
                                </div>
                                <div class="col-span-2">
                                    <input
                                        v-model.number="form.indicators[index].value"
                                        type="number"
                                        step="0.001"
                                        placeholder="检测值"
                                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        @change="autoDetermine"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">检测结果 *</label>
                        <select
                            v-model="form.result"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                            <option value="qualified">合格</option>
                            <option value="pesticide_exceeded">农残超标</option>
                            <option value="other_unqualified">其他不合格</option>
                        </select>
                        <p class="mt-1 text-xs text-gray-500">提示：输入检测值后可自动判断结果</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">检测结论 *</label>
                        <textarea
                            v-model="form.conclusion"
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="请输入详细的检测结论..."
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-4">
                        <Link :href="route('samples.show', sample.id)" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            取消
                        </Link>
                        <button
                            type="submit"
                            :disabled="processing"
                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            <span v-if="processing">提交中...</span>
                            <span v-else>提交检测结果</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { useForm, Link, router } from '@inertiajs/vue3';
import Layout from '../../Components/Layout.vue';

const props = defineProps({
    sample: Object,
    default_indicators: Array,
});

const form = useForm({
    inspection_date: new Date().toISOString().split('T')[0],
    indicators: JSON.parse(JSON.stringify(props.default_indicators)),
    result: 'qualified',
    conclusion: '',
    report_file: null,
});

const autoDetermine = async () => {
    try {
        const response = await fetch(route('inspections.determine-result'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
            },
            body: JSON.stringify({ indicators: form.indicators }),
        });
        const data = await response.json();
        form.result = data.result;
    } catch (e) {
        console.error(e);
    }
};

const submit = () => {
    form.post(route('inspections.store', props.sample.id));
};

const { processing } = form;
</script>
