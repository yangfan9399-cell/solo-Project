import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/json-db';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const db = loadDB();
  const main = db.main_records.find((m) => m.id === id);
  if (!main) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const ann = db.annealing_records.filter((a) => a.main_record_id === id).sort((a, b) => a.seq_no - b.seq_no);
  const prog = db.pattern_progress.filter((p) => p.main_record_id === id).sort((a, b) => a.id - b.id);
  const res = db.result_records.find((r) => r.main_record_id === id);
  const annos = db.photo_annotations.filter((a) => a.main_record_id === id);
  const latestDO = db.delivery_orders.filter((d) => d.main_record_id === id).sort((a, b) => b.version - a.version)[0];

  const totalMinutes = prog.reduce((s, p) => s + (p.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const content = `
手工银饰錾刻工序台账 - 导出档案
═══════════════════════════════════════
作品编号：${main.work_no}
作品名称：${main.work_name}
银匠师傅：${main.silversmith}
材料：${main.material} / ${main.material_weight}g
成品重量：${res?.final_weight ?? '未称量'}g
版本：v${main.version}
状态：${main.status}
开工日期：${main.start_date}
工时统计：${totalHours}小时 / ${prog.length}道工序 / ${ann.length}次退火
验收：${res?.acceptance ?? '未验收'}
═══════════════════════════════════════

【一、錾子与工具库】
套装：${main.chisel_set || '未指定'}
主錾：${main.main_chisels || '未记录'}

【二、退火明细（明细记录）】
${ann.map((a, i) => `第${a.seq_no}次 | ${a.annealing_time} | ${a.temperature}℃ / ${a.duration}s | ${a.cooling_method} | 硬度${a.hardness_before}→${a.hardness_after} | ${a.notes || ''}`).join('\n')}

【三、纹样进度（历史记录）】
${prog.map((p, i) => `#${i + 1} ${p.pattern_stage}：${p.pattern_name} | 进度${p.progress_pct}% | 耗时${p.duration_minutes}分钟 | ${p.issues ? '⚠️' : ''} ${p.issues || ''}`).join('\n')}

【四、结果记录（表面缺陷 & 交付要求）】
缺陷等级：${res?.defect_severity ?? '无'}
返工次数：${res?.rework_count ?? 0}
表面缺陷：${res?.surface_defects ?? '无'}
交付要求：${res?.delivery_requirements ?? '未指定'}
包装：${res?.packaging ?? '未指定'}
交付日期：${res?.delivery_date ?? '未安排'}
验收人：${res?.inspector ?? '未检验'}
验收意见：${res?.acceptance_notes ?? ''}

【五、照片批注】
${annos.length === 0 ? '无' : annos.map((a) => `[${a.annotation_type}] ${a.photo_url} @ ${a.annotation_time || a.created_at} - ${a.annotator || '未知'} | ${a.resolved ? '已处理' : '待处理'}\n  ${a.annotation_text?.substring(0, 120) || ''}`).join('\n')}

【六、最新交付单】
${latestDO ? `单号：${latestDO.order_no} (v${latestDO.version})\n开具：${latestDO.issued_at} by ${latestDO.issued_by}\n接收：${latestDO.recipient ?? '未指定'}\n签收：${latestDO.signoff ? '已签收' : '未签收'}` : '暂无'}

═══════════════════════════════════════
导出时间：${new Date().toISOString()}
`;

  const headers = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `attachment; filename="${main.work_no}-工序台账.txt"`,
  };
  return new NextResponse(content, { headers });
}
