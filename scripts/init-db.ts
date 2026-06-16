import { initDb, closeDb } from '../src/lib/db';

async function main() {
  console.log('正在初始化数据库...');

  const db = await initDb();

  const tables = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );

  console.log('已创建的数据表:');
  if (tables.length > 0) {
    for (const row of tables[0].values) {
      console.log(`  - ${row[0]}`);
    }
  }

  closeDb();
  console.log('数据库初始化完成!');
}

main().catch(console.error);
