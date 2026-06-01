# 运输车队事故报备与维修理赔协同系统

> 面向司机、调度员、维修主管和保险专员的全流程协同管理平台

## 项目简介

这是一个基于 **Angular 17 + NestJS 10 + SQLite** 的轻量级 TypeScript 全栈应用，实现了运输车队事故报备、维修管理和保险理赔的全流程协同管理。

## 功能特点

- 🔄 **完整业务流程**
  事故报备 → 现场材料上传 → 调度停运安排 → 维修估价 → 保险材料补充 → 理赔进度跟踪 → 复运确认

- 👥 **多角色权限控制**

| 角色 | 职责 |
|------|------|
| 司机 | 事故报备、上传现场材料、查看进度 |
| 调度员 | 审核事故、安排停运、复运确认 |
| 维修主管 | 维修估价、进度更新 |
| 保险专员 | 理赔审核、赔付管理 |

- 📊 **可视化看板**
  车辆停运看板、事故状态流转追踪、异常反馈处理

- 📱 **现代化界面**
  响应式设计，加载状态、空状态、错误状态完整处理

## 技术栈

### 后端

- **NestJS 10** - 渐进式 Node.js 框架
- **TypeORM 0.3** - ORM 框架
- **SQLite 3** - 轻量级数据库
- **JWT + Passport** - 身份认证
- **Multer** - 文件上传

### 前端

- **Angular 17** - 前端框架 (Standalone Components)
- **Angular Material** - UI 组件库
- **RxJS** - 响应式编程

## 项目结构

```
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── database/        # 数据库模块
│   │   ├── modules/         # 业务模块
│   │   ├── shared/          # 共享组件
│   │   ├── main.ts          # 入口文件
│   │   └── app.module.ts    # 根模块
│   └── package.json
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # 核心服务
│   │   │   ├── features/    # 功能页面
│   │   │   └── shared/      # 共享组件
│   │   └── main.ts
│   └── package.json
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18+
- npm >= 9+

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

```bash
# 启动后端服务 (端口 3000)
cd backend
npm run start:dev

# 启动前端服务 (端口 4200)
cd ../frontend
npm start
```

### 访问系统

打开浏览器访问: http://localhost:4200

## 测试账号

系统预置了以下测试账号，密码均为 `123456`

| 用户名 | 角色 | 说明 |
|--------|------|------|
| driver1 | 司机 | 张三 |
| driver2 | 司机 | 李四 |
| dispatcher | 调度员 | 王调度 |
| repair_manager | 维修主管 | 李维修 |
| insurance | 保险专员 | 赵保险 |

## 核心功能模块

### 1. 事故管理
- 事故报备：司机上报事故信息
- 现场材料上传
- 状态流转追踪

### 2. 车辆管理
- 车辆停运看板
- 车辆状态联动更新

### 3. 维修管理
- 维修估价
- 维修项管理

### 4. 理赔管理
- 保险材料审核
- 理赔进度跟踪

### 5. 异常反馈
- 问题反馈与处理

## API 接口

### 认证接口
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取用户信息

### 事故接口
- `GET /accidents` - 获取事故列表
- `POST /accidents` - 创建事故
- `GET /accidents/:id` - 获取事故详情
- `PUT /accidents/:id/status` - 更新事故状态

### 维修接口
- `GET /repairs` - 获取维修列表
- `POST /repairs` - 创建维修
- `PUT /repairs/:id` - 更新维修

### 理赔接口
- `GET /claims` - 获取理赔列表
- `PUT /claims/:id` - 更新理赔

### 附件接口
- `POST /attachments/upload` - 上传附件

## 数据库设计

### 核心实体

1. **User** - 用户表
2. **Vehicle** - 车辆表
3. **Accident** - 事故表
4. **Repair** - 维修表
5. **RepairItem** - 维修项表
6. **Claim** - 理赔表
7. **Attachment** - 附件表
8. **StatusLog** - 状态日志表
9. **ExceptionEntity** - 异常反馈表

## 开发说明

### 后端开发

```bash
cd backend
npm run start:dev  # 开发模式
npm run build      # 构建
npm run start:prod # 生产模式
```

### 前端开发

```bash
cd frontend
npm start          # 开发模式
npm run build      # 构建
```

## 许可证

MIT License
