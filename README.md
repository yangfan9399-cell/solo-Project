# 古籍修复馆纸张病害诊断与修复排程系统

## 项目概述

这是一个面向古籍修复馆的全栈管理系统，用于纸张病害诊断、修复工序排程、专家复核和档案管理。

### 技术栈

**后端**
- Rust 1.70+
- Rocket 0.5 Web 框架
- SQLite 数据库
- rusqlite ORM

**前端**
- Qwik City 1.4+
- TypeScript 5.3+
- Tailwind CSS 3.4+
- Vite 5.0+

### 业务角色

| 角色 | 权限 |
|------|------|
| 修复师 | 病害诊断、修复工序执行、排程查看、材料领用 |
| 馆藏管理员 | 古籍入库、材料管理、档案统计、排程管理 |
| 外聘专家 | 专家复核、病害诊断查看、档案查阅 |

---

## 目录结构

```
.
├── backend/                    # Rust 后端
│   ├── src/
│   │   ├── bin/
│   │   │   └── seed.rs        # 数据初始化脚本
│   │   ├── handlers/           # API 处理器
│   │   │   ├── mod.rs
│   │   │   ├── users.rs
│   │   │   ├── books.rs
│   │   │   ├── diseases.rs
│   │   │   ├── processes.rs
│   │   │   ├── materials.rs
│   │   │   ├── reviews.rs
│   │   │   ├── archives.rs
│   │   │   └── schedules.rs
│   │   ├── models/             # 数据模型
│   │   │   ├── mod.rs
│   │   │   ├── user.rs
│   │   │   ├── book.rs
│   │   │   ├── disease.rs
│   │   │   ├── process.rs
│   │   │   ├── material.rs
│   │   │   ├── review.rs
│   │   │   ├── archive.rs
│   │   │   └── schedule.rs
│   │   ├── db.rs               # 数据库连接
│   │   ├── schema.rs           # Schema 占位
│   │   └── main.rs             # 应用入口
│   ├── schema.sql              # 数据库表结构
│   ├── Cargo.toml
│   ├── Rocket.toml
│   └── .env
├── frontend/                   # Qwik City 前端
│   ├── src/
│   │   ├── components/         # 组件
│   │   │   ├── layout/
│   │   │   ├── ui/
│   │   │   └── router-head/
│   │   ├── routes/             # 页面路由
│   │   │   ├── index.tsx       # 工作台
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   ├── books/
│   │   │   ├── diseases/
│   │   │   ├── processes/
│   │   │   ├── reviews/
│   │   │   ├── materials/
│   │   │   ├── archives/
│   │   │   └── schedules/
│   │   ├── types/              # TypeScript 类型
│   │   ├── constants/          # 常量定义
│   │   ├── utils/              # 工具函数
│   │   ├── root.tsx
│   │   ├── global.css
│   │   └── entry.*.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js >= 18.17.0
- Rust >= 1.70.0
- SQLite 3 (已通过 rusqlite bundled 内置)

### 1. 初始化后端

```bash
cd backend

# 安装 Rust 依赖
cargo build

# 创建数据库目录
mkdir -p db
```

### 2. 数据库迁移与 Seed

```bash
cd backend

# 执行数据库迁移和初始化数据
cargo run --bin seed
```

**Seed 数据包含以下风险场景：**
- ✅ 高危酸化未复核的古籍
- ✅ 材料库存不足预警
- ✅ 修复排期冲突测试
- ✅ 档案缺失影像提示

### 3. 启动后端服务

```bash
cd backend

# 开发模式启动
cargo run

# 或发布模式
cargo run --release
```

后端服务将在 `http://localhost:8000` 启动

### 4. 初始化前端

```bash
cd frontend

# 安装依赖
npm install
```

### 5. 启动前端开发服务器

