import type { RequestHandler } from '@builder.io/qwik-city';
import { component$ } from '@builder.io/qwik';
import { getFullBatch } from '~/lib/db';

export const onGet: RequestHandler = async (requestEvent: any) => {
  const url = new URL(requestEvent.request.url);
  const id = url.searchParams.get('id');
  const format = (url.searchParams.get('format') || 'json') as 'json' | 'csv';
  if (!id) {
    throw requestEvent.error(400, 'missing id');
  }
  const batch = getFullBatch(id);
  if (!batch) {
    throw requestEvent.error(404, 'not found');
  }
  const main = batch.main;
  const filename = `${main.batchNo}_v${main.version}.${format}`;
  const setHeader = (k: string, v: string) => {
    try { (requestEvent.responseHeaders || requestEvent.response?.headers || {}).set(k, v); } catch {}
  };

  if (format === 'csv') {
    const esc = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const rows: string[] = [];
    const hdrs = ['批次号', '版本', '状态', '药液A(g)', '药液B(g)', '药液C(g)', '总容量(ml)',
      '纸张', '克重(gsm)', '评分', '评估人', '创建时间', '更新时间', '归档', '回滚自'];
    rows.push(hdrs.map(esc).join(','));
    rows.push([
      main.batchNo, main.version, main.status,
      main.solutionARatio, main.solutionBRatio, main.solutionC_Ratio ?? '', main.totalVolumeMl,
      main.paperType, main.paperWeightGsm, batch.result?.overallScore ?? '', batch.result?.evaluator ?? '',
      new Date(main.createdAt).toISOString(), new Date(main.updatedAt).toISOString(),
      main.isArchived ? main.archiveReason : '', main.rollbackFromId ?? ''
    ].map(esc).join(','));
    const csv = '\uFEFF' + rows.join('\n');
    setHeader('Content-Type', 'text/csv; charset=utf-8');
    setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    try { requestEvent.send(200, csv); } catch { return csv as any; }
    return csv as any;
  }

  const json = JSON.stringify(batch, null, 2);
  setHeader('Content-Type', 'application/json; charset=utf-8');
  setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  try { requestEvent.send(200, json); } catch { return json as any; }
  return json as any;
};

export default component$(() => null);
