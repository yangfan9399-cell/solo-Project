import { component$, useVisibleTask$, useSignal, useStore, $ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { Project, Sample, Batch, Anomaly } from '~/types';
import { getProject, getAllSamples, getAllBatches, getAllAnomalies, saveProject, deleteProject, saveSample, resolveAnomaly } from '~/utils/storage';
import { PageHeader } from '~/components/header/header';
import { ToneChart } from '~/components/tone-chart/tone-chart';

type SampleStatusFilter = 'all' | 'draft' | 'annotated' | 'verified' | 'anomaly';
type TabKey = 'samples' | 'wordlist' | 'tones' | 'info';

const SAMPLE_STATUS_CHIPS: { label: string; value: SampleStatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已标注', value: 'annotated' },
  { label: '已验证', value: 'verified' },
  { label: '异常', value: 'anomaly' },
];

const STATUS_LABEL: Record<Sample['status'], string> = {
  draft: '草稿',
  annotated: '已标注',
  verified: '已验证',
  anomaly: '异常',
};

const SEVERITY_ICON: Record<Anomaly['severity'], string> = {
  high: '⚠️',
  medium: '🔶',
  low: 'ℹ️',
};

const SEVERITY_ALERT: Record<Anomaly['severity'], string> = {
  high: 'alert-danger',
  medium: 'alert-warning',
  low: 'alert-info',
};

const TONE_COLORS = ['#4a6cf7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf'];

export default component$(() => {
  const location = useLocation();
  const projectId = location.params.id;

  const activeTab = useSignal<TabKey>('samples');
  const sampleStatusFilter = useSignal<SampleStatusFilter>('all');
  const batchFilter = useSignal<string>('all');
  const sampleSearch = useSignal('');
  const showNewSample = useSignal(false);
  const confirmDelete = useSignal(false);
  const selectedSamples = useSignal<Set<string>>(new Set());
  const batchAction = useSignal<'annotated' | 'verified' | ''>('');

  const state = useStore<{
    project: Project | null;
    samples: Sample[];
    batches: Batch[];
    anomalies: Anomaly[];
  }>({
    project: null,
    samples: [],
    batches: [],
    anomalies: [],
  });

  const editForm = useStore({
    name: '',
    dialect: '',
    region: '',
    investigator: '',
    description: '',
    status: 'active' as Project['status'],
  });

  const newSampleForm = useStore({
    word: '',
    ipa: '',
    toneValue: '',
    toneCategory: '',
    notes: '',
  });

  const loadData = $(() => {
    state.project = getProject(projectId);
    state.samples = getAllSamples(projectId);
    state.batches = getAllBatches(projectId);
    state.anomalies = getAllAnomalies(projectId);
    if (state.project) {
      editForm.name = state.project.name;
      editForm.dialect = state.project.dialect;
      editForm.region = state.project.region;
      editForm.investigator = state.project.investigator;
      editForm.description = state.project.description;
      editForm.status = state.project.status;
    }
  });

  useVisibleTask$(() => {
    loadData();
  });

  const unresolvedAnomalies = useSignal<Anomaly[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.anomalies.length);
    unresolvedAnomalies.value = state.anomalies.filter((a) => !a.resolved);
  });

  const filteredSamples = useSignal<Sample[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.samples.length);
    track(() => sampleStatusFilter.value);
    track(() => batchFilter.value);
    track(() => sampleSearch.value);

    let result = state.samples;

    if (sampleStatusFilter.value !== 'all') {
      result = result.filter((s) => s.status === sampleStatusFilter.value);
    }

    if (batchFilter.value !== 'all') {
      result = result.filter((s) => s.batchId === batchFilter.value);
    }

    if (sampleSearch.value.trim()) {
      const q = sampleSearch.value.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.word.toLowerCase().includes(q) ||
          s.ipa.toLowerCase().includes(q) ||
          s.toneValue.includes(q) ||
          s.toneCategory.toLowerCase().includes(q)
      );
    }

    filteredSamples.value = result;
  });

  const toneCategories = useSignal<{ category: string; value: string; color: string; count: number; examples: string[] }[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.samples.length);

    const catMap = new Map<string, { value: string; count: number; examples: string[] }>();
    for (const sample of state.samples) {
      const cat = sample.toneCategory;
      if (!catMap.has(cat)) {
        catMap.set(cat, { value: sample.toneValue, count: 0, examples: [] });
      }
      const entry = catMap.get(cat)!;
      entry.count += 1;
      if (entry.examples.length < 3) {
        entry.examples.push(sample.word);
      }
    }

    let idx = 0;
    toneCategories.value = Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      value: data.value,
      color: TONE_COLORS[idx++ % TONE_COLORS.length],
      count: data.count,
      examples: data.examples,
    }));
  });

  const toneChartCategories = useSignal<{ category: string; value: string; color: string }[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => toneCategories.value);
    toneChartCategories.value = toneCategories.value.map((t) => ({
      category: t.category,
      value: t.value,
      color: t.color,
    }));
  });

  const handleResolve = $(async (anomalyId: string) => {
    resolveAnomaly(anomalyId);
    await loadData();
  });

  const handleSaveProject = $(() => {
    if (!state.project) return;
    const updated: Project = {
      ...state.project,
      name: editForm.name.trim(),
      dialect: editForm.dialect.trim(),
      region: editForm.region.trim(),
      investigator: editForm.investigator.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
      updatedAt: new Date().toISOString(),
    };
    saveProject(updated);
    state.project = updated;
  });

  const handleDeleteProject = $(() => {
    if (!state.project) return;
    if (!confirmDelete.value) {
      confirmDelete.value = true;
      return;
    }
    deleteProject(state.project.id);
    window.location.href = '/';
  });

  const handleCreateSample = $(() => {
    if (!newSampleForm.word.trim()) return;
    const now = new Date().toISOString();
    const waveformData = Array.from({ length: 100 }, () => Math.sin(Math.random() * Math.PI * 2) * (0.3 + Math.random() * 0.7));
    const toneDigits = newSampleForm.toneValue.split('').map(Number).filter((n) => !isNaN(n));
    const pitchData = toneDigits.length > 0
      ? Array.from({ length: 20 }, (_, i) => {
          const idx = Math.floor((i / 19) * (toneDigits.length - 1));
          const base = toneDigits[Math.min(idx, toneDigits.length - 1)] * 50 + 100;
          return base + (Math.random() - 0.5) * 20;
        })
      : Array.from({ length: 20 }, () => 150 + Math.random() * 100);
    const sample: Sample = {
      id: Date.now().toString(),
      projectId,
      batchId: state.batches.length > 0 ? state.batches[0].id : '',
      word: newSampleForm.word.trim(),
      ipa: newSampleForm.ipa.trim(),
      toneValue: newSampleForm.toneValue.trim(),
      toneCategory: newSampleForm.toneCategory.trim(),
      recordingDuration: Math.floor(800 + Math.random() * 1200),
      waveformData,
      segmentationPoints: [0.2, 0.5, 0.8],
      pitchData,
      notes: newSampleForm.notes.trim(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    saveSample(sample);
    newSampleForm.word = '';
    newSampleForm.ipa = '';
    newSampleForm.toneValue = '';
    newSampleForm.toneCategory = '';
    newSampleForm.notes = '';
    showNewSample.value = false;
    loadData();
  });

  const handleBatchAction = $(() => {
    if (!batchAction.value || selectedSamples.value.size === 0) return;
    const samples = getAllSamples(projectId);
    for (const sampleId of selectedSamples.value) {
      const sample = samples.find((s) => s.id === sampleId);
      if (sample && (sample.status === 'draft' || sample.status === 'annotated')) {
        sample.status = batchAction.value;
        sample.updatedAt = new Date().toISOString();
        saveSample(sample);
      }
    }
    selectedSamples.value = new Set();
    batchAction.value = '';
    loadData();
  });

  const toggleSampleSelect = $((id: string) => {
    const next = new Set(selectedSamples.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedSamples.value = next;
  });

  const selectAllVisible = $(() => {
    const allIds = new Set(filteredSamples.value.map((s) => s.id));
    if (allIds.size === selectedSamples.value.size && [...allIds].every((id) => selectedSamples.value.has(id))) {
      selectedSamples.value = new Set();
    } else {
      selectedSamples.value = allIds;
    }
  });

  if (!state.project) {
    return (
      <div class="empty-state">
        <p>项目不存在或正在加载...</p>
        <Link href="/">返回首页</Link>
      </div>
    );
  }

  return (
    <>
      {unresolvedAnomalies.value.length > 0 && (
        <div class="mb-16">
          {unresolvedAnomalies.value.slice(0, 5).map((anomaly) => (
            <div key={anomaly.id} class={`alert-bar ${SEVERITY_ALERT[anomaly.severity]}`}>
              <span>{SEVERITY_ICON[anomaly.severity]}</span>
              <span style={{ flex: 1 }}>{anomaly.description}</span>
              <Link href={`/project/${projectId}/sample/${anomaly.sampleId}`} style={{ textDecoration: 'none', fontSize: '12px' }}>
                样本 {anomaly.sampleId.slice(-6)}
              </Link>
              <button class="btn-secondary btn-sm" onClick$={() => handleResolve(anomaly.id)}>
                标记已解决
              </button>
            </div>
          ))}
          {unresolvedAnomalies.value.length > 5 && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 0' }}>
              还有 {unresolvedAnomalies.value.length - 5} 个未解决异常
            </div>
          )}
        </div>
      )}

      <PageHeader
        title={state.project.name}
        subtitle={`${state.project.dialect} · ${state.project.region}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/">
              ← 返回
            </Link>
            <button class="btn-primary" onClick$={() => { showNewSample.value = !showNewSample.value; }}>
              + 新建采样
            </button>
            <Link href={`/project/${projectId}/export`} class="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              导出摘要
            </Link>
            <Link href={`/project/${projectId}/history`} class="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              版本历史
            </Link>
          </div> as any
        }
      />

      <div class="tabs">
        <button class={activeTab.value === 'samples' ? 'active' : ''} onClick$={() => { activeTab.value = 'samples'; }}>
          样本列表
        </button>
        <button class={activeTab.value === 'wordlist' ? 'active' : ''} onClick$={() => { activeTab.value = 'wordlist'; }}>
          词表录音
        </button>
        <button class={activeTab.value === 'tones' ? 'active' : ''} onClick$={() => { activeTab.value = 'tones'; }}>
          调型总览
        </button>
        <button class={activeTab.value === 'info' ? 'active' : ''} onClick$={() => { activeTab.value = 'info'; }}>
          项目信息
        </button>
      </div>

      {activeTab.value === 'samples' && (
        <>
          {showNewSample.value && (
            <div class="card mb-16">
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>新建采样</h3>
              <div class="grid grid-2">
                <div class="form-group">
                  <label>词目 *</label>
                  <input type="text" value={newSampleForm.word} onInput$={(e) => { newSampleForm.word = (e.target as HTMLInputElement).value; }} />
                </div>
                <div class="form-group">
                  <label>国际音标</label>
                  <input type="text" value={newSampleForm.ipa} onInput$={(e) => { newSampleForm.ipa = (e.target as HTMLInputElement).value; }} />
                </div>
                <div class="form-group">
                  <label>调值</label>
                  <input type="text" value={newSampleForm.toneValue} onInput$={(e) => { newSampleForm.toneValue = (e.target as HTMLInputElement).value; }} />
                </div>
                <div class="form-group">
                  <label>调类</label>
                  <input type="text" value={newSampleForm.toneCategory} onInput$={(e) => { newSampleForm.toneCategory = (e.target as HTMLInputElement).value; }} />
                </div>
              </div>
              <div class="form-group">
                <label>备注</label>
                <textarea value={newSampleForm.notes} onInput$={(e) => { newSampleForm.notes = (e.target as HTMLTextAreaElement).value; }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button class="btn-secondary" onClick$={() => { showNewSample.value = false; }}>取消</button>
                <button class="btn-primary" onClick$={handleCreateSample}>创建</button>
              </div>
            </div>
          )}

          <div class="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="搜索词目、音标、调值、调类..."
              style={{ width: '260px', flexShrink: 0 }}
              value={sampleSearch.value}
              onInput$={(e) => { sampleSearch.value = (e.target as HTMLInputElement).value; }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span class="text-sm text-secondary">状态:</span>
              <div class="chip-group">
                {SAMPLE_STATUS_CHIPS.map((chip) => (
                  <span
                    key={chip.value}
                    class={`chip ${sampleStatusFilter.value === chip.value ? 'selected' : ''}`}
                    onClick$={() => { sampleStatusFilter.value = chip.value; }}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span class="text-sm text-secondary">批次:</span>
              <div class="chip-group">
                <span
                  class={`chip ${batchFilter.value === 'all' ? 'selected' : ''}`}
                  onClick$={() => { batchFilter.value = 'all'; }}
                >
                  全部
                </span>
                {state.batches.map((batch) => (
                  <span
                    key={batch.id}
                    class={`chip ${batchFilter.value === batch.id ? 'selected' : ''}`}
                    onClick$={() => { batchFilter.value = batch.id; }}
                  >
                    {batch.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {selectedSamples.value.size > 0 && (
            <div class="card mt-16" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--primary-bg)', borderColor: 'var(--primary)' }}>
              <span class="text-sm" style={{ fontWeight: 500 }}>已选 {selectedSamples.value.size} 个样本</span>
              <select
                value={batchAction.value}
                onChange$={(e) => { batchAction.value = (e.target as HTMLSelectElement).value as 'annotated' | 'verified' | ''; }}
                style={{ width: '120px' }}
              >
                <option value="">批量操作...</option>
                <option value="annotated">标记已标注</option>
                <option value="verified">标记已验证</option>
              </select>
              <button class="btn-primary btn-sm" onClick$={handleBatchAction} disabled={!batchAction.value}>
                执行
              </button>
              <button class="btn-secondary btn-sm" onClick$={() => { selectedSamples.value = new Set(); }}>
                取消选择
              </button>
            </div>
          )}

          <div class="card mt-16" style={{ padding: 0, overflow: 'hidden' }}>
            {filteredSamples.value.length === 0 ? (
              <div class="empty-state">
                <p>📭 没有匹配的样本</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>
                      <input
                        type="checkbox"
                        checked={filteredSamples.value.length > 0 && filteredSamples.value.every((s) => selectedSamples.value.has(s.id))}
                        onChange$={selectAllVisible}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </th>
                    <th>词目</th>
                    <th>国际音标</th>
                    <th>调值</th>
                    <th>调类</th>
                    <th>录音时长(ms)</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSamples.value.map((sample) => (
                    <tr key={sample.id} style={selectedSamples.value.has(sample.id) ? { background: 'var(--primary-bg)' } : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedSamples.value.has(sample.id)}
                          onChange$={() => toggleSampleSelect(sample.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{sample.word}</td>
                      <td>{sample.ipa}</td>
                      <td><code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>{sample.toneValue}</code></td>
                      <td>{sample.toneCategory}</td>
                      <td>{sample.recordingDuration}</td>
                      <td>
                        <span class={`badge badge-${sample.status}`}>
                          {STATUS_LABEL[sample.status]}
                        </span>
                      </td>
                      <td>
                        <Link href={`/project/${projectId}/sample/${sample.id}`}>编辑</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab.value === 'wordlist' && (
        <>
          <div class="card mb-16" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="搜索词目..."
              style={{ width: '260px', flexShrink: 0 }}
              value={sampleSearch.value}
              onInput$={(e) => { sampleSearch.value = (e.target as HTMLInputElement).value; }}
            />
            <span class="text-sm text-secondary">
              共 {state.samples.length} 个词目 · 录音参考用
            </span>
          </div>
          <div class="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>序号</th>
                  <th>词目</th>
                  <th>国际音标</th>
                  <th>调类</th>
                  <th>调值</th>
                  <th>录音时长</th>
                  <th>状态</th>
                  <th>批次</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSamples.value.map((sample, idx) => {
                  const batch = state.batches.find((b) => b.id === sample.batchId);
                  return (
                    <tr key={sample.id}>
                      <td class="text-secondary">{idx + 1}</td>
                      <td style={{ fontSize: '18px', fontWeight: 600 }}>{sample.word}</td>
                      <td style={{ fontFamily: 'monospace' }}>{sample.ipa}</td>
                      <td>{sample.toneCategory}</td>
                      <td><code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>{sample.toneValue}</code></td>
                      <td class="text-sm">{sample.recordingDuration}ms</td>
                      <td>
                        <span class={`badge badge-${sample.status}`}>
                          {STATUS_LABEL[sample.status]}
                        </span>
                      </td>
                      <td class="text-sm">{batch?.name ?? '-'}</td>
                      <td>
                        <Link href={`/project/${projectId}/sample/${sample.id}`} style={{ fontSize: '13px' }}>
                          {sample.status === 'draft' ? '录入' : '查看'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab.value === 'tones' && (
        <>
          <div class="card">
            <ToneChart toneCategories={toneChartCategories.value} width={600} height={400} />
          </div>

          <div class="card mt-24" style={{ padding: 0, overflow: 'hidden' }}>
            {toneCategories.value.length === 0 ? (
              <div class="empty-state">
                <p>📭 暂无调型数据</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>调类</th>
                    <th>调值</th>
                    <th>样本数</th>
                    <th>示例词</th>
                  </tr>
                </thead>
                <tbody>
                  {toneCategories.value.map((tone) => (
                    <tr key={tone.category}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: tone.color, display: 'inline-block' }} />
                          {tone.category}
                        </span>
                      </td>
                      <td><code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px' }}>{tone.value}</code></td>
                      <td>{tone.count}</td>
                      <td>{tone.examples.join('、')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab.value === 'info' && (
        <div class="card">
          <div class="grid grid-2">
            <div class="form-group">
              <label>项目名称</label>
              <input type="text" value={editForm.name} onInput$={(e) => { editForm.name = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>方言</label>
              <input type="text" value={editForm.dialect} onInput$={(e) => { editForm.dialect = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>地区</label>
              <input type="text" value={editForm.region} onInput$={(e) => { editForm.region = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>调查人</label>
              <input type="text" value={editForm.investigator} onInput$={(e) => { editForm.investigator = (e.target as HTMLInputElement).value; }} />
            </div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea value={editForm.description} onInput$={(e) => { editForm.description = (e.target as HTMLTextAreaElement).value; }} />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select
              value={editForm.status}
              onChange$={(e) => { editForm.status = (e.target as HTMLSelectElement).value as Project['status']; }}
            >
              <option value="active">进行中</option>
              <option value="completed">已完成</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button class="btn-danger" onClick$={handleDeleteProject}>
                {confirmDelete.value ? '确认删除（点击再次确认）' : '删除项目'}
              </button>
              {confirmDelete.value && (
                <button class="btn-secondary btn-sm" onClick$={() => { confirmDelete.value = false; }}>取消</button>
              )}
            </div>
            <button class="btn-primary" onClick$={handleSaveProject}>保存修改</button>
          </div>
        </div>
      )}
    </>
  );
});
