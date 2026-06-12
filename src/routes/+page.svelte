<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
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
  import { RecordStatus, RecordType } from '$lib/types';

  let initialized = false;

  onMount(() => {
    const params = new URLSearchParams($page.url.search);
    const status = params.get('status') || 'ALL';
    const type = params.get('type') || 'ALL';
    const venue = params.get('venue') || 'ALL';
    const search = params.get('search') || '';

    recordStore.setFilters({ status, type, venue, search });
    initialized = true;

    if ($recordStore.records.length === 0) {
      recordStore.fetchRecords();
    }
  });

  function updateUrl(filters: Record<string, string>) {
    if (!initialized) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'ALL' && value !== '') {
        params.set(key, value);
      }
    });
    const query = params.toString();
    const newUrl = query ? `/?${query}` : '/';
    goto(newUrl, { replaceState: true, noScroll: true });
  }

  function drillDownByStatus(status: string) {
    const newFilters = {
      ...$recordStore.filters,
      status: status || 'ALL'
    };
    recordStore.setFilters(newFilters);
    updateUrl(newFilters);
  }

  function drillDownByType(type: string) {
    const newFilters = {
      ...$recordStore.filters,
      type: type || 'ALL'
    };
    recordStore.setFilters(newFilters);
    updateUrl(newFilters);
  }

  function drillDownByVenue(venue: string) {
    const newFilters = {
      ...$recordStore.filters,
      venue: venue || 'ALL'
    };
    recordStore.setFilters(newFilters);
    updateUrl(newFilters);
  }

  function clearFilters() {
    const newFilters = {
      status: 'ALL',
      type: 'ALL',
      venue: 'ALL',
      search: ''
    };
    recordStore.setFilters(newFilters);
    updateUrl(newFilters);
  }

  function handleFilterChange(field: string, value: string) {
    const newFilters = {
      ...$recordStore.filters,
      [field]: value
    };
    recordStore.setFilters(newFilters);
    updateUrl(newFilters);
  }

  async function handleSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    const newFilters = {
      ...$recordStore.filters,
      search: input.value
    };
    recordStore.setFilters(newFilters);
    updateUrl(newFilters);
  }

  function refreshData() {
    recordStore.fetchRecords();
  }

  $: stats = $recordStore.statistics;
  $: filters = $recordStore.filters;
  $: hasActiveFilters =
    filters.status !== 'ALL' ||
    filters.type !== 'ALL' ||
    filters.venue !== 'ALL' ||
    filters.search !== '';

  const statusOptions = [
    { value: 'ALL', label: '全部状态' },
    { value: RecordStatus.ACCEPTED, label: '已受理' },
    { value: RecordStatus.PROCESSING, label: '处理中' },
    { value: RecordStatus.REVIEWING, label: '复核中' },
    { value: RecordStatus.RETURNED_FOR_SUPPLEMENT, label: '退回补证' },
    { value: RecordStatus.ARCHIVED, label: '已归档' }
  ];

  const typeOptions = [
    { value: 'ALL', label: '全部类型' },
    { value: RecordType.NORMAL_DELIVERY, label: '正常交付' },
    { value: RecordType.QUALIFICATION_MISMATCH, label: '资格不符' },
    { value: RecordType.TIME_WINDOW_CONFLICT, label: '时间窗口冲突' },
    { value: RecordType.NOTIFICATION_UNCONFIRMED, label: '通知未确认' }
  ];
</script>

