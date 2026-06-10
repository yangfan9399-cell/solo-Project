# 跨校区教室借用审批与设备归还核验系统

## 系统概述

一个完整的跨校区教室借用审批与设备归还核验管理系统，支持从借用申请、审批排期、设备交接到归还核验的完整流程。

## 技术栈

- **前端框架**: Remix + React + TypeScript
- **样式方案**: Tailwind CSS
- **数据库**: SQLite + Prisma ORM
- **运行环境**: Node.js 20+

## 功能特性

### 1. 申请管理
- 提交借用申请（选择校区、教室、时间段、用途）
- 查看申请列表和状态
- 时间冲突实时检测

### 2. 审批工作台
- 校区管理员审批申请
- 时间冲突检测与阻断
- 显示可选替代教室

### 3. 设备管理
- 设备列表查看
- 设备交接确认
- 交接清单管理

### 4. 归还核验
- 归还核验操作
- 清洁检查
- 异常登记（设备遗失、清洁不合格等）

### 5. 统计报表
- 按校区统计使用率
- 按教室类型统计
- 按异常原因分类统计
- 完成率分析

## 预置样本数据

系统预置了5个样本场景：

| 样本ID | 场景 | 状态 | 异常 |
|--------|------|------|------|
| APP001 | 正常借用与归还 | 已完成 | 无 |
| APP002 | 设备遗失 | 已完成 | 设备遗失 |
| APP003 | 时间冲突 | 已取消 | 时间冲突 |
| APP004 | 清洁不合格 | 已完成 | 清洁不合格 |
| APP005 | 多校区借用 | 使用中 | 无 |

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 生成 Prisma Client

```bash
npx prisma generate
```

### 3. 初始化数据库

使用SQLite命令：

```bash
sqlite3 prisma/dev.db ".read prisma/init.sql"
sqlite3 prisma/dev.db ".read prisma/seed.sql"
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 路由结构

- `/` - 首页仪表盘
- `/applications` - 申请管理
- `/applications/:id` - 申请详情
- `/admin` - 审批工作台
- `/admin/approve/:id` - 审批操作
- `/equipment` - 设备管理
- `/equipment/handover/:id` - 设备交接
- `/verify` - 归还核验列表
- `/verify/:id` - 归还核验操作
- `/stats` - 统计报表

## 申请状态流转

```
待审批 → 已审批 → 设备已交接 → 使用中 → 待归还 → 已完成
    ↓
  已拒绝/已取消
```

## 数据库表结构

- **Campus** - 校区信息
- **Classroom** - 教室信息
- **Equipment** - 设备信息
- **BorrowApplication** - 借用申请
- **EquipmentHandover** - 设备交接记录
- **ReturnVerification** - 归还核验记录
- **ApplicationHistory** - 申请历史记录

## 核心业务逻辑

### 时间冲突检测

系统会在以下场景进行时间冲突检测：
1. 提交新申请时
2. 审批申请时

检测逻辑：
- 查询该教室在选定时间段是否已有审批通过的借用记录
- 若有冲突，阻断提交/审批
- 自动查询并推荐同校区可用教室列表

### 异常处理

系统支持以下异常类型：
- **设备遗失** (EQUIPMENT_LOST)
- **清洁不合格** (CLEANING_FAILED)
- **设备损坏** (DAMAGE)
- **其他** (OTHER)

## 目录结构

```
app/
├── components/          # UI组件
│   └── ui/            # 基础UI组件
├── routes/            # 路由页面
├── db/                # 数据库客户端
└── styles/            # 样式文件

prisma/
├── schema.prisma      # 数据库Schema
├── seed.sql          # 种子数据
└── init.sql          # 数据库初始化SQL
```

## 注意事项

1. 数据库使用SQLite，文件位于 `prisma/dev.db`
2. 预置数据包含完整的业务流程示例
3. 系统使用Tailwind CSS进行样式管理
4. 所有路由都支持移动端响应式布局

## 许可证

MIT License