```bash
cd frontend

# 开发模式
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

---

## 可用命令

### 后端命令

| 命令 | 说明 |
|------|------|
| `cargo build` | 编译项目 |
| `cargo run` | 启动开发服务器 |
| `cargo run --bin seed` | 执行数据库迁移和种子数据 |
| `cargo test` | 运行测试 |
| `cargo fmt` | 格式化代码 |
| `cargo clippy` | 代码检查 |

### 前端命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run build.types` | 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run fmt` | Prettier 格式化 |

---

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| zhanggxf | 123456 | 修复师 |
| lixf | 123456 | 修复师 |
| wanggly | 123456 | 馆藏管理员 |
| chenzj | 123456 | 外聘专家 |
| liuzj | 123456 | 外聘专家 |

---

## 功能模块

### A. 古籍修复流程

1. **古籍入库** - 馆藏管理员录入古籍基本信息
2. **病害诊断** - 修复师检测纸张病害，记录病害类型和严重程度
3. **修复排程** - 创建修复工序，安排修复时间，泳道视图查看

### B. 专家复核与档案

1. **专家复核** - 外聘专家复核病害诊断和修复方案
2. **材料领用** - 修复过程中材料库存管理与预警
3. **档案统计** - 修复档案归档与数据统计分析

---

## API 接口

### 用户管理
- `POST /api/login` - 用户登录
- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取用户详情
- `POST /api/users` - 创建用户

### 古籍管理
- `GET /api/books` - 获取古籍列表（支持筛选）
- `GET /api/books/:id` - 获取古籍详情
- `POST /api/books` - 新增古籍
- `PUT /api/books/:id` - 更新古籍
- `PATCH /api/books/:id/status` - 更新古籍状态
- `DELETE /api/books/:id` - 删除古籍

### 病害诊断
- `GET /api/diseases` - 获取病害列表
- `POST /api/diseases` - 新增病害记录
- `PUT /api/diseases/:id` - 更新病害
- `DELETE /api/diseases/:id` - 删除病害

### 修复工序
- `GET /api/processes` - 获取工序列表
- `POST /api/processes` - 新增工序
- `PUT /api/processes/:id` - 更新工序
- `PATCH /api/processes/:id/status` - 更新工序状态
- `PATCH /api/processes/:id/order` - 更新工序排序
- `DELETE /api/processes/:id` - 删除工序

### 材料管理
- `GET /api/materials` - 获取材料列表
- `GET /api/materials/low-stock` - 获取低库存材料
- `POST /api/materials` - 新增材料
- `PUT /api/materials/:id` - 更新材料
- `DELETE /api/materials/:id` - 删除材料

### 专家复核
- `GET /api/reviews` - 获取复核列表
- `POST /api/reviews` - 提交复核申请
- `PATCH /api/reviews/:id/status` - 更新复核状态
- `DELETE /api/reviews/:id` - 删除复核

### 档案管理
- `GET /api/archives` - 获取档案列表
- `GET /api/archives/statistics` - 获取档案统计
- `POST /api/archives` - 新增档案
- `PUT /api/archives/:id` - 更新档案
- `DELETE /api/archives/:id` - 删除档案

### 排程管理
- `GET /api/schedules` - 获取排程列表
- `GET /api/schedules/conflicts` - 检查排程冲突
- `POST /api/schedules` - 新增排程
- `PUT /api/schedules/:id` - 更新排程
- `DELETE /api/schedules/:id` - 删除排程

---

## 状态流转

### 古籍状态

```
待诊断 (pending)
    ↓
诊断中 (diagnosing) → [专家复核] → 已排程 (scheduled)
    ↓
修复中 (repairing)
    ↓
复核中 (reviewing) → [专家复核] → 已完成 (completed)
    ↓
已归档 (archived)
```

### 病害严重程度

| 程度 | 说明 | 处理优先级 |
|------|------|------------|
| 轻度 (mild) | 轻微损伤 | 低 |
| 中度 (moderate) | 需要修复 | 中 |
| 重度 (severe) | 严重损伤 | 高 |
| 危重度 (critical) | 濒临损毁 | 紧急 |

---

## 响应式适配

- ✅ 桌面端 (1280px+)：完整功能，多列布局
- ✅ 平板端 (768px-1279px)：自适应列数，侧边栏可折叠
- ✅ 移动端 (≤767px)：单列布局，底部导航

---

## 检查与验证

### 后端检查

```bash
cd backend

# 编译检查
cargo check

# 代码格式化检查
cargo fmt --check

# Clippy 检查
cargo clippy -- -D warnings
```

### 前端检查

```bash
cd frontend

# 类型检查
npm run build.types

# ESLint 检查
npm run lint

# 格式检查
npm run fmt.check
```

---

## 完成项

### ✅ 已完成

1. **后端基础设施**
   - Rust + Rocket 框架搭建
   - SQLite 数据库设计与迁移
   - 完整 RESTful API 实现
   - CORS 跨域配置
   - 种子数据脚本（含风险场景）

2. **前端基础设施**
   - Qwik City 项目搭建
   - Tailwind CSS 样式系统
   - 响应式布局框架
   - 通用组件库（Loading/Empty/Modal/Badge）

3. **业务模块 A（修复流程）**
   - 古籍入库管理
   - 病害诊断与分级
   - 病害泳道视图（酸化/虫蛀/霉斑）
   - 修复工序看板
   - 工序拖拽交互框架
   - 排程管理与冲突检测

4. **业务模块 B（复核与档案）**
   - 专家复核流程
   - 材料库存管理
   - 库存预警机制
   - 档案统计分析
   - 缺失影像提醒

5. **用户体验**
   - 三角色权限控制视图
   - Loading 加载状态
   - Empty 空状态
   - 表单基础校验
   - 操作基础反馈

### ⚠️ 简化项

1. **文件上传**：使用占位路径，未实现真实文件上传存储
2. **拖拽排序**：实现了前端 UI 框架，后端 API 可用，完整交互需在实际运行时联调
3. **实时通知**：未实现 WebSocket 实时推送
4. **权限控制**：前端视图控制，后端中间件简化实现

### 📋 未完成项

1. **单元测试**：前后端单元测试覆盖率不足
2. **导出功能**：报表导出、PDF 生成
3. **高级搜索**：全文检索、复杂条件组合搜索
4. **图表可视化**：ECharts 图表集成
5. **批量操作**：批量导入、批量处理

### 🔒 限制

1. **单节点部署**：SQLite 适合单节点，不支持分布式
2. **认证简化**：未实现 JWT 刷新机制
3. **上传限制**：未配置文件上传大小限制与安全扫描
4. **审计日志**：操作审计日志未完整实现

### ✔️ 真实验证内容

1. **数据库 Schema**：表结构与索引设计完整，字段命名贴合业务
2. **业务流程闭环**：古籍入库 → 病害诊断 → 修复排程 → 专家复核 → 档案归档
3. **角色视图区分**：不同角色登录后可见不同菜单
4. **风险场景覆盖**：
   - 危重病害自动预警
   - 材料库存低时高亮提醒
   - 排程冲突检测
   - 缺失影像档案统计
5. **状态流转完整**：各实体状态定义与转换逻辑清晰
