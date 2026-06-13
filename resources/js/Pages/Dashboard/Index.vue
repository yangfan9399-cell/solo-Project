<template>
    <Layout currentPage="dashboard">
        <div class="space-y-6">
            <div class="md:flex md:items-center md:justify-between">
                <div class="flex-1 min-w-0">
                    <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        统计复盘
                    </h1>
                    <p class="mt-1 text-sm text-gray-500">
                        数据更新时间：{{ formatDateTime(statistics?.updated_at || null) }}
                    </p>
                </div>
                <div class="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                    <button @click="refreshData" class="btn-secondary" :disabled="refreshing">
                        <svg class="w-4 h-4 mr-2" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {{ refreshing ? '刷新中...' : '刷新数据' }}
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div 
                    v-for="card in overviewCards" 
                    :key="card.key"
                    class="card p-6 cursor-pointer hover:shadow-md transition-shadow"
                    @click="drillDown(card)"
                >
                    <div class="flex items-center">
                        <div :class="['w-12 h-12 rounded-full flex items-center justify-center', card.bgColor]">
                            <span :class="['w-6 h-6 inline-block', card.iconColor]" v-html="card.iconSvg"></span>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">{{ card.label }}</p>
                            <p class="text-2xl font-bold text-gray-900">{{ card.value }}</p>
                            <p v-if="card.change" class="text-xs mt-1" :class="card.change > 0 ? 'text-green-600' : 'text-red-600'">
                                {{ card.change > 0 ? '↑' : '↓' }} {{ Math.abs(card.change) }}%
                            </p>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center text-xs text-blue-600">
                        <span>点击钻取详情</span>
                        <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">状态分布</h3>
                    <div ref="statusChartRef" class="h-64"></div>
                    <div class="mt-4 grid grid-cols-2 gap-2">
                        <div 
                            v-for="item in statistics?.status_distribution || []" 
                            :key="item.status"
                            class="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                            @click="drillDownByStatus(item.status)"
                        >
                            <div class="flex items-center">
                                <span :class="['w-3 h-3 rounded-full mr-2', statusColorMap[item.status]]"></span>
                                <span class="text-sm text-gray-600">{{ item.label }}</span>
                            </div>
                            <span class="text-sm font-medium">{{ item.count }}</span>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">异常类型分布</h3>
                    <div ref="anomalyChartRef" class="h-64"></div>
                    <div class="mt-4 grid grid-cols-1 gap-2">
                        <div 
                            v-for="item in statistics?.anomaly_distribution || []" 
                            :key="item.type"
                            class="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                            @click="drillDownByAnomaly(item.type)"
                        >
                            <div class="flex items-center">
                                <span class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: item.color }"></span>
                                <span class="text-sm text-gray-600">{{ item.label }}</span>
                            </div>
                            <div class="flex items-center space-x-4">
                                <span class="text-sm font-medium">{{ item.count }}</span>
                                <span class="text-xs text-gray-400">{{ item.percentage }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">金额统计</h3>
                    <div ref="amountChartRef" class="h-64"></div>
                    <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p class="text-sm text-gray-500">申请总额</p>
                            <p class="text-lg font-bold text-gray-900">¥{{ formatAmount(statistics?.amount_total?.apply || 0) }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">核定总额</p>
                            <p class="text-lg font-bold text-green-600">¥{{ formatAmount(statistics?.amount_total?.approved || 0) }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">差异总额</p>
                            <p class="text-lg font-bold text-red-600">¥{{ formatAmount(statistics?.amount_total?.diff || 0) }}</p>
                        </div>
                    </div>
                </div>

                <div class="card p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">近30天趋势</h3>
                    <div ref="trendChartRef" class="h-64"></div>
                    <div class="mt-4 flex justify-center space-x-6 text-sm">
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                            <span class="text-gray-600">新增记录</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                            <span class="text-gray-600">完成记录</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                            <span class="text-gray-600">异常记录</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">学院分布</h3>
                    <button 
                        v-if="statistics?.college_distribution?.length > 5"
                        @click="showAllColleges = !showAllColleges"
                        class="text-sm text-blue-600 hover:text-blue-800"
                    >
                        {{ showAllColleges ? '收起' : '展开全部' }}
                    </button>
                </div>
                <div ref="collegeChartRef" class="h-64"></div>
                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">学院</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">总数</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">正常</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">异常</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">异常率</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr 
                                v-for="item in displayedColleges" 
                                :key="item.college"
                                class="hover:bg-gray-50 cursor-pointer"
                                @click="drillDownByCollege(item.college)"
                            >
                                <td class="px-4 py-2 text-sm text-gray-900">{{ item.college }}</td>
                                <td class="px-4 py-2 text-sm text-center font-medium">{{ item.total }}</td>
                                <td class="px-4 py-2 text-sm text-center text-green-600">{{ item.normal }}</td>
                                <td class="px-4 py-2 text-sm text-center text-red-600">{{ item.anomaly }}</td>
                                <td class="px-4 py-2 text-sm text-center">
                                    <span :class="item.anomaly_rate > 20 ? 'text-red-600' : 'text-gray-600'">
                                        {{ item.anomaly_rate.toFixed(1) }}%
                                    </span>
                                </td>
                                <td class="px-4 py-2 text-sm text-right">
                                    <button @click.stop="drillDownByCollege(item.college)" class="text-blue-600 hover:text-blue-800">
                                        查看
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">处理时效分析</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div 
                        v-for="item in statistics?.processing_time || []" 
                        :key="item.status"
                        class="p-4 bg-gray-50 rounded-lg"
                    >
                        <p class="text-sm text-gray-500">{{ item.label }}</p>
                        <p class="text-2xl font-bold text-gray-900 mt-1">{{ item.avg_days }} 天</p>
                        <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                                class="bg-blue-500 h-2 rounded-full transition-all"
                                :style="{ width: Math.min((item.avg_days / 30) * 100, 100) + '%' }"
                            ></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">平均处理时长</p>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { usePage, router } from '@inertiajs/vue3';
import Layout from '@/Components/Layout.vue';

const page = usePage();

const statistics = computed(() => page.props.statistics);
const refreshing = ref(false);
const showAllColleges = ref(false);

const statusChartRef = ref(null);
const anomalyChartRef = ref(null);
const amountChartRef = ref(null);
const trendChartRef = ref(null);
const collegeChartRef = ref(null);

let statusChart = null;
let anomalyChart = null;
let amountChart = null;
let trendChart = null;
let collegeChart = null;

const statusColorMap = {
    'pending': 'bg-yellow-500',
    'processing': 'bg-blue-500',
    'reviewing': 'bg-purple-500',
    'appealing': 'bg-orange-500',
    'archived': 'bg-green-500',
    'returned': 'bg-red-500',
};

const overviewCards = computed(() => {
    const stats = statistics.value;
    return [
        {
            key: 'total',
            label: '总记录数',
            value: stats?.total_count || 0,
            change: 12.5,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            iconSvg: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
            drill: { filter: {} }
        },
        {
            key: 'anomaly',
            label: '异常记录',
            value: stats?.anomaly_count || 0,
            change: -5.2,
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600',
            iconSvg: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
            drill: { filter: { anomaly_type: 'has' } }
        },
        {
            key: 'archived',
            label: '已归档',
            value: stats?.archived_count || 0,
            change: 23.1,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            iconSvg: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>',
            drill: { filter: { status: 'archived' } }
        },
        {
            key: 'pending',
            label: '待处理',
            value: stats?.pending_count || 0,
            change: -2.8,
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            iconSvg: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 0 0118 0z" /></svg>',
            drill: { filter: { status: 'pending' } }
        }
    ];
});

const displayedColleges = computed(() => {
    const colleges = statistics.value?.college_distribution || [];
    return showAllColleges.value ? colleges : colleges.slice(0, 5);
});

const formatAmount = (amount) => {
    if (!amount) return '0.00';
    return Number(amount).toFixed(2);
};

const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleString('zh-CN');
};

const drillDown = (card) => {
    router.get(route('review.index'), card.drill.filter);
};

const drillDownByStatus = (status) => {
    router.get(route('review.index'), { status });
};

const drillDownByAnomaly = (anomalyType) => {
    router.get(route('review.index'), { anomaly_type: anomalyType });
};

const drillDownByCollege = (college) => {
    router.get(route('review.index'), { search: college });
};

const refreshData = () => {
    refreshing.value = true;
    router.get(route('dashboard.index'), {}, {
        preserveState: true,
        preserveScroll: true,
        onFinish: () => {
            refreshing.value = false;
        }
    });
};

const initCharts = async () => {
    await nextTick();
    
    const echarts = await import('echarts');

    if (statusChartRef.value && statistics.value?.status_distribution) {
        statusChart = echarts.init(statusChartRef.value);
        const data = statistics.value.status_distribution.map(item => ({
            name: item.label,
            value: item.count,
            itemStyle: { color: item.color }
        }));
        statusChart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                label: { show: false, position: 'center' },
                emphasis: {
                    label: { show: true, fontSize: '18', fontWeight: 'bold' }
                },
                labelLine: { show: false },
                data: data
            }]
        });
        statusChart.on('click', (params) => {
            const item = statistics.value.status_distribution.find(s => s.label === params.name);
            if (item) drillDownByStatus(item.status);
        });
    }

    if (anomalyChartRef.value && statistics.value?.anomaly_distribution) {
        anomalyChart = echarts.init(anomalyChartRef.value);
        const data = statistics.value.anomaly_distribution.map(item => ({
            name: item.label,
            value: item.count,
            itemStyle: { color: item.color }
        }));
        anomalyChart.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: { type: 'category', data: data.map(d => d.name) },
            series: [{
                type: 'bar',
                data: data,
                label: { show: true, position: 'right' }
            }]
        });
        anomalyChart.on('click', (params) => {
            const item = statistics.value.anomaly_distribution.find(a => a.label === params.name);
            if (item) drillDownByAnomaly(item.type);
        });
    }

    if (amountChartRef.value && statistics.value?.scholarship_amount) {
        amountChart = echarts.init(amountChartRef.value);
        const categories = statistics.value.scholarship_amount.map(s => s.type);
        const applyData = statistics.value.scholarship_amount.map(s => s.apply_amount);
        const approvedData = statistics.value.scholarship_amount.map(s => s.approved_amount);
        amountChart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['申请金额', '核定金额'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: categories },
            yAxis: { type: 'value', axisLabel: { formatter: '{value} 元' } },
            series: [
                { name: '申请金额', type: 'bar', data: applyData, itemStyle: { color: '#93C5FD' } },
                { name: '核定金额', type: 'bar', data: approvedData, itemStyle: { color: '#60A5FA' } }
            ]
        });
    }

    if (trendChartRef.value && statistics.value?.trend_data) {
        trendChart = echarts.init(trendChartRef.value);
        const dates = statistics.value.trend_data.map(d => d.date);
        const newData = statistics.value.trend_data.map(d => d.new_count);
        const doneData = statistics.value.trend_data.map(d => d.done_count);
        const anomalyData = statistics.value.trend_data.map(d => d.anomaly_count);
        trendChart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['新增', '完成', '异常'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', boundaryGap: false, data: dates },
            yAxis: { type: 'value' },
            series: [
                { name: '新增', type: 'line', data: newData, smooth: true, itemStyle: { color: '#3B82F6' } },
                { name: '完成', type: 'line', data: doneData, smooth: true, itemStyle: { color: '#10B981' } },
                { name: '异常', type: 'line', data: anomalyData, smooth: true, itemStyle: { color: '#EF4444' } }
            ]
        });
    }

    if (collegeChartRef.value && statistics.value?.college_distribution) {
        collegeChart = echarts.init(collegeChartRef.value);
        const colleges = statistics.value.college_distribution.slice(0, 10).map(c => c.college);
        const totalData = statistics.value.college_distribution.slice(0, 10).map(c => c.total);
        const anomalyData = statistics.value.college_distribution.slice(0, 10).map(c => c.anomaly);
        collegeChart.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['总数', '异常数'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'category', data: colleges, axisLabel: { rotate: 30, fontSize: 10 } },
            yAxis: { type: 'value' },
            series: [
                { name: '总数', type: 'bar', data: totalData, itemStyle: { color: '#93C5FD' } },
                { name: '异常数', type: 'bar', data: anomalyData, itemStyle: { color: '#F87171' } }
            ]
        });
        collegeChart.on('click', (params) => {
            drillDownByCollege(params.name);
        });
    }

    window.addEventListener('resize', () => {
        statusChart?.resize();
        anomalyChart?.resize();
        amountChart?.resize();
        trendChart?.resize();
        collegeChart?.resize();
    });
};

onMounted(() => {
    initCharts();
});

watch(() => statistics.value, () => {
    nextTick(() => {
        if (statusChart) statusChart.dispose();
        if (anomalyChart) anomalyChart.dispose();
        if (amountChart) amountChart.dispose();
        if (trendChart) trendChart.dispose();
        if (collegeChart) collegeChart.dispose();
        initCharts();
    });
}, { deep: true });
</script>
