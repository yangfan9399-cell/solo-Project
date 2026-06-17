import type { LoaderFunction, MetaFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useParams, useNavigate, useSubmit } from "@remix-run/react";
import AppShell from "~/components/AppShell";
import { StatusBadge, SeverityDot } from "~/components/ui";
import DeviationCurveChart from "~/components/DeviationCurveChart";
import { buildLedgerSummary, generateSummaryReport, generateCsvExport } from "~/services/report-generator";
import { getRecordWithPoints, getCorrectionTable, getVersionHistory, updateRecordStatus } from "~/db/repositories/records";
import { getShipById } from "~/db/repositories/ships";
import { detectAnomalies } from "~/services/anomaly-detector";
import type { DeviationRecordWithPoints, CorrectionTableEntry, VersionHistory, Ship, AnomalyReport, DeviationRecord } from "~/types";
import clsx from "clsx";

interface LoaderData {
  summary: Awaited<ReturnType<typeof buildLedgerSummary>>;
  ship: Ship;
  record: DeviationRecordWithPoints;
  corrections: CorrectionTableEntry[];
  history: VersionHistory[];
  anomalies: AnomalyReport[];
}

export const meta: MetaFunction = () => [
  { title: "校正记录详情 - 罗经自差校正台账" },
];

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const id = Number(params.id);
  const actionType = formData.get('action') as string;
  const status = formData.get('status') as DeviationRecord['status'];
  const by = formData.get('by') as string || '系统操作';
  const summary = formData.get('summary') as string || '';

  if (actionType === 'updateStatus' && status) {
    await updateRecordStatus(id, status, by, summary);
  }
  if (actionType === 'downloadCsv') {
    const record = (await getRecordWithPoints(id))!;
    const ship = (await getShipById(record.ship_id))!;
    const corrections = await getCorrectionTable(id);
    const csv = generateCsvExport(ship, record, record.points, corrections);
    return new Response('\uFEFF' + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="deviation-${record.batch_code}.csv"`,
      },
    });
  }
  if (actionType === 'downloadReport') {
    const record = (await getRecordWithPoints(id))!;
    const ship = (await getShipById(record.ship_id))!;
    const corrections = await getCorrectionTable(id);
    const anomalies = detectAnomalies(id, record.points);
    const html = generateSummaryReport(ship, record, record.points, corrections, anomalies.map(a => a.message));
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="report-${record.batch_code}.html"`,
      },
    });
  }
  return json({ ok: true });
};

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);
  const record = await getRecordWithPoints(id);
  if (!record) throw new Response('记录不存在', { status: 404 });
  const ship = (await getShipById(record.ship_id))!;
  const summary = await buildLedgerSummary();
  return json({
    summary,
    ship,
    record,
    corrections: await getCorrectionTable(id),
    history: await getVersionHistory(id),
    anomalies: detectAnomalies(id, record.points),
  } satisfies LoaderData);
};

function InfoItem({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div className="info-row">
      <div className="info-label">{label}</div>
      <div className={clsx('info-value', danger && 'text-danger')}>{value || <span className="text-muted">—</span>}</div>
    </div>
  );
}

