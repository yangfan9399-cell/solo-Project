# 园区访客预约审批与门禁核验系统

面向园区管理的全流程访客预约、审批、核验与监控平台。覆盖被访员工、前台安保和行政管理员三类角色，实现访客从预约到离园的闭环管理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Astro 5 + React 19 (Islands 架构) |
| 样式 | Tailwind CSS 3 |
| 后端服务 | Astro SSR (Node Adapter) + Express 5 |
| 数据库 | SQLite (better-sqlite3) |
| 语言 | TypeScript |

## 功能模块

### 1. 访客预约 (`/appointments/new`)
- 填写访客信息（姓名、手机、证件类型/号码、公司）
- 选择被访人和来访事由
- 设定预计到达/离开时间
- 黑名单自动拦截（提交时校验，403 返回拦截原因）

### 2. 被访人审批 (`/appointments/[id]`)
- 待审批预约列表视图
- 一键审批通过 / 驳回（需填写原因）
- 审批后自动通知相关方

### 3. 门岗核验 (`/gate`)
- 证件号码搜索查询
- 实时显示访客信息、预约状态
- 黑名单红色警告
- 签到入园 / 签退离园操作

### 4. 入园签到 & 签退
- 门岗核验通过后签到
- 离园时签退登记
- 全流程时间记录

### 5. 超时未离园提醒 (`/`)
- 仪表盘展示超时预警
- 超时状态自动标记
- 通知被访人和管理员

### 6. 黑名单管理 (`/blacklist`)
- 添加/移除黑名单
- 黑名单访客无法预约
- 搜索查询功能

### 7. 状态流转

```
pending → approved → checked_in → checked_out
   ↓
rejected
                    checked_in → timeout → checked_out
```

| 状态 | 含义 | 颜色 |
|------|------|------|
| pending | 待审批 | 黄色 |
| approved | 已审批 | 蓝色 |
| rejected | 已驳回 | 红色 |
| checked_in | 已签到 | 绿色 |
| checked_out | 已签退 | 灰色 |
| timeout | 超时未离 | 橙色 |
| cancelled | 已取消 | 灰色 |

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装

```bash
# 安装依赖
npm install

# 初始化数据库并插入示例数据
npx tsx src/db/seed.ts

# 开发模式
npm run dev

# 生产构建
npm run build

# 生产运行（Express 服务）
npm run preview
```

启动后访问 http://localhost:3000

### 示例数据

种子脚本会创建以下示例数据：

**用户（8人）**
| 姓名 | 角色 | 部门 |
|------|------|------|
| 张伟 | admin | 行政部 |
| 李娜 | employee | 研发部 |
| 王强 | employee | 市场部 |
| 赵敏 | employee | 财务部 |
| 陈浩 | security | 安保部 |
| 刘洋 | security | 安保部 |
| 孙芳 | employee | 人力资源部 |
| 周杰 | employee | 研发部 |

**访客（6人）**：含不同证件类型和公司

**预约（6条）**：覆盖 pending / approved / checked_in / checked_out / rejected / timeout 全部状态

**黑名单（1条）**：访客"曹操"因多次违反规定被拉黑

## 项目结构

