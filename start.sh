#!/bin/bash
# 自动安装和启动脚本

echo "================================"
echo "影院放映设备巡检系统 - 启动脚本"
echo "================================"
echo ""

# 检查 Java
check_java() {
    if command -v java >/dev/null 2>&1; then
        echo "✓ Java 已安装: $(java -version 2>&1 | head -1)"
        return 0
    else
        echo "✗ Java 未安装"
        return 1
    fi
}

# 检查 Maven
check_maven() {
    if command -v mvn >/dev/null 2>&1; then
        echo "✓ Maven 已安装: $(mvn -version 2>&1 | head -1)"
        return 0
    else
        echo "✗ Maven 未安装"
        return 1
    fi
}

# 检查 PostgreSQL
check_postgres() {
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo "✓ PostgreSQL 已运行"
        return 0
    else
        echo "✗ PostgreSQL 未运行"
        return 1
    fi
}

# 检查数据库
check_database() {
    if psql -h localhost -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw cinema_inspection; then
        echo "✓ 数据库 cinema_inspection 已存在"
        return 0
    else
        echo "✗ 数据库 cinema_inspection 不存在，正在创建..."
        createdb -h localhost -U postgres cinema_inspection 2>/dev/null && echo "✓ 数据库已创建" || echo "✗ 数据库创建失败"
        return 0
    fi
}

echo "检查环境..."
echo ""

check_java || {
    echo ""
    echo "请安装 Java 21:"
    echo "  macOS: brew install openjdk@21"
    echo "  Ubuntu/Debian: sudo apt install openjdk-21-jdk"
    echo "  Windows: 从 https://adoptium.net 下载安装"
    echo ""
    exit 1
}

check_maven || {
    echo ""
    echo "请安装 Maven:"
    echo "  macOS: brew install maven"
    echo "  Ubuntu/Debian: sudo apt install maven"
    echo "  Windows: 从 https://maven.apache.org/download.cgi 下载"
    echo ""
    exit 1
}

check_postgres || {
    echo ""
    echo "请启动 PostgreSQL:"
    echo "  macOS: brew services start postgresql@17"
    echo "  Ubuntu/Debian: sudo systemctl start postgresql"
    echo ""
    exit 1
}

check_database

echo ""
echo "================================"
echo "环境检查完成！"
echo "================================"
echo ""
echo "启动应用..."
echo ""

# 启动 Spring Boot
mvn spring-boot:run
