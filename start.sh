#!/bin/bash

export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

echo "🚀 正在启动星港货柜调度竞速游戏..."
echo ""

echo "📦 安装依赖..."
bundle install --quiet

echo "🗄️  数据库迁移..."
rails db:migrate

echo "🌱 初始化游戏数据..."
rails db:seed

echo "⚡ 启动服务器..."
echo ""
echo "📱 游戏地址: http://localhost:3000"
echo "⏹️  按 Ctrl+C 停止服务器"
echo ""

rails server -p 3000
