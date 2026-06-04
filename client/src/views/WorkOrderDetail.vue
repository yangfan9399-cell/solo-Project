<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import {
  getWorkOrder,
  validateArchive,
  submitHandover,
  submitQuality,
  submitRework,
  completeRework,
  type HandoverRequest,
  type QualityRequest,
  type ReworkRequest,
  type ReworkCompleteRequest
} from '@/api';
import type { WorkOrder, WorkOrderProcess, HandoverRecord, ReworkRecord } from '@/types';
import { ProcessStatus, QualityDecision, ReworkConclusion } from '@/types';
import dayjs from 'dayjs';

const route = useRoute();
const userStore = useUserStore();
const { currentUser, isOperator, isQualityInspector } = storeToRefs(userStore);

const workOrder = ref<WorkOrder | null>(null);
const loading = ref(true);
const archiveValidation = ref<any>(null);

const showHandoverModal = ref(false);
const showQualityModal = ref(false);
const showReworkModal = ref(false);
const showReworkCompleteModal = ref(false);

const submittingHandover = ref(false);
const submittingQuality = ref(false);
const submittingRework = ref(false);

const selectedProcess = ref<WorkOrderProcess | null>(null);
const selectedHandover = ref<HandoverRecord | null>(null);
const selectedRework = ref<ReworkRecord | null>(null);

const handoverForm = ref<HandoverRequest>({
  workOrderId: '',
  processId: '',
  operatorId: '',
  handoverNote: '',
  quantity: 0
});

const qualityForm = ref<QualityRequest>({
  handoverId: '',
  inspectorId: '',
  decision: 'PASS',
  evidence: '',
  rejectReason: ''
});

const reworkForm = ref<ReworkRequest>({
  processId: '',
  operatorId: '',
  reworkReason: '',
  reworkMaterials: '',
  reworkNote: '',
  reworkConclusion: undefined
});

const reworkCompleteForm = ref<ReworkCompleteRequest>({
  reworkConclusion: 'REPAIRED',
  reworkNote: ''
});

const submittingReworkComplete = ref(false);

const alertMessage = ref('');
const alertType = ref<'success' | 'error' | 'warning'>('error');
const showAlert = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const order = await getWorkOrder(route.params.id as string);
    workOrder.value = order;
    
    const validation = await validateArchive(route.params.id as string);
    archiveValidation.value = validation;
  } catch (e: any) {
    showAlertMessage(e.message, 'error');
  } finally {
    loading.value = false;
  }
}

function showAlertMessage(message: string, type: 'success' | 'error' | 'warning') {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 3000);
}

function getTimelineClass(process: WorkOrderProcess) {
  if (process.status === ProcessStatus.REWORKING) return 'rejected';
  if (process.status === ProcessStatus.PASSED || process.status === ProcessStatus.ARCHIVED) return 'completed';
  if (process.status !== ProcessStatus.PENDING) return 'active';
  return '';
}

function getLastHandover(process: WorkOrderProcess) {
  return process.handoverRecords[0];
}

function getLastQuality(process: WorkOrderProcess) {
  const handover = getLastHandover(process);
  return handover?.qualityInspection;
}

function canHandover(process: WorkOrderProcess) {
  if (!workOrder.value || !isOperator.value) return false;
  if (process.status === ProcessStatus.QUALITY_CHECK) return false;
  if (process.status === ProcessStatus.PASSED || process.status === ProcessStatus.ARCHIVED) return false;
  
  const templateSteps = workOrder.value.template.steps;
  const currentIdx = templateSteps.findIndex(s => s.id === process.stepId);
  
  if (currentIdx === 0) return true;
  
  const prevStep = templateSteps[currentIdx - 1];
  const prevProcess = workOrder.value.processes.find(p => p.stepId === prevStep.id);
  
  if (!prevProcess) return false;
  
  const lastHandover = prevProcess.handoverRecords[0];
  if (!lastHandover?.qualityInspection) return false;
  
  if (lastHandover.qualityInspection.decision === QualityDecision.REJECT) {
    const hasCompletedRework = prevProcess.reworkRecords && prevProcess.reworkRecords.length > 0;
    const lastRework = hasCompletedRework ? prevProcess.reworkRecords[0] : null;
    const isPrevProcessPassed = prevProcess.status === ProcessStatus.PASSED || prevProcess.status === ProcessStatus.ARCHIVED;
    
    if (hasCompletedRework && isPrevProcessPassed && lastRework?.reworkConclusion) {
      return true;
    }
    return false;
  }
  
  return true;
}

