# 馆际互借与逾期追踪系统

面向读者服务馆员、合作馆联系人和流通部主管的馆际互借全流程管理系统，覆盖从读者申请到归还验收的完整业务闭环。

## 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS + Zustand + React Router
- **后端**：Express 4 + TypeScript (ESM)
- **数据库**：SQLite (better-sqlite3)
- **构建工具**：Vite

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（前端 + 后端同时启动）
npm run dev

# 仅启动前端
npm run client:dev

# 仅启动后端
npm run server:dev

# TypeScript 类型检查
npm run check

# 构建生产版本
npm run build
```

启动后访问 http://localhost:5173，后端 API 运行在 http://localhost:3001。

## 核心功能

### 八大业务流程

1. **读者申请** — 馆员创建互借申请，输入图书和读者信息
2. **合作馆匹配** — 输入 ISBN 自动匹配馆藏可用的合作馆
3. **借出审批** — 合作馆联系人审批借出请求（批准/拒绝）
4. **物流登记** — 登记承运商、物流单号、预计到达日期
5. **到馆通知** — 确认图书到馆，通知读者取书
6. **续借申请** — 借阅期间可申请续借，需合作馆审批
7. **逾期催还** — 自动标记逾期，支持催还操作
8. **归还验收** — 验收归还图书，发现异常可登记反馈

### 页面功能

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/` | 统计卡片、近期动态、待办事项 |
| 互借申请 | `/requests` | 列表筛选、分页浏览 |
| 新建申请 | `/requests/new` | ISBN匹配馆藏、表单验证 |
| 申请详情 | `/requests/:id` | 状态流转时间线、操作按钮、物流/续借信息 |
| 馆际看板 | `/kanban` | 7列看板视图，按状态分组 |
| 逾期追踪 | `/overdue` | 逾期列表、催还操作、罚款统计 |
| 合作馆管理 | `/libraries` | 卡片网格、新增/编辑弹窗 |
| 异常反馈 | `/exceptions` | 异常记录、处理方案、状态标签 |

### 用户角色

| 角色 | 权限 |
|------|------|
| 读者服务馆员 | 创建申请、登记物流、确认到馆、处理续借、验收归还 |
| 合作馆联系人 | 审批借出请求、确认寄出、处理续借审批 |
| 流通部主管 | 全局数据查看、逾期催还管理、异常处理、统计报表 |

## 项目结构

```
├── api/                    # 后端代码
│   ├── app.ts              # Express 应用配置
│   ├── db.ts               # SQLite 数据库初始化 + 示例数据
│   ├── server.ts           # 服务器入口
│   └── routes/             # API 路由
│       ├── dashboard.ts    # 仪表盘统计/动态/待办
│       ├── requests.ts     # 互借申请 CRUD + 状态流转
│       ├── libraries.ts    # 合作馆管理
│       ├── overdue.ts      # 逾期追踪
│       ├── exceptions.ts   # 异常记录
│       └── match.ts        # ISBN 馆藏匹配
├── shared/                 # 前后端共享类型
│   └── types.ts
├── src/                    # 前端代码
│   ├── App.tsx             # 路由配置
│   ├── components/         # 通用组件
│   │   ├── Layout.tsx      # 侧边栏 + 面包屑布局
│   │   ├── StatusBadge.tsx # 状态徽章（14种状态）
│   │   ├── StatusTimeline.tsx # 状态流转时间线
│   │   ├── EmptyState.tsx  # 空状态
│   │   ├── LoadingSpinner.tsx # 加载状态
│   │   └── ErrorState.tsx  # 错误状态
│   ├── hooks/
│   │   └── useApi.ts       # API 请求 Hooks
│   ├── pages/              # 页面组件
│   │   ├── Dashboard.tsx
│   │   ├── RequestList.tsx
│   │   ├── RequestNew.tsx
│   │   ├── RequestDetail.tsx
│   │   ├── Kanban.tsx
│   │   ├── Overdue.tsx
│   │   ├── Libraries.tsx
│   │   └── Exceptions.tsx
│   ├── stores/
│   │   └── appStore.ts     # Zustand 全局状态
│   └── types/
│       └── index.ts        # 前端类型定义
├── data/                   # SQLite 数据库文件（自动生成）
└── .trae/documents/        # 产品文档
    ├── prd.md              # 产品需求文档
    └── tech-architecture.md # 技术架构文档
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘统计数据 |
| GET | `/api/dashboard/activities` | 近期动态 |
| GET | `/api/dashboard/todos` | 待办事项 |
| GET | `/api/requests` | 互借申请列表（支持 status/libraryId/readerName 筛选） |
| GET | `/api/requests/:id` | 申请详情（含物流和续借记录） |
| POST | `/api/requests` | 创建互借申请 |
| PUT | `/api/requests/:id/status` | 更新申请状态 |
| GET | `/api/requests/:id/transitions` | 状态流转历史 |
| POST | `/api/requests/:id/renewal` | 提交续借申请 |
| PUT | `/api/requests/:id/ship` | 登记物流信息 |
| PUT | `/api/requests/:id/arrive` | 确认到馆 |
| PUT | `/api/requests/:id/return` | 归还验收 |
| GET | `/api/libraries` | 合作馆列表 |
| GET | `/api/libraries/:id` | 合作馆详情（含馆藏） |
| POST | `/api/libraries` | 创建合作馆 |
| PUT | `/api/libraries/:id` | 更新合作馆 |
| GET | `/api/overdue` | 逾期列表 |
| POST | `/api/overdue/:id/remind` | 发送催还通知 |
| GET | `/api/exceptions` | 异常记录列表 |
| POST | `/api/exceptions` | 创建异常记录 |
| PUT | `/api/exceptions/:id` | 更新异常处理状态 |
| POST | `/api/match/:isbn` | ISBN 馆藏匹配 |

## 示例数据

系统首次启动时自动初始化示例数据：

- **3 个用户**：张明远（管理员）、李书华（馆员）、王晓芳（馆员）
- **5 个合作馆**：北大、清华、复旦、南大、浙大图书馆
- **14 条馆藏记录**覆盖 4 种 ISBN
- **15 条互借申请**覆盖全部 14 种状态
- 完整的物流、续借、逾期、异常记录

## 状态流转

```
pending → approved → shipping_out → in_transit → arrived → reading → returning → completed
                    ↓                           ↓          ↓
                  rejected                 renewal_pending  overdue
                                              ↓               ↓
                                     renewal_approved    exception
                                     renewal_rejected
```

## 开发说明

- 数据库文件位于 `data/ill.db`，删除后重启将自动重建并填充示例数据
- 当前用户固定为 userId=1（张明远），简化了认证流程
- 所有 API 返回统一格式：`{ success: true, data: ... }` 或 `{ success: false, error: ... }`
- 前端使用 `useApi` Hook 统一处理请求、加载、错误状态
