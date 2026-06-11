# 教育培训课程排课冲突处理与课时结算系统

基于 Remix + TypeScript + Prisma + SQLite 构建的一站式课程排课管理系统。

## 功能特性

### 核心业务流程
- **教务提交排课**：创建排课，系统自动检测教师和教室冲突
- **校区主管审核**：审核资源配置，确认或驳回排课申请
- **教师确认授课**：教师确认授课时间，开始上课
- **财务复核结算**：核对实际课时，完成费用结算支付

### 冲突检测
- **教师冲突**：同一教师在同时段有其他课程安排时，系统阻断排课并提示可选时段
- **教室冲突**：同一教室在同时段被其他课程占用时，系统提示冲突原因

### 统计分析
- 按校区聚合统计（排课数、完成数、课时、营收）
- 按课程聚合统计（排课数、完成数、平均满班率）
- 按冲突原因聚合（教师冲突、教室冲突占比）
- 满班率分析（各课程招生情况可视化）

## 预置样本数据

1. **正常结算**：完整流程演示（排课→审核→确认→完成→结算）
2. **教师冲突**：张老师同时段课程冲突，系统检测并推荐可选时段
3. **教室冲突**：A101教室同时段占用冲突，系统提示原因
4. **学生请假**：课程完成后标记学生请假，考勤与结算联动

## 技术栈

- **前端框架**：Remix 2.x (React 18)
- **开发语言**：TypeScript 5.x
- **ORM**：Prisma 5.x
- **数据库**：SQLite
- **样式**：Tailwind CSS 3.x
- **图表**：Recharts 2.x
- **日期处理**：date-fns 3.x
- **验证**：Zod 3.x
- **构建工具**：Vite 5.x

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 创建数据库表
npm run db:migrate

# 导入样本数据
npm run db:seed

# 或者一键完成
npm run db:setup
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 4. 类型检查

```bash
npm run typecheck
```

### 5. 生产构建

```bash
npm run build
npm run start
```

## 项目结构

```
├── app/
│   ├── routes/              # 页面路由
│   │   ├── _index.tsx       # 首页概览
│   │   ├── schedules._index.tsx   # 排课列表
│   │   ├── schedules.new.tsx      # 新建排课
│   │   ├── schedules.$id.tsx      # 排课详情
│   │   └── statistics.tsx         # 统计分析
│   ├── utils/               # 工具函数
│   │   ├── prisma.server.ts       # Prisma 客户端
│   │   ├── scheduling.server.ts   # 排课冲突检测
│   │   ├── workflow.server.ts     # 工作流处理
│   │   ├── statistics.server.ts   # 统计计算
│   │   └── format.ts              # 格式化工具
│   ├── root.tsx             # 根组件
│   ├── entry.client.tsx     # 客户端入口
│   ├── entry.server.tsx     # 服务端入口
│   └── tailwind.css         # 全局样式
├── prisma/
│   ├── schema.prisma        # 数据库模型
│   └── seed.ts              # 种子数据
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

## 数据库模型

### 核心实体
- **Campus（校区）**：多校区管理
- **User（用户）**：系统管理员、教师、财务、校区主管
- **Course（课程）**：课程信息、定价、最大人数
- **Classroom（教室）**：教室资源、容量
- **Student（学生）**：学生信息
- **Schedule（排课）**：课程安排、状态、冲突信息
- **Attendance（考勤）**：学生出勤记录
- **Settlement（结算）**：课时费用结算
- **HistoryNode（历史节点）**：审批流程历史

### 状态流转

```
DRAFT(草稿) → SUBMITTED(待审核) → APPROVED(审核通过) → TEACHER_CONFIRMED(教师确认)
                                                                  ↓
SETTLED(已结算) ← COMPLETED(已完成) ← IN_PROGRESS(上课中)
```

## API 路由

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 首页概览 |
| `/schedules` | GET | 排课列表 |
| `/schedules/new` | GET/POST | 新建排课 |
| `/schedules/:id` | GET/POST | 排课详情及操作 |
| `/statistics` | GET | 统计分析 |

## 角色权限模拟

- **系统管理员（教务）**：创建排课、提交审核、标记请假
- **校区主管**：审核排课、确认资源
- **教师**：确认授课、开始/完成课程
- **财务**：复核结算、确认支付

## 冲突检测算法

系统通过时间段重叠检测来识别冲突：

1. 获取指定教师/教室的所有有效排课
2. 检测时间区间是否重叠：`start1 < end2 && end1 > start2`
3. 若存在冲突，计算推荐可选时段（按课程时长遍历工作时间）
4. 返回冲突信息及可选时段列表

## 数据可视化

- 校区柱状图：对比各校区排课数据
- 冲突饼图：展示冲突原因分布
- 满班率横向柱状图：直观展示各课程招生情况
- 进度条：课程完成率、审批流程可视化

## License

MIT
