import { NextResponse } from 'next/server';
import { loadDB, mutate, insertRow, nextId, nowISO } from '@/lib/json-db';
import type { DeliveryOrder } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const db = loadDB();
  const list = db.delivery_orders
    .filter((d) => d.main_record_id === id)
    .sort((a, b) => a.version - b.version)
    .map((d) => ({ ...d, content: JSON.parse(d.content_snapshot) }));
  return NextResponse.json({ list });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const main_record_id = Number(idStr);
  try {
    const body = await req.json();
    const result = await mutate<{ id: number; order_no: string }>((db) => {
      const main = db.main_records.find((m) => m.id === main_record_id);
      if (!main) throw new Error('主记录不存在');

      const latest = db.delivery_orders
        .filter((d) => d.main_record_id === main_record_id)
        .sort((a, b) => b.version - a.version)[0];
      const version = latest ? latest.version + 1 : 1;
      const seq = nextId(db, 'delivery_orders');
      const order_no = body.order_no || `DO-${Date.now()}-V${version}`;

      const snapshot = body.content_snapshot || JSON.stringify({
        work_no: main.work_no, work_name: main.work_name,
        silversmith: main.silversmith, material: main.material,
        version: `v${main.version}`, generated_at: nowISO(),
      });

      const order = insertRow<DeliveryOrder>(db, 'delivery_orders', {
        main_record_id, order_no, version,
        previous_version_id: latest ? latest.id : null,
        content_snapshot: typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot),
        issued_by: body.issued_by || main.silversmith,
        recipient: body.recipient || null,
        signoff: 0,
      } as any);
      (order as any).issued_at = nowISO();

      return { id: order.id, order_no };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
