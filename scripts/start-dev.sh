#!/bin/bash
set -e

echo "============================================"
echo " 教育培训课程排课系统 - 启动脚本"
echo "============================================"
echo ""

cd "$(dirname "$0")/.."

# Step 1: Install dependencies
echo "[1/5] 安装依赖..."
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖，请耐心等待..."
  npm install --registry=https://registry.npmmirror.com --no-audit --no-fund
else
  echo "node_modules 已存在，跳过安装"
fi

# Step 2: Fix native module code signing issues (macOS)
echo ""
echo "[2/5] 修复 macOS 原生模块签名问题..."
node scripts/fix-native-modules.js || true

# Step 3: Setup database
echo ""
echo "[3/5] 初始化数据库..."
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

# Step 4: Generate Prisma client
echo ""
echo "[4/5] 生成 Prisma Client..."
npx prisma generate || true

# Step 5: Start dev server
echo ""
echo "[5/5] 启动开发服务器..."
echo ""
echo "============================================"
echo "  系统即将启动，请访问 http://localhost:5173"
echo "============================================"
echo ""

npm run dev
