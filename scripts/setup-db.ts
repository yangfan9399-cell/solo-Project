import initSqlJs from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'compass-ledger.db');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  imo_number TEXT, call_sign TEXT, flag TEXT, ship_type TEXT,
  gross_tonnage REAL, built_year INTEGER,
  compass_type TEXT, compass_model TEXT, compass_install_date TEXT,
  home_port TEXT, notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS deviation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ship_id INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 1,
  batch_code TEXT NOT NULL, record_date TEXT NOT NULL,
  location TEXT, latitude REAL, longitude REAL,
  magnetic_variation REAL, variation_direction TEXT CHECK (variation_direction IN ('E','W')),
  weather_condition TEXT, sea_state TEXT, ship_speed REAL, ship_draft REAL, trim REAL,
  corrector_fore_and_aft REAL, corrector_athwartship REAL, corrector_vertical REAL,
  corrector_quadrantal REAL, corrector_heeling REAL,
  inspector_name TEXT, inspector_certificate TEXT, survey_company TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','verified','approved','archived')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS deviation_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  ship_heading INTEGER NOT NULL CHECK (ship_heading >= 0 AND ship_heading < 360),
  magnetic_heading REAL, true_heading REAL,
  deviation REAL NOT NULL CHECK (deviation >= 0 AND deviation <= 180),
  deviation_direction TEXT NOT NULL CHECK (deviation_direction IN ('E','W')),
  measured INTEGER NOT NULL DEFAULT 1, notes TEXT,
  FOREIGN KEY (record_id) REFERENCES deviation_records(id) ON DELETE CASCADE,
  UNIQUE (record_id, ship_heading)
);
CREATE TABLE IF NOT EXISTS correction_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  heading INTEGER NOT NULL CHECK (heading >= 0 AND heading < 360),
  ship_heading_range TEXT NOT NULL,
  correction_value REAL NOT NULL,
  correction_direction TEXT NOT NULL CHECK (correction_direction IN ('E','W')),
  apply_rule TEXT,
  FOREIGN KEY (record_id) REFERENCES deviation_records(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS version_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL, version_number INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','submit','verify','approve','archive','restore')),
  changed_by TEXT, change_summary TEXT, changed_fields TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (record_id) REFERENCES deviation_records(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_records_ship_id ON deviation_records(ship_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON deviation_records(status);
CREATE INDEX IF NOT EXISTS idx_records_date ON deviation_records(record_date);
CREATE INDEX IF NOT EXISTS idx_points_record_id ON deviation_points(record_id);
`;

type Ship = { name: string; imo_number?: string; call_sign?: string; flag?: string; ship_type?: string; gross_tonnage?: number; built_year?: number; compass_type?: string; compass_model?: string; compass_install_date?: string; home_port?: string; notes?: string };
type SampleRecord = {
  shipIndex: number; date: string; location: string; lat: number; lon: number;
  variation: number; varDir: 'E' | 'W'; status: 'draft'|'verified'|'approved'|'archived';
  amplitude: number; bias: number; seed: number; inspector: string; cert: string;
  company: string; weather: string; seaState: string;
};

const SAMPLE_SHIPS: Ship[] = [
  { name: '远洋号', imo_number: 'IMO9765432', call_sign: 'BXQW', flag: '中华人民共和国', ship_type: '散货船', gross_tonnage: 58300, built_year: 2015, compass_type: '标准磁罗经', compass_model: 'Tokyo Keiki SPT-5', compass_install_date: '2015-03-15', home_port: '上海', notes: '主罗经，操舵罗经同步' },
  { name: '海蓝鲸', imo_number: 'IMO9456789', call_sign: 'HZMF', flag: '巴拿马', ship_type: '集装箱船', gross_tonnage: 72800, built_year: 2012, compass_type: '磁罗经', compass_model: 'Yokogawa CMZ-700', compass_install_date: '2012-08-22', home_port: '巴拿马城', notes: '船首楼甲板标准罗经' },
  { name: '东方之星', imo_number: 'IMO9234567', call_sign: 'DLKP', flag: '利比里亚', ship_type: '油轮', gross_tonnage: 95400, built_year: 2008, compass_type: '标准磁罗经', compass_model: 'Cassens & Plath 150', compass_install_date: '2008-11-10', home_port: '蒙罗维亚', notes: '2023年更换过磁铁校正器' },
  { name: '珠江先锋', imo_number: 'IMO9988776', call_sign: 'PRVN', flag: '中华人民共和国', ship_type: '多用途船', gross_tonnage: 23500, built_year: 2019, compass_type: '操舵磁罗经', compass_model: 'Kelvin Hughes MTC-A', compass_install_date: '2019-05-30', home_port: '广州', notes: '辅助罗经，定期与GPS比对' },
  { name: '北极光', imo_number: 'IMO9112233', call_sign: 'OWST', flag: '新加坡', ship_type: '冷藏船', gross_tonnage: 18900, built_year: 2005, compass_type: '标准磁罗经', compass_model: 'Lilley & Gillie S41', compass_install_date: '2005-07-18', home_port: '新加坡', notes: '老旧船舶，自差波动较大，需频繁校正' }
];
const HEADINGS = [0,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240,255,270,285,300,315,330,345];
const SAMPLE_RECORDS: SampleRecord[] = [
  { shipIndex: 0, date: '2024-11-15', location: '上海洋山港', lat: 30.55, lon: 122.08, variation: 4.2, varDir: 'E', status: 'approved', amplitude: 5.8, bias: 0.5, seed: 1, inspector: '张明远', cert: 'CD-2023-SH-0876', company: '中国船级社上海分社', weather: '晴，能见度良好', seaState: '1级' },
  { shipIndex: 0, date: '2024-06-20', location: '新加坡港外锚地', lat: 1.23, lon: 103.85, variation: 0.8, varDir: 'E', status: 'approved', amplitude: 6.5, bias: 0.8, seed: 2, inspector: '李伟强', cert: 'CD-2024-SG-0234', company: '劳氏船级社新加坡', weather: '多云', seaState: '2级' },
  { shipIndex: 0, date: '2025-05-10', location: '宁波舟山港', lat: 29.92, lon: 122.08, variation: 4.5, varDir: 'E', status: 'verified', amplitude: 5.2, bias: -0.3, seed: 3, inspector: '王建国', cert: 'CD-2025-NB-0112', company: '中国船级社浙江分社', weather: '阴有小雨', seaState: '2级' },
  { shipIndex: 1, date: '2025-03-08', location: '香港葵涌码头', lat: 22.32, lon: 114.15, variation: 2.3, varDir: 'W', status: 'approved', amplitude: 7.2, bias: 1.2, seed: 4, inspector: '陈志峰', cert: 'CD-2025-HK-0045', company: '香港海事处认可机构', weather: '晴', seaState: '1级' },
  { shipIndex: 1, date: '2024-09-12', location: '鹿特丹港', lat: 51.94, lon: 4.48, variation: 1.2, varDir: 'E', status: 'archived', amplitude: 8.0, bias: 1.5, seed: 5, inspector: 'Jan van der Meer', cert: 'NL-CD-2024-1128', company: 'DNV GL 鹿特丹', weather: '多云，偏北大风', seaState: '3级' },
  { shipIndex: 2, date: '2025-04-22', location: '阿联酋富查伊拉港', lat: 25.53, lon: 56.35, variation: 2.8, varDir: 'E', status: 'approved', amplitude: 4.8, bias: -0.6, seed: 6, inspector: 'Ahmed Al-Mansoori', cert: 'UAEMSCD-2025-0078', company: '阿联酋海事局', weather: '高温晴热', seaState: '1级' },
  { shipIndex: 2, date: '2025-06-01', location: '舟山马峙锚地', lat: 30.10, lon: 122.10, variation: 4.1, varDir: 'E', status: 'draft', amplitude: 5.5, bias: 0.2, seed: 7, inspector: '', cert: '', company: '待确认', weather: '阴转晴', seaState: '2级' },
  { shipIndex: 3, date: '2025-02-18', location: '深圳盐田港', lat: 22.57, lon: 114.26, variation: 2.0, varDir: 'W', status: 'verified', amplitude: 3.8, bias: -0.4, seed: 8, inspector: '林文彬', cert: 'CD-2025-SZ-0301', company: '深圳海事局船舶检验中心', weather: '晴间多云', seaState: '1级' },
  { shipIndex: 4, date: '2024-12-05', location: '俄罗斯海参崴', lat: 43.11, lon: 131.88, variation: 9.5, varDir: 'E', status: 'approved', amplitude: 12.5, bias: 2.1, seed: 9, inspector: 'Ivan Petrov', cert: 'RU-MS-2024-4521', company: '俄罗斯海船登记局', weather: '小雪，气温-8°C', seaState: '3级' },
  { shipIndex: 4, date: '2025-05-28', location: '釜山港', lat: 35.10, lon: 129.03, variation: 6.8, varDir: 'E', status: 'draft', amplitude: 14.2, bias: 2.8, seed: 10, inspector: '朴正勋', cert: 'KR-CD-2025-0189', company: '韩国船级社', weather: '晴', seaState: '2级' }
];

function genDev(seed: number, amp: number, bias: number) {
  return HEADINGS.map((h, i) => {
    const rad = (h * Math.PI) / 180;
    let raw = bias + amp*0.6*Math.sin(rad + seed*0.1) + amp*0.35*Math.sin(2*rad + seed*0.2) + amp*0.15*Math.sin(3*rad + seed*0.05) + Math.sin(seed*13.7+i)*0.4;
    let dir: 'E'|'W' = 'E';
    if (raw < 0) { dir = 'W'; raw = -raw; }
    return { heading: h, deviation: Math.round(Math.min(Math.max(raw, 0), 40) * 10) / 10, direction: dir };
  });
}

function lastInsertId(db: initSqlJs.Database): number {
  const r = db.exec('SELECT last_insert_rowid() AS id');
  return r[0]?.values?.[0]?.[0] as number || 0;
}

function ins(db: initSqlJs.Database, sql: string, params: (string | number | null)[]): number {
  db.run(sql, params);
  return lastInsertId(db);
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'all';
  ensureDir();
  console.log(`📂 数据库路径: ${DB_PATH}`);
  const SQL = await initSqlJs();
  let db: initSqlJs.Database;
  let existingBuf: Buffer | null = null;
  if (fs.existsSync(DB_PATH) && mode !== 'reset') existingBuf = fs.readFileSync(DB_PATH);
  if (mode === 'reset' && fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  db = existingBuf ? new SQL.Database(new Uint8Array(existingBuf)) : new SQL.Database();

  console.log('🔧 创建数据库 schema...');
  db.run(SCHEMA);
  console.log('✅ Schema 创建完成');

  if (mode !== 'init-only') {
    if (mode === 'reset') {
      db.run('DELETE FROM version_history');
      db.run('DELETE FROM correction_tables');
      db.run('DELETE FROM deviation_points');
      db.run('DELETE FROM deviation_records');
      db.run('DELETE FROM ships');
    }
    const cnt = (db.exec('SELECT COUNT(*) FROM ships')[0]?.values?.[0]?.[0] as number) || 0;
    if (cnt === 0) {
      console.log('🌱 插入示例数据...');
      const shipIds: number[] = [];
      for (const s of SAMPLE_SHIPS) {
        const id = ins(db, `INSERT INTO ships (name,imo_number,call_sign,flag,ship_type,gross_tonnage,built_year,compass_type,compass_model,compass_install_date,home_port,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [s.name, s.imo_number || null, s.call_sign || null, s.flag || null, s.ship_type || null, s.gross_tonnage || null, s.built_year || null, s.compass_type || null, s.compass_model || null, s.compass_install_date || null, s.home_port || null, s.notes || null]);
        shipIds.push(id);
      }
      console.log(`✅ 插入 ${shipIds.length} 艘船舶档案`);

      let rc = 0, pc = 0, cc = 0, hc = 0;
      for (let idx = 0; idx < SAMPLE_RECORDS.length; idx++) {
        const cfg = SAMPLE_RECORDS[idx];
        const shipId = shipIds[cfg.shipIndex];
        const batch = `BATCH-${shipId}-${cfg.date.replace(/-/g,'')}-${String(idx+1).padStart(3,'0')}`;
        const devData = genDev(cfg.seed, cfg.amplitude, cfg.bias);
        const recId = ins(db, `INSERT INTO deviation_records (ship_id,version,batch_code,record_date,location,latitude,longitude,magnetic_variation,variation_direction,weather_condition,sea_state,ship_speed,inspector_name,inspector_certificate,survey_company,status,notes,corrector_fore_and_aft,corrector_athwartship,corrector_vertical,corrector_quadrantal) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [shipId, 1, batch, cfg.date, cfg.location, cfg.lat, cfg.lon, cfg.variation, cfg.varDir, cfg.weather, cfg.seaState, cfg.seed%3===0?0:null, cfg.inspector || null, cfg.cert || null, cfg.company || null, cfg.status, cfg.seed===10?'自差数值偏大，建议近期重新安排校正作业':null, 12+(cfg.seed%6), -8+(cfg.seed%5), 6+(cfg.seed%4), 2+(cfg.seed%3)]);
        rc++;
        for (const p of devData) {
          const s1 = p.direction === 'E' ? 1 : -1;
          const mhd = (((p.heading - s1*p.deviation) % 360) + 360) % 360;
          const s2 = cfg.varDir === 'E' ? 1 : -1;
          const thd = ((mhd + s2*cfg.variation) % 360 + 360) % 360;
          db.run(`INSERT INTO deviation_points (record_id,ship_heading,magnetic_heading,true_heading,deviation,deviation_direction,measured) VALUES (?,?,?,?,?,?,?)`,
            [recId, p.heading, Math.round(mhd*10)/10, Math.round(thd*10)/10, p.deviation, p.direction, p.heading%30===0?1:0]);
          pc++;
        }
        const corrHs = [0,45,90,135,180,225,270,315];
        for (const ch of corrHs) {
          const m = devData.find(d => d.heading === ch);
          if (m) {
            const st = (ch-22+360)%360;
            const ed = (ch+22)%360;
            db.run(`INSERT INTO correction_tables (record_id,heading,ship_heading_range,correction_value,correction_direction,apply_rule) VALUES (?,?,?,?,?,?)`,
              [recId, ch, `${st}° - ${ed}°`, m.deviation, m.direction, ch%90===0?'主航向优先使用，插值计算中间航向':'象限中心航向，配合主航向线性插值']);
            cc++;
          }
        }
        const actions: Array<[string, string, string]> = [['create', cfg.inspector||'系统', `创建自差校正记录 - ${cfg.location}`]];
        if (cfg.status !== 'draft') actions.push(['submit', cfg.inspector||'系统', '提交审核']);
        if (cfg.status === 'verified' || cfg.status === 'approved') actions.push(['verify', '验船师复核', '数据复核通过，符合 SOLAS Ch.V Reg.19 要求']);
        if (cfg.status === 'approved') actions.push(['approve', '主管机关', '船长批准，本轮校正生效']);
        if (cfg.status === 'archived') actions.push(['archive', '系统归档', '超过法定有效期自动归档']);
        for (const act of actions) {
          db.run(`INSERT INTO version_history (record_id,version_number,action,changed_by,change_summary) VALUES (?,?,?,?,?)`, [recId, 1, act[0], act[1], act[2]]);
          hc++;
        }
      }
      console.log(`✅ 插入 ${rc} 条校正记录，${pc} 条自差点，${cc} 条校正表，${hc} 条版本历史`);
    } else {
      console.log('ℹ️  数据库已有数据，跳过示例数据插入（使用 reset 模式可重置）');
    }
  }

  ensureDir();
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();
  console.log('');
  console.log('🎉 数据库初始化完成！');
}

main().catch(err => {
  console.error('❌ 初始化失败:', err);
  process.exit(1);
});
