import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'silver-engraving.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const now = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

const db = {
  main_records: [],
  annealing_records: [],
  pattern_progress: [],
  result_records: [],
  tool_inventory: [],
  photo_annotations: [],
  delivery_orders: [],
  change_logs: [],
  sequences: {},
};

const seq = (t) => {
  const k = t + ':id';
  db.sequences[k] = (db.sequences[k] || 0) + 1;
  return db.sequences[k];
};

const ts = now();

const tools = [
  ['CH-001', '平錾', '錾子', '2mm 平口', '在用', 128, '2026-05-10', 50, '李记錾坊', 'v2', '常用基础款'],
  ['CH-002', '圆錾', '錾子', '1.5mm 圆珠', '在用', 96, '2026-05-12', 50, '李记錾坊', 'v1', ''],
  ['CH-003', '线錾', '錾子', '0.8mm 尖口', '在用', 203, '2026-05-08', 40, '李记錾坊', 'v3', '精修专用'],
  ['CH-004', '麻点錾', '錾子', '1mm 麻面', '待修', 35, '2026-04-20', 50, '周坊造', 'v0', 'v1錾头角度110°不合格，已停用待返修，暂时恢复使用v0库存版；錾击参数已重算'],
  ['CH-005', '云纹錾', '錾子', '定制云纹', '在用', 67, '2026-05-15', 50, '王麻子手工', 'v1', '祥云专用'],
  ['CH-006', '莲纹錾', '錾子', '花瓣纹', '在用', 82, '2026-05-14', 50, '王麻子手工', 'v2', '缠枝莲专用'],
  ['HM-001', '铜锤', '锤子', '500g 圆头', '在用', 320, '2026-05-01', 200, '自制', 'v4', ''],
  ['HM-002', '木槌', '锤子', '300g 红木', '在用', 156, '2026-05-05', 150, '自制', 'v2', '整形用'],
  ['NZ-001', '尖头镊', '镊子', '15cm 不锈钢', '在用', 512, '2026-04-28', 300, '市售', 'v1', ''],
  ['HC-001', '焊枪', '火吹', '小型丙烷', '在用', 88, '2026-05-03', 100, '市售', 'v2', '退火焊接两用'],
];
tools.forEach((t) => {
  db.tool_inventory.push({
    id: seq('tool_inventory'),
    tool_code: t[0], tool_name: t[1], tool_type: t[2], spec: t[3],
    status: t[4], usage_count: t[5], last_maintenance: t[6],
    maintenance_cycle: t[7], manufacturer: t[8], version: t[9], notes: t[10],
    created_at: ts, updated_at: ts,
  });
});
console.log('✅ 工具库种子数据插入完成');

// ===== 样本1 =====
const m1 = {
  id: seq('main_records'), work_no: 'AG-2026-0001', work_name: '缠枝莲纹银手镯',
  silversmith: '张银匠', chisel_set: '标准套装A',
  main_chisels: JSON.stringify(['CH-001', 'CH-006', 'CH-003']),
  material: 'S990 足银', material_weight: 35.5, start_date: '2026-06-01',
  version: 2, status: '已完成', notes: '客户定制款，母亲生日礼物',
  created_at: ts, updated_at: ts,
};
db.main_records.push(m1);

[[1, '2026-06-01 09:30', 680, 45, '水淬', 120, 65, '张银匠', '初坯软化'],
 [2, '2026-06-02 10:15', 660, 40, '水淬', 95, 60, '张银匠', '纹样錾刻前'],
 [3, '2026-06-03 14:20', 650, 35, '自然冷却', 88, 62, '张银匠', '精修前退火']].forEach(a => {
  db.annealing_records.push({
    id: seq('annealing_records'), main_record_id: m1.id, seq_no: a[0],
    annealing_time: a[1], temperature: a[2], duration: a[3], cooling_method: a[4],
    hardness_before: a[5], hardness_after: a[6], operator: a[7], notes: a[8], created_at: ts,
  });
});

