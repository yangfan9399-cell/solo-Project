<template>
  <div class="dispatch-detail">
    <div class="flex-between mb-16">
      <div class="flex gap-16 items-center">
        <el-button :icon="ArrowLeft" text @click="goBack">
          返回列表
        </el-button>
        <div>
          <h2 class="page-title" style="margin-bottom: 4px;">
            调度工单详情
            <el-tag v-if="order?.sampleType" :type="sampleTypeInfo(order.sampleType).color" size="small" style="margin-left: 8px;">
              {{ sampleTypeInfo(order.sampleType).label }}
            </el-tag>
          </h2>
          <p class="page-subtitle" style="margin-bottom: 0;">
            工单号：{{ order?.orderNo }}
            <el-tag :type="statusInfo(order?.status || '').color" size="small" style="margin-left: 12px;">
              {{ statusInfo(order?.status || '').label }}
            </el-tag>
          </p>
        </div>
      </div>
      <div class="flex gap-8">
        <template v-if="order?.status === 'pending' && !order.stationCodeError">
          <el-button type="primary" @click="showAssignDialog = true">
            分配调度员
          </el-button>
        </template>
        <template v-else-if="order?.status === 'dispatching'">
          <el-button type="primary" @click="arriveStation">
            标记到达
          </el-button>
        </template>
        <template v-else-if="order?.status === 'arrived'">
          <el-button type="success" @click="markAsPendingReview">
            提交复核
          </el-button>
          <el-button type="warning" @click="showRepairDialog = true">
            上报故障
          </el-button>
        </template>
        <template v-else-if="order?.status === 'pending_review'">
          <el-button type="success" @click="reviewPass">
            复核通过
          </el-button>
          <el-button type="danger" @click="showReturnDialog = true">
            复核退回
          </el-button>
        </template>
        <template v-if="order?.stationCodeError">
          <el-button type="warning" @click="showRebindDialog = true">
            重新绑定站点
          </el-button>
        </template>
      </div>
    </div>

    <el-alert
      v-if="order?.stationCodeError"
      :title="order.stationCodeErrorMessage || '站点编号错误'"
      type="error"
      show-icon
      :closable="false"
      class="mb-16"
    >
      <template #default>
        <p>上报站点编号：{{ order.reportedStationCode }}</p>
        <p class="mt-8">
          <el-button type="primary" size="small" @click="showRebindDialog = true">
            立即重新绑定
          </el-button>
        </p>
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :span="16">
        <div class="card">
          <div class="card-title">
            <el-icon><Location /></el-icon>
            站点信息
          </div>
          <template v-if="order?.station">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">站点名称</span>
                <span class="value">{{ order.station.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">站点编号</span>
                <span class="value">{{ order.station.stationCode }}</span>
              </div>
              <div class="info-item">
                <span class="label">所在区域</span>
                <span class="value">{{ order.station.district }}</span>
              </div>
              <div class="info-item">
                <span class="label">站点地址</span>
                <span class="value">{{ order.station.address }}</span>
              </div>
              <div class="info-item">
                <span class="label">站点容量</span>
                <span class="value">{{ order.station.capacity }} 辆</span>
              </div>
              <div class="info-item">
                <span class="label">当前车辆</span>
                <span class="value text-primary text-bold">
                  {{ order.station.currentBikes }} 辆
                </span>
              </div>
              <div class="info-item">
                <span class="label">站点状态</span>
                <span class="value">
                  <el-tag :type="stationStatusInfo(order.station.status).color">
                    {{ stationStatusInfo(order.station.status).label }}
                  </el-tag>
                </span>
              </div>
            </div>
          </template>
          <template v-else-if="order?.stationCodeError">
            <div class="station-error-card">
              <el-alert
                :title="order.stationCodeErrorMessage || '站点编号错误'"
                type="error"
                show-icon
                :closable="false"
                class="mb-16"
              >
                <template #default>
                  <p class="mb-8">上报站点编号：<strong>{{ order.reportedStationCode }}</strong></p>
                  <p>请重新绑定正确的站点编号后继续调度流程。</p>
                </template>
              </el-alert>
              <div class="text-center">
                <el-button type="primary" @click="showRebindDialog = true">
                  立即重新绑定站点
                </el-button>
              </div>
            </div>
          </template>
          <template v-else>
            <el-empty description="暂无站点信息" />
          </template>
        </div>

        <div class="card" v-if="order?.repairOrder">
          <div class="card-title">
            <el-icon><Tools /></el-icon>
            故障信息
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">维修单号</span>
              <span class="value">{{ order.repairOrder.repairNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">故障类型</span>
              <span class="value text-danger text-bold">
                {{ faultTypeInfo(order.repairOrder.faultType).label }}
              </span>
            </div>
            <div class="info-item">
              <span class="label">维修状态</span>
              <span class="value">
                <el-tag :type="repairStatusInfo(order.repairOrder.status).color">
                  {{ repairStatusInfo(order.repairOrder.status).label }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">维修员</span>
              <span class="value">{{ order.repairOrder.repairerName || '-' }}</span>
            </div>
          </div>
          <div class="mt-16">
            <div class="label mb-8">故障描述</div>
            <div class="fault-desc">{{ order.repairOrder.faultDescription }}</div>
          </div>
          <div class="mt-16" v-if="order.repairOrder.evidenceImages?.length">
            <div class="label mb-8">故障证据</div>
            <div class="evidence-images">
              <div
                v-for="(img, index) in order.repairOrder.evidenceImages"
                :key="index"
                class="evidence-img-wrapper"
              >
                <div class="evidence-placeholder">
                  <el-icon :size="32"><Picture /></el-icon>
                  <span>证据图片 {{ index + 1 }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-8 mt-16" v-if="order.repairOrder.status === 'pending'">
            <el-button type="primary" @click="startRepair">
              开始维修
            </el-button>
          </div>
          <div class="flex gap-8 mt-16" v-else-if="order.repairOrder.status === 'in_progress'">
            <el-button type="success" @click="showCompleteRepairDialog = true">
              完成维修
            </el-button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <el-icon><Clock /></el-icon>
            历史节点
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="node in sortedHistoryNodes"
              :key="node.id"
              :timestamp="formatDate(node.createdAt)"
              :color="nodeColor(node.nodeType)"
              placement="top"
            >
              <el-card shadow="never" class="timeline-card">
                <div class="timeline-title">
                  <span class="title-text">{{ node.title }}</span>
                  <span class="operator" v-if="node.operatorName">
                    操作人：{{ node.operatorName }}
                  </span>
                </div>
                <div class="timeline-desc" v-if="node.description">
                  <p v-for="(line, idx) in node.description.split('\n')" :key="idx">
                    {{ line }}
                  </p>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card">
          <div class="card-title">
            <el-icon><Van /></el-icon>
            调度信息
          </div>
          <div class="stat-item">
            <span class="label">需求数量</span>
            <span class="value text-primary text-bold">{{ order?.requiredQuantity || 0 }} 辆</span>
          </div>
          <div class="stat-item">
            <span class="label">已调度数量</span>
            <span class="value text-success text-bold">{{ order?.dispatchedQuantity || 0 }} 辆</span>
          </div>
          <div class="stat-item">
            <span class="label">超时时间</span>
            <span class="value">{{ order?.timeoutMinutes || 0 }} 分钟</span>
          </div>
          <el-divider />
          <div class="stat-item">
            <span class="label">创建时间</span>
            <span class="value-sm">{{ formatDate(order?.createdAt || '') }}</span>
          </div>
          <div class="stat-item">
            <span class="label">到达时间</span>
            <span class="value-sm">{{ order?.arrivedAt ? formatDate(order.arrivedAt) : '-' }}</span>
          </div>
          <div class="stat-item">
            <span class="label">完成时间</span>
            <span class="value-sm">{{ order?.completedAt ? formatDate(order.completedAt) : '-' }}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">
            <el-icon><User /></el-icon>
            责任人
          </div>
          <div class="person-item">
            <div class="person-label">调度员</div>
            <div class="person-info">
              <el-avatar :size="36" style="background: #409eff;">
                {{ order?.dispatcherName?.charAt(0) || '-' }}
              </el-avatar>
              <div class="person-detail">
                <div class="person-name">{{ order?.dispatcherName || '暂未分配' }}</div>
                <div class="person-role">调度员</div>
              </div>
            </div>
          </div>
          <el-divider />
          <div class="person-item">
            <div class="person-label">维修员</div>
            <div class="person-info">
              <el-avatar :size="36" style="background: #e6a23c;">
                {{ order?.repairOrder?.repairerName?.charAt(0) || '-' }}
              </el-avatar>
              <div class="person-detail">
                <div class="person-name">
                  {{ order?.repairOrder?.repairerName || '暂无' }}
                </div>
                <div class="person-role">维修员</div>
              </div>
            </div>
          </div>
          <el-divider />
          <div class="person-item">
            <div class="person-label">复核人</div>
            <div class="person-info">
              <el-avatar :size="36" style="background: #67c23a;">
                {{ order?.reviewerName?.charAt(0) || '-' }}
              </el-avatar>
              <div class="person-detail">
                <div class="person-name">{{ order?.reviewerName || '暂未复核' }}</div>
                <div class="person-role">复核人</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" v-if="order?.station?.bikes?.length">
          <div class="card-title">
            <el-icon><Bicycle /></el-icon>
            站点车辆 ({{ order.station.bikes.length }})
          </div>
          <div class="bike-list">
            <div
              v-for="bike in order.station.bikes.slice(0, 5)"
              :key="bike.id"
              class="bike-item"
            >
              <span class="bike-code">{{ bike.bikeCode }}</span>
              <el-tag :type="bikeStatusInfo(bike.status).color" size="small">
                {{ bikeStatusInfo(bike.status).label }}
              </el-tag>
            </div>
          </div>
          <div v-if="order.station.bikes.length > 5" class="text-info text-center mt-8">
            还有 {{ order.station.bikes.length - 5 }} 辆...
          </div>
        </div>

        <div class="card" v-if="order?.remark">
          <div class="card-title">
            <el-icon><Document /></el-icon>
            备注
          </div>
          <p>{{ order.remark }}</p>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="showAssignDialog" title="分配调度员" width="400px">
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="调度员">
          <el-select v-model="assignForm.dispatcherId" placeholder="选择调度员" style="width: 100%;">
            <el-option
              v-for="d in dispatchers"
              :key="d.id"
              :label="d.name"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调度数量">
          <el-input-number v-model="assignForm.dispatchedQuantity" :min="1" :max="order?.requiredQuantity || 100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="assignDispatcher">确认分配</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRebindDialog" title="重新绑定站点" width="400px">
      <el-alert title="站点编号错误，请输入正确的站点编号重新绑定" type="warning" show-icon class="mb-16" />
      <el-form :model="rebindForm" label-width="100px">
        <el-form-item label="原站点编号">
          <el-input :value="order?.reportedStationCode" disabled />
        </el-form-item>
        <el-form-item label="新站点编号">
          <el-input v-model="rebindForm.newStationCode" placeholder="请输入正确的站点编号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRebindDialog = false">取消</el-button>
        <el-button type="primary" @click="rebindStation">确认绑定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRepairDialog" title="上报故障" width="500px">
      <el-form :model="repairForm" label-width="100px">
        <el-form-item label="车辆编号">
          <el-input v-model="repairForm.bikeCode" placeholder="请输入车辆编号" />
        </el-form-item>
        <el-form-item label="故障类型">
          <el-select v-model="repairForm.faultType" placeholder="选择故障类型" style="width: 100%;">
            <el-option label="刹车故障" value="brake" />
            <el-option label="轮胎故障" value="tire" />
            <el-option label="链条故障" value="chain" />
            <el-option label="电气故障" value="electric" />
            <el-option label="结构故障" value="structure" />
            <el-option label="其他故障" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="repairForm.faultDescription" type="textarea" :rows="3" placeholder="请详细描述故障情况" />
        </el-form-item>
        <el-form-item label="维修员">
          <el-select v-model="repairForm.repairerId" placeholder="选择维修员" style="width: 100%;">
            <el-option
              v-for="r in repairers"
              :key="r.id"
              :label="r.name"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="danger" @click="createRepair">确认上报</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCompleteRepairDialog" title="完成维修" width="400px">
      <el-form :model="completeRepairForm" label-width="100px">
        <el-form-item label="维修结果">
          <el-radio-group v-model="completeRepairForm.cannotRepair">
            <el-radio :value="false">维修完成</el-radio>
            <el-radio :value="true">无法维修</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="维修备注">
          <el-input v-model="completeRepairForm.repairRemark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteRepairDialog = false">取消</el-button>
        <el-button type="success" @click="completeRepair">确认完成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReturnDialog" title="复核退回" width="400px">
      <el-form :model="returnForm" label-width="100px">
        <el-form-item label="退回原因">
          <el-input v-model="returnForm.reason" type="textarea" :rows="3" placeholder="请输入退回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="danger" @click="reviewReturn">确认退回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  Location,
  Tools,
  Clock,
  User,
  Van,
  Bicycle,
  Document,
  Picture,
} from '@element-plus/icons-vue';
import { dispatchApi, repairApi, userApi } from '@/api';
import type {
  DispatchOrder,
  DispatchStatus,
  DispatchSampleType,
  StationStatus,
  FaultType,
  RepairStatus,
  BikeStatus,
  NodeType,
} from '@/types';
import {
  dispatchStatusMap,
  sampleTypeMap,
  stationStatusMap,
  faultTypeMap,
  repairStatusMap,
  bikeStatusMap,
  nodeTypeMap,
} from '@/utils/constants';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();

const order = ref<DispatchOrder | null>(null);
const loading = ref(false);
const dispatchers = ref<any[]>([]);
const repairers = ref<any[]>([]);

const showAssignDialog = ref(false);
const showRebindDialog = ref(false);
const showRepairDialog = ref(false);
const showCompleteRepairDialog = ref(false);
const showReturnDialog = ref(false);

const assignForm = ref({
  dispatcherId: '',
  dispatchedQuantity: 10,
});

const rebindForm = ref({
  newStationCode: '',
});

const repairForm = ref({
  bikeCode: '',
  faultType: 'brake' as FaultType,
  faultDescription: '',
  repairerId: '',
});

const completeRepairForm = ref({
  repairRemark: '',
  cannotRepair: false,
});

const returnForm = ref({
  reason: '',
});

const sortedHistoryNodes = computed(() => {
  if (!order.value?.historyNodes) return [];
  return [...order.value.historyNodes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
});

function statusInfo(status: string) {
  return dispatchStatusMap[status as DispatchStatus] || { label: status, color: 'info' };
}

function sampleTypeInfo(type: string) {
  return sampleTypeMap[type as DispatchSampleType] || { label: type, color: 'info' };
}

function stationStatusInfo(status: string) {
  return stationStatusMap[status as StationStatus] || { label: status, color: 'info' };
}

function faultTypeInfo(type: string) {
  return faultTypeMap[type as FaultType] || { label: type };
}

function repairStatusInfo(status: string) {
  return repairStatusMap[status as RepairStatus] || { label: status, color: 'info' };
}

function bikeStatusInfo(status: string) {
  return bikeStatusMap[status as BikeStatus] || { label: status, color: 'info' };
}

function nodeColor(nodeType: string) {
  return nodeTypeMap[nodeType as NodeType]?.color || '#909399';
}

function formatDate(date: string) {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}

async function loadOrder() {
  const id = route.params.id as string;
  if (!id) return;
  loading.value = true;
  try {
    order.value = await dispatchApi.findOne(id);
  } catch (error) {
    ElMessage.error('加载调度详情失败');
  } finally {
    loading.value = false;
  }
}

async function loadUsers() {
  try {
    [dispatchers.value, repairers.value] = await Promise.all([
      userApi.getDispatchers(),
      userApi.getRepairers(),
    ]);
  } catch (error) {
    console.error('加载用户失败', error);
  }
}

function goBack() {
  router.back();
}

async function assignDispatcher() {
  if (!order.value) return;
  try {
    const dispatcher = dispatchers.value.find((d) => d.id === assignForm.value.dispatcherId);
    await dispatchApi.assignDispatcher(order.value.id, {
      dispatcherId: assignForm.value.dispatcherId,
      dispatcherName: dispatcher?.name || '',
      dispatchedQuantity: assignForm.value.dispatchedQuantity,
    });
    ElMessage.success('调度员分配成功');
    showAssignDialog.value = false;
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '分配失败');
  }
}

async function arriveStation() {
  if (!order.value) return;
  try {
    await dispatchApi.arriveStation(order.value.id);
    ElMessage.success('已标记到达');
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function markAsPendingReview() {
  if (!order.value) return;
  try {
    await dispatchApi.markAsPendingReview(order.value.id);
    ElMessage.success('已提交复核');
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function rebindStation() {
  if (!order.value) return;
  try {
    await dispatchApi.rebindStation(order.value.id, rebindForm.value.newStationCode);
    ElMessage.success('站点重新绑定成功');
    showRebindDialog.value = false;
    rebindForm.value.newStationCode = '';
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '绑定失败');
  }
}

async function createRepair() {
  if (!order.value) return;
  try {
    const repairer = repairers.value.find((r) => r.id === repairForm.value.repairerId);
    await repairApi.create({
      dispatchOrderId: order.value.id,
      bikeCode: repairForm.value.bikeCode,
      faultType: repairForm.value.faultType,
      faultDescription: repairForm.value.faultDescription,
      repairerId: repairForm.value.repairerId,
      repairerName: repairer?.name || '',
    });
    ElMessage.success('故障上报成功');
    showRepairDialog.value = false;
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '上报失败');
  }
}

async function startRepair() {
  if (!order.value?.repairOrder) return;
  try {
    await repairApi.startRepair(order.value.repairOrder.id, {
      repairerId: order.value.repairOrder.repairerId || '',
      repairerName: order.value.repairOrder.repairerName || '',
    });
    ElMessage.success('开始维修');
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function completeRepair() {
  if (!order.value?.repairOrder) return;
  try {
    await repairApi.completeRepair(order.value.repairOrder.id, {
      repairRemark: completeRepairForm.value.repairRemark,
      cannotRepair: completeRepairForm.value.cannotRepair,
    });
    ElMessage.success(completeRepairForm.value.cannotRepair ? '已标记无法维修' : '维修完成');
    showCompleteRepairDialog.value = false;
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function reviewPass() {
  if (!order.value) return;
  try {
    await dispatchApi.reviewPass(order.value.id, {
      reviewerId: 'reviewer01',
      reviewerName: '陈复核',
    });
    ElMessage.success('复核通过');
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

async function reviewReturn() {
  if (!order.value) return;
  try {
    await dispatchApi.reviewReturn(order.value.id, {
      reviewerId: 'reviewer01',
      reviewerName: '陈复核',
      reason: returnForm.value.reason,
    });
    ElMessage.success('已退回');
    showReturnDialog.value = false;
    loadOrder();
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败');
  }
}

onMounted(() => {
  loadOrder();
  loadUsers();
});
</script>

<style lang="scss" scoped>
.dispatch-detail {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      color: #909399;
    }

    .value {
      font-size: 14px;
      color: #303133;
    }
  }

  .fault-desc {
    padding: 12px;
    background: #fef0f0;
    border-radius: 4px;
    color: #f56c6c;
    font-size: 14px;
    line-height: 1.6;
  }

  .evidence-images {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .evidence-img-wrapper {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e4e7ed;
  }

  .evidence-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f5f7fa;
    color: #909399;
    font-size: 12px;
  }

  .label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .timeline-card {
    margin-bottom: 0;

    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .timeline-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    .title-text {
      font-weight: 600;
      color: #303133;
    }

    .operator {
      font-size: 12px;
      color: #909399;
    }
  }

  .timeline-desc {
    font-size: 13px;
    color: #606266;
    line-height: 1.6;

    p {
      margin: 0;
    }
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    .label {
      color: #909399;
      font-size: 14px;
    }

    .value {
      font-size: 18px;
    }

    .value-sm {
      font-size: 13px;
      color: #606266;
    }
  }

  .person-item {
    .person-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 8px;
    }

    .person-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .person-detail {
      .person-name {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .person-role {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }

  .bike-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bike-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .bike-code {
      font-family: monospace;
      font-size: 13px;
    }
  }

  .station-error-card {
    padding: 16px 0;
  }
}
</style>
