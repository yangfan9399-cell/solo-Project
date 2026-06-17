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

console.log('\n=== 测试前数据 ===');
const r1 = db.exec("SELECT id, version, status, batch_code, updated_at FROM deviation_records WHERE id = 1")[0].values[0];
console.log(`记录 #1: 版本=${r1[1]}, 状态=${r1[2]}, batch_code=${r1[3]}, 更新时间=${r1[4]}`);

const v1 = db.exec("SELECT COUNT(*) FROM version_history WHERE record_id = 1")[0].values[0][0];
console.log(`版本历史记录数: ${v1}`);

const s1 = db.exec("SELECT id, name, home_port FROM ships WHERE id = (SELECT ship_id FROM deviation_records WHERE id = 1)")[0].values[0];
console.log(`船舶档案: id=${s1[0]}, 名称=${s1[1]}, 船籍港=${s1[2]}`);

console.log('\n=== 测试 1: saveShip - 保存船舶档案 ===');
console.log('POST /records/1 action=saveShip');
console.log('期望: 船籍港改为"测试港TEST", version+1, version_history新增1条update记录');

console.log('\n=== 测试 2: savePoints - 保存自差点数据 ===');
console.log('POST /records/1 action=savePoints');
console.log('期望: 24个航向自差点重新写入, version+1, version_history新增1条update记录');

console.log('\n=== 测试 3: saveCorrections - 保存校正使用表 ===');
console.log('POST /records/1 action=saveCorrections');
console.log('期望: 8个主航向校正表重新写入, version+1, version_history新增1条update记录');

console.log('\n=== 测试 4: saveRecord - 保存全部 (含batch_code) ===');
console.log('POST /records/1 action=saveRecord batch_code=BATCH-TEST-001');
console.log('期望: batch_code字段更新为BATCH-TEST-001, version+1');

console.log('\n');
