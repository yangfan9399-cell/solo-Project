#!/bin/bash

echo "🏰 低多边形城堡攻防异步游戏"
echo "=============================="

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

if ! python -c "import django" 2>/dev/null; then
    echo "安装依赖..."
    pip install -r requirements.txt
fi

if [ ! -f "data/db.sqlite3" ]; then
    echo "初始化数据库..."
    python manage.py makemigrations game
    python manage.py migrate
    python manage.py init_game_data
fi

echo "启动服务器..."
echo ""
echo "访问地址: http://localhost:8000"
echo "演示账号: demo_player / password123"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

python manage.py runserver 0.0.0.0:8000
