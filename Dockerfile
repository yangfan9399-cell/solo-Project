FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# 复制 Maven 相关文件
COPY pom.xml .
COPY src ./src

# 使用 Maven Wrapper 下载依赖并构建
RUN apk add --no-cache maven
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 复制构建产物
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
