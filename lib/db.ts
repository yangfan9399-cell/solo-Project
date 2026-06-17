import fs from 'fs';
import path from 'path';
import type {
  Project,
  ScanVersion,
  ColorLayer,
  ControlPoint,
  RepairRecord,
  OffsetStat,
  ProjectStatus,
  AnomalyLevel,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'woodblock.json');

interface DBSchema {
  projects: Project[];
  versions: ScanVersion[];
  layers: ColorLayer[];
  points: ControlPoint[];
  repairs: RepairRecord[];
  stats: OffsetStat[];
  seq: { projects: number; versions: number; layers: number; points: number; repairs: number; stats: number };
}

let _cache: DBSchema | null = null;
let _lastRead = 0;
let _lock: Promise<void> = Promise.resolve();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function emptyDB(): DBSchema {
  return {
    projects: [],
    versions: [],
    layers: [],
    points: [],
    repairs: [],
    stats: [],
    seq: { projects: 0, versions: 0, layers: 0, points: 0, repairs: 0, stats: 0 },
  };
}

function readDB(): DBSchema {
  ensureDataDir();
  const now = Date.now();
  if (_cache && (now - _lastRead) < 100) return _cache;
  if (!fs.existsSync(DB_PATH)) {
    const seed = buildSeed();
    const s = JSON.stringify(seed, null, 2);
    fs.writeFileSync(DB_PATH, s, 'utf8');
    _cache = seed;
    _lastRead = now;
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(raw) as DBSchema;
    _cache = data;
    _lastRead = now;
    return data;
  } catch {
    const seed = buildSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
    _cache = seed;
    return seed;
  }
}

async function writeDB(mutate: (db: DBSchema) => void): Promise<DBSchema> {
  _lock = _lock.then(async () => {
    const db = readDB();
    mutate(db);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    _cache = db;
    _lastRead = Date.now();
  });
  await _lock;
  return _cache!;
}

