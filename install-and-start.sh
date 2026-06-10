#!/bin/bash
# 影院放映设备巡检系统 - 一键安装和启动脚本

set -e

echo "==============================================="
echo "影院放映设备巡检系统 - 安装和启动脚本"
echo "==============================================="
echo ""

# 1. 检查并安装 Java 21
check_java() {
    if command -v java &>/dev/null; then
        VERSION=$(java -version 2>&1 | head -1 | awk '{print $3}' | tr -d '"' | awk -F. '{print $1}')
        if [ "$VERSION" -ge 21 ] 2>/dev/null; then
            echo "✓ Java $(java -version 2>&1 | head -1) 已安装"
            return 0
        fi
    fi
    return 1
}

if ! check_java; then
    echo "正在安装 Java 21..."
    
    # 检测系统包管理器
    if command -v brew &>/dev/null; then
        echo "使用 Homebrew 安装..."
        brew install openjdk@21
        # 创建符号链接到 /usr/local
        sudo ln -sf /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java /usr/local/bin/java 2>/dev/null || \
        ln -sf /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home/bin/java ~/Library/Java/JavaVirtualMachines/openjdk-21.jdk/Contents/Home/bin/java
        
        # 设置 JAVA_HOME
        export JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || echo '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home')"
        export PATH="$JAVA_HOME/bin:$PATH"
        echo "✓ Java 21 安装完成"
    elif command -v apt-get &>/dev/null; then
        echo "使用 apt-get 安装..."
        sudo apt-get update
        sudo apt-get install -y openjdk-21-jdk
        export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
        export PATH="$JAVA_HOME/bin:$PATH"
        echo "✓ Java 21 安装完成"
    else
        echo "✗ 无法自动安装 Java。请手动安装 Java 21 后重试。"
        echo "下载地址: https://adoptium.net/ 或 https://www.oracle.com/java/technologies/downloads/"
        exit 1
    fi
fi

# 2. 检查并安装 Maven
check_maven() {
    if command -v mvn &>/dev/null; then
        echo "✓ Maven $(mvn -version | head -1) 已安装"
        return 0
    fi
    return 1
}

if ! check_maven; then
    echo "正在安装 Maven..."
    
    if command -v brew &>/dev/null; then
        echo "使用 Homebrew 安装..."
        brew install maven
        echo "✓ Maven 安装完成"
    elif command -v apt-get &>/dev/null; then
        echo "使用 apt-get 安装..."
        sudo apt-get install -y maven
        echo "✓ Maven 安装完成"
    else
        echo "✗ 无法自动安装 Maven。请手动安装 Maven 后重试。"
        echo "下载地址: https://maven.apache.org/download.cgi"
        exit 1
    fi
fi

# 3. 检查 PostgreSQL
check_postgres() {
    if command -v pg_isready &>/dev/null; then
        if pg_isready -h localhost -p 5432 &>/dev/null; then
            echo "✓ PostgreSQL 已运行"
            return 0
        fi
    fi
    return 1
}

if ! check_postgres; then
    echo "正在启动 PostgreSQL..."
    
    if command -v brew &>/dev/null; then
        brew services start postgresql@17 2>/dev/null || \
        brew services start postgresql 2>/dev/null || \
        echo "请手动启动 PostgreSQL: brew services start postgresql"
    elif command -v systemctl &>/dev/null; then
        sudo systemctl start postgresql
    fi
fi

# 4. 创建数据库
echo "检查数据库..."
if ! psql -h localhost -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw cinema_inspection; then
    echo "创建数据库 cinema_inspection..."
    createdb -h localhost -U postgres cinema_inspection 2>/dev/null || \
    sudo -u postgres createdb cinema_inspection 2>/dev/null || \
    echo "请手动创建数据库: createdb -h localhost -U postgres cinema_inspection"
fi

# 5. 设置环境变量
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 21 2>/dev/null || echo '/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home')}"
export PATH="$JAVA_HOME/bin:$PATH"

# 6. 启动应用
echo ""
echo "==============================================="
echo "环境准备完成！启动应用..."
echo "==============================================="
echo ""

cd "$(dirname "$0")"

# 编译并启动
mvn spring-boot:run
