import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const SQL = await initSqlJs({
  locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
});

const fileBuffer = fs.readFileSync('./data/compass-ledger.db');
const db = new SQL.Database(fileBuffer);

console.log('=== 测试3结果: saveCorrections ===');
const r = db.exec('SELECT id, version, updated_at FROM deviation_records WHERE id = 1')[0].values[0];
console.log('记录版本:', r[1], '(期望: 4)');
console.log('校正表数量:', db.exec('SELECT COUNT(*) FROM correction_tables WHERE record_id = 1')[0].values[0][0], '(期望: 8)');

const v = db.exec('SELECT version_number, action, changed_by, change_summary FROM version_history WHERE record_id = 1 ORDER BY id DESC LIMIT 1')[0].values[0];
console.log('最新版本历史: V' + v[0] + ', 动作=' + v[1] + ', 操作人=' + v[2] + ', 摘要=' + v[3]);
console.log('版本历史总数:', db.exec('SELECT COUNT(*) FROM version_history WHERE record_id = 1')[0].values[0][0], '(期望: 7)');
console.log('');

const c = db.exec('SELECT heading, correction_value, correction_direction, ship_heading_range FROM correction_tables WHERE record_id = 1 AND heading = 0')[0].values[0];
console.log('主航向0°: 校正量=' + c[1] + c[2] + ', 范围=' + c[3]);