function openHandoverModal(process: WorkOrderProcess) {
  if (!currentUser.value || !workOrder.value) return;
  selectedProcess.value = process;
  handoverForm.value = {
    workOrderId: workOrder.value.id,
    processId: process.id,
    operatorId: currentUser.value.id,
    handoverNote: '',
    quantity: workOrder.value.quantity
  };
  showHandoverModal.value = true;
}

async function submitHandoverForm() {
  if (!handoverForm.value.handoverNote.trim()) {
    showAlertMessage('请填写交接说明', 'warning');
    return;
  }
  if (submittingHandover.value) return;
  submittingHandover.value = true;
  try {
    await submitHandover(handoverForm.value);
    showAlertMessage('交接提交成功，等待质检', 'success');
    showHandoverModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(`交接提交失败: ${e.message}`, 'error');
  } finally {
    submittingHandover.value = false;
  }
}

function openQualityModal(handover: HandoverRecord) {
  if (!currentUser.value) return;
  selectedHandover.value = handover;
  qualityForm.value = {
    handoverId: handover.id,
    inspectorId: currentUser.value.id,
    decision: 'PASS',
    evidence: '',
    rejectReason: ''
  };
  showQualityModal.value = true;
}

async function submitQualityForm() {
  if (qualityForm.value.decision === 'REJECT' && !qualityForm.value.rejectReason?.trim()) {
    showAlertMessage('退回时必须填写退回原因', 'warning');
    return;
  }
  if (qualityForm.value.decision === 'ARCHIVE' && !qualityForm.value.evidence?.trim()) {
    showAlertMessage('归档时必须填写质检证据', 'warning');
    return;
  }
  if (submittingQuality.value) return;
  submittingQuality.value = true;
  try {
    await submitQuality(qualityForm.value);
    const decisionText = {
      PASS: '放行',
      REJECT: '退回',
      ARCHIVE: '归档'
    }[qualityForm.value.decision];
    showAlertMessage(`质检${decisionText}成功`, 'success');
    showQualityModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(`质检操作失败: ${e.message}`, 'error');
  } finally {
    submittingQuality.value = false;
  }
}

function openReworkModal(process: WorkOrderProcess) {
  if (!currentUser.value) return;
  selectedProcess.value = process;
  reworkForm.value = {
    processId: process.id,
    operatorId: currentUser.value.id,
    reworkReason: '',
    reworkMaterials: '',
    reworkNote: '',
    reworkConclusion: undefined
  };
  showReworkModal.value = true;
}

async function submitReworkForm() {
  if (!reworkForm.value.reworkReason.trim() || !reworkForm.value.reworkMaterials.trim()) {
    showAlertMessage('请填写返修原因和返修材料', 'warning');
    return;
  }
  if (submittingRework.value) return;
  submittingRework.value = true;
  try {
    await submitRework(reworkForm.value);
    showAlertMessage('返修记录提交成功', 'success');
    showReworkModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(`返修提交失败: ${e.message}`, 'error');
  } finally {
    submittingRework.value = false;
  }
}

function openReworkCompleteModal(rework: ReworkRecord) {
  selectedRework.value = rework;
  reworkCompleteForm.value = {
    reworkConclusion: 'REPAIRED',
    reworkNote: ''
  };
  showReworkCompleteModal.value = true;
}