function buildSeed(): DBSchema {
  const db = emptyDB();
  const now = new Date().toISOString();
  void now;

  const projectList: Omit<Project, 'id'>[] = [
    { code: 'WB-TJ-2026-001', name: '门神·秦琼敬德', origin: '天津杨柳青', artist: '霍庆有', dynasty: '当代复刻', description: '杨柳青传统门神画一对，采用木版套色水印工艺，共6版套色。描金工艺需特别注意偏移控制。', status: 'in_progress', total_versions: 3, avg_offset_px: 1.82, max_offset_px: 5.31, anomaly_level: 'moderate', anomaly_notes: '第3版（红色）Y轴偏移超过阈值2.5px，修版中。', created_at: '2026-03-12 09:30:00', updated_at: '2026-06-10 14:22:00' },
    { code: 'WB-SD-2026-002', name: '年年有余·娃娃抱鱼', origin: '山东潍坊', artist: '张殿英', dynasty: '清代版复刻', description: '潍坊杨家埠经典题材，5版套色。胖娃娃抱鲤鱼，莲花、荷叶点缀。', status: 'review', total_versions: 4, avg_offset_px: 0.94, max_offset_px: 2.17, anomaly_level: 'minor', anomaly_notes: '第4版（绿色）左上角色块轻微错位，待终审确认。', created_at: '2026-02-18 11:00:00', updated_at: '2026-06-08 16:45:00' },
    { code: 'WB-SX-2026-003', name: '钟馗降福图', origin: '山西绛州', artist: '吴百锁', dynasty: '明代古版修复', description: '绛州二天门木版年画代表作，古版修复后重印。共7版套色，含烫金。', status: 'draft', total_versions: 2, avg_offset_px: 3.56, max_offset_px: 8.74, anomaly_level: 'severe', anomaly_notes: '古版磨损严重，多版控制点漂移。建议重新制分色版。', created_at: '2026-05-02 08:15:00', updated_at: '2026-06-15 10:08:00' },
    { code: 'WB-JS-2026-004', name: '一团和气', origin: '江苏桃花坞', artist: '王祖德', dynasty: '清雍正版复刻', description: '桃花坞经典吉祥画，圆形构图。三教合一形象，6版套色。', status: 'completed', total_versions: 5, avg_offset_px: 0.52, max_offset_px: 1.24, anomaly_level: 'none', anomaly_notes: null, created_at: '2026-01-08 13:20:00', updated_at: '2026-05-29 09:50:00' },
    { code: 'WB-HN-2026-005', name: '二十四孝·扇枕温衾', origin: '河南朱仙镇', artist: '郭泰运', dynasty: '清代版', description: '朱仙镇传统戏曲故事年画，色彩浓烈。4版套色。', status: 'in_progress', total_versions: 3, avg_offset_px: 2.14, max_offset_px: 4.88, anomaly_level: 'moderate', anomaly_notes: '第2版（黄色）存在整体旋转0.3°，需校准。', created_at: '2026-04-20 15:30:00', updated_at: '2026-06-12 11:30:00' },
    { code: 'WB-SC-2026-006', name: '天府宫·蚕神马鸣王', origin: '四川绵竹', artist: '胡光葵', dynasty: '民国版复刻', description: '绵竹年画宗教题材，设色典雅。5版套色，含描金工艺。', status: 'completed', total_versions: 6, avg_offset_px: 0.68, max_offset_px: 1.56, anomaly_level: 'none', anomaly_notes: null, created_at: '2026-02-01 10:00:00', updated_at: '2026-06-01 17:00:00' },
  ];

  const projectIds: number[] = [];
  for (const p of projectList) {
    db.seq.projects += 1;
    const id = db.seq.projects;
    db.projects.push({ ...p, id });
    projectIds.push(id);
  }

  const versionTemplates = [
    { pi: 0, vn: 'v1.0', bn: 'B-20260312-01', at: '2026-03-12 10:15:00', sc: '爱普生V850 Pro', dpi: 600, nt: '首扫，各版轮廓确认。' },
    { pi: 0, vn: 'v2.1', bn: 'B-20260405-03', at: '2026-04-05 14:30:00', sc: '爱普生V850 Pro', dpi: 600, nt: '修版后复扫，红色版仍有偏移。' },
    { pi: 0, vn: 'v3.0', bn: 'B-20260610-07', at: '2026-06-10 09:00:00', sc: '爱普生V850 Pro', dpi: 800, nt: '重刻红色版后扫描，待控制点对比。' },
    { pi: 1, vn: 'v1.0', bn: 'B-20260218-01', at: '2026-02-18 14:00:00', sc: '惠普ScanJet', dpi: 300, nt: '初版扫描。' },
    { pi: 1, vn: 'v2.0', bn: 'B-20260310-02', at: '2026-03-10 10:30:00', sc: '惠普ScanJet', dpi: 600, nt: '提高分辨率复扫。' },
    { pi: 1, vn: 'v3.2', bn: 'B-20260420-05', at: '2026-04-20 16:00:00', sc: '爱普生V850 Pro', dpi: 600, nt: '微调蓝色版。' },
    { pi: 1, vn: 'v4.0', bn: 'B-20260608-09', at: '2026-06-08 11:20:00', sc: '爱普生V850 Pro', dpi: 600, nt: '终审前终版扫描。' },
    { pi: 2, vn: 'v0.1', bn: 'B-20260502-00', at: '2026-05-02 09:30:00', sc: '爱普生V850 Pro', dpi: 800, nt: '古版原图采集。' },
    { pi: 2, vn: 'v1.0', bn: 'B-20260615-02', at: '2026-06-15 08:45:00', sc: '爱普生V850 Pro', dpi: 800, nt: '修复后首版试印扫描。' },
    { pi: 3, vn: 'v1.0', bn: 'B-20260108-01', at: '2026-01-08 14:10:00', sc: '惠普ScanJet', dpi: 300, nt: '初版。' },
    { pi: 3, vn: 'v2.0', bn: 'B-20260120-02', at: '2026-01-20 11:00:00', sc: '爱普生V850 Pro', dpi: 600, nt: '修版。' },
    { pi: 3, vn: 'v3.0', bn: 'B-20260215-03', at: '2026-02-15 09:00:00', sc: '爱普生V850 Pro', dpi: 600, nt: '修版。' },
    { pi: 3, vn: 'v4.0', bn: 'B-20260401-04', at: '2026-04-01 15:00:00', sc: '爱普生V850 Pro', dpi: 600, nt: '修版。' },
    { pi: 3, vn: 'v5.0', bn: 'B-20260529-05', at: '2026-05-29 10:00:00', sc: '爱普生V850 Pro', dpi: 800, nt: '终版归档。' },
    { pi: 4, vn: 'v1.0', bn: 'B-20260420-01', at: '2026-04-20 16:30:00', sc: '惠普ScanJet', dpi: 600, nt: '初版扫描。' },
    { pi: 4, vn: 'v2.0', bn: 'B-20260515-04', at: '2026-05-15 10:00:00', sc: '爱普生V850 Pro', dpi: 600, nt: '校准前。' },
    { pi: 4, vn: 'v3.1', bn: 'B-20260612-08', at: '2026-06-12 14:15:00', sc: '爱普生V850 Pro', dpi: 600, nt: '旋转校准复扫。' },
    { pi: 5, vn: 'v1.0', bn: 'B-20260201-01', at: '2026-02-01 10:30:00', sc: '爱普生V850 Pro', dpi: 600, nt: '初版。' },
    { pi: 5, vn: 'v2.0', bn: 'B-20260220-02', at: '2026-02-20 13:00:00', sc: '爱普生V850 Pro', dpi: 600, nt: '' },
    { pi: 5, vn: 'v3.0', bn: 'B-20260315-03', at: '2026-03-15 09:30:00', sc: '爱普生V850 Pro', dpi: 600, nt: '' },
    { pi: 5, vn: 'v4.0', bn: 'B-20260418-04', at: '2026-04-18 14:20:00', sc: '爱普生V850 Pro', dpi: 600, nt: '' },
    { pi: 5, vn: 'v5.0', bn: 'B-20260510-05', at: '2026-05-10 10:45:00', sc: '爱普生V850 Pro', dpi: 800, nt: '' },
    { pi: 5, vn: 'v6.0', bn: 'B-20260601-06', at: '2026-06-01 16:00:00', sc: '爱普生V850 Pro', dpi: 800, nt: '终版归档，套色精度达标。' },
  ];

  const versionMap = new Map<number, number[]>();
  for (const v of versionTemplates) {
    const pid = projectIds[v.pi];
    db.seq.versions += 1;
    const vid = db.seq.versions;
    db.versions.push({
      id: vid,
      project_id: pid,
      version_no: v.vn,
      batch_no: v.bn,
      scanned_at: v.at,
      scanner: v.sc,
      resolution_dpi: v.dpi,
      notes: v.nt,
      created_at: v.at,
    });
    if (!versionMap.has(pid)) versionMap.set(pid, []);
    versionMap.get(pid)!.push(vid);
  }

  const layerTemplate = [
    { name: '墨线版', code: '#1a1a1a', cn: '墨黑', idx: 0 },
    { name: '黄色版', code: '#e8b923', cn: '藤黄', idx: 1 },
    { name: '红色版', code: '#c0392b', cn: '朱砂', idx: 2 },
    { name: '绿色版', code: '#27ae60', cn: '草绿', idx: 3 },
    { name: '蓝色版', code: '#2980b9', cn: '石青', idx: 4 },
    { name: '紫色版', code: '#8e44ad', cn: '紫花', idx: 5 },
    { name: '金色版', code: '#d4af37', cn: '描金', idx: 6 },
  ];
  const projectLayerCounts = [6, 5, 7, 6, 4, 5];
  const layerMap = new Map<number, number[]>();
  for (let pi = 0; pi < projectIds.length; pi++) {
    const pid = projectIds[pi];
    const vids = versionMap.get(pid) || [];
    const lc = projectLayerCounts[pi];
    for (const vid of vids) {
      for (let li = 0; li < lc; li++) {
        const tmpl = layerTemplate[li];
        const isLatest = vid === vids[vids.length - 1];
        const baseOff = (li + 1) * (pi + 1) * 0.3;
        const ox = isLatest ? Math.round(baseOff * 0.4 * 100) / 100 : Math.round(baseOff * 100) / 100;
        const oy = isLatest ? Math.round(baseOff * 0.3 * 100) / 100 : Math.round(baseOff * 1.2 * 100) / 100;
        const rot = isLatest ? 0 : (li % 2 === 0 ? 0.15 : -0.1);
        const aligned = isLatest && ox < 1.5 && oy < 1.5;
        db.seq.layers += 1;
        const lid = db.seq.layers;
        db.layers.push({
          id: lid,
          version_id: vid,
          project_id: pid,
          layer_name: tmpl.name,
          color_code: tmpl.code,
          color_name: tmpl.cn,
          order_index: tmpl.idx,
          image_path: `/placeholder/layer-${pid}-${vid}-${tmpl.idx}.svg`,
          image_width: 1200 + pi * 50,
          image_height: 1600 + pi * 80,
          opacity: 0.6,
          offset_x: ox,
          offset_y: oy,
          rotation: rot,
          is_aligned: aligned,
        });
        if (!layerMap.has(vid)) layerMap.set(vid, []);
        layerMap.get(vid)!.push(lid);
      }
    }
  }

  const pointLabels = ['左上-角', '右上-角', '左下-角', '右下-角', '中心-十字', '眉心-标', '左腋-记', '右腋-记'];
  for (let pi = 0; pi < projectIds.length; pi++) {
    const pid = projectIds[pi];
    const vids = versionMap.get(pid) || [];
    const baseW = 1200 + pi * 50;
    const baseH = 1600 + pi * 80;
    const refPoints = [
      { x: 60, y: 80 },
      { x: baseW - 60, y: 80 },
      { x: 60, y: baseH - 80 },
      { x: baseW - 60, y: baseH - 80 },
      { x: baseW / 2, y: baseH / 2 },
      { x: baseW / 2, y: baseH * 0.28 },
      { x: baseW * 0.32, y: baseH * 0.42 },
      { x: baseW * 0.68, y: baseH * 0.42 },
    ];
    for (const vid of vids) {
      const lids = layerMap.get(vid) || [];
      const isLatest = vid === vids[vids.length - 1];
      for (const lid of lids) {
        for (let pti = 0; pti < refPoints.length; pti++) {
          const rp = refPoints[pti];
          const jitterBase = (pi + 1) * 0.6 + pti * 0.2;
          const factor = isLatest ? 0.35 : 1;
          const dx = Math.round(Math.sin(pti * 1.3 + pi) * jitterBase * factor * 100) / 100;
          const dy = Math.round(Math.cos(pti * 0.9 + pi * 1.7) * jitterBase * factor * 100) / 100;
          const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
          db.seq.points += 1;
          db.points.push({
            id: db.seq.points,
            layer_id: lid,
            project_id: pid,
            version_id: vid,
            label: pointLabels[pti],
            ref_x: rp.x,
            ref_y: rp.y,
            cur_x: Math.round((rp.x + dx) * 100) / 100,
            cur_y: Math.round((rp.y + dy) * 100) / 100,
            delta_x: dx,
            delta_y: dy,
            distance: dist,
          });
        }
      }
    }
  }

  const repairsData = [
    { pi: 0, vi: 1, li: 2, type: 'retrim' as const, desc: '红色版左边缘修版0.2mm，去除毛边。', op: '王师傅', bo: 3.14, ao: 1.88 },
    { pi: 0, vi: 2, li: 2, type: 'block_repair' as const, desc: '重刻红色版局部纹样，原版木纹开裂。', op: '霍师傅', bo: 5.31, ao: 2.12 },
    { pi: 1, vi: 3, li: 3, type: 'align' as const, desc: '绿色版X轴方向微调，对齐控制点。', op: '李师傅', bo: 2.17, ao: 0.88 },
    { pi: 2, vi: 1, li: -1, type: 'note' as const, desc: '古版整体磨损评估完成，建议4、5、6版重制。', op: '吴老师', bo: 8.74, ao: 8.74 },
    { pi: 3, vi: 1, li: 1, type: 'align' as const, desc: '黄色版整体对齐。', op: '王老师', bo: 2.56, ao: 0.72 },
    { pi: 3, vi: 2, li: 2, type: 'retrim' as const, desc: '红色版线条修整。', op: '王老师', bo: 1.98, ao: 0.66 },
    { pi: 3, vi: 3, li: 4, type: 'align' as const, desc: '蓝色版轻微位移校正。', op: '王老师', bo: 1.44, ao: 0.48 },
    { pi: 4, vi: 2, li: 1, type: 'align' as const, desc: '黄色版旋转0.3°校正。', op: '郭师傅', bo: 4.88, ao: 2.44 },
    { pi: 4, vi: 2, li: -1, type: 'note' as const, desc: '批次整体发现旋转偏差，后续批次统一校准基准。', op: '郭师傅', bo: 4.88, ao: 2.44 },
    { pi: 5, vi: 1, li: 3, type: 'align' as const, desc: '绿色版对齐。', op: '胡师傅', bo: 2.11, ao: 0.75 },
    { pi: 5, vi: 4, li: 2, type: 'reprint' as const, desc: '红色版重新调墨试印。', op: '胡师傅', bo: 1.56, ao: 0.62 },
  ];
  for (const r of repairsData) {
    const pid = projectIds[r.pi];
    const vids = versionMap.get(pid) || [];
    const vid = vids[r.vi];
    const lids = layerMap.get(vid) || [];
    const lid = r.li >= 0 ? lids[r.li] : null;
    db.seq.repairs += 1;
    db.repairs.push({
      id: db.seq.repairs,
      project_id: pid,
      version_id: vid,
      layer_id: lid,
      action_type: r.type,
      description: r.desc,
      operator: r.op,
      before_offset: r.bo,
      after_offset: r.ao,
      created_at: new Date(Date.now() - (db.seq.repairs * 3600000)).toISOString(),
    });
  }

  for (const [pid, vids] of versionMap.entries()) {
    for (const vid of vids) {
      const lids = layerMap.get(vid) || [];
      const pts = db.points.filter(p => p.version_id === vid);
      if (pts.length === 0) continue;
      const dists = pts.map(p => p.distance);
      const dxs = pts.map(p => p.delta_x);
      const dys = pts.map(p => p.delta_y);
      const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
      const stdFn = (arr: number[]) => {
        const m = avg(arr);
        return Math.sqrt(avg(arr.map(v => (v - m) ** 2)));
      };
      const avgD = avg(dists);
      const thr = 1.5;
      const aligned = dists.filter(d => d <= thr).length;
      db.seq.stats += 1;
      db.stats.push({
        id: db.seq.stats,
        project_id: pid,
        version_id: vid,
        layer_count: lids.length,
        point_count: pts.length,
        avg_delta_x: Math.round(avg(dxs) * 1000) / 1000,
        avg_delta_y: Math.round(avg(dys) * 1000) / 1000,
        avg_distance: Math.round(avgD * 1000) / 1000,
        max_distance: Math.round(Math.max(...dists) * 1000) / 1000,
        min_distance: Math.round(Math.min(...dists) * 1000) / 1000,
        std_distance: Math.round(stdFn(dists) * 1000) / 1000,
        aligned_count: aligned,
        misaligned_count: dists.length - aligned,
        analyzed_at: new Date().toISOString(),
      });
    }
  }

  for (const p of db.projects) {
    const pstats = db.stats.filter(s => s.project_id === p.id);
    const pversions = db.versions.filter(v => v.project_id === p.id);
    if (pstats.length) {
      p.avg_offset_px = Math.round(pstats.reduce((s, st) => s + st.avg_distance, 0) / pstats.length * 1000) / 1000;
      p.max_offset_px = Math.round(Math.max(...pstats.map(s => s.max_distance)) * 1000) / 1000;
    }
    p.total_versions = pversions.length;
  }

  return db;
}

