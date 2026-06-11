# 校园宿舍报修派单维修与满意度回访系统

基于 **Spring Boot 3 + Thymeleaf + H2/PostgreSQL** 的校园宿舍报修管理系统。

---

## 🚀 快速启动（最简单方式）

### 前置条件
- 安装 **JDK 17** 或更高版本（下载：https://adoptium.net/）
- 安装 **Maven 3.9+**（macOS: `brew install maven`，或下载：https://maven.apache.org/）

### 方式一：使用启动脚本（推荐）

**macOS / Linux:**
```bash
cd q-174
./start.sh
```

**Windows:**
```cmd
cd q-174
start.bat
```

### 方式二：手动命令启动

```bash
cd q-174
mvn spring-boot:run
```

### 启动后访问

| 页面 | 地址 |
|------|------|
| **登录页** | http://localhost:8080 |
| **H2 数据库控制台** | http://localhost:8080/h2-console |

**H2 控制台连接信息：**
- JDBC URL: `jdbc:h2:mem:dorm_repair`
- 用户名: `sa`
- 密码: （留空）

---

## 👥 预置演示账号

系统启动时自动创建以下用户，在登录页选择对应身份即可：

### 学生
| 用户名 | 姓名 | 学院 |
|--------|------|------|
| student1 | 张三 | 计算机学院 |
| student2 | 李四 | 电子工程学院 |
| student3 | 王五 | 机械工程学院 |
| student4 | 赵六 | 文学院 |

### 宿管
| 用户名 | 姓名 | 负责区域 |
|--------|------|----------|
| dorm1 | 刘宿管 | 学生宿舍1-3栋 |
| dorm2 | 陈宿管 | 学生宿舍4-6栋 |

### 维修工
| 用户名 | 姓名 | 组别 |
|--------|------|------|
| repair1 | 王师傅 | 水电维修组 |
| repair2 | 李师傅 | 综合维修组 |
| repair3 | 张师傅 | 木工家具组 |

### 后勤主管
| 用户名 | 姓名 | 部门 |
|--------|------|------|
| super1 | 周主管 | 后勤管理处 |

---

## 🔄 业务流程

### 完整生命周期
```
学生提交 → 宿管派单 → 维修工处理 → 后勤主管回访 → 关闭
               ↓            ↓
          维修超时     配件缺货
               ↓            ↓
          (继续处理)   (到货后继续)
               ↓
     学生不满意 → 禁止关闭 → 重新派单
```

### 各角色操作
1. **学生**: 提交报修 → 查看进度
2. **宿管**: 查看待派单列表 → 分配维修工
3. **维修工**: 开始维修 → [标记配件缺货] / [标记超时] → 完成维修
4. **后勤主管**: 标记超时 → 回访评价 → [满意] 关闭报修 / [不满意] 重新派单

### 关键规则
- ❌ **学生不满意禁止直接关闭**：回访选「不满意/非常不满意」后，状态变为 DISSATISFIED，只能重新派单
- ⏱️ **维修时长自动计算**：自动记录从开始到完成的分钟数
- 📝 **历史完整记录**：每个状态变更都有操作人、时间、备注

---

## 📊 预置样本数据

| 样本类型 | 数量 | 说明 |
|---------|------|------|
| ✅ 正常关闭 | 7条 | 覆盖1-6号楼，多种故障类型 |
| ⏱️ 维修超时 | 2条 | 配件延迟、人员不足 |
| 📦 配件缺货 | 1条 | 恒温阀芯缺货 |
| 😠 学生不满意 | 1条 | 门锁维修效果差 |
| 📥 已提交待派单 | 1条 | 窗户密封条 |
| 📤 已派单待维修 | 1条 | 网络接口 |
| 🔧 维修中 | 1条 | 下水道堵塞 |
| ✨ 已完成待回访 | 1条 | 窗帘轨道 |

---

## 📈 统计报表（后勤主管端）

访问 **统计报表** 页面查看：

1. **按楼栋统计**：报修总数、已完成数、超时数
2. **按故障类型统计**：数量 + 平均维修时长
3. **超时原因分布**：柱状图
4. **维修时长分布**：<30分 / 30-60分 / 1-2小时 / 2小时以上

---

## 🗄️ 数据库配置

### 默认：H2 嵌入式数据库（无需安装）
默认使用 H2 内存数据库，启动即可用，无需额外安装。

### 可选：切换到 PostgreSQL
编辑 `src/main/resources/application.properties`：
```properties
# 注释掉 H2 配置
# spring.datasource.url=jdbc:h2:mem:dorm_repair;...

# 取消注释 PostgreSQL 配置
spring.datasource.url=jdbc:postgresql://localhost:5432/dorm_repair
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver
```

---

## 📁 项目结构

```
q-174/
├── start.sh / start.bat          # 启动脚本
├── pom.xml                       # Maven 配置
└── src/main/
    ├── java/com/campus/dormrepair/
    │   ├── DormRepairApplication.java
    │   ├── config/DataInitializer.java      # 数据初始化
    │   ├── controller/                       # 4个角色Controller
    │   ├── service/                          # 业务逻辑
    │   ├── repository/                       # 数据访问层
    │   ├── entity/                           # 实体类
    │   ├── dto/                              # 统计DTO
    │   └── enums/                            # 枚举定义
    └── resources/
        ├── application.properties
        ├── static/css/style.css
        └── templates/                        # Thymeleaf 页面
            ├── login.html
            ├── student/                      # 学生端
            ├── dorm-manager/                 # 宿管端
            ├── repairman/                    # 维修工端
            ├── supervisor/                   # 主管端（含统计）
            └── repair/detail.html            # 统一详情页
```

---

## ⚙️ 技术栈

- **后端**: Spring Boot 3.2.5, Spring Data JPA, Validation
- **模板**: Thymeleaf
- **数据库**: H2 (默认) / PostgreSQL (可选)
- **前端**: 原生 HTML + CSS + JavaScript
- **构建**: Maven
