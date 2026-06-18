import { component$, useVisibleTask$, useSignal, useStore, $ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { Sample, Anomaly } from '~/types';
import { getSample, saveSample, getBatch, deleteSample, saveAnomaly } from '~/utils/storage';
import { detectAnomalies } from '~/utils/anomaly';
import { PageHeader } from '~/components/header/header';
import { WaveformDisplay } from '~/components/waveform/waveform';
import { ToneChart } from '~/components/tone-chart/tone-chart';

const STATUS_OPTIONS: { label: string; value: Sample['status'] }[] = [
  { label: '草稿', value: 'draft' },
  { label: '已标注', value: 'annotated' },
  { label: '已验证', value: 'verified' },
  { label: '异常', value: 'anomaly' },
];

const TONE_COLORS = ['#4a6cf7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf'];

const SEVERITY_ICON: Record<Anomaly['severity'], string> = {
  high: '⚠️',
  medium: '🔶',
  low: 'ℹ️',
};

const SEVERITY_BADGE: Record<Anomaly['severity'], string> = {
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
};

export default component$(() => {
  const location = useLocation();
  const projectId = location.params.id;
  const sampleId = location.params.sampleId;

  const sample = useSignal<Sample | null>(null);
  const batchName = useSignal('');
  const saved = useSignal(false);
  const confirmDelete = useSignal(false);
  const detectedAnomalies = useSignal<Anomaly[]>([]);

  const form = useStore({
    word: '',
    ipa: '',
    toneValue: '',
    toneCategory: '',
    recordingDuration: 0,
    status: 'draft' as Sample['status'],
    notes: '',
  });

  const segPoints = useSignal<number[]>([]);
  const pitchValues = useSignal<number[]>([]);

  useVisibleTask$(() => {
    const s = getSample(sampleId);
    if (s) {
      sample.value = s;
      form.word = s.word;
      form.ipa = s.ipa;
      form.toneValue = s.toneValue;
      form.toneCategory = s.toneCategory;
      form.recordingDuration = s.recordingDuration;
      form.status = s.status;
      form.notes = s.notes;
      segPoints.value = [...s.segmentationPoints];
      pitchValues.value = [...s.pitchData];

      if (s.batchId) {
        const batch = getBatch(s.batchId);
        batchName.value = batch ? batch.name : s.batchId;
      }
    }
  });

  const toneChartCategories = useSignal<{ category: string; value: string; color: string }[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => form.toneValue);
    track(() => form.toneCategory);
    toneChartCategories.value = [{ category: form.toneCategory || '未知', value: form.toneValue || '0', color: TONE_COLORS[0] }];
  });

  const handleSave = $(() => {
    if (!sample.value) return;
    const updated: Sample = {
      ...sample.value,
      word: form.word.trim(),
      ipa: form.ipa.trim(),
      toneValue: form.toneValue.trim(),
      toneCategory: form.toneCategory.trim(),
      recordingDuration: form.recordingDuration,
      status: form.status,
      notes: form.notes.trim(),
      segmentationPoints: [...segPoints.value],
      pitchData: [...pitchValues.value],
      updatedAt: new Date().toISOString(),
    };
    saveSample(updated);
    sample.value = updated;

    const anomalies = detectAnomalies(updated);
    for (const a of anomalies) {
      saveAnomaly(a);
    }
    detectedAnomalies.value = anomalies;

    saved.value = true;
    setTimeout(() => { saved.value = false; }, 2000);
  });

  const handleDelete = $(() => {
    if (!confirmDelete.value) {
      confirmDelete.value = true;
      return;
    }
    deleteSample(sampleId);
    window.location.href = `/project/${projectId}`;
  });

  const handleAddSegPoint = $(() => {
    const sorted = [...segPoints.value].sort((a, b) => a - b);
    let newPoint = 0.5;
    if (sorted.length > 0) {
      let maxGap = 0;
      let gapStart = 0;
      const boundaries = [0, ...sorted, 1];
      for (let i = 0; i < boundaries.length - 1; i++) {
        const gap = boundaries[i + 1] - boundaries[i];
        if (gap > maxGap) {
          maxGap = gap;
          gapStart = boundaries[i];
        }
      }
      newPoint = Math.round((gapStart + maxGap / 2) * 100) / 100;
    }
    segPoints.value = [...segPoints.value, newPoint].sort((a, b) => a - b);
  });

  const handleRemoveSegPoint = $((index: number) => {
    const updated = [...segPoints.value];
    updated.splice(index, 1);
    segPoints.value = updated;
  });

  const handleSegPointChange = $((index: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const clamped = Math.min(1, Math.max(0, num));
    const updated = [...segPoints.value];
    updated[index] = Math.round(clamped * 100) / 100;
    segPoints.value = updated.sort((a, b) => a - b);
  });

  const handlePitchChange = $((index: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const updated = [...pitchValues.value];
    updated[index] = num;
    pitchValues.value = updated;
  });

  const handleCanvasSegClick = $((position: number) => {
    const sorted = [...segPoints.value].sort((a, b) => a - b);
    const threshold = 0.03;
    const nearIdx = sorted.findIndex((p) => Math.abs(p - position) < threshold);
    if (nearIdx >= 0) {
      const updated = [...segPoints.value];
      const actualIdx = updated.indexOf(sorted[nearIdx]);
      if (actualIdx >= 0) {
        updated.splice(actualIdx, 1);
        segPoints.value = updated;
      }
    } else {
      segPoints.value = [...segPoints.value, Math.round(position * 100) / 100].sort((a, b) => a - b);
    }
  });

  if (!sample.value) {
    return (
      <div class="empty-state">
        <p>采样不存在或正在加载...</p>
        <Link href={`/project/${projectId}`}>返回项目</Link>
      </div>
    );
  }

  return (
    <>
      {sample.value.status === 'anomaly' && (
        <div class="alert-bar alert-danger mb-16">
          <span>⚠️</span>
          <span>此采样被标记为异常数据，请仔细检查各项指标</span>
        </div>
      )}

      {detectedAnomalies.value.length > 0 && (
        <div class="mb-16">
          {detectedAnomalies.value.map((a) => (
            <div key={a.id} class="alert-bar alert-warning">
              <span>{SEVERITY_ICON[a.severity]}</span>
              <span style={{ flex: 1 }}>{a.description}</span>
              <span class={`badge ${SEVERITY_BADGE[a.severity]}`}>{a.type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      <PageHeader
        title={`采样编辑 - ${sample.value.word} (${sample.value.ipa})`}
        actions={
          <div>
            <Link href={`/project/${projectId}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ← 返回项目
            </Link>
          </div> as any
        }
      />

      <div class="grid grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div class="card">
            <h3 style={{ marginBottom: '8px', fontSize: '15px', fontWeight: 600 }}>波形显示</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>点击波形添加切分点，点击已有切分点附近删除</p>
            <WaveformDisplay
              waveformData={sample.value.waveformData}
              segmentationPoints={segPoints.value}
              pitchData={pitchValues.value}
              width={800}
              height={200}
              interactive={true}
              onSegmentClick={handleCanvasSegClick}
            />
          </div>

          <div class="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>切分点编辑</h3>
              <button class="btn-secondary btn-sm" onClick$={handleAddSegPoint}>添加切分点</button>
            </div>
            {segPoints.value.length === 0 ? (
              <p class="text-sm text-muted">暂无切分点，点击上方按钮或直接点击波形添加</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {segPoints.value.map((pt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span class="text-sm text-secondary" style={{ minWidth: '40px' }}>点{i + 1}</span>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={pt}
                      style={{ width: '100px' }}
                      onInput$={(e) => handleSegPointChange(i, (e.target as HTMLInputElement).value)}
                    />
                    <span class="text-xs text-muted">({(pt * sample.value.recordingDuration / 1000).toFixed(2)}s)</span>
                    <button class="btn-danger btn-sm" onClick$={() => handleRemoveSegPoint(i)}>删除</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div class="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>基频数据 (F0)</h3>
              <span class="text-xs text-muted">{pitchValues.value.length} 个采样点</span>
            </div>
            {pitchValues.value.length === 0 ? (
              <p class="text-sm text-muted">暂无基频数据</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px' }}>
                {pitchValues.value.map((val, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span class="text-xs text-muted">F{i + 1}</span>
                    <input
                      type="number"
                      value={Math.round(val * 10) / 10}
                      style={{ width: '72px', textAlign: 'center', fontSize: '12px', padding: '4px 6px' }}
                      onInput$={(e) => handlePitchChange(i, (e.target as HTMLInputElement).value)}
                    />
                  </div>
                ))}
              </div>
            )}
            {pitchValues.value.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>最低: {Math.min(...pitchValues.value).toFixed(1)} Hz</span>
                <span>最高: {Math.max(...pitchValues.value).toFixed(1)} Hz</span>
                <span>均值: {(pitchValues.value.reduce((a, b) => a + b, 0) / pitchValues.value.length).toFixed(1)} Hz</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div class="card">
            <h3 style={{ marginBottom: '16px', fontSize: '15px', fontWeight: 600 }}>采样信息</h3>
            <div class="form-group">
              <label>词目</label>
              <input type="text" value={form.word} onInput$={(e) => { form.word = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>国际音标</label>
              <input type="text" value={form.ipa} onInput$={(e) => { form.ipa = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>调值</label>
              <input
                type="text"
                value={form.toneValue}
                placeholder="如 55, 214, 21"
                onInput$={(e) => { form.toneValue = (e.target as HTMLInputElement).value; }}
              />
            </div>
            <div class="form-group">
              <label>调类</label>
              <input type="text" value={form.toneCategory} onInput$={(e) => { form.toneCategory = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>录音时长 (ms)</label>
              <input
                type="number"
                value={form.recordingDuration}
                onInput$={(e) => { form.recordingDuration = parseInt((e.target as HTMLInputElement).value) || 0; }}
              />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select
                value={form.status}
                onChange$={(e) => { form.status = (e.target as HTMLSelectElement).value as Sample['status']; }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div class="form-group">
              <label>批次</label>
              <input type="text" value={batchName.value} disabled style={{ opacity: 0.6 }} />
            </div>
            <div class="form-group">
              <label>备注</label>
              <textarea
                value={form.notes}
                onInput$={(e) => { form.notes = (e.target as HTMLTextAreaElement).value; }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button class="btn-primary" onClick$={handleSave}>保存修改</button>
              {saved.value && <span class="text-success text-sm font-medium">已保存 ✓ {detectedAnomalies.value.length > 0 ? `(${detectedAnomalies.value.length}个异常)` : ''}</span>}
            </div>
          </div>

          <div class="card">
            <h3 style={{ marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>调型图</h3>
            <ToneChart
              toneCategories={toneChartCategories.value}
              width={360}
              height={240}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <button class="btn-danger" onClick$={handleDelete} style={{ width: '100%' }}>
              {confirmDelete.value ? '确认删除（点击再次确认）' : '删除采样'}
            </button>
            {confirmDelete.value && (
              <button class="btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }} onClick$={() => { confirmDelete.value = false; }}>
                取消删除
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