export function getDBPath(): string {
  ensureDataDir();
  return DB_PATH;
}

export function listProjects(params?: {
  status?: ProjectStatus;
  anomaly?: AnomalyLevel;
  keyword?: string;
  origin?: string;
  sort_by?: 'updated_at' | 'avg_offset_px' | 'created_at';
  order?: 'asc' | 'desc';
}): Project[] {
  const db = readDB();
  let list = db.projects.slice();
  if (params?.status) list = list.filter(p => p.status === params.status);
  if (params?.anomaly) list = list.filter(p => p.anomaly_level === params.anomaly);
  if (params?.origin) list = list.filter(p => p.origin === params.origin);
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.code.toLowerCase().includes(kw) ||
      p.artist.toLowerCase().includes(kw) ||
      p.description.toLowerCase().includes(kw)
    );
  }
  const sort = params?.sort_by || 'updated_at';
  const order = params?.order || 'desc';
  list.sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[sort] as string | number;
    const bv = (b as unknown as Record<string, unknown>)[sort] as string | number;
    if (av < bv) return order === 'asc' ? -1 : 1;
    if (av > bv) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return list;
}

export function getProject(id: number): Project | null {
  const db = readDB();
  return db.projects.find(p => p.id === id) || null;
}

export function listOrigins(): string[] {
  const db = readDB();
  const set = new Set(db.projects.map(p => p.origin).filter(Boolean));
  return Array.from(set).sort();
}

