# 校园设备报修派单与验收闭环系统

基于 Next.js 15 + TypeScript + Prisma + PostgreSQL 的校园设备报修管理系统，实现从报修提交到验收归档的完整闭环流程。

## 功能特性

### 核心流程
- **提交报修** - 提交设备故障报修单
- **派工分配** - 管理员分配维修人员
- **维修处理** - 维修员记录维修过程
- **配件缺货处理** - 缺货时支持延期或改派
- **验收审核** - 验收员独立审核（与维修员视角分离）
- **工单归档** - 验收通过后归档

### 预置样本数据
1. **可直接验收** - REP-2024-0001 (待验收状态)
2. **配件缺货** - REP-2024-0002 (配件缺货阻断状态)
3. **重复报修** - REP-2024-0003 (返工中)
4. **验收不通过** - REP-2024-0004 (验收不通过)

### 详情页展示
- 报修来源、设备位置
- 当前处理人信息
- 维修记录时间线
- 验收意见记录
- 历史流转状态

### 复盘统计
- 按设备类型聚合
- 按处理耗时统计
- 返工次数统计
- 验收结果分布
- 可跳转至具体报修单

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+

### 安装步骤

1. 安装依赖
```bash
npm install
```

2. 配置数据库
复制 `.env.example` 为 `.env` 并修改数据库连接：
```bash
cp .env.example .env
```
编辑 `.env` 文件：
```
DATABASE_URL="postgresql://username:password@localhost:5432/campus_repair?schema=public"
```

3. 创建数据库
```bash
createdb campus_repair
```

4. 初始化数据库
```bash
npx prisma db push
```

5. 导入种子数据
```bash
npm run prisma:seed
```

6. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用

## 项目结构

```
src/
├── app/
│   ├── actions.ts           # 服务端动作
│   ├── layout.tsx           # 全局布局
│   ├── page.tsx             # 报修单列表首页
│   ├── repair/[id]/
│   │   ├── page.tsx         # 报修单详情页
│   │   └── components/
│   │       ├── RepairActions.tsx       # 操作面板组件
│   │       └── PartsShortageBanner.tsx # 配件缺货提示
│   └── review/
│       └── page.tsx         # 统计复盘页
├── lib/
│   ├── prisma.ts            # Prisma 客户端
│   ├── utils.ts             # 工具函数
│   └── constants.ts         # 常量定义
└── prisma/
    ├── schema.prisma        # 数据模型
    └── seed.ts              # 种子数据
```

## 业务流程说明

```
已提交 → 已派工 → 维修中 ┬→ 配件缺货 → (改派/延期) → 维修中
                        ├→ 待验收 ┬→ 已验收 → 已归档
                        │         └→ 验收不通过 → 重新维修
                        └→ (添加维修记录)
```

## 角色视角分离

- **管理员** - 派工、归档
- **维修员** - 开始维修、记录维修、报告缺货、提交验收
- **验收员** - 验收通过/不通过（独立操作，与维修员操作分离）
