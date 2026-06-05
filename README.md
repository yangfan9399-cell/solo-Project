# 商场商户装修申请与消防验收平台

基于 Vue 3 + TypeScript + Vite + Fastify + Prisma + PostgreSQL 的全栈应用平台。

## 功能特性

- **商户装修申请流程**: 从申请提交到消防验收归档的完整流程
- **角色分工**:
  - 招商主管: 负责申请资料审核和施工时段确认
  - 工程人员: 现场检查登记
  - 消防复核人: 消防验收确认、退回或归档
- **预置样本数据**:
  - ✅ 正常验收样本 (星巴克)
  - 📋 图纸缺失样本 (优衣库)
  - ⏰ 施工时间冲突样本 (海底捞 vs 临时促销)
  - 🔧 消防整改样本 (苹果零售店)

## 核心功能

1. **申请管理**: 新建、查看、筛选装修申请
2. **时间冲突检测**: 自动检测同一铺位的施工时间冲突
3. **验收节点流程**:
   - 投资主管审核
   - 工程人员现场检查
   - 消防复核
   - 整改复检 (如有需要)
   - 归档
4. **详情页面**: 展示商户、铺位、图纸、施工计划、消防意见、责任人和历史节点
5. **归档只读**: 归档后申请变为只读状态
6. **整改机制**: 消防整改会生成新的验收节点

## 项目结构

```
.
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── lib/            # 工具库 (Prisma client)
│   │   ├── routes/         # API 路由
│   │   └── server.ts       # Fastify 服务器入口
│   ├── prisma/
│   │   ├── schema.prisma   # 数据库模型
│   │   └── seed.ts         # 样本数据
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── api/            # API 封装
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── router/         # 路由配置
│   │   └── main.ts         # 应用入口
│   └── package.json
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 13
- npm

### 安装依赖

```bash
npm run install:all
```

### 数据库配置

1. 确保 PostgreSQL 服务正在运行
2. 创建数据库:
   ```sql
   CREATE DATABASE fire_acceptance;
   ```
3. 修改 `backend/.env` 中的数据库连接信息

### 初始化数据库

```bash
# 推送数据库模型
npm run db:push

# 导入样本数据
npm run db:seed
```

### 启动开发服务

```bash
# 启动后端 (端口 3001)
npm run dev:backend

# 启动前端 (端口 3000)
npm run dev:frontend
```

### 访问应用

打开浏览器访问: http://localhost:3000

## 预置用户账号

| 角色 | 姓名 | 邮箱 |
|------|------|------|
| 招商主管 | 张明 | zhang.manager@mall.com |
| 工程人员 | 李强 | li.engineer@mall.com |
| 消防复核人 | 王芳 | wang.inspector@mall.com |

## 预置商户数据

1. **星巴克咖啡** - 1F-001 - 已归档 (正常验收样本)
2. **优衣库** - 2F-005 - 图纸缺失样本
3. **海底捞火锅** - 3F-012 - 时间冲突样本
4. **苹果零售店** - 1F-008 - 消防整改样本

## API 接口文档

### 申请相关

- `GET /api/applications` - 获取申请列表
- `GET /api/applications/:id` - 获取申请详情
- `POST /api/applications` - 创建申请
- `POST /api/applications/check-time-conflict` - 检查时间冲突
- `PUT /api/applications/:id/investment-review` - 投资主管审核
- `PUT /api/applications/:id/engineer-inspection` - 工程人员检查
- `PUT /api/applications/:id/fire-inspection` - 消防复核
- `PUT /api/applications/:id/rectification-complete` - 完成整改
- `PUT /api/applications/:id/archive` - 归档
- `PUT /api/applications/:id/reschedule` - 调整施工时间

### 其他接口

- `GET /api/merchants` - 商户列表
- `GET /api/shop-units` - 铺位列表
- `GET /api/users` - 用户列表
- `GET /api/users/role/:role` - 按角色获取用户

## 技术栈

**前端:**
- Vue 3 (Composition API)
- TypeScript
- Vite
- Vue Router
- Axios

**后端:**
- Fastify
- Prisma ORM
- TypeScript
- Zod (验证)
- PostgreSQL

## 状态流转

```
DRAFT (草稿)
  ↓
SUBMITTED (已提交) → 投资主管审核
  ↓
INVESTMENT_REVIEWED (投资已审核) → 工程人员检查
  ↓
ENGINEER_INSPECTED (工程已检查) → 消防复核
  ↓
FIRE_PASSED (消防通过)
  ↓
ARCHIVED (已归档)

NEEDS_RECTIFICATION → 生成新节点 → 整改复核
DRAWINGS_MISSING → 退回 SUBMITTED
TIME_CONFLICT → 阻断审批，改期路径
```
