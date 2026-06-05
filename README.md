# 教育机构试听课预约与转化回访系统

基于 SvelteKit + TypeScript + Drizzle ORM + PostgreSQL 构建的招生顾问业务工作台。

## 功能特性

### 角色权限
- **招生顾问 (consultant)**: 预约、改期、填写回访说明
- **教务管理员 (admin)**: 确认老师排课、处理时间冲突
- **部门主管 (supervisor)**: 复核转化结论、退回重跟进

### 核心功能
1. **预约工作台**: 按状态分类展示所有预约，支持新建预约
2. **学员管理**: 查看所有学员信息和来源渠道
3. **预约详情**: 完整展示学员信息、课程、老师、变更记录、回访记录和责任人
4. **排课确认**: 教务确认排课时自动检测老师时间冲突
5. **冲突处理**: 老师冲突时阻断排课，提供换老师或改期路径
6. **回访管理**: 试听后填写回访内容、学员反馈、兴趣度和转化建议
7. **转化复核**: 主管审核回访记录，确认转化成功/失败或退回跟进
8. **数据复盘**: 按渠道、课程、到课状态和转化结果聚合统计，可跳转具体学员

### 预置样本数据
- 正常到课并转化成功
- 学生爽约待跟进
- 老师时间冲突已改期
- 回访意见缺失待填写

## 技术栈
- **前端**: SvelteKit + TypeScript + Tailwind CSS
- **后端**: SvelteKit Server Routes
- **ORM**: Drizzle ORM
- **数据库**: PostgreSQL

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置数据库
复制 `.env.example` 为 `.env` 并配置数据库连接：
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/education_crm
```

### 3. 创建数据库
```sql
CREATE DATABASE education_crm;
```

### 4. 生成并执行数据库迁移
```bash
npm run db:generate
npm run db:migrate
```

### 5. 导入种子数据
```bash
npm run db:seed
```

### 6. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 招生顾问 | consultant@example.com | password123 |
| 教务管理员 | admin@example.com | password123 |
| 部门主管 | supervisor@example.com | password123 |

## 项目结构

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts      # 数据库表结构定义
│   │   ├── index.ts       # 数据库连接
│   │   └── seed.ts        # 种子数据
│   ├── components/        # 组件
│   └── auth.ts            # 认证工具
├── routes/
│   ├── api/               # API 路由
│   │   ├── login/
│   │   ├── appointments/
│   │   ├── followups/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── courses/
│   │   └── statistics/
│   ├── login/             # 登录页
│   ├── students/          # 学员管理
│   ├── statistics/        # 数据复盘
│   ├── appointments/[id]/ # 预约详情
│   ├── +layout.svelte     # 布局组件
│   └── +page.svelte       # 工作台首页
└── app.css               # 全局样式
```

## 核心业务流程

1. **新建预约**: 顾问选择学员和课程创建预约
2. **教务排课**: 教务确认老师和时间，系统自动检测冲突
3. **学员试听**: 学员完成试听或爽约
4. **顾问回访**: 顾问填写回访记录和转化建议
5. **主管复核**: 主管审核转化结论
6. **数据分析**: 通过复盘页面查看各维度统计

## 老师冲突检测

教务确认排课时系统会自动检测：
- 该老师在同一时间段是否已有其他排课
- 检测到冲突时阻断操作并显示冲突原因
- 自动推荐相同专业领域的替代老师
- 提供改期或更换老师两种解决路径