export function listVersions(projectId: number): ScanVersion[] {
  const db = readDB();
  return db.versions
    .filter(v => v.project_id === projectId)
    .sort((a, b) => (a.scanned_at < b.scanned_at ? 1 : -1));
}

export function getVersion(versionId: number): ScanVersion | null {
  const db = readDB();
  return db.versions.find(v => v.id === versionId) || null;
}

export function listLayers(versionId: number): ColorLayer[] {
  const db = readDB();
  return db.layers
    .filter(l => l.version_id === versionId)
    .sort((a, b) => a.order_index - b.order_index || a.id - b.id);
}

export function getLayer(layerId: number): ColorLayer | null {
  const db = readDB();
  return db.layers.find(l => l.id === layerId) || null;
}

export function updateLayerOffset(
  layerId: number,
  data: { offset_x?: number; offset_y?: number; rotation?: number; opacity?: number; is_aligned?: boolean }
): Promise<void> {
  return writeDB(db => {
    const l = db.layers.find(x => x.id === layerId);
    if (!l) return;
    if (data.offset_x !== undefined) l.offset_x = data.offset_x;
    if (data.offset_y !== undefined) l.offset_y = data.offset_y;
    if (data.rotation !== undefined) l.rotation = data.rotation;
    if (data.opacity !== undefined) l.opacity = data.opacity;
    if (data.is_aligned !== undefined) l.is_aligned = data.is_aligned;
  }).then(() => undefined);
}

