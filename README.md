# 融媒体中心设备预约与素材归还系统

面向记者、设备管理员和制片负责人的全栈设备管理系统，覆盖设备台账、拍摄任务、预约审批、领用交接、素材卡归还、损坏登记和逾期提醒全流程。

## 技术栈

### 后端
- **框架**: Hono v4 (Node.js 轻量级 Web 框架)
- **数据库**: SQLite (sql.js WebAssembly 版本)
- **认证**: JWT (jsonwebtoken) + bcryptjs
- **验证**: Zod
- **语言**: TypeScript
- **运行时**: tsx

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router v6
- **状态管理**: Zustand
- **样式**: Tailwind CSS 3
- **HTTP 客户端**: Axios
- **日期处理**: dayjs

## 核心功能模块

### 1. 设备台账管理
- 设备信息录入、编辑、删除
- 设备分类管理（相机、镜头、灯光、音频、配件等）
- 设备状态跟踪（空闲、使用中、维修中、报废）
- 库存数量和采购价格管理

### 2. 拍摄任务管理
- 任务创建和编辑
- 任务优先级设置（高、中、低）
- 任务状态流转（草稿、待审批、进行中、已完成、已取消）
- 拍摄地点和时间管理
- 制片负责人审批流程

### 3. 预约审批
- 设备预约申请
- 档期冲突自动检测
- 设备管理员审批（通过/驳回）
- 预约状态流转（待审批、已通过、已驳回、已取消、已完成）

### 4. 领用交接
- 设备领用确认
- 领用时间和交接人记录
- 归还确认
- 设备状态检查

### 5. 素材卡归还
- 素材卡领用和归还登记
- 素材拷贝状态跟踪
- 格式确认
- 逾期自动提醒

### 6. 损坏登记
- 设备损坏上报
- 损坏程度分级（轻微、中度、严重）
- 维修流程跟踪
- 维修费用记录

### 7. 逾期提醒
- 预约逾期自动检测
- 素材卡逾期自动检测
- 逾期天数统计
- 提醒状态管理（待处理、已通知、已解决）

### 8. 设备档期看板
- 日历视图展示设备预约情况
- 按设备筛选查看
- 颜色区分预约状态
- 快速查看预约详情

## 用户角色

| 角色 | 权限 |
|------|------|
| **记者** | 创建拍摄任务、申请设备预约、领用/归还设备和素材卡、上报设备损坏 |
| **设备管理员** | 设备台账管理、审批预约、领用交接确认、素材卡管理、损坏处理 |
| **制片负责人** | 审批拍摄任务、查看所有预约和任务、仪表盘统计 |

## 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
# 安装后端依赖
cd server
npm install

# 安装前端依赖
cd ../client
npm install
```

### 初始化数据库和示例数据

```bash
cd server
npm run seed
```

### 启动服务

#### 方式一：分别启动

```bash
# 启动后端服务 (端口 3001)
cd server
npm run dev

# 启动前端服务 (端口 5173)
cd ../client
npm run dev
```

#### 方式二：根目录一键启动

```bash
# 安装根目录依赖
npm install

# 启动所有服务
npm run dev
```

### 访问应用

打开浏览器访问: http://localhost:5173

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `admin123` | 设备管理员 |
| `producer` | `producer123` | 制片负责人 |
| `reporter1` | `reporter123` | 记者 |
| `reporter2` | `reporter123` | 记者 |
| `reporter3` | `reporter123` | 记者 |

## 数据模型

### 核心数据表

1. **users** - 用户表
2. **equipments** - 设备表
3. **shooting_tasks** - 拍摄任务表
4. **reservations** - 预约表
5. **media_cards** - 素材卡表
6. **damage_reports** - 损坏报告表
7. **overdue_reminders** - 逾期提醒表

### 状态流转

#### 预约状态
```
pending(待审批) → approved(已通过) → picked_up(已领用) → returned(已归还)
     ↓                 ↓                ↓
rejected(已驳回)  cancelled(已取消)  overdue(已逾期)
```

#### 任务状态
```
draft(草稿) → pending(待审批) → approved(已通过) → in_progress(进行中) → completed(已完成)
                                    ↓
                                rejected(已驳回)
```

#### 设备状态
```
available(空闲) → in_use(使用中) → available(空闲)
     ↓                ↓
  maintenance(维修中)  damaged(已损坏)
```

## API 接口

### 认证
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/profile` - 获取当前用户信息

