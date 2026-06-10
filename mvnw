#!/bin/sh
# Maven Wrapper 脚本

# 下载 maven-wrapper.jar
MAVEN_PROJECTBASEDIR="${MAVEN_BASEDIR:-$(dirname "$0")}"
MAVEN_OPTS="-Xmx256m"

# 尝试下载 maven-wrapper.jar
if [ ! -f "$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar" ]; then
    echo "下载 Maven Wrapper..."
    mkdir -p "$MAVEN_PROJECTBASEDIR/.mvn/wrapper"
    curl -L -o "$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar" \
        "https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar" 2>/dev/null || \
    wget -O "$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar" \
        "https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar" 2>/dev/null
fi

# 使用 wrapper.jar 或直接调用 mvn
if [ -f "$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar" ]; then
    exec java -jar "$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar" "$@"
else
    exec mvn "$@"
fi
