import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const SQL = await initSqlJs({
  locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
});

const fileBuffer = fs.readFileSync('./data/compass-ledger.db');
const db = new SQL.Database(fileBuffer);

console.log('=== 测试2结果: savePoints ===');
const r = db.exec('SELECT id, version, updated_at FROM deviation_records WHERE id = 1')[0].values[0];
console.log('记录版本:', r[1], '(期望: 3)');
console.log('自差点数量:', db.exec('SELECT COUNT(*) FROM deviation_points WHERE record_id = 1')[0].values[0][0], '(期望: 24)');

const v = db.exec('SELECT version_number, action, changed_by, change_summary FROM version_history WHERE record_id = 1 ORDER BY id DESC LIMIT 1')[0].values[0];
console.log('最新版本历史: V' + v[0] + ', 动作=' + v[1] + ', 操作人=' + v[2] + ', 摘要=' + v[3]);
console.log('版本历史总数:', db.exec('SELECT COUNT(*) FROM version_history WHERE record_id = 1')[0].values[0][0], '(期望: 6)');
console.log('');

console.log('=== 0°航向自差点值 ===');
const p = db.exec('SELECT ship_heading, deviation, deviation_direction, magnetic_heading, true_heading, measured FROM deviation_points WHERE record_id = 1 AND ship_heading = 0')[0].values[0];
console.log('航向0°: 自差=' + p[1] + p[2] + ', 磁航向=' + p[3] + ', 真航向=' + p[4] + ', 实测=' + p[5]);
console.log('期望: 自差=1.5E, 磁航向=358.5, 真航向=0.8, 实测=1');
