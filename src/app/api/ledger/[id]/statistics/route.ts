import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/json-db';
import type { PatternProgress, AnnealingRecord, ResultRecord, MainRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const db = loadDB();
  const main = db.main_records.find((m) => m.id === id) as MainRecord | undefined;
  if (!main) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const progress = db.pattern_progress.filter((p) => p.main_record_id === id) as PatternProgress[];
  const annealings = db.annealing_records.filter((a) => a.main_record_id === id) as AnnealingRecord[];
  const result = db.result_records.find((r) => r.main_record_id === id) as ResultRecord | undefined;
  const logs = db.change_logs.filter((c) => c.main_record_id === id);

  const stages = progress.map((p) => ({
    id: p.id,
    stage: p.pattern_stage,
    name: p.pattern_name,
    progress_pct: p.progress_pct,
    duration_minutes: p.duration_minutes,
    duration_hours: +(p.duration_minutes / 60).toFixed(1),
    start_time: p.start_time,
    end_time: p.end_time,
    issues: p.issues,
  }));

  const rollbackStages = stages.filter((s) => s.stage.includes('回滚'));
  const validStages = stages.filter((s) => !s.stage.includes('回滚'));

  const totalWorkMin = progress.reduce((s, p) => s + (p.duration_minutes || 0), 0);
  const validWorkMin = validStages.reduce((s, p) => s + (p.duration_minutes || 0), 0);
  const rollbackWorkMin = rollbackStages.reduce((s, p) => s + (p.duration_minutes || 0), 0);

  const avgProgress = progress.length
    ? Math.round(progress.reduce((s, p) => s + p.progress_pct, 0) / progress.length)
    : 0;

  const annealingStats = annealings.map((a) => ({
    seq_no: a.seq_no,
    time: a.annealing_time,
    temperature: a.temperature,
    duration: a.duration,
    cooling: a.cooling_method,
    delta_hardness: (a.hardness_before != null && a.hardness_after != null)
      ? a.hardness_before - a.hardness_after : null,
  }));

  const totalDays = (() => {
    const start = new Date(main.start_date);
    const lastTs = [
      ...progress.map((p) => p.end_time || p.start_time).filter(Boolean) as string[],
      ...annealings.map((a) => a.annealing_time),
      result?.delivery_date || '',
    ].filter(Boolean).sort().pop();
    if (!lastTs) return 1;
    const end = new Date(lastTs.substring(0, 10));
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  })();

  return NextResponse.json({
    main: {
      work_no: main.work_no, work_name: main.work_name,
      silversmith: main.silversmith, version: main.version, status: main.status,
      start_date: main.start_date, material: main.material,
      material_weight: main.material_weight,
      final_weight: result?.final_weight ?? null,
      weight_loss_pct: (main.material_weight && result?.final_weight)
        ? +((1 - result.final_weight / main.material_weight) * 100).toFixed(1)
        : null,
    },
    stages,
    stages_timeline: stages.map((s) => ({
      label: `${s.stage}-${s.name}`,
      value: s.progress_pct,
      duration: s.duration_hours,
      has_issue: !!s.issues,
    })),
    summary: {
      annealing_count: annealings.length,
      stage_count: progress.length,
      valid_stage_count: validStages.length,
      rollback_count: rollbackStages.length,
      total_minutes: totalWorkMin,
      total_hours: +(totalWorkMin / 60).toFixed(1),
      valid_hours: +(validWorkMin / 60).toFixed(1),
      rollback_hours: +(rollbackWorkMin / 60).toFixed(1),
      rework_count: result?.rework_count ?? 0,
      avg_progress: avgProgress,
      calendar_days: totalDays,
      change_log_count: logs.length,
      defect_severity: result?.defect_severity || '无',
      acceptance: result?.acceptance || '未验收',
    },
    annealing: annealingStats,
    distribution: {
      by_stage: validStages.length ? validStages.map((s) => ({
        stage: s.stage, minutes: s.duration_minutes,
        pct: validWorkMin ? Math.round((s.duration_minutes / validWorkMin) * 100) : 0,
      })) : [],
      work_type: [
        { label: '有效工时', minutes: validWorkMin, color: '#10b981' },
        { label: '回滚返工', minutes: rollbackWorkMin, color: '#ef4444' },
      ],
    },
  });
}
