# 博物馆展品借展审批与归还点交系统

面向藏品管理员、策展人和安保运输负责人的全流程借展管理系统。

## 技术栈

- **框架**: Remix 2.10.0 + TypeScript
- **数据库**: SQLite 3 + better-sqlite3
- **样式**: 原生 CSS
- **日期处理**: date-fns

## 核心功能

### 1. 展品档案管理
- 展品信息录入、编辑、查看
- 展品分类管理
- 展品状态追踪
- 损伤记录关联

### 2. 借展申请管理
- 借展申请创建与审批
- 借展状态追踪
- 借展申请详情查看

### 3. 文保条件审核
- 文保专家审核
- 温湿度、光照等条件要求
- 风险评估与建议

### 4. 运输交接
- 运输方式与承运人管理
- 运输日程安排
- 运输状态追踪

### 5. 展期巡检
- 定期巡检记录
- 环境参数监控
- 展品状态检查

### 6. 归还点交
- 归还验收
- 展品状态确认
- 双方签字确认

### 7. 损伤记录
- 损伤报告与记录
- 损伤严重程度分级
- 修复方案管理
- 修复进度追踪

### 8. 异常反馈
- 异常事件上报
- 异常类型分类
- 处理人指派
- 解决进度追踪

### 9. 借展进度看板
- 按阶段展示借展进度
- 可视化借展流程
- 快速定位各阶段借展

## 项目结构

```
app/
├── components/          # 通用组件
│   └── Layout.tsx     # 布局组件
├── db/                  # 数据库相关
│   ├── index.ts        # 数据库连接
│   ├── schema.ts       # 数据库 Schema
│   ├── init.ts        # 数据库初始化
│   └── seed.ts        # 示例数据
├── routes/              # 页面路由
│   ├── _index.tsx     # 首页概览
│   ├── exhibits.*     # 展品档案模块
│   ├── loans.*        # 借展申请模块
│   ├── kanban.*       # 进度看板
│   ├── exceptions.*  # 异常反馈模块
│   └── damages.*     # 损伤记录模块
├── services/            # 服务层
│   ├── exhibitService.ts
│   ├── loanService.ts
│   ├── conservationService.ts
│   ├── transportService.ts
│   ├── inspectionService.ts
│   ├── returnService.ts
│   ├── damageService.ts
│   ├── exceptionService.ts
│   └── userService.ts
├── types.ts             # TypeScript 类型定义
├── root.tsx            # 根组件
└── styles.css         # 全局样式
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run db:init
```

### 3. 导入示例数据

```bash
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 访问应用

打开浏览器访问 http://localhost:3000

## 数据库表结构

### exhibits (展品表)
- id, name, code, category, era, material, dimensions, weight, description, condition, storage_location, value, insurance_info, image_url

### users (用户表)
- id, name, role, email, phone, department

### loan_applications (借展申请表)
- id, exhibit_id, exhibit_name, applicant_id, applicant_name, borrowing_institution, contact_person, contact_phone, contact_email, exhibition_name, exhibition_location, purpose, start_date, end_date, status, current_stage, priority

### conservation_reviews (文保审核表)
- id, loan_id, reviewer_id, reviewer_name, temperature_requirement, humidity_requirement, light_requirement, packaging_requirement, special_requirements, condition_assessment, risks, recommendations, approved, review_date

### transport_records (运输记录表)
- id, loan_id, transport_type, carrier, vehicle_number, driver_name, driver_phone, departure_location, destination, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival, escort_name, escort_phone, security_measures, status

### inspection_records (巡检记录表)
- id, loan_id, inspector_id, inspector_name, inspection_date, temperature, humidity, condition_status, display_check, security_check, environment_check, findings, recommendations, photos

### return_records (归还记录表)
- id, loan_id, handler_id, handler_name, return_date, return_location, receiver_name, receiver_phone, package_condition, overall_condition, items_checked, discrepancies, signatures, photos

### damage_records (损伤记录表)
- id, exhibit_id, loan_id, reporter_id, reporter_name, discovery_date, damage_location, damage_type, damage_severity, description, cause, immediate_actions, photos, status, repair_plan, estimated_cost, repair_status, remarks

### stage_transitions (阶段流转表)
- id, loan_id, from_stage, to_stage, operator_id, operator_name, remarks

### exceptions (异常表)
- id, loan_id, exhibit_id, reporter_id, reporter_name, type, title, description, severity, status, assigned_to_id, assigned_to_name, resolution, resolved_at

## 借展流程

```
申请提交 → 文保审核 → 运输交接 → 展期巡检 → 归还点交 → 完成归档
```

每个阶段都有明确的负责人和操作记录，系统自动追踪整个流程。

## 用户角色

- **藏品管理员**: 展品管理、借展审批、损伤记录
- **策展人**: 借展申请、展期巡检
- **安保运输负责人**: 运输安排、异常处理

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run typecheck    # TypeScript 类型检查
npm run db:init       # 初始化数据库
npm run db:seed       # 导入示例数据
```

## 注意事项

- 数据库文件位于项目根目录: `museum-loan-system.db`
- 首次运行需执行 `db:init` 和 `db:seed`
- 示例数据包含 5 名用户、5 件展品、4 条借展申请等测试数据

## 许可证

MIT
