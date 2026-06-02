# 高校宿舍维修报修与能耗异常核查系统

面向宿管员、维修师傅和后勤能源管理员的综合管理系统。

## 技术栈

- **前端框架**: Next.js 14 (App Router) + TypeScript
- **ORM**: Prisma
- **数据库**: SQLite
- **样式**: Tailwind CSS
- **图表**: Recharts
- **图标**: Lucide React

## 核心功能

### 1. 学生报修模块
- 学生提交报修申请（标题、描述、房间、分类、优先级）
- 报修单列表展示与搜索过滤
- 报修单详情查看
- 报修状态跟踪（待派单 → 已派单 → 处理中 → 已完成）

### 2. 宿舍设施台账
- 设施分类管理（水电、家具、空调、卫浴、门窗）
- 设施信息登记（名称、品牌、型号、位置）
- 设施状态跟踪（正常、待维修、已损坏、维护中）
- 设施统计概览

### 3. 维修派单与处理
- 宿管员派单给维修师傅
- 维修师傅接受并开始维修
- 维修完成确认（费用、备注）
- 维修状态流转日志

### 4. 能耗异常核查
- 能耗异常记录（用电异常、用水异常）
- 异常确认与驳回
- 异常处理与扣费
- 审核记录追踪

### 5. 楼栋风险看板
- 各楼栋维修与异常统计
- 风险等级评估（高、中、低）
- 数据可视化图表（饼图、折线图、柱状图）
- 高风险楼栋预警

### 6. 满意度回访
- 星级评分系统（响应速度、服务质量、维修质量）
- 满意度评价（非常满意 ~ 非常不满意）
- 评价建议收集
- 满意度统计分析

## 用户角色

| 角色 | 权限 |
|------|------|
| **宿管员** | 查看所有报修、派单、管理设施、查看能耗、查看风险看板 |
| **维修师傅** | 查看分配的任务、处理维修、更新状态 |
| **能源管理员** | 核查能耗异常、处理扣费、查看统计数据 |
| **学生** | 提交报修、查看自己的报修、填写满意度评价 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`（已提供默认配置）：

```env
DATABASE_URL="file:./dev.db"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate -- --name init

# 生成示例数据
npm run prisma:seed
```

或一键执行：

```bash
npm run db:setup
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   │   ├── repairActions.ts
│   │   ├── facilityActions.ts
│   │   └── energyActions.ts
│   ├── page.tsx           # 首页概览
│   ├── repairs/           # 报修管理
│   ├── facilities/        # 设施台账
│   ├── energy/            # 能耗管理
│   ├── dashboard/         # 风险看板
│   ├── surveys/           # 满意度调查
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── AppLayout.tsx
│   ├── RepairDetailModal.tsx
│   ├── AssignWorkerModal.tsx
│   ├── Loading.tsx
│   └── EmptyState.tsx
└── lib/                   # 工具库
    ├── prisma.ts          # Prisma Client
    ├── auth.ts            # 认证上下文
    └── utils.ts           # 工具函数
```

## 数据模型

### 核心表结构

- **User**: 用户表（宿管员、维修师傅、能源管理员、学生）
- **Building**: 楼栋表
- **Room**: 房间表
- **FacilityCategory**: 设施分类表
- **Facility**: 设施表
- **RepairOrder**: 报修单表
- **RepairStatusLog**: 报修状态流转日志
- **EnergyRecord**: 能耗记录表
- **EnergyAbnormal**: 能耗异常表
- **EnergyAudit**: 能耗审核表
- **SatisfactionSurvey**: 满意度调查表

## 示例账号

系统预置以下测试账号（登录时选择对应角色即可）：

| 角色 | 邮箱 | 姓名 |
|------|------|------|
| 宿管员 | admin@dorm.com | 张管理员 |
| 维修师傅 | worker1@dorm.com | 李师傅 |
| 维修师傅 | worker2@dorm.com | 王师傅 |
| 能源管理员 | energy@dorm.com | 刘能源 |
| 学生 | student1@dorm.com | 学生小明 |
| 学生 | student2@dorm.com | 学生小红 |

## 业务流程

### 报修流程

```
学生提交报修 → 宿管员派单 → 维修师傅到场处理 → 维修完成 → 学生满意度评价
```

### 能耗异常处理流程

```
系统检测异常 → 能源管理员确认 → 处理并扣费 → 异常解决
```

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm start            # 启动生产服务器
npm run lint         # 代码检查
npm run prisma:generate  # 生成 Prisma Client
npm run prisma:migrate   # 执行数据库迁移
npm run prisma:seed      # 生成示例数据
npm run db:setup         # 一键初始化数据库
```

## 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页概览 | `/` | 统计卡片、最近报修、异常提醒 |
| 报修管理 | `/repairs` | 报修列表、搜索筛选、新建报修、详情弹窗 |
| 设施台账 | `/facilities` | 设施列表、统计、筛选、新增设施 |
| 能耗管理 | `/energy` | 异常列表、详情查看、确认/驳回/扣费 |
| 风险看板 | `/dashboard` | 数据可视化、楼栋风险评估、预警 |
| 满意度调查 | `/surveys` | 评价列表、填写评价、统计图表 |

## 状态管理

### 报修状态

- `PENDING` - 待派单
- `ASSIGNED` - 已派单
- `IN_PROGRESS` - 处理中
- `COMPLETED` - 已完成
- `CANCELLED` - 已取消

### 能耗异常状态

- `DETECTED` - 已检测
- `CONFIRMED` - 已确认
- `RESOLVED` - 已解决
- `DISMISSED` - 已驳回

### 设施状态

- `NORMAL` - 正常
- `NEEDS_REPAIR` - 待维修
- `BROKEN` - 已损坏
- `MAINTENANCE` - 维护中

## 注意事项

1. 本项目使用 SQLite 数据库，适合开发和小规模部署
2. 生产环境建议更换为 PostgreSQL 或 MySQL
3. 当前认证系统为演示版本，生产环境建议使用 NextAuth.js
4. 图片上传功能需要额外配置存储服务

## License

MIT
