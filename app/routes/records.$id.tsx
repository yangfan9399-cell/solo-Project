import type { LoaderFunction, MetaFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useParams, useNavigate, useSubmit } from "@remix-run/react";
import { useState } from "react";
import AppShell from "~/components/AppShell";
import { StatusBadge, SeverityDot } from "~/components/ui";
import DeviationCurveChart from "~/components/DeviationCurveChart";
import { buildLedgerSummary, generateSummaryReport, generateCsvExport } from "~/services/report-generator";
import { getRecordWithPoints, getCorrectionTable, getVersionHistory, updateRecordStatus, updateRecord, getRecordById } from "~/db/repositories/records";
import { getShipById, updateShip } from "~/db/repositories/ships";
import { detectAnomalies } from "~/services/anomaly-detector";
import type { DeviationRecordWithPoints, CorrectionTableEntry, VersionHistory, Ship, AnomalyReport, DeviationRecord, DeviationPoint } from "~/types";
import clsx from "clsx";
import { getDb, run, saveDb } from "~/db/connection";

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
  const by = formData.get('by') as string || '系统操作';

  if (actionType === 'updateStatus') {
    const status = formData.get('status') as DeviationRecord['status'];
    const summary = formData.get('summary') as string || '';
    await updateRecordStatus(id, status, by, summary);
  }

  if (actionType === 'saveShip') {
    const shipId = Number(formData.get('ship_id'));
    const data: Partial<Ship> = {
      name: formData.get('name') as string,
      imo_number: (formData.get('imo_number') as string) || null,
      call_sign: (formData.get('call_sign') as string) || null,
      flag: (formData.get('flag') as string) || null,
      ship_type: (formData.get('ship_type') as string) || null,
      gross_tonnage: formData.get('gross_tonnage') ? Number(formData.get('gross_tonnage')) : null,
      built_year: formData.get('built_year') ? Number(formData.get('built_year')) : null,
      compass_type: (formData.get('compass_type') as string) || null,
      compass_model: (formData.get('compass_model') as string) || null,
      compass_install_date: (formData.get('compass_install_date') as string) || null,
      home_port: (formData.get('home_port') as string) || null,
      notes: (formData.get('notes') as string) || null,
    };
    await updateShip(shipId, data);

    const record = await getRecordById(id);
    const newVersion = (record?.version || 1) + 1;
    const db = await getDb();
    run(db, `UPDATE deviation_records SET version = $version, updated_at = datetime('now') WHERE id = $id`, {
      $version: newVersion, $id: id
    });
    const summary = formData.get('change_summary') as string || '更新船舶与罗经档案信息';
    run(db, `INSERT INTO version_history (record_id, version_number, action, changed_by, change_summary) VALUES ($record_id, $version_number, $action, $changed_by, $change_summary)`, {
      $record_id: id, $version_number: newVersion, $action: 'update', $changed_by: by, $change_summary: summary
    });
    saveDb();
  }

  if (actionType === 'saveRecord') {
    const recordData: Partial<DeviationRecord> = {
      batch_code: formData.get('batch_code') as string,
      record_date: formData.get('record_date') as string,
      location: (formData.get('location') as string) || null,
      latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
      longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
      magnetic_variation: formData.get('magnetic_variation') ? Number(formData.get('magnetic_variation')) : null,
      variation_direction: (formData.get('variation_direction') as 'E' | 'W') || null,
      weather_condition: (formData.get('weather_condition') as string) || null,
      sea_state: (formData.get('sea_state') as string) || null,
      ship_speed: formData.get('ship_speed') ? Number(formData.get('ship_speed')) : null,
      ship_draft: formData.get('ship_draft') ? Number(formData.get('ship_draft')) : null,
      trim: formData.get('trim') ? Number(formData.get('trim')) : null,
      corrector_fore_and_aft: formData.get('corrector_fore_and_aft') ? Number(formData.get('corrector_fore_and_aft')) : null,
      corrector_athwartship: formData.get('corrector_athwartship') ? Number(formData.get('corrector_athwartship')) : null,
      corrector_vertical: formData.get('corrector_vertical') ? Number(formData.get('corrector_vertical')) : null,
      corrector_quadrantal: formData.get('corrector_quadrantal') ? Number(formData.get('corrector_quadrantal')) : null,
      corrector_heeling: formData.get('corrector_heeling') ? Number(formData.get('corrector_heeling')) : null,
      inspector_name: (formData.get('inspector_name') as string) || null,
      inspector_certificate: (formData.get('inspector_certificate') as string) || null,
      survey_company: (formData.get('survey_company') as string) || null,
      notes: (formData.get('notes') as string) || null,
    };

    const headings = HEADINGS;
    const points: Array<Omit<DeviationPoint, 'id' | 'record_id'>> = [];
    for (const h of headings) {
      const deviation = formData.get(`dev_${h}`);
      const direction = formData.get(`dir_${h}`) as 'E' | 'W';
      const magnetic = formData.get(`mag_${h}`);
      const trueHd = formData.get(`true_${h}`);
      const measured = formData.get(`meas_${h}`) === '1';
      if (deviation && direction) {
        points.push({
          ship_heading: h,
          deviation: Number(deviation),
          deviation_direction: direction,
          magnetic_heading: magnetic ? Number(magnetic) : null,
          true_heading: trueHd ? Number(trueHd) : null,
          measured,
          notes: null,
        });
      }
    }

    const corrHeadings = CORR_HEADINGS;
    const corrections: Array<Omit<CorrectionTableEntry, 'id' | 'record_id'>> = [];
    for (const ch of corrHeadings) {
      const val = formData.get(`corr_${ch}`);
      const dir = formData.get(`corrdir_${ch}`) as 'E' | 'W';
      const range = formData.get(`corrrange_${ch}`) as string;
      const rule = formData.get(`corrrule_${ch}`) as string;
      if (val && dir) {
        corrections.push({
          heading: ch,
          correction_value: Number(val),
          correction_direction: dir,
          ship_heading_range: range || `${(ch - 22 + 360) % 360}° - ${(ch + 22) % 360}°`,
          apply_rule: rule || null,
        });
      }
    }

    const summary = formData.get('change_summary') as string || '更新校正作业信息、自差点及校正表';
    await updateRecord(id, recordData, points, corrections, by, summary);
  }

  if (actionType === 'savePoints') {
    const headings = HEADINGS;
    const points: Array<Omit<DeviationPoint, 'id' | 'record_id'>> = [];
    for (const h of headings) {
      const deviation = formData.get(`dev_${h}`);
      const direction = formData.get(`dir_${h}`) as 'E' | 'W';
      const magnetic = formData.get(`mag_${h}`);
      const trueHd = formData.get(`true_${h}`);
      const measured = formData.get(`meas_${h}`) === '1';
      if (deviation && direction) {
        points.push({
          ship_heading: h,
          deviation: Number(deviation),
          deviation_direction: direction,
          magnetic_heading: magnetic ? Number(magnetic) : null,
          true_heading: trueHd ? Number(trueHd) : null,
          measured,
          notes: null,
        });
      }
    }
    const summary = formData.get('change_summary') as string || '更新24航向自差点观测数据';
    await updateRecord(id, {}, points, undefined, by, summary);
  }

  if (actionType === 'saveCorrections') {
    const corrHeadings = CORR_HEADINGS;
    const corrections: Array<Omit<CorrectionTableEntry, 'id' | 'record_id'>> = [];
    for (const ch of corrHeadings) {
      const val = formData.get(`corr_${ch}`);
      const dir = formData.get(`corrdir_${ch}`) as 'E' | 'W';
      const range = formData.get(`corrrange_${ch}`) as string;
      const rule = formData.get(`corrrule_${ch}`) as string;
      if (val && dir) {
        corrections.push({
          heading: ch,
          correction_value: Number(val),
          correction_direction: dir,
          ship_heading_range: range || `${(ch - 22 + 360) % 360}° - ${(ch + 22) % 360}°`,
          apply_rule: rule || null,
        });
      }
    }
    const summary = formData.get('change_summary') as string || '更新8主航向校正使用表';
    await updateRecord(id, {}, undefined, corrections, by, summary);
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

const HEADINGS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345];
const CORR_HEADINGS = [0, 45, 90, 135, 180, 225, 270, 315];