<div class="space-y-6">
  {#if stats}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
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
        <p class="text-xs text-gray-500 mt-2">点击查看全部记录</p>
      </div>

      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
        on:click={() => drillDownByStatus(RecordStatus.PROCESSING)}
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">处理中</p>
            <p class="text-3xl font-bold text-yellow-600 mt-1">{stats.processingCount}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🔧</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">点击筛选处理中记录</p>
      </div>

      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
        on:click={() => drillDownByStatus(RecordStatus.REVIEWING)}
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">复核中</p>
            <p class="text-3xl font-bold text-purple-600 mt-1">{stats.reviewingCount}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">✅</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">点击筛选复核中记录</p>
      </div>

      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
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
        <p class="text-xs text-gray-500 mt-2">点击筛选已归档记录</p>
      </div>

      <div
        class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
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
        <p class="text-xs text-gray-500 mt-2">共 {stats.total - stats.exceptionCount} 条正常交付</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">涉及金额</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">💰</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">累计合同金额</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">平均处理时长</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{formatDuration(stats.averageProcessingTime)}</p>
          </div>
          <div class="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">⏱️</span>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-2">已完成记录平均耗时</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500">归档率</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">
              {stats.total > 0 ? Math.round((stats.archivedCount / stats.total) * 100) : 0}%
            </p>
          </div>
          <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">📊</span>
          </div>
        </div>
        <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-indigo-600 h-2 rounded-full transition-all"
            style="width: {stats.total > 0 ? (stats.archivedCount / stats.total) * 100 : 0}%"
          />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">按类型分布</h3>
        <div class="space-y-3">
          {#each Object.entries(stats.byType) as [type, count]}
            <div
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              on:click={() => drillDownByType(type)}
            >
              <div class="flex items-center space-x-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTypeColor(type)}">
                  {getTypeLabel(type)}
                </span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-lg font-semibold text-gray-900">{count}</span>
                <span class="text-sm text-gray-500">
                  ({Math.round((count / stats.total) * 100)}%)
                </span>
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all"
                style="width: {(count / stats.total) * 100}%"
              />
            </div>
          {/each}
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">按场馆分布</h3>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          {#each Object.entries(stats.byVenue) as [venue, count]}
            <div
              class="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              on:click={() => drillDownByVenue(venue)}
            >
              <span class="text-sm text-gray-700 truncate flex-1">{venue}</span>
              <span class="text-lg font-semibold text-gray-900 ml-3">{count}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <h2 class="text-lg font-semibold text-gray-900">记录列表</h2>
          {#if hasActiveFilters}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              已筛选
            </span>
          {/if}
        </div>

        <div class="flex items-center space-x-3">
          <button
            on:click={refreshData}
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            🔄 刷新
          </button>
          {#if hasActiveFilters}
            <button
              on:click={clearFilters}
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              清除筛选
            </button>
          {/if}
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">搜索</label>
          <input
            type="text"
            placeholder="搜索记录编号、标题、赛事名称..."
            value={filters.search}
            on:input={handleSearch}
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={filters.status}
            on:change={(e) => handleFilterChange('status', (e.target as HTMLSelectElement).value)}
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each statusOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>

        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select
            value={filters.type}
            on:change={(e) => handleFilterChange('type', (e.target as HTMLSelectElement).value)}
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {#each typeOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>

        <div class="w-48">
          <label class="block text-sm font-medium text-gray-700 mb-1">场馆</label>
          <select
            value={filters.venue}
            on:change={(e) => handleFilterChange('venue', (e.target as HTMLSelectElement).value)}
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">全部场馆</option>
            {#each $venues as venue}
              <option value={venue}>{venue}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">记录编号</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">场馆</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#if $filteredRecords.length === 0}
            <tr>
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                暂无记录
              </td>
            </tr>
          {:else}
            {#each $filteredRecords as record}
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                  {record.recordNo}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900 max-w-xs">
                  <div class="flex items-center space-x-2">
                    {#if isExceptionType(record.type)}
                      <span class="text-red-500">⚠️</span>
                    {/if}
                    <span title={record.title}>{truncateText(record.title, 30)}</span>
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTypeColor(record.type)}">
                    {getTypeLabel(record.type)}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(record.status)}">
                    {getStatusLabel(record.status)}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {truncateText(record.venue, 15)}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatCurrency(record.amount)}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(record.createdAt)}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                  <a
                    href={`/records/${record.id}`}
                    class="text-blue-600 hover:text-blue-900"
                  >
                    详情
                  </a>
                  {#if !record.isArchived}
                    <span class="text-gray-300">|</span>
                    <a
                      href={`/process/${record.id}`}
                      class="text-green-600 hover:text-green-900"
                    >
                      处理
                    </a>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">
          显示 <span class="font-medium">{$filteredRecords.length}</span> 条记录
          {#if hasActiveFilters}
            （共 <span class="font-medium">{$recordStore.records.length}</span> 条）
          {/if}
        </p>
      </div>
    </div>
  </div>
</div>