const p1 = [];
[[1,'起稿','整体轮廓起稿',100,'2026-06-01 10:00','2026-06-01 11:30',90,JSON.stringify(['HM-002']),'','sample1-stage1.jpg'],
 [2,'贴样','缠枝莲纹样转印',100,'2026-06-02 08:30','2026-06-02 09:30',60,JSON.stringify([]),'纹样对位准确','sample1-stage2.jpg'],
 [3,'初錾','主干线条初錾',100,'2026-06-02 11:00','2026-06-02 15:30',270,JSON.stringify(['CH-003','HM-001']),'','sample1-stage3.jpg'],
 [4,'精錾','花瓣细节錾刻',100,'2026-06-03 09:00','2026-06-03 16:00',420,JSON.stringify(['CH-006','CH-002']),'个别花瓣深浅不均','sample1-stage4.jpg'],
 [5,'修光','整体抛光修形',100,'2026-06-04 09:00','2026-06-04 12:00',180,JSON.stringify([]),'','sample1-stage5.jpg']].forEach(p => {
  const row = {
    id: seq('pattern_progress'), main_record_id: m1.id, pattern_stage: p[1],
    pattern_name: p[2], progress_pct: p[3], start_time: p[4], end_time: p[5],
    duration_minutes: p[6], chisels_used: p[7], issues: p[8], snapshot_image: p[9], created_at: ts,
  };
  db.pattern_progress.push(row);
  p1.push(row);
});

db.result_records.push({
  id: seq('result_records'), main_record_id: m1.id,
  surface_defects: JSON.stringify([{type:'细小划痕',location:'内侧接口处',size:'0.3cm',repairable:true}]),
  defect_severity: '轻微', rework_count: 1, final_weight: 33.8,
  delivery_requirements: JSON.stringify({customer:'李女士',phone:'138****1234',giftWrap:true,cardMessage:'祝母亲福如东海',engraving:'福'}),
  packaging: '锦盒包装 + 丝带', delivery_date: '2026-06-06', inspector: '王检验',
  acceptance: '合格', acceptance_notes: '整体纹样流畅，仅有细微划痕已修复，符合交付标准',
  created_at: ts, updated_at: ts,
});

db.photo_annotations.push({
  id: seq('photo_annotations'), main_record_id: m1.id, pattern_progress_id: p1[2].id,
  photo_url: 'sample1-check.jpg', annotation_type: '正常',
  annotation_text: '初錾主干线条流畅，深浅一致，符合工艺标准',
  annotator: '张银匠', annotation_time: '2026-06-02 15:45', resolved: 1, resolved_note: '', created_at: ts,
});

db.change_logs.push({
  id: seq('change_logs'), main_record_id: m1.id, table_name: 'main_records', record_id: m1.id,
  change_type: '修改', change_reason: '客户追加内侧刻字需求，版本号从v1升至v2',
  before_data: JSON.stringify({version:1,notes:'客户定制款'}),
  after_data: JSON.stringify({version:2,notes:'客户定制款，母亲生日礼物',delivery_requirements_engraving:'福'}),
  operator: '张银匠', created_at: ts,
});

const snap1 = JSON.stringify({work_no:'AG-2026-0001',work_name:'缠枝莲纹银手镯',silversmith:'张银匠',material:'S990 足银',final_weight:33.8,annealing_count:3,total_hours:17,acceptance:'合格',packaging:'锦盒包装 + 丝带',engraving:'福',delivery_date:'2026-06-06'});
const do1 = { id: seq('delivery_orders'), main_record_id: m1.id, order_no: 'DO-20260001-V1', version:1, previous_version_id:null, content_snapshot:snap1, issued_by:'张银匠', issued_at:'2026-06-05 10:00:00', recipient:'李女士', signoff:1 };
db.delivery_orders.push(do1);
const snap1v2 = JSON.stringify({work_no:'AG-2026-0001',work_name:'缠枝莲纹银手镯',silversmith:'张银匠',material:'S990 足银',final_weight:33.8,annealing_count:3,total_hours:17,acceptance:'合格',packaging:'锦盒包装 + 丝带',engraving:'福',giftWrap:true,cardMessage:'祝母亲福如东海',delivery_date:'2026-06-06'});
db.delivery_orders.push({id:seq('delivery_orders'),main_record_id:m1.id,order_no:'DO-20260001-V2',version:2,previous_version_id:do1.id,content_snapshot:snap1v2,issued_by:'张银匠',issued_at:'2026-06-05 16:30:00',recipient:'李女士',signoff:1});
console.log('✅ 样本1（正常完成）插入完成');

// ===== 样本2 =====
const m2 = {
  id: seq('main_records'), work_no: 'AG-2026-0002', work_name: '饕餮纹银牌吊坠',
  silversmith: '陈银匠', chisel_set: '高级套装B',
  main_chisels: JSON.stringify(['CH-001','CH-003','CH-005']),
  material: 'S925 银', material_weight: 22.0, start_date: '2026-06-05',
  version: 1, status: '异常处理中', notes: '纹样错位，需要重錾修复',
  created_at: ts, updated_at: ts,
};
db.main_records.push(m2);

