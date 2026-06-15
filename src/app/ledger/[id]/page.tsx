'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

type MainRecord = {
  id: number; work_no: string; work_name: string; silversmith: string;
  chisel_set: string | null; main_chisels: string | null;
  material: string; material_weight: number; start_date: string;
  version: number; status: string; notes: string | null;
  created_at: string; updated_at: string;
};

type AnnealingRecord = {
  id: number; seq_no: number; annealing_time: string; temperature: number;
  duration: number; cooling_method: string;
  hardness_before: number | null; hardness_after: number | null;
  operator: string | null; notes: string | null;
};

type PatternProgress = {
  id: number; pattern_stage: string; pattern_name: string;
  progress_pct: number; duration_minutes: number;
  start_time: string | null; end_time: string | null;
  chisels_used: string | null; issues: string | null;
  snapshot_image: string | null;
};

type ResultRecord = {
  id: number; surface_defects: string | null; defect_severity: string | null;
  rework_count: number; final_weight: number | null;
  delivery_requirements: string | null; packaging: string | null;
  delivery_date: string | null; inspector: string | null;
  acceptance: string | null; acceptance_notes: string | null;
};

type PhotoAnnotation = {
  id: number; pattern_progress_id: number | null;
  photo_url: string; annotation_type: string;
  annotation_text: string | null; annotator: string | null;
  annotation_time: string | null; resolved: number;
  resolved_note: string | null; created_at: string;
};

type DeliveryOrder = {
  id: number; order_no: string; version: number;
  previous_version_id: number | null; content: any;
  issued_by: string | null; issued_at: string;
  recipient: string | null; signoff: number;
};

type ChangeLog = {
  id: number; table_name: string; record_id: number | null;
  change_type: string; change_reason: string | null;
  before_data: string | null; after_data: string | null;
  operator: string | null; created_at: string;
};

type ToolInventory = {
  id: number; tool_code: string; tool_name: string;
  tool_type: string; spec: string | null; status: string;
  usage_count: number; last_maintenance: string | null;
  maintenance_cycle: number; version: string; notes: string | null;
  manufacturer: string | null;
};

type FullData = MainRecord & {
  annealing_records: AnnealingRecord[];
  pattern_progress: PatternProgress[];
  result_record: ResultRecord | null;
  photo_annotations: PhotoAnnotation[];
  delivery_orders: DeliveryOrder[];
  change_logs: ChangeLog[];
  tools_used: ToolInventory[];
};

type DiffItem = { key: string; before: any; after: any; type: string };
type DiffPair = {
  from_version: number; to_version: number;
  from_order_no: string; to_order_no: string;
  from_issued_at: string; to_issued_at: string;
  changes: DiffItem[]; snapshots: { before: any; after: any };
};

function fmtHours(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function statusTag(s: string) {
  if (s === '已完成') return <span className="tag tag-green">✓ {s}</span>;
  if (s === '进行中') return <span className="tag tag-blue">◷ {s}</span>;
  if (s === '异常处理中') return <span className="tag tag-red">⚠ {s}</span>;
  if (s === '暂停') return <span className="tag tag-gray">⏸ {s}</span>;
  return <span className="tag tag-gray">{s}</span>;
}

function pctClass(p: number) {
  if (p >= 90) return '';
  if (p >= 60) return 'warn';
  return 'err';
}

function parseJsonSafe(s: string | null) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return s; }
}

const TABS = [
  { key: 'overview', label: '概览', icon: '📋' },
  { key: 'annealing', label: '退火明细', icon: '🔥' },
  { key: 'pattern', label: '纹样进度', icon: '✏️' },
  { key: 'result', label: '结果记录', icon: '✅' },
  { key: 'annotations', label: '照片批注', icon: '📷' },
  { key: 'tools', label: '工具库', icon: '🔧' },
  { key: 'statistics', label: '耗时统计', icon: '⏱' },
  { key: 'delivery', label: '交付单', icon: '📦' },
  { key: 'delivery-diff', label: '交付差异', icon: '📊' },
  { key: 'changelog', label: '变更日志', icon: '📝' },
  { key: 'export', label: '导出', icon: '📤' },
];

