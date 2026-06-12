<template>
    <AppLayout :title="caseData.case_number + ' · ' + caseData.title" subtitle="案件详情与复盘">
        <template #actions>
            <div class="flex items-center gap-2">
                <StatusBadge :status="caseData.status" />
                <TypeBadge :type="caseData.type" />
                <span v-if="caseData.is_archived" class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium border border-green-200">
                    📦 已归档只读
                </span>
                <Link v-if="!caseData.is_archived && isClerk" :href="route('cases.review', caseData.id)" class="btn btn-primary">
                    ✎ 处理台
                </Link>
                <button
                    v-if="!caseData.is_archived && isApprover"
                    class="btn btn-success"
                    @click="showApproveModal = true"
                >✓ 复核通过归档</button>
                <button
                    v-if="!caseData.is_archived && isApprover"
                    class="btn btn-warning"
                    @click="showReturnModal = true"
                >↩ 退回补证</button>
                <button
                    v-if="caseData.is_archived && isApprover"
                    class="btn btn-secondary"
                    @click="reopenCase"
                >↻ 重新处理</button>
            </div>
        </template>

        <div class="grid grid-cols-3 gap-6">
            <div class="col-span-2 space-y-6">
                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">📌 核心信息</h3>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                            <span class="text-xs text-slate-500">案件编号</span>
                            <div class="font-mono font-medium text-slate-800">{{ caseData.case_number }}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">案件标题</span>
                            <div class="font-medium text-slate-800">{{ caseData.title }}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">来源描述</span>
                            <div class="text-slate-700">{{ caseData.source_description }}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">事发时间/地点</span>
                            <div class="text-slate-700">{{ caseData.incident_at }} · {{ caseData.location }}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">当前责任人</span>
                            <div class="font-medium text-slate-800">{{ caseData.current_responsible }}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">处理状态</span>
                            <div class="mt-1"><StatusBadge :status="caseData.status" /></div>
                        </div>
                    </div>
                </div>

                <div v-if="hasBlocking(caseData)" class="animate-pulse-none">
                    <DiffPanel :case-data="caseData" />
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">🔧 关键对象（工具清单）</h3>
                    <div class="space-y-3">
                        <div
                            v-for="tool in caseData.tools"
                            :key="tool.id"
                            class="p-3 border rounded-lg"
                            :class="hasToolDiff(tool) ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'"
                        >
                            <div class="flex items-start justify-between">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-xs font-medium text-blue-600">{{ tool.tool_code }}</span>
                                        <span class="font-medium text-slate-800">{{ tool.tool_name }}</span>
                                        <span v-if="tool.specification" class="text-xs text-slate-500">{{ tool.specification }}</span>
                                    </div>
                                    <div v-if="tool.remark" class="text-xs text-slate-500 mt-1">{{ tool.remark }}</div>
                                </div>
                                <span
                                    v-if="hasToolDiff(tool)"
                                    class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded"
                                >有差异</span>
                            </div>
                            <div class="grid grid-cols-4 gap-4 mt-3 text-xs">
                                <div>
                                    <span class="text-slate-500">预期数量</span>
                                    <div class="font-medium text-slate-800 mt-0.5">{{ tool.expected_quantity }}</div>
                                </div>
                                <div>
                                    <span class="text-slate-500">实际数量</span>
                                    <div class="font-medium mt-0.5" :class="tool.expected_quantity !== tool.actual_quantity ? 'text-red-700' : 'text-slate-800'">
                                        {{ tool.actual_quantity }}
                                        <span v-if="tool.expected_quantity !== tool.actual_quantity" class="text-xs ml-1">
                                            ({{ tool.actual_quantity - tool.expected_quantity > 0 ? '+' : '' }}{{ tool.actual_quantity - tool.expected_quantity }})
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span class="text-slate-500">预期金额</span>
                                    <div class="font-medium text-slate-800 mt-0.5">¥{{ Number(tool.expected_amount).toLocaleString() }}</div>
                                </div>
                                <div>
                                    <span class="text-slate-500">实际金额</span>
                                    <div class="font-medium mt-0.5" :class="Number(tool.expected_amount) !== Number(tool.actual_amount) ? 'text-red-700' : 'text-slate-800'">
                                        ¥{{ Number(tool.actual_amount).toLocaleString() }}
                                        <span v-if="Number(tool.expected_amount) !== Number(tool.actual_amount)" class="text-xs ml-1">
                                            ({{ Number(tool.actual_amount) - Number(tool.expected_amount) > 0 ? '+' : '' }}¥{{ (Number(tool.actual_amount) - Number(tool.expected_amount)).toLocaleString() }})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-200 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-500">合计：</span>
                            <span>
                                数量 {{ totalTools.expected }}/{{ totalTools.actual }}
                                <span v-if="totalTools.diff !== 0" class="ml-2" :class="totalTools.diff < 0 ? 'text-red-600' : 'text-green-600'">
                                    差异 {{ totalTools.diff > 0 ? '+' : '' }}{{ totalTools.diff }}
                                </span>
                                · 金额 ¥{{ totalAmount.expected.toLocaleString() }}/¥{{ totalAmount.actual.toLocaleString() }}
                                <span v-if="totalAmount.diff !== 0" class="ml-2" :class="totalAmount.diff < 0 ? 'text-red-600' : 'text-green-600'">
                                    差异 {{ totalAmount.diff > 0 ? '+' : '' }}¥{{ totalAmount.diff.toLocaleString() }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">👥 责任对象</h3>
                    <div class="space-y-3">
                        <div
                            v-for="rp in caseData.responsible_persons"
                            :key="rp.id"
                            class="p-3 border border-slate-200 rounded-lg"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                                        {{ rp.name.charAt(0) }}
                                    </div>
                                    <div>
                                        <div class="font-medium text-slate-800">{{ rp.name }}</div>
                                        <div class="text-xs text-slate-500">{{ rp.employee_id }} · {{ rp.department }} · {{ rp.role_in_case }}</div>
                                    </div>
                                </div>
                                <span v-if="rp.appeal_content" class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">已申诉</span>
                            </div>
                            <div v-if="rp.appeal_content" class="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <div class="text-xs font-semibold text-purple-700 mb-1">申诉内容（{{ rp.appealed_at }}）</div>
                                <div class="text-sm text-purple-900">{{ rp.appeal_content }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">📎 证据附件</h3>
                    <div v-if="caseData.evidences.length === 0" class="text-sm text-slate-500 mb-3">暂无证据附件</div>
                    <div v-else class="grid grid-cols-2 gap-3 mb-4">
                        <div
                            v-for="ev in caseData.evidences"
                            :key="ev.id"
                            class="p-3 border border-slate-200 rounded-lg flex items-center gap-3 hover:bg-slate-50"
                        >
                            <div class="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-lg">
                                {{ ev.file_type.includes('image') ? '🖼' : (ev.file_type.includes('pdf') ? '📕' : (ev.file_type.includes('sheet') || ev.file_type.includes('excel') ? '📊' : '📄')) }}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-slate-800 truncate">{{ ev.file_name }}</div>
                                <div class="text-xs text-slate-500">
                                    {{ formatSize(ev.file_size) }}
                                    <span v-if="ev.description"> · {{ ev.description }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="isClerk && !caseData.is_archived" class="border-t border-slate-200 pt-4">
                        <h4 class="text-sm font-medium text-slate-700 mb-3">上传新证据</h4>
                        <form @submit.prevent="uploadEvidence" class="space-y-3">
                            <input
                                ref="fileInput"
                                type="file"
                                class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                @change="onFileChange"
                            />
                            <textarea
                                v-model="evidenceDescription"
                                class="textarea"
                                rows="2"
                                placeholder="证据说明（可选）"
                            ></textarea>
                            <button
                                type="submit"
                                class="btn btn-primary"
                                :disabled="!evidenceFile || uploadingEvidence"
                            >
                                {{ uploadingEvidence ? '上传中...' : '📎 上传证据' }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-3">📝 处理前后差异与结论</h3>
                    <div class="space-y-3 text-sm">
                        <div>
                            <span class="text-xs text-slate-500">业务记录</span>
                            <div class="mt-1 text-slate-700 whitespace-pre-line">{{ caseData.business_record || '（未填写）' }}</div>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500">现场说明</span>
                            <div class="mt-1 text-slate-700 whitespace-pre-line">{{ caseData.scene_description || '（未填写）' }}</div>
                        </div>
                        <div class="pt-2 border-t">
                            <span class="text-xs text-slate-500">采用依据</span>
                            <div class="mt-1 text-slate-700 whitespace-pre-line">{{ caseData.basis || '（未填写）' }}</div>
                        </div>
                        <div class="pt-2 border-t">
                            <span class="text-xs text-slate-500">最终结论</span>
                            <div class="mt-1 text-slate-800 font-medium whitespace-pre-line">{{ caseData.conclusion || '（待定）' }}</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-3">👤 操作人</h3>
                    <div class="space-y-3 text-sm">
                        <div v-if="caseData.reporter" class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">{{ caseData.reporter.name.charAt(0) }}</div>
                            <div>
                                <div class="text-slate-700">{{ caseData.reporter.name }}</div>
                                <div class="text-xs text-slate-500">受理登记 · {{ caseData.reporter.department }}</div>
                            </div>
                        </div>
                        <div v-if="caseData.handler" class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">{{ caseData.handler.name.charAt(0) }}</div>
                            <div>
                                <div class="text-slate-700">{{ caseData.handler.name }}</div>
                                <div class="text-xs text-slate-500">处理专员 · {{ caseData.handled_at }}</div>
                            </div>
                        </div>
                        <div v-if="caseData.reviewer" class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">{{ caseData.reviewer.name.charAt(0) }}</div>
                            <div>
                                <div class="text-slate-700">{{ caseData.reviewer.name }}</div>
                                <div class="text-xs text-slate-500">审批负责人 · {{ caseData.reviewed_at || '待复核' }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-3">🔀 历史节点（完整流转）</h3>
                    <Timeline :nodes="caseData.nodes" />
                </div>
            </div>
        </div>

        <div v-if="showApproveModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 w-96">
                <h3 class="text-lg font-semibold text-slate-800 mb-3">确认复核通过并归档</h3>
                <p class="text-sm text-slate-600 mb-4">复核通过后案件将进入已归档状态，变为只读。确定要继续吗？</p>
                <div class="flex justify-end gap-2">
                    <button class="btn btn-secondary" @click="showApproveModal = false">取消</button>
                    <button class="btn btn-success" @click="approveCase">确认归档</button>
                </div>
            </div>
        </div>

        <div v-if="showReturnModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 w-[480px]">
                <h3 class="text-lg font-semibold text-slate-800 mb-3">退回补证</h3>
                <p class="text-sm text-slate-600 mb-3">请填写退回原因和补救路径说明：</p>
                <textarea v-model="returnReason" class="textarea mb-4" rows="4" placeholder="说明需要补充哪些材料或纠正哪些问题..."></textarea>
                <div class="flex justify-end gap-2">
                    <button class="btn btn-secondary" @click="showReturnModal = false">取消</button>
                    <button class="btn btn-warning" @click="returnCase" :disabled="!returnReason.trim()">确认退回</button>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { router, Link } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import TypeBadge from '../../Components/TypeBadge.vue';
import Timeline from '../../Components/Timeline.vue';
import DiffPanel from '../../Components/DiffPanel.vue';

const props = defineProps({
    case: { type: Object, required: true },
    canEdit: { type: Boolean, default: false },
    isApprover: { type: Boolean, default: false },
    isClerk: { type: Boolean, default: false },
});

const caseData = computed(() => props.case);
const showApproveModal = ref(false);
const showReturnModal = ref(false);
const returnReason = ref('');
const evidenceFile = ref(null);
const evidenceDescription = ref('');
const uploadingEvidence = ref(false);
const fileInput = ref(null);

const totalTools = computed(() => {
    const t = caseData.value.tools || [];
    return {
        expected: t.reduce((s, x) => s + Number(x.expected_quantity), 0),
        actual: t.reduce((s, x) => s + Number(x.actual_quantity), 0),
        get diff() { return this.actual - this.expected; },
    };
});

const totalAmount = computed(() => {
    const t = caseData.value.tools || [];
    return {
        expected: t.reduce((s, x) => s + Number(x.expected_amount), 0),
        actual: t.reduce((s, x) => s + Number(x.actual_amount), 0),
        get diff() { return this.actual - this.expected; },
    };
});

function hasToolDiff(tool) {
    return Number(tool.expected_quantity) !== Number(tool.actual_quantity) ||
           Number(tool.expected_amount) !== Number(tool.actual_amount);
}

function hasBlocking(c) {
    return c.blocking_reason || (c.diff_fields && c.diff_fields.length);
}

function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < 3) { bytes /= 1024; i++; }
    return bytes.toFixed(1) + ' ' + units[i];
}

function approveCase() {
    router.post(route('cases.approve', caseData.value.id), { action: 'approve' });
}

function returnCase() {
    router.post(route('cases.approve', caseData.value.id), { action: 'return', return_reason: returnReason.value });
}

function reopenCase() {
    if (confirm('确定要重新处理此归档案件吗？将生成新的处理节点。')) {
        router.post(route('cases.reopen', caseData.value.id));
    }
}

function onFileChange(e) {
    evidenceFile.value = e.target.files[0] || null;
}

function uploadEvidence() {
    if (!evidenceFile.value) return;
    uploadingEvidence.value = true;
    const formData = new FormData();
    formData.append('file', evidenceFile.value);
    if (evidenceDescription.value) {
        formData.append('description', evidenceDescription.value);
    }
    router.post(route('cases.evidence', caseData.value.id), formData, {
        forceFormData: true,
        onFinish: () => {
            uploadingEvidence.value = false;
            evidenceFile.value = null;
            evidenceDescription.value = '';
            if (fileInput.value) fileInput.value.value = '';
        },
    });
}
</script>
