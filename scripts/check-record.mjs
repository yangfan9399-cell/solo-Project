import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const SQL = await initSqlJs({
  locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
});

const fileBuffer = fs.readFileSync('./data/compass-ledger.db');
const db = new SQL.Database(fileBuffer);

console.log('=== 测试4结果: saveRecord (batch_code) ===');
const r = db.exec('SELECT id, version, batch_code, location, inspector_name FROM deviation_records WHERE id = 1')[0].values[0];
console.log('记录版本:', r[1]);
console.log('批次编号:', r[2], '(期望: BATCH-TEST-001)');
console.log('作业地点:', r[3]);
console.log('验船师:', r[4]);

const v = db.exec('SELECT version_number, action, changed_by, change_summary FROM version_history WHERE record_id = 1 ORDER BY id DESC LIMIT 1')[0].values[0];
console.log('最新版本历史: V' + v[0] + ', 动作=' + v[1] + ', 操作人=' + v[2] + ', 摘要=' + v[3]);
console.log('版本历史总数:', db.exec('SELECT COUNT(*) FROM version_history WHERE record_id = 1')[0].values[0][0]);
