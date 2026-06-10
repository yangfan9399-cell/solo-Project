# 影院放映设备巡检系统 - 启动说明

## 环境要求

### 1. 安装 Java 21
```bash
# macOS 使用 brew
brew install openjdk@21

# 设置 JAVA_HOME
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home' >> ~/.zshrc
source ~/.zshrc

# 验证
java -version
```

### 2. 安装 Maven
```bash
# macOS 使用 brew
brew install maven

# 验证
mvn -version
```

### 3. 确保 PostgreSQL 运行
```bash
# 检查 PostgreSQL 状态
pg_isready -h localhost -p 5432

# 如果没有运行，启动它
brew services start postgresql@17

# 创建数据库
createdb cinema_inspection
```

## 启动应用

### 方式一：使用 Maven（推荐）
```bash
cd cinema-inspection
mvn spring-boot:run
```

### 方式二：使用 Maven Wrapper
```bash
cd cinema-inspection
chmod +x mvnw
./mvnw spring-boot:run
```

### 方式三：先打包再运行
```bash
cd cinema-inspection
mvn clean package -DskipTests
java -jar target/cinema-inspection-1.0.0.jar
```

## 验证页面

启动后访问以下地址：

1. **数据看板首页**: http://localhost:8080/
2. **场次列表**: http://localhost:8080/screenings
3. **场次详情页**: http://localhost:8080/screenings/1
4. **影厅统计**: http://localhost:8080/dashboard/halls
5. **中断记录**: http://localhost:8080/interrupts
6. **补偿管理**: http://localhost:8080/compensations

## 预置数据

系统会自动初始化以下样本数据：

- **影院**: 星光影城
- **影厅**: 1号厅（正常）、2号厅（故障）
- **影片**: 《流浪地球2》、《满江红》
- **场次**: 包含正常放映、已中断等状态
- **巡检记录**: 值班经理王经理提交的巡检
- **中断记录**: 
  - 放映机故障（已恢复）
  - 音响异常（未处理）
- **补偿记录**: 待审核补偿和已归档补偿

## 数据库配置

如果需要修改数据库配置，编辑 `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/cinema_inspection
    username: postgres
    password: your_password
```

## 故障排查

### 1. 数据库连接失败
- 确保 PostgreSQL 正在运行
- 检查用户名和密码是否正确
- 确认数据库 `cinema_inspection` 已创建

### 2. 端口被占用
```bash
# 查看 8080 端口占用
lsof -i :8080

# 如果被占用，使用其他端口
# 修改 application.yml 中的 server.port
```

### 3. Thymeleaf 模板错误
- 检查 HTML 文件语法是否正确
- 确保所有必要的模型属性都已传递

## 功能说明

### 角色权限
1. **值班经理**: 提交设备巡检
2. **放映员**: 记录放映中断
3. **设备工程师**: 处理故障并恢复放映
4. **客服主管**: 审核观众补偿

### 核心流程
1. 场次开始前 → 值班经理巡检 → 设备正常 → 开始放映
2. 放映中出现问题 → 放映员报告中断 → 系统自动停售后续场次
3. 设备工程师修复 → 恢复放映 → 系统自动恢复售票
4. 中断处理后 → 客服提交补偿 → 主管审核 → 归档
