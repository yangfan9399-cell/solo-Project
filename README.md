# 社区养老上门服务预约与回访复核平台

基于 Remix + TypeScript + Drizzle ORM + PostgreSQL 构建的社区养老服务管理系统。

## 功能特性

### 📊 首页仪表板
- **今日待上门**：展示当天预约的上门服务列表
- **待回访复核**：等待复核人审核的服务记录
- **异常滞留记录**：未接听、时长冲突、家属投诉等异常情况

### 📋 四类业务样本
1. **正常完成** - 服务按时完成，老人满意，复核通过后归档
2. **老人未接听** - 上门时老人不在家或未接听，需二次回访确认
3. **服务时长冲突** - 实际服务时长与预约不符，需经办人补充说明
4. **家属投诉** - 家属投诉服务质量，需深入调查核实处理

### 🔄 回访复核流程
- **经办人**：补充服务记录、上传说明材料
- **复核人**：确认回访结论、退回补证
- **返工机制**：退回补证自动生成新的回访节点
- **归档记录**：只读查看，不可修改

### 📝 修改历史追踪
- 显示修改前后差异对比
- 记录责任人和修改时间
- 保存采用依据（修改原因）

## 技术栈

- **框架**: Remix 2.x
- **语言**: TypeScript
- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL
- **样式**: Tailwind CSS
- **构建工具**: Vite

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

复制 `.env.example` 为 `.env` 并修改数据库连接信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
DATABASE_URL=postgresql://username:password@localhost:5432/elderly_care
```

### 3. 创建数据库迁移

```bash
npm run db:generate
npm run db:migrate
```

### 4. 导入种子数据

```bash
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 项目结构

```
app/
├── db/
│   ├── schema.server.ts    # 数据库 Schema 定义
│   ├── index.server.ts     # 数据库连接配置
│   └── seed.ts             # 种子数据
├── routes/
│   ├── _index.tsx          # 首页仪表板
│   └── records.$id.tsx     # 服务记录详情页
├── root.tsx                # 根组件
├── entry.client.tsx        # 客户端入口
├── entry.server.tsx        # 服务端入口
└── tailwind.css            # 样式文件
```

## 数据库设计

### 核心表结构

- **users** - 用户表（经办人、复核人、管理员）
- **elders** - 老人信息表
- **staff** - 服务人员表
- **service_records** - 服务记录表（主表）
- **review_nodes** - 回访节点表（支持多轮回访）
- **change_logs** - 修改日志表（记录所有变更）

### 状态枚举

**服务状态**:
- `scheduled` - 待上门
- `in_progress` - 进行中
- `completed` - 已完成
- `no_answer` - 未接听
- `time_conflict` - 时长冲突
- `complaint` - 家属投诉
- `archived` - 已归档

**回访状态**:
- `pending` - 待复核
- `approved` - 已通过
- `rejected` - 已驳回
- `rework` - 需返工

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run typecheck    # TypeScript 类型检查
npm run lint         # 代码检查
npm run db:generate  # 生成数据库迁移
npm run db:migrate   # 执行数据库迁移
npm run db:seed      # 导入种子数据
npm run db:studio    # 打开 Drizzle Studio
```
