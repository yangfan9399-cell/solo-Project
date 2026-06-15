import { NextResponse } from 'next/server';
import { loadDB, mutate, updateRow, findById, insertRow } from '@/lib/json-db';
import type { ToolInventory, ChangeLog } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  try {
    const body = await req.json();
    const result = await mutate<{ ok: boolean }>((db) => {
      const old = findById<ToolInventory>(db, 'tool_inventory', id);
      const before = old ? { ...old } : null;

      const patch: any = {};
      for (const k of ['tool_code', 'tool_name', 'tool_type', 'spec', 'status',
        'manufacturer', 'version', 'notes', 'last_maintenance']) {
        if (k in body) patch[k] = body[k];
      }
      for (const k of ['usage_count', 'maintenance_cycle']) {
        if (k in body) patch[k] = Number(body[k]);
      }
      updateRow<ToolInventory>(db, 'tool_inventory', id, patch);

      if (body.change_reason && body.main_record_id) {
        insertRowAny<ChangeLog>(db, 'change_logs', {
          main_record_id: Number(body.main_record_id),
          table_name: 'tool_inventory', record_id: id,
          change_type: body.change_type || '修改',
          change_reason: body.change_reason,
          before_data: before ? JSON.stringify({
            status: before.status, usage_count: before.usage_count, version: before.version,
          }) : null,
          after_data: JSON.stringify({
            status: patch.status ?? before?.status,
            usage_count: patch.usage_count ?? before?.usage_count,
            version: patch.version ?? before?.version,
            notes: patch.notes ?? before?.notes,
          }),
          operator: body.operator || '系统',
        } as any);
      }
      return { ok: true };
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

function insertRowAny<T>(db: any, table: string, row: any): T {
  const nextId = (db.sequences[table + ':id'] || 0) + 1;
  db.sequences[table + ':id'] = nextId;
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const newRow = { ...row, id: nextId, created_at: ts };
  (db as any)[table].push(newRow);
  return newRow as T;
}