```
src/
├── db/
│   ├── index.ts          # SQLite 连接、Schema 定义、类型导出
│   └── seed.ts           # 种子数据脚本
├── pages/
│   ├── api/
│   │   ├── appointments/
│   │   │   ├── index.ts  # 预约 CRUD
│   │   │   ├── [id].ts   # 预约详情/更新/取消
│   │   │   └── approve.ts # 审批通过/驳回
│   │   ├── visitors.ts   # 访客查询/创建
│   │   ├── users.ts      # 用户查询/创建
│   │   ├── checkins.ts   # 签到/签退
│   │   ├── blacklist.ts  # 黑名单 CRUD
│   │   ├── notifications.ts # 通知查询/标记已读
│   │   └── stats.ts      # 仪表盘统计
│   ├── appointments/
│   │   ├── index.astro   # 预约列表页
│   │   ├── new.astro     # 新建预约页
│   │   └── [id].astro    # 预约详情页
│   ├── index.astro       # 工作台/仪表盘
│   ├── gate.astro        # 门岗核验页
│   └── blacklist.astro   # 黑名单管理页
├── components/
│   ├── Dashboard.tsx     # 仪表盘
│   ├── AppointmentForm.tsx   # 新建预约表单
│   ├── AppointmentList.tsx   # 预约列表
│   ├── AppointmentDetail.tsx # 预约详情+操作
│   ├── GateVerify.tsx    # 门岗核验
│   ├── BlacklistManager.tsx  # 黑名单管理
│   ├── StatusBadge.tsx   # 状态标签
│   ├── LoadingSpinner.tsx    # 加载状态
│   ├── EmptyState.tsx    # 空状态
│   └── ErrorState.tsx    # 错误状态
├── layouts/
│   └── BaseLayout.astro  # 全局布局（导航+页头+页脚）
└── styles/
    └── global.css        # Tailwind + 自定义组件样式
```

## API 接口

### 预约管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/appointments | 获取预约列表（支持 status/visitee_id/search 参数） |
| POST | /api/appointments | 创建预约（自动校验黑名单） |
| GET | /api/appointments/:id | 获取预约详情 |
| PUT | /api/appointments/:id | 更新预约 |
| DELETE | /api/appointments/:id | 取消预约 |
| POST | /api/appointments/approve | 审批通过/驳回 |

### 签到签退
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/checkins | 获取签到记录 |
| POST | /api/checkins | 签到入园/签退离园 |

### 访客管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/visitors | 查询访客（支持 search 参数） |
| POST | /api/visitors | 创建访客（重复证件号自动去重） |

### 用户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 获取用户列表（支持 role/department 参数） |
| POST | /api/users | 创建用户 |

### 黑名单
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/blacklist | 获取黑名单（支持 search 参数） |
| POST | /api/blacklist | 添加黑名单 |
| DELETE | /api/blacklist | 移除黑名单 |

### 通知
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| PUT | /api/notifications | 标记已读 |

### 统计
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats | 仪表盘统计数据 |

## 数据模型

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| name | TEXT | 姓名 |
| role | TEXT | 角色 (employee/security/admin) |
| department | TEXT | 部门 |
| phone | TEXT | 手机号 |
| email | TEXT | 邮箱 |

### appointments
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 预约单号 |
| visitor_name | TEXT | 访客姓名 |
| visitor_phone | TEXT | 访客手机 |
| visitor_id_type | TEXT | 证件类型 |
| visitor_id_number | TEXT | 证件号码 |
| visitor_company | TEXT | 访客公司 |
| visitee_id | INTEGER FK | 被访人ID |
| purpose | TEXT | 来访事由 |
| expected_arrival | TEXT | 预计到达 |
| expected_leave | TEXT | 预计离开 |
| status | TEXT | 状态 |
| notes | TEXT | 备注 |
| approved_by | INTEGER FK | 审批人 |
| approved_at | TEXT | 审批时间 |
| rejected_reason | TEXT | 驳回原因 |

### checkins
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| appointment_id | INTEGER FK | 预约ID |
| check_in_time | TEXT | 签到时间 |
| check_out_time | TEXT | 签退时间 |
| verified_by | INTEGER FK | 核验人 |

### blacklist
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| visitor_id | INTEGER FK | 访客ID |
| reason | TEXT | 拉黑原因 |
| created_by | INTEGER FK | 操作人 |

### notifications
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 主键 |
| appointment_id | INTEGER FK | 关联预约 |
| user_id | INTEGER FK | 目标用户 |
| type | TEXT | 通知类型 |
| title | TEXT | 标题 |
| message | TEXT | 内容 |
| is_read | INTEGER | 已读标记 |

## 生产部署

```bash
npm run build    # 构建到 dist/
npm run preview  # 使用 Express 服务运行
```

默认端口 3000，可通过环境变量 `PORT` 修改。数据库文件位于 `data/visitor.db`。
