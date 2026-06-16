#!/bin/bash

echo "🚂 火车餐车备餐节奏游戏 - 启动脚本"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "📦 检查并安装依赖..."
if [ ! -d "venv" ]; then
    echo "  创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q

echo ""
echo "🗄️  初始化数据库..."
python manage.py makemigrations game
python manage.py migrate

echo ""
echo "🎮 初始化游戏数据..."
python manage.py init_game_data

echo ""
echo "🔑 创建管理员账号 (admin/admin123456)..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123456')
    print('  管理员账号创建成功!')
else:
    print('  管理员账号已存在')
"

echo ""
echo "🌐 启动开发服务器..."
echo "   游戏地址: http://127.0.0.1:8000"
echo "   管理后台: http://127.0.0.1:8000/admin"
echo "   测试账号: demo / demo123456"
echo "   管理员账号: admin / admin123456"
echo ""
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

python manage.py runserver 0.0.0.0:8000
