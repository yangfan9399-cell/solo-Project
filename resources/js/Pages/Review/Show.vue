<template>
    <Layout currentPage="review">
        <div class="space-y-6">
            <div class="md:flex md:items-center md:justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-3">
                        <button @click="router.get(route('review.index'))" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            {{ detail.record_no }}
                        </h1>
                        <StatusBadge 
                            :status="detail.status"
                            :statusLabel="statusLabel"
                            :anomalyType="detail.anomaly_type"
                            :anomalyLabel="anomalyLabel"
                        />
                        <span v-if="detail.is_archived" class="badge status-archived">
                            已归档
                        </span>
                    </div>
                    <p class="mt-1 text-sm text-gray-500">{{ detail.title }}</p>
                </div>
                <div class="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                    <button 
                        v-if="canReopen && detail.is_archived"
                        @click="showReopenModal = true"
                        class="btn-warning"
                    >
                        重新处理
                    </button>
                    <button 
                        v-if="!detail.is_archived"
                        @click="activeTab = 'process'"
                        class="btn-primary"
                    >
                        处理台
                    </button>
                </div>
            </div>

            <div class="border-b border-gray-200">
                <nav class="-mb-px flex space-x-8">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        @click="activeTab = tab.key"
                        class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
                        :class="activeTab === tab.key 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    >
                        {{ tab.label }}
                    </button>
                </nav>
            </div>

            <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <div class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <InfoItem label="来源" :value="detail.source" />
                            <InfoItem label="当前责任人" :value="detail.current_owner?.name || '未分配'" />
                            <InfoItem label="学生姓名" :value="detail.student_name" />
                            <InfoItem label="学号" :value="detail.student_id" />
                            <InfoItem label="学院" :value="detail.college" />
                            <InfoItem label="奖学金类型" :value="detail.scholarship_type" />
                            <InfoItem label="申请金额" :value="'¥' + formatAmount(detail.apply_amount)" />
                            <InfoItem label="核定金额" :value="detail.approved_amount !== null ? '¥' + formatAmount(detail.approved_amount) : '待核定'" />
                            <InfoItem label="受理时间" :value="formatDateTime(detail.created_at)" />
                            <InfoItem label="最后更新" :value="formatDateTime(detail.updated_at)" />
                        </div>
                    </div>

                    <div v-if="detail.anomaly_type" class="card p-6 border-red-200 bg-red-50">
                        <div class="flex items-center mb-4">
                            <svg class="w-6 h-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 class="text-lg font-medium text-red-800">异常信息</h3>
                        </div>
                        
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-red-700 mb-1">阻断原因</label>
                                <div class="bg-white rounded p-3 text-gray-700">{{ detail.block_reason || '无' }}</div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-red-700 mb-1">差异字段</label>
                                <div class="overflow-x-auto">
                                    <table class="min-w-full bg-white rounded">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">字段</th>
                                                <th class="px-3 py-2 text-left text-xs font-medium text-red-500">期望值</th>
                                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">实际值</th>
                                                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">差异</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200">
                                            <tr v-for="(d, idx) in discrepancies" :key="idx">
                                                <td class="px-3 py-2 text-sm">{{ d.field_label || d.field_name }}</td>
                                                <td class="px-3 py-2 text-sm text-red-600">{{ formatValue(d.expected_value) }}</td>
                                                <td class="px-3 py-2 text-sm">{{ formatValue(d.actual_value) }}</td>
                                                <td class="px-3 py-2 text-sm text-red-600 font-medium">{{ d.diff_value || '-' }}</td>
                                            </tr>
                                            <tr v-if="discrepancies.length === 0">
                                                <td colspan="4" class="px-3 py-2 text-sm text-gray-500 text-center">无差异记录</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-red-700 mb-1">补救路径</label>
                                <div class="bg-white rounded p-3">
                                    <ul class="space-y-1">
                                        <li v-for="(step, idx) in remedySteps" :key="idx" class="flex items-start">
                                            <span class="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">
                                                {{ idx + 1 }}
                                            </span>
                                            <span class="text-gray-700">{{ step }}</span>
                                        </li>
                                        <li v-if="remedySteps.length === 0" class="text-gray-500">暂无</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="detail.diff_calculated" class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">处理前后差异</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">字段</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">处理前</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">处理后</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">变化</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr v-for="(diff, idx) in detail.diff_calculated" :key="idx">
                                        <td class="px-3 py-2 text-sm font-medium">{{ diff.label }}</td>
                                        <td class="px-3 py-2 text-sm text-gray-500">{{ diff.before }}</td>
                                        <td class="px-3 py-2 text-sm">{{ diff.after }}</td>
                                        <td class="px-3 py-2 text-sm">
                                            <span :class="diff.changed ? 'text-green-600' : 'text-gray-400'">
                                                {{ diff.changed ? '✓ 已变更' : '未变更' }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">采用依据</h3>
                        <div class="prose max-w-none text-gray-700">
                            {{ detail.basis || '暂无依据' }}
                        </div>
                    </div>

                    <div class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">结论</h3>
                        <div class="prose max-w-none text-gray-700">
                            {{ detail.conclusion || '暂无结论' }}
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">关键对象</h3>
                        <div class="space-y-3">
                            <div class="flex items-center p-3 bg-blue-50 rounded-lg">
                                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm font-medium text-gray-900">{{ detail.student_name }}</p>
                                    <p class="text-xs text-gray-500">当事人 · {{ detail.student_id }}</p>
                                </div>
                            </div>
                            <div v-if="detail.current_owner" class="flex items-center p-3 bg-green-50 rounded-lg">
                                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm font-medium text-gray-900">{{ detail.current_owner.name }}</p>
                                    <p class="text-xs text-gray-500">当前责任人</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">附件</h3>
                        <div v-if="attachments.length > 0" class="space-y-2">
                            <a 
                                v-for="(att, idx) in attachments" 
                                :key="idx"
                                href="#" 
                                class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <div class="ml-3 flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">{{ att.name }}</p>
                                    <p class="text-xs text-gray-500">{{ formatFileSize(att.size) }}</p>
                                </div>
                            </a>
                        </div>
                        <p v-else class="text-sm text-gray-500 text-center py-4">暂无附件</p>
                    </div>

                    <div class="card p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">操作人</h3>
                        <div class="space-y-2">
                            <div v-for="(operator, idx) in uniqueOperators" :key="idx" class="flex items-center justify-between py-1">
                                <span class="text-sm text-gray-600">{{ operator.name }}</span>
                                <span class="text-xs text-gray-400">{{ operator.count }} 次操作</span>
                            </div>
                            <p v-if="uniqueOperators.length === 0" class="text-sm text-gray-500">暂无</p>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'history'" class="card p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-medium text-gray-900">历史节点</h3>
                    <label class="flex items-center text-sm text-gray-600">
                        <input type="checkbox" v-model="showSnapshot" class="mr-2" />
                        显示完整快照
                    </label>
                </div>
                <Timeline :nodes="detail.nodes" :showSnapshot="showSnapshot" />
            </div>

            <div v-if="activeTab === 'process'" class="card p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">处理台</h3>
                
                <div v-if="detail.is_archived" class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p class="mt-2 text-gray-500">该记录已归档，只读不可修改</p>
                    <button @click="showReopenModal = true" class="mt-4 btn-warning">
                        申请重新处理
                    </button>
                </div>

                <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-900 mb-3">
                            {{ isBusinessSpecialist ? '业务补充' : '审批操作' }}
                        </h4>
                        
                        <div v-if="isBusinessSpecialist" class="space-y-4">
                            <div>
                                <label class="input-label">业务记录</label>
                                <textarea 
                                    v-model="processForm.business_note"
                                    class="input-field h-24"
                                    placeholder="请输入业务记录..."
                                ></textarea>
                            </div>
                            <div>
                                <label class="input-label">现场说明</label>
                                <textarea 
                                    v-model="processForm.on_site_note"
                                    class="input-field h-24"
                                    placeholder="请输入现场说明..."
                                ></textarea>
                            </div>
                            <div>
                                <label class="input-label">证据附件</label>
                                <div 
                                    class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                    @click="triggerFileInput"
                                    @dragover.prevent
                                    @drop.prevent="handleFileDrop"
                                >
                                    <input 
                                        ref="fileInput"
                                        type="file" 
                                        multiple
                                        class="hidden"
                                        @change="handleFileSelect"
                                    />
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p class="mt-2 text-sm text-gray-500">点击或拖拽上传证据附件</p>
                                    <p class="mt-1 text-xs text-gray-400">支持图片、PDF等格式，单文件最大10MB</p>
                                </div>
                                <div v-if="pendingFiles.length > 0" class="mt-3 space-y-2">
                                    <div 
                                        v-for="(file, idx) in pendingFiles" 
                                        :key="idx"
                                        class="flex items-center justify-between p-2 bg-gray-50 rounded"
                                    >
                                        <div class="flex items-center min-w-0 flex-1">
                                            <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span class="ml-2 text-sm text-gray-700 truncate">{{ file.name }}</span>
                                        </div>
                                        <button 
                                            type="button"
                                            @click="removePendingFile(idx)"
                                            class="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button 
                                @click="submitBusinessRecord"
                                class="btn-primary w-full"
                                :disabled="submitting"
                            >
                                {{ submitting ? '提交中...' : '提交业务记录' }}
                            </button>
                        </div>

                        <div v-else-if="isApprovalOfficer" class="space-y-4">
                            <div>
                                <label class="input-label">处理动作</label>
                                <select v-model="processForm.action" class="input-field">
                                    <option value="confirm">确认结论</option>
                                    <option value="return">退回补证</option>
                                    <option value="archive">归档</option>
                                </select>
                            </div>

                            <div v-if="processForm.action === 'confirm'">
                                <div>
                                    <label class="input-label">核定金额</label>
                                    <input 
                                        v-model.number="processForm.approved_amount"
                                        type="number" 
                                        step="0.01"
                                        class="input-field"
                                        :placeholder="'申请金额：¥' + formatAmount(detail.apply_amount)"
                                    />
                                </div>
                                <div class="mt-4">
                                    <label class="input-label">采用依据</label>
                                    <textarea 
                                        v-model="processForm.basis"
                                        class="input-field h-24"
                                        placeholder="请输入采用依据..."
                                    ></textarea>
                                </div>
                                <div class="mt-4">
                                    <label class="input-label">结论</label>
                                    <textarea 
                                        v-model="processForm.conclusion"
                                        class="input-field h-24"
                                        placeholder="请输入最终结论..."
                                    ></textarea>
                                </div>
                            </div>

                            <div v-if="processForm.action === 'return'">
                                <label class="input-label">退回原因</label>
                                <textarea 
                                    v-model="processForm.return_reason"
                                    class="input-field h-24"
                                    placeholder="请输入退回原因..."
                                ></textarea>
                            </div>

                            <div v-if="processForm.action === 'archive'">
                                <label class="input-label">归档备注</label>
                                <textarea 
                                    v-model="processForm.archive_note"
                                    class="input-field h-24"
                                    placeholder="请输入归档备注..."
                                ></textarea>
                            </div>

                            <div class="mt-4">
                                <label class="input-label">处理备注</label>
                                <textarea 
                                    v-model="processForm.remark"
                                    class="input-field h-20"
                                    placeholder="请输入处理备注..."
                                ></textarea>
                            </div>

                            <div class="flex space-x-3">
                                <button 
                                    v-if="processForm.action === 'confirm'"
                                    @click="submitReview('confirm')"
                                    class="btn-primary flex-1"
                                    :disabled="submitting"
                                >
                                    {{ submitting ? '处理中...' : '确认并提交复核' }}
                                </button>
                                <button 
                                    v-if="processForm.action === 'return'"
                                    @click="submitReview('return')"
                                    class="btn-danger flex-1"
                                    :disabled="submitting"
                                >
                                    {{ submitting ? '处理中...' : '退回补证' }}
                                </button>
                                <button 
                                    v-if="processForm.action === 'archive'"
                                    @click="submitReview('archive')"
                                    class="btn-success flex-1"
                                    :disabled="submitting"
                                >
                                    {{ submitting ? '处理中...' : '确认归档' }}
                                </button>
                            </div>
                        </div>

                        <div v-else class="text-center py-8 text-gray-500">
                            您没有处理权限
                        </div>
                    </div>

                    <div>
                        <h4 class="font-medium text-gray-900 mb-3">当前状态概览</h4>
                        <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">当前状态</span>
                                <StatusBadge 
                                    :status="detail.status"
                                    :statusLabel="statusLabel"
                                />
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">当前责任人</span>
                                <span class="font-medium">{{ detail.current_owner?.name || '未分配' }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">节点数</span>
                                <span class="font-medium">{{ detail.nodes?.length || 0 }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">创建时间</span>
                                <span class="font-medium">{{ formatDateTime(detail.created_at) }}</span>
                            </div>
                        </div>

                        <div class="mt-6">
                            <h4 class="font-medium text-gray-900 mb-3">近期操作</h4>
                            <div class="space-y-2">
                                <div v-for="(node, idx) in recentNodes" :key="idx" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div class="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900">{{ node.type_label }}</p>
                                        <p class="text-xs text-gray-500">
                                            {{ node.operator?.name || '系统' }} · {{ formatDateTime(node.created_at) }}
                                        </p>
                                        <p v-if="node.remark" class="text-xs text-gray-600 mt-1">{{ node.remark }}</p>
                                    </div>
                                </div>
                                <p v-if="recentNodes.length === 0" class="text-sm text-gray-500 text-center py-4">暂无操作</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showReopenModal" class="fixed inset-0 overflow-y-auto z-50">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" @click="showReopenModal = false"></div>
                <div class="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">申请重新处理</h3>
                    <p class="text-sm text-gray-500 mb-4">
                        重新处理将生成新的处理节点，原节点将标记为失效。请填写重新处理原因。
                    </p>
                    <form @submit.prevent="reopenRecord" class="space-y-4">
                        <div>
                            <label class="input-label">重新处理原因</label>
                            <textarea 
                                v-model="reopenForm.reason"
                                class="input-field h-24"
                                placeholder="请输入重新处理原因..."
                                required
                            ></textarea>
                        </div>
                        <div class="flex justify-end space-x-3 mt-6">
                            <button type="button" @click="showReopenModal = false" class="btn-secondary">
                                取消
                            </button>
                            <button type="submit" class="btn-warning" :disabled="reopening">
                                {{ reopening ? '处理中...' : '确认重新处理' }}
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
import StatusBadge from '@/Components/StatusBadge.vue';
import Timeline from '@/Components/Timeline.vue';
import InfoItem from '@/Components/InfoItem.vue';

const page = usePage();

const detail = computed(() => page.props.detail);
const auth = computed(() => page.props.auth);

const activeTab = ref(page.props.tab || 'overview');
const showSnapshot = ref(false);
const showReopenModal = ref(false);
const submitting = ref(false);
const reopening = ref(false);
const fileInput = ref(null);
const pendingFiles = ref([]);

const isBusinessSpecialist = computed(() => auth.value?.user?.is_business_specialist);
const isApprovalOfficer = computed(() => auth.value?.user?.is_approval_officer);
const canReopen = computed(() => isApprovalOfficer.value);

const tabs = [
    { key: 'overview', label: '总览' },
    { key: 'history', label: '历史节点' },
    { key: 'process', label: '处理台' },
];

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

const statusLabel = computed(() => statusOptions[detail.value.status] || detail.value.status);
const anomalyLabel = computed(() => detail.value.anomaly_type ? (anomalyOptions[detail.value.anomaly_type] || detail.value.anomaly_type) : null);

const discrepancies = computed(() => detail.value.discrepancies || []);
const attachments = computed(() => detail.value.attachments || []);
const remedySteps = computed(() => {
    if (!detail.value.remedy_path) return [];
    return detail.value.remedy_path.split('\n').filter(s => s.trim());
});

const uniqueOperators = computed(() => {
    const map = {};
    (detail.value.nodes || []).forEach(node => {
        if (node.operator) {
            const id = node.operator.id;
            if (!map[id]) {
                map[id] = { name: node.operator.name, count: 0 };
            }
            map[id].count++;
        }
    });
    return Object.values(map);
});

const recentNodes = computed(() => {
    return (detail.value.nodes || []).slice(0, 5);
});

const processForm = useForm({
    action: 'confirm',
    business_note: '',
    on_site_note: '',
    approved_amount: detail.value.approved_amount || detail.value.apply_amount,
    basis: detail.value.basis || '',
    conclusion: detail.value.conclusion || '',
    return_reason: '',
    archive_note: '',
    remark: '',
});

const reopenForm = useForm({
    reason: '',
});

const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0.00';
    return Number(amount).toFixed(2);
};

const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
};

const formatDateTime = (datetime) => {
    if (!datetime) return '';
    const d = new Date(datetime);
    return d.toLocaleString('zh-CN');
};

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addPendingFiles(files);
    e.target.value = '';
};

