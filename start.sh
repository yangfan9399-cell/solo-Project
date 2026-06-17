#!/bin/bash
# 海盐晒场结晶池巡检台账 - 一键启动脚本
set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 安装项目依赖..."
pip install -q -r requirements.txt

if [ ! -f "saltfield.db" ]; then
    echo "🗄️  创建数据库..."
    python manage.py migrate

    echo "🌱 初始化样例数据（90天巡检记录）..."
    python manage.py init_sample_data

    echo "👤 创建管理员账户 (admin / admin123)..."
    python -c "
import django
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'saltfield.settings'
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'a@a.com', 'admin123')
    print('    ✅ 管理员创建成功: admin / admin123')
else:
    print('    ℹ️  管理员已存在')
"
fi

echo ""
echo "================================================"
echo "  🧂 海盐晒场结晶池巡检台账 启动成功！"
echo "================================================"
echo ""
echo "  🌐 工作台首页:    http://127.0.0.1:8000/"
echo "  🔐 管理后台:      http://127.0.0.1:8000/admin/"
echo "  👤 管理员账号:    admin / admin123"
echo ""
echo "  💾 初始化数据:"
echo "     • 16 个结晶池（A/B/C/D 四组）"
echo "     • 近 90 天巡检记录 (≈2400+ 条)"
echo "     • 版本历史、异常告警、批次数据"
echo ""
echo "  🔄 重置数据命令:"
echo "     python manage.py init_sample_data --reset"
echo ""
echo "  按 Ctrl+C 停止服务"
echo "================================================"
echo ""

python manage.py runserver 0.0.0.0:8000
