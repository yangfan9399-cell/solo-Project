<template>
    <AppLayout :title="'处理台 · ' + caseData.case_number" subtitle="业务专员补充记录、说明与证据">
        <template #actions>
            <StatusBadge :status="caseData.status" />
            <TypeBadge :type="caseData.type" />
            <Link :href="route('cases.show', caseData.id)" class="btn btn-secondary">← 返回详情</Link>
        </template>

        <form @submit.prevent="submitForm(false)" class="grid grid-cols-3 gap-6">
            <div class="col-span-2 space-y-6">
                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">📌 案件概览（只读）</h3>
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
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">✏️ 业务专员可编辑字段</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">当前责任人</label>
                            <input v-model="form.current_responsible" class="input" type="text" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">事发时间</label>
                            <input v-model="form.incident_at" class="input" type="datetime-local" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">业务记录（借出/归还/登记等台账信息）</label>
                            <textarea v-model="form.business_record" class="textarea" rows="4" placeholder="记录借还时间、借用人、班组长确认等台账信息..."></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">现场说明（清点现场的实际情况描述）</label>
                            <textarea v-model="form.scene_description" class="textarea" rows="4" placeholder="描述清点现场、工具状态、异常情况等..."></textarea>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-4">🔧 工具清单（可调整实际数量/金额）</h3>
                    <div class="space-y-3">
                        <div
                            v-for="(tool, idx) in form.tools"
                            :key="tool.id"
                            class="p-3 border border-slate-200 rounded-lg"
                        >
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono text-xs font-medium text-blue-600">{{ tool.tool_code }}</span>
                                        <span class="font-medium text-slate-800">{{ tool.tool_name }}</span>
                                        <span v-if="tool.specification" class="text-xs text-slate-500">{{ tool.specification }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span class="text-slate-500">预期数量</span>
                                    <div class="font-medium text-slate-500 mt-0.5">{{ tool.expected_quantity }}</div>
                                </div>
                                <div>
                                    <label class="text-slate-500">实际数量</label>
                                    <input v-model.number="tool.actual_quantity" type="number" min="0" class="input mt-0.5 !py-1 !text-sm" />
                                </div>
                                <div>
                                    <span class="text-slate-500">预期金额</span>
                                    <div class="font-medium text-slate-500 mt-0.5">¥{{ Number(tool.expected_amount).toLocaleString() }}</div>
                                </div>
                                <div>
                                    <label class="text-slate-500">实际金额</label>
                                    <input v-model.number="tool.actual_amount" type="number" min="0" step="0.01" class="input mt-0.5 !py-1 !text-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="card">
                    <h3 class="font-semibold text-slate-800 mb-3">📝 处理结论与依据</h3>
                    <div class="space-y-3 text-sm">
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">结论</label>
                            <textarea v-model="form.conclusion" class="textarea" rows="4" placeholder="填写处理结论..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">采用依据（法规/制度/条款）</label>
                            <textarea v-model="form.basis" class="textarea" rows="3" placeholder="引用相关管理规范和制度条款..."></textarea>
                        </div>
                    </div>
                </div>

                <div v-if="hasBlocking(caseData)" class="card border-amber-300 bg-amber-50">
                    <h3 class="font-semibold text-amber-800 mb-3">⚠ 异常信息编辑</h3>
                    <div class="space-y-3 text-sm">
                        <div>
                            <label class="block text-xs font-medium text-amber-700 mb-1">阻断原因</label>
                            <textarea v-model="form.blocking_reason" class="textarea" rows="3" placeholder="说明阻断的具体原因..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-amber-700 mb-1">补救路径</label>
                            <textarea v-model="form.remedy_path" class="textarea" rows="4" placeholder="列出纠正问题的具体步骤..."></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-amber-700 mb-1">差异字段（JSON格式预览）</label>
                            <div class="p-2 bg-white rounded text-xs text-slate-600 font-mono whitespace-pre-wrap">
                                {{ JSON.stringify(form.diff_fields, null, 2) }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card sticky top-6">
                    <h3 class="font-semibold text-slate-800 mb-3">💾 保存与提交</h3>
                    <div class="space-y-2">
                        <button type="submit" class="btn btn-secondary w-full justify-center">
                            💾 暂存修改
                        </button>
                        <button type="button" class="btn btn-primary w-full justify-center" @click="submitForm(true)">
                            ✅ 提交进入复核
                        </button>
                        <p class="text-xs text-slate-500 text-center pt-2">
                            提交后案件将进入复核阶段，由审批负责人进行最终确认
                        </p>
                        <div v-if="processing" class="text-center text-sm text-blue-600 mt-2">处理中...</div>
                    </div>
                </div>
            </div>
        </form>
    </AppLayout>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { router, Link } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';
import StatusBadge from '../../Components/StatusBadge.vue';
import TypeBadge from '../../Components/TypeBadge.vue';

const props = defineProps({
    case: { type: Object, required: true },
});

const caseData = computed(() => props.case);
const processing = ref(false);

const form = reactive({
    current_responsible: caseData.value.current_responsible || '',
    incident_at: caseData.value.incident_at ? caseData.value.incident_at.slice(0, 16) : '',
    business_record: caseData.value.business_record || '',
    scene_description: caseData.value.scene_description || '',
    conclusion: caseData.value.conclusion || '',
    basis: caseData.value.basis || '',
    blocking_reason: caseData.value.blocking_reason || '',
    remedy_path: caseData.value.remedy_path || '',
    diff_fields: caseData.value.diff_fields || [],
    tools: (caseData.value.tools || []).map(t => ({ ...t })),
});

function hasBlocking(c) {
    return c.blocking_reason || (c.diff_fields && c.diff_fields.length);
}

function submitForm(submitForReview) {
    processing.value = true;
    const data = {
        ...form,
        submit_for_review: submitForReview,
    };
    router.put(route('cases.update-clerk', caseData.value.id), data, {
        onFinish: () => { processing.value = false; },
    });
}
</script>
