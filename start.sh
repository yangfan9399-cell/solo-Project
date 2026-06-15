#!/bin/bash

echo "=========================================="
echo "  纸上邮差路线折叠游戏 - 启动脚本"
echo "=========================================="
echo ""

echo "📦 检查并安装依赖..."
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

echo ""
echo "🔄 执行数据库迁移..."
python3 manage.py makemigrations
python3 manage.py migrate

echo ""
echo "🌱 初始化种子关卡数据..."
python3 manage.py seed_levels

echo ""
echo "👤 创建超级用户（admin/admin）..."
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | python3 manage.py shell

echo ""
echo "🚀 启动开发服务器..."
echo "访问地址: http://127.0.0.1:8000/"
echo "管理后台: http://127.0.0.1:8000/admin/ (admin/admin)"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python3 manage.py runserver 0.0.0.0:8000
