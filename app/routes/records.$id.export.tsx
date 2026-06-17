import type { LoaderFunction, MetaFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useSubmit } from "@remix-run/react";
import { useState } from "react";
import AppShell from "~/components/AppShell";
import { buildLedgerSummary, generateSummaryReport, generateCsvExport } from "~/services/report-generator";
import { getRecordWithPoints, getCorrectionTable } from "~/db/repositories/records";
import { getShipById } from "~/db/repositories/ships";
import { detectAnomalies } from "~/services/anomaly-detector";
import type { DeviationRecordWithPoints, CorrectionTableEntry, Ship, AnomalyReport } from "~/types";

interface LoaderData {
  summary: Awaited<ReturnType<typeof buildLedgerSummary>>;
  ship: Ship;
  record: DeviationRecordWithPoints;
  corrections: CorrectionTableEntry[];
  anomalies: AnomalyReport[];
  reportHtml: string;
}

export const meta: MetaFunction = () => [{ title: "导出报告与打印模板" }];

export const action: ActionFunction = async ({ request, params }) => {
  const id = Number(params.id);
  const fd = await request.formData();
  const type = fd.get('type') as string;
  const record = (await getRecordWithPoints(id))!;
  const ship = (await getShipById(record.ship_id))!;
  const corrections = await getCorrectionTable(id);
  const anomalies = detectAnomalies(id, record.points);

  if (type === 'csv') {
    const csv = generateCsvExport(ship, record, record.points, corrections);
    return new Response('\uFEFF' + csv, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="deviation-${record.batch_code}.csv"` }
    });
  }
  const html = generateSummaryReport(ship, record, record.points, corrections, anomalies.map(a => a.message));
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="compass-report-${record.batch_code}.html"` }
  });
};

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);
  const record = (await getRecordWithPoints(id))!;
  const ship = (await getShipById(record.ship_id))!;
  const corrections = await getCorrectionTable(id);
  const anomalies = detectAnomalies(id, record.points);
  const reportHtml = generateSummaryReport(ship, record, record.points, corrections, anomalies.map(a => a.message));
  return json({
    summary: await buildLedgerSummary(),
    ship, record, corrections, anomalies, reportHtml
  } satisfies LoaderData);
};

export default function ExportPage() {
  const data = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const [showPreview, setShowPreview] = useState(false);
  const download = (type: string) => {
    const fd = new FormData();
    fd.set('type', type);
    submit(fd, { method: 'post' });
  };
  return (
    <AppShell summary={data.summary} currentPageTitle={`导出中心 · ${data.ship.name}`} currentPageSubtitle={`批次 ${data.record.batch_code} - 多种格式导出 / 打印模板预览`}>
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">📦 选择导出格式</div>
          <Link to={`/records/${data.record.id}`} className="btn btn-outline">← 返回详情</Link>
        </div>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '20px', background: '#fafbff' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>正式报告 (HTML)</div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-500)', marginBottom: '14px', minHeight: '36px' }}>A4 页面排版的完整校正报告，含签章区，可直接打印或转存为 PDF</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-primary" onClick={() => setShowPreview(!showPreview)}>👁️ 预览</button>
              <button className="btn btn-sm btn-gold" onClick={() => download('html')}>📥 下载</button>
            </div>
          </div>
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '20px', background: '#fafff7' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>数据表 (CSV)</div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-500)', marginBottom: '14px', minHeight: '36px' }}>Excel / WPS 可直接打开，用于二次分析与归档</div>
            <button className="btn btn-sm btn-primary" onClick={() => download('csv')}>📥 下载 CSV</button>
          </div>
          <div style={{ border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '20px', background: '#fffbf2' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🖨️</div>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>直接打印</div>
            <div style={{ fontSize: '12.5px', color: 'var(--gray-500)', marginBottom: '14px', minHeight: '36px' }}>调用浏览器打印，可选"另存为 PDF"输出电子版</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm btn-primary" onClick={() => window.print()}>🖨️ 立即打印</button>
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="card mb-4">
          <div className="card-header">
            <div className="card-title">👁️ 正式报告预览 (A4 版面)</div>
            <button className="btn btn-sm btn-outline" onClick={() => setShowPreview(false)}>✕ 关闭预览</button>
          </div>
          <div style={{ background: '#e5e7eb', padding: '24px' }}>
            <div style={{
              maxWidth: '210mm',
              minHeight: '297mm',
              background: '#fff',
              margin: '0 auto',
              padding: '20mm',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
              dangerouslySetInnerHTML={{ __html: data.reportHtml.replace(/<\/?(html|head|body|meta|title|style)[^>]*>/g, '').replace(/@page[^}]*\}/g, '') }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title">📋 导出内容摘要</div></div>
        <div style={{ padding: '20px' }}>
          <div className="grid-2">
            <div>
              <div className="section-title">船舶与作业信息</div>
              <div className="info-row"><div className="info-label">船名</div><div className="info-value" style={{ fontWeight: 700 }}>⚓ {data.ship.name}</div></div>
              <div className="info-row"><div className="info-label">IMO编号</div><div className="info-value">{data.ship.imo_number || '—'}</div></div>
              <div className="info-row"><div className="info-label">批次号</div><div className="info-value" style={{ fontFamily: 'monospace' }}>{data.record.batch_code}</div></div>
              <div className="info-row"><div className="info-label">校正日期</div><div className="info-value">{data.record.record_date}</div></div>
              <div className="info-row"><div className="info-label">校正地点</div><div className="info-value">{data.record.location || '—'}</div></div>
            </div>
            <div>
              <div className="section-title">数据统计</div>
              <div className="info-row"><div className="info-label">测点数量</div><div className="info-value">{data.record.points.length} 个</div></div>
              <div className="info-row"><div className="info-label">校正表条目</div><div className="info-value">{data.corrections.length} 条</div></div>
              <div className="info-row"><div className="info-label">最大自差</div><div className="info-value">{Math.max(...data.record.points.map(p => p.deviation)).toFixed(1)}°</div></div>
              <div className="info-row"><div className="info-label">异常提示</div><div className="info-value">{data.anomalies.length} 项</div></div>
              <div className="info-row"><div className="info-label">版本号</div><div className="info-value">V{data.record.version}</div></div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
