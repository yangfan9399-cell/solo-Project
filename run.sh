#!/bin/zsh

export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH"

echo "=== 企业合同印章外借审批与归还核验系统 ==="
echo ""
echo "数据库: SQL Server (Azure SQL Edge on Docker)"
echo "端口: 1433"
echo "用户: sa"
echo "密码: Seal@Admin2024"
echo ""
echo "启动 Web 应用..."
echo ""

cd "$(dirname "$0")"
dotnet run --urls "http://localhost:5000"
