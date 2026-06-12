<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { recordStore } from '$lib/stores/recordStore';
  import {
    formatDate,
    formatCurrency,
    getStatusLabel,
    getStatusColor,
    getTypeLabel,
    getTypeColor,
    getFieldChangeTypeLabel,
    getFieldChangeTypeColor,
    isExceptionType,
    formatJsonValue
  } from '$lib/utils/format';
  import type { RecordWithRelations } from '$lib/types';
  import { UserRole } from '$lib/types';

  let record: RecordWithRelations | null = null;
  let loading = true;
  let error: string | null = null;
  let showReprocessModal = false;
  let reprocessReason = '';

  $: recordId = $page.params.id;
  $: currentUser = $recordStore.currentUser;
  $: isFieldHandler = currentUser?.role === UserRole.FIELD_HANDLER;
  $: isQualityReviewer = currentUser?.role === UserRole.QUALITY_REVIEWER;

  onMount(async () => {
    await loadRecord();
  });

  async function loadRecord() {
    loading = true;
    error = null;
    try {
      const result = await recordStore.fetchRecordById(recordId);
      if (!result) {
        error = '记录不存在';
      } else {
        record = result;
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  async function handleReprocess() {
    if (!reprocessReason.trim()) {
      alert('请填写重新处理原因');
      return;
    }

    try {
      const result = await recordStore.reprocessRecord(recordId, reprocessReason);
      if (result) {
        record = result;
        showReprocessModal = false;
        reprocessReason = '';
        alert('已重新启动处理流程');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    }
  }

  function goBack() {
    history.back();
  }

  $: canReprocess = record?.isArchived && (isFieldHandler || isQualityReviewer);
  $: canProcess = record && !record.isArchived && isFieldHandler;
  $: canReview = record && !record.isArchived && isQualityReviewer;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <button
      on:click={goBack}
      class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      ← 返回列表
    </button>

    <div class="flex items-center space-x-3">
      {#if canProcess}
        <a
          href={`/process/${recordId}`}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          🔧 前往处理
        </a>
      {/if}
      {#if canReview}
        <a
          href={`/review/${recordId}`}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
        >
          ✅ 前往复核
        </a>
      {/if}
      {#if canReprocess}
        <button
          on:click={() => (showReprocessModal = true)}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
        >
          🔄 重新处理
        </button>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-500">加载中...</span>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
      {error}
    </div>
  {:else if record}
    {#if record.isArchived}
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div class="flex items-center">
          <span class="text-yellow-600 mr-2">📁</span>
          <span class="text-yellow-800 font-medium">此记录已归档，处于只读状态。如需修改，请点击"重新处理"按钮启动新流程。</span>
        </div>
      </div>
    {/if}

    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center space-x-3 mb-2">
              <h1 class="text-xl font-bold text-gray-900">{record.title}</h1>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTypeColor(record.type)}">
                {getTypeLabel(record.type)}
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getStatusColor(record.status)}">
                {getStatusLabel(record.status)}
              </span>
              {#if record.isArchived}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  已归档
                </span>
              {/if}
            </div>
            <p class="text-sm text-gray-500">记录编号：{record.recordNo}</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">创建时间</p>
            <p class="text-sm font-medium text-gray-900">{formatDate(record.createdAt)}</p>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50">
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">来源</p>
          <p class="text-sm text-gray-900">{record.source}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">当前责任人</p>
          <p class="text-sm text-gray-900">
            {record.currentAssignee ? record.currentAssignee.name : '未分配'}
          </p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">创建人</p>
          <p class="text-sm text-gray-900">{record.creator?.name || '-'}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">涉及金额</p>
          <p class="text-sm font-medium text-gray-900">{formatCurrency(record.amount)}</p>
        </div>
      </div>

      <div class="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-200">
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">场馆</p>
          <p class="text-sm text-gray-900">{record.venue}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">赛事名称</p>
          <p class="text-sm text-gray-900">{record.eventName}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">计划时间</p>
          <p class="text-sm text-gray-900">{formatDate(record.scheduledTime)}</p>
        </div>
      </div>

      {#if isExceptionType(record.type)}
        <div class="px-6 py-4 bg-red-50 border-t border-b border-red-200">
          <h3 class="text-lg font-semibold text-red-800 mb-4">⚠️ 异常信息</h3>

          {#if record.blockReason}
            <div class="mb-4">
              <p class="text-sm font-medium text-red-700 mb-1">阻断原因</p>
              <div class="bg-white rounded-md p-3 border border-red-200">
                <p class="text-sm text-gray-900 whitespace-pre-wrap">{record.blockReason}</p>
              </div>
            </div>
          {/if}

          {#if record.remediationPath}
            <div class="mb-4">
              <p class="text-sm font-medium text-green-700 mb-1">补救路径</p>
              <div class="bg-white rounded-md p-3 border border-green-200">
                <p class="text-sm text-gray-900 whitespace-pre-wrap">{record.remediationPath}</p>
              </div>
            </div>
          {/if}

          {#if record.basisAdopted}
            <div>
              <p class="text-sm font-medium text-blue-700 mb-1">采用依据</p>
              <div class="bg-white rounded-md p-3 border border-blue-200">
                <p class="text-sm text-gray-900">{record.basisAdopted}</p>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if record.conclusion}
        <div class="px-6 py-4 border-t border-gray-200">
          <p class="text-sm font-medium text-gray-500 mb-1">处理结论</p>
          <div class="bg-blue-50 rounded-md p-3 border border-blue-200">
            <p class="text-sm text-gray-900">{record.conclusion}</p>
          </div>
        </div>
      {/if}

      {#if record.keyObjects.length > 0}
        <div class="px-6 py-4 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">关键对象</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each record.keyObjects as obj}
              <div class="border border-gray-200 rounded-lg p-3 {obj.isCritical ? 'bg-red-50 border-red-200' : 'bg-gray-50'}">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium text-gray-500">{obj.objectType}</span>
                  {#if obj.isCritical}
                    <span class="text-xs font-medium text-red-600">关键</span>
                  {/if}
                </div>
                <p class="text-sm font-medium text-gray-900">{obj.objectName}</p>
                <p class="text-sm text-gray-600 mt-1">{obj.objectValue}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if record.diffTrackers.length > 0}
        <div class="px-6 py-4 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">处理前后差异</h3>
          <div class="space-y-4">
            {#each record.diffTrackers as diff}
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getFieldChangeTypeColor(diff.changeType)}">
                      {getFieldChangeTypeLabel(diff.changeType)}
                    </span>
                    <span class="text-sm font-medium text-gray-900">{diff.fieldName}</span>
                    {#if diff.affectsSummary}
                      <span class="text-xs text-orange-600 font-medium">影响汇总</span>
                    {/if}
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500">{diff.changedBy.name}</p>
                    <p class="text-xs text-gray-400">{formatDate(diff.createdAt)}</p>
                  </div>
                </div>
                <div class="px-4 py-3">
                  <p class="text-sm text-gray-600 mb-3">{diff.diffDescription}</p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs font-medium text-gray-500 mb-1">变更前</p>
                      <pre class="bg-red-50 border border-red-200 rounded p-2 text-xs text-gray-700 overflow-x-auto">{formatJsonValue(diff.oldValue)}</pre>
                    </div>
                    <div>
                      <p class="text-xs font-medium text-gray-500 mb-1">变更后</p>
                      <pre class="bg-green-50 border border-green-200 rounded p-2 text-xs text-gray-700 overflow-x-auto">{formatJsonValue(diff.newValue)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="px-6 py-4 border-t border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">历史节点</h3>
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div class="space-y-6">
            {#each record.nodes as (node, index)}
              <div class="relative pl-10">
                <div class="absolute left-2 w-5 h-5 rounded-full border-4 {index === record.nodes.length - 1 ? 'bg-blue-500 border-blue-200' : 'bg-white border-gray-300'}"></div>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  <div class="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <span class="text-sm font-medium text-gray-900">{node.nodeType}</span>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {getStatusColor(node.status)}">
                        {getStatusLabel(node.status)}
                      </span>
                      {#if node.isArchived}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          已归档
                        </span>
                      {/if}
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium text-gray-900">{node.handler.name}</p>
                      <p class="text-xs text-gray-500">{formatDate(node.createdAt)}</p>
                    </div>
                  </div>
                  <div class="px-4 py-3 space-y-3">
                    <p class="text-sm text-gray-900">{node.description}</p>

                    {#if node.fieldNotes}
                      <div>
                        <p class="text-xs font-medium text-gray-500 mb-1">业务记录</p>
                        <p class="text-sm text-gray-700 bg-gray-50 p-2 rounded">{node.fieldNotes}</p>
                      </div>
                    {/if}

                    {#if node.onSiteNotes}
                      <div>
                        <p class="text-xs font-medium text-gray-500 mb-1">现场说明</p>
                        <p class="text-sm text-gray-700 bg-yellow-50 p-2 rounded">{node.onSiteNotes}</p>
                      </div>
                    {/if}

                    {#if node.conclusion}
                      <div>
                        <p class="text-xs font-medium text-gray-500 mb-1">处理结论</p>
                        <p class="text-sm text-gray-700 bg-blue-50 p-2 rounded">{node.conclusion}</p>
                      </div>
                    {/if}

                    {#if node.attachments.length > 0}
                      <div>
                        <p class="text-xs font-medium text-gray-500 mb-2">证据附件</p>
                        <div class="flex flex-wrap gap-2">
                          {#each node.attachments as att}
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              class="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              📎 {att.fileName}
                            </a>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      {#if record.attachments.length > 0}
        <div class="px-6 py-4 border-t border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">全部附件</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each record.attachments as att}
              <a
                href={att.fileUrl}
                target="_blank"
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span class="text-2xl mr-3">
                  {#if att.fileType.startsWith('image/')}🖼️
                  {:else if att.fileType === 'application/pdf'}📄
                  {:else}📎{/if}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{att.fileName}</p>
                  <p class="text-xs text-gray-500">{att.description || att.fileType}</p>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">器材清单</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">器材名称</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#if record.equipmentList && typeof record.equipmentList === 'object' && 'items' in record.equipmentList}
                {#each (record.equipmentList as any).items as item}
                  <tr>
                    <td class="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{item.unit}</td>
                    <td class="px-4 py-2 text-sm">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {item.status === '完好' ? 'bg-green-100 text-green-800' : item.status === '破损' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if showReprocessModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">重新处理确认</h3>
      </div>
      <div class="px-6 py-4">
        <p class="text-sm text-gray-600 mb-4">
          归档后的记录需要重新处理时，将生成新的处理节点，原节点保留不可修改。请填写重新处理原因：
        </p>
        <textarea
          bind:value={reprocessReason}
          placeholder="请输入重新处理原因..."
          rows={4}
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        <button
          on:click={() => (showReprocessModal = false)}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          取消
        </button>
        <button
          on:click={handleReprocess}
          class="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700"
        >
          确认重新处理
        </button>
      </div>
    </div>
  </div>
{/if}
