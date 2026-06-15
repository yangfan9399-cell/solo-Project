import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/json-db';

export const dynamic = 'force-dynamic';

function diffObjects(a: any, b: any, prefix = ''): Array<{ key: string; before: any; after: any; type: 'add' | 'remove' | 'change' }> {
  const keys = Array.from(new Set([...Object.keys(a || {}), ...Object.keys(b || {})]));
  const result: any[] = [];
  for (const k of keys) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    const va = a?.[k];
    const vb = b?.[k];
    const sa = typeof va === 'object' ? JSON.stringify(va) : String(va ?? '');
    const sb = typeof vb === 'object' ? JSON.stringify(vb) : String(vb ?? '');
    if (sa === sb) continue;
    if (va === undefined && vb !== undefined) {
      result.push({ key: fullKey, before: null, after: vb, type: 'add' });
    } else if (vb === undefined && va !== undefined) {
      result.push({ key: fullKey, before: va, after: null, type: 'remove' });
    } else if (typeof va === 'object' && typeof vb === 'object' && va !== null && vb !== null && !Array.isArray(va) && !Array.isArray(vb)) {
      result.push(...diffObjects(va, vb, fullKey));
    } else {
      result.push({ key: fullKey, before: va, after: vb, type: 'change' });
    }
  }
  return result;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const mainId = Number(idStr);
  const db = loadDB();
  const orders = db.delivery_orders
    .filter((d) => d.main_record_id === mainId)
    .sort((a, b) => a.version - b.version);

  if (orders.length < 1) {
    return NextResponse.json({ diffs: [], versions: [], latest: null, earliest: null });
  }

  const versions = orders.map((o) => ({
    id: o.id, version: o.version, order_no: o.order_no,
    issued_at: o.issued_at, issued_by: o.issued_by, signoff: !!o.signoff,
    recipient: o.recipient,
  }));

  const diffs = [];
  for (let i = 1; i < orders.length; i++) {
    const prev = JSON.parse(orders[i - 1].content_snapshot);
    const cur = JSON.parse(orders[i].content_snapshot);
    diffs.push({
      from_version: orders[i - 1].version,
      to_version: orders[i].version,
      from_order_no: orders[i - 1].order_no,
      to_order_no: orders[i].order_no,
      from_issued_at: orders[i - 1].issued_at,
      to_issued_at: orders[i].issued_at,
      changes: diffObjects(prev, cur),
      snapshots: { before: prev, after: cur },
    });
  }

  const main = db.main_records.find((m) => m.id === mainId);
  const logs = db.change_logs.filter((c) => c.main_record_id === mainId).sort((a, b) => b.id - a.id);

  return NextResponse.json({
    versions,
    diffs,
    main: main ? { work_no: main.work_no, work_name: main.work_name, status: main.status, version: main.version } : null,
    change_logs: logs.map((l) => ({
      id: l.id, table: l.table_name, record_id: l.record_id,
      type: l.change_type, reason: l.change_reason, operator: l.operator,
      created_at: l.created_at,
      before: l.before_data ? JSON.parse(l.before_data) : null,
      after: l.after_data ? JSON.parse(l.after_data) : null,
    })),
  });
}
