<template>
    <Layout currentPage="review">
        <div class="space-y-6">
            <div class="md:flex md:items-center md:justify-between">
                <div class="flex-1 min-w-0">
                    <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        评审记录列表
                    </h1>
                    <p class="mt-1 text-sm text-gray-500">
                        共 {{ listData.pagination.total }} 条记录，异常记录 {{ statistics?.anomaly_count || 0 }} 条
                    </p>
                </div>
                <div class="mt-4 flex md:mt-0 md:ml-4">
                    <button 
                        v-if="canCreate"
                        @click="showCreateModal = true"
                        class="btn-primary"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        新建记录
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex-1 min-w-[200px]">
                            <input
                                v-model="filters.search"
                                type="text"
                                placeholder="搜索：编号、姓名、学号..."
                                class="input-field"
                                @input.debounce="applyFilters"
                            />
                        </div>
                        <div class="w-40">
                            <select v-model="filters.status" class="input-field" @change="applyFilters">
                                <option value="">全部状态</option>
                                <option v-for="(label, value) in statusOptions" :key="value" :value="value">
                                    {{ label }}
                                </option>
                            </select>
                        </div>
                        <div class="w-40">
                            <select v-model="filters.anomaly_type" class="input-field" @change="applyFilters">
                                <option value="">全部类型</option>
                                <option value="normal">正常</option>
                                <option v-for="(label, value) in anomalyOptions" :key="value" :value="value">
                                    {{ label }}
                                </option>
                            </select>
                        </div>
                        <button @click="resetFilters" class="btn-secondary">
                            重置
                        </button>
                    </div>
                </div>

                <DataTable 
                    :columns="columns" 
                    :data="listData.data"
                    :actions="true"
                    @row-click="goToDetail"
                >
                    <template #cell-amount="props">
                        <div class="text-sm">
                            <div class="font-medium text-gray-900">
                                申请：¥{{ formatAmount(props.row.apply_amount) }}
                            </div>
                            <div v-if="props.row.approved_amount !== null" class="text-gray-500">
                                核定：¥{{ formatAmount(props.row.approved_amount) }}
                            </div>
                        </div>
                    </template>

                    <template #actions="props">
                        <button
                            @click.stop="goToDetail(props.row)"
                            class="text-blue-600 hover:text-blue-900 mr-3"
                        >
                            详情
                        </button>
                        <button
                            v-if="canProcess(props.row)"
                            @click.stop="goToDetail(props.row, 'process')"
                            class="text-green-600 hover:text-green-900"
                        >
                            处理
                        </button>
                    </template>
                </DataTable>

                <Pagination 
                    :pagination="listData.pagination" 
                    @page-change="changePage"
                />
            </div>
        </div>

        <div v-if="showCreateModal" class="fixed inset-0 overflow-y-auto z-50">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showCreateModal = false"></div>
                <div class="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">新建评审记录</h3>
                    <form @submit.prevent="createRecord" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="input-label">姓名</label>
                                <input v-model="createForm.student_name" type="text" class="input-field" required />
                            </div>
                            <div>
                                <label class="input-label">学号</label>
                                <input v-model="createForm.student_id" type="text" class="input-field" required />
                            </div>
                        </div>
                        <div>
                            <label class="input-label">标题</label>
                            <input v-model="createForm.title" type="text" class="input-field" required />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="input-label">学院</label>
                                <input v-model="createForm.college" type="text" class="input-field" required />
                            </div>
                            <div>
                                <label class="input-label">奖学金类型</label>
                                <input v-model="createForm.scholarship_type" type="text" class="input-field" required />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="input-label">来源</label>
                                <input v-model="createForm.source" type="text" class="input-field" value="系统录入" required />
                            </div>
                            <div>
                                <label class="input-label">申请金额</label>
                                <input v-model.number="createForm.apply_amount" type="number" step="0.01" class="input-field" required />
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" @click="showCreateModal = false" class="btn-secondary">
                                取消
                            </button>
                            <button type="submit" class="btn-primary" :disabled="creating">
                                {{ creating ? '创建中...' : '创建' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { usePage, router, useForm } from '@inertiajs/vue3';
import Layout from '@/Components/Layout.vue';
import DataTable from '@/Components/DataTable.vue';
import Pagination from '@/Components/Pagination.vue';
import StatusBadge from '@/Components/StatusBadge.vue';

const page = usePage();

const listData = computed(() => page.props.listData);
const statistics = computed(() => page.props.statistics);
const auth = computed(() => page.props.auth);

const showCreateModal = ref(false);
const creating = ref(false);

const filters = ref({
    search: '',
    status: '',
    anomaly_type: '',
    page: 1,
});

const createForm = useForm({
    title: '',
    source: '系统录入',
    student_name: '',
    student_id: '',
    college: '',
    scholarship_type: '',
    apply_amount: 0,
});

const canCreate = computed(() => auth.value?.user?.is_approval_officer || auth.value?.user?.is_business_specialist);

const statusOptions = {
    'pending': '待受理',
    'processing': '处理中',
    'reviewing': '复核中',
    'appealing': '申诉中',
    'archived': '已归档',
    'returned': '已退回',
};

const anomalyOptions = {
    'no_conflict': '编号冲突',
    'amount_diff': '金额差异',
    'count_diff': '数量差异',
    'appeal': '当事人申诉',
};

const columns = [
    { key: 'record_no', label: '编号' },
    { key: 'student_name', label: '姓名' },
    { key: 'scholarship_type', label: '奖项' },
    { key: 'amount', label: '金额' },
    { 
        key: 'status', 
        label: '状态',
        component: StatusBadge,
        props: (row) => ({
            status: row.status,
            statusLabel: row.status_label || statusOptions[row.status],
            anomalyType: row.anomaly_type,
            anomalyLabel: row.anomaly_label || (row.anomaly_type ? anomalyOptions[row.anomaly_type] || row.anomaly_type : null)
        })
    },
    { key: 'college', label: '学院' },
    { key: 'updated_at', label: '更新时间' },
];

const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return Number(amount).toFixed(2);
};

const canProcess = (row) => {
    if (row.is_archived) return false;
    return auth.value?.user?.is_approval_officer || 
           (auth.value?.user?.is_business_specialist && row.status === 'processing');
};

const goToDetail = (row, tab = null) => {
    const url = route('review.show', { record: row.id });
    if (tab) {
        router.get(url, { tab });
    } else {
        router.get(url);
    }
};

const applyFilters = () => {
    filters.value.page = 1;
    loadData();
};

const resetFilters = () => {
    filters.value = {
        search: '',
        status: '',
        anomaly_type: '',
        page: 1,
    };
    loadData();
};

const changePage = (page) => {
    filters.value.page = page;
    loadData();
};

const loadData = () => {
    router.get(route('review.index'), filters.value, {
        preserveState: true,
        preserveScroll: true,
    });
};

const createRecord = () => {
    creating.value = true;
    createForm.post(route('review.store'), {
        onSuccess: () => {
            showCreateModal.value = false;
            createForm.reset();
        },
        onFinish: () => {
            creating.value = false;
        },
    });
};
</script>
