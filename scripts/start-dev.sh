#!/bin/bash
set -e

echo "============================================"
echo " 教育培训课程排课系统 - 启动脚本"
echo "============================================"
echo ""

cd "$(dirname "$0")/.."

echo "[1/6] 安装依赖..."
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖，请耐心等待..."
  npm install --ignore-scripts --no-audit --no-fund
  echo "安装 @rollup/wasm-node..."
  npm install @rollup/wasm-node --save --ignore-scripts --no-audit --no-fund
else
  echo "node_modules 已存在，跳过安装"
fi

echo ""
echo "[2/6] 修复 macOS 原生模块签名问题..."
node scripts/fix-native-modules.js || true

echo ""
echo "[3/6] 生成 Prisma Client (binary engine)..."
npx prisma generate || true

echo ""
echo "[4/6] 初始化数据库..."
if [ ! -f "prisma/dev.db" ]; then
  echo "创建数据库..."
  npx prisma migrate dev --name init --skip-seed
  
  echo "导入基础数据..."
  sqlite3 prisma/dev.db ".read prisma/seed.sql" 2>/dev/null || true
  
  echo "导入样本数据..."
  sqlite3 prisma/dev.db ".read prisma/seed-complete.sql" 2>/dev/null || true
  
  echo "数据库初始化完成"
else
  echo "数据库已存在，跳过初始化"
fi

echo ""
echo "[5/6] 运行 npm 级 postinstall..."
npm rebuild 2>/dev/null || true

echo ""
echo "[6/6] 启动开发服务器..."
echo ""
echo "============================================"
echo "  系统即将启动，请访问 http://localhost:5173"
echo "============================================"
echo ""

npm run dev