[[1,'2026-06-05 09:00',650,40,'水淬',110,62,'陈银匠','初坯退火'],
 [2,'2026-06-06 11:00',640,35,'水淬',90,58,'陈银匠','初錾后发现错位，重錾前退火']].forEach(a => {
  db.annealing_records.push({id:seq('annealing_records'),main_record_id:m2.id,seq_no:a[0],annealing_time:a[1],temperature:a[2],duration:a[3],cooling_method:a[4],hardness_before:a[5],hardness_after:a[6],operator:a[7],notes:a[8],created_at:ts});
});

const p2 = [];
[[1,'起稿','吊坠轮廓起稿',100,'2026-06-05 10:00','2026-06-05 11:00',60,JSON.stringify(['HM-002']),'','sample2-stage1.jpg'],
 [2,'贴样','饕餮纹转印',100,'2026-06-06 08:30','2026-06-06 09:00',30,JSON.stringify([]),'当时未察觉偏位','sample2-stage2.jpg'],
 [3,'初錾','饕餮纹面部初錾',60,'2026-06-06 09:30','2026-06-06 14:00',270,JSON.stringify(['CH-003','CH-001']),'右眼纹路整体偏右2mm','sample2-stage3.jpg'],
 [4,'精錾','饕餮纹角部细节',0,null,null,0,JSON.stringify([]),'等待重錾完成后进行',null]].forEach(p => {
  const row = {id:seq('pattern_progress'),main_record_id:m2.id,pattern_stage:p[1],pattern_name:p[2],progress_pct:p[3],start_time:p[4],end_time:p[5],duration_minutes:p[6],chisels_used:p[7],issues:p[8],snapshot_image:p[9],created_at:ts};
  db.pattern_progress.push(row);
  p2.push(row);
});

db.result_records.push({
  id:seq('result_records'),main_record_id:m2.id,
  surface_defects: JSON.stringify([{type:'纹样错位',location:'右眼区域',size:'2mm偏移',repairable:true,requireRework:true}]),
  defect_severity:'中度',rework_count:0,final_weight:null,
  delivery_requirements: JSON.stringify({customer:'王先生',phone:'139****5678',giftWrap:false,urgent:true}),
  packaging:null,delivery_date:'2026-06-12',inspector:null,acceptance:'待复检',
  acceptance_notes:'纹样错位待修复，修复完成后重新检验',
  created_at:ts,updated_at:ts,
});

db.photo_annotations.push({
  id:seq('photo_annotations'),main_record_id:m2.id,pattern_progress_id:p2[2].id,
  photo_url:'sample2-defect.jpg',annotation_type:'异常',
  annotation_text:'【异常标记】饕餮右眼整体向右偏移约2mm，导致左右不对称。红框标记处为错位区域。原因：贴样时未使用定位卡，手工对齐误差。建议：1）用细砂纸磨去错位錾痕至光滑；2）重新贴样，必须使用定位卡；3）退火后重新初錾该区域。影响评估：需增加返工时间约4小时，材料损耗约0.3g银。',
  annotator:'质检-李工',annotation_time:'2026-06-06 14:30',resolved:0,resolved_note:null,created_at:ts,
});
db.photo_annotations.push({
  id:seq('photo_annotations'),main_record_id:m2.id,pattern_progress_id:p2[2].id,
  photo_url:'sample2-reference.jpg',annotation_type:'参考',
  annotation_text:'【参考样例】标准饕餮纹对称参考图，红色辅助线为中轴线，要求两侧纹路线条到轴线距离误差≤0.3mm',
  annotator:'陈银匠',annotation_time:'2026-06-06 15:00',resolved:1,resolved_note:'已收藏参考图，返工将严格对照',created_at:ts,
});

db.change_logs.push({
  id:seq('change_logs'),main_record_id:m2.id,table_name:'pattern_progress',record_id:p2[2].id,
  change_type:'异常标记',change_reason:'照片批注发现纹样错位问题，初錾进度从100%回退至60%',
  before_data:JSON.stringify({progress_pct:100,issues:''}),
  after_data:JSON.stringify({progress_pct:60,issues:'右眼纹路整体偏右2mm，需返工'}),
  operator:'质检-李工',created_at:ts,
});
db.change_logs.push({
  id:seq('change_logs'),main_record_id:m2.id,table_name:'main_records',record_id:m2.id,
  change_type:'状态变更',change_reason:'照片批注触发异常流程，状态从「进行中」改为「异常处理中」',
  before_data:JSON.stringify({status:'进行中'}),
  after_data:JSON.stringify({status:'异常处理中',notes:'纹样错位，需要重錾修复'}),
  operator:'系统-自动',created_at:ts,
});
console.log('✅ 样本2（照片批注触发异常）插入完成');

