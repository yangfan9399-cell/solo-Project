import { NextResponse } from 'next/server';
import { loadDB, mutate, insertRow, updateRow, deleteRow, findById } from '@/lib/json-db';
import type { ToolInventory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = loadDB();
  const list = db.tool_inventory.sort((a, b) => a.tool_code.localeCompare(b.tool_code));
  const summary = {
    total: list.length,
    in_use: list.filter((t) => t.status === '在用').length,
    to_repair: list.filter((t) => t.status === '待修').length,
    scrapped: list.filter((t) => t.status === '报废').length,
    lent: list.filter((t) => t.status === '借出').length,
    maintenance_due: list.filter((t) => t.usage_count >= t.maintenance_cycle && t.status === '在用').length,
  };
  return NextResponse.json({ list, summary });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await mutate<{ id: number }>((db) => {
      const t = insertRow<ToolInventory>(db, 'tool_inventory', {
        tool_code: body.tool_code || `T-${Date.now()}`,
        tool_name: body.tool_name || '',
        tool_type: body.tool_type || '錾子',
        spec: body.spec || null,
        status: body.status || '在用',
        usage_count: Number(body.usage_count) || 0,
        last_maintenance: body.last_maintenance || null,
        maintenance_cycle: Number(body.maintenance_cycle) || 50,
        manufacturer: body.manufacturer || null,
        version: body.version || 'v1',
        notes: body.notes || null,
      } as any);
      return { id: t.id };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
