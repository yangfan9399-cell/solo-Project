# 技术架构文档 - 运输车队事故报备系统

## 1. 技术选型

### 1.1 整体架构
- **前端**: Angular 17 + TypeScript + Angular Material
- **后端**: NestJS 10 + TypeScript
- **数据库**: SQLite 3 + TypeORM
- **文件存储**: 本地文件系统（uploads目录）

### 1.2 选型理由
- **Angular**: 企业级前端框架，内置路由、表单、HTTP客户端，适合多角色权限系统
- **NestJS**: 基于TypeScript的Node.js框架，模块化架构，与TypeORM完美集成
- **SQLite**: 轻量级文件数据库，无需独立服务，适合第一版快速落地

## 2. 项目结构

```
trae-solo-coder-3/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── modules/         # 业务模块
│   │   │   ├── auth/        # 认证模块
│   │   │   ├── accidents/   # 事故模块
│   │   │   ├── vehicles/    # 车辆模块
│   │   │   ├── repairs/     # 维修模块
│   │   │   ├── claims/      # 理赔模块
│   │   │   ├── attachments/ # 附件模块
│   │   │   └── exceptions/  # 异常模块
│   │   ├── shared/          # 共享模块
│   │   ├── database/        # 数据库配置
│   │   └── main.ts
│   ├── uploads/             # 文件上传目录
│   └── database.sqlite      # SQLite数据库文件
├── frontend/                # Angular 前端
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # 核心服务、守卫
│   │   │   ├── shared/      # 共享组件、管道
│   │   │   ├── pages/       # 页面组件
│   │   │   └── features/    # 功能模块
│   │   ├── assets/
│   │   └── environments/
└── README.md
```

## 3. 数据库设计

### 3.1 核心表结构

#### users (用户表)
```sql
- id: UUID (主键)
- username: VARCHAR(50) (唯一)
- password: VARCHAR(255)
- name: VARCHAR(100)
- role: ENUM('driver', 'dispatcher', 'repair_manager', 'insurance_specialist')
- phone: VARCHAR(20)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### vehicles (车辆表)
```sql
- id: UUID (主键)
- plate_number: VARCHAR(20) (唯一)
- model: VARCHAR(100)
- type: VARCHAR(50)
- status: ENUM('active', 'out_of_service', 'in_repair')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### accidents (事故表)
```sql
- id: UUID (主键)
- report_no: VARCHAR(50) (唯一, 自动生成)
- vehicle_id: UUID (外键)
- reporter_id: UUID (外键)
- accident_time: TIMESTAMP
- location: VARCHAR(255)
- cause: TEXT
- description: TEXT
- casualties: INTEGER (伤亡人数)
- status: ENUM('pending_review', 'reviewed', 'in_repair', 'in_claim', 'completed', 'rejected')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### repairs (维修记录表)
```sql
- id: UUID (主键)
- accident_id: UUID (外键)
- repair_manager_id: UUID (外键)
- estimated_cost: DECIMAL(10,2)
- actual_cost: DECIMAL(10,2)
- start_time: TIMESTAMP
- estimated_end_time: TIMESTAMP
- actual_end_time: TIMESTAMP
- status: ENUM('pending', 'in_progress', 'completed')
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### repair_items (维修项目表)
```sql
- id: UUID (主键)
- repair_id: UUID (外键)
- name: VARCHAR(200)
- quantity: INTEGER
- unit_price: DECIMAL(10,2)
- subtotal: DECIMAL(10,2)
- created_at: TIMESTAMP
```

