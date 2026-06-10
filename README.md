# 手术器械包清点灭菌与追溯系统

## 系统要求
- JDK 17+ 或 JDK 21
- PostgreSQL 12+
- Maven 3.8+

## 数据库设置
1. 创建 PostgreSQL 数据库：
```sql
CREATE DATABASE instrument_db;
```

2. 修改 `src/main/resources/application.yml` 中的数据库连接信息：
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/instrument_db
    username: postgres
    password: your_password
```

## 运行方式

### 方式一：Maven Wrapper（推荐）
```bash
# Linux/macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

### 方式二：传统 Maven
```bash
mvn clean compile spring-boot:run
```

### 方式三：打包后运行
```bash
mvn clean package -DskipTests
java -jar target/instrument-trace-1.0.0.jar
```

## 访问地址
- 首页：http://localhost:8080/
- 器械包列表：http://localhost:8080/packages
- 复盘统计：http://localhost:8080/review

## 功能说明

### 业务流程
1. **清点** - 供应室人员清点器械数量
2. **灭菌登记** - 灭菌员登记灭菌批次和有效期
3. **护士核收** - 护士核收器械包
4. **质控复核** - 质控人员复核放行
5. **发放** - 发放器械包（灭菌过期时禁止发放）

### 预置样本数据
- **正常放行** (PKG-NORM-001) - 普通外科器械包，已完成全部流程
- **器械缺失** (PKG-MISS-001) - 骨科器械包，骨钻缺失
- **灭菌过期** (PKG-EXPI-001) - 妇产科器械包，灭菌批次过期
- **手术室退回** (PKG-RET-001) - 神经外科器械包，手术取消退回

## 项目结构
```
src/main/java/com/example/instrument/
├── InstrumentTraceApplication.java    # 启动类
├── controller/                        # 控制器层
│   ├── HomeController.java           # 首页
│   ├── InstrumentPackageController.java  # 器械包管理
│   └── ReviewController.java         # 复盘统计
├── service/                          # 业务逻辑层
│   ├── InventoryService.java         # 清点服务
│   ├── SterilizationService.java     # 灭菌服务
│   ├── ReceiveService.java           # 核收服务
│   ├── ReviewService.java            # 质控复核服务
│   ├── IssueService.java              # 发放服务
│   └── AbnormalService.java          # 异常处理服务
├── repository/                       # 数据访问层
├── entity/                           # 实体类
└── util/                             # 工具类
    └── StatusHelper.java             # 状态转换工具
```

## 状态说明
| 状态 | 说明 |
|------|------|
| PENDING_INVENTORY | 待清点 |
| INVENTORY_COMPLETED | 清点完成 |
| PENDING_STERILIZATION | 待灭菌 |
| STERILIZATION_COMPLETED | 灭菌完成 |
| PENDING_RECEIVE | 待核收 |
| RECEIVED | 已核收 |
| PENDING_REVIEW | 待复核 |
| RELEASED | 已放行 |
| ISSUED | 已发放 |
| RETURNED | 已退回 |
| ABNORMAL | 异常 |
