import { NextResponse } from 'next/server';
import {
  loadDB, mutate, findById, updateRow, deleteRow, insertRow, nextId, nowISO,
} from '@/lib/json-db';
import type {
  MainRecord, AnnealingRecord, PatternProgress, ResultRecord,
  PhotoAnnotation, DeliveryOrder, ChangeLog, ToolInventory,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

interface FullRecord extends MainRecord {
  annealing_records: AnnealingRecord[];
  pattern_progress: PatternProgress[];
  result_record: ResultRecord | null;
  photo_annotations: PhotoAnnotation[];
  delivery_orders: DeliveryOrder[];
  change_logs: ChangeLog[];
  tools_used: ToolInventory[];
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const db = loadDB();

  const main = findById<MainRecord>(db, 'main_records', id);
  if (!main) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const ann = db.annealing_records.filter((a) => a.main_record_id === id).sort((a, b) => a.seq_no - b.seq_no);
  const prog = db.pattern_progress.filter((p) => p.main_record_id === id).sort((a, b) => a.id - b.id);
  const res = db.result_records.find((r) => r.main_record_id === id) || null;
  const annos = db.photo_annotations.filter((a) => a.main_record_id === id).sort((a, b) => a.id - b.id);
  const dos = db.delivery_orders.filter((d) => d.main_record_id === id).sort((a, b) => a.version - b.version);
  const logs = db.change_logs.filter((c) => c.main_record_id === id).sort((a, b) => b.id - a.id);

  const toolCodes: string[] = [];
  try {
    if (main.main_chisels) {
      JSON.parse(main.main_chisels).forEach((c: string) => toolCodes.push(c));
    }
  } catch {}
  prog.forEach((p) => {
    try {
      if (p.chisels_used) JSON.parse(p.chisels_used).forEach((c: string) => toolCodes.push(c));
    } catch {}
  });
  const uniqueCodes = Array.from(new Set(toolCodes));
  const tools = db.tool_inventory.filter((t) => uniqueCodes.includes(t.tool_code));

  const full: FullRecord = {
    ...main, annealing_records: ann, pattern_progress: prog,
    result_record: res, photo_annotations: annos,
    delivery_orders: dos, change_logs: logs, tools_used: tools,
  };
  return NextResponse.json(full);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  try {
    const body = await req.json();
    const result = await mutate<{ id: number }>((db) => {
      const main = findById<MainRecord>(db, 'main_records', id);
      if (!main) throw new Error('not found');

      const patch: any = {};
      for (const k of ['work_name', 'silversmith', 'chisel_set', 'material', 'start_date', 'status', 'notes']) {
        if (k in body) patch[k] = body[k];
      }
      if ('main_chisels' in body) patch.main_chisels = body.main_chisels ? JSON.stringify(body.main_chisels) : null;
      if ('material_weight' in body) patch.material_weight = Number(body.material_weight);
      if ('version' in body) patch.version = Number(body.version);
      if (Object.keys(patch).length) updateRow<MainRecord>(db, 'main_records', id, patch);

      if (body.annealing_records && Array.isArray(body.annealing_records)) {
        db.annealing_records = db.annealing_records.filter((a) => a.main_record_id !== id);
        body.annealing_records.forEach((a: any, idx: number) => {
          insertRow<AnnealingRecord>(db, 'annealing_records', {
            main_record_id: id, seq_no: idx + 1,
            annealing_time: a.annealing_time || nowISO(),
            temperature: Number(a.temperature) || 650,
            duration: Number(a.duration) || 40,
            cooling_method: a.cooling_method || '水淬',
            hardness_before: a.hardness_before ?? null,
            hardness_after: a.hardness_after ?? null,
            operator: a.operator || null, notes: a.notes || null,
          } as any);
        });
      }

      if (body.pattern_progress && Array.isArray(body.pattern_progress)) {
        db.pattern_progress = db.pattern_progress.filter((p) => p.main_record_id !== id);
        body.pattern_progress.forEach((p: any) => {
          insertRow<PatternProgress>(db, 'pattern_progress', {
            main_record_id: id,
            pattern_stage: p.pattern_stage || '',
            pattern_name: p.pattern_name || '',
            progress_pct: Number(p.progress_pct) || 0,
            start_time: p.start_time || null, end_time: p.end_time || null,
            duration_minutes: Number(p.duration_minutes) || 0,
            chisels_used: p.chisels_used ? JSON.stringify(p.chisels_used) : null,
            issues: p.issues || null, snapshot_image: p.snapshot_image || null,
          } as any);
        });
      }

      const oldRes = db.result_records.find((r) => r.main_record_id === id);
      const resPatch: any = {};
      for (const k of ['defect_severity', 'packaging', 'delivery_date', 'inspector', 'acceptance', 'acceptance_notes']) {
        if (k in body) resPatch[k] = body[k];
      }
      if ('surface_defects' in body) resPatch.surface_defects = body.surface_defects ? JSON.stringify(body.surface_defects) : null;
      if ('rework_count' in body) resPatch.rework_count = Number(body.rework_count);
      if ('final_weight' in body) resPatch.final_weight = body.final_weight != null ? Number(body.final_weight) : null;
      if ('delivery_requirements' in body) resPatch.delivery_requirements = body.delivery_requirements ? JSON.stringify(body.delivery_requirements) : null;

      if (Object.keys(resPatch).length) {
        if (oldRes) {
          updateRow<ResultRecord>(db, 'result_records', oldRes.id, resPatch);
        } else {
          insertRow<ResultRecord>(db, 'result_records', { main_record_id: id, ...resPatch } as any);
        }
      }

      return { id };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  await mutate((db) => {
    deleteRow(db, 'main_records', id);
  });
  return NextResponse.json({ ok: true });
}
