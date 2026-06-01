# 公益物资捐赠入库与发放追踪系统

一个面向公益组织的全栈物资管理系统，支持捐赠批次管理、物资质检、仓储入库、受助对象申请、发放审批、签收回执和库存预警等完整业务流程。

## 技术栈

- **前端框架**: Remix 2.8 + React 18 + TypeScript
- **数据库**: SQLite + Prisma ORM
- **样式**: Tailwind CSS 3.4
- **表单验证**: Zod
- **日期处理**: date-fns
- **密码加密**: bcryptjs

## 功能特性

### 核心业务流程

1. **捐赠批次管理**
   - 创建捐赠批次（捐赠方、捐赠物资、预计数量）
   - 批次状态流转：待接收 → 已接收 → 质检中 → 已质检 → 入库中 → 已完成
   - 捐赠批次详情查看

2. **物资质检**
   - 逐物资质检登记
   - 质检结果：合格/不合格/待复检
   - 不合格原因记录
   - 质检报告生成

3. **仓储入库**
   - 质检合格物资入库
   - 自动关联库存记录
   - 入库单打印

4. **受助对象管理**
   - 受助对象档案（个人/家庭/机构）
   - 联系人信息
   - 申请历史记录

5. **发放申请与审批**
   - 项目社工提交发放申请
   - 机构负责人审批
   - 多级审批流程
   - 申请状态流转

6. **发放管理与签收回执**
   - 发放单创建
   - 出库确认
   - 送达确认
   - 签收登记（电子签名支持）
   - 签收回执存档

7. **库存视图与预警**
   - 实时库存查询
   - 库存预警阈值设置
   - 低库存自动预警
   - 库存变动日志

8. **异常反馈与处理**
   - 异常情况上报
   - 异常分类：物资损坏、数量不符、质量问题等
   - 异常处理流程
   - 处理结果记录

### 用户角色

1. **物资管理员 (ADMIN)**
   - 捐赠批次管理
   - 物资质检
   - 仓储入库
   - 库存管理
   - 异常处理

2. **项目社工 (SOCIAL_WORKER)**
   - 受助对象管理
   - 发放申请提交
   - 发放执行
   - 签收确认

3. **机构负责人 (MANAGER)**
   - 数据统计仪表盘
   - 发放审批
   - 异常审核
   - 库存预警查看

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 创建数据库表
npm run db:push

# 填充种子数据
npm run db:seed

# 或者一键执行
npm run db:setup
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

## 测试账号

系统预置了三个测试账号：

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 物资管理员 | admin | 123456 | 物资管理、质检、入库、库存、异常 |
| 项目社工 | worker | 123456 | 受助对象、申请、发放、签收 |
| 机构负责人 | manager | 123456 | 审批、统计、预警 |

## 项目结构

```
.
├── .server/                # 服务端专用模块
│   ├── db.server.ts       # Prisma 客户端单例
│   └── session.server.ts  # Session 管理
├── app/
│   ├── components/        # React 组件
│   │   ├── layout/       # 布局组件
│   │   └── ui/           # UI 基础组件
│   ├── routes/           # Remix 路由页面
│   ├── styles/           # 样式文件
│   ├── entry.client.tsx  # 客户端入口
│   ├── entry.server.tsx  # 服务端入口
│   └── root.tsx         # 根路由
├── prisma/
│   ├── schema.prisma     # 数据库模型
│   └── seed.ts          # 种子数据
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## 数据模型

### 核心数据表

1. **User** - 用户表
2. **DonationBatch** - 捐赠批次
3. **Material** - 物资基础信息
4. **DonationMaterial** - 捐赠物资明细
5. **Inspection** - 质检单
6. **InspectionItem** - 质检明细
7. **StockEntry** - 入库单
8. **StockEntryItem** - 入库明细
9. **Stock** - 库存记录
10. **Recipient** - 受助对象
11. **Application** - 发放申请
12. **ApplicationItem** - 申请明细
13. **Distribution** - 发放单
14. **DistributionItem** - 发放明细
15. **StockAlert** - 库存预警
16. **ExceptionRecord** - 异常记录

## 业务流程图

```
捐赠批次创建
    ↓
  待接收 → 已接收
    ↓
  质检中 → 已质检（合格/不合格）
    ↓（合格）
  入库中 → 已完成
    ↓
  库存更新
    ↓
受助对象申请 → 待审批 → 已批准/已拒绝
    ↓（已批准）
  创建发放单
    ↓
  待出库 → 已出库
    ↓
  运输中 → 已送达
    ↓
  待签收 → 已签收
    ↓
  完成
```

## 状态枚举

### 捐赠批次状态
- `PENDING_RECEIVE`: 待接收
- `RECEIVED`: 已接收
- `INSPECTING`: 质检中
- `INSPECTED`: 已质检
- `STOCKING`: 入库中
- `COMPLETED`: 已完成

### 质检结果
- `PASS`: 合格
- `FAIL`: 不合格
- `RECHECK`: 待复检

### 申请状态
- `DRAFT`: 草稿
- `PENDING_APPROVAL`: 待审批
- `APPROVED`: 已批准
- `REJECTED`: 已拒绝

### 发放状态
- `PENDING_OUTBOUND`: 待出库
- `OUTBOUND`: 已出库
- `IN_TRANSIT`: 运输中
- `DELIVERED`: 已送达
- `SIGNED`: 已签收

### 异常状态
- `OPEN`: 待处理
- `PROCESSING`: 处理中
- `RESOLVED`: 已解决
- `CLOSED`: 已关闭

## 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run typecheck  # TypeScript 类型检查
npm run db:generate # 生成 Prisma 客户端
npm run db:push    # 推送 schema 到数据库
npm run db:seed    # 填充种子数据
npm run db:reset   # 重置数据库
npm run db:setup   # 完整数据库初始化
```

## 安全特性

- 基于 Session 的用户认证
- 密码加密存储（bcrypt）
- 基于角色的访问控制（RBAC）
- 服务端表单验证（Zod）
- SQL 注入防护（Prisma 参数化查询）
- XSS 防护（React 自动转义）

## 响应式设计

系统支持多种设备：
- 桌面端（≥1024px）
- 平板（768px - 1023px）
- 移动端（<768px）

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 许可证

MIT License
