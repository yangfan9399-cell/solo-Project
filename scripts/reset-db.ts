import fs from 'node:fs';
import path from 'node:path';
import { DB_FILE_PATH, closeDb } from '../app/db/connection';
import { initDatabase } from '../app/db/schema';
import { seedDatabase } from '../app/db/seed-data';

closeDb();

console.log('🔄 正在重置数据库...');
if (fs.existsSync(DB_FILE_PATH)) {
  fs.unlinkSync(DB_FILE_PATH);
  console.log(`已删除: ${DB_FILE_PATH}`);
}
const walFile = DB_FILE_PATH + '-wal';
const shmFile = DB_FILE_PATH + '-shm';
for (const f of [walFile, shmFile]) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
  }
}

console.log('');
initDatabase();
console.log('');
seedDatabase();
console.log('');
console.log('🎉 数据库重置完成！');
