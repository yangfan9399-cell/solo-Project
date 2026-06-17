import { getDB } from '../lib/db.ts';

try {
  const db = getDB();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get();
  console.log(`✓ 数据库初始化完成，当前项目数：${count.c}`);
  process.exit(0);
} catch (err) {
  console.error('✗ 数据库初始化失败：', err);
  process.exit(1);
}
