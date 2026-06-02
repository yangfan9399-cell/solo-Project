# 工厂量具借用与校准到期管理系统

基于 Nuxt 3 + Nitro API + SQLite 构建的轻量级全栈应用，面向计量管理员、产线领用人和质量主管。

## 功能特性

### 📋 量具台账管理
- 量具信息录入、编辑、查询
- 支持按编号、名称、序列号搜索
- 按状态、部门筛选
- 量具状态流转（可用/借用中/校准中/维护中/已报废）
- 量具详情查看

### 📦 借用管理
- 借用申请提交
- 借用审批流程
- 出库交接确认
- 归还验收登记
- 借用状态追踪

### ⏰ 校准管理
- 校准计划安排
- 校准记录管理
- 校准周期设置
- 校准到期预警
- 校准结果记录

### 📊 仪表盘看板
- 统计概览卡片
- 校准到期预警（30天内/已逾期）
- 借用逾期预警
- 实时数据统计

### 📝 异常反馈
- 问题反馈提交
- 关联相关量具
- 反馈处理流程
- 状态追踪

## 用户角色

| 角色 | 权限 |
|------|------|
| **计量管理员 (admin)** | 量具台账管理、借用审批、出库交接、归还验收、校准管理 |
| **产线领用人 (operator)** | 查看量具、申请借用、提交反馈 |
| **质量主管 (quality)** | 借用审批、校准管理、反馈处理 |

## 技术栈

- **前端框架**: Nuxt 3 + Vue 3 + TypeScript
- **样式方案**: Tailwind CSS
- **后端服务**: Nitro (内置在 Nuxt 中)
- **数据库**: SQLite (better-sqlite3)
- **部署方式**: Node.js 单进程

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 插入示例数据（可选）

```bash
npx nuxi prepare
npx tsx scripts/seed-data.ts
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用系统。

### 4. 生产构建

```bash
npm run build
npm run preview
```

## 目录结构

```
.
├── assets/              # 静态资源
│   └── css/
│       └── main.css     # 全局样式
├── components/          # Vue 组件
│   ├── LoadingSpinner.vue
│   ├── EmptyState.vue
│   ├── ErrorState.vue
│   ├── Modal.vue
│   └── StatCard.vue
├── composables/         # 组合式函数
│   ├── useAuth.ts
│   ├── useTools.ts
│   ├── useBorrows.ts
│   ├── useCalibrations.ts
│   ├── useFeedbacks.ts
│   └── useDashboard.ts
├── layouts/             # 页面布局
│   └── default.vue
├── pages/               # 页面路由
│   ├── index.vue        # 仪表盘
│   ├── tools.vue        # 量具列表
│   ├── tools/[id].vue   # 量具详情
│   ├── borrows.vue      # 借用管理
│   ├── calibrations.vue # 校准管理
│   └── feedbacks.vue    # 异常反馈
├── server/              # 服务端代码
│   ├── api/             # API 路由
│   │   ├── users.get.ts
│   │   ├── tools/
│   │   ├── borrows/
│   │   ├── calibrations/
│   │   ├── feedbacks/
│   │   └── dashboard/
│   ├── plugins/         # Nitro 插件
│   │   └── database.ts
│   └── utils/           # 服务端工具
│       └── database.ts  # 数据库操作
├── types/               # TypeScript 类型定义
│   └── index.ts
├── scripts/             # 脚本
│   └── seed-data.ts     # 示例数据
├── data/                # 数据库文件目录（自动创建）
└── README.md
```

## API 接口

### 用户
- `GET /api/users` - 获取用户列表

### 量具
- `GET /api/tools` - 获取量具列表（支持筛选）
- `GET /api/tools/:id` - 获取量具详情
- `POST /api/tools` - 新增量具
- `PUT /api/tools/:id` - 更新量具
- `POST /api/tools/:id/scrap` - 报废量具

### 借用
- `GET /api/borrows` - 获取借用记录
- `POST /api/borrows` - 创建借用申请
- `POST /api/borrows/:id/approve` - 审批借用
- `POST /api/borrows/:id/handover` - 出库交接
- `POST /api/borrows/:id/return` - 归还验收

### 校准
- `GET /api/calibrations` - 获取校准记录
- `POST /api/calibrations` - 安排校准
- `POST /api/calibrations/:id/start` - 开始校准
- `POST /api/calibrations/:id/complete` - 完成校准

### 反馈
- `GET /api/feedbacks` - 获取反馈记录
- `POST /api/feedbacks` - 提交反馈
- `POST /api/feedbacks/:id/handle` - 处理反馈

### 仪表盘
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/calibration-alerts` - 获取校准预警
- `GET /api/dashboard/borrow-alerts` - 获取借用预警

## 数据库模型

### users（用户表）
- id, username, name, role, department, created_at

### tools（量具表）
- id, code, name, specification, manufacturer, model, serial_number, measurement_range, accuracy, department, location, status, calibration_cycle_days, last_calibration_date, next_calibration_date, purchase_date, price, remark, created_at, updated_at

### borrow_records（借用记录表）
- id, tool_id, tool_code, tool_name, applicant_id, applicant_name, applicant_department, purpose, expected_return_date, status, approver_id, approver_name, approval_remark, approved_at, handover_person_id, handover_person_name, handed_over_at, return_inspector_id, return_inspector_name, return_condition, returned_at, remark, created_at, updated_at

### calibration_records（校准记录表）
- id, tool_id, tool_code, tool_name, planned_date, actual_date, status, calibration_agency, certificate_number, calibration_result, next_calibration_date, cost, inspector_id, inspector_name, remark, created_at, updated_at

### feedbacks（反馈表）
- id, tool_id, tool_code, reporter_id, reporter_name, type, title, description, status, handler_id, handler_name, handle_result, handled_at, created_at, updated_at

## 使用说明

1. **选择用户身份**: 在页面右上角选择要模拟的用户角色
2. **查看仪表盘**: 首页展示统计概览和预警信息
3. **管理量具**: 进入「量具台账」页面可新增、编辑、查看、报废量具
4. **申请借用**: 在量具详情页可提交借用申请
5. **审批借用**: 管理员/质量主管在「借用管理」页面审批申请
6. **安排校准**: 在「校准管理」页面安排和记录校准
7. **提交反馈**: 在「异常反馈」页面提交问题反馈

## 默认用户

系统初始化时会自动创建以下测试用户：

| 用户名 | 姓名 | 角色 | 部门 |
|--------|------|------|------|
| admin | 系统管理员 | 计量管理员 | 质量部 |
| operator1 | 张三 | 产线领用人 | 生产一部 |
| operator2 | 李四 | 产线领用人 | 生产二部 |
| quality1 | 王质量 | 质量主管 | 质量部 |

## 许可证

MIT