export function listControlPoints(layerId: number): ControlPoint[] {
  const db = readDB();
  return db.points.filter(p => p.layer_id === layerId).sort((a, b) => a.id - b.id);
}

export function listControlPointsByVersion(versionId: number): ControlPoint[] {
  const db = readDB();
  return db.points.filter(p => p.version_id === versionId).sort((a, b) => a.layer_id - b.layer_id || a.id - b.id);
}

export function updateControlPoint(pointId: number, cur_x: number, cur_y: number): Promise<void> {
  return writeDB(db => {
    const p = db.points.find(x => x.id === pointId);
    if (!p) return;
    p.cur_x = Math.round(cur_x * 100) / 100;
    p.cur_y = Math.round(cur_y * 100) / 100;
    p.delta_x = Math.round((p.cur_x - p.ref_x) * 100) / 100;
    p.delta_y = Math.round((p.cur_y - p.ref_y) * 100) / 100;
    p.distance = Math.round(Math.sqrt(p.delta_x * p.delta_x + p.delta_y * p.delta_y) * 100) / 100;
  }).then(() => undefined);
}

export function addControlPoint(data: Omit<ControlPoint, 'id' | 'delta_x' | 'delta_y' | 'distance'>): Promise<number> {
  let newId = 0;
  return writeDB(db => {
    const dx = Math.round((data.cur_x - data.ref_x) * 100) / 100;
    const dy = Math.round((data.cur_y - data.ref_y) * 100) / 100;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
    db.seq.points += 1;
    newId = db.seq.points;
    db.points.push({
      id: newId,
      layer_id: data.layer_id,
      project_id: data.project_id,
      version_id: data.version_id,
      label: data.label,
      ref_x: data.ref_x,
      ref_y: data.ref_y,
      cur_x: data.cur_x,
      cur_y: data.cur_y,
      delta_x: dx,
      delta_y: dy,
      distance: dist,
    });
  }).then(() => newId);
}

