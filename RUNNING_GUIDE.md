# 社区垃圾分类巡查与整改销项系统 - 运行指南

## 技术栈
- **前端框架**: Qwik City (基于 Qwik 的全栈框架)
- **语言**: TypeScript
- **ORM**: Prisma 5.22.0
- **数据库**: PostgreSQL
- **样式**: Tailwind CSS 3.4.1

## 预置业务样本

系统预置了4类典型业务场景样本，用于演示完整的业务流程：

| 样本编号 | 场景类型 | 状态 | 说明 |
|---------|---------|------|------|
| INSP-2025-0001 | 合格销项 | 已销项 | 证据完整，已通过复核完成销项 |
| INSP-2025-0002 | 照片缺失 | 待复核 | 缺少整改后照片和过程照片，无法销项 |
| INSP-2025-0003 | 责任楼栋不匹配 | 已退回 | 照片中的楼栋与责任楼栋不匹配，已退回 |
| INSP-2025-0004 | 整改超期 | 待整改 | 超期48小时未处理，标记为逾期 |

## 预置用户

| 用户名 | 角色 | 密码 |
|-------|------|------|
| inspector1 | 巡查员 | 123456 |
| inspector2 | 巡查员 | 123456 |
| reviewer1 | 复核员 | 123456 |
| reviewer2 | 复核员 | 123456 |

## 快速开始

### 1. 安装依赖

```bash
cd /Users/yangfan/Desktop/trae-solo-generated-projects/q-012
rm -rf node_modules package-lock.json
npm install
```

### 2. 配置数据库

确保 PostgreSQL 已启动，然后创建 `.env` 文件（如不存在）：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/waste_inspection?schema=public"
```

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建数据库表结构
npx prisma migrate dev --name init

# 填充样本数据
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

## 核心功能演示流程

### 场景一：完整的巡查→整改→复核销项流程

1. **巡查员视角**（顶部切换到 `inspector1`）
   - 首页查看待整改任务
   - 点击 INSP-2025-0004（整改超期）进入详情
   - 填写整改说明，上传整改后照片、过程照片、位置照片
   - 点击"提交整改"，状态变为"待复核"

2. **复核员视角**（顶部切换到 `reviewer1`）
   - 首页查看待复核任务
   - 进入同一条记录详情
   - 查看整改前后证据对比
   - 确认证据完整、楼栋匹配
   - 点击"确认销项"，状态变为"已销项"

### 场景二：照片缺失无法销项

1. 进入 INSP-2025-0002（照片缺失）详情
2. 顶部显示红色警告横幅，列出缺少的证据类型
3. 复核员角色下"确认销项"按钮被禁用
4. 显示补救路径：
   - 缺少整改后照片 → 请补充整改完成后的现场照片
   - 缺少过程照片 → 请补充整改作业中的过程照片

### 场景三：责任楼栋不匹配退回

1. 进入 INSP-2025-0003（责任楼栋不匹配）详情
2. 查看历史节点，了解退回原因
3. 巡查员可重新提交正确的照片

### 场景四：状态一致性验证

1. 从通知中心进入某条记录
2. 从列表页进入同一条记录
3. 从复盘入口进入同一条记录
4. 验证三处的状态和证据完全一致

## 状态流转图

```
待整改 → 提交整改 → 待复核 → 确认销项 → 已销项
  ↑         ↓                    ↓
  └───── 退回整改 ←────────── 退回
                          ↓
                        归档 → 已归档
```

## 核心技术保障

### 1. 状态一致性三重保障
- **数据库事务**: 状态更新和历史节点创建在同一事务中完成
- **乐观锁校验**: 转换前校验当前状态是否匹配预期
- **一致性查询**: 详情页查询时校验 Inspection、HistoryNode、Notification 三者状态一致

### 2. 证据完整性校验
- 必需证据类型：BEFORE_PHOTO、AFTER_PHOTO、LOCATION_PHOTO、PROCESS_PHOTO
- 提交整改时自动校验
- 复核销项前再次校验，缺失则禁止销项

### 3. 角色权限分离
- 巡查员：只能提交整改，不能复核
- 复核员：只能审核，不能提交整改
- API 层和前端双层权限校验

### 4. 完整审计追踪
- 所有操作都记录到 HistoryNode 表
- 包含操作人、时间、前后状态、描述、元数据
- 详情页右侧展示完整历史节点时间线

## 项目结构

```
q-012/
├── prisma/
│   ├── schema.prisma      # 数据模型（8个表，11个枚举）
│   └── seed.ts            # 样本数据脚本
├── src/
│   ├── lib/
│   │   ├── auth.ts        # 用户认证与 Cookie 管理
│   │   ├── consistency.ts # 状态一致性保障核心
│   │   ├── prisma.ts      # Prisma 客户端
│   │   ├── types.ts       # 类型定义与常量映射
│   │   └── utils.ts       # 工具函数（证据校验、补救路径）
│   ├── routes/
│   │   ├── index.tsx      # 首页列表
│   │   ├── layout.tsx     # 全局布局（角色切换）
│   │   ├── inspections/[id]/index.tsx  # 详情页
│   │   ├── notifications/index.tsx     # 通知中心
│   │   └── api/           # API 路由
│   └── global.css         # 全局样式
└── package.json
```

## API 接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/inspections` | 获取巡查记录列表 |
| GET | `/api/inspections/[id]` | 获取巡查记录详情 |
| POST | `/api/inspections/[id]/rectify` | 提交整改 |
| POST | `/api/inspections/[id]/review` | 复核操作（销项/退回/归档） |
| GET | `/api/notifications` | 获取通知列表 |
| POST | `/api/auth/switch-user` | 切换用户角色 |

## 常见问题

### 1. Prisma 关系名称冲突
已通过 `@relation("名称")` 为 Inspection 模型中的两个 HistoryNode 关系指定不同名称解决。

### 2. Rollup 原生模块加载失败
删除 `node_modules` 和 `package-lock.json` 后重新安装依赖即可解决。

### 3. 数据库连接失败
请确保 PostgreSQL 服务已启动，并且 `.env` 中的连接字符串正确。
