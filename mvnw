#!/bin/sh
# Maven Wrapper 脚本 - 标准版
# 用法: ./mvnw [maven arguments]

# 设置 Maven Wrapper 目录
MAVEN_PROJECTBASEDIR="${MAVEN_BASEDIR:-$(dirname "$0")}"
MAVEN_PROJECTBASEDIR="$(cd "$MAVEN_PROJECTBASEDIR" && pwd)"
MAVEN_CONF="$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.properties"

# 读取配置
if [ -f "$MAVEN_CONF" ]; then
    . "$MAVEN_CONF"
fi

# 设置默认值
: "${distributionUrl:=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip}"
: "${wrapperUrl:=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar}"

# 创建 wrapper 目录
WRAPPER_DIR="$MAVEN_PROJECTBASEDIR/.mvn/wrapper"
mkdir -p "$WRAPPER_DIR"

# 下载 maven-wrapper.jar
WRAPPER_JAR="$WRAPPER_DIR/maven-wrapper.jar"
if [ ! -f "$WRAPPER_JAR" ]; then
    echo "下载 Maven Wrapper..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL -o "$WRAPPER_JAR" "$wrapperUrl"
    elif command -v wget >/dev/null 2>&1; then
        wget -q -O "$WRAPPER_JAR" "$wrapperUrl"
    else
        echo "错误: 需要 curl 或 wget 来下载 Maven Wrapper"
        exit 1
    fi
fi

# 执行 Maven
if [ -f "$WRAPPER_JAR" ]; then
    exec java -jar "$WRAPPER_JAR" "$@"
else
    echo "错误: 无法找到 maven-wrapper.jar"
    exit 1
fi