// ===== 样本3 =====
const m3 = {
  id:seq('main_records'),work_no:'AG-2026-0003',work_name:'祥云纹茶杯托',
  silversmith:'刘银匠',chisel_set:'标准套装A',
  main_chisels:JSON.stringify(['CH-001','CH-002','CH-005','CH-004']),
  material:'S990 足银',material_weight:68.0,start_date:'2026-06-03',
  version:2,status:'进行中',notes:'工具版本回滚，錾刻深度重新计算',
  created_at:ts,updated_at:ts,
};
db.main_records.push(m3);

[[1,'2026-06-03 09:00',700,50,'水淬',125,68,'刘银匠','初坯软化'],
 [2,'2026-06-04 10:00',680,45,'自然冷却',98,63,'刘银匠','第一次纹样后'],
 [3,'2026-06-06 13:00',670,42,'水淬',92,60,'刘银匠','回滚重錾前'],
 [4,'2026-06-07 11:00',660,38,'自然冷却',88,61,'刘银匠','二次精錾前']].forEach(a => {
  db.annealing_records.push({id:seq('annealing_records'),main_record_id:m3.id,seq_no:a[0],annealing_time:a[1],temperature:a[2],duration:a[3],cooling_method:a[4],hardness_before:a[5],hardness_after:a[6],operator:a[7],notes:a[8],created_at:ts});
});

const p3 = [];
[[1,'起稿','杯托圆盘轮廓',100,'2026-06-03 10:00','2026-06-03 12:00',120,JSON.stringify(['HM-001','HM-002']),'','sample3-stage1.jpg'],
 [2,'贴样','祥云群布局',100,'2026-06-04 08:30','2026-06-04 09:30',60,JSON.stringify([]),'','sample3-stage2.jpg'],
 [3,'初錾','祥云主纹初錾',100,'2026-06-04 10:30','2026-06-04 16:00',330,JSON.stringify(['CH-005','CH-001','HM-001']),'使用CH-004麻点錾做底纹','sample3-stage3.jpg'],
 [4,'初錾回滚','底纹全部回滚重錾',50,'2026-06-06 14:00',null,240,JSON.stringify(['CH-004-v0']),'原CH-004 v1版本錾头角度不合格，底纹过深，全部磨除重錾','sample3-stage3-rollback.jpg'],
 [5,'精錾','祥云层次精錾',80,'2026-06-07 09:00',null,360,JSON.stringify(['CH-005','CH-002']),'深度按重算参数执行',null]].forEach(p => {
  const row = {id:seq('pattern_progress'),main_record_id:m3.id,pattern_stage:p[1],pattern_name:p[2],progress_pct:p[3],start_time:p[4],end_time:p[5],duration_minutes:p[6],chisels_used:p[7],issues:p[8],snapshot_image:p[9],created_at:ts};
  db.pattern_progress.push(row);
  p3.push(row);
});

db.result_records.push({
  id:seq('result_records'),main_record_id:m3.id,surface_defects:JSON.stringify([]),defect_severity:'无',
  rework_count:2,final_weight:65.5,
  delivery_requirements:JSON.stringify({customer:'茶室-静雅轩',quantity:1,giftWrap:true,packaging:'檀木礼盒'}),
  packaging:null,delivery_date:'2026-06-15',inspector:null,acceptance:'待检验',
  acceptance_notes:'工具回滚后重錾完成80%，等待最终验收',
  created_at:ts,updated_at:ts,
});

db.photo_annotations.push({
  id:seq('photo_annotations'),main_record_id:m3.id,pattern_progress_id:p3[2].id,
  photo_url:'sample3-too-deep.jpg',annotation_type:'异常',
  annotation_text:'【工具异常】CH-004麻点錾 v1版本錾头顶角为110°，实际应为120°±2°，导致底纹深度比目标深0.15mm（目标0.25mm，实际0.40mm），在灯光下出现明显反光不均。建议：1）CH-004 v1停用，回退至v0；2）已錾底纹全部磨除；3）重新计算錾击力度参数。',
  annotator:'质检-王工',annotation_time:'2026-06-05 16:00',resolved:1,
  resolved_note:'已按建议执行：CH-004状态改为「待修」，使用CH-004-v0库存版，重新计算参数表',created_at:ts,
});

