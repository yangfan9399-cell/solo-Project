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
    isExceptionType,
    getFieldChangeTypeLabel
  } from '$lib/utils/format';
  import type { RecordWithRelations } from '$lib/types';
  import { RecordStatus, FieldChangeType, UserRole } from '$lib/types';

  let record: RecordWithRelations | null = null;
  let loading = true;
  let error: string | null = null;
  let submitting = false;

  let fieldNotes = '';
  let onSiteNotes = '';
  let conclusion = '';
  let blockReason = '';
  let remediationPath = '';
  let basisAdopted = '';
  let amount = 0;
  let scheduledTime = '';
  let actualTime = '';
  let newAttachment = { fileName: '', fileType: '', fileUrl: '', description: '' };
  let attachments: Array<{ fileName: string; fileType: string; fileUrl: string; description: string }> = [];

  let fieldChanges: Array<{
    fieldName: string;
    changeType: string;
    oldValue: string;
    newValue: string;
    diffDescription: string;
  }> = [];

  let showFieldChangeForm = false;
  let newFieldChange = {
    fieldName: '',
    changeType: FieldChangeType.OTHER,
    oldValue: '',
    newValue: '',
    diffDescription: ''
  };

  $: recordId = $page.params.id;
  $: currentUser = $recordStore.currentUser;
  $: isFieldHandler = currentUser?.role === UserRole.FIELD_HANDLER;
  $: canEdit = record && !record.isArchived && isFieldHandler;

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
        amount = Number(record.amount);
        scheduledTime = record.scheduledTime ? new Date(record.scheduledTime).toISOString().slice(0, 16) : '';
        actualTime = record.actualTime ? new Date(record.actualTime).toISOString().slice(0, 16) : '';
        blockReason = record.blockReason || '';
        remediationPath = record.remediationPath || '';
        basisAdopted = record.basisAdopted || '';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  function addAttachment() {
    if (!newAttachment.fileName || !newAttachment.fileUrl) {
      alert('请填写附件名称和URL');
      return;
    }
    attachments.push({ ...newAttachment });
    newAttachment = { fileName: '', fileType: '', fileUrl: '', description: '' };
  }

  function removeAttachment(index: number) {
    attachments.splice(index, 1);
  }

  function addFieldChange() {
    if (!newFieldChange.fieldName || !newFieldChange.oldValue || !newFieldChange.newValue) {
      alert('请填写完整的字段变更信息');
      return;
    }
    fieldChanges.push({ ...newFieldChange });
    newFieldChange = {
      fieldName: '',
      changeType: FieldChangeType.OTHER,
      oldValue: '',
      newValue: '',
      diffDescription: ''
    };
    showFieldChangeForm = false;
  }

  function removeFieldChange(index: number) {
    fieldChanges.splice(index, 1);
  }

  async function submit(action: 'SAVE' | 'SUBMIT') {
    if (!canEdit || submitting) return;

    const hasContent = fieldNotes.trim() || onSiteNotes.trim() || conclusion.trim() ||
      attachments.length > 0 || fieldChanges.length > 0 ||
      blockReason.trim() || remediationPath.trim();

    if (!hasContent) {
      alert('请至少填写一项处理内容');
      return;
    }

    submitting = true;
    try {
      const processedChanges = fieldChanges.map(fc => ({
        fieldName: fc.fieldName,
        changeType: fc.changeType as FieldChangeType,
        oldValue: JSON.parse(fc.oldValue || '{}'),
        newValue: JSON.parse(fc.newValue || '{}'),
        diffDescription: fc.diffDescription || `${fc.fieldName} 已变更`
      }));

      const actionData = {
        type: 'STATUS_CHANGE' as const,
        fieldNotes: fieldNotes.trim() || undefined,
        onSiteNotes: onSiteNotes.trim() || undefined,
        conclusion: conclusion.trim() || undefined,
        status: action === 'SUBMIT' ? RecordStatus.REVIEWING : RecordStatus.PROCESSING,
        attachments: attachments.length > 0 ? attachments : undefined,
        fieldChanges: processedChanges.length > 0 ? processedChanges : undefined,
        blockReason: blockReason.trim() || undefined,
        remediationPath: remediationPath.trim() || undefined,
        basisAdopted: basisAdopted.trim() || undefined,
        amount: amount !== Number(record?.amount) ? amount : undefined,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        actualTime: actualTime ? new Date(actualTime) : undefined
      };

      const result = await recordStore.processRecord(recordId, actionData);
      if (result) {
        record = result;
        if (action === 'SUBMIT') {
          alert('已提交复核');
          window.location.href = '/process';
        } else {
          alert('已保存');
          attachments = [];
          fieldChanges = [];
        }
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '提交失败');
    } finally {
      submitting = false;
    }
  }

  function goBack() {
    history.back();
  }

  $: hasChanges = fieldNotes.trim() || onSiteNotes.trim() || conclusion.trim() ||
    attachments.length > 0 || fieldChanges.length > 0;

  const changeTypeOptions = [
    { value: FieldChangeType.CRITICAL_TIME, label: getFieldChangeTypeLabel(FieldChangeType.CRITICAL_TIME) },
    { value: FieldChangeType.RESPONSIBLE_PARTY, label: getFieldChangeTypeLabel(FieldChangeType.RESPONSIBLE_PARTY) },
    { value: FieldChangeType.AMOUNT, label: getFieldChangeTypeLabel(FieldChangeType.AMOUNT) },
    { value: FieldChangeType.EVIDENCE_CONCLUSION, label: getFieldChangeTypeLabel(FieldChangeType.EVIDENCE_CONCLUSION) },
    { value: FieldChangeType.OTHER, label: getFieldChangeTypeLabel(FieldChangeType.OTHER) }
  ];
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <button
      on:click={goBack}
      class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
    >
      ← 返回处理台
    </button>

    {#if canEdit && hasChanges}
      <div class="flex items-center space-x-3">
        <button
          on:click={() => submit('SAVE')}
          disabled={submitting}
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          💾 保存草稿
        </button>
        <button
          on:click={() => submit('SUBMIT')}
          disabled={submitting}
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          ✅ 提交复核
        </button>
      </div>
    {/if}
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
    {#if !canEdit}
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div class="flex items-center">
          <span class="text-yellow-600 mr-2">⚠️</span>
          <span class="text-yellow-800">
            {record.isArchived ? '此记录已归档，无法编辑。' : '当前用户不是一线处理人，无法编辑此记录。'}
          </span>
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
            </div>
            <p class="text-sm text-gray-500">记录编号：{record.recordNo}</p>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50">
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">场馆</p>
          <p class="text-sm text-gray-900">{record.venue}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">赛事名称</p>
          <p class="text-sm text-gray-900">{record.eventName}</p>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 mb-1">当前责任人</p>
          <p class="text-sm text-gray-900">{record.currentAssignee?.name || '-'}</p>
        </div>
      </div>

      {#if isExceptionType(record.type)}
        <div class="px-6 py-4 bg-red-50 border-t border-b border-red-200">
          <h3 class="text-lg font-semibold text-red-800 mb-4">⚠️ 异常信息</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-red-700 mb-1">阻断原因</label>
              <textarea
                bind:value={blockReason}
                placeholder="请输入阻断原因..."
                rows={3}
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-green-700 mb-1">补救路径</label>
              <textarea
                bind:value={remediationPath}
                placeholder="请输入补救路径..."
                rows={3}
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-blue-700 mb-1">采用依据</label>
            <input
              type="text"
              bind:value={basisAdopted}
              placeholder="请输入采用依据（如规范、标准等）"
              disabled={!canEdit}
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📝 业务记录</h3>
        <textarea
          bind:value={fieldNotes}
          placeholder="请输入业务记录..."
          rows={4}
          disabled={!canEdit}
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📍 现场说明</h3>
        <textarea
          bind:value={onSiteNotes}
          placeholder="请输入现场勘查说明..."
          rows={4}
          disabled={!canEdit}
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">💡 处理结论</h3>
        <textarea
          bind:value={conclusion}
          placeholder="请输入处理结论..."
          rows={3}
          disabled={!canEdit}
          class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">⚙️ 关键参数</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">金额（元）</label>
            <input
              type="number"
              bind:value={amount}
              disabled={!canEdit}
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">计划时间</label>
              <input
                type="datetime-local"
                bind:value={scheduledTime}
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">实际时间</label>
              <input
                type="datetime-local"
                bind:value={actualTime}
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">📎 证据附件</h3>
        {#if canEdit}
          <button
            on:click={() => (showFieldChangeForm = !showFieldChangeForm)}
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            + 添加字段变更
          </button>
        {/if}
      </div>

      {#if canEdit}
        <div class="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">文件名</label>
              <input
                type="text"
                bind:value={newAttachment.fileName}
                placeholder="如：现场照片.jpg"
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">文件类型</label>
              <input
                type="text"
                bind:value={newAttachment.fileType}
                placeholder="如：image/jpeg"
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">文件URL</label>
              <input
                type="text"
                bind:value={newAttachment.fileUrl}
                placeholder="如：/attachments/photo1.jpg"
                disabled={!canEdit}
                class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div class="flex items-end space-x-2">
              <div class="flex-1">
                <label class="block text-xs font-medium text-gray-700 mb-1">描述</label>
                <input
                  type="text"
                  bind:value={newAttachment.description}
                  placeholder="可选"
                  disabled={!canEdit}
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <button
                on:click={addAttachment}
                disabled={!canEdit}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {#if attachments.length > 0}
          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">待添加附件 ({attachments.length})</h4>
            <div class="space-y-2">
              {#each attachments as att, index}
                <div class="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div class="flex items-center space-x-3">
                    <span>📎</span>
                    <span class="text-sm font-medium text-gray-900">{att.fileName}</span>
                    {#if att.description}
                      <span class="text-xs text-gray-500">({att.description})</span>
                    {/if}
                  </div>
                  <button
                    on:click={() => removeAttachment(index)}
                    class="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/if}

      {#if record.attachments.length > 0}
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">已有附件 ({record.attachments.length})</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            {#each record.attachments as att}
              <a
                href={att.fileUrl}
                target="_blank"
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span class="text-xl mr-3">📎</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{att.fileName}</p>
                  <p class="text-xs text-gray-500">{att.description || att.fileType}</p>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    {#if canEdit && showFieldChangeForm}
      <div class="bg-white rounded-lg shadow p-6 border-2 border-purple-200">
        <h3 class="text-lg font-semibold text-purple-900 mb-4">🔄 添加字段变更记录</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">字段名称 *</label>
            <input
              type="text"
              bind:value={newFieldChange.fieldName}
              placeholder="如：计划回收时间"
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">变更类型 *</label>
            <select
              bind:value={newFieldChange.changeType}
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each changeTypeOptions as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">变更前值 (JSON) *</label>
            <textarea
              bind:value={newFieldChange.oldValue}
              placeholder='如：{"time": "22:00"}'
              rows={2}
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">变更后值 (JSON) *</label>
            <textarea
              bind:value={newFieldChange.newValue}
              placeholder='如：{"time": "02:00"}'
              rows={2}
              class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">变更说明</label>
          <input
            type="text"
            bind:value={newFieldChange.diffDescription}
            placeholder="简要说明变更原因"
            class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex justify-end space-x-3">
          <button
            on:click={() => (showFieldChangeForm = false)}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            on:click={addFieldChange}
            class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
          >
            添加变更记录
          </button>
        </div>
      </div>
    {/if}

    {#if fieldChanges.length > 0}
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🔄 待记录的字段变更 ({fieldChanges.length})</h3>
        <div class="space-y-3">
          {#each fieldChanges as fc, index}
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {getFieldChangeTypeLabel(fc.changeType)}
                  </span>
                  <span class="text-sm font-medium text-gray-900">{fc.fieldName}</span>
                </div>
                <button
                  on:click={() => removeFieldChange(index)}
                  class="text-red-500 hover:text-red-700 text-sm"
                >
                  删除
                </button>
              </div>
              {#if fc.diffDescription}
                <p class="text-sm text-gray-600 mb-2">{fc.diffDescription}</p>
              {/if}
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p class="font-medium text-gray-500 mb-1">变更前</p>
                  <pre class="bg-red-50 p-2 rounded overflow-x-auto">{fc.oldValue}</pre>
                </div>
                <div>
                  <p class="font-medium text-gray-500 mb-1">变更后</p>
                  <pre class="bg-green-50 p-2 rounded overflow-x-auto">{fc.newValue}</pre>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if record.diffTrackers.length > 0}
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 历史变更记录</h3>
        <div class="space-y-3">
          {#each record.diffTrackers as diff}
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
              <p class="text-sm text-gray-600 mb-2">{diff.diffDescription}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
