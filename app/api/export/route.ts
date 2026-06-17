import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  getProject, listVersions, listLayers, listControlPointsByVersion,
  listRepairs, getLatestStat,
} from '@/lib/db';
import { formatDateTime, pxToMm } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pid = Number(url.searchParams.get('project_id'));
  const fmt = url.searchParams.get('format') || 'xlsx';
  if (!pid) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const project = getProject(pid);
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const versions = listVersions(pid);
  const latestV = versions[0] || null;
  const layers = latestV ? listLayers(latestV.id) : [];
  const points = latestV ? listControlPointsByVersion(latestV.id) : [];
  const repairs = listRepairs(pid);
  const stats = latestV ? getLatestStat(pid, latestV.id) : null;

  if (fmt === 'json') {
    return NextResponse.json({ project, versions, latest_version: latestV, layers, control_points: points, repairs, stats }, {
      headers: { 'Content-Disposition': `attachment; filename="${project.code}-summary.json"` },
    });
  }

  const meta = [
    ['木版年画套色错位分析 - 项目摘要'],
    ['项目编号', project.code],
    ['作品名称', project.name],
    ['产地 / 朝代', `${project.origin} / ${project.dynasty}`],
    ['画师 / 作者', project.artist],
    ['项目状态', ({ draft: '草稿', in_progress: '修版中', review: '待审核', completed: '已归档' } as Record<string, string>)[project.status]],
    ['版本数', project.total_versions],
    ['平均偏移 (px)', Number(project.avg_offset_px.toFixed(3))],
    ['最大偏移 (px)', Number(project.max_offset_px.toFixed(3))],
    ['平均偏移 (mm@600dpi)', pxToMm(project.avg_offset_px, 600)],
    ['异常等级', ({ none: '正常', minor: '轻微', moderate: '中等', severe: '严重' } as Record<string, string>)[project.anomaly_level]],
    ['异常说明', project.anomaly_notes || ''],
    ['项目描述', project.description],
    ['创建时间', formatDateTime(project.created_at)],
    ['最近更新', formatDateTime(project.updated_at)],
    [],
  ];

  const statArr = stats ? [
    ['偏移统计 (版本 ' + (latestV?.version_no || '') + ')'],
    ['图层数', stats.layer_count],
    ['控制点总数', stats.point_count],
    ['平均ΔX (px)', stats.avg_delta_x],
    ['平均ΔY (px)', stats.avg_delta_y],
    ['平均距离 (px)', stats.avg_distance],
    ['最大距离 (px)', stats.max_distance],
    ['最小距离 (px)', stats.min_distance],
    ['标准差 (px)', stats.std_distance],
    ['达标点数 (≤1.5px)', stats.aligned_count],
    ['超标点数', stats.misaligned_count],
    ['达标率', stats.point_count ? `${Math.round(stats.aligned_count / stats.point_count * 100)}%` : '-'],
    [],
  ] : [];

  const verHeader = ['版本', '批次号', '扫描时间', '扫描设备', '分辨率(DPI)', '备注'];
  const verRows = versions.map(v => [v.version_no, v.batch_no || '', formatDateTime(v.scanned_at), v.scanner || '', v.resolution_dpi, v.notes || '']);
  const versionsArr = [['版本 / 批次历史'], verHeader, ...verRows, []];

  const layerHeader = ['色版序', '色版名称', '色名', '颜色', '偏移X(px)', '偏移Y(px)', '旋转(°)', '透明度', '对齐状态'];
  const layerRows = layers.map(l => [l.order_index, l.layer_name, l.color_name, l.color_code, l.offset_x, l.offset_y, l.rotation, l.opacity, l.is_aligned ? '已对齐' : '未对齐']);
  const layersArr = [['色版 / 图层配置 (最新版本)'], layerHeader, ...layerRows, []];

  const pointHeader = ['色版名称', '控制点标签', '参考X', '参考Y', '实测X', '实测Y', 'ΔX', 'ΔY', '距离(px)', '判定'];
  const layerIdMap = new Map(layers.map(l => [l.id, l.layer_name]));
  const pointRows = points.map(p => [
    layerIdMap.get(p.layer_id) || '',
    p.label,
    p.ref_x, p.ref_y,
    p.cur_x, p.cur_y,
    p.delta_x, p.delta_y,
    p.distance,
    p.distance <= 1.5 ? '达标' : (p.distance <= 3 ? '预警' : '超限'),
  ]);
  const pointsArr = [['控制点明细 (最新版本)'], pointHeader, ...pointRows, []];

  const repairHeader = ['时间', '版本', '类型', '操作色版', '描述', '操作人', '修前偏移(px)', '修后偏移(px)'];
  const vNoMap = new Map(versions.map(v => [v.id, v.version_no]));
  const repairRows = repairs.map(r => [
    formatDateTime(r.created_at),
    vNoMap.get(r.version_id) || '',
    ({ align: '对位调整', retrim: '修版', reprint: '重印', note: '备注', block_repair: '版材修复' } as Record<string, string>)[r.action_type],
    layerIdMap.get(r.layer_id || 0) || '(整体)',
    r.description,
    r.operator,
    r.before_offset,
    r.after_offset,
  ]);
  const repairsArr = [['修版记录'], repairHeader, ...repairRows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...meta, ...statArr, ...versionsArr, ...layersArr, ...pointsArr, ...repairsArr]);
  ws['!cols'] = [
    { wch: 20 }, { wch: 50 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, '项目摘要');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as ArrayBuffer;
  const safeName = `${project.code}-taose-analysis.xlsx`;
  const utfName = encodeURIComponent(`${project.code}-套色分析摘要.xlsx`);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${utfName}`,
    },
  });
}
