#!/bin/bash

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VENV_DIR="$PROJECT_DIR/venv"

echo "=========================================="
echo "  索道日检审批系统 - 启动脚本"
echo "=========================================="

if [ ! -d "$VENV_DIR" ]; then
    echo "创建虚拟环境..."
    python3 -m venv "$VENV_DIR"
fi

echo "激活虚拟环境并安装依赖..."
source "$VENV_DIR/bin/activate"
pip install -r "$PROJECT_DIR/requirements.txt" -q

echo ""
echo "检查数据库..."
DB_NAME="cableway_inspection"
DB_USER="postgres"

if ! psql -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "创建数据库 $DB_NAME ..."
    psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
else
    echo "数据库已存在"
fi

echo ""
echo "运行数据库迁移..."
python "$PROJECT_DIR/manage.py" migrate --noinput

echo ""
echo "检查是否需要初始化数据..."
USER_COUNT=$(python "$PROJECT_DIR/manage.py" shell -c "from inspection.models import User; print(User.objects.count())" 2>/dev/null)
if [ "$USER_COUNT" = "0" ]; then
    echo "初始化示例数据..."
    python "$PROJECT_DIR/manage.py" seed_data
else
    echo "数据已存在，跳过初始化"
fi

echo ""
echo "=========================================="
echo "  启动开发服务器..."
echo "  访问地址: http://127.0.0.1:8000/"
echo "=========================================="
echo ""
echo "演示账号："
echo "  管理员:     admin / password123"
echo "  现场人员:   field_zhang / password123"
echo "  主管复核:   supervisor_chen / password123"
echo ""

python "$PROJECT_DIR/manage.py" runserver 127.0.0.1:8000
