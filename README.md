# 体育场馆赛事报名与资格检录系统

基于 Remix + TypeScript + Drizzle ORM + PostgreSQL 构建的体育赛事报名管理系统。

## 功能特性

### 核心流程
1. **报名** - 参赛者在线报名，填写个人信息和选择项目组别
2. **资格审核**
   - 经办人：补充资料、调整组别
   - 裁判：复核资格，通过或取消资格
3. **检录** - 确认参赛者到场，支持组别错误阻断和异常处理
4. **成绩归档** - 记录比赛成绩和排名

### 预置样本数据
- ✅ **资格通过** - 张三，资料齐全，正常参赛
- ❌ **证件过期** - 李四，证件有效期不足
- ⚠️ **组别错误** - 王五，性别与组别不符
- ⏰ **检录迟到** - 赵六，迟到但准予参赛

### 组别错误处理
- 检测到组别错误时**阻断检录**
- 提供两条处理路径：
  1. **换组路径** - 调整到正确组别，重新进入检录队列
  2. **撤回路径** - 取消报名，退出比赛

### 页面功能
1. **首页** - 报名列表概览、统计数据
2. **资格审核工作台** - 经办人补资料、组别调整、裁判复核
3. **检录工作台** - 到场确认、组别错误检测、异常处理
4. **详情页** - 参赛者信息、组别信息、证件信息、检录状态、审核意见、完整流程历史
5. **数据复盘** - 按项目/组别/异常原因聚合统计、到场率分析

## 技术栈

- **框架**: Remix 2.15
- **语言**: TypeScript
- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL
- **样式**: Tailwind CSS
- **工具库**: date-fns, clsx

## 快速开始

### 1. 环境准备
```bash
# 复制环境变量配置
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sports_event"
```

### 2. 安装依赖
```bash
npm install
```

### 3. 数据库初始化
```bash
# 创建数据库迁移
npm run db:generate

# 执行迁移
npm run db:migrate

# 导入样本数据
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
app/
├── db/
│   ├── index.ts      # 数据库连接
│   ├── schema.ts     # 数据模型定义
│   └── seed.ts       # 样本数据
├── lib/
│   └── utils.ts      # 工具函数
├── routes/
│   ├── _index.tsx           # 首页
│   ├── review.tsx           # 资格审核工作台
│   ├── checkin.tsx          # 检录工作台
│   ├── registration.$id.tsx # 报名详情页
│   └── analytics.tsx        # 数据复盘页
├── root.tsx         # 根路由
├── entry.client.tsx # 客户端入口
├── entry.server.tsx # 服务端入口
└── tailwind.css     # 样式文件
```

## 数据库模型

- **projects** - 比赛项目
- **groups** - 参赛组别（按年龄、性别分组）
- **participants** - 参赛者信息
- **registrations** - 报名记录（状态管理）
- **reviews** - 审核记录（经办人、裁判）
- **history** - 操作历史（完整审计日志）

## 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 代码检查
npm run db:generate  # 生成数据库迁移
npm run db:migrate   # 执行数据库迁移
npm run db:seed      # 导入样本数据
npm run db:studio    # Drizzle Studio 数据库管理
```