function InfoItem({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div className="info-row">
      <div className="info-label">{label}</div>
      <div className={clsx('info-value', danger && 'text-danger')}>{value || <span className="text-muted">—</span>}</div>
    </div>
  );
}

function EditField({ label, name, type = 'text', value, onChange, required, placeholder }: {
  label: string; name: string; type?: string; value: string | number | null;
  onChange?: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        name={name}
        className="form-input"
        defaultValue={value ?? ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function RecordDetail() {
  const data = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [isEditing, setIsEditing] = useState(false);
  const [editingTab, setEditingTab] = useState<'ship' | 'record' | 'points' | 'corrections'>('record');
  const [editPoints, setEditPoints] = useState<Array<{ heading: number; deviation: number; direction: 'E' | 'W'; magnetic: number | null; trueHd: number | null; measured: boolean }>>(() =>
    HEADINGS.map(h => {
      const p = data.record.points.find(x => x.ship_heading === h);
      return {
        heading: h,
        deviation: p?.deviation || 0,
        direction: p?.deviation_direction || 'E',
        magnetic: p?.magnetic_heading ?? null,
        trueHd: p?.true_heading ?? null,
        measured: p?.measured || false,
      };
    })
  );
  const [editCorrs, setEditCorrs] = useState<Array<{ heading: number; correction_value: number; correction_direction: 'E' | 'W'; ship_heading_range: string; apply_rule: string | null }>>(() =>
    CORR_HEADINGS.map(h => {
      const c = data.corrections.find(x => x.heading === h);
      return {
        heading: h,
        correction_value: c?.correction_value || 0,
        correction_direction: c?.correction_direction || 'E',
        ship_heading_range: c?.ship_heading_range || `${(h - 22 + 360) % 360}° - ${(h + 22) % 360}°`,
        apply_rule: c?.apply_rule || null,
      };
    })
  );

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

  const canEdit = data.record.status !== 'archived';

  const previewPoints: DeviationPoint[] = editPoints.map(p => ({
    id: 0, record_id: 0,
    ship_heading: p.heading,
    deviation: p.deviation,
    deviation_direction: p.direction,
    magnetic_heading: p.magnetic,
    true_heading: p.trueHd,
    measured: p.measured,
    notes: null,
  }));

  return (
    <AppShell
      summary={data.summary}
      currentPageTitle={`校正记录${isEditing ? '编辑' : '详情'} · ${data.ship.name}`}
      currentPageSubtitle={`批次号：${data.record.batch_code}　版本：V${data.record.version}　校正日期：${data.record.record_date}`}
    >
      <div className="detail-header">
        <div className="detail-title-wrap">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <h1 className="detail-title">⚓ {data.ship.name}</h1>
            <StatusBadge status={data.record.status} />
            {isEditing && <span className="status-badge status-verified">✏️ 编辑模式</span>}
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
          {!isEditing && canEdit && (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>✏️ 进入编辑</button>
          )}
          {isEditing && (
            <>
              <button className="btn btn-outline" onClick={() => {
                setIsEditing(false);
                setEditPoints(HEADINGS.map(h => {
                  const p = data.record.points.find(x => x.ship_heading === h);
                  return {
                    heading: h,
                    deviation: p?.deviation || 0,
                    direction: p?.deviation_direction || 'E',
                    magnetic: p?.magnetic_heading ?? null,
                    trueHd: p?.true_heading ?? null,
                    measured: p?.measured || false,
                  };
                }));
                setEditCorrs(CORR_HEADINGS.map(h => {
                  const c = data.corrections.find(x => x.heading === h);
                  return {
                    heading: h,
                    correction_value: c?.correction_value || 0,
                    correction_direction: c?.correction_direction || 'E',
                    ship_heading_range: c?.ship_heading_range || `${(h - 22 + 360) % 360}° - ${(h + 22) % 360}°`,
                    apply_rule: c?.apply_rule || null,
                  };
                }));
              }}>↩️ 取消编辑</button>
            </>
          )}
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

      {isEditing && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">✏️ 编辑工作区</div>
            <div className="text-sm text-muted">选择要编辑的内容区块，编辑完成后点击下方"保存"按钮</div>
          </div>
          <div className="tabs" style={{ padding: '0 20px' }}>
            <button className={clsx('tab', editingTab === 'ship' && 'active')} onClick={() => setEditingTab('ship')}>🚢 船舶档案</button>
            <button className={clsx('tab', editingTab === 'record' && 'active')} onClick={() => setEditingTab('record')}>📋 校正作业</button>
            <button className={clsx('tab', editingTab === 'points' && 'active')} onClick={() => setEditingTab('points')}>📊 自差点数据</button>
            <button className={clsx('tab', editingTab === 'corrections' && 'active')} onClick={() => setEditingTab('corrections')}>📐 校正使用表</button>
          </div>
          <div style={{ padding: '20px' }}>
            {editingTab === 'ship' && (
              <form method="post" onSubmit={(e) => {
                const fd = new FormData(e.currentTarget);
                fd.set('action', 'saveShip');
                fd.set('by', data.record.inspector_name || '系统');
                submit(fd, { method: 'post' });
                setIsEditing(false);
                e.preventDefault();
              }}>
                <div className="grid-2">
                  <EditField label="船名" name="name" value={data.ship.name} required />
                  <EditField label="IMO 编号" name="imo_number" value={data.ship.imo_number} placeholder="例：IMO9765432" />
                  <EditField label="国际呼号" name="call_sign" value={data.ship.call_sign} />
                  <EditField label="船旗国" name="flag" value={data.ship.flag} />
                  <EditField label="船舶类型" name="ship_type" value={data.ship.ship_type} />
                  <EditField label="总吨位" name="gross_tonnage" type="number" value={data.ship.gross_tonnage} />
                  <EditField label="建造年份" name="built_year" type="number" value={data.ship.built_year} />
                  <EditField label="船籍港" name="home_port" value={data.ship.home_port} />
                  <EditField label="罗经类型" name="compass_type" value={data.ship.compass_type} />
                  <EditField label="罗经型号" name="compass_model" value={data.ship.compass_model} />
                  <EditField label="安装日期" name="compass_install_date" type="date" value={data.ship.compass_install_date} />
                  <div className="form-group">
                    <label className="form-label">备注说明</label>
                    <textarea name="notes" className="form-textarea" defaultValue={data.ship.notes ?? ''} />
                  </div>
                </div>
                <input type="hidden" name="ship_id" value={data.ship.id} />
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label">变更说明（记入版本历史）</label>
                  <input name="change_summary" className="form-input" placeholder="请简要描述本次修改内容..." />
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-gold">💾 保存船舶档案</button>
                </div>
              </form>
            )}

            {editingTab === 'record' && (
              <form method="post" onSubmit={(e) => {
                const fd = new FormData(e.currentTarget);
                fd.set('action', 'saveRecord');
                fd.set('by', data.record.inspector_name || '系统');
                editPoints.forEach(p => {
                  fd.set(`dev_${p.heading}`, String(p.deviation));
                  fd.set(`dir_${p.heading}`, p.direction);
                  fd.set(`mag_${p.heading}`, p.magnetic != null ? String(p.magnetic) : '');
                  fd.set(`true_${p.heading}`, p.trueHd != null ? String(p.trueHd) : '');
                  fd.set(`meas_${p.heading}`, p.measured ? '1' : '0');
                });
                editCorrs.forEach(c => {
                  fd.set(`corr_${c.heading}`, String(c.correction_value));
                  fd.set(`corrdir_${c.heading}`, c.correction_direction);
                  fd.set(`corrrange_${c.heading}`, c.ship_heading_range);
                  fd.set(`corrrule_${c.heading}`, c.apply_rule || '');
                });
                submit(fd, { method: 'post' });
                setIsEditing(false);
              }}>
                <div className="grid-2">
                  <EditField label="批次编号" name="batch_code" value={data.record.batch_code} required />
                  <EditField label="校正日期" name="record_date" type="date" value={data.record.record_date} required />
                  <EditField label="校正地点" name="location" value={data.record.location} />
                  <EditField label="地理纬度" name="latitude" type="number" value={data.record.latitude} />
                  <EditField label="地理经度" name="longitude" type="number" value={data.record.longitude} />
                  <EditField label="当地磁差" name="magnetic_variation" type="number" value={data.record.magnetic_variation} />
                  <div className="form-group">
                    <label className="form-label">磁差方向</label>
                    <select name="variation_direction" className="form-select" defaultValue={data.record.variation_direction ?? ''}>
                      <option value="">—</option>
                      <option value="E">东偏 E</option>
                      <option value="W">西偏 W</option>
                    </select>
                  </div>
                  <EditField label="天气状况" name="weather_condition" value={data.record.weather_condition} />
                  <EditField label="海面状况" name="sea_state" value={data.record.sea_state} />
                  <EditField label="船舶航速(kn)" name="ship_speed" type="number" value={data.record.ship_speed} />
                  <EditField label="吃水(m)" name="ship_draft" type="number" value={data.record.ship_draft} />
                  <EditField label="纵倾" name="trim" type="number" value={data.record.trim} />
                  <div style={{ borderTop: '1px solid var(--gray-200)', gridColumn: '1 / -1', margin: '10px 0' }} />
                  <EditField label="验船师" name="inspector_name" value={data.record.inspector_name} />
                  <EditField label="资质证书号" name="inspector_certificate" value={data.record.inspector_certificate} />
                  <EditField label="检测机构" name="survey_company" value={data.record.survey_company} />
                  <div style={{ borderTop: '1px solid var(--gray-200)', gridColumn: '1 / -1', margin: '10px 0' }} />
                  <EditField label="纵向磁棒(F-A) 格数" name="corrector_fore_and_aft" type="number" value={data.record.corrector_fore_and_aft} />
                  <EditField label="横向磁棒(A-S) 格数" name="corrector_athwartship" type="number" value={data.record.corrector_athwartship} />
                  <EditField label="垂直磁棒 格数" name="corrector_vertical" type="number" value={data.record.corrector_vertical} />
                  <EditField label="象限软铁球 圈数" name="corrector_quadrantal" type="number" value={data.record.corrector_quadrantal} />
                  <EditField label="倾斜校正器" name="corrector_heeling" type="number" value={data.record.corrector_heeling} />
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">备注说明</label>
                    <textarea name="notes" className="form-textarea" defaultValue={data.record.notes ?? ''} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">变更说明（记入版本历史）</label>
                    <input name="change_summary" className="form-input" placeholder="请简要描述本次修改内容..." />
                  </div>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-gold">💾 保存全部修改</button>
                </div>
              </form>
            )}

            {editingTab === 'points' && (
              <form method="post" onSubmit={(e) => {
                const fd = new FormData(e.currentTarget);
                fd.set('action', 'savePoints');
                fd.set('by', data.record.inspector_name || '系统');
                editPoints.forEach(p => {
                  fd.set(`dev_${p.heading}`, String(p.deviation));
                  fd.set(`dir_${p.heading}`, p.direction);
                  fd.set(`mag_${p.heading}`, p.magnetic != null ? String(p.magnetic) : '');
                  fd.set(`true_${p.heading}`, p.trueHd != null ? String(p.trueHd) : '');
                  fd.set(`meas_${p.heading}`, p.measured ? '1' : '0');
                });
                submit(fd, { method: 'post' });
                setIsEditing(false);
                e.preventDefault();
              }}>
                <div className="flex-gap mb-4">
                  <span className="text-sm text-muted">编辑 24 个航向的自差数据。切换方向会自动计算磁航向，修改后点击下方"保存自差数据"提交。</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>船首向</th>
                        <th>自差 (°)</th>
                        <th>方向</th>
                        <th>磁航向 (°)</th>
                        <th>真航向 (°)</th>
                        <th>实测/插值</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editPoints.map((p, i) => (
                        <tr key={p.heading} className={clsx(p.deviation > 10 && 'row-abnormal')}>
                          <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{p.heading}°</td>
                          <td>
                            <input
                              type="number" step="0.1" min="0" max="40"
                              value={p.deviation}
                              className="form-input"
                              style={{ width: '90px', padding: '4px 8px' }}
                              onChange={e => {
                                const v = Number(e.target.value) || 0;
                                setEditPoints(prev => prev.map(x => x.heading === p.heading ? {
                                  ...x,
                                  deviation: v,
                                  magnetic: x.direction === 'E' ? p.heading - v : p.heading + v,
                                } : x));
                              }}
                            />
                          </td>
                          <td>
                            <select
                              value={p.direction}
                              className="form-select"
                              style={{ width: '80px', padding: '4px 8px' }}
                              onChange={e => {
                                const d = e.target.value as 'E' | 'W';
                                setEditPoints(prev => prev.map(x => x.heading === p.heading ? {
                                  ...x,
                                  direction: d,
                                  magnetic: d === 'E' ? p.heading - p.deviation : p.heading + p.deviation,
                                } : x));
                              }}
                            >
                              <option value="E">东 E</option>
                              <option value="W">西 W</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="number" step="0.1"
                              value={p.magnetic ?? ''}
                              className="form-input"
                              style={{ width: '90px', padding: '4px 8px' }}
                              onChange={e => setEditPoints(prev => prev.map(x => x.heading === p.heading ? { ...x, magnetic: Number(e.target.value) || null } : x))}
                            />
                          </td>
                          <td>
                            <input
                              type="number" step="0.1"
                              value={p.trueHd ?? ''}
                              className="form-input"
                              style={{ width: '90px', padding: '4px 8px' }}
                              onChange={e => setEditPoints(prev => prev.map(x => x.heading === p.heading ? { ...x, trueHd: Number(e.target.value) || null } : x))}
                            />
                          </td>
                          <td>
                            <select
                              value={p.measured ? '1' : '0'}
                              className="form-select"
                              style={{ width: '100px', padding: '4px 8px' }}
                              onChange={e => setEditPoints(prev => prev.map(x => x.heading === p.heading ? { ...x, measured: e.target.value === '1' } : x))}
                            >
                              <option value="1">实测</option>
                              <option value="0">插值</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <div className="card-title">📈 实时曲线预览</div>
                    <span className="text-sm text-muted">修改自差数据后可实时查看曲线变化</span>
                  </div>
                  <div style={{ padding: '16px 20px 24px' }}>
                    <DeviationCurveChart points={previewPoints} title="编辑中 - 自差曲线预览" />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label">变更说明（记入版本历史）</label>
                  <input name="change_summary" className="form-input" placeholder="请简要描述本次修改内容..." />
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-gold">💾 保存自差数据</button>
                </div>
              </form>
            )}

            {editingTab === 'corrections' && (
              <form method="post" onSubmit={(e) => {
                const fd = new FormData(e.currentTarget);
                fd.set('action', 'saveCorrections');
                fd.set('by', data.record.inspector_name || '系统');
                editCorrs.forEach(c => {
                  fd.set(`corr_${c.heading}`, String(c.correction_value));
                  fd.set(`corrdir_${c.heading}`, c.correction_direction);
                  fd.set(`corrrange_${c.heading}`, c.ship_heading_range);
                  fd.set(`corrrule_${c.heading}`, c.apply_rule || '');
                });
                submit(fd, { method: 'post' });
                setIsEditing(false);
                e.preventDefault();
              }}>
                <div className="flex-gap mb-4">
                  <span className="text-sm text-muted">编辑 8 个主航向的校正表数据。建议配合自差点数据进行调整，修改后点击下方"保存校正表"提交。</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>主航向</th>
                        <th>适用范围</th>
                        <th>校正量 (°)</th>
                        <th>方向</th>
                        <th>使用规则</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editCorrs.map((c, i) => (
                        <tr key={c.heading}>
                          <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{c.heading}°</td>
                          <td>
                            <input
                              type="text"
                              value={c.ship_heading_range}
                              className="form-input"
                              style={{ width: '160px', padding: '4px 8px' }}
                              onChange={e => setEditCorrs(prev => prev.map(x => x.heading === c.heading ? { ...x, ship_heading_range: e.target.value } : x))}
                            />
                          </td>
                          <td>
                            <input
                              type="number" step="0.1" min="0"
                              value={c.correction_value}
                              className="form-input"
                              style={{ width: '90px', padding: '4px 8px' }}
                              onChange={e => setEditCorrs(prev => prev.map(x => x.heading === c.heading ? { ...x, correction_value: Number(e.target.value) || 0 } : x))}
                            />
                          </td>
                          <td>
                            <select
                              value={c.correction_direction}
                              className="form-select"
                              style={{ width: '80px', padding: '4px 8px' }}
                              onChange={e => setEditCorrs(prev => prev.map(x => x.heading === c.heading ? { ...x, correction_direction: e.target.value as 'E' | 'W' } : x))}
                            >
                              <option value="E">东 E</option>
                              <option value="W">西 W</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={c.apply_rule ?? ''}
                              className="form-input"
                              style={{ width: '280px', padding: '4px 8px' }}
                              placeholder="线性插值..."
                              onChange={e => setEditCorrs(prev => prev.map(x => x.heading === c.heading ? { ...x, apply_rule: e.target.value || null } : x))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginRight: '8px' }} onClick={() => {
                    const fromPoints = CORR_HEADINGS.map(h => {
                      const p = editPoints.find(x => x.heading === h);
                      return {
                        heading: h,
                        correction_value: p?.deviation || 0,
                        correction_direction: p?.direction || 'E',
                        ship_heading_range: `${(h - 22 + 360) % 360}° - ${(h + 22) % 360}°`,
                        apply_rule: h % 90 === 0 ? '主航向优先使用，插值计算中间航向' : '象限中心航向，配合主航向线性插值',
                      };
                    });
                    setEditCorrs(fromPoints);
                  }}>🔄 从自差数据填充</button>
                </div>
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label className="form-label">变更说明（记入版本历史）</label>
                  <input name="change_summary" className="form-input" placeholder="请简要描述本次修改内容..." />
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button type="submit" className="btn btn-gold">💾 保存校正表</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
              <div className="text-sm text-muted mt-4" style={{ marginTop: '10px' }}>
                ⚠️ 状态变更后会自动递增版本号并写入操作历史记录
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
