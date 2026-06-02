# 📚 独立书店预售书到货与取书通知系统

面向店员、采购负责人和会员客户经理的全栈书店预售管理系统。

## 🌟 功能特性

### 核心业务流程
- **图书预售** - 会员预订图书并支付订金
- **采购到货** - 采购单管理、到货验收
- **分拣留书** - 三列看板式分拣流程
- **取书通知** - 到货通知、取书提醒、逾期处理
- **退款处理** - 手动退款、逾期自动退款

### 功能模块
| 模块 | 功能说明 |
|------|----------|
| 🏠 工作台 | 数据统计、待办事项、快捷操作 |
| 📦 预售订单 | 订单列表、详情、状态流转 |
| 📚 图书管理 | 图书信息维护、库存管理 |
| 👥 会员管理 | 会员信息、账户充值、等级管理 |
| 🛒 采购管理 | 采购单创建、提交、到货验收 |
| 📋 分拣看板 | 三列拖拽式分拣任务管理 |
| 🔔 通知中心 | 通知发送、批量操作、逾期检查 |
| ⚠️ 异常处理 | 异常上报、处理流程、解决方案 |
| 💰 交易记录 | 收支明细、手动退款、统计汇总 |

### 系统角色
- **管理员** - 全功能访问权限
- **采购负责人** - 采购管理、到货验收
- **会员客户经理** - 会员管理、预售处理
- **店员** - 日常操作、分拣、通知

## 🛠 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Astro 4 + React 18 |
| 前端样式 | Tailwind CSS 3 |
| 后端服务 | Express.js |
| 数据库 | SQLite (better-sqlite3) |
| 认证方式 | JWT Token |
| 开发模式 | React Islands 部分 hydration |

## 📦 安装与运行

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **初始化数据库**
```bash
# 创建数据库表结构
npm run init:db

# 填充示例数据
npm run seed:db

# 或一键重置
npm run reset:db
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问系统**
- 前端地址: http://localhost:4321
- 后端API: http://localhost:3001

### 生产部署
```bash
# 构建前端
npm run build

# 启动服务
npm start
```

## 🔑 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 采购负责人 | purchaser | purchaser123 |
| 会员客户经理 | manager | manager123 |
| 店员 | clerk | clerk123 |

## 📁 项目结构

```
.
├── server/                 # 后端服务
│   ├── config/            # 配置文件
│   │   └── database.js    # 数据库配置
│   ├── middleware/        # 中间件
│   │   └── auth.js        # 认证授权
│   ├── routes/            # API 路由
│   │   ├── auth.js        # 认证接口
│   │   ├── books.js       # 图书管理
│   │   ├── members.js     # 会员管理
│   │   ├── preorders.js   # 预售订单
│   │   ├── purchase.js    # 采购管理
│   │   ├── sorting.js     # 分拣管理
│   │   ├── notifications.js # 通知管理
│   │   ├── exceptions.js  # 异常处理
│   │   ├── transactions.js # 交易记录
│   │   ├── dashboard.js   # 工作台数据
│   │   └── users.js       # 用户管理
│   ├── scripts/           # 脚本
│   │   ├── initDB.js      # 数据库初始化
│   │   └── seedDB.js      # 示例数据
│   ├── utils/             # 工具函数
│   │   └── generateNo.js  # 编号生成
│   └── index.js           # 服务入口
├── src/                   # 前端源码
│   ├── components/        # React 组件
│   │   ├── Layout.jsx     # 主布局
│   │   ├── LoginForm.jsx  # 登录表单
│   │   ├── Dashboard.jsx  # 工作台
│   │   ├── PreorderList.jsx # 预售订单
│   │   ├── BookList.jsx   # 图书管理
│   │   ├── MemberList.jsx # 会员管理
│   │   ├── PurchaseList.jsx # 采购管理
│   │   ├── SortingBoard.jsx # 分拣看板
│   │   ├── NotificationList.jsx # 通知中心
│   │   ├── ExceptionList.jsx # 异常处理
│   │   ├── TransactionList.jsx # 交易记录
│   │   ├── Loading.jsx    # 加载状态
│   │   ├── EmptyState.jsx # 空状态
│   │   ├── ErrorState.jsx # 错误状态
│   │   ├── Modal.jsx      # 模态框
│   │   └── Pagination.jsx # 分页组件
│   ├── pages/             # Astro 页面
│   │   ├── index.astro    # 首页
│   │   ├── login.astro    # 登录页
│   │   ├── dashboard.astro # 工作台
│   │   ├── preorders.astro # 预售订单
│   │   ├── books.astro    # 图书管理
│   │   ├── members.astro  # 会员管理
│   │   ├── purchase.astro # 采购管理
│   │   ├── sorting.astro  # 分拣看板
│   │   ├── notifications.astro # 通知中心
│   │   ├── exceptions.astro # 异常处理
│   │   └── transactions.astro # 交易记录
│   ├── styles/            # 样式文件
│   │   └── global.css     # 全局样式
│   └── utils/             # 工具函数
│       └── api.js         # API 请求封装
├── data/                   # 数据库文件目录
├── .env                    # 环境变量
├── astro.config.mjs       # Astro 配置
├── tailwind.config.mjs    # Tailwind 配置
└── package.json           # 项目配置
```

## 🗄 数据模型

### 核心数据表
1. **users** - 系统用户表
2. **members** - 会员信息表
3. **books** - 图书信息表
4. **preorders** - 预售订单表
5. **purchase_orders** - 采购单表
6. **purchase_items** - 采购明细表
7. **sorting_tasks** - 分拣任务表
8. **notifications** - 通知记录表
9. **exceptions** - 异常处理表
10. **transactions** - 交易记录表
11. **stock** - 库存表

## 🔄 业务流程

### 完整流程示例
```
会员预订图书
    ↓
