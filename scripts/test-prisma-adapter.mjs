import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

console.log('Step 1: 检查 Prisma Client 模块...');
try {
  const prismaMod = await import('@prisma/client');
  console.log('  ✅ @prisma/client import 成功');
  console.log('  导出:', Object.keys(prismaMod).slice(0, 10).join(', '));
} catch (e) {
  console.log('  ❌ import 失败:', e.message);
  process.exit(1);
}

console.log('\nStep 2: 检查 PrismaPg adapter...');
try {
  console.log('  PrismaPg 类型:', typeof PrismaPg);
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/venue_equipment?schema=public';
  const parsed = new URL(url);
  const pool = new Pool({
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    user: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
  });
  const adapter = new PrismaPg(pool);
  console.log('  ✅ PrismaPg adapter 创建成功');
} catch (e) {
  console.log('  ❌ adapter 创建失败:', e.message);
}

console.log('\nStep 3: new PrismaClient 无 adapter...');
try {
  const p = new PrismaClient();
  console.log('  ✅ new PrismaClient() 成功（无 adapter）');
  console.log('  测试查询...');
  const start = Date.now();
  try {
    const users = await p.user.findMany({ take: 1 });
    console.log('  ✅ 查询成功, 耗时:', Date.now() - start, 'ms, 用户数:', users.length);
  } catch (qe) {
    console.log('  ❌ 查询失败:', qe.message.slice(0, 200));
  }
  await p.$disconnect();
} catch (e) {
  console.log('  ❌ new PrismaClient() 失败:', e.message.slice(0, 300));
}

console.log('\nStep 4: new PrismaClient 有 adapter...');
try {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/venue_equipment?schema=public';
  const parsed = new URL(url);
  const pool = new Pool({
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    user: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
  });
  const adapter = new PrismaPg(pool);
  const p = new PrismaClient({ adapter });
  console.log('  ✅ new PrismaClient({ adapter }) 成功');
  console.log('  测试查询...');
  const start = Date.now();
  try {
    const users = await p.user.findMany({ take: 1 });
    console.log('  ✅ 查询成功, 耗时:', Date.now() - start, 'ms, 用户数:', users.length);
  } catch (qe) {
    console.log('  ❌ 查询失败:', qe.message.slice(0, 200));
  }
  await p.$disconnect();
} catch (e) {
  console.log('  ❌ new PrismaClient({ adapter }) 失败:', e.message.slice(0, 300));
}

console.log('\nDone.');
process.exit(0);