export default function LedgerDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = use(params);
  const sp = use(searchParams);
  const initialTab = sp.tab || 'overview';

  const [data, setData] = useState<FullData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [diffs, setDiffs] = useState<{ diffs: DiffPair[]; versions: any[]; change_logs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAnnoForm, setShowAnnoForm] = useState(false);

  useEffect(() => {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      const el2 = el as HTMLElement;
      el2.classList.remove('active');
    });
    loadData();
  }, [id]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  function loadData() {
    setLoading(true);
    Promise.all([
      fetch(`/api/ledger/${id}`).then((r) => r.json()),
      fetch(`/api/ledger/${id}/statistics`).then((r) => r.json()),
      fetch(`/api/ledger/${id}/delivery-diff`).then((r) => r.json()),
    ]).then(([d, s, df]) => {
      setData(d);
      setStats(s);
      setDiffs(df);
      setLoading(false);
    });
  }

  if (loading || !data) {
    return (
      <div className="page-wrap">
        <div className="empty"><div className="ic">⚙</div>加载中…</div>
      </div>
    );
  }

  const totalMin = data.pattern_progress.reduce((s, p) => s + p.duration_minutes, 0);
  const progressAvg = data.pattern_progress.length
    ? Math.round(data.pattern_progress.reduce((s, p) => s + p.progress_pct, 0) / data.pattern_progress.length)
    : 0;
  const unresolvedAnnos = data.photo_annotations.filter((a) => !a.resolved).length;

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-b">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{data.work_name}</h1>
              {statusTag(data.status)}
              <span className="tag tag-purple">v{data.version}</span>
            </div>
            <div style={{ marginTop: 6, display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: '#6a6a75' }}>
              <span style={{ fontFamily: 'SF Mono, Menlo, monospace' }}>{data.work_no}</span>
              <span>🔨 {data.silversmith}</span>
              <span>⚖️ {data.material} / {data.material_weight}g</span>
              <span>📅 开工 {data.start_date}</span>
              {unresolvedAnnos > 0 && <span className="tag tag-red">⚠ {unresolvedAnnos} 个批注待处理</span>}
            </div>
          </div>
          <div className="btn-group">
            <Link href="/" className="btn btn-sm btn-outline">← 返回列表</Link>
            <button className="btn btn-sm btn-outline" onClick={loadData}>⟳ 刷新</button>
            <a href={`/api/ledger/${id}/export`} className="btn btn-sm btn-primary">📤 导出档案</a>
          </div>
        </div>
        {data.notes && (
          <div className="muted-block" style={{ marginTop: 12 }}>
            📝 {data.notes}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: '8px 12px', marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={'btn btn-sm ' + (activeTab === t.key ? 'btn-primary' : 'btn-outline')}
              onClick={() => setActiveTab(t.key)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <TabContent
        tab={activeTab}
        data={data}
        stats={stats}
        diffs={diffs}
        totalMin={totalMin}
        progressAvg={progressAvg}
        onRefresh={loadData}
        showAnnoForm={showAnnoForm}
        setShowAnnoForm={setShowAnnoForm}
      />
    </div>
  );
}

function TabContent({ tab, data, stats, diffs, totalMin, progressAvg, onRefresh, showAnnoForm, setShowAnnoForm }: {
  tab: string; data: FullData; stats: any; diffs: any;
  totalMin: number; progressAvg: number; onRefresh: () => void;
  showAnnoForm: boolean; setShowAnnoForm: (v: boolean) => void;
}) {
  if (tab === 'overview') return <OverviewTab data={data} totalMin={totalMin} progressAvg={progressAvg} />;
  if (tab === 'annealing') return <AnnealingTab data={data} />;
  if (tab === 'pattern') return <PatternTab data={data} />;
  if (tab === 'result') return <ResultTab data={data} />;
  if (tab === 'annotations') return <AnnotationsTab data={data} onRefresh={onRefresh} showAnnoForm={showAnnoForm} setShowAnnoForm={setShowAnnoForm} />;
  if (tab === 'tools') return <ToolsTab data={data} />;
  if (tab === 'statistics') return <StatisticsTab data={data} stats={stats} />;
  if (tab === 'delivery') return <DeliveryTab data={data} onRefresh={onRefresh} />;
  if (tab === 'delivery-diff') return <DeliveryDiffTab data={data} diffs={diffs} />;
  if (tab === 'changelog') return <ChangelogTab data={data} />;
  if (tab === 'export') return <ExportTab data={data} />;
  return null;
}

function OverviewTab({ data, totalMin, progressAvg }: { data: FullData; totalMin: number; progressAvg: number }) {
  const mainChisels = parseJsonSafe(data.main_chisels);
  const deliveryReq = parseJsonSafe(data.result_record?.delivery_requirements || null);
  const surfaceDefects = parseJsonSafe(data.result_record?.surface_defects || null);

  return (
    <div className="cols-main-side">
      <div>
        {/* KPIs */}
        <div className="kpi-grid" style={{ marginBottom: 16 }}>
          <div className="kpi">
            <div className="label">总工时</div>
            <div className="value">{fmtHours(totalMin)}</div>
            <div className="delta text-muted">{data.pattern_progress.length} 道工序</div>
          </div>
          <div className="kpi">
            <div className="label">退火次数</div>
            <div className="value">{data.annealing_records.length}</div>
            <div className="delta text-muted">明细记录</div>
          </div>
          <div className={'kpi ' + (progressAvg >= 90 ? 'good' : progressAvg >= 60 ? 'warn' : '')}>
            <div className="label">整体进度</div>
            <div className="value">{progressAvg}%</div>
            <div className="delta">历史记录追踪</div>
          </div>
          <div className="kpi">
            <div className="label">返工次数</div>
            <div className="value">{data.result_record?.rework_count || 0}</div>
            <div className="delta text-muted">结果记录统计</div>
          </div>
        </div>

        {/* 四表关系图 */}
        <div className="card">
          <h3 className="card-title">
            <span>🔗 专属四表关联结构</span>
            <span className="meta">行业对象 · 批次 · 版本 · 导出</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="muted-block">
              <strong style={{ color: '#2a2a35' }}>📋 主记录</strong><br />
              <span className="text-xs text-muted">银匠 · 錾子 · 材料 · 批次 · 版本</span><br />
              <span className="text-sm">→ 银匠：{data.silversmith}</span><br />
              <span className="text-sm">→ 錾具套装：{data.chisel_set || '未指定'}</span><br />
              <span className="text-sm">→ 批次号：{data.work_no}</span>
            </div>
            <div className="muted-block">
              <strong style={{ color: '#2a2a35' }}>🔥 明细记录</strong><br />
              <span className="text-xs text-muted">退火次数 · 温度 · 硬度变化</span><br />
              <span className="text-sm">→ 共 {data.annealing_records.length} 次退火</span><br />
              <span className="text-sm">→ 平均温度：{data.annealing_records.length ? Math.round(data.annealing_records.reduce((s, a) => s + a.temperature, 0) / data.annealing_records.length) : 0}℃</span>
            </div>
            <div className="muted-block">
              <strong style={{ color: '#2a2a35' }}>✏️ 历史记录</strong><br />
              <span className="text-xs text-muted">纹样进度 · 工序顺序 · 耗时追踪</span><br />
              <span className="text-sm">→ 共 {data.pattern_progress.length} 道工序</span><br />
              <span className="text-sm">→ 起稿→贴样→初錾→精錾→修光</span>
            </div>
            <div className="muted-block">
              <strong style={{ color: '#2a2a35' }}>✅ 结果记录</strong><br />
              <span className="text-xs text-muted">表面缺陷 · 交付要求 · 验收</span><br />
              <span className="text-sm">→ 缺陷等级：{data.result_record?.defect_severity || '无'}</span><br />
              <span className="text-sm">→ 验收状态：{data.result_record?.acceptance || '未验收'}</span>
            </div>
          </div>
        </div>

        {/* 纹样进度时间线 */}
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title">
            <span>📐 工序进度时间线</span>
            <span className="meta">历史记录 · 按工序顺序排列</span>
          </h3>
          <div className="stage-timeline">
            {data.pattern_progress.map((p) => (
              <div key={p.id} className="stage-row">
                <div className="stage">
                  {p.pattern_stage}
                  <small>{p.pattern_name}</small>
                </div>
                <div>
                  <div className="flex-b" style={{ marginBottom: 4 }}>
                    <span className="text-xs text-muted">{fmtHours(p.duration_minutes)}</span>
                    <span className="text-xs" style={{ fontWeight: 500 }}>{p.progress_pct}%</span>
                  </div>
                  <div className={'pbar ' + pctClass(p.progress_pct)}>
                    <div style={{ width: `${p.progress_pct}%` }} />
                  </div>
                  {p.issues && (
                    <div className="text-xs" style={{ color: '#991b1b', marginTop: 4 }}>⚠ {p.issues}</div>
                  )}
                </div>
                <div className="meta">
                  {p.start_time && <div className="text-xs text-muted">{p.start_time.substring(5, 16)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        {/* 交付信息快览 */}
        <div className="card">
          <h3 className="card-title"><span>📦 交付信息</span></h3>
          {deliveryReq && typeof deliveryReq === 'object' && (
            <div className="delivery-grid" style={{ gridTemplateColumns: '1fr', marginBottom: 0 }}>
              {Object.entries(deliveryReq).map(([k, v]) => (
                <div key={k} className="delivery-field">
                  <div className="k">{k}</div>
                  <div className="v">{String(v)}</div>
                </div>
              ))}
            </div>
          )}
          {data.result_record?.packaging && (
            <div className="mt-12 text-sm">
              <span className="text-muted">包装：</span>{data.result_record.packaging}
            </div>
          )}
          {data.result_record?.delivery_date && (
            <div className="mt-8 text-sm">
              <span className="text-muted">交付日期：</span>{data.result_record.delivery_date}
            </div>
          )}
        </div>

        {/* 使用工具快览 */}
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title"><span>🔧 本批使用工具</span></h3>
          {data.tools_used.length === 0 ? (
            <div className="text-xs text-muted">未关联工具</div>
          ) : (
            <div>
              {data.tools_used.map((t) => (
                <div key={t.id} className="list-item">
                  <div className="icon">🔨</div>
                  <div className="body">
                    <div className="title">{t.tool_code} · {t.tool_name}</div>
                    <div className="sub">{t.spec} | {t.status} | v{t.version}</div>
                  </div>
                </div>
              ))}
              {Array.isArray(mainChisels) && mainChisels.length > 0 && (
                <div className="mt-12 text-xs text-muted">
                  主錾组合：{mainChisels.join(' → ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 表面缺陷快览 */}
        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title"><span>🔍 表面缺陷检查</span></h3>
          {!surfaceDefects || (Array.isArray(surfaceDefects) && surfaceDefects.length === 0) ? (
            <div className="text-xs text-muted">无表面缺陷</div>
          ) : Array.isArray(surfaceDefects) ? (
            <div>
              {surfaceDefects.map((d: any, i: number) => (
                <div key={i} className="list-item">
                  <div className="icon" style={{ background: '#fef2f2', color: '#991b1b' }}>⚠</div>
                  <div className="body">
                    <div className="title">{d.type}</div>
                    <div className="sub">位置：{d.location} | 大小：{d.size} | 可修复：{d.repairable ? '是' : '否'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* 最新批注 */}
        {data.photo_annotations.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title">
              <span>📷 最新照片批注</span>
              <span className="meta">{data.photo_annotations.filter((a) => !a.resolved).length} 待处理</span>
            </h3>
            {data.photo_annotations.slice(-2).reverse().map((a) => (
              <div key={a.id} className={`anno-box type-${a.annotation_type}`}>
                <div className="anno-head">
                  <span className="who">{a.annotator || '未知'} · <span className="tag tag-gray">{a.annotation_type}</span></span>
                  <span className="when">{a.annotation_time || a.created_at}</span>
                </div>
                <div className="anno-body">{a.annotation_text}</div>
                {a.resolved && a.resolved_note && <div className="anno-resolved">✓ {a.resolved_note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnealingTab({ data }: { data: FullData }) {
  return (
    <div>
      <div className="card">
        <h3 className="card-title">
          <span>🔥 退火明细记录</span>
          <span className="meta">共 {data.annealing_records.length} 次 · 明细记录</span>
        </h3>
        <div className="card-hint">
          每次退火记录温度、时长、冷却方式及硬度变化，用于追踪材料在錾刻过程中的物理状态变化。
        </div>
        {data.annealing_records.length === 0 ? (
          <div className="empty"><div className="ic">🔥</div>暂无退火记录</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>退火时间</th>
                  <th>温度</th>
                  <th>持续</th>
                  <th>冷却方式</th>
                  <th>硬度(前)</th>
                  <th>硬度(后)</th>
                  <th>变化</th>
                  <th>操作人员</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {data.annealing_records.map((a) => {
                  const delta = (a.hardness_before != null && a.hardness_after != null)
                    ? a.hardness_before - a.hardness_after : null;
                  return (
                    <tr key={a.id}>
                      <td><span className="tag tag-purple">#{a.seq_no}</span></td>
                      <td>{a.annealing_time}</td>
                      <td className="num">{a.temperature}℃</td>
                      <td className="num">{a.duration}s</td>
                      <td>{a.cooling_method}</td>
                      <td className="num">{a.hardness_before ?? '-'}</td>
                      <td className="num">{a.hardness_after ?? '-'}</td>
                      <td className="num" style={{ color: delta ? '#10b981' : '#94a3b8' }}>
                        {delta != null ? `↓${delta}` : '-'}
                      </td>
                      <td>{a.operator || '-'}</td>
                      <td className="text-muted text-xs">{a.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PatternTab({ data }: { data: FullData }) {
  return (
    <div>
      <div className="card">
        <h3 className="card-title">
          <span>✏️ 纹样进度历史记录</span>
          <span className="meta">共 {data.pattern_progress.length} 道工序 · 历史记录</span>
        </h3>
        <div className="card-hint">
          按起稿→贴样→初錾→精錾→修光的标准工序顺序记录，包含每道工序的耗时、使用錾子、问题备注。
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.pattern_progress.map((p, idx) => {
          const chisels = parseJsonSafe(p.chisels_used);
          return (
            <div key={p.id} className="card">
              <div className="flex-b" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="tag tag-purple">#{idx + 1}</span>
                  <span className="tag tag-blue">{p.pattern_stage}</span>
                  <strong>{p.pattern_name}</strong>
                  {p.issues && <span className="tag tag-red">有问题</span>}
                  {p.pattern_stage.includes('回滚') && <span className="tag tag-amber">回滚工序</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="text-xs text-muted">进度</span>
                  <div className={'pbar ' + pctClass(p.progress_pct)} style={{ width: 100 }}>
                    <div style={{ width: `${p.progress_pct}%` }} />
                  </div>
                  <span className="text-xs" style={{ fontWeight: 500, minWidth: 36 }}>{p.progress_pct}%</span>
                </div>
              </div>
              <div className="grid-4">
                <div>
                  <div className="text-xs text-muted">耗时</div>
                  <div style={{ fontWeight: 500 }}>{fmtHours(p.duration_minutes)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">开始时间</div>
                  <div>{p.start_time || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">结束时间</div>
                  <div>{p.end_time || '进行中'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted">使用錾子</div>
                  <div>
                    {Array.isArray(chisels) && chisels.length > 0
                      ? chisels.join(', ')
                      : '无'}
                  </div>
                </div>
              </div>
              {p.issues && (
                <div className="mt-12 muted-block" style={{ background: '#fef2f2', color: '#991b1b' }}>
                  ⚠️ {p.issues}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultTab({ data }: { data: FullData }) {
  const res = data.result_record;
  const defects = res ? parseJsonSafe(res.surface_defects) : null;
  const deliveryReq = res ? parseJsonSafe(res.delivery_requirements) : null;

  return (
    <div className="grid-2">
      <div className="card">
        <h3 className="card-title">
          <span>🔍 表面缺陷检查</span>
          <span className="meta">结果记录</span>
        </h3>
        {!res ? (
          <div className="empty"><div className="ic">📋</div>暂无结果记录</div>
        ) : (
          <div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div>
                <div className="text-xs text-muted">缺陷等级</div>
                <div style={{ fontWeight: 500, fontSize: 16 }}>
                  {res.defect_severity === '无' && <span className="tag tag-green">无缺陷</span>}
                  {res.defect_severity === '轻微' && <span className="tag tag-amber">轻微</span>}
                  {res.defect_severity === '中度' && <span className="tag tag-red">中度</span>}
                  {res.defect_severity === '严重' && <span className="tag tag-red">严重</span>}
                  {!res.defect_severity && '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">返工次数</div>
                <div style={{ fontWeight: 500, fontSize: 16 }}>{res.rework_count} 次</div>
              </div>
              <div>
                <div className="text-xs text-muted">下料重量</div>
                <div>{data.material_weight}g</div>
              </div>
              <div>
                <div className="text-xs text-muted">成品重量</div>
                <div>{res.final_weight != null ? `${res.final_weight}g` : '未称量'}</div>
              </div>
            </div>
            {!defects || (Array.isArray(defects) && defects.length === 0) ? (
              <div className="text-muted text-sm">无表面缺陷</div>
            ) : Array.isArray(defects) ? (
              <div>
                {defects.map((d: any, i: number) => (
                  <div key={i} className="list-item">
                    <div className="icon" style={{ background: '#fef2f2', color: '#991b1b' }}>⚠</div>
                    <div className="body">
                      <div className="title">{d.type}</div>
                      <div className="sub">位置：{d.location} | 大小：{d.size}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">
          <span>📦 交付要求与验收</span>
          <span className="meta">结果记录</span>
        </h3>
        {res ? (
          <div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div>
                <div className="text-xs text-muted">验收状态</div>
                <div>
                  {res.acceptance === '合格' && <span className="tag tag-green">✓ 合格</span>}
                  {res.acceptance === '待复检' && <span className="tag tag-amber">待复检</span>}
                  {res.acceptance === '不合格' && <span className="tag tag-red">不合格</span>}
                  {res.acceptance === '待检验' && <span className="tag tag-blue">待检验</span>}
                  {!res.acceptance && <span className="text-muted">未验收</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">交付日期</div>
                <div>{res.delivery_date || '-'}</div>
              </div>
            </div>
            {deliveryReq && typeof deliveryReq === 'object' && (
              <>
                <div className="hr" />
                <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 500 }}>客户交付要求：</div>
                <div className="delivery-grid" style={{ marginBottom: 0 }}>
                  {Object.entries(deliveryReq).map(([k, v]) => (
                    <div key={k} className="delivery-field">
                      <div className="k">{k}</div>
                      <div className="v">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {res.acceptance_notes && (
              <>
                <div className="hr" />
                <div className="text-xs text-muted" style={{ marginBottom: 4 }}>验收意见</div>
                <div className="text-sm">{res.acceptance_notes}</div>
              </>
            )}
          </div>
        ) : (
          <div className="empty"><div className="ic">📋</div>暂无结果记录</div>
        )}
      </div>
    </div>
  );
}

function AnnotationsTab({ data, onRefresh, showAnnoForm, setShowAnnoForm }: {
  data: FullData; onRefresh: () => void;
  showAnnoForm: boolean; setShowAnnoForm: (v: boolean) => void;
}) {
  const [annoType, setAnnoType] = useState('正常');
  const [annoText, setAnnoText] = useState('');
  const [annoProgressId, setAnnoProgressId] = useState<number | ''>('');
  const [annoAnnotator, setAnnoAnnotator] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: any = {
        annotation_type: annoType,
        annotation_text: annoText || null,
        photo_url: `anno-${Date.now()}.jpg`,
        annotator: annoAnnotator || null,
      };
      if (annoProgressId) {
        body.pattern_progress_id = Number(annoProgressId);
        body.related_progress_id = Number(annoProgressId);
      }
      const r = await fetch(`/api/ledger/${data.id}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setShowAnnoForm(false);
        setAnnoType('正常');
        setAnnoText('');
        setAnnoProgressId('');
        setAnnoAnnotator('');
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(aid: number, resolved: boolean) {
    const note = resolved ? prompt('请输入处理说明：') : null;
    if (resolved && note === null) return;
    await fetch(`/api/ledger/${data.id}/annotations`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotation_id: aid, resolved, resolved_note: note }),
    });
    onRefresh();
  }

  const unresolved = data.photo_annotations.filter((a) => !a.resolved);
  const resolved = data.photo_annotations.filter((a) => a.resolved);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-b" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📷 照片批注</div>
            <div className="text-xs text-muted">共 {data.photo_annotations.length} 条 · {unresolved.length} 待处理</div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAnnoForm(!showAnnoForm)}
          >
            {showAnnoForm ? '✕ 取消' : '+ 添加批注'}
          </button>
        </div>
        {showAnnoForm && (
          <form onSubmit={handleSubmit} className="muted-block" style={{ marginBottom: 12 }}>
            <div className="row-fields">
              <label className="field">
                <span>批注类型</span>
                <select value={annoType} onChange={(e) => setAnnoType(e.target.value)}>
                  <option value="正常">正常</option>
                  <option value="异常">异常（将触发状态变更和进度回退）</option>
                  <option value="参考">参考</option>
                </select>
              </label>
              <label className="field">
                <span>关联工序（可选）</span>
                <select value={annoProgressId} onChange={(e) => setAnnoProgressId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">不关联</option>
                  {data.pattern_progress.map((p) => (
                    <option key={p.id} value={p.id}>{p.pattern_stage} - {p.pattern_name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>批注内容</span>
              <textarea
                value={annoText}
                onChange={(e) => setAnnoText(e.target.value)}
                placeholder="请详细描述批注内容，异常情况请说明问题原因和处理建议..."
                required
              />
            </label>
            <div className="row-fields">
              <label className="field">
                <span>批注人</span>
                <input
                  type="text" value={annoAnnotator}
                  onChange={(e) => setAnnoAnnotator(e.target.value)}
                  placeholder="银匠/质检员姓名"
                />
              </label>
            </div>
            <div className="flex-b" style={{ marginTop: 10 }}>
              <div className="text-xs text-muted">
                ⚠️ 选择「异常」类型且关联工序时，系统将自动：1）进度回退至60%；2）记录变更日志；3）台账状态改为「异常处理中」
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                {submitting ? '提交中...' : '提交批注'}
              </button>
            </div>
          </form>
        )}
      </div>

      {unresolved.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="card-title">
            <span>⚠️ 待处理批注</span>
            <span className="meta">{unresolved.length} 条</span>
          </h3>
          {unresolved.map((a) => (
            <div key={a.id} className={`anno-box type-${a.annotation_type}`}>
              <div className="anno-head">
                <span className="who">
                  {a.annotator || '未知'} ·
                  <span className={'tag ' + (a.annotation_type === '异常' ? 'tag-red' : a.annotation_type === '参考' ? 'tag-blue' : 'tag-green')}>
                    {a.annotation_type}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="when">{a.annotation_time || a.created_at}</span>
                  <button className="btn btn-sm btn-success" onClick={() => handleResolve(a.id, true)}>
                    ✓ 标记已解决
                  </button>
                </div>
              </div>
              <div className="photo-frame" style={{ maxWidth: 300, margin: '8px 0' }}>
                📷 {a.photo_url}
              </div>
              <div className="anno-body">{a.annotation_text}</div>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="card">
          <h3 className="card-title">
            <span>✓ 已处理批注</span>
            <span className="meta">{resolved.length} 条</span>
          </h3>
          {resolved.map((a) => (
            <div key={a.id} className={`anno-box type-${a.annotation_type}`} style={{ opacity: 0.75 }}>
              <div className="anno-head">
                <span className="who">
                  {a.annotator || '未知'} ·
                  <span className="tag tag-gray">{a.annotation_type}</span>
                </span>
                <button className="btn btn-sm btn-outline" onClick={() => handleResolve(a.id, false)}>
                  ↩ 重新打开
                </button>
              </div>
              <div className="anno-body">{a.annotation_text}</div>
              {a.resolved_note && <div className="anno-resolved">✓ {a.resolved_note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolsTab({ data }: { data: FullData }) {
  return (
    <div className="cols-main-side">
      <div>
        <div className="card">
          <h3 className="card-title">
            <span>🔧 本批次使用工具</span>
            <span className="meta">共 {data.tools_used.length} 件工具</span>
          </h3>
          <div className="card-hint">
            工具库版本管理：每件工具都有独立版本号，用于追踪工具变更对产品质量的影响。当工具版本回滚时，相关工序的统计数据也会对应回滚或重算。
          </div>
          {data.tools_used.length === 0 ? (
            <div className="empty"><div className="ic">🔧</div>暂无关联工具</div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>工具编码</th>
                    <th>工具名称</th>
                    <th>类型</th>
                    <th>规格</th>
                    <th>版本</th>
                    <th>状态</th>
                    <th>使用次数</th>
                    <th>维护周期</th>
                    <th>上次维护</th>
                    <th>制造商</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tools_used.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'SF Mono, Menlo, monospace' }}>{t.tool_code}</td>
                      <td style={{ fontWeight: 500 }}>{t.tool_name}</td>
                      <td>{t.tool_type}</td>
                      <td>{t.spec || '-'}</td>
                      <td>
                        <span className={'tag ' + (t.notes?.includes('回滚') ? 'tag-amber' : 'tag-purple')}>
                          {t.version}
                        </span>
                      </td>
                      <td>
                        {t.status === '在用' && <span className="tag tag-green">在用</span>}
                        {t.status === '待修' && <span className="tag tag-amber">待修</span>}
                        {t.status === '报废' && <span className="tag tag-red">报废</span>}
                        {t.status === '借出' && <span className="tag tag-blue">借出</span>}
                      </td>
                      <td className="num">{t.usage_count}</td>
                      <td className="num">每{t.maintenance_cycle}次</td>
                      <td>{t.last_maintenance || '-'}</td>
                      <td>{t.manufacturer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {data.tools_used.some((t) => t.notes?.includes('回滚')) && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title"><span>⚠️ 工具版本回滚记录</span></h3>
            {data.tools_used.filter((t) => t.notes?.includes('回滚')).map((t) => (
              <div key={t.id} className="muted-block" style={{ background: '#fffbeb', marginBottom: 8 }}>
                <strong>{t.tool_code} {t.tool_name}</strong><br />
                <span className="text-sm">{t.notes}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="card">
          <h3 className="card-title"><span>📊 工具使用健康度</span></h3>
          {data.tools_used.map((t) => {
            const pct = Math.min(100, (t.usage_count / t.maintenance_cycle) * 100);
            return (
              <div key={t.id} className="bar-row" style={{ marginBottom: 10 }}>
                <div className="bar-label">{t.tool_code}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981',
                    }}
                  />
                </div>
                <div className="bar-value">
                  {t.usage_count}/{t.maintenance_cycle}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title"><span>🔗 工具-工序关联</span></h3>
          <div className="text-xs text-muted" style={{ marginBottom: 10 }}>
            点击查看 <Link href="/tools" className="link">完整工具库 →</Link>
          </div>
          {data.pattern_progress.filter((p) => p.chisels_used && JSON.parse(p.chisels_used).length > 0).map((p) => {
            const chisels = parseJsonSafe(p.chisels_used);
            return (
              <div key={p.id} className="list-item">
                <div className="icon">✏️</div>
                <div className="body">
                  <div className="title">{p.pattern_stage} · {p.pattern_name}</div>
                  <div className="sub">
                    使用錾子：{Array.isArray(chisels) ? chisels.join(', ') : '-'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatisticsTab({ data, stats }: { data: FullData; stats: any }) {
  if (!stats) return <div className="empty">加载中…</div>;

  return (
    <div className="cols-main-side">
      <div>
        <div className="card">
          <h3 className="card-title">
            <span>⏱ 耗时统计总览</span>
            <span className="meta">专属四表数据联动计算</span>
          </h3>
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <div className="kpi good">
              <div className="label">有效工时</div>
              <div className="value">{stats.summary.valid_hours}h</div>
              <div className="delta">{stats.summary.valid_stage_count} 道有效工序</div>
            </div>
            {stats.summary.rollback_hours > 0 && (
              <div className="kpi danger">
                <div className="label">回滚返工工时</div>
                <div className="value">{stats.summary.rollback_hours}h</div>
                <div className="delta">{stats.summary.rollback_count} 次回滚</div>
              </div>
            )}
            <div className="kpi">
              <div className="label">总日历天数</div>
              <div className="value">{stats.summary.calendar_days}天</div>
              <div className="delta text-muted">含等待间隔</div>
            </div>
            <div className="kpi">
              <div className="label">平均日工时</div>
              <div className="value">{(stats.summary.valid_hours / stats.summary.calendar_days).toFixed(1)}h</div>
              <div className="delta text-muted">有效工时/日历天</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <div className="text-xs text-muted">退火次数</div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>{stats.summary.annealing_count} 次</div>
            </div>
            <div>
              <div className="text-xs text-muted">返工次数</div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>{stats.summary.rework_count} 次</div>
            </div>
            <div>
              <div className="text-xs text-muted">材料损耗</div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>{stats.main.weight_loss_pct ?? '-'}%</div>
            </div>
            <div>
              <div className="text-xs text-muted">变更日志</div>
              <div style={{ fontWeight: 500, fontSize: 18 }}>{stats.summary.change_log_count} 条</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title"><span>📊 各工序耗时分布</span></h3>
          <div className="bar-chart">
            {stats.distribution.by_stage.map((s: any) => (
              <div key={s.stage} className="bar-row">
                <div className="bar-label">{s.stage}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${s.pct}%` }} />
                </div>
                <div className="bar-value">{fmtHours(s.minutes)} ({s.pct}%)</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title"><span>🔥 退火温度与硬度曲线</span></h3>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>温度</th>
                  <th>持续</th>
                  <th>冷却</th>
                  <th>硬度变化</th>
                </tr>
              </thead>
              <tbody>
                {stats.annealing.map((a: any) => (
                  <tr key={a.seq_no}>
                    <td>#{a.seq_no}</td>
                    <td>{a.temperature}℃</td>
                    <td>{a.duration}s</td>
                    <td>{a.cooling}</td>
                    <td>
                      {a.delta_hardness != null ? (
                        <span style={{ color: '#10b981' }}>↓{a.delta_hardness}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <h3 className="card-title"><span>📈 工时构成</span></h3>
          {stats.distribution.work_type.map((w: any) => (
            <div key={w.label} className="bar-row" style={{ marginBottom: 10 }}>
              <div className="bar-label">{w.label}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(w.minutes / stats.summary.total_minutes) * 100}%`,
                    background: w.color,
                  }}
                />
              </div>
              <div className="bar-value">
                {fmtHours(w.minutes)}
              </div>
            </div>
          ))}
          <div className="mt-12 muted-block">
            <strong>数据说明：</strong><br />
            • 有效工时：实际用于錾刻创作的时间<br />
            • 回滚返工：因工具问题、工艺错误等导致的重复劳动时间<br />
            • 回滚工序的工时不计入有效工时统计，避免误导成本核算
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="card-title"><span>📋 验收指标</span></h3>
          <div className="list-item">
            <div className="icon" style={{ background: stats.summary.acceptance === '合格' ? '#d1fae5' : '#fef3c7', color: stats.summary.acceptance === '合格' ? '#065f46' : '#92400e' }}>
              {stats.summary.acceptance === '合格' ? '✓' : '⏳'}
            </div>
            <div className="body">
              <div className="title">验收状态</div>
              <div className="sub">{stats.summary.acceptance}</div>
            </div>
          </div>
          <div className="list-item">
            <div className="icon">🔍</div>
            <div className="body">
              <div className="title">缺陷等级</div>
              <div className="sub">{stats.summary.defect_severity}</div>
            </div>
          </div>
          <div className="list-item">
            <div className="icon">⚖️</div>
            <div className="body">
              <div className="title">材料重量</div>
              <div className="sub">
                下料 {stats.main.material_weight}g → 成品 {stats.main.final_weight ?? '未称量'}g
                {stats.main.weight_loss_pct != null && ` (损耗 ${stats.main.weight_loss_pct}%)`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeliveryTab({ data, onRefresh }: { data: FullData; onRefresh: () => void }) {
  const [creating, setCreating] = useState(false);

  async function createDeliveryOrder() {
    if (!confirm('确定要创建新版本的交付单吗？')) return;
    setCreating(true);
    try {
      const r = await fetch(`/api/ledger/${data.id}/delivery-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (r.ok) onRefresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-b" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📦 交付单历史</div>
            <div className="text-xs text-muted">共 {data.delivery_orders.length} 个版本 · 批次 {data.work_no}</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={createDeliveryOrder} disabled={creating}>
            {creating ? '创建中...' : '+ 生成新版本'}
          </button>
        </div>

        {data.delivery_orders.length === 0 ? (
          <div className="empty"><div className="ic">📦</div>暂无交付单</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...data.delivery_orders].reverse().map((o) => (
              <div key={o.id} className="delivery-paper">
                <div className="delivery-title">银饰交付单</div>
                <div className="delivery-sub">
                  {o.order_no} · 版本 v{o.version}
                </div>
                <div className="delivery-grid">
                  {Object.entries(o.content || {}).map(([k, v]) => (
                    <div key={k} className="delivery-field">
                      <div className="k">{k}</div>
                      <div className="v">{String(v)}</div>
                    </div>
                  ))}
                </div>
                <div className="hr" style={{ marginTop: 10, marginBottom: 10 }} />
                <div className="delivery-sig">
                  <div className="delivery-sig-box">
                    <div className="lbl">银匠签字</div>
                    <div className="ln">{o.issued_by || ''}</div>
                    <div className="dt">{o.issued_at}</div>
                  </div>
                  <div className="delivery-sig-box">
                    <div className="lbl">客户签收</div>
                    <div className="ln">{o.signoff ? (o.recipient || '已签收') : '________________'}</div>
                    <div className="dt">{o.signoff ? '已签收' : '未签收'}</div>
                  </div>
                </div>
                {o.signoff && <div className="delivery-seal">验收合格</div>}
                {o.previous_version_id && (
                  <div className="mt-16 text-xs text-muted">
                    ← 基于版本 v{data.delivery_orders.find((d) => d.id === o.previous_version_id)?.version || '?'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryDiffTab({ data, diffs }: { data: FullData; diffs: any }) {
  if (!diffs) return <div className="empty">加载中…</div>;

  return (
    <div className="cols-main-side">
      <div>
        <div className="card">
          <h3 className="card-title">
            <span>📊 交付单版本差异对比</span>
            <span className="meta">{diffs.versions?.length || 0} 个版本 · {diffs.diffs?.length || 0} 处变更</span>
          </h3>
          <div className="card-hint">
            交付单版本差异反映了从开工到交付过程中，由于工艺调整、工具回滚、客户需求变更等原因导致的交付内容变化。
          </div>

          {diffs.diffs?.length === 0 ? (
            <div className="empty"><div className="ic">📊</div>暂无版本差异（只有一个版本）</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {diffs.diffs.map((d: DiffPair, idx: number) => (
                <div key={idx} className="card">
                  <div className="flex-b" style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="tag tag-gray">v{d.from_version} → v{d.to_version}</span>
                      <span className="text-sm">
                        {d.from_order_no} → {d.to_order_no}
                      </span>
                    </div>
                    <span className="text-xs text-muted">{d.to_issued_at}</span>
                  </div>
                  <div>
                    {d.changes.map((c, i) => (
                      <div key={i} className={`diff-row ${c.type}`}>
                        <div>
                          <span className={`diff-type ${c.type}`}>
                            {c.type === 'add' ? '+ 新增' : c.type === 'remove' ? '- 删除' : '~ 修改'}
                          </span>
                        </div>
                        <div className="diff-key">{c.key}</div>
                        <div>
                          {c.type === 'add' && <span className="diff-after">{String(c.after)}</span>}
                          {c.type === 'remove' && <span className="diff-before">{String(c.before)}</span>}
                          {c.type === 'change' && (
                            <div>
                              <div className="diff-before">{String(c.before)}</div>
                              <div className="diff-after">{String(c.after)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="card">
          <h3 className="card-title"><span>📋 版本列表</span></h3>
          {diffs.versions?.map((v: any) => (
            <div key={v.id} className="list-item">
              <div className="icon" style={{ background: v.signoff ? '#d1fae5' : '#f1f5f9', color: v.signoff ? '#065f46' : '#6a6a75' }}>
                v{v.version}
              </div>
              <div className="body">
                <div className="title">{v.order_no}</div>
                <div className="sub">{v.issued_at} · {v.issued_by}</div>
              </div>
              <div className="meta">
                {v.signoff ? <span className="tag tag-green">已签收</span> : <span className="tag tag-gray">待签收</span>}
              </div>
            </div>
          ))}
        </div>

        {diffs.change_logs?.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <h3 className="card-title"><span>🔗 相关变更日志</span></h3>
            <div className="text-xs text-muted" style={{ marginBottom: 8 }}>
              导致交付单版本变化的原因：
            </div>
            {diffs.change_logs.slice(0, 5).map((l: any) => (
              <div key={l.id} className={`clog-item type-${l.type}`}>
                <div className="clog-head">
                  <span className="clog-type">{l.type}</span>
                  <span className="clog-table">{l.table}</span>
                  <span className="clog-when">{l.created_at}</span>
                </div>
                <div className="clog-reason">{l.reason}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangelogTab({ data }: { data: FullData }) {
  return (
    <div>
      <div className="card">
        <h3 className="card-title">
          <span>📝 变更日志</span>
          <span className="meta">共 {data.change_logs.length} 条记录</span>
        </h3>
        <div className="card-hint">
          每条变更记录都精确追踪哪个表的哪条记录发生了什么变化、原因是什么、操作人是谁，形成完整的审计追踪。
        </div>

        {data.change_logs.length === 0 ? (
          <div className="empty"><div className="ic">📝</div>暂无变更记录</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.change_logs.map((l) => {
              const before = l.before_data ? parseJsonSafe(l.before_data) : null;
              const after = l.after_data ? parseJsonSafe(l.after_data) : null;
              return (
                <div key={l.id} className={`clog-item type-${l.change_type}`}>
                  <div className="clog-head">
                    <span className="clog-type">{l.change_type}</span>
                    <span className="clog-table">
                      {l.table_name}
                      {l.record_id != null && ` #${l.record_id}`}
                    </span>
                    {l.operator && <span className="clog-table">操作人：{l.operator}</span>}
                    <span className="clog-when">{l.created_at}</span>
                  </div>
                  {l.change_reason && <div className="clog-reason">{l.change_reason}</div>}
                  {(before || after) && (
                    <div className="clog-diff">
                      {before && (
                        <div>
                          <h5>变更前</h5>
                          <pre>{JSON.stringify(before, null, 2)}</pre>
                        </div>
                      )}
                      {after && (
                        <div>
                          <h5>变更后</h5>
                          <pre>{JSON.stringify(after, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ExportTab({ data }: { data: FullData }) {
  return (
    <div className="card">
      <h3 className="card-title">
        <span>📤 导出工序档案</span>
        <span className="meta">导出为纯文本格式，便于存档和打印</span>
      </h3>
      <div className="muted-block" style={{ marginBottom: 16 }}>
        <strong>导出内容包含：</strong><br />
        • 主记录（银匠、錾子、材料、批次信息）<br />
        • 明细记录（退火次数、温度、硬度变化）<br />
        • 历史记录（纹样进度、每道工序耗时）<br />
        • 结果记录（表面缺陷、交付要求、验收结果）<br />
        • 照片批注记录<br />
        • 最新交付单信息
      </div>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <a
          href={`/api/ledger/${data.id}/export`}
          className="btn btn-primary"
          style={{ fontSize: 14, padding: '10px 24px' }}
          target="_blank"
        >
          📥 下载 {data.work_no}-工序台账.txt
        </a>
        <div className="mt-12 text-xs text-muted">
          文件编码：UTF-8 · 格式：纯文本 · 可直接打印或归档
        </div>
      </div>

      <div className="hr" />

      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📋 导出预览（前30行）</h4>
      <div style={{
        background: '#faf9f6', border: '1px solid #e5e7eb',
        borderRadius: 8, padding: 16, fontFamily: 'SF Mono, Menlo, monospace',
        fontSize: 11, lineHeight: 1.8, maxHeight: 400, overflow: 'auto',
        whiteSpace: 'pre-wrap',
      }}>
{`手工银饰錾刻工序台账 - 导出档案
═══════════════════════════════════════
作品编号：${data.work_no}
作品名称：${data.work_name}
银匠师傅：${data.silversmith}
材料：${data.material} / ${data.material_weight}g
版本：v${data.version}
状态：${data.status}
开工日期：${data.start_date}

【一、錾子与工具库】
套装：${data.chisel_set || '未指定'}
主錾：${data.main_chisels || '未记录'}

【二、退火明细（明细记录）】
${data.annealing_records.map((a, i) => `第${a.seq_no}次 | ${a.annealing_time} | ${a.temperature}℃`).join('\n')}

【三、纹样进度（历史记录）】
${data.pattern_progress.slice(0, 3).map((p, i) => `#${i + 1} ${p.pattern_stage}：${p.pattern_name} | ${p.progress_pct}%`).join('\n')}
... 更多内容请下载完整文件`}
      </div>
    </div>
  );
}