创建预售订单 (状态: pending)
    ↓
确认订单 → 扣减会员余额 → 生成交易记录
    ↓
订单状态: confirmed
    ↓
创建采购单 → 提交采购
    ↓
采购到货 → 验收入库
    ↓
订单状态: arrived
    ↓
生成分拣任务
    ↓
分拣留书 → 发送到货通知
    ↓
订单状态: reserved
    ↓
会员取书确认
    ↓
订单状态: picked
    ↓
完成
```

### 逾期处理流程
```
订单到达预留期限 (14天)
    ↓
执行逾期检查
    ↓
订单状态改为: expired
    ↓
自动退还订金到会员账户
    ↓
生成退款交易记录
    ↓
发送逾期通知
```

## 🎨 界面设计

### 设计原则
- **简洁高效** - 面向操作人员，减少交互步骤
- **状态清晰** - 通过颜色和标签明确显示各状态
- **响应式** - 适配不同屏幕尺寸
- **反馈及时** - 加载、空、错误状态都有明确提示

### 状态配色
| 状态 | 颜色 | 说明 |
|------|------|------|
| 🟡 pending | 黄色 | 待处理 |
| 🔵 confirmed | 蓝色 | 已确认 |
| 🟢 arrived | 绿色 | 已到货 |
| 🟣 reserved | 紫色 | 已预留 |
| ✅ picked | 翠绿色 | 已取书 |
| ⚪ cancelled | 灰色 | 已取消 |
| 🔴 refunded | 红色 | 已退款 |
| 🟠 expired | 橙色 | 已过期 |

## 🔧 API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `PUT /api/auth/password` - 修改密码

### 图书管理
- `GET /api/books` - 图书列表
- `GET /api/books/:id` - 图书详情
- `POST /api/books` - 新增图书
- `PUT /api/books/:id` - 更新图书
- `DELETE /api/books/:id` - 删除图书

### 会员管理
- `GET /api/members` - 会员列表
- `GET /api/members/:id` - 会员详情
- `POST /api/members` - 新增会员
- `PUT /api/members/:id` - 更新会员
- `POST /api/members/:id/recharge` - 会员充值

### 预售订单
- `GET /api/preorders` - 订单列表
- `GET /api/preorders/:id` - 订单详情
- `POST /api/preorders` - 创建订单
- `PUT /api/preorders/:id/status` - 状态变更
- `POST /api/preorders/:id/pickup` - 确认取书

### 采购管理
- `GET /api/purchase` - 采购单列表
- `GET /api/purchase/:id` - 采购单详情
- `POST /api/purchase` - 创建采购单
- `PUT /api/purchase/:id` - 更新采购单
- `POST /api/purchase/:id/receive` - 到货验收

### 分拣管理
- `GET /api/sorting` - 分拣任务列表
- `GET /api/sorting/board` - 分拣看板数据
- `POST /api/sorting/:id/start` - 开始分拣
- `POST /api/sorting/:id/complete` - 完成分拣
- `POST /api/sorting/:id/deliver` - 交付确认

### 通知管理
- `GET /api/notifications` - 通知列表
- `POST /api/notifications/arrival` - 发送到货通知
- `POST /api/notifications/batch-arrival` - 批量发送
- `POST /api/notifications/reminder` - 发送提醒
- `POST /api/notifications/overdue-check` - 逾期检查
- `PUT /api/notifications/:id/read` - 标记已读

### 异常处理
- `GET /api/exceptions` - 异常列表
- `GET /api/exceptions/:id` - 异常详情
- `POST /api/exceptions` - 上报异常
- `PUT /api/exceptions/:id/handle` - 开始处理
- `PUT /api/exceptions/:id/resolve` - 解决异常
- `PUT /api/exceptions/:id/close` - 关闭异常

### 交易记录
- `GET /api/transactions` - 交易列表
- `POST /api/transactions/refund` - 手动退款

## 📝 开发说明

### 数据库操作
- 使用 `better-sqlite3` 进行同步操作
- 重要操作使用事务保证数据一致性
- 所有表都有 `created_at` 和 `updated_at` 时间戳

### 权限控制
- 通过 JWT Token 进行身份认证
- 路由级别的角色权限检查
- 前端根据角色动态显示菜单

### 前端架构
- 使用 Astro 静态渲染 + React Islands
- 交互性强的组件使用 React 实现
- 状态管理使用 React Hooks + localStorage
- API 请求统一封装在 `api.js` 中

## 🚀 部署建议

### 环境变量
生产环境请修改 `.env` 中的关键配置：
```
NODE_ENV=production
JWT_SECRET=your-strong-secret-key
DB_PATH=/path/to/secure/location/bookstore.db
```

### 数据备份
- 定期备份 `data/bookstore.db` 文件
- 建议每日自动备份

### 安全建议
- 使用 HTTPS 协议
- 定期更换 JWT_SECRET
- 限制数据库文件访问权限

## 📄 License

MIT License
