<template>
  <div class="analytics-dashboard">
    <div class="mb-16">
      <h2 class="page-title">数据复盘</h2>
      <p class="page-subtitle">按区域、故障类型、响应时长多维度分析调度与维修数据</p>
    </div>

    <div class="card mb-16">
      <div class="flex gap-16" style="flex-wrap: wrap;">
        <div class="stat-card primary">
          <div class="stat-icon">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalOrders || 0 }}</div>
            <div class="stat-label">总工单数</div>
          </div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.completedOrders || 0 }}</div>
            <div class="stat-label">已完成工单</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">
            <el-icon :size="28"><Loading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.inProgressOrders || 0 }}</div>
            <div class="stat-label">进行中工单</div>
          </div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.faultRate?.toFixed(1) || 0 }}%</div>
            <div class="stat-label">故障率</div>
          </div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.avgResponseTime || 0 }}</div>
            <div class="stat-label">平均响应(分钟)</div>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon">
            <el-icon :size="28"><Tools /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.avgRepairTime || 0 }}</div>
            <div class="stat-label">平均维修(分钟)</div>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="card">
          <div class="card-title">
            <el-icon><Location /></el-icon>
            各区域工单统计
          </div>
          <div ref="districtChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <div class="card-title">
            <el-icon><PieChart /></el-icon>
            故障类型分布
          </div>
          <div ref="faultTypeChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12">
        <div class="card">
          <div class="card-title">
            <el-icon><Timer /></el-icon>
            响应时长分布
          </div>
          <div ref="responseTimeChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <div class="card-title">
            <el-icon><TrendCharts /></el-icon>
            区域工单详情
          </div>
          <el-table :data="stats?.districtStats || []" size="default">
            <el-table-column prop="district" label="区域" width="120" />
            <el-table-column prop="totalOrders" label="总工单" width="90" align="center" />
            <el-table-column prop="completedOrders" label="已完成" width="90" align="center">
              <template #default="{ row }">
                <span class="text-success">{{ row.completedOrders }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="inProgressOrders" label="进行中" width="90" align="center">
              <template #default="{ row }">
                <span class="text-warning">{{ row.inProgressOrders }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="faultOrders" label="故障数" width="90" align="center">
              <template #default="{ row }">
                <span class="text-danger">{{ row.faultOrders }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="timeoutOrders" label="超时数" width="90" align="center">
              <template #default="{ row }">
                <span class="text-danger">{{ row.timeoutOrders }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="card mt-16">
      <div class="card-title">
        <el-icon><DataAnalysis /></el-icon>
        故障类型详情
      </div>
      <el-table :data="stats?.faultTypeStats || []" style="width: 100%">
        <el-table-column prop="faultTypeLabel" label="故障类型" width="150" />
        <el-table-column prop="count" label="数量" width="120">
          <template #default="{ row }">
            <span class="text-danger text-bold">{{ row.count }}</span>
          </template>
        </el-table-column>
        <el-table-column label="占比" min-width="300">
          <template #default="{ row }">
            <div class="flex items-center gap-8">
              <el-progress
                :percentage="Math.round(row.percentage)"
                status="warning"
                :stroke-width="12"
                style="flex: 1; max-width: 400px;"
              />
              <span class="text-info" style="min-width: 60px;">
                {{ row.percentage.toFixed(1) }}%
              </span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Document,
  CircleCheck,
  Loading,
  Warning,
  Clock,
  Tools,
  Location,
  PieChart,
  Timer,
  TrendCharts,
  DataAnalysis,
} from '@element-plus/icons-vue';
import { analyticsApi } from '@/api';
import type { OverallStats } from '@/types';
import * as echarts from 'echarts';

const stats = ref<OverallStats | null>(null);

const districtChartRef = ref<HTMLDivElement | null>(null);
const faultTypeChartRef = ref<HTMLDivElement | null>(null);
const responseTimeChartRef = ref<HTMLDivElement | null>(null);

let districtChart: echarts.ECharts | null = null;
let faultTypeChart: echarts.ECharts | null = null;
let responseTimeChart: echarts.ECharts | null = null;

async function loadStats() {
  try {
    stats.value = await analyticsApi.getOverallStats();
    await nextTick();
    initCharts();
  } catch (error) {
    ElMessage.error('加载统计数据失败');
  }
}

function initCharts() {
  initDistrictChart();
  initFaultTypeChart();
  initResponseTimeChart();
}

function initDistrictChart() {
  if (!districtChartRef.value || !stats.value) return;

  if (districtChart) {
    districtChart.dispose();
  }

  districtChart = echarts.init(districtChartRef.value);

  const districtData = stats.value.districtStats || [];
  const districts = districtData.map((d) => d.district);
  const totalData = districtData.map((d) => d.totalOrders);
  const completedData = districtData.map((d) => d.completedOrders);
  const faultData = districtData.map((d) => d.faultOrders);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['总工单', '已完成', '故障工单'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: districts,
      axisLabel: {
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '总工单',
        type: 'bar',
        data: totalData,
        itemStyle: { color: '#409eff' },
        barWidth: 20,
      },
      {
        name: '已完成',
        type: 'bar',
        data: completedData,
        itemStyle: { color: '#67c23a' },
        barWidth: 20,
      },
      {
        name: '故障工单',
        type: 'bar',
        data: faultData,
        itemStyle: { color: '#f56c6c' },
        barWidth: 20,
      },
    ],
  };

  districtChart.setOption(option);
}

function initFaultTypeChart() {
  if (!faultTypeChartRef.value || !stats.value) return;

  if (faultTypeChart) {
    faultTypeChart.dispose();
  }

  faultTypeChart = echarts.init(faultTypeChartRef.value);

  const faultData = stats.value.faultTypeStats || [];
  const pieData = faultData.map((f) => ({
    value: f.count,
    name: f.faultTypeLabel,
  }));

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '故障类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData,
        color: ['#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#909399', '#9b59b6'],
      },
    ],
  };

  faultTypeChart.setOption(option);
}