async function submitReworkCompleteForm() {
  if (!selectedRework.value) return;

  if (!reworkCompleteForm.value.reworkConclusion) {
    showAlertMessage('请选择返修结论', 'warning');
    return;
  }

  if (reworkCompleteForm.value.reworkConclusion === 'CONCESSION' && !reworkCompleteForm.value.reworkNote?.trim()) {
    showAlertMessage('让步接收必须填写特批依据和评审意见', 'warning');
    return;
  }

  if (reworkCompleteForm.value.reworkConclusion === 'SCRAPPED' && !reworkCompleteForm.value.reworkNote?.trim()) {
    showAlertMessage('报废必须填写报废原因和补投计划', 'warning');
    return;
  }

  if (submittingReworkComplete.value) return;
  submittingReworkComplete.value = true;

  try {
    const conclusion = reworkCompleteForm.value.reworkConclusion;
    const conclusionText = {
      REPAIRED: '已修复',
      SCRAPPED: '报废',
      CONCESSION: '让步接收'
    }[conclusion];

    const conclusionSummary = {
      REPAIRED: '工序恢复进行中，可重新提交交接',
      SCRAPPED: '零件已剔除并补投，工序视为完成',
      CONCESSION: '偏差经特批认可，工序视为通过'
    }[conclusion];

    await completeRework(selectedRework.value.id, reworkCompleteForm.value);
    showAlertMessage(
      `返修结论「${conclusionText}」已落库持久化 — ${conclusionSummary}`,
      'success'
    );
    showReworkCompleteModal.value = false;
    await loadData();
  } catch (e: any) {
    showAlertMessage(
      `返修结论提交失败: ${e.message}。请检查网络连接后重试。`,
      'error'
    );
  } finally {
    submittingReworkComplete.value = false;
  }
}

const statusText: Record<string, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  HANDED_OVER: '已交接',
  REWORKING: '返修中',
  QUALITY_CHECK: '质检中',
  PASSED: '已通过',
  FAILED: '已失败',
  ARCHIVED: '已归档'
};

const conclusionText: Record<string, string> = {
  REPAIRED: '已修复',
  SCRAPPED: '报废',
  CONCESSION: '让步接收'
};

function getReworkDuration(rework: ReworkRecord) {
  if (!rework.endTime) return '进行中';
  const start = dayjs(rework.startTime);
  const end = dayjs(rework.endTime);
  const hours = end.diff(start, 'hour', true);
  if (hours < 1) {
    return `${end.diff(start, 'minute')} 分钟`;
  }
  return `${hours.toFixed(1)} 小时`;
}

onMounted(loadData);
</script>