### 设备管理
- `GET /api/equipments` - 获取设备列表
- `GET /api/equipments/:id` - 获取设备详情
- `POST /api/equipments` - 创建设备
- `PUT /api/equipments/:id` - 更新设备
- `DELETE /api/equipments/:id` - 删除设备
- `GET /api/equipments/:id/schedule` - 获取设备档期
- `GET /api/equipments/availability` - 检查设备可用性

### 拍摄任务
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:id` - 获取任务详情
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:id` - 更新任务
- `DELETE /api/tasks/:id` - 删除任务
- `POST /api/tasks/:id/approve` - 审批任务
- `POST /api/tasks/:id/start` - 开始任务
- `POST /api/tasks/:id/complete` - 完成任务

### 预约管理
- `GET /api/reservations` - 获取预约列表
- `GET /api/reservations/:id` - 获取预约详情
- `POST /api/reservations` - 创建预约
- `PUT /api/reservations/:id` - 更新预约
- `DELETE /api/reservations/:id` - 取消预约
- `POST /api/reservations/:id/approve` - 审批预约
- `POST /api/reservations/:id/reject` - 驳回预约
- `POST /api/reservations/:id/pickup` - 确认领用
- `POST /api/reservations/:id/return` - 确认归还

### 素材卡管理
- `GET /api/media-cards` - 获取素材卡列表
- `GET /api/media-cards/:id` - 获取素材卡详情
- `POST /api/media-cards` - 创建素材卡
- `PUT /api/media-cards/:id` - 更新素材卡
- `POST /api/media-cards/:id/lend` - 借出素材卡
- `POST /api/media-cards/:id/return` - 归还素材卡

### 损坏报告
- `GET /api/damage-reports` - 获取损坏报告列表
- `GET /api/damage-reports/:id` - 获取损坏报告详情
- `POST /api/damage-reports` - 创建损坏报告
- `PUT /api/damage-reports/:id` - 更新损坏报告
- `POST /api/damage-reports/:id/repair` - 开始维修
- `POST /api/damage-reports/:id/resolve` - 解决损坏

### 逾期提醒
- `GET /api/overdue-reminders` - 获取逾期提醒列表
- `POST /api/overdue-reminders/:id/notify` - 标记已通知
- `POST /api/overdue-reminders/:id/resolve` - 标记已解决

### 仪表盘
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/upcoming` - 获取即将到期的预约
- `GET /api/dashboard/overdue` - 获取逾期列表

## 目录结构

```
trae-solo-coder-4/
├── client/                    # 前端项目
│   ├── src/
│   │   ├── api/              # API 接口封装
│   │   ├── components/       # 通用组件
│   │   │   ├── common/      # 基础组件
│   │   │   ├── layout/      # 布局组件
│   │   │   └── * /          # 各业务模块组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── pages/           # 页面组件
│   │   ├── store/           # 状态管理
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── utils/           # 工具函数
│   │   └── App.tsx          # 主应用组件
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                   # 后端项目
│   ├── src/
│   │   ├── routes/          # 路由模块
│   │   ├── middleware/      # 中间件
│   │   ├── config.ts        # 配置
│   │   ├── db.ts            # 数据库操作
│   │   ├── index.ts         # 应用入口
│   │   ├── seed.ts          # 示例数据
│   │   ├── types.ts         # 类型定义
│   │   └── utils.ts         # 工具函数
│   ├── data/                # 数据库文件目录
│   ├── package.json
│   └── tsconfig.json
├── data/                     # 根目录数据文件
├── package.json              # 根目录配置
└── README.md
```

## 常见问题

### 1. macOS 上的原生模块签名问题

如果遇到以下错误：
```
code signature ... not valid for use in process
```

这是 Node.js v24 在 macOS 上的安全限制。本项目已通过以下方式解决：
- 后端使用 `sql.js` (WebAssembly 版本的 SQLite) 替代原生 SQLite 驱动
- 前端使用 `@rollup/wasm-node` 替代原生 Rollup 模块

### 2. 数据库文件位置

数据库文件默认存储在 `server/data/app.db`，如需重置数据库，删除该文件后重新运行 `npm run seed`。

### 3. 端口被占用

- 后端默认端口：3001
- 前端默认端口：5173

如端口被占用，可修改以下配置：
- 后端：`server/src/config.ts`
- 前端：`client/vite.config.ts`

### 4. JWT Token 过期时间

默认过期时间为 7 天，可在 `server/src/config.ts` 中修改 `JWT_EXPIRES_IN`。

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式组件 + Hooks

### 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具链

## License

MIT
