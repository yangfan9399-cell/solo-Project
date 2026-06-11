#!/bin/bash
# 校园宿舍报修系统 - 启动脚本
# 自动检测并下载 Maven Wrapper，编译并启动应用

set -e

echo "========================================="
echo "  校园宿舍报修系统 - 启动脚本"
echo "========================================="
echo ""

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "❌ 未检测到 Java，请先安装 JDK 17 或更高版本"
    echo "   下载地址: https://adoptium.net/"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
echo "✅ Java 版本: $(java -version 2>&1 | head -n 1)"

# 检查 Maven
if command -v mvn &> /dev/null; then
    echo "✅ Maven 已安装，使用系统 Maven"
    MVN_CMD="mvn"
elif [ -f "./mvnw" ]; then
    echo "✅ 使用 Maven Wrapper"
    MVN_CMD="./mvnw"
else
    echo "⚠️  未找到 Maven，正在创建 Maven Wrapper..."
    if command -v mvn &> /dev/null; then
        mvn -N wrapper:wrapper -Dmaven=3.9.6
    else
        echo ""
        echo "需要手动安装 Maven 或下载 Maven Wrapper。"
        echo ""
        echo "方法1 - 安装 Maven:"
        echo "  macOS:   brew install maven"
        echo "  Linux:   sudo apt install maven"
        echo "  Windows: choco install maven"
        echo ""
        echo "方法2 - 下载 Maven Wrapper (需要网络):"
        echo "  访问 https://maven.apache.org/download.cgi 下载"
        echo ""
        exit 1
    fi
    MVN_CMD="./mvnw"
fi

echo ""
echo "🚀 正在编译并启动项目..."
echo "   首次启动会下载依赖，请耐心等待..."
echo ""
echo "📊 启动完成后访问:"
echo "   首页:     http://localhost:8080"
echo "   H2控制台: http://localhost:8080/h2-console"
echo ""
echo "💡 H2控制台连接信息:"
echo "   JDBC URL: jdbc:h2:mem:dorm_repair"
echo "   用户名:   sa"
echo "   密码:     (留空)"
echo ""
echo "停止服务请按 Ctrl+C"
echo "========================================="
echo ""

# 清理之前的进程
if [ -f "app.pid" ]; then
    OLD_PID=$(cat app.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  发现旧进程 PID=$OLD_PID，正在停止..."
        kill $OLD_PID 2>/dev/null || true
        sleep 2
    fi
    rm -f app.pid
fi

# 编译并启动
$MVN_CMD spring-boot:run \
    -Dspring-boot.run.arguments="--spring-boot.run.jvmArguments=-Xmx512m" \
    "$@"
