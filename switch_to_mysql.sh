#!/bin/bash

echo "=== 切换到 MySQL 数据库 ==="

# 1. 停止开发服务器（如果运行中）
echo "1. 停止开发服务器..."
pkill -f "php artisan serve" 2>/dev/null || true
sleep 2

# 2. 更新 .env 配置
echo "2. 更新数据库配置..."
cat > .env << 'EOF'
APP_NAME=商户装修审批系统
APP_ENV=local
APP_KEY=base64:zY2t4X9g8F7h6G5f4D3s2A1q0W9e8R7t6Y5u4I3o2P1a0S9d8F7g6H5j4K3l2M1n0B9v8C7x6Z5w4V3e2R1t0
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=decoration_system
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="${APP_NAME}"
EOF

# 3. 创建数据库
echo "3. 创建数据库..."
mysql -h 127.0.0.1 -u root -e "CREATE DATABASE IF NOT EXISTS decoration_system;"

# 4. 运行迁移和种子数据
echo "4. 运行数据库迁移..."
php artisan migrate --seed

# 5. 启动开发服务器
echo "5. 启动开发服务器..."
php artisan serve

echo "=== 切换完成 ==="
echo "访问地址: http://localhost:8000"