export function removeControlPoint(pointId: number): Promise<void> {
  return writeDB(db => {
    const i = db.points.findIndex(p => p.id === pointId);
    if (i >= 0) db.points.splice(i, 1);
  }).then(() => undefined);
}

export function listRepairs(projectId: number, versionId?: number): RepairRecord[] {
  const db = readDB();
  let list = db.repairs.filter(r => r.project_id === projectId);
  if (versionId !== undefined) list = list.filter(r => r.version_id === versionId);
  return list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function addRepair(data: Omit<RepairRecord, 'id' | 'created_at'>): Promise<number> {
  let newId = 0;
  return writeDB(db => {
    db.seq.repairs += 1;
    newId = db.seq.repairs;
    db.repairs.push({
      id: newId,
      project_id: data.project_id,
      version_id: data.version_id,
      layer_id: data.layer_id,
      action_type: data.action_type,
      description: data.description,
      operator: data.operator,
      before_offset: data.before_offset,
      after_offset: data.after_offset,
      created_at: new Date().toISOString(),
    });
  }).then(() => newId);
}

export function getLatestStat(projectId: number, versionId: number): OffsetStat | null {
  const db = readDB();
  return db.stats.find(s => s.project_id === projectId && s.version_id === versionId) || null;
}

export function computeVersionStats(projectId: number, versionId: number): OffsetStat {
  // 同步先读后写
  const points = listControlPointsByVersion(versionId);
  const layers = listLayers(versionId);
  const dists = points.map(p => p.distance);
  const dxs = points.map(p => p.delta_x);
  const dys = points.map(p => p.delta_y);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
  const stdFn = (arr: number[]) => {
    if (!arr.length) return 0;
    const m = avg(arr);
    return Math.sqrt(avg(arr.map(v => (v - m) ** 2)));
  };
  const avgD = avg(dists);
  const thr = 1.5;
  const aligned = dists.filter(d => d <= thr).length;
  const stat: OffsetStat = {
    project_id: projectId,
    version_id: versionId,
    layer_count: layers.length,
    point_count: points.length,
    avg_delta_x: Math.round(avg(dxs) * 1000) / 1000,
    avg_delta_y: Math.round(avg(dys) * 1000) / 1000,
    avg_distance: Math.round(avgD * 1000) / 1000,
    max_distance: dists.length ? Math.round(Math.max(...dists) * 1000) / 1000 : 0,
    min_distance: dists.length ? Math.round(Math.min(...dists) * 1000) / 1000 : 0,
    std_distance: Math.round(stdFn(dists) * 1000) / 1000,
    aligned_count: aligned,
    misaligned_count: dists.length - aligned,
    analyzed_at: new Date().toISOString(),
  };
  void (async () => {
    await writeDB(db => {
      const idx = db.stats.findIndex(s => s.project_id === projectId && s.version_id === versionId);
      if (idx >= 0) {
        db.stats[idx] = { ...db.stats[idx], ...stat, id: db.stats[idx].id };
      } else {
        db.seq.stats += 1;
        db.stats.push({ ...stat, id: db.seq.stats });
      }
      const pstats = db.stats.filter(s => s.project_id === projectId);
      const p = db.projects.find(p => p.id === projectId);
      if (p) {
        if (pstats.length) {
          p.avg_offset_px = Math.round(pstats.reduce((s, st) => s + st.avg_distance, 0) / pstats.length * 1000) / 1000;
          p.max_offset_px = Math.round(Math.max(...pstats.map(s => s.max_distance)) * 1000) / 1000;
        }
        p.updated_at = new Date().toISOString();
        p.total_versions = db.versions.filter(v => v.project_id === projectId).length;
      }
    });
  })();
  return stat;
}

export function updateProject(id: number, data: Partial<Omit<Project, 'id' | 'created_at'>>): Promise<void> {
  return writeDB(db => {
    const p = db.projects.find(x => x.id === id);
    if (!p) return;
    Object.assign(p, data);
    p.updated_at = new Date().toISOString();
  }).then(() => undefined);
}

export function listAllStats(projectId: number): OffsetStat[] {
  const db = readDB();
  return db.stats
    .filter(s => s.project_id === projectId)
    .sort((a, b) => (a.analyzed_at < b.analyzed_at ? 1 : -1));
}
