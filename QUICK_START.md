# 影院放映设备巡检系统 - 启动指南

## 快速启动（5分钟）

### 步骤 1：安装依赖（如果未安装）

在终端中执行以下命令：

```bash
# 安装 Java 21
brew install openjdk@21

# 安装 Maven
brew install maven

# 启动 PostgreSQL
brew services start postgresql
```

### 步骤 2：配置环境变量

```bash
# 设置 Java 环境（添加到 ~/.zshrc 以永久生效）
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$JAVA_HOME/bin:$PATH"

# 验证 Java 安装
java -version
# 应该显示: openjdk version "21.0.x"

# 验证 Maven 安装
mvn -version
# 应该显示: Apache Maven 3.9.x
```

### 步骤 3：创建数据库

```bash
# 创建数据库
createdb cinema_inspection

# 或使用 psql
psql -U postgres -c "CREATE DATABASE cinema_inspection;"
```

### 步骤 4：启动应用

```bash
cd /Users/yangfan/Desktop/trae-solo-generated-projects/q-159

# 方式 1：直接运行（推荐）
mvn spring-boot:run

# 方式 2：使用启动脚本
chmod +x install-and-start.sh
./install-and-start.sh

# 方式 3：先打包再运行
mvn clean package -DskipTests
java -jar target/cinema-inspection-1.0.0.jar
```

### 步骤 5：验证应用

应用启动后，打开浏览器访问：

1. **数据看板**: http://localhost:8080/
2. **场次列表**: http://localhost:8080/screenings
3. **场次详情**: http://localhost:8080/screenings/1
4. **影厅统计**: http://localhost:8080/dashboard/halls

## 常见问题

### 1. Java 未找到
```bash
# 查找 Java 安装位置
ls /opt/homebrew/opt/openjdk@21/

# 手动设置路径
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

### 2. 数据库连接失败
```bash
# 检查 PostgreSQL 状态
pg_isready -h localhost -p 5432

# 如果未运行，启动它
brew services start postgresql

# 创建数据库
createdb cinema_inspection
```

### 3. 端口被占用
```bash
# 查看 8080 端口占用
lsof -i :8080

# 如果被占用，可以停止占用进程，或修改 application.yml 中的端口
```

### 4. Maven 编译错误
```bash
# 清理并重新编译
mvn clean compile

# 如果依赖下载失败，尝试
mvn dependency:resolve
```

## 预期输出

启动成功时，终端应该显示：

```
===========================================
 :::::::: :::::::::: :::::::::: :::::::: 
    :/:        :_:    :_:+:      :+/ :+:
    /:/        :+      +:/+:+/: /:/+:+/:  
   /:/        :+      +:/+:/+:/+:/+:/+:/+/
  /:///+/:    :+      +:/+:/+://+://+://+:
 :///:///:  ::/:::/ ::/:::/ :///:////:///
 :///:///: ::/://:  ::/://:  :///:////:///
 ::::::::: :::: :::: :::: :::: :::: :::: 
 :: https://spring.io/projects/spring-boot ::
 
2026-xx-xx xxxx:xx:xx.xxx  INFO xxxxx --- [  main] c.e.c.CinemaInspectionApplication  : Starting CinemaInspectionApplication...
2026-xx-xx xxxx:xx:xx.xxx  INFO xxxxx --- [  main] c.e.c.CinemaInspectionApplication  : Started CinemaInspectionApplication in xx seconds
```

## 页面验证

访问 http://localhost:8080/screenings/1 应该看到：

- **影厅信息**: 影厅名称、设备状态（正常/故障）
- **影片信息**: 电影名称、时长
- **场次信息**: 放映时间、票价、状态
- **中断时长**: 每次中断的持续时间（分钟）
- **历史节点**: 巡检记录和中断记录的完整时间线

## 预置数据

系统会自动创建以下测试数据：

- **影院**: 星光影城
- **影厅**: 
  - 1号厅（设备正常）
  - 2号厅（设备故障）
- **影片**: 
  - 《流浪地球2》
  - 《满江红》
- **场次**: 多个正常和中断状态的场次
- **中断记录**: 
  - 放映机故障（已恢复）
  - 音响异常（未处理）
- **补偿记录**: 待审核和已归档的补偿

## 关闭应用

在终端按 `Ctrl+C` 可以停止应用。
