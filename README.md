# 设备点检异常停机与维修确认系统

## 项目概述

本系统是一个基于 ASP.NET Core 9 MVC + EF Core + SQL Server 的设备点检异常停机与维修确认系统，用于管理设备从点检异常、停机报修到维修复产的完整流程。

## 技术栈

- ASP.NET Core 9 MVC
- Entity Framework Core 9
- SQL Server
- Bootstrap 5

## 功能模块

### 1. 用户角色
- **操作工**：提交点检异常
- **班组长**：确认停机、转维修
- **维修员**：处理故障、完成维修
- **设备工程师**：验收维修、确认复产

### 2. 核心流程
1. 操作工提交点检异常
2. 班组长确认停机
3. 班组长转维修工单
4. 维修员开始维修
5. 维修员完成维修
6. 设备工程师验收
7. 设备工程师确认复产（备件齐全时）

### 3. 统计分析
- 按产线统计
- 按设备类型统计
- 按故障原因统计
- 按停机损失统计

## 预置样本数据

系统预置了4个典型场景的样本数据：

1. **正常复产** - A产线主电机轴承更换成功
2. **备件缺料** - B产线压缩机等待阀片备件（禁止复产确认）
3. **误报点检** - B产线传送带正常波动被驳回
4. **复产验收失败** - C产线循环泵振动超标未通过

## 测试用户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| operator | Password123! | 操作工 |
| teamleader | Password123! | 班组长 |
| maintenance | Password123! | 维修员 |
| engineer | Password123! | 设备工程师 |

## 运行步骤

1. **确保已安装 .NET 9 SDK**
2. **配置数据库连接**
   - 修改 `appsettings.json` 中的数据库连接字符串
   - 默认连接：`Server=localhost;Database=EquipmentMaintenance;Trusted_Connection=True;TrustServerCertificate=True;`

3. **运行项目**
   ```bash
   cd EquipmentMaintenanceSystem
   dotnet run
   ```

4. **访问系统**
   - 打开浏览器访问：https://localhost:5001
   - 使用测试用户登录

## 项目结构

```
EquipmentMaintenanceSystem/
├── Controllers/          # MVC控制器
│   ├── AccountController.cs
│   ├── HomeController.cs
│   ├── InspectionController.cs
│   ├── MaintenanceController.cs
│   └── StatisticsController.cs
├── Data/                 # 数据访问层
│   ├── ApplicationDbContext.cs
│   └── SeedData.cs
├── Models/               # 数据模型
│   ├── ApplicationUser.cs
│   ├── Equipment.cs
│   ├── EquipmentType.cs
│   ├── InspectionItem.cs
│   ├── InspectionRecord.cs
│   ├── InspectionHistory.cs
│   ├── MaintenanceOrder.cs
│   ├── MaintenanceHistory.cs
│   ├── MaintenanceSparePart.cs
│   ├── ProductionLine.cs
│   └── SparePart.cs
├── Services/             # 业务逻辑层
│   ├── IInspectionService.cs
│   ├── InspectionService.cs
│   ├── IMaintenanceService.cs
│   ├── MaintenanceService.cs
│   ├── IStatisticsService.cs
│   └── StatisticsService.cs
├── Views/                # 视图
│   ├── Account/
│   ├── Home/
│   ├── Inspection/
│   ├── Maintenance/
│   ├── Statistics/
│   ├── _Layout.cshtml
│   └── _ViewStart.cshtml
├── appsettings.json
├── EquipmentMaintenanceSystem.csproj
├── Program.cs
└── README.md
```

## 关键特性

1. **备件缺料禁止复产**：当维修工单关联的备件不可用时，禁止设备工程师确认复产
2. **完整的历史节点记录**：记录每个操作的时间、操作人、操作类型和备注
3. **停机损失计算**：自动计算停机时长和损失金额
4. **角色权限控制**：基于角色的访问控制，确保各角色只能执行对应操作