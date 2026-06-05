# 社区消防隐患巡检与整改验收系统

基于 Remix + TypeScript + Prisma + PostgreSQL 构建的消防隐患全流程管理系统。

## 功能特性

### 核心流程
- **巡检发现**: 巡检员登记隐患，上传现场照片
- **责任派发**: 消防复核人派发整改任务给物业
- **整改提交**: 物业经办人提交整改材料和照片
- **验收确认**: 消防复核人审核，通过或退回重改
- **归档**: 完成整改的隐患可归档保存

### 角色权限
- **巡检员 (INSPECTOR)**: 登记隐患、查看详情、补充照片
- **物业经办人 (PROPERTY_MANAGER)**: 接收任务、开始整改、提交验收
- **消防复核人 (FIRE_VERIFIER)**: 派发任务、验收审核、归档

### 预置样本数据
1. **正常整改**: 消防通道堵塞 - 完整流程通过
2. **照片缺失**: 灭火器过期 - 整改后未上传照片
3. **责任派发中**: 喷淋系统故障 - 已派发待整改
4. **复查不通过**: 应急照明不亮 - 验收退回重改
5. **已归档**: 安全出口指示牌 - 完成归档

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
确保 PostgreSQL 已启动，然后修改 `.env` 中的数据库连接：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fire_safety?schema=public"
```

### 3. 初始化数据库
```bash
npx prisma db push
npx prisma db seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 巡检员 | inspector | 123456 |
| 物业经办人 | property | 123456 |
| 消防复核人 | fire | 123456 |

## 项目结构

```
app/
├── routes/
│   ├── _index.tsx          # 首页工作台
│   ├── login.tsx           # 登录页
│   ├── logout.tsx          # 登出
│   ├── hazards.new.tsx     # 隐患登记
│   └── hazards.$id.tsx     # 隐患详情
├── utils/
│   ├── db.server.ts        # 数据库连接
│   └── session.server.ts   # 会话管理
├── root.tsx                # 根组件
├── entry.client.tsx        # 客户端入口
└── entry.server.tsx        # 服务端入口

prisma/
├── schema.prisma           # 数据模型
└── seed.ts                 # 种子数据
```

## 关键功能说明

### 照片验证机制
- 验收时检查整改前后照片完整性
- 照片缺失时无法点击"通过"按钮
- 提示用户补充证据照片

### 状态流转记录
- 每次状态变更都记录操作人、时间、备注
- 详情页完整展示时间线
- 可追溯整个处理过程

### 权限控制
- 基于角色的访问控制
- 物业只能看到分配给自己的任务
- 操作按钮根据角色和状态动态显示