export default function RecordDetail() {
  const data = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleStatusChange = (status: DeviationRecord['status'], by: string, s: string) => {
    const fd = new FormData();
    fd.set('action', 'updateStatus');
    fd.set('status', status);
    fd.set('by', by);
    fd.set('summary', s);
    submit(fd, { method: 'post' });
  };

  const avgDev = data.record.points.length > 0
    ? (data.record.points.reduce((s, p) => s + p.deviation, 0) / data.record.points.length).toFixed(1)
    : '0';
  const maxDev = Math.max(0, ...data.record.points.map(p => p.deviation));
  const eCount = data.record.points.filter(p => p.deviation_direction === 'E').length;
  const wCount = data.record.points.filter(p => p.deviation_direction === 'W').length;

  return (
    <AppShell
      summary={data.summary}
      currentPageTitle={`校正记录详情 · ${data.ship.name}`}
      currentPageSubtitle={`批次号：${data.record.batch_code}　版本：V${data.record.version}　校正日期：${data.record.record_date}`}
    >
      <div className="detail-header">
        <div className="detail-title-wrap">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <h1 className="detail-title">⚓ {data.ship.name}</h1>
            <StatusBadge status={data.record.status} />
            {data.anomalies.length > 0 && (
              <span className={clsx('status-badge', data.anomalies.some(a => a.severity === 'high') ? 'status-draft' : 'status-verified')}>
                ⚠️ 发现 {data.anomalies.length} 项数据提示
              </span>
            )}
          </div>
          <div className="detail-meta">
            {data.ship.imo_number && `IMO: ${data.ship.imo_number}`}
            {data.ship.call_sign && `　·　呼号: ${data.ship.call_sign}`}
            {data.ship.flag && `　·　船旗: ${data.ship.flag}`}
            {data.ship.ship_type && `　·　船型: ${data.ship.ship_type}`}
            {data.ship.gross_tonnage && `　·　${data.ship.gross_tonnage.toLocaleString()} GT`}
          </div>
        </div>
        <div className="toolbar">
          <Link to="/" className="btn btn-outline">← 返回台账</Link>
          <button className="btn btn-outline" onClick={() => {
            const fd = new FormData();
            fd.set('action', 'downloadCsv');
            submit(fd, { method: 'post' });
          }}>📥 数据 CSV</button>
          <button className="btn btn-outline" onClick={() => {
            const fd = new FormData();
            fd.set('action', 'downloadReport');
            submit(fd, { method: 'post' });
          }}>📄 完整报告</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨️ 打印</button>
        </div>
      </div>

      {data.anomalies.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">⚠️ 异常数据提示与质量检测</div>
            <span className="text-sm text-muted">共 {data.anomalies.length} 项，需要验船师复核确认</span>
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {data.anomalies.map((a, i) => (
              <div key={i} className={clsx('anomaly-card', `severity-${a.severity}`)}>
                <div className="anomaly-title">
                  <SeverityDot severity={a.severity} />
                  {a.type === 'deviation_excessive' && '🚨 自差值超限'}
                  {a.type === 'missing_points' && '⚠️ 测点数量不足'}
                  {a.type === 'abnormal_jump' && '📈 相邻航向异常跳变'}
                  {a.type === 'inconsistent_direction' && '↔️ 方向切换过于频繁'}
                  {a.type === 'curve_discontinuity' && '〰️ 曲线平滑度不足'}
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--gray-500)' }}>
                    {a.severity === 'high' ? '高风险' : a.severity === 'medium' ? '中等' : '提示'}
                  </span>
                </div>
                <div className="anomaly-desc">{a.message}</div>
                {a.details && (
                  <div style={{ fontSize: '11.5px', color: 'var(--gray-500)', marginTop: '6px', fontFamily: 'monospace' }}>
                    {JSON.stringify(a.details)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="stat-card"><div className="stat-label">有效测点</div><div className="stat-value">{data.record.points.length}</div><div className="stat-sub">标准要求 ≥ 24</div></div>
        <div className="stat-card stat-gold"><div className="stat-label">最大自差</div><div className="stat-value" style={{ color: maxDev > 10 ? 'var(--danger)' : undefined }}>{maxDev.toFixed(1)}°</div><div className="stat-sub">阈值 10°</div></div>
        <div className="stat-card"><div className="stat-label">平均自差</div><div className="stat-value">{avgDev}°</div></div>
        <div className="stat-card"><div className="stat-label">东差 E</div><div className="stat-value" style={{ color: '#1e40af' }}>{eCount}</div></div>
        <div className="stat-card"><div className="stat-label">西差 W</div><div className="stat-value" style={{ color: '#991b1b' }}>{wCount}</div></div>
        <div className="stat-card stat-green"><div className="stat-label">版本迭代</div><div className="stat-value">V{data.record.version}</div><div className="stat-sub">{data.history.length} 条操作记录</div></div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header"><div className="card-title">🚢 船舶与罗经信息</div></div>
          <div style={{ padding: '10px 20px 16px' }}>
            <InfoItem label="船名" value={data.ship.name} />
            <InfoItem label="IMO 编号" value={data.ship.imo_number} />
            <InfoItem label="国际呼号" value={data.ship.call_sign} />
            <InfoItem label="船旗国" value={data.ship.flag} />
            <InfoItem label="船舶类型" value={data.ship.ship_type} />
            <InfoItem label="总吨位" value={data.ship.gross_tonnage ? `${data.ship.gross_tonnage.toLocaleString()} GT` : null} />
            <InfoItem label="建造年份" value={data.ship.built_year} />
            <InfoItem label="船籍港" value={data.ship.home_port} />
            <div style={{ borderTop: '1px solid var(--gray-200)', margin: '10px 0' }} />
            <InfoItem label="罗经类型" value={data.ship.compass_type} />
            <InfoItem label="罗经型号" value={data.ship.compass_model} />
            <InfoItem label="安装日期" value={data.ship.compass_install_date} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📋 校正作业基本信息</div></div>
          <div style={{ padding: '10px 20px 16px' }}>
            <InfoItem label="批次编号" value={<span style={{ fontFamily: 'monospace' }}>{data.record.batch_code}</span>} />
            <InfoItem label="校正日期" value={data.record.record_date} />
            <InfoItem label="校正地点" value={data.record.location} />
            <InfoItem label="地理纬度" value={data.record.latitude ? `${data.record.latitude.toFixed(4)}°` : null} />
            <InfoItem label="地理经度" value={data.record.longitude ? `${data.record.longitude.toFixed(4)}°` : null} />
            <InfoItem label="当地磁差" value={data.record.magnetic_variation ? `${data.record.magnetic_variation}° ${data.record.variation_direction || ''}` : null} />
            <InfoItem label="天气状况" value={data.record.weather_condition} />
            <InfoItem label="海面状况" value={data.record.sea_state} />
            <InfoItem label="船舶航速" value={data.record.ship_speed ? `${data.record.ship_speed} kn` : null} />
            <div style={{ borderTop: '1px solid var(--gray-200)', margin: '10px 0' }} />
            <InfoItem label="验船师" value={data.record.inspector_name} />
            <InfoItem label="资质证书号" value={data.record.inspector_certificate} />
            <InfoItem label="检测机构" value={data.record.survey_company} />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">🧭 罗经自差曲线图 · 360° 全航向极坐标投影</div>
          <div className="text-sm text-muted">点击"打印"按钮可将曲线图输出至正式报告</div>
        </div>
        <div style={{ padding: '16px 20px 24px' }}>
          <DeviationCurveChart points={data.record.points} title={`${data.ship.name} - ${data.record.record_date} 自差闭合曲线图`} />
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">📊 自差观测数据记录表</div></div>
        <div style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>船首向 (°)</th>
                <th>磁航向 (°)</th>
                <th>真航向 (°)</th>
                <th>自差 (°)</th>
                <th>方向</th>
                <th>数据类型</th>
              </tr>
            </thead>
            <tbody>
              {data.record.points.map((p, i) => (
                <tr key={p.id} className={clsx(p.deviation > 10 && 'row-abnormal')}>
                  <td style={{ color: 'var(--gray-500)' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{p.ship_heading}</td>
                  <td>{p.magnetic_heading?.toFixed(1)}</td>
                  <td>{p.true_heading?.toFixed(1)}</td>
                  <td style={{ fontWeight: 600, color: p.deviation > 10 ? 'var(--danger)' : undefined }}>{p.deviation.toFixed(1)}</td>
                  <td>
                    <span className={clsx(p.deviation_direction === 'E' ? 'text-info' : 'text-danger')} style={{ fontWeight: 600 }}>
                      {p.deviation_direction === 'E' ? '东差 E' : '西差 W'}
                    </span>
                  </td>
                  <td>
                    {p.measured
                      ? <span className="status-badge status-approved">实测</span>
                      : <span className="status-badge status-draft">曲线插值</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📐 航向校正使用表</div>
            <span className="text-sm text-muted">航行中按此表修正罗经指示</span>
          </div>
          <div style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>主航向</th><th>适用范围</th><th>校正量</th><th>方向</th></tr>
              </thead>
              <tbody>
                {data.corrections.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{c.heading}°</td>
                    <td className="text-sm">{c.ship_heading_range}</td>
                    <td style={{ fontWeight: 600 }}>{c.correction_value.toFixed(1)}°</td>
                    <td>
                      <span className={clsx(c.correction_direction === 'E' ? 'text-info' : 'text-danger')} style={{ fontWeight: 600 }}>
                        {c.correction_direction === 'E' ? '东 E' : '西 W'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', fontSize: '12px', color: 'var(--gray-500)', background: 'var(--gray-50)' }}>
            💡 使用方法：磁航向 = 船首向 ± 自差；真航向 = 磁航向 ± 磁差。东偏为正、西偏为负。
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🧲 校正器调整数据</div>
            <span className="text-sm text-muted">磁性校正器位置记录</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div className="grid-2" style={{ gap: '0' }}>
              <InfoItem label="纵向磁棒 (F-A)" value={data.record.corrector_fore_and_aft != null ? `${data.record.corrector_fore_and_aft} 格` : null} />
              <InfoItem label="横向磁棒 (A-S)" value={data.record.corrector_athwartship != null ? `${data.record.corrector_athwartship} 格` : null} />
              <InfoItem label="垂直磁棒" value={data.record.corrector_vertical != null ? `${data.record.corrector_vertical} 格` : null} />
              <InfoItem label="象限球 (软铁)" value={data.record.corrector_quadrantal != null ? `${data.record.corrector_quadrantal} 圈` : null} />
              <InfoItem label="倾斜校正器" value={data.record.corrector_heeling != null ? `${data.record.corrector_heeling}` : null} />
            </div>
            {data.record.notes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--gray-50)', borderRadius: '6px', borderLeft: '3px solid var(--gold-500)' }}>
                <div className="text-sm" style={{ color: 'var(--gray-600)', fontWeight: 600, marginBottom: '4px' }}>📝 备注说明</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-700)', lineHeight: 1.6 }}>{data.record.notes}</div>
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
              <div className="section-title">状态流转操作</div>
              <div className="flex-gap">
                {data.record.status === 'draft' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange('verified', data.record.inspector_name || '验船师', '提交数据复核')}>🔍 提交复核</button>
                    <button className="btn btn-gold btn-sm" onClick={() => handleStatusChange('approved', '船长', '船长批准本轮校正')}>✅ 直接批准</button>
                  </>
                )}
                {data.record.status === 'verified' && (
                  <button className="btn btn-gold btn-sm" onClick={() => handleStatusChange('approved', '船长', '船长批准本轮校正')}>✅ 船长批准</button>
                )}
                {(data.record.status === 'approved' || data.record.status === 'verified') && (
                  <button className="btn btn-sm btn-danger-outline" onClick={() => handleStatusChange('archived', '系统', '校正记录过期，自动归档')}>📦 归档</button>
                )}
                {data.record.status === 'archived' && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('draft', '管理员', '记录恢复编辑状态')}>↩️ 恢复编辑</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header"><div className="card-title">📜 版本与操作历史</div></div>
        <div style={{ padding: '8px 20px 20px' }}>
          {data.history.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📜</div>暂无操作历史</div>
          ) : data.history.map(h => (
            <div key={h.id} className="version-item">
              <div className={clsx('version-dot', h.action)} />
              <div>
                <div className="version-title">
                  V{h.version_number} ·
                  {h.action === 'create' && ' 创建记录'}
                  {h.action === 'update' && ' 更新数据'}
                  {h.action === 'submit' && ' 提交审核'}
                  {h.action === 'verify' && ' 复核通过'}
                  {h.action === 'approve' && ' 船长批准'}
                  {h.action === 'archive' && ' 归档处理'}
                  {h.action === 'restore' && ' 恢复编辑'}
                </div>
                <div className="version-sum">{h.change_summary || '—'}</div>
                <div className="version-user">操作人：{h.changed_by || '系统'}</div>
              </div>
              <div className="version-time">{h.created_at}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
