import { query } from '../src/lib/db.js';

console.log('测试 pg 连接...');
try {
  const res = await query('SELECT count(*) as cnt FROM "EquipmentRecord"');
  console.log('✅ 连接成功，记录数:', res.rows[0].cnt);

  const users = await query('SELECT * FROM "User" ORDER BY name ASC LIMIT 3');
  console.log('✅ 用户数:', users.rows.length);
  console.log('   前3个:', users.rows.map((r: any) => r.name).join(', '));
} catch (e: any) {
  console.log('❌ 失败:', e.message);
}
process.exit(0);