#### claims (理赔记录表)
```sql
- id: UUID (主键)
- accident_id: UUID (外键)
- insurance_specialist_id: UUID (外键)
- policy_no: VARCHAR(100)
- claim_amount: DECIMAL(10,2)
- paid_amount: DECIMAL(10,2)
- status: ENUM('pending_materials', 'under_review', 'approved', 'paid', 'rejected')
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### attachments (附件表)
```sql
- id: UUID (主键)
- accident_id: UUID (外键, 可选)
- repair_id: UUID (外键, 可选)
- claim_id: UUID (外键, 可选)
- uploader_id: UUID (外键)
- file_name: VARCHAR(255)
- file_path: VARCHAR(500)
- file_type: VARCHAR(50)
- file_size: INTEGER
- category: VARCHAR(50) (scene, repair, insurance)
- created_at: TIMESTAMP
```

#### status_logs (状态变更日志表)
```sql
- id: UUID (主键)
- accident_id: UUID (外键)
- operator_id: UUID (外键)
- from_status: VARCHAR(50)
- to_status: VARCHAR(50)
- remark: TEXT
- created_at: TIMESTAMP
```

#### exceptions (异常反馈表)
```sql
- id: UUID (主键)
- reporter_id: UUID (外键)
- handler_id: UUID (外键, 可选)
- accident_id: UUID (外键, 可选)
- title: VARCHAR(200)
- description: TEXT
- status: ENUM('pending', 'processing', 'resolved')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 4. API 接口设计

### 4.1 认证接口
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/profile` - 获取当前用户信息

### 4.2 事故管理接口
- `GET /api/accidents` - 事故列表（分页、筛选）
- `GET /api/accidents/:id` - 事故详情
- `POST /api/accidents` - 创建事故报备
- `PUT /api/accidents/:id` - 更新事故信息
- `PUT /api/accidents/:id/status` - 变更事故状态
- `GET /api/accidents/:id/logs` - 状态变更日志

### 4.3 车辆管理接口
- `GET /api/vehicles` - 车辆列表
- `GET /api/vehicles/out-of-service` - 停运车辆看板数据

### 4.4 维修管理接口
- `POST /api/repairs` - 创建维修估价
- `PUT /api/repairs/:id` - 更新维修信息
- `GET /api/repairs/accident/:accidentId` - 获取事故维修记录

### 4.5 理赔管理接口
- `POST /api/claims` - 创建理赔记录
- `PUT /api/claims/:id` - 更新理赔信息
- `GET /api/claims/accident/:accidentId` - 获取事故理赔记录

### 4.6 附件接口
- `POST /api/attachments/upload` - 上传文件
- `GET /api/attachments/:id/download` - 下载文件
- `DELETE /api/attachments/:id` - 删除附件

### 4.7 异常反馈接口
- `GET /api/exceptions` - 异常列表
- `POST /api/exceptions` - 提交异常反馈
- `PUT /api/exceptions/:id` - 处理异常

## 5. 前端架构

### 5.1 核心模块
- **CoreModule**: 认证服务、API服务、路由守卫、角色权限控制
- **SharedModule**: 通用组件（加载状态、空状态、错误提示、文件上传）
- **Features**:
  - DashboardModule: 仪表盘
  - AccidentsModule: 事故管理（列表、详情、报备）
  - VehiclesModule: 车辆看板
  - RepairsModule: 维修管理
  - ClaimsModule: 理赔管理
  - ExceptionsModule: 异常反馈

### 5.2 状态管理
- 使用 Angular Services + RxJS 进行状态管理
- 局部状态使用 Component Store 模式

### 5.3 路由配置
```
/login                          # 登录页
/dashboard                      # 仪表盘
/accidents                      # 事故列表
/accidents/new                  # 事故报备
/accidents/:id                  # 事故详情
/vehicles/board                 # 车辆停运看板
/repairs                        # 维修列表
/repairs/:id                    # 维修详情
/claims                         # 理赔列表
/claims/:id                     # 理赔详情
/exceptions                     # 异常反馈
```

## 6. 安全设计

### 6.1 认证
- JWT Token 认证
- Token 存储在 HttpOnly Cookie 或 LocalStorage
- Token 过期自动刷新

### 6.2 授权
- 路由守卫: `AuthGuard` (登录校验)
- 角色守卫: `RoleGuard` (权限校验)
- 后端使用 NestJS Guards 进行接口权限控制

### 6.3 文件上传安全
- 文件类型白名单校验（图片、PDF）
- 文件大小限制（单文件 10MB）
- 文件名重命名防注入

## 7. 部署方案

### 7.1 开发环境
- 后端: `npm run start:dev` (端口 3000)
- 前端: `ng serve` (端口 4200)
- 代理配置: 前端 API 请求代理到后端

### 7.2 生产环境
- 前端构建: `ng build --configuration production`
- 后端构建: `npm run build`
- 静态文件由 NestJS 托管
- 单服务部署，无需额外中间件
