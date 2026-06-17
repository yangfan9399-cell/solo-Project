import type { LoaderFunction, MetaFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { useState } from "react";
import AppShell from "~/components/AppShell";
import DeviationCurveChart from "~/components/DeviationCurveChart";
import { buildLedgerSummary } from "~/services/report-generator";
import { getAllShips } from "~/db/repositories/ships";
import { createRecord } from "~/db/repositories/records";
import type { DeviationPoint, CorrectionTableEntry, Ship } from "~/types";

interface LoaderData {
  summary: Awaited<ReturnType<typeof buildLedgerSummary>>;
  ships: Ship[];
  preSelectedShipId: number | null;
}

const HEADINGS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345];

export const meta: MetaFunction = () => [{ title: "新建校正记录" }];

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const shipId = url.searchParams.get('ship');
  return json({
    summary: await buildLedgerSummary(),
    ships: await getAllShips(),
    preSelectedShipId: shipId ? Number(shipId) : null,
  } satisfies LoaderData);
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const ship_id = Number(form.get('ship_id'));
  const record_date = String(form.get('record_date') || new Date().toISOString().slice(0, 10));
  const location = form.get('location') as string;
  const inspector_name = form.get('inspector_name') as string;
  const survey_company = form.get('survey_company') as string;
  const notes = form.get('notes') as string;
  const magnetic_variation = form.get('magnetic_variation') ? Number(form.get('magnetic_variation')) : null;
  const variation_direction = (form.get('variation_direction') as 'E' | 'W') || null;

  const points: Omit<DeviationPoint, 'id' | 'record_id'>[] = [];
  for (const h of HEADINGS) {
    const dev = form.get(`dev_${h}`);
    const dir = form.get(`dir_${h}`) as 'E' | 'W' | undefined;
    if (dev && dir) {
      const deviation = Number(dev);
      const sign = dir === 'E' ? 1 : -1;
      const magHd = (((h - sign * deviation) % 360) + 360) % 360;
      const trueHd = magnetic_variation
        ? ((magHd + (variation_direction === 'E' ? 1 : -1) * magnetic_variation) % 360 + 360) % 360
        : null;
      points.push({
        ship_heading: h,
        magnetic_heading: Math.round(magHd * 10) / 10,
        true_heading: trueHd !== null ? Math.round(trueHd * 10) / 10 : null,
        deviation,
        deviation_direction: dir,
        measured: h % 30 === 0,
        notes: null,
      });
    }
  }

  const corrections: Omit<CorrectionTableEntry, 'id' | 'record_id'>[] = [];
  const corrHeadings = [0, 45, 90, 135, 180, 225, 270, 315];
  for (const ch of corrHeadings) {
    const match = points.find(p => p.ship_heading === ch);
    if (match) {
      corrections.push({
        heading: ch,
        ship_heading_range: `${(ch - 22 + 360) % 360}° - ${(ch + 22) % 360}°`,
        correction_value: match.deviation,
        correction_direction: match.deviation_direction,
        apply_rule: '按标准规则使用'
      });
    }
  }

  const batchCode = `BATCH-${ship_id}-${record_date.replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

  const id = await createRecord({
    ship_id, version: 1, batch_code: batchCode, record_date, location,
    latitude: null, longitude: null,
    magnetic_variation, variation_direction,
    weather_condition: (form.get('weather_condition') as string) || null,
    sea_state: (form.get('sea_state') as string) || null,
    ship_speed: null, ship_draft: null, trim: null,
    corrector_fore_and_aft: null, corrector_athwartship: null,
    corrector_vertical: null, corrector_quadrantal: null, corrector_heeling: null,
    inspector_name, inspector_certificate: null, survey_company,
    status: 'draft', notes,
  }, points, corrections);

  return redirect(`/records/${id}`);
};

export default function NewRecordPage() {
  const data = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const [devs, setDevs] = useState<Record<number, string>>({});
  const [dirs, setDirs] = useState<Record<number, 'E' | 'W'>>({});

  const handleQuickFill = (seed: number) => {
    const nextD: Record<number, string> = {};
    const nextDir: Record<number, 'E' | 'W'> = {};
    for (let i = 0; i < HEADINGS.length; i++) {
      const h = HEADINGS[i];
      const rad = (h * Math.PI) / 180;
      let val = 2.5 * Math.sin(rad + seed * 0.1) + 1.2 * Math.sin(2 * rad + seed * 0.2) + 0.5 + Math.sin(seed * 13 + i) * 0.3;
      let dir: 'E' | 'W' = 'E';
      if (val < 0) { dir = 'W'; val = -val; }
      nextD[h] = val.toFixed(1);
      nextDir[h] = dir;
    }
    setDevs(nextD);
    setDirs(nextDir);
  };

  const points: DeviationPoint[] = HEADINGS
    .filter(h => devs[h] && dirs[h])
    .map(h => ({
      id: 0, record_id: 0,
      ship_heading: h,
      magnetic_heading: null, true_heading: null,
      deviation: Number(devs[h]),
      deviation_direction: dirs[h] as 'E' | 'W',
      measured: h % 30 === 0, notes: null
    }));

  return (
    <AppShell summary={data.summary} currentPageTitle="新建罗经自差校正记录" currentPageSubtitle="填写船舶基本信息与自差观测数据">
      <form onSubmit={e => { e.preventDefault(); submit(e.currentTarget, { method: 'post' }); }}>
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">📋 基本信息</div>
            <div className="toolbar">
              <button type="button" className="btn btn-sm btn-outline" onClick={() => handleQuickFill(Math.floor(Math.random() * 20))}>🎲 填充示例数据</button>
              <Link to="/" className="btn btn-sm btn-outline">取消</Link>
              <button type="submit" className="btn btn-sm btn-gold">💾 保存草稿</button>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">船舶<span className="required">*</span></label>
                <select name="ship_id" className="form-select" defaultValue={data.preSelectedShipId || ''} required>
                  <option value="">-- 请选择船舶 --</option>
                  {data.ships.map(s => <option key={s.id} value={s.id}>⚓ {s.name} ({s.imo_number || s.call_sign})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">校正日期<span className="required">*</span></label>
                <input type="date" name="record_date" className="form-input" defaultValue={new Date().toISOString().slice(0, 10)} required />
              </div>
              <div className="form-group">
                <label className="form-label">校正地点</label>
                <input name="location" className="form-input" placeholder="如：上海洋山港" />
              </div>
              <div className="form-group">
                <label className="form-label">验船师姓名</label>
                <input name="inspector_name" className="form-input" placeholder="验船师" />
              </div>
              <div className="form-group">
                <label className="form-label">检测机构</label>
                <input name="survey_company" className="form-input" placeholder="船级社/海事机构" />
              </div>
              <div className="form-group">
                <label className="form-label">天气状况</label>
                <input name="weather_condition" className="form-input" placeholder="如：晴，能见度良好" />
              </div>
              <div className="form-group">
                <label className="form-label">当地磁差 (°)</label>
                <input type="number" step="0.1" name="magnetic_variation" className="form-input" placeholder="如：4.2" />
              </div>
              <div className="form-group">
                <label className="form-label">磁差方向</label>
                <select name="variation_direction" className="form-select">
                  <option value="">—</option>
                  <option value="E">东偏 E</option>
                  <option value="W">西偏 W</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">海面状况</label>
                <input name="sea_state" className="form-input" placeholder="如：海况2级" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">备注说明</label>
              <textarea name="notes" className="form-textarea" placeholder="特殊情况说明、校正器调整记录等" />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">🧭 录入自差观测数据（每 15° 一个航向，共 24 点）</div>
            <span className="text-sm text-muted">已录入 <b style={{ color: 'var(--navy-700)' }}>{points.length}</b>/24 点</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <DeviationCurveChart points={points} title="实时预览 - 自差闭合曲线" />
          </div>
          <div style={{ padding: '0 20px 20px', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {HEADINGS.map(h => (
                    <th key={h} style={{ textAlign: 'center' }}>{h}°</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {HEADINGS.map(h => (
                    <td key={h} style={{ padding: '8px 6px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', gap: '3px', flexDirection: 'column' }}>
                        <input
                          type="number" step="0.1" min="0" max="50"
                          style={{ width: '100%', padding: '4px 5px', fontSize: '12px', border: '1px solid var(--gray-300)', borderRadius: '4px' }}
                          placeholder="值"
                          name={`dev_${h}`}
                          value={devs[h] || ''}
                          onChange={e => setDevs({ ...devs, [h]: e.target.value })}
                        />
                        <select
                          style={{ width: '100%', padding: '3px', fontSize: '11px', border: '1px solid var(--gray-300)', borderRadius: '4px' }}
                          name={`dir_${h}`}
                          value={dirs[h] || ''}
                          onChange={e => setDirs({ ...dirs, [h]: (e.target.value as 'E' | 'W') })}
                        >
                          <option value="">方向</option>
                          <option value="E">东 E</option>
                          <option value="W">西 W</option>
                        </select>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
