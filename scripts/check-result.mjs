import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQL = await initSqlJs({
  locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
});

const dbPath = path.join(__dirname, '..', 'data', 'compass-ledger.db');
const fileBuffer = fs.readFileSync(dbPath);
const db = new SQL.Database(fileBuffer);

console.log('=== 测试1结果: saveShip ===');
const r = db.exec('SELECT id, version, status, updated_at FROM deviation_records WHERE id = 1')[0].values[0];
console.log('记录版本:', r[1], '(期望: 2)');
console.log('更新时间:', r[3]);

const s = db.exec('SELECT name, home_port FROM ships WHERE id = 1')[0].values[0];
console.log('船舶船籍港:', s[1], '(期望: 测试港TEST)');

const v = db.exec('SELECT version_number, action, changed_by, change_summary, created_at FROM version_history WHERE record_id = 1 ORDER BY id DESC LIMIT 1')[0].values[0];
console.log('最新版本历史: V' + v[0] + ', 动作=' + v[1] + ', 操作人=' + v[2] + ', 摘要=' + v[3]);
console.log('版本历史总数:', db.exec('SELECT COUNT(*) FROM version_history WHERE record_id = 1')[0].values[0][0], '(期望: 5)');
console.log('');

const test = process.argv[2] || 'ship';

if (test === 'points') {
  console.log('=== 测试2结果: savePoints ===');
  const r2 = db.exec('SELECT id, version, updated_at FROM deviation_records WHERE id = 1')[0].values[0];
  console.log('记录版本:', r2[1], '(期望: 3)');
  
  const p = db.exec('SELECT COUNT(*) FROM deviation_points WHERE record_id = 1')[0].values[0][0];
  console.log('自差点数量:', p, '(期望: 24)');
  
  const v2 = db.exec('SELECT version_number, action, changed_by, change_summary FROM version_history WHERE record_id = 1 ORDER BY id DESC LIMIT 1')[0].values[0];
  console.log('最新版本历史: V' + v2[0] + ', 动作=' + v2[1] + ', 操作人=' + v2[2] + ', 摘要=' + v2[3]);
  console.log('版本历史总数:', db.exec('SELECT COUNT(*) FROM version_history WHERE record_id = 1')[0].values[0][0], '(期望: 6)');
}

if (test === 'corrections') {
  console.log('=== 测试3结果: saveCorrections ===');
  const r3 = db.exec('SELECT id, version, updated_at FROM deviation_records WHERE id = 1')[0].values[0];
  console.log('记录版本:', r3[1], '(期望: 4)');
  
  const c = db.exec('SELECT COUNT(*) FROM correction_table WHERE record_id = 1')[0].values[0][0];
  console.log('校正表数量:', c, '(期望: 8)');
  
  const v3 = db.exec('SELECT version_number, action, changed_by, change_summary FROM version_history WHERE record_id = 1 ORDER BY id DESC LIMIT 1')[0].values[0];
  console.log('最新版本历史: V' + v3[0] + ', 动作=' + v3[1] + ', 操作人=' + v3[2] + ', 摘要=' + v3[3]);
  console.log('版本历史总数:', db.exec('SELECT COUNT(*) FROM version_history WHERE record_id = 1')[0].values[0][0], '(期望: 7)');
}

if (test === 'record') {
  console.log('=== 测试4结果: saveRecord (batch_code) ===');
  const r4 = db.exec('SELECT id, version, batch_code, updated_at FROM deviation_records WHERE id = 1')[0].values[0];
  console.log('记录版本:', r4[1]);
  console.log('批次编号:', r4[2], '(期望: BATCH-TEST-001)');
}
