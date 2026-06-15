import { NextResponse } from 'next/server';
import {
  loadDB, mutate, findAll, findById, insertRow, updateRow, deleteRow, nextId, nowISO,
} from '@/lib/json-db';
import type { MainRecord, AnnealingRecord, PatternProgress, ResultRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

type LedgerListItem = MainRecord & {
  annealing_count: number;
  total_duration: number;
  progress_avg: number;
  acceptance: string | null;
};

export async function GET() {
  const db = loadDB();
  const list: LedgerListItem[] = db.main_records.map((m) => {
    const ann = db.annealing_records.filter((a) => a.main_record_id === m.id);
    const prog = db.pattern_progress.filter((p) => p.main_record_id === m.id);
    const res = db.result_records.find((r) => r.main_record_id === m.id);
    const total_duration = prog.reduce((s, p) => s + (p.duration_minutes || 0), 0);
    const progress_avg = prog.length ? Math.round(prog.reduce((s, p) => s + p.progress_pct, 0) / prog.length) : 0;
    return {
      ...m, annealing_count: ann.length, total_duration, progress_avg,
      acceptance: res?.acceptance ?? null,
    };
  }).sort((a, b) => (b.id - a.id));
  return NextResponse.json({ list });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await mutate<{ id: number; work_no: string }>((db) => {
      const seq = nextId(db, 'main_records');
      const work_no = body.work_no || `AG-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`;

      const main = insertRow<MainRecord>(db, 'main_records', {
        work_no,
        work_name: body.work_name || '未命名作品',
        silversmith: body.silversmith || '',
        chisel_set: body.chisel_set || null,
        main_chisels: body.main_chisels ? JSON.stringify(body.main_chisels) : null,
        material: body.material || 'S990 足银',
        material_weight: Number(body.material_weight) || 0,
        start_date: body.start_date || new Date().toISOString().slice(0, 10),
        version: 1,
        status: body.status || '进行中',
        notes: body.notes || null,
      } as any);

      (body.annealing_records || []).forEach((a: any, idx: number) => {
        insertRow<AnnealingRecord>(db, 'annealing_records', {
          main_record_id: main.id, seq_no: idx + 1,
          annealing_time: a.annealing_time || nowISO(),
          temperature: Number(a.temperature) || 650,
          duration: Number(a.duration) || 40,
          cooling_method: a.cooling_method || '水淬',
          hardness_before: a.hardness_before ?? null,
          hardness_after: a.hardness_after ?? null,
          operator: a.operator || null, notes: a.notes || null,
        } as any);
      });

      (body.pattern_progress || []).forEach((p: any) => {
        insertRow<PatternProgress>(db, 'pattern_progress', {
          main_record_id: main.id,
          pattern_stage: p.pattern_stage || '',
          pattern_name: p.pattern_name || '',
          progress_pct: Number(p.progress_pct) || 0,
          start_time: p.start_time || null, end_time: p.end_time || null,
          duration_minutes: Number(p.duration_minutes) || 0,
          chisels_used: p.chisels_used ? JSON.stringify(p.chisels_used) : null,
          issues: p.issues || null, snapshot_image: p.snapshot_image || null,
        } as any);
      });

      insertRow<ResultRecord>(db, 'result_records', {
        main_record_id: main.id,
        surface_defects: body.surface_defects ? JSON.stringify(body.surface_defects) : null,
        defect_severity: body.defect_severity || null,
        rework_count: Number(body.rework_count) || 0,
        final_weight: body.final_weight ?? null,
        delivery_requirements: body.delivery_requirements ? JSON.stringify(body.delivery_requirements) : null,
        packaging: body.packaging || null, delivery_date: body.delivery_date || null,
        inspector: body.inspector || null, acceptance: body.acceptance || null,
        acceptance_notes: body.acceptance_notes || null,
      } as any);

      return { id: main.id, work_no: main.work_no };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
