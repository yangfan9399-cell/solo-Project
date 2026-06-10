#!/bin/bash

# 检查 .NET SDK 是否安装
if ! command -v dotnet &> /dev/null; then
    echo "错误: 未找到 .NET SDK"
    echo "请先安装 .NET 9 SDK: https://dotnet.microsoft.com/download/dotnet/9.0"
    exit 1
fi

# 显示版本
echo "检测到 .NET SDK 版本:"
dotnet --version

# 还原依赖
echo ""
echo "正在还原 NuGet 包..."
dotnet restore

if [ $? -ne 0 ]; then
    echo "依赖还原失败"
    exit 1
fi

# 构建项目
echo ""
echo "正在构建项目..."
dotnet build

if [ $? -ne 0 ]; then
    echo "项目构建失败"
    exit 1
fi

# 运行项目
echo ""
echo "正在启动应用..."
echo "应用将在 https://localhost:5001 运行"
echo "按 Ctrl+C 停止"
echo ""
dotnet run