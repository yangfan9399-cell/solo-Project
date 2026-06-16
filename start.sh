#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "🔐 密码博物馆转盘破译游戏 - 启动脚本"
echo "========================================"

if [ ! -d "vendor" ]; then
    echo "📦 安装 Composer 依赖..."
    composer install --no-interaction
fi

if [ ! -f ".env" ]; then
    echo "⚙️  生成环境配置文件..."
    cp .env.example .env
fi

if [ ! -f "database/database.sqlite" ]; then
    echo "💾 创建 SQLite 数据库..."
    touch database/database.sqlite
fi

if [ ! -d "bootstrap/cache" ]; then
    echo "📁 创建缓存目录..."
    mkdir -p bootstrap/cache
fi

mkdir -p storage/app/public
mkdir -p storage/framework/{cache,sessions,testing,views}
mkdir -p storage/logs
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo "🔑 检查应用密钥..."
APP_KEY=$(grep '^APP_KEY=' .env | cut -d'=' -f2)
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "🔑 生成应用密钥..."
    php artisan key:generate --force
fi

echo "🗄️  运行数据库迁移..."
php artisan migrate --force

echo "🌱 填充初始数据（关卡、用户等）..."
php artisan db:seed --force

echo ""
echo "✅ 初始化完成！"
echo ""
echo "📋 默认测试账号："
echo "   邮箱: player@example.com"
echo "   密码: password123"
echo ""
echo "📋 管理员测试账号："
echo "   邮箱: master@example.com"
echo "   密码: password123"
echo ""
echo "🚀 启动开发服务器..."
echo "   访问地址: http://127.0.0.1:8000"
echo ""

php artisan serve --host=127.0.0.1 --port=8000
