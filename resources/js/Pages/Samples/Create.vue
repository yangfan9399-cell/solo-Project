<template>
    <Layout>
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">新增样品</h1>
            <p class="mt-1 text-sm text-gray-500">登记新的检测样品</p>
        </div>

        <div v-if="conflictSample" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div class="flex items-start">
                <svg class="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <div>
                    <h3 class="text-sm font-medium text-yellow-800">检测到编号冲突</h3>
                    <p class="text-sm text-yellow-700 mt-1">
                        已存在相同编号的样品：<span class="font-medium">{{ conflictSample.sample_number }} - {{ conflictSample.product_name }}</span>（产地：{{ conflictSample.origin }}）
                    </p>
                    <p class="text-sm text-yellow-600 mt-1">
                        继续提交将记录冲突来源，该样品在冲突解决前无法进行处置。
                    </p>
                </div>
            </div>
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
                            :class="{ 'border-yellow-500': conflictSample }"
                            placeholder="如: AG-2024-001"
                        />
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
                        :disabled="processing"
                        class="px-4 py-2 rounded-md text-white hover:opacity-90 disabled:opacity-50"
                        :class="conflictSample ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'"
                    >
                        <span v-if="processing">提交中...</span>
                        <span v-else-if="conflictSample">继续提交（记录冲突）</span>
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

const conflictSample = ref(null);

const checkConflict = async () => {
    if (!form.sample_number) {
        conflictSample.value = null;
        return;
    }

    try {
        const response = await fetch(route('samples.check-conflict') + '?sample_number=' + encodeURIComponent(form.sample_number));
        const data = await response.json();
        conflictSample.value = data.has_conflict ? data.conflict_sample : null;
    } catch (e) {
        console.error(e);
    }
};

const submit = () => {
    form.post(route('samples.store'));
};

const { processing } = form;
</script>
