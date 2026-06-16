import { initDb, closeDb, getDbPath, getDataDir } from '../src/lib/db';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('正在重置数据库...');

  closeDb();

  const dataDir = getDataDir();
  const dbPath = getDbPath();
  const dbWalPath = dbPath + '-wal';
  const dbShmPath = dbPath + '-shm';

  for (const p of [dbPath, dbWalPath, dbShmPath]) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  已删除: ${p}`);
    }
  }

  const db = await initDb();
  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  console.log('重建后的表:');
  if (tables.length > 0) {
    for (const row of tables[0].values) {
      console.log(`  - ${row[0]}`);
    }
  }

  closeDb();
  console.log('数据库重置完成!');
}

main().catch(console.error);
