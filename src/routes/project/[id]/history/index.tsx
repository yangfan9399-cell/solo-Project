import { component$, useVisibleTask$, useSignal, useStore, $ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { VersionSnapshot, Batch, Sample } from '~/types';
import { getProject, getAllVersions, getAllBatches, getAllSamples, saveVersion, saveBatch } from '~/utils/storage';
import { PageHeader } from '~/components/header/header';

export default component$(() => {
  const location = useLocation();
  const projectId = location.params.id;

  const state = useStore<{
    project: { name: string } | null;
    versions: VersionSnapshot[];
    batches: Batch[];
    samples: Sample[];
  }>({
    project: null,
    versions: [],
    batches: [],
    samples: [],
  });

  const showNewBatch = useSignal(false);
  const showNewVersion = useSignal(false);
  const expandedVersionId = useSignal<string | null>(null);
  const diffVersionA = useSignal<string | null>(null);
  const diffVersionB = useSignal<string | null>(null);

  const newBatchForm = useStore({ name: '', notes: '' });
  const newVersionForm = useStore({ description: '' });

  const loadData = $(() => {
    const project = getProject(projectId);
    state.project = project ? { name: project.name } : null;
    state.versions = getAllVersions(projectId);
    state.batches = getAllBatches(projectId);
    state.samples = getAllSamples(projectId);
  });

  useVisibleTask$(() => {
    loadData();
  });

  const handleCreateBatch = $(() => {
    if (!newBatchForm.name.trim()) return;
    const batch: Batch = {
      id: Date.now().toString(),
      projectId,
      name: newBatchForm.name.trim(),
      createdAt: new Date().toISOString(),
      sampleIds: [],
      notes: newBatchForm.notes.trim(),
    };
    saveBatch(batch);
    newBatchForm.name = '';
    newBatchForm.notes = '';
    showNewBatch.value = false;
    loadData();
  });

  const handleCreateVersion = $(() => {
    if (!newVersionForm.description.trim()) return;
    const currentSamples = getAllSamples(projectId);
    const maxVersion = state.versions.length > 0
      ? Math.max(...state.versions.map((v) => v.version))
      : 0;
    const version: VersionSnapshot = {
      id: Date.now().toString(),
      projectId,
      batchId: '',
      version: maxVersion + 1,
      snapshot: [...currentSamples],
      createdAt: new Date().toISOString(),
      description: newVersionForm.description.trim(),
    };
    saveVersion(version);
    newVersionForm.description = '';
    showNewVersion.value = false;
    loadData();
  });

  const selectedVersionA = useSignal<VersionSnapshot | null>(null);
  const selectedVersionB = useSignal<VersionSnapshot | null>(null);

  useVisibleTask$(({ track }) => {
    track(() => diffVersionA.value);
    track(() => diffVersionB.value);
    track(() => state.versions.length);

    selectedVersionA.value = diffVersionA.value
      ? state.versions.find((v) => v.id === diffVersionA.value) ?? null
      : null;
    selectedVersionB.value = diffVersionB.value
      ? state.versions.find((v) => v.id === diffVersionB.value) ?? null
      : null;
  });

  const diffResults = useSignal<{
    sampleId: string;
    word: string;
    field: string;
    valueA: string;
    valueB: string;
    changeType: 'added' | 'changed' | 'removed';
  }[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => selectedVersionA.value);
    track(() => selectedVersionB.value);

    if (!selectedVersionA.value || !selectedVersionB.value) {
      diffResults.value = [];
      return;
    }

    const snapA = selectedVersionA.value.snapshot;
    const snapB = selectedVersionB.value.snapshot;
    const mapA = new Map(snapA.map((s) => [s.id, s]));
    const mapB = new Map(snapB.map((s) => [s.id, s]));
    const allIds = new Set([...mapA.keys(), ...mapB.keys()]);
    const diffs: typeof diffResults.value = [];

    for (const id of allIds) {
      const a = mapA.get(id);
      const b = mapB.get(id);

      if (!a && b) {
        diffs.push(
          { sampleId: id, word: b.word, field: 'toneValue', valueA: '', valueB: b.toneValue, changeType: 'added' },
          { sampleId: id, word: b.word, field: 'toneCategory', valueA: '', valueB: b.toneCategory, changeType: 'added' },
          { sampleId: id, word: b.word, field: 'status', valueA: '', valueB: b.status, changeType: 'added' },
        );
      } else if (a && !b) {
        diffs.push(
          { sampleId: id, word: a.word, field: 'toneValue', valueA: a.toneValue, valueB: '', changeType: 'removed' },
          { sampleId: id, word: a.word, field: 'toneCategory', valueA: a.toneCategory, valueB: '', changeType: 'removed' },
          { sampleId: id, word: a.word, field: 'status', valueA: a.status, valueB: '', changeType: 'removed' },
        );
      } else if (a && b) {
        if (a.toneValue !== b.toneValue) {
          diffs.push({ sampleId: id, word: a.word, field: 'toneValue', valueA: a.toneValue, valueB: b.toneValue, changeType: 'changed' });
        }
        if (a.toneCategory !== b.toneCategory) {
          diffs.push({ sampleId: id, word: a.word, field: 'toneCategory', valueA: a.toneCategory, valueB: b.toneCategory, changeType: 'changed' });
        }
        if (a.status !== b.status) {
          diffs.push({ sampleId: id, word: a.word, field: 'status', valueA: a.status, valueB: b.status, changeType: 'changed' });
        }
      }
    }

    diffResults.value = diffs;
  });

  return (
    <>
      <PageHeader
        title="版本与批次历史"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href={`/project/${projectId}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ← 返回项目
            </Link>
          </div> as any
        }
      />

      <div class="card mb-24">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>批次列表</h3>
          <button class="btn-primary btn-sm" onClick$={() => { showNewBatch.value = !showNewBatch.value; }}>
            + 新建批次
          </button>
        </div>

        {showNewBatch.value && (
          <div style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div class="grid grid-2">
              <div class="form-group">
                <label>批次名称 *</label>
                <input type="text" value={newBatchForm.name} onInput$={(e) => { newBatchForm.name = (e.target as HTMLInputElement).value; }} />
              </div>
              <div class="form-group">
                <label>备注</label>
                <input type="text" value={newBatchForm.notes} onInput$={(e) => { newBatchForm.notes = (e.target as HTMLInputElement).value; }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button class="btn-secondary" onClick$={() => { showNewBatch.value = false; }}>取消</button>
              <button class="btn-primary" onClick$={handleCreateBatch}>创建</button>
            </div>
          </div>
        )}

        {state.batches.length === 0 ? (
          <div class="empty-state">
            <p>暂无批次</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>批次名称</th>
                <th>样本数</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {state.batches.map((batch) => {
                const count = state.samples.filter((s) => s.batchId === batch.id).length;
                return (
                  <tr key={batch.id}>
                    <td>{batch.name}</td>
                    <td>{count}</td>
                    <td>{new Date(batch.createdAt).toLocaleString()}</td>
                    <td>
                      <Link href={`/project/${projectId}?batch=${batch.id}`}>查看样本</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div class="card mb-24">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>版本快照</h3>
          <button class="btn-primary btn-sm" onClick$={() => { showNewVersion.value = !showNewVersion.value; }}>
            + 创建版本快照
          </button>
        </div>

        {showNewVersion.value && (
          <div style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div class="form-group">
              <label>版本描述 *</label>
              <input type="text" value={newVersionForm.description} onInput$={(e) => { newVersionForm.description = (e.target as HTMLInputElement).value; }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button class="btn-secondary" onClick$={() => { showNewVersion.value = false; }}>取消</button>
              <button class="btn-primary" onClick$={handleCreateVersion}>创建</button>
            </div>
          </div>
        )}

        {state.versions.length === 0 ? (
          <div class="empty-state">
            <p>暂无版本快照</p>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', background: 'var(--border)' }} />
            {state.versions.map((version) => (
              <div key={version.id} class="timeline-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#4a6cf7',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    v{version.version}
                  </span>
                  <span style={{ fontWeight: 500 }}>{version.description}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', marginLeft: '4px' }}>
                  {new Date(version.createdAt).toLocaleString()} · {version.snapshot.length} 个样本
                </div>
                <div style={{ marginLeft: '4px' }}>
                  <button
                    class="btn-secondary btn-sm"
                    onClick$={() => {
                      expandedVersionId.value = expandedVersionId.value === version.id ? null : version.id;
                    }}
                  >
                    {expandedVersionId.value === version.id ? '收起' : '查看详情'}
                  </button>
                </div>
                {expandedVersionId.value === version.id && version.snapshot.length > 0 && (
                  <div style={{ marginTop: '12px', marginLeft: '4px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'auto' }}>
                    <table style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>词目</th>
                          <th>调值</th>
                          <th>调类</th>
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {version.snapshot.map((s) => (
                          <tr key={s.id}>
                            <td>{s.word}</td>
                            <td>{s.toneValue}</td>
                            <td>{s.toneCategory}</td>
                            <td>{s.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div class="card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>版本对比</h3>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span class="text-sm text-secondary">版本 A:</span>
            <div class="chip-group">
              {state.versions.map((v) => (
                <span
                  key={v.id}
                  class={`chip ${diffVersionA.value === v.id ? 'selected' : ''}`}
                  onClick$={() => {
                    diffVersionA.value = diffVersionA.value === v.id ? null : v.id;
                    if (diffVersionA.value && diffVersionB.value && diffVersionA.value === diffVersionB.value) {
                      diffVersionB.value = null;
                    }
                  }}
                >
                  v{v.version}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span class="text-sm text-secondary">版本 B:</span>
            <div class="chip-group">
              {state.versions.map((v) => (
                <span
                  key={v.id}
                  class={`chip ${diffVersionB.value === v.id ? 'selected' : ''}`}
                  onClick$={() => {
                    diffVersionB.value = diffVersionB.value === v.id ? null : v.id;
                    if (diffVersionA.value && diffVersionB.value && diffVersionB.value === diffVersionA.value) {
                      diffVersionA.value = null;
                    }
                  }}
                >
                  v{v.version}
                </span>
              ))}
            </div>
          </div>
        </div>

        {!diffVersionA.value || !diffVersionB.value ? (
          <div class="empty-state">
            <p>请选择两个版本进行对比</p>
          </div>
        ) : diffResults.value.length === 0 ? (
          <div class="empty-state">
            <p>两个版本之间没有差异</p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>词目</th>
                  <th>字段</th>
                  <th>版本 A</th>
                  <th>版本 B</th>
                  <th>变更类型</th>
                </tr>
              </thead>
              <tbody>
                {diffResults.value.map((diff, i) => (
                  <tr key={`${diff.sampleId}-${diff.field}-${i}`}>
                    <td>{diff.word}</td>
                    <td>{diff.field}</td>
                    <td style={{ background: diff.changeType === 'removed' ? 'rgba(248,113,113,0.2)' : diff.changeType === 'changed' ? 'rgba(251,191,36,0.2)' : 'transparent' }}>
                      {diff.valueA || '-'}
                    </td>
                    <td style={{ background: diff.changeType === 'added' ? 'rgba(52,211,153,0.2)' : diff.changeType === 'changed' ? 'rgba(251,191,36,0.2)' : 'transparent' }}>
                      {diff.valueB || '-'}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: diff.changeType === 'added' ? 'rgba(52,211,153,0.2)' : diff.changeType === 'removed' ? 'rgba(248,113,113,0.2)' : 'rgba(251,191,36,0.2)',
                          color: diff.changeType === 'added' ? '#059669' : diff.changeType === 'removed' ? '#dc2626' : '#d97706',
                        }}
                      >
                        {diff.changeType === 'added' ? '新增' : diff.changeType === 'removed' ? '删除' : '变更'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
});
