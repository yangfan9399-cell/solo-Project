import { NextResponse } from 'next/server';
import { loadDB, mutate, insertRow, nowISO, updateRow, findById } from '@/lib/json-db';
import type { PhotoAnnotation, ChangeLog } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const db = loadDB();
  const list = db.photo_annotations
    .filter((a) => a.main_record_id === id)
    .sort((a, b) => a.id - b.id);
  return NextResponse.json({ list });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const main_record_id = Number(idStr);
  try {
    const body = await req.json();
    const result = await mutate<{ id: number }>((db) => {
      const anno = insertRow<PhotoAnnotation>(db, 'photo_annotations', {
        main_record_id,
        pattern_progress_id: body.pattern_progress_id || null,
        photo_url: body.photo_url || `anno-${Date.now()}.jpg`,
        annotation_type: body.annotation_type || '正常',
        annotation_text: body.annotation_text || null,
        annotator: body.annotator || null,
        annotation_time: body.annotation_time || nowISO(),
        resolved: body.resolved ? 1 : 0,
        resolved_note: body.resolved_note || null,
      } as any);

      if (body.annotation_type === '异常' && body.related_progress_id) {
        const progId = Number(body.related_progress_id);
        const prog = findById<any>(db, 'pattern_progress', progId);
        if (prog) {
          const before = { progress_pct: prog.progress_pct, issues: prog.issues };
          updateRow<any>(db, 'pattern_progress', progId, {
            progress_pct: Math.min(prog.progress_pct, 60),
            issues: (prog.issues ? prog.issues + '；' : '') + (body.annotation_text?.substring(0, 80) || '批注异常'),
          });
          const after = findById<any>(db, 'pattern_progress', progId)!;
          insertRow<ChangeLog>(db, 'change_logs', {
            main_record_id, table_name: 'pattern_progress', record_id: progId,
            change_type: '异常标记',
            change_reason: `照片批注触发：${(body.annotation_text || '').substring(0, 60)}`,
            before_data: JSON.stringify(before),
            after_data: JSON.stringify({ progress_pct: after.progress_pct, issues: after.issues }),
            operator: body.annotator || '系统-自动',
          } as any);

          const main = findById<any>(db, 'main_records', main_record_id);
          if (main && main.status === '进行中') {
            insertRow<ChangeLog>(db, 'change_logs', {
              main_record_id, table_name: 'main_records', record_id: main_record_id,
              change_type: '状态变更',
              change_reason: '照片批注触发异常流程',
              before_data: JSON.stringify({ status: main.status }),
              after_data: JSON.stringify({ status: '异常处理中' }),
              operator: '系统-自动',
            } as any);
            updateRow<any>(db, 'main_records', main_record_id, { status: '异常处理中' });
          }
        }
      }

      return { id: anno.id };
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await params;
  try {
    const body = await req.json();
    const result = await mutate<{ ok: boolean }>((db) => {
      const aid = Number(body.annotation_id);
      const patch: any = {};
      if ('resolved' in body) patch.resolved = body.resolved ? 1 : 0;
      if ('resolved_note' in body) patch.resolved_note = body.resolved_note;
      if ('annotation_text' in body) patch.annotation_text = body.annotation_text;
      if ('annotation_type' in body) patch.annotation_type = body.annotation_type;
      updateRow<PhotoAnnotation>(db, 'photo_annotations', aid, patch);
      return { ok: true };
    });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
