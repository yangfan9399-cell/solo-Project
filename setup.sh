#!/bin/bash

export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"

echo "🔧 正在设置星港货柜调度竞速游戏..."
echo ""

echo "📦 安装依赖..."
bundle install

echo ""
echo "🗄️  创建数据库..."
rails db:create

echo "📋 执行数据库迁移..."
rails db:migrate

echo "🌱 初始化游戏数据..."
rails db:seed

echo ""
echo "✅ 设置完成！"
echo ""
echo "运行 ./start.sh 启动游戏服务器"
echo "访问 http://localhost:3000 开始游戏"
