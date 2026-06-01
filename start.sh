#!/bin/bash

echo "🌾 农机合作社管理系统 - 启动脚本"
echo "=========================================="

# 检查 PHP 是否可用
if ! command -v php &> /dev/null; then
    echo "❌ 错误: 未找到 PHP 命令"
    echo "请先安装 PHP 7.4 或更高版本"
    echo "MacOS: brew install php"
    echo "Ubuntu: sudo apt-get install php php-sqlite3"
    exit 1
fi

echo "✅ PHP 版本: $(php -v | head -n 1)"

# 检查 SQLite 扩展
if ! php -m | grep -q pdo_sqlite; then
    echo "❌ 错误: 缺少 pdo_sqlite 扩展"
    exit 1
fi

echo "✅ SQLite 扩展已加载"

# 初始化数据库
if [ ! -f "database/database.sqlite" ]; then
    echo "📦 初始化数据库..."
    php database/init.php
    echo "✅ 数据库初始化完成"
else
    echo "✅ 数据库已存在"
fi

echo ""
echo "🚀 启动开发服务器..."
echo "📱 访问地址: http://localhost:8000"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

cd public && php -S localhost:8000
