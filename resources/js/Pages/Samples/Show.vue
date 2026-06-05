<template>
    <Layout>
        <div class="mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900">样品详情</h1>
                    <p class="mt-1 text-sm text-gray-500">{{ sample.sample_number }} - {{ sample.product_name }}</p>
                </div>
                <div class="flex gap-2">
                    <Link :href="route('samples.index')" class="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                        返回列表
                    </Link>
                    <Link
                        v-if="(sample.status === 'registered' || sample.status === 'reinspection_applied') && ($page.props.auth.user.role === 'inspector' || $page.props.auth.user.role === 'reviewer')"
                        :href="route('inspections.create', sample.id)"
                        class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                        录入检测结果
                    </Link>
                    <Link
                        v-if="sample.can_be_disposed && $page.props.auth.user.role === 'reviewer'"
                        :href="route('disposals.create', sample.id)"
                        class="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
                    >
                        创建处置建议
                    </Link>
                    <Link
                        v-if="sample.status === 'unqualified' && !sample.has_conflict && ($page.props.auth.user.role === 'sampler' || $page.props.auth.user.role === 'reviewer')"
                        :href="route('reinspections.create', sample.id)"
                        class="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                    >
                        申请复检
                    </Link>
                </div>
            </div>
        </div>

        <div v-if="sample.conflict_note" class="mb-6">
            <ConflictAlert :conflict-note="sample.conflict_note" :conflict-sample="sample.conflict_sample" />
            
            <div v-if="$page.props.auth.user.role === 'reviewer'" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h3 class="text-sm font-medium text-yellow-800 mb-2">解决编号冲突</h3>
                <form @submit.prevent="resolveConflict" class="flex gap-2 items-end">
                    <div>
                        <label class="block text-xs text-yellow-700 mb-1">新样品编号</label>
                        <input
                            v-model="newSampleNumber"
                            type="text"
                            class="px-3 py-2 border border-yellow-300 rounded-md text-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                    <button type="submit" class="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700">
                        更新编号
                    </button>
                </form>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">基本信息</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-sm text-gray-500">样品编号</label>
                            <p class="font-medium">{{ sample.sample_number }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">状态</label>
                            <p><StatusBadge :status="sample.status" /></p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">产品名称</label>
                            <p class="font-medium">{{ sample.product_name }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">产地</label>
                            <p class="font-medium">{{ sample.origin }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">批次号</label>
                            <p class="font-medium">{{ sample.batch_number }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">生产日期</label>
                            <p class="font-medium">{{ sample.production_date }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">抽样数量</label>
                            <p class="font-medium">{{ sample.quantity }} {{ sample.unit }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">抽样员</label>
                            <p class="font-medium">{{ sample.sampler?.name }}</p>
                        </div>
                    </div>

                    <div v-if="sample.sample_source" class="mt-4 pt-4 border-t border-gray-200">
                        <label class="text-sm text-gray-500">样品来源补充</label>
                        <p class="font-medium mt-1">{{ sample.sample_source }}</p>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <label class="text-sm text-gray-500">取证照片/报告</label>
                        <div v-if="sample.evidence_photos && sample.evidence_photos.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            <div
                                v-for="(photo, index) in sample.evidence_photos"
                                :key="index"
                                class="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                            >
                                <img
                                    :src="photo"
                                    :alt="`取证照片 ${index + 1}`"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div v-else class="mt-2 flex items-center text-gray-400">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span class="text-sm">暂无取证照片</span>
                        </div>
                    </div>
                </div>

                <div v-if="sample.inspection_results && sample.inspection_results.length > 0" class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">检测结果</h2>
                    <div v-for="(result, index) in sample.inspection_results" :key="result.id" class="mb-4 last:mb-0">
                        <div class="flex justify-between items-center mb-3">
                            <span class="font-medium">检测记录 {{ index + 1 }}</span>
                            <span :class="result.result === 'qualified' ? 'text-green-600' : 'text-red-600'" class="font-medium">
                                {{ result.result === 'qualified' ? '合格' : result.result === 'pesticide_exceeded' ? '农残超标' : '其他不合格' }}
                            </span>
                        </div>
                        <div class="bg-gray-50 rounded-md p-4">
                            <p class="text-sm text-gray-600 mb-2">
                                检测员: {{ result.inspector?.name }} | 检测日期: {{ result.inspection_date }}
                            </p>
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-gray-500">
                                        <th class="pb-2">检测指标</th>
                                        <th class="pb-2">限值</th>
                                        <th class="pb-2">检测值</th>
                                        <th class="pb-2">结果</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="indicator in result.indicators" :key="indicator.name" class="border-t border-gray-200">
                                        <td class="py-2">{{ indicator.name }}</td>
                                        <td class="py-2">{{ indicator.limit }} {{ indicator.unit }}</td>
                                        <td class="py-2">{{ indicator.value }} {{ indicator.unit }}</td>
                                        <td class="py-2">
                                            <span :class="indicator.value <= indicator.limit ? 'text-green-600' : 'text-red-600'">
                                                {{ indicator.value <= indicator.limit ? '合格' : '超标' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <p class="mt-3 text-sm font-medium">检测结论: {{ result.conclusion }}</p>
                        </div>
                    </div>
                </div>

                <div v-if="sample.disposal" class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">处置信息</h2>
                    <div class="space-y-3">
                        <div>
                            <label class="text-sm text-gray-500">处置动作</label>
                            <p class="font-medium">{{ sample.disposal.action_name }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">处置建议</label>
                            <p class="font-medium">{{ sample.disposal.suggestion }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">复核人</label>
                            <p class="font-medium">{{ sample.disposal.reviewer?.name }}</p>
                        </div>
                        <div>
                            <label class="text-sm text-gray-500">状态</label>
                            <p class="font-medium">{{ sample.disposal.status_name }}</p>
                        </div>
                        <div v-if="sample.disposal.decision_note">
                            <label class="text-sm text-gray-500">复核决定备注</label>
                            <p class="font-medium">{{ sample.disposal.decision_note }}</p>
                        </div>
                    </div>

                    <div v-if="sample.disposal.status === 'pending' && $page.props.auth.user.role === 'reviewer'" class="mt-4 pt-4 border-t border-gray-200">
                        <h3 class="text-sm font-medium text-gray-700 mb-3">复核操作</h3>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">复核备注</label>
                                <textarea
                                    v-model="decisionNote"
                                    rows="2"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                ></textarea>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    @click="approveDisposal"
                                    class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                >
                                    批准处置
                                </button>
                                <button
                                    @click="returnToSampler"
                                    class="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700"
                                >
                                    退回抽样员
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="sample.reinspection_requests && sample.reinspection_requests.length > 0" class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">复检申请</h2>
                    <div v-for="request in sample.reinspection_requests" :key="request.id" class="mb-4 last:mb-0">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium">申请时间: {{ request.created_at }}</span>
                            <span :class="{
                                'text-yellow-600': request.status === 'pending',
                                'text-green-600': request.status === 'approved',
                                'text-red-600': request.status === 'rejected',
                                'text-blue-600': request.status === 'completed',
                            }" class="font-medium">
                                {{ request.status_name }}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600">申请人: {{ request.requester?.name }}</p>
                        <p class="text-sm">申请原因: {{ request.reason }}</p>
                        <div v-if="request.review_note" class="mt-2 text-sm">
                            <p>审核意见: {{ request.review_note }}</p>
                            <p class="text-gray-500">审核人: {{ request.reviewer?.name }}</p>
                        </div>

                        <div v-if="request.status === 'pending' && $page.props.auth.user.role === 'reviewer'" class="mt-3 flex gap-2">
                            <button
                                @click="approveReinspection(request)"
                                class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                                批准
                            </button>
                            <button
                                @click="rejectReinspection(request)"
                                class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                                拒绝
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">状态历史</h2>
                    <div v-if="sample.status_history && sample.status_history.length > 0" class="space-y-4">
                        <div v-for="history in sample.status_history" :key="history.id" class="flex gap-4">
                            <div class="flex flex-col items-center">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <div class="w-0.5 h-full bg-gray-200"></div>
                            </div>
                            <div class="flex-1 pb-4">
                                <div class="flex justify-between">
                                    <span class="font-medium text-sm">{{ history.new_status_name }}</span>
                                    <span class="text-xs text-gray-500">{{ history.created_at }}</span>
                                </div>
                                <p class="text-sm text-gray-600">
                                    操作人:
                                    <span v-if="history.user?.name">{{ history.user.name }}</span>
                                    <span v-else class="text-gray-400">未记录</span>
                                </p>
                                <p v-if="history.note" class="text-sm text-gray-500">{{ history.note }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-else class="flex flex-col items-center justify-center py-8 text-gray-400">
                        <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-sm">暂无状态历史记录</span>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div v-if="$page.props.auth.user.role === 'sampler' || $page.props.auth.user.role === 'reviewer'" class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">补充来源信息</h2>
                    <form @submit.prevent="updateSource">
                        <textarea
                            v-model="sourceText"
                            rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            placeholder="输入补充信息..."
                        ></textarea>
                        <button type="submit" class="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                            保存
                        </button>
                    </form>
                </div>

                <div v-if="sample.status === 'processing' && sample.disposal && sample.disposal.status === 'approved' && $page.props.auth.user.role === 'reviewer'" class="bg-white shadow rounded-lg p-6">
                    <h2 class="text-lg font-medium text-gray-900 mb-4">归档操作</h2>
                    <button
                        @click="archiveSample"
                        class="w-full px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                    >
                        归档此样品
                    </button>
                </div>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { ref } from 'vue';
import { router, Link } from '@inertiajs/vue3';
import Layout from '../../Components/Layout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import ConflictAlert from '../../Components/ConflictAlert.vue';

const props = defineProps({
    sample: Object,
});

const sourceText = ref('');
const decisionNote = ref('');
const newSampleNumber = ref('');
const rejectNote = ref('');

const updateSource = () => {
    router.post(route('samples.update-source', props.sample.id), {
        sample_source: sourceText.value,
    });
    sourceText.value = '';
};

const approveDisposal = () => {
    router.post(route('disposals.approve', props.sample.disposal.id), {
        decision_note: decisionNote.value,
    });
};

const returnToSampler = () => {
    if (!decisionNote.value) {
        alert('请填写退回原因');
        return;
    }
    router.post(route('disposals.return', props.sample.disposal.id), {
        return_note: decisionNote.value,
    });
};

const archiveSample = () => {
    if (confirm('确定要归档此样品吗？')) {
        router.post(route('samples.archive', props.sample.id));
    }
};

const resolveConflict = () => {
    if (!newSampleNumber.value) {
        alert('请输入新的样品编号');
        return;
    }
    router.post(route('samples.resolve-conflict', props.sample.id), {
        new_sample_number: newSampleNumber.value,
    });
};

const approveReinspection = (request) => {
    router.post(route('reinspections.approve', request.id));
};

const rejectReinspection = (request) => {
    const note = prompt('请输入拒绝原因:');
    if (note) {
        router.post(route('reinspections.reject', request.id), {
            review_note: note,
        });
    }
};
</script>