const handleFileDrop = (e) => {
    const files = Array.from(e.dataTransfer?.files || []);
    addPendingFiles(files);
};

const addPendingFiles = (files) => {
    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
            alert(`文件 ${file.name} 超过10MB限制`);
            continue;
        }
        pendingFiles.value.push(file);
    }
};

const removePendingFile = (index) => {
    pendingFiles.value.splice(index, 1);
};

const uploadFiles = async (recordId) => {
    const uploaded = [];
    for (const file of pendingFiles.value) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('attachment_type', 'evidence');
        
        const response = await fetch(route('review.attachment.upload', { record: recordId }), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                'Accept': 'application/json',
            },
            body: formData,
            credentials: 'same-origin',
        });
        
        if (!response.ok) {
            throw new Error(`上传失败: ${file.name}`);
        }
        
        const result = await response.json();
        uploaded.push(result.attachment);
    }
    return uploaded;
};

const submitBusinessRecord = async () => {
    if (!processForm.business_note && !processForm.on_site_note && pendingFiles.value.length === 0) {
        alert('请至少填写业务记录、现场说明或上传证据附件');
        return;
    }
    submitting.value = true;
    
    try {
        const formData = new FormData();
        formData.append('business_note', processForm.business_note || '');
        formData.append('on_site_note', processForm.on_site_note || '');
        formData.append('evidence_note', processForm.evidence_note || '');
        
        pendingFiles.value.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });
        
        const response = await fetch(route('review.process', { record: detail.value.id }), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                'Accept': 'text/html,application/xhtml+xml',
            },
            body: formData,
            credentials: 'same-origin',
        });
        
        if (response.ok) {
            pendingFiles.value = [];
            processForm.reset();
            router.get(route('review.show', { record: detail.value.id, tab: 'process' }));
        } else {
            alert('提交失败，请重试');
        }
    } catch (error) {
        console.error('提交错误:', error);
        alert('提交失败，请重试');
    } finally {
        submitting.value = false;
    }
};

const submitReview = (action) => {
    if (action === 'return' && !processForm.return_reason) {
        alert('请填写退回原因');
        return;
    }
    if (action === 'archive' && !processForm.archive_note) {
        alert('请填写归档备注');
        return;
    }
    submitting.value = true;
    router.post(route('review.review', { record: detail.value.id }), {
        ...processForm.data(),
        action,
    }, {
        onSuccess: () => {
            processForm.reset();
        },
        onFinish: () => {
            submitting.value = false;
        },
    });
};

const reopenRecord = () => {
    if (!reopenForm.reason) {
        alert('请填写重新处理原因');
        return;
    }
    reopening.value = true;
    router.post(route('review.reopen', { record: detail.value.id }), reopenForm.data(), {
        onSuccess: () => {
            showReopenModal.value = false;
            reopenForm.reset();
        },
        onFinish: () => {
            reopening.value = false;
        },
    });
};
</script>
