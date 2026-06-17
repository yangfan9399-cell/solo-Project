import { getDb, closeDb } from './connection';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ships (id INTEGER PRIMARY KEY AUTOINCREMENT);
`;

// @deprecated 请使用 scripts/setup-db.ts 初始化数据库
export async function initDatabase(): Promise<void> {
  const db = await getDb();
  db.exec(SCHEMA);
  console.log('✅ 数据库 schema 初始化完成');
  closeDb();
}