function initResponseTimeChart() {
  if (!responseTimeChartRef.value || !stats.value) return;

  if (responseTimeChart) {
    responseTimeChart.dispose();
  }

  responseTimeChart = echarts.init(responseTimeChartRef.value);

  const timeData = stats.value.responseTimeStats || [];
  const labels = timeData.map((t) => t.label);
  const countData = timeData.map((t) => t.count);
  const avgData = timeData.map((t) => t.avgMinutes);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['工单数量', '平均时长(分钟)'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '工单数量',
        position: 'left',
      },
      {
        type: 'value',
        name: '平均时长(分钟)',
        position: 'right',
      },
    ],
    series: [
      {
        name: '工单数量',
        type: 'bar',
        data: countData,
        itemStyle: { color: '#409eff' },
        barWidth: 40,
        yAxisIndex: 0,
      },
      {
        name: '平均时长(分钟)',
        type: 'line',
        data: avgData,
        itemStyle: { color: '#e6a23c' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 1,
      },
    ],
  };

  responseTimeChart.setOption(option);
}

function handleResize() {
  districtChart?.resize();
  faultTypeChart?.resize();
  responseTimeChart?.resize();
}

onMounted(() => {
  loadStats();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  districtChart?.dispose();
  faultTypeChart?.dispose();
  responseTimeChart?.dispose();
});
</script>

<style lang="scss" scoped>
.analytics-dashboard {
  .stat-card {
    flex: 1;
    min-width: 160px;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid #e4e7ed;

    &.primary .stat-icon {
      background: #ecf5ff;
      color: #409eff;
    }

    &.success .stat-icon {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.warning .stat-icon {
      background: #fdf6ec;
      color: #e6a23c;
    }

    &.danger .stat-icon {
      background: #fef0f0;
      color: #f56c6c;
    }

    &.info .stat-icon {
      background: #f4f4f5;
      color: #909399;
    }

    &.purple .stat-icon {
      background: #f3eaff;
      color: #9b59b6;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-content {
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .chart-container {
    width: 100%;
    height: 320px;
  }
}
</style>
