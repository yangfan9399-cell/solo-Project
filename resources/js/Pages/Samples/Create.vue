<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">新增样品</h1>
            <p class="mt-1 text-sm text-gray-500">登记新的检测样品</p>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
            <form @submit.prevent="submit" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">样品编号 *</label>
                        <input
                            v-model="form.sample_number"
                            type="text"
                            @blur="checkConflict"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            :class="{ 'border-red-500': conflictError }"
                            placeholder="如: AG-2024-001"
                        />
                        <div v-if="conflictError" class="mt-1 text-sm text-red-600">
                            样品编号已存在！请使用其他编号。
                        </div>
                        <div v-if="conflictSample" class="mt-1 text-sm text-red-600">
                            与样品 {{ conflictSample.sample_number }} - {{ conflictSample.product_name }} 冲突
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">产品名称 *</label>
                        <input
                            v-model="form.product_name"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="如: 有机大白菜"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">产地 *</label>
                        <input
                            v-model="form.origin"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="如: 山东省寿光市"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">批次号 *</label>
                        <input
                            v-model="form.batch_number"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="如: SC-2024-0115"
                        />
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">生产日期 *</label>
                        <input
                            v-model="form.production_date"
                            type="date"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">抽样数量 *</label>
                            <input
                                v-model="form.quantity"
                                type="number"
                                step="0.01"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">单位 *</label>
                            <select
                                v-model="form.unit"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="件">件</option>
                                <option value="箱">箱</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">样品来源补充</label>
                    <textarea
                        v-model="form.sample_source"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="补充说明样品的具体来源信息..."
                    ></textarea>
                </div>

                <div class="flex justify-end gap-4">
                    <Link :href="route('samples.index')" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        取消
                    </Link>
                    <button
                        type="submit"
                        :disabled="processing || conflictError"
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        <span v-if="processing">提交中...</span>
                        <span v-else>提交</span>
                    </button>
                </div>
            </form>
        </div>
    </Layout>
</template>

<script setup>
import { ref } from 'vue';
import { useForm, Link, router } from '@inertiajs/vue3';
import Layout from '../../Components/Layout.vue';

const form = useForm({
    sample_number: '',
    product_name: '',
    origin: '',
    batch_number: '',
    production_date: '',
    quantity: '',
    unit: 'kg',
    sample_source: '',
    evidence_photos: [],
});

const conflictError = ref(false);
const conflictSample = ref(null);

const checkConflict = async () => {
    if (!form.sample_number) {
        conflictError.value = false;
        conflictSample.value = null;
        return;
    }

    try {
        const response = await fetch(route('samples.check-conflict') + '?sample_number=' + encodeURIComponent(form.sample_number));
        const data = await response.json();
        conflictError.value = data.has_conflict;
        conflictSample.value = data.conflict_sample;
    } catch (e) {
        console.error(e);
    }
};

const submit = () => {
    form.post(route('samples.store'));
};

const { processing } = form;
</script>
