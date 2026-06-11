#!/bin/bash
# ============================================================
# 校园宿舍报修系统 - 一键启动脚本
# 仅需 Java 17+，Maven Wrapper 会自动下载
# ============================================================
set -e

echo "========================================="
echo "  校园宿舍报修系统 - 一键启动"
echo "========================================="
echo ""

# ---- 检查 Java ----
if [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
    # 尝试从常见位置寻找 Java
    for candidate in \
        "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
        "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" \
        "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" \
        "$(dirname "$(dirname "$(readlink -f "$(which java)" 2>/dev/null)" 2>/dev/null)" 2>/dev/null)"; do
        if [ -x "$candidate/bin/java" ]; then
            export JAVA_HOME="$candidate"
            break
        fi
    done
fi

# 尝试 macOS java_home
if [ -z "$JAVA_HOME" ] && [ -x "/usr/libexec/java_home" ]; then
    JAVA_HOME=$(/usr/libexec/java_home 2>/dev/null) && export JAVA_HOME || true
fi

# 检查是否可用
JAVACMD=""
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVACMD="$JAVA_HOME/bin/java"
elif command -v java &> /dev/null; then
    JAVACMD="java"
fi

if [ -z "$JAVACMD" ]; then
    echo "❌ 未检测到 Java，正在尝试通过 Homebrew 安装 OpenJDK 17..."
    if command -v brew &> /dev/null; then
        HOMEBREW_NO_REQUIRE_TAP_TRUST=1 brew install openjdk@17 2>&1
        export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
        if [ ! -x "$JAVA_HOME/bin/java" ]; then
            export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
        fi
        JAVACMD="$JAVA_HOME/bin/java"
    else
        echo ""
        echo "❌ 无法自动安装 Java，请手动安装 JDK 17+："
        echo "   macOS:  brew install openjdk@17"
        echo "   或访问: https://adoptium.net/"
        echo ""
        exit 1
    fi
fi

JAVA_VER=$($JAVACMD -version 2>&1 | head -n 1)
echo "✅ Java: $JAVA_VER"

# ---- 确定项目目录 ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ---- 选择 Maven 命令 ----
MVN_CMD=""
if [ -f "./mvnw" ]; then
    MVN_CMD="./mvnw"
    echo "✅ 使用项目内置 Maven Wrapper"
elif command -v mvn &> /dev/null; then
    MVN_CMD="mvn"
    echo "✅ 使用系统 Maven"
else
    echo "⚠️  未找到 mvnw 或系统 Maven，正在生成 Maven Wrapper..."
    # 用 Java 直接下载 maven-wrapper.jar
    WRAPPER_DIR="./.mvn/wrapper"
    WRAPPER_JAR="$WRAPPER_DIR/maven-wrapper.jar"
    WRAPPER_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
    MAVEN_URL="https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.tar.gz"

    if [ ! -f "$WRAPPER_JAR" ]; then
        echo "   下载 Maven Wrapper..."
        mkdir -p "$WRAPPER_DIR"
        if command -v curl &> /dev/null; then
            curl -fSL -o "$WRAPPER_JAR" "$WRAPPER_URL"
        elif command -v wget &> /dev/null; then
            wget -O "$WRAPPER_JAR" "$WRAPPER_URL"
        fi
    fi

    if [ -f "$WRAPPER_JAR" ]; then
        chmod +x ./mvnw 2>/dev/null || true
        MVN_CMD="./mvnw"
        echo "✅ Maven Wrapper 已就绪"
    else
        echo "❌ 无法获取 Maven Wrapper，请检查网络连接"
        exit 1
    fi
fi

echo ""
echo "🚀 正在编译并启动（首次会下载依赖，约1-3分钟）..."
echo ""
echo "📊 启动后访问:"
echo "   登录页:    http://localhost:8080"
echo "   H2控制台:  http://localhost:8080/h2-console"
echo ""
echo "💡 H2连接: jdbc:h2:mem:dorm_repair  用户: sa  密码: (空)"
echo "   停止: Ctrl+C"
echo "========================================="
echo ""

exec $MVN_CMD spring-boot:run "$@"
