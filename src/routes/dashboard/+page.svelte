<script lang="ts">
  import { recordStore, filteredRecords, venues } from '$lib/stores/recordStore';
  import {
    formatDate,
    formatCurrency,
    getStatusLabel,
    getStatusColor,
    getTypeLabel,
    getTypeColor,
    isExceptionType,
    truncateText,
    formatDuration
  } from '$lib/utils/format';
  import { RecordStatus, RecordType, FieldChangeType } from '$lib/types';
  import type { RecordWithRelations, DiffWithRelations } from '$lib/types';

  function buildFilterUrl(filters: Record<string, string>): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'ALL' && value !== '') {
        params.set(key, value);
      }
    });
    const query = params.toString();
    return query ? `/?${query}` : '/';
  }

  function drillDownByStatus(status: string) {
    window.location.href = buildFilterUrl({ status: status || 'ALL' });
  }

  function drillDownByType(type: string) {
    window.location.href = buildFilterUrl({ type: type || 'ALL' });
  }

  function drillDownByVenue(venue: string) {
    window.location.href = buildFilterUrl({ venue: venue || 'ALL' });
  }

  function goToRecord(id: string) {
    window.location.href = `/records/${id}`;
  }

  $: stats = $recordStore.statistics;
  $: allRecords = $recordStore.records;
  $: exceptionRecords = allRecords.filter(r => isExceptionType(r.type));
  $: archivedRecords = allRecords.filter(r => r.status === RecordStatus.ARCHIVED);
  $: processingRecords = allRecords.filter(r => r.status === RecordStatus.PROCESSING);
  $: reviewingRecords = allRecords.filter(r => r.status === RecordStatus.REVIEWING);
  $: returnedRecords = allRecords.filter(r => r.status === RecordStatus.RETURNED_FOR_SUPPLEMENT);

  const typeRemediationMap: Record<string, { icon: string; steps: string[]; risks: string[] }> = {
    [RecordType.QUALIFICATION_MISMATCH]: {
      icon: '🔍',
      steps: [
        '核实供应商资质文件有效期',
        '要求补充缺失的资质证明',
        '重新审核资质材料',
        '确认资质符合要求后恢复流程'
      ],
      risks: [
        '无资质供应商可能导致器材质量问题',
        '违反招投标规定的法律风险',
        '赛事安全隐患'
      ]
    },
    [RecordType.TIME_WINDOW_CONFLICT]: {
      icon: '⏰',
      steps: [
        '协调赛事组委会调整时间窗口',
        '与场馆管理方确认可用时段',
        '重新制定器材进场/退场时间表',
        '通知所有相关方更新时间安排'
      ],
      risks: [
        '赛事日程延误',
        '多个赛事同时进行的场地冲突',
        '工作人员超时加班成本'
      ]
    },
    [RecordType.NOTIFICATION_UNCONFIRMED]: {
      icon: '📢',
      steps: [
        '重新发送确认通知（短信+邮件）',
        '电话联系责任方确认收到',
        '记录沟通内容和时间',
        '获取书面确认回执'
      ],
      risks: [
        '责任方未按时到场',
        '现场协调混乱',
        '责任认定不清'
      ]
    },
    [RecordType.NORMAL_DELIVERY]: {
      icon: '✅',
      steps: [
        '按计划执行器材布置',
        '现场验收确认',
        '完成签字确认',
        '归档保存记录'
      ],
      risks: ['正常流程，无特殊风险']
    }
  };

  $: criticalChanges = allRecords.flatMap(r =>
    r.diffTrackers.filter(d => d.affectsSummary).map(d => ({
      ...d,
      record: r
    }))
  );

  $: totalDiffCount = allRecords.reduce((sum, r) => sum + r.diffTrackers.length, 0);
  $: criticalDiffCount = criticalChanges.length;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">复盘分析</h1>
      <p class="text-sm text-gray-500 mt-1">全流程数据统计与异常分析</p>
    </div>
    <div class="text-sm text-gray-500">
      数据更新时间：{formatDate(new Date())}
    </div>
  </div>

  {#if stats}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-blue-500"
        on:click={() => drillDownByStatus('ALL')}
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">总记录数</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">📋</span>
          </div>
        </div>
        <div class="mt-3 flex items-center text-xs">
          <span class="text-green-600">↑ 12%</span>
          <span class="text-gray-400 ml-2">较上月</span>
        </div>
      </div>

      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-red-500"
        on:click={() => drillDownByType('ALL')}
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">异常记录</p>
            <p class="text-3xl font-bold text-red-600 mt-1">{stats.exceptionCount}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">⚠️</span>
          </div>
        </div>
        <div class="mt-3 flex items-center text-xs">
          <span class="text-gray-500">异常率</span>
          <span class="font-semibold text-red-600 ml-2">
            {stats.total > 0 ? Math.round((stats.exceptionCount / stats.total) * 100) : 0}%
          </span>
        </div>
      </div>

      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-green-500"
        on:click={() => drillDownByStatus(RecordStatus.ARCHIVED)}
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">已归档</p>
            <p class="text-3xl font-bold text-green-600 mt-1">{stats.archivedCount}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">📁</span>
          </div>
        </div>
        <div class="mt-3 flex items-center text-xs">
          <span class="text-gray-500">归档率</span>
          <span class="font-semibold text-green-600 ml-2">
            {stats.total > 0 ? Math.round((stats.archivedCount / stats.total) * 100) : 0}%
          </span>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">涉及金额</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">💰</span>
          </div>
        </div>
        <div class="mt-3 flex items-center text-xs">
          <span class="text-gray-500">平均处理时长</span>
          <span class="font-semibold text-purple-600 ml-2">{formatDuration(stats.averageProcessingTime)}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">状态分布</h3>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            on:click={() => drillDownByStatus(RecordStatus.PROCESSING)}
          >
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(RecordStatus.PROCESSING)}">
                处理中
              </span>
            </div>
            <span class="text-xl font-bold text-gray-900">{processingRecords.length}</span>
          </div>
          <div
            class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            on:click={() => drillDownByStatus(RecordStatus.REVIEWING)}
          >
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(RecordStatus.REVIEWING)}">
                复核中
              </span>
            </div>
            <span class="text-xl font-bold text-gray-900">{reviewingRecords.length}</span>
          </div>
          <div
            class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            on:click={() => drillDownByStatus(RecordStatus.RETURNED_FOR_SUPPLEMENT)}
          >
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(RecordStatus.RETURNED_FOR_SUPPLEMENT)}">
                退回补证
              </span>
            </div>
            <span class="text-xl font-bold text-gray-900">{returnedRecords.length}</span>
          </div>
          <div
            class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            on:click={() => drillDownByStatus(RecordStatus.ARCHIVED)}
          >
            <div class="flex items-center space-x-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(RecordStatus.ARCHIVED)}">
                已归档
              </span>
            </div>
            <span class="text-xl font-bold text-gray-900">{archivedRecords.length}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">类型分布</h3>
        <div class="space-y-4">
          {#each Object.entries(stats.byType) as [type, count]}
            <div
              class="cursor-pointer hover:bg-gray-50 transition-colors p-3 rounded-lg"
              on:click={() => drillDownByType(type)}
            >
              <div class="flex items-center justify-between mb-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTypeColor(type)}">
                  {getTypeLabel(type)}
                </span>
                <span class="text-lg font-semibold">{count}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all {isExceptionType(type) ? 'bg-red-500' : 'bg-green-500'}"
                  style="width: {(count / stats.total) * 100}%"
                />
              </div>
              <p class="text-xs text-gray-500 mt-1">
                {Math.round((count / stats.total) * 100)}% {isExceptionType(type) ? '(异常)' : '(正常)'}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">场馆分布 TOP 5</h3>
        <div class="space-y-3">
          {#each Object.entries(stats.byVenue).sort((a, b) => b[1] - a[1]).slice(0, 5) as [venue, count], i}
            <div
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              on:click={() => drillDownByVenue(venue)}
            >
              <div class="flex items-center space-x-3">
                <span class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                  {i + 1}
                </span>
                <span class="text-sm text-gray-700 truncate max-w-[150px]">{venue}</span>
              </div>
              <span class="text-lg font-semibold text-gray-900">{count}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">变更追踪统计</h3>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">总变更次数</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{totalDiffCount}</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-4">
            <p class="text-sm text-gray-500">关键字段变更</p>
            <p class="text-2xl font-bold text-orange-600 mt-1">{criticalDiffCount}</p>
          </div>
        </div>
        {#if criticalChanges.length > 0}
          <h4 class="text-sm font-semibold text-gray-700 mb-3">最近关键变更</h4>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each criticalChanges.slice(0, 10) as change}
              <div
                class="p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
                on:click={() => goToRecord(change.record.id)}
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-900">{change.record.recordNo}</span>
                  <span class="text-xs text-orange-600 font-medium">
                    {change.changeType === FieldChangeType.CRITICAL_TIME ? '⏰ 时间' :
                     change.changeType === FieldChangeType.RESPONSIBLE_PARTY ? '👤 责任方' :
                     change.changeType === FieldChangeType.AMOUNT ? '💰 金额' : '📝 结论'}
                  </span>
                </div>
                <p class="text-xs text-gray-600">{change.diffDescription}</p>
                <p class="text-xs text-gray-400 mt-1">{formatDate(change.createdAt)} · {change.changedBy?.name}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">处理效率分析</h3>
        <div class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">平均处理时长</span>
              <span class="text-lg font-bold text-gray-900">{formatDuration(stats.averageProcessingTime)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div
                class="bg-blue-500 h-3 rounded-full transition-all"
                style="width: {Math.min((stats.averageProcessingTime / (48 * 60 * 60 * 1000)) * 100, 100)}%"
              />
            </div>
            <p class="text-xs text-gray-400 mt-1">目标：48小时内完成</p>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-6">
            <div class="text-center p-4 bg-green-50 rounded-lg">
              <p class="text-3xl font-bold text-green-600">
                {stats.total > 0 ? Math.round((archivedRecords.length / stats.total) * 100) : 0}%
              </p>
              <p class="text-xs text-gray-500 mt-1">按时完成率</p>
            </div>
            <div class="text-center p-4 bg-yellow-50 rounded-lg">
              <p class="text-3xl font-bold text-yellow-600">{processingRecords.length + reviewingRecords.length}</p>
              <p class="text-xs text-gray-500 mt-1">待处理数量</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">异常样本分析</h2>
      <p class="text-sm text-gray-500 mt-1">共 {exceptionRecords.length} 条异常记录，点击查看详情</p>
    </div>
    <div class="p-4 space-y-4">
      {#if exceptionRecords.length === 0}
        <div class="text-center py-8 text-gray-500">
          暂无异常记录
        </div>
      {:else}
        {#each exceptionRecords as record}
          <div
            class="border border-red-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            on:click={() => goToRecord(record.id)}
          >
            <div class="bg-red-50 px-4 py-3 border-b border-red-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <span class="text-xl">⚠️</span>
                  <div>
                    <div class="flex items-center space-x-2">
                      <span class="font-semibold text-gray-900">{record.recordNo}</span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getTypeColor(record.type)}">
                        {getTypeLabel(record.type)}
                      </span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(record.status)}">
                        {getStatusLabel(record.status)}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">{record.title}</p>
                  </div>
                </div>
                <span class="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
              </div>
            </div>

            <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 class="text-sm font-semibold text-red-700 mb-2 flex items-center">
                  <span class="mr-1">🚫</span> 阻断原因
                </h4>
                <p class="text-sm text-gray-700 bg-red-50 p-3 rounded">
                  {record.blockReason || '暂无阻断原因说明'}
                </p>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-orange-700 mb-2 flex items-center">
                  <span class="mr-1">📊</span> 差异字段
                </h4>
                {#if record.diffTrackers.length > 0}
                  <div class="space-y-2 max-h-24 overflow-y-auto">
                    {#each record.diffTrackers.slice(0, 3) as diff}
                      <div class="text-xs bg-orange-50 p-2 rounded">
                        <span class="font-medium">{diff.fieldName}:</span>
                        <span class="text-gray-500 line-through mx-1">{JSON.stringify(diff.oldValue)}</span>
                        <span class="text-green-600">→ {JSON.stringify(diff.newValue)}</span>
                      </div>
                    {/each}
                    {#if record.diffTrackers.length > 3}
                      <p class="text-xs text-gray-400">还有 {record.diffTrackers.length - 3} 处变更...</p>
                    {/if}
                  </div>
                {:else}
                  <p class="text-sm text-gray-500 bg-gray-50 p-3 rounded">暂无差异记录</p>
                {/if}
              </div>

              <div>
                <h4 class="text-sm font-semibold text-green-700 mb-2 flex items-center">
                  <span class="mr-1">🛤️</span> 补救路径
                </h4>
                <p class="text-sm text-gray-700 bg-green-50 p-3 rounded">
                  {record.remediationPath || '暂无补救路径说明'}
                </p>
              </div>
            </div>

            <div class="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>场馆：{record.venue}</span>
                <span>金额：{formatCurrency(record.amount)}</span>
                <span>责任人：{record.currentAssignee?.name || '未分配'}</span>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">标准补救路径指南</h2>
      <p class="text-sm text-gray-500 mt-1">各类异常的标准处理流程和风险提示</p>
    </div>
    <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each Object.entries(typeRemediationMap) as [type, info]}
        <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">{info.icon}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getTypeColor(type)}">
                {getTypeLabel(type)}
              </span>
            </div>
          </div>
          <div class="p-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">处理步骤</h4>
            <ol class="text-xs text-gray-600 space-y-1 mb-4">
              {#each info.steps as step, i}
                <li class="flex items-start">
                  <span class="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              {/each}
            </ol>
            <h4 class="text-sm font-semibold text-red-600 mb-2">风险提示</h4>
            <ul class="text-xs text-gray-600 space-y-1">
              {#each info.risks as risk}
                <li class="flex items-start">
                  <span class="text-red-500 mr-1">•</span>
                  <span>{risk}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">流程节点统计</h2>
      <p class="text-sm text-gray-500 mt-1">全流程各节点处理情况</p>
    </div>
    <div class="p-4">
      <div class="flex items-center justify-between space-x-2">
        <div class="flex-1 text-center">
          <div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <span class="text-2xl">📥</span>
          </div>
          <p class="text-sm font-medium text-gray-900">受理</p>
          <p class="text-2xl font-bold text-blue-600">{allRecords.length}</p>
        </div>
        <div class="text-gray-300 text-2xl">→</div>
        <div class="flex-1 text-center">
          <div class="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
            <span class="text-2xl">🔧</span>
          </div>
          <p class="text-sm font-medium text-gray-900">处理</p>
          <p class="text-2xl font-bold text-yellow-600">{allRecords.filter(r => r.nodes.length > 1).length}</p>
        </div>
        <div class="text-gray-300 text-2xl">→</div>
        <div class="flex-1 text-center">
          <div class="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2">
            <span class="text-2xl">✅</span>
          </div>
          <p class="text-sm font-medium text-gray-900">复核</p>
          <p class="text-2xl font-bold text-purple-600">{reviewingRecords.length + archivedRecords.length}</p>
        </div>
        <div class="text-gray-300 text-2xl">→</div>
        <div class="flex-1 text-center">
          <div class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
            <span class="text-2xl">📁</span>
          </div>
          <p class="text-sm font-medium text-gray-900">归档</p>
          <p class="text-2xl font-bold text-green-600">{archivedRecords.length}</p>
        </div>
      </div>
      <div class="mt-6 pt-6 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-3xl font-bold text-gray-900">
              {allRecords.reduce((sum, r) => sum + r.nodes.length, 0)}
            </p>
            <p class="text-sm text-gray-500 mt-1">总节点数</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-3xl font-bold text-gray-900">
              {allRecords.reduce((sum, r) => sum + r.attachments.length, 0)}
            </p>
            <p class="text-sm text-gray-500 mt-1">证据附件数</p>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <p class="text-3xl font-bold text-gray-900">
              {allRecords.reduce((sum, r) => sum + r.keyObjects.length, 0)}
            </p>
            <p class="text-sm text-gray-500 mt-1">关键对象数</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
