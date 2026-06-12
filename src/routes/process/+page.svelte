<script lang="ts">
  import { onMount } from 'svelte';
  import { recordStore } from '$lib/stores/recordStore';
  import {
    formatDate,
    formatCurrency,
    getStatusLabel,
    getStatusColor,
    getTypeLabel,
    getTypeColor,
    isExceptionType,
    truncateText
  } from '$lib/utils/format';
  import type { RecordWithRelations } from '$lib/types';
  import { RecordStatus, UserRole } from '$lib/types';

  let loading = true;
  let error: string | null = null;

  $: currentUser = $recordStore.currentUser;
  $: isFieldHandler = currentUser?.role === UserRole.FIELD_HANDLER;

  $: myRecords = $recordStore.records.filter(r =>
    !r.isArchived && (
      r.currentAssigneeId === currentUser?.id ||
      r.status === RecordStatus.PROCESSING ||
      r.status === RecordStatus.RETURNED_FOR_SUPPLEMENT
    )
  );

  onMount(async () => {
    try {
      await recordStore.fetchRecords();
    } catch (e) {
      error = e instanceof Error ? e.message : '加载失败';
    } finally {
      loading = false;
    }
  });

  function refresh() {
    recordStore.fetchRecords();
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">处理台</h1>
      <p class="text-sm text-gray-500 mt-1">一线处理人工作区：补充业务记录、现场说明和证据附件</p>
    </div>
    <button
      on:click={refresh}
      class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
    >
      🔄 刷新
    </button>
  </div>

  {#if !isFieldHandler}
    <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div class="flex items-center">
        <span class="text-yellow-600 mr-2">⚠️</span>
        <span class="text-yellow-800">当前用户不是一线处理人，仅可查看。如需处理，请切换角色。</span>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-500">加载中...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
      {error}
    </div>
  {:else}
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">待处理记录</h2>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {myRecords.length} 条待处理
          </span>
        </div>
      </div>

      {#if myRecords.length === 0}
        <div class="px-6 py-12 text-center">
          <span class="text-4xl">🎉</span>
          <p class="mt-2 text-gray-500">暂无待处理记录</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-200">
          {#each myRecords as record}
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-2">
                    <span class="text-sm font-medium text-blue-600">{record.recordNo}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getTypeColor(record.type)}">
                      {getTypeLabel(record.type)}
                    </span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(record.status)}">
                      {getStatusLabel(record.status)}
                    </span>
                    {#if isExceptionType(record.type)}
                      <span class="text-red-500 text-sm">⚠️ 异常</span>
                    {/if}
                  </div>
                  <h3 class="text-base font-medium text-gray-900 mb-1">{record.title}</h3>
                  <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>🏟️ {record.venue}</span>
                    <span>🏆 {record.eventName}</span>
                    <span>💰 {formatCurrency(record.amount)}</span>
                    <span>📅 {formatDate(record.scheduledTime)}</span>
                  </div>
                  {#if record.blockReason}
                    <div class="mt-2 bg-red-50 border border-red-200 rounded p-2">
                      <p class="text-xs font-medium text-red-700 mb-1">阻断原因</p>
                      <p class="text-sm text-red-600">{truncateText(record.blockReason, 100)}</p>
                    </div>
                  {/if}
                </div>
                <div class="ml-4 flex flex-col space-y-2">
                  <a
                    href={`/process/${record.id}`}
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 {!isFieldHandler ? 'opacity-50 cursor-not-allowed' : ''}"
                    aria-disabled={!isFieldHandler}
                    on:click|preventDefault={(e) => {
                      if (!isFieldHandler) {
                        e.preventDefault();
                        alert('请切换到一线处理人角色');
                      } else {
                        window.location.href = `/process/${record.id}`;
                      }
                    }}
                  >
                    🔧 处理
                  </a>
                  <a
                    href={`/records/${record.id}`}
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    查看详情
                  </a>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
