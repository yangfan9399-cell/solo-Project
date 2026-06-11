#!/bin/bash
# 快速启动脚本 - 酒店客房维修停卖与恢复售卖审核系统

set -e

echo "========================================"
echo "  酒店客房维修管理系统 - 启动脚本"
echo "========================================"

# 检查 Java
JAVA_CMD=""
if command -v java >/dev/null 2>&1; then
  JAVA_CMD="java"
elif [ -x "/opt/homebrew/opt/openjdk@17/bin/java" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
  JAVA_CMD="/opt/homebrew/opt/openjdk@17/bin/java"
elif [ -x "/usr/local/opt/openjdk@17/bin/java" ]; then
  export JAVA_HOME="/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  export PATH="/usr/local/opt/openjdk@17/bin:$PATH"
  JAVA_CMD="/usr/local/opt/openjdk@17/bin/java"
fi

if [ -z "$JAVA_CMD" ]; then
  echo "[ERROR] 未检测到 JDK 17，请先安装："
  echo "        macOS: brew install openjdk@17"
  exit 1
fi
echo "[OK] Java: $($JAVA_CMD -version 2>&1 | head -1)"
[ -n "$JAVA_HOME" ] && echo "[OK] JAVA_HOME: $JAVA_HOME"

# 检查 Maven
MVN_CMD=""
if command -v mvn >/dev/null 2>&1; then
  MVN_CMD="mvn"
elif [ -x "/opt/homebrew/bin/mvn" ]; then
  MVN_CMD="/opt/homebrew/bin/mvn"
elif [ -x "/usr/local/bin/mvn" ]; then
  MVN_CMD="/usr/local/bin/mvn"
elif [ -f "./mvnw" ]; then
  MVN_CMD="./mvnw"
fi

if [ -z "$MVN_CMD" ]; then
  echo "[ERROR] 未检测到 Maven，请先安装："
  echo "        macOS: brew install maven"
  exit 1
fi
echo "[OK] Maven: $MVN_CMD"

# 清理并编译运行
echo ""
echo "正在编译项目（首次运行可能需要几分钟下载依赖）..."
echo "----------------------------------------"

cd "$(dirname "$0")"
$MVN_CMD clean spring-boot:run -DskipTests
