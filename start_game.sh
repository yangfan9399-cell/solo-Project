#!/bin/bash
# 量子仓库推箱策略游戏 - 一键启动脚本

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

VENV_DIR="$PROJECT_DIR/venv"
PYTHON="$VENV_DIR/bin/python"
PIP="$VENV_DIR/bin/pip"

echo "================================================"
echo "  量子仓库推箱策略游戏 - 启动中"
echo "================================================"

# 1. 创建/检查虚拟环境
if [ ! -d "$VENV_DIR" ]; then
    echo "[1/5] 创建 Python 虚拟环境..."
    python3 -m venv "$VENV_DIR"
else
    echo "[1/5] ✓ 虚拟环境已存在"
fi

# 2. 安装依赖
echo "[2/5] 检查/安装依赖..."
$PIP install -q 'Django>=5.0,<6.0'

# 3. 数据库迁移
echo "[3/5] 执行数据库迁移..."
$PYTHON manage.py migrate --noinput 2>&1 | tail -3

# 4. 初始化游戏数据
echo "[4/5] 初始化种子数据（用户/关卡）..."
$PYTHON manage.py seed_game_data 2>&1 | grep -E "(创建|已更新|总计|登录账号|测试玩家|管理员)"

# 5. 启动开发服务器
echo "[5/5] 启动开发服务器..."
echo ""
echo "================================================"
echo "  🎮 游戏大厅:    http://localhost:8000/"
echo "  🔧 后台管理:    http://localhost:8000/admin/"
echo ""
echo "  👤 测试玩家:    testplayer / test123456"
echo "  👑 管理员:      admin / admin123456"
echo "================================================"
echo ""

$PYTHON manage.py runserver 0.0.0.0:8000
