# 县域供水水质异常上报与抢修调度系统

面向水厂化验员、管网抢修队和热线客服的一体化供水管理系统。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + React Router + Tailwind CSS
- **后端**: Hono.js (Node.js) + Better-SQLite3
- **数据库**: SQLite (文件型数据库)

## 系统角色

| 角色 | 说明 | 主要功能 |
|------|------|----------|
| 水厂化验员 (chemist) | 负责水质检测 | 水质检测记录、异常上报、复测确认 |
| 管网抢修队 (repair_crew) | 负责管网维修 | 工单接收、现场抢修、进度反馈 |
| 热线客服 (hotline) | 负责用户服务 | 用户报修登记、停水公告发布 |
| 管理员 (admin) | 系统管理 | 人员管理、地点配置、全功能访问 |

## 核心业务流程

```
水质检测异常
    ↓
用户报修 → 影响区域评估
    ↓
抢修派单 → 工单调度
    ↓
停水公告发布
    ↓
复测确认
    ↓
恢复供水通知
```

## 功能模块

### 1. 调度看板 (首页)
- 数据统计概览（水质检测、报修单、工单、抢修队）
- 最新报修单列表
- 正在进行的停水公告
- 水质异常记录
- 抢修队工作量统计

### 2. 水质检测管理
- 水质检测记录列表
- 新增检测记录
- 检测详情查看
- 异常指标自动识别
- 复测记录管理

### 3. 报修管理
- 报修单列表（支持搜索筛选）
- 新增报修单
- 报修详情查看
- 影响区域评估
- 派单功能

### 4. 工单调度
- 工单列表
- 工单状态流转（待处理 → 进行中 → 已完成）
- 抢修队工作量展示

### 5. 停水公告
- 停水公告列表
- 发布/结束停水
- 影响区域展示

### 6. 通知中心
- 系统通知列表
- 未读通知标记
- 批量标记已读

### 7. 系统管理
- 人员管理
- 地点管理

## 快速开始

### 安装依赖

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 初始化数据库

```bash
cd server
npm run seed
cd ..
```

### 启动开发服务

```bash
# 同时启动前后端
npm run dev

# 或分别启动
cd server && npm run dev
cd client && npm run dev
```

### 访问地址

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

## 项目结构

```
.
├── client/                 # 前端项目
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── utils/         # 工具函数
│   │   ├── types.ts       # 类型定义
│   │   ├── App.tsx        # 路由配置
│   │   └── main.tsx       # 入口文件
│   └── package.json
├── server/                 # 后端项目
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── db.ts          # 数据库连接
│   │   ├── types.ts       # 类型定义
│   │   ├── seed.ts        # 示例数据
│   │   └── index.ts       # 服务器入口
│   └── package.json
└── package.json
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard | 调度看板数据 |
| GET/POST | /api/water-quality | 水质检测列表/新增 |
| GET/PUT/DELETE | /api/water-quality/:id | 水质检测详情/更新/删除 |
| POST | /api/water-quality/:id/recheck | 复测 |
| GET/POST | /api/repair-reports | 报修单列表/新增 |
| GET/PUT | /api/repair-reports/:id | 报修单详情/更新 |
| POST | /api/repair-reports/:id/assign | 派单 |
| GET/POST | /api/work-orders | 工单列表/新增 |
| GET/PUT | /api/work-orders/:id | 工单详情/更新 |
| GET/POST | /api/water-stop-notices | 停水公告列表/新增 |
| POST | /api/water-stop-notices/:id/publish | 发布公告 |
| GET | /api/notifications | 通知列表 |
| PUT | /api/notifications/:id/read | 标记已读 |
| GET/POST | /api/locations | 地点列表/新增 |
| DELETE | /api/locations/:id | 删除地点 |
| GET/POST | /api/users | 用户列表/新增 |
| DELETE | /api/users/:id | 删除用户 |
| GET/POST | /api/repair-teams | 抢修队列表/新增 |

## 示例账号

系统初始化后，可使用以下示例账号概念登录（当前版本为演示版，无需实际登录）：

- **管理员**: 张伟 / admin
- **化验员**: 李华 / chemist
- **抢修队**: 王强 / repair_crew
- **热线客服**: 赵敏 / hotline

## 水质检测标准

| 指标 | 正常范围 |
|------|----------|
| pH | 6.5 - 8.5 |
| 浊度 | ≤ 1.0 NTU |
| 余氯 | 0.3 - 4.0 mg/L |
| 大肠菌群 | 0 个/100mL |