db.change_logs.push({
  id:seq('change_logs'),main_record_id:m3.id,table_name:'tool_inventory',record_id:4,
  change_type:'回滚',change_reason:'CH-004麻点錾v1版本角度不合格，使用次数统计从45回滚至35，状态改为「待修」，版本回退至v0作为在用',
  before_data:JSON.stringify({tool_code:'CH-004',status:'在用',usage_count:45,version:'v1'}),
  after_data:JSON.stringify({tool_code:'CH-004',status:'待修',usage_count:35,version:'v0',notes:'v1錾头角度110°不合格，已停用待返修，恢复v0'}),
  operator:'质检-王工',created_at:ts,
});
db.change_logs.push({
  id:seq('change_logs'),main_record_id:m3.id,table_name:'pattern_progress',record_id:p3[2].id,
  change_type:'回滚',change_reason:'因工具问题，初錾工序底纹全部磨除，回滚该工序的duration和tool usage统计；同时新增「初錾回滚」记录',
  before_data:JSON.stringify({duration_total:330,chisel_usage_increment:{'CH-004':10}}),
  after_data:JSON.stringify({duration_total:0,chisel_usage_increment:{'CH-004':0},note:'工具导致的回滚不计入有效工时'}),
  operator:'系统-重算',created_at:ts,
});
db.change_logs.push({
  id:seq('change_logs'),main_record_id:m3.id,table_name:'pattern_progress',record_id:null,
  change_type:'重算',change_reason:'基于v0版麻点錾重新计算錾刻参数：深度目标0.25mm，单次錾击力度从18N调整为15N，锤击数从每点3次调整为4次',
  before_data:JSON.stringify({chisel:'CH-004',force:18,hits:3,depth_target:0.25}),
  after_data:JSON.stringify({chisel:'CH-004-v0',force:15,hits:4,depth_target:0.25,correction_factor:1.15}),
  operator:'刘银匠',created_at:ts,
});

const snap3v1 = JSON.stringify({work_no:'AG-2026-0003',work_name:'祥云纹茶杯托',silversmith:'刘银匠',material:'S990 足银',final_weight_est:67.0,annealing_count:2,total_hours_est:15,tool_chisels:['CH-001','CH-002','CH-005','CH-004'],delivery_date:'2026-06-12'});
const do3v1 = {id:seq('delivery_orders'),main_record_id:m3.id,order_no:'DO-20260003-V1',version:1,previous_version_id:null,content_snapshot:snap3v1,issued_by:'刘银匠',issued_at:'2026-06-04 17:00:00',recipient:'静雅轩-采购',signoff:0};
db.delivery_orders.push(do3v1);
const snap3v2 = JSON.stringify({work_no:'AG-2026-0003',work_name:'祥云纹茶杯托',silversmith:'刘银匠',material:'S990 足银',final_weight_est:65.5,annealing_count:4,total_hours_est:25,tool_chisels:['CH-001','CH-002','CH-005','CH-004-v0'],rework_count:2,chisel_param_recalc:true,rollback_notes:'CH-004 v1角度不合格回滚至v0，底纹重錾',delivery_date:'2026-06-15'});
db.delivery_orders.push({id:seq('delivery_orders'),main_record_id:m3.id,order_no:'DO-20260003-V2',version:2,previous_version_id:do3v1.id,content_snapshot:snap3v2,issued_by:'刘银匠',issued_at:'2026-06-07 10:00:00',recipient:'静雅轩-采购',signoff:0});

console.log('✅ 样本3（工具库回滚或重算）插入完成');
console.log('');

const tmp = DB_PATH + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
fs.renameSync(tmp, DB_PATH);

console.log('🎉 全部种子数据初始化完成！');
const c = (t) => db[t].length;
console.log('  - 主记录：' + c('main_records') + ' 条');
console.log('  - 退火记录：' + c('annealing_records') + ' 条');
console.log('  - 纹样进度：' + c('pattern_progress') + ' 条');
console.log('  - 结果记录：' + c('result_records') + ' 条');
console.log('  - 工具库：' + c('tool_inventory') + ' 条');
console.log('  - 照片批注：' + c('photo_annotations') + ' 条');
console.log('  - 交付单：' + c('delivery_orders') + ' 条');
console.log('  - 变更日志：' + c('change_logs') + ' 条');
