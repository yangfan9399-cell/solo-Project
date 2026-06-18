import { component$, useVisibleTask$, useSignal, useStore, $ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { Project, Sample, ExportRecord, Anomaly } from '~/types';
import { getProject, getAllSamples, getAllExports, saveExport, getAllAnomalies, getAllBatches } from '~/utils/storage';
import { PageHeader } from '~/components/header/header';
import { ToneChart } from '~/components/tone-chart/tone-chart';

const STATUS_LABEL: Record<Sample['status'], string> = {
  draft: '草稿',
  annotated: '已标注',
  verified: '已验证',
  anomaly: '异常',
};

const ANOMALY_TYPE_LABEL: Record<Anomaly['type'], string> = {
  tone_mismatch: '调类调值不匹配',
  pitch_outlier: '基频离群',
  segmentation_error: '切分错误',
  missing_data: '数据缺失',
};

const SEVERITY_LABEL: Record<Anomaly['severity'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const TONE_COLORS = ['#4a6cf7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf'];

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function samplesToCsv(samples: Sample[]): string {
  const headers = ['id', 'projectId', 'batchId', 'word', 'ipa', 'toneValue', 'toneCategory', 'recordingDuration', 'notes', 'status', 'createdAt', 'updatedAt'];
  const rows = samples.map((s) =>
    [s.id, s.projectId, s.batchId, s.word, s.ipa, s.toneValue, s.toneCategory, s.recordingDuration, s.notes, s.status, s.createdAt, s.updatedAt]
      .map((v) => escapeCsvField(String(v)))
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function samplesToJson(samples: Sample[]): string {
  return JSON.stringify(samples, null, 2);
}

function generateSummaryReport(project: Project, samples: Sample[], anomalies: Anomaly[]): string {
  const statusMap = new Map<Sample['status'], number>();
  for (const s of samples) {
    statusMap.set(s.status, (statusMap.get(s.status) ?? 0) + 1);
  }

  const catMap = new Map<string, { value: string; count: number }>();
  for (const s of samples) {
    const cat = s.toneCategory;
    if (!catMap.has(cat)) {
      catMap.set(cat, { value: s.toneValue, count: 0 });
    }
    catMap.get(cat)!.count += 1;
  }

  const unresolvedAnomalies = anomalies.filter((a) => !a.resolved);
  const anomalyTypeMap = new Map<Anomaly['type'], number>();
  for (const a of unresolvedAnomalies) {
    anomalyTypeMap.set(a.type, (anomalyTypeMap.get(a.type) ?? 0) + 1);
  }

  const report = {
    projectName: project.name,
    dialect: project.dialect,
    region: project.region,
    investigator: project.investigator,
    exportDate: new Date().toISOString(),
    totalSamples: samples.length,
    statusBreakdown: Object.fromEntries(
      Array.from(statusMap.entries()).map(([k, v]) => [STATUS_LABEL[k], v])
    ),
    toneCategories: Object.fromEntries(
      Array.from(catMap.entries()).map(([k, v]) => [k, { value: v.value, count: v.count }])
    ),
    anomalies: {
      total: unresolvedAnomalies.length,
      byType: Object.fromEntries(
        Array.from(anomalyTypeMap.entries()).map(([k, v]) => [ANOMALY_TYPE_LABEL[k], v])
      ),
      details: unresolvedAnomalies.map((a) => ({
        type: ANOMALY_TYPE_LABEL[a.type],
        severity: SEVERITY_LABEL[a.severity],
        description: a.description,
      })),
    },
  };

  return JSON.stringify(report, null, 2);
}

export default component$(() => {
  const location = useLocation();
  const projectId = location.params.id;

  const state = useStore<{
    project: Project | null;
    samples: Sample[];
    exports: ExportRecord[];
    anomalies: Anomaly[];
  }>({
    project: null,
    samples: [],
    exports: [],
    anomalies: [],
  });

  const format = useSignal<'json' | 'csv'>('json');
  const scope = useSignal<'all' | 'verified' | 'annotated-verified' | 'summary'>('all');
  const exportContent = useSignal('');
  const viewExportId = useSignal<string | null>(null);
  const viewContent = useSignal('');
  const copied = useSignal(false);
  const exportGenerated = useSignal(false);
  const exportError = useSignal('');

  const loadData = $(() => {
    state.project = getProject(projectId);
    state.samples = getAllSamples(projectId);
    state.exports = getAllExports(projectId);
    state.anomalies = getAllAnomalies(projectId);
  });

  useVisibleTask$(({ track }) => {
    track(() => location.url.pathname);
    state.project = getProject(projectId);
    state.samples = getAllSamples(projectId);
    state.exports = getAllExports(projectId);
    state.anomalies = getAllAnomalies(projectId);
  });

  const statusBreakdown = useSignal<{ status: string; label: string; count: number }[]>([]);
  const categoryBreakdown = useSignal<{ category: string; value: string; count: number }[]>([]);
  const latestBatch = useSignal('');
  const anomalyCount = useSignal(0);
  const anomalyByType = useSignal<{ type: string; label: string; count: number }[]>([]);
  const toneChartCategories = useSignal<{ category: string; value: string; color: string }[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.samples);
    track(() => state.samples.length);
    track(() => state.anomalies);
    track(() => state.anomalies.length);

    const statusMap = new Map<Sample['status'], number>();
    for (const s of state.samples) {
      statusMap.set(s.status, (statusMap.get(s.status) ?? 0) + 1);
    }
    statusBreakdown.value = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      label: STATUS_LABEL[status],
      count,
    }));

    const catMap = new Map<string, { value: string; count: number }>();
    for (const s of state.samples) {
      catMap.set(s.toneCategory, { value: s.toneValue, count: (catMap.get(s.toneCategory)?.count ?? 0) + 1 });
    }
    categoryBreakdown.value = Array.from(catMap.entries()).map(([category, data]) => ({ category, value: data.value, count: data.count }));

    let idx = 0;
    toneChartCategories.value = categoryBreakdown.value.map((c) => ({
      category: c.category,
      value: c.value,
      color: TONE_COLORS[idx++ % TONE_COLORS.length],
    }));

    const unresolvedAnomalies = state.anomalies.filter((a) => !a.resolved);
    anomalyCount.value = unresolvedAnomalies.length;

    const typeMap = new Map<Anomaly['type'], number>();
    for (const a of unresolvedAnomalies) {
      typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
    }
    anomalyByType.value = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      label: ANOMALY_TYPE_LABEL[type],
      count,
    }));

    const batches = getAllBatches(projectId);
    if (batches.length > 0) {
      const sorted = [...batches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      latestBatch.value = sorted[0].name;
    }
  });

  function getFilteredSamples(): Sample[] {
    if (scope.value === 'verified') {
      return state.samples.filter((s) => s.status === 'verified');
    }
    if (scope.value === 'annotated-verified') {
      return state.samples.filter((s) => s.status === 'annotated' || s.status === 'verified');
    }
    return [...state.samples];
  }

  const handleExport = $(() => {
    exportError.value = '';
    if (!state.project) {
      exportError.value = '项目数据未加载，请刷新页面';
      return;
    }
    if (state.samples.length === 0 && scope.value !== 'summary') {
      exportError.value = '没有可导出的样本数据';
      return;
    }
    let content: string;
    if (scope.value === 'summary') {
      content = generateSummaryReport(state.project, state.samples, state.anomalies);
    } else {
      const filtered = getFilteredSamples();
      content = format.value === 'json' ? samplesToJson(filtered) : samplesToCsv(filtered);
    }
    const record: ExportRecord = {
      id: Date.now().toString(),
      projectId,
      format: scope.value === 'summary' ? 'json' : format.value,
      createdAt: new Date().toISOString(),
      sampleCount: scope.value === 'summary' ? state.samples.length : getFilteredSamples().length,
      content,
    };
    saveExport(record);
    exportContent.value = content;
    viewExportId.value = null;
    viewContent.value = '';
    exportGenerated.value = true;
    setTimeout(() => { exportGenerated.value = false; }, 3000);
    state.exports = getAllExports(projectId);
  });

  const handleCopy = $(() => {
    const text = exportContent.value || viewContent.value;
    if (text.length === 0) return;
    navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  });

  const handleDownload = $(() => {
    const text = exportContent.value || viewContent.value;
    if (text.length === 0) return;
    const isSummary = scope.value === 'summary';
    const ext = isSummary ? 'json' : (format.value === 'json' ? 'json' : 'csv');
    const mimeType = ext === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${projectId}_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  });

  const handleViewExport = $((record: ExportRecord) => {
    if (viewExportId.value === record.id) {
      viewExportId.value = null;
      viewContent.value = '';
    } else {
      viewExportId.value = record.id;
      viewContent.value = record.content;
      exportContent.value = '';
    }
  });

  const handleDeleteExport = $((id: string) => {
    const exports = getAllExports(projectId);
    const filtered = exports.filter((e) => e.id !== id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dtp_exports', JSON.stringify(filtered));
    }
    if (viewExportId.value === id) {
      viewExportId.value = null;
      viewContent.value = '';
    }
    loadData();
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
      <PageHeader
        title="导出摘要"
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href={`/project/${projectId}`} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              ← 返回项目
            </Link>
          </div> as any
        }
      />

      <div class="grid grid-3" style={{ alignItems: 'start' }}>
        <div class="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>项目概览</h3>
          <div style={{ fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span class="text-secondary">项目: </span>
              <span style={{ fontWeight: 500 }}>{state.project.name}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span class="text-secondary">方言: </span>
              <span>{state.project.dialect}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span class="text-secondary">地区: </span>
              <span>{state.project.region}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span class="text-secondary">调查人: </span>
              <span>{state.project.investigator}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span class="text-secondary">样本总数: </span>
              <span style={{ fontWeight: 500 }}>{state.samples.length}</span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <span class="text-secondary">最近批次: </span>
              <span>{latestBatch.value || '无'}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>状态分布</h3>
          {statusBreakdown.value.map((s) => (
            <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span class={`badge badge-${s.status}`}>{s.label}</span>
              <span style={{ fontWeight: 500 }}>{s.count}</span>
            </div>
          ))}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>标注进度</span>
              <span>{Math.round(((statusBreakdown.value.find((s) => s.status === 'annotated' || s.status === 'verified')?.count ?? 0) / Math.max(state.samples.length, 1)) * 100)}%</span>
            </div>
            <div class="progress-bar">
              <div class="fill" style={{ width: `${Math.round(((statusBreakdown.value.find((s) => s.status === 'annotated' || s.status === 'verified')?.count ?? 0) / Math.max(state.samples.length, 1)) * 100)}%`, background: 'var(--success)' }} />
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>异常概览</h3>
          <div style={{ marginBottom: '12px' }}>
            <span class="text-secondary">未解决异常: </span>
            <span style={{ color: anomalyCount.value > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
              {anomalyCount.value}
            </span>
          </div>
          {anomalyByType.value.map((a) => (
            <div key={a.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
              <span>{a.label}</span>
              <span class="badge badge-medium">{a.count}</span>
            </div>
          ))}
          {anomalyCount.value === 0 && (
            <div style={{ color: 'var(--success)', fontSize: '13px' }}>✓ 无异常数据</div>
          )}
        </div>
      </div>

      {toneChartCategories.value.length > 0 && (
        <div class="card mt-24">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>调型分布</h3>
          <ToneChart toneCategories={toneChartCategories.value} width={600} height={300} />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            {categoryBreakdown.value.map((c) => (
              <span key={c.category} style={{ fontSize: '13px' }}>
                {c.category}({c.value}): <strong>{c.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      <div class="card mt-24">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>导出设置</h3>
        <div class="grid grid-2">
          <div class="form-group">
            <label>导出格式</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="format" checked={format.value === 'json'} onChange$={() => { format.value = 'json'; }} />
                JSON
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="format" checked={format.value === 'csv'} onChange$={() => { format.value = 'csv'; }} />
                CSV
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>导出范围</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="scope" checked={scope.value === 'all'} onChange$={() => { scope.value = 'all'; }} />
                全部样本
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="scope" checked={scope.value === 'verified'} onChange$={() => { scope.value = 'verified'; }} />
                仅已验证
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="scope" checked={scope.value === 'annotated-verified'} onChange$={() => { scope.value = 'annotated-verified'; }} />
                已标注+已验证
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="radio" name="scope" checked={scope.value === 'summary'} onChange$={() => { scope.value = 'summary'; }} />
                摘要报告 (含异常分析)
              </label>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button class="btn-primary" onClick$={handleExport}>生成导出</button>
          {exportGenerated.value && <span class="text-success text-sm" style={{ fontWeight: 500 }}>✓ 导出已生成</span>}
          {exportError.value !== '' && <span style={{ color: 'var(--danger)', fontSize: '13px' }}>{exportError.value}</span>}
        </div>
      </div>

      {exportContent.value.length > 0 && (
        <div class="card mt-24">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>导出内容</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button class="btn-secondary btn-sm" onClick$={handleCopy}>
                {copied.value ? '已复制 ✓' : '复制到剪贴板'}
              </button>
              <button class="btn-primary btn-sm" onClick$={handleDownload}>
                下载文件
              </button>
            </div>
          </div>
          <pre style={{
            background: 'var(--bg)',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: '1.5',
            border: '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            <code>{exportContent.value}</code>
          </pre>
        </div>
      )}

      {viewExportId.value !== null && viewContent.value.length > 0 && (
        <div class="card mt-24">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>历史导出内容</h3>
            <button class="btn-secondary btn-sm" onClick$={() => { viewExportId.value = null; viewContent.value = ''; }}>
              关闭
            </button>
          </div>
          <pre style={{
            background: 'var(--bg)',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: '1.5',
            border: '1px solid var(--border)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            <code>{viewContent.value}</code>
          </pre>
        </div>
      )}

      <div class="card mt-24">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>导出历史</h3>
        {state.exports.length === 0 ? (
          <div class="empty-state">
            <p>暂无导出记录</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>格式</th>
                <th>导出时间</th>
                <th>样本数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {state.exports.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: record.format === 'json' ? 'rgba(74,108,247,0.1)' : 'rgba(52,211,153,0.1)',
                      color: record.format === 'json' ? '#4a6cf7' : '#059669',
                    }}>
                      {record.format.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(record.createdAt).toLocaleString()}</td>
                  <td>{record.sampleCount}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button class="btn-secondary btn-sm" onClick$={() => handleViewExport(record)}>
                        {viewExportId.value === record.id ? '收起' : '查看'}
                      </button>
                      <button class="btn-danger btn-sm" onClick$={() => handleDeleteExport(record.id)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
});