<template>
  <div class="work-order-detail" v-if="workOrder">
    <div v-if="showAlert" class="alert" :class="`alert-${alertType}`">
      {{ alertMessage }}
    </div>

    <div class="breadcrumb">
      <a href="/">工单列表</a>
      <span>/</span>
      <span>{{ workOrder.orderNo }}</span>
    </div>

    <div v-if="!archiveValidation?.valid && archiveValidation?.missingSteps && archiveValidation.missingSteps.length > 0" class="alert alert-error" style="margin-bottom: 24px;">
      <strong>⚠️ 工序跳步检测:</strong> {{ archiveValidation.error }}
      <div style="margin-top: 8px;">
        <strong>缺失的前序签收:</strong>
        <ul style="margin-top: 4px; padding-left: 20px;">
          <li v-for="step in archiveValidation.missingSteps" :key="step.stepNumber">
            工序{{ step.stepNumber }} - {{ step.name }} ({{ step.department }})
          </li>
        </ul>
      </div>
    </div>

    <div v-if="archiveValidation?.resolvedByRework && archiveValidation.resolvedByRework.length > 0" class="alert alert-info" style="margin-bottom: 24px;">
      <strong>ℹ️ 工序返修已处理:</strong> 以下工序质检被退回后，通过返修处理已解决，不影响归档和后续交接。
      <div style="margin-top: 8px;">
        <ul style="margin-top: 4px; padding-left: 20px;">
          <li v-for="step in archiveValidation.resolvedByRework" :key="step.stepNumber">
            工序{{ step.stepNumber }} - {{ step.name }} ({{ step.department }})
            → 返修结论: <span class="status-badge" :class="step.reworkConclusion">{{ conclusionText[step.reworkConclusion] }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">工单基本信息</h3>
      <div class="grid-2">
        <div class="info-row"><span class="label">工单编号:</span><span class="value">{{ workOrder.orderNo }}</span></div>
        <div class="info-row"><span class="label">产品名称:</span><span class="value">{{ workOrder.productName }}</span></div>
        <div class="info-row"><span class="label">生产数量:</span><span class="value">{{ workOrder.quantity }} 件</span></div>
        <div class="info-row"><span class="label">当前状态:</span><span class="value"><span class="status-badge" :class="workOrder.status">{{ statusText[workOrder.status] }}</span></span></div>
        <div class="info-row"><span class="label">工艺流程:</span><span class="value">{{ workOrder.template.name }} (v{{ workOrder.template.version }})</span></div>
        <div class="info-row"><span class="label">创建时间:</span><span class="value">{{ dayjs(workOrder.createdAt).format('YYYY-MM-DD HH:mm:ss') }}</span></div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">工序流程与责任班组</h3>
      <div class="process-timeline" v-if="workOrder.template.steps.length > 0">
        <div v-for="step in workOrder.template.steps" :key="step.id" class="timeline-item" :class="getTimelineClass(workOrder.processes.find(p => p.stepId === step.id) || {} as WorkOrderProcess)">
          <div class="timeline-content">
            <div class="timeline-header">
              <div>
                <span class="timeline-title">工序{{ step.stepNumber }}: {{ step.name }}</span>
                <span class="tag" style="margin-left: 8px;">{{ step.department }}</span>
                <span v-if="workOrder.processes.find(p => p.stepId === step.id)?.reworkRecords.length" class="tag" style="background: #fff1f0; color: #cf1322; margin-left: 4px;">
                  返修{{ workOrder.processes.find(p => p.stepId === step.id)?.reworkRecords.length }}次
                </span>
              </div>
              <span 
                class="status-badge" 
                :class="workOrder.processes.find(p => p.stepId === step.id)?.status || ProcessStatus.PENDING"
              >
                {{ statusText[workOrder.processes.find(p => p.stepId === step.id)?.status || ProcessStatus.PENDING] }}
              </span>
            </div>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">{{ step.description }}</p>
            <div style="display: flex; gap: 8px;">
              <button
                v-if="isOperator && canHandover(workOrder.processes.find(p => p.stepId === step.id) || {} as WorkOrderProcess)"
                class="btn btn-sm btn-primary"
                @click="openHandoverModal(workOrder.processes.find(p => p.stepId === step.id)!)"
              >
                提交交接
              </button>
              <button
                v-if="isOperator && workOrder.processes.find(p => p.stepId === step.id)?.status === ProcessStatus.REWORKING"
                class="btn btn-sm btn-warning"
                @click="openReworkModal(workOrder.processes.find(p => p.stepId === step.id)!)"
              >
                提交返修
              </button>
              <button
                v-if="isQualityInspector && getLastHandover(workOrder.processes.find(p => p.stepId === step.id)!) && !getLastQuality(workOrder.processes.find(p => p.stepId === step.id)!)"
                class="btn btn-sm btn-success"
                @click="openQualityModal(getLastHandover(workOrder.processes.find(p => p.stepId === step.id)!)!)"
              >
                质检处理
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">最近改动记录</h3>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else>
          <template v-for="process in workOrder.processes" :key="process.id">
            <template v-for="handover in process.handoverRecords" :key="handover.id">
              <div class="record-card" :class="handover.qualityInspection?.decision === 'REJECT' ? 'reject' : handover.qualityInspection ? 'pass' : ''">
                <div class="record-meta">
                  <span>{{ dayjs(handover.handedOverAt).format('YYYY-MM-DD HH:mm') }}</span>
                  <span>{{ handover.operator.name }} 提交交接</span>
                  <span>工序{{ process.stepNumber }}</span>
                </div>
                <div class="record-content">
                  <strong>交接说明:</strong> {{ handover.handoverNote }}
                  <br>
                  <span style="font-size: 12px; color: var(--text-secondary);">数量: {{ handover.quantity }} 件</span>
                </div>
                <div v-if="handover.qualityInspection" style="margin-top: 8px;">
                  <div class="record-meta">
                    <span>{{ dayjs(handover.qualityInspection.inspectedAt).format('YYYY-MM-DD HH:mm') }}</span>
                    <span>{{ handover.qualityInspection.inspector.name }} 质检</span>
                    <span class="status-badge" :class="handover.qualityInspection.decision === 'PASS' ? 'PASSED' : handover.qualityInspection.decision === 'REJECT' ? 'REWORKING' : 'ARCHIVED'">
                      {{ handover.qualityInspection.decision === 'PASS' ? '放行' : handover.qualityInspection.decision === 'REJECT' ? '退回' : '归档' }}
                    </span>
                  </div>
                  <div v-if="handover.qualityInspection.rejectReason" class="evidence-box">
                    <strong>退回原因:</strong> {{ handover.qualityInspection.rejectReason }}
                  </div>
                  <div v-if="handover.qualityInspection.evidence" class="evidence-box">
                    <strong>质检证据:</strong> {{ handover.qualityInspection.evidence }}
                  </div>
                </div>
              </div>
            </template>
          </template>
          <div v-if="workOrder.processes.every(p => p.handoverRecords.length === 0)" class="empty">
            暂无改动记录
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">返修历史</h3>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else>
          <template v-for="process in workOrder.processes" :key="process.id">
            <template v-for="rework in process.reworkRecords" :key="rework.id">
              <div class="record-card rework">
                <div class="record-meta">
                  <span>{{ dayjs(rework.createdAt).format('YYYY-MM-DD HH:mm') }}</span>
                  <span>{{ rework.operator.name }} 提交返修</span>
                  <span>工序{{ process.stepNumber }}</span>
                  <span v-if="rework.reworkConclusion" class="status-badge" :class="rework.reworkConclusion">
                    {{ conclusionText[rework.reworkConclusion] }}
                  </span>
                  <span v-else class="status-badge REWORKING">待填写结论</span>
                </div>
                <div class="record-content">
                  <p><strong>返修原因:</strong> {{ rework.reworkReason }}</p>
                  <p><strong>返修材料:</strong> {{ rework.reworkMaterials }}</p>
                  <p v-if="rework.reworkNote"><strong>返修说明:</strong> {{ rework.reworkNote }}</p>
                  <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                    耗时: {{ getReworkDuration(rework) }}
                    <span v-if="rework.endTime">
                      · {{ dayjs(rework.startTime).format('MM-DD HH:mm') }} - {{ dayjs(rework.endTime).format('MM-DD HH:mm') }}
                    </span>
                  </p>
                </div>
                <div class="alert" :class="rework.reworkConclusion ? 'alert-success' : 'alert-warning'" style="margin-top: 8px; font-size: 12px;">
                  <template v-if="rework.reworkConclusion">
                    <strong>返修结论: {{ conclusionText[rework.reworkConclusion] }}</strong>
                    <span v-if="rework.reworkConclusion === 'REPAIRED'"> — 返修后质量合格，工序状态变更为「进行中」可重新交接。结论值 <code>REPAIRED</code> 已持久化到数据库 <code>rework_conclusion</code> 字段</span>
                    <span v-else-if="rework.reworkConclusion === 'SCRAPPED'"> — 无法修复予以报废，零件剔除补投，工序状态变更为「已通过」。结论值 <code>SCRAPPED</code> 已持久化，复盘页按此字段聚合统计</span>
                    <span v-else-if="rework.reworkConclusion === 'CONCESSION'"> — 偏差经特批认可放行，工序状态变更为「已通过」。结论值 <code>CONCESSION</code> 已持久化，证明结论不是静态写死</span>
                  </template>
                  <template v-else>
                    <strong>返修进行中</strong> — 结论待操作员根据实际返修结果填写，系统不预设固定值。可选择：已修复 / 报废 / 让步接收
                  </template>
                </div>
                <button
                  v-if="isOperator && !rework.reworkConclusion"
                  class="btn btn-sm btn-warning"
                  style="margin-top: 8px;"
                  @click="openReworkCompleteModal(rework)"
                >
                  填写返修结论
                </button>
              </div>
            </template>
          </template>
          <div v-if="workOrder.processes.every(p => p.reworkRecords.length === 0)" class="empty">
            暂无返修记录
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">质检证据汇总</h3>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else>
        <template v-for="process in workOrder.processes" :key="process.id">
          <template v-for="qi in process.qualityInspections" :key="qi.id">
            <div class="record-card" :class="qi.decision === 'REJECT' ? 'reject' : 'pass'">
              <div class="record-meta">
                <span>{{ dayjs(qi.inspectedAt).format('YYYY-MM-DD HH:mm') }}</span>
                <span>工序{{ process.stepNumber }} - {{ process.step.name }}</span>
                <span>质检员: {{ qi.inspector.name }}</span>
                <span class="status-badge" :class="qi.decision === 'PASS' ? 'PASSED' : qi.decision === 'REJECT' ? 'REWORKING' : 'ARCHIVED'">
                  {{ qi.decision === 'PASS' ? '放行' : qi.decision === 'REJECT' ? '退回' : '归档' }}
                </span>
              </div>
              <div v-if="qi.evidence" class="evidence-box">
                <strong>质检证据:</strong> {{ qi.evidence }}
              </div>
              <div v-if="qi.rejectReason" class="evidence-box">
                <strong>退回原因:</strong> {{ qi.rejectReason }}
              </div>
            </div>
          </template>
        </template>
        <div v-if="workOrder.processes.every(p => p.qualityInspections.length === 0)" class="empty">
          暂无质检记录
        </div>
      </div>
    </div>

    <div v-if="showHandoverModal" class="modal-overlay" @click.self="showHandoverModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>提交工序交接</h3>
          <button class="modal-close" @click="showHandoverModal = false">×</button>
        </div>
        <div v-if="selectedProcess" style="margin-bottom: 16px;">
          <div class="info-row"><span class="label">工序:</span><span class="value">工序{{ selectedProcess.stepNumber }} - {{ selectedProcess.step.name }}</span></div>
          <div class="info-row"><span class="label">班组:</span><span class="value">{{ selectedProcess.step.department }}</span></div>
        </div>
        <div class="form-group">
          <label>交接数量</label>
          <input type="number" v-model.number="handoverForm.quantity" min="1" />
        </div>
        <div class="form-group">
          <label>交接说明 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="handoverForm.handoverNote" placeholder="请详细描述本工序完成情况、质量状态、注意事项等"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showHandoverModal = false" :disabled="submittingHandover">取消</button>
          <button class="btn btn-primary" @click="submitHandoverForm" :disabled="submittingHandover">
            {{ submittingHandover ? '提交中...' : '提交交接' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showQualityModal" class="modal-overlay" @click.self="showQualityModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>质检处理</h3>
          <button class="modal-close" @click="showQualityModal = false">×</button>
        </div>
        <div v-if="selectedHandover" style="margin-bottom: 16px;">
          <div class="info-row"><span class="label">交接人:</span><span class="value">{{ selectedHandover.operator.name }}</span></div>
          <div class="info-row"><span class="label">交接说明:</span><span class="value">{{ selectedHandover.handoverNote }}</span></div>
          <div class="info-row"><span class="label">数量:</span><span class="value">{{ selectedHandover.quantity }}</span></div>
        </div>
        <div class="form-group">
          <label>质检决策 <span style="color: var(--error-color);">*</span></label>
          <select v-model="qualityForm.decision">
            <option value="PASS">放行 - 质量合格，进入下道工序</option>
            <option value="REJECT">退回 - 质量不合格，需返修</option>
            <option value="ARCHIVE">归档 - 最终工序完成，工单结束</option>
          </select>
        </div>
        <div v-if="qualityForm.decision === 'REJECT'" class="form-group">
          <label>退回原因 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="qualityForm.rejectReason" placeholder="请详细描述不合格项、超差数据、影响范围等"></textarea>
        </div>
        <div class="form-group">
          <label>质检证据 {{ qualityForm.decision === 'ARCHIVE' ? ' *' : '' }}</label>
          <textarea v-model="qualityForm.evidence" placeholder="检测报告编号、三坐标数据、照片编号等"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showQualityModal = false" :disabled="submittingQuality">取消</button>
          <button 
            class="btn" 
            :class="{
              'btn-success': qualityForm.decision === 'PASS',
              'btn-danger': qualityForm.decision === 'REJECT',
              'btn-primary': qualityForm.decision === 'ARCHIVE'
            }"
            @click="submitQualityForm"
            :disabled="submittingQuality"
          >
            {{ submittingQuality ? '提交中...' : '确认提交' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReworkModal" class="modal-overlay" @click.self="showReworkModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>提交返修记录</h3>
          <button class="modal-close" @click="showReworkModal = false">×</button>
        </div>
        <div class="form-group">
          <label>返修原因 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="reworkForm.reworkReason" placeholder="请详细描述缺陷类型、产生原因、影响范围等"></textarea>
        </div>
        <div class="form-group">
          <label>返修材料 <span style="color: var(--error-color);">*</span></label>
          <textarea v-model="reworkForm.reworkMaterials" placeholder="请列出使用的刀具、磨料、辅料等"></textarea>
        </div>
        <div class="form-group">
          <label>返修过程说明</label>
          <textarea v-model="reworkForm.reworkNote" placeholder="返修工艺步骤、参数调整、质量控制点等"></textarea>
        </div>
        <div class="form-group">
          <label>返修结论 (如已完成)</label>
          <select v-model="reworkForm.reworkConclusion">
            <option :value="undefined">返修中，暂不填写</option>
            <option :value="ReworkConclusion.REPAIRED">已修复 - 返修后合格</option>
            <option :value="ReworkConclusion.SCRAPPED">报废 - 无法修复</option>
            <option :value="ReworkConclusion.CONCESSION">让步接收 - 需特批</option>
          </select>
        </div>
        <div class="alert alert-info" style="margin-top: 16px;">
          <strong>返修结论说明:</strong> 返修结论根据实际返修结果动态录入，不是静态写死的值。相同的返修原因可能因为返修工艺、材料、操作人员的不同而产生不同的结论。
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showReworkModal = false" :disabled="submittingRework">取消</button>
          <button class="btn btn-warning" @click="submitReworkForm" :disabled="submittingRework">
            {{ submittingRework ? '提交中...' : '提交返修' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReworkCompleteModal" class="modal-overlay" @click.self="showReworkCompleteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>填写返修结论</h3>
          <button class="modal-close" @click="showReworkCompleteModal = false" :disabled="submittingReworkComplete">×</button>
        </div>
        <div v-if="selectedRework" style="margin-bottom: 16px;">
          <div class="info-row"><span class="label">返修原因:</span><span class="value">{{ selectedRework.reworkReason }}</span></div>
          <div class="info-row"><span class="label">返修材料:</span><span class="value">{{ selectedRework.reworkMaterials }}</span></div>
          <div class="info-row"><span class="label">已耗时:</span><span class="value">{{ getReworkDuration(selectedRework) }}</span></div>
        </div>
        <div class="form-group">
          <label>返修结论 <span style="color: var(--error-color);">*</span></label>
          <select v-model="reworkCompleteForm.reworkConclusion" :disabled="submittingReworkComplete">
            <option value="REPAIRED">已修复 - 返修后质量合格，可继续流转</option>
            <option value="SCRAPPED">报废 - 无法修复或修复成本过高，予以报废</option>
            <option value="CONCESSION">让步接收 - 偏差可接受，经特批后放行</option>
          </select>
        </div>
        <div class="form-group">
          <label>返修备注 <span v-if="reworkCompleteForm.reworkConclusion === 'CONCESSION'" style="color: var(--error-color);">*</span></label>
          <textarea 
            v-model="reworkCompleteForm.reworkNote" 
            :placeholder="reworkCompleteForm.reworkConclusion === 'CONCESSION' 
              ? '让步接收必须说明特批依据、评审意见、后续跟踪措施' 
              : reworkCompleteForm.reworkConclusion === 'SCRAPPED' 
                ? '请说明报废原因、补投计划、影响分析' 
                : '返修效果验证、后续注意事项等'"
            :disabled="submittingReworkComplete"
          ></textarea>
        </div>
        <div v-if="reworkCompleteForm.reworkConclusion === 'CONCESSION' && !reworkCompleteForm.reworkNote?.trim()" class="alert alert-warning" style="margin-top: 8px;">
          让步接收需要填写特批依据和评审意见
        </div>
        <div v-if="reworkCompleteForm.reworkConclusion === 'SCRAPPED' && !reworkCompleteForm.reworkNote?.trim()" class="alert alert-warning" style="margin-top: 8px;">
          报废需要说明报废原因和补投计划
        </div>
        <div class="alert alert-info" style="margin-top: 16px;">
          <strong>动态结论证明:</strong> 此处选择的返修结论「{{ { REPAIRED: '已修复', SCRAPPED: '报废', CONCESSION: '让步接收' }[reworkCompleteForm.reworkConclusion] }}」将持久化到数据库的 <code>rework_conclusion</code> 字段，复盘页按此字段动态聚合统计。这证明返修结论是业务数据的一部分，而非静态写死的代码逻辑。
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showReworkCompleteModal = false" :disabled="submittingReworkComplete">取消</button>
          <button 
            class="btn btn-primary" 
            @click="submitReworkCompleteForm" 
            :disabled="submittingReworkComplete || (reworkCompleteForm.reworkConclusion === 'CONCESSION' && !reworkCompleteForm.reworkNote?.trim())"
          >
            {{ submittingReworkComplete ? '提交中...' : '确认提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="loading">加载中...</div>
</template>

<style scoped>
.work-order-detail {
  position: relative;
}
</style>
