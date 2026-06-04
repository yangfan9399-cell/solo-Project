# 制造车间工序交接与返修追踪平台

基于 **Vue 3 + TypeScript + Vite + Fastify + Prisma + PostgreSQL** 构建的全栈应用，实现生产工单的工序交接、质检管理和返修追踪。

## ✨ 核心特性

### 1. 返修结论动态化证明
**返修结论不是静态写死的**，而是根据实际返修结果由操作员动态录入的业务数据：
- 返修结论存储在数据库 `ReworkRecord.reworkConclusion` 字段
- 支持三种结论：`已修复(REPAIRED)`、`报废(SCRAPPED)`、`让步接收(CONCESSION)`
- 复盘页按结论类型动态聚合统计，证明数据驱动而非逻辑写死
- 相同返修原因可能因工艺、材料、操作人员不同产生不同结论

### 2. 工序跳步阻断
- 提交交接时自动检查前序工序是否已完成并质检通过
- 归档时验证所有工序是否都有合格的质检签收
- 明确指出缺失的前序工序名称和责任班组

### 3. 角色权限分离
- **操作员**：只能提交交接说明和返修材料
- **质检员**：决定放行(PASS)、退回(REJECT)或归档(ARCHIVE)

### 4. 预置样本数据
| 工单编号 | 场景类型 | 说明 |
|---------|---------|------|
| WO-2026-0601-001 | 正常交接 | 6道工序全部完成并归档 |
| WO-2026-0601-002 | 质检退回 | 工序3精密钻孔因孔位偏移被质检退回，正在返修 |
| WO-2026-0601-003 | 工序跳步 | 缺失工序3，尝试归档时被阻断 |
| WO-2026-0601-004 | 返修二次提交 | 工序2数控铣削经两次返修后合格 |

### 5. 详情页完整展示
- ✅ 工序顺序与责任班组（时间线视图）
- ✅ 最近改动记录（交接与质检历史）
- ✅ 质检证据（检测报告、三坐标数据等）
- ✅ 返修历史（原因、材料、耗时、结论）

### 6. 复盘页多维度聚合
- 按**返修原因**聚合：识别高频问题
- 按**责任班组**聚合：定位薄弱环节
- 按**返修结论**聚合：统计修复率/报废率
- 按**重复返修次数**聚合：识别反复问题
- 按**返修耗时**聚合：分析效率瓶颈

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                     前端 (Client)                       │
│  Vue 3 + TypeScript + Vite + Pinia + Vue Router        │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP API
┌───────────────────────────▼─────────────────────────────┐
│                     后端 (Server)                       │
│  Fastify + TypeScript + Zod 验证 + Prisma ORM          │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                     数据库 (PostgreSQL)                 │
│  工单 / 工序 / 交接 / 质检 / 返修 / 用户                │
└─────────────────────────────────────────────────────────┘
```

## 📁 项目结构

```
q-005/
├── client/                    # 前端项目
│   ├── src/
│   │   ├── api/index.ts       # API 接口封装
│   │   ├── types/index.ts     # TypeScript 类型定义
│   │   ├── stores/user.ts     # 用户状态管理
│   │   ├── router/index.ts    # 路由配置
│   │   ├── views/
│   │   │   ├── WorkOrderList.vue    # 工单列表页
│   │   │   ├── WorkOrderDetail.vue  # 工单详情页
│   │   │   └── Analytics.vue        # 复盘分析页
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── style.css          # 全局样式
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                    # 后端项目
│   ├── prisma/
│   │   ├── schema.prisma      # 数据库模型定义
│   │   └── seed.ts            # 样本数据
│   ├── src/
│   │   └── server.ts          # Fastify 服务器与 API
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # 环境变量
│
├── docker-compose.yml         # PostgreSQL 容器
├── package.json               # 根项目脚本
└── README.md
```

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- Docker & Docker Compose
- npm >= 9

### 1. 启动数据库
```bash
# 启动 PostgreSQL 容器
docker-compose up -d
```

### 2. 安装依赖
```bash
# 安装后端依赖
cd server && npm install

# 安装前端依赖
cd ../client && npm install

# 或在根目录一键安装
npm run install:all
```

### 3. 初始化数据库
```bash
cd server
# 生成 Prisma 客户端并创建表结构
npx prisma generate
npx prisma migrate dev --name init

# 导入预置样本数据
npx prisma db seed
```

### 4. 启动服务

**启动后端 (端口 3001):**
```bash
cd server
npm run dev
```

**启动前端 (端口 5173):**
```bash
cd client
npm run dev
```

### 5. 访问应用
打开浏览器访问: http://localhost:5173

## 📋 API 接口说明

### 工单管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/work-orders` | 获取所有工单列表 |
| GET | `/api/work-orders/:id` | 获取工单详情 |
| POST | `/api/work-orders/:id/validate-archive` | 验证工单是否可归档 |

### 工序交接
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/handover` | 提交工序交接 | 操作员 |

### 质量管理
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/quality` | 提交质检决策（放行/退回/归档） | 质检员 |

### 返修管理
| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/rework` | 提交返修记录 | 操作员 |
| PUT | `/api/rework/:id/complete` | 填写返修结论 | 操作员 |

### 统计分析
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/statistics/overview` | 概览统计 |
| GET | `/api/statistics/rework-by-reason` | 按返修原因聚合 |
| GET | `/api/statistics/rework-by-department` | 按责任班组聚合 |
| GET | `/api/statistics/rework-by-conclusion` | 按返修结论聚合 |
| GET | `/api/statistics/repeat-reworks` | 重复返修分析 |
| GET | `/api/statistics/rework-time-distribution` | 返修耗时分布 |

## 🔐 预置用户

| 姓名 | 工号 | 角色 |
|------|------|------|
| 张明 | OP001 | 操作员 |
| 李华 | OP002 | 操作员 |
| 王强 | OP003 | 操作员 |
| 赵刚 | OP004 | 操作员 |
| 陈检 | QI001 | 质检员 |
| 刘质检 | QI002 | 质检员 |

在页面右上角可以切换当前登录用户，体验不同角色的功能差异。

## 🧪 核心功能验证

### 验证返修结论非静态
1. 进入「复盘分析」页面
2. 查看「按返修结论聚合分析」模块
3. 系统从数据库读取所有返修记录，按 `reworkConclusion` 字段分组统计
4. 尝试新增一条返修记录，选择不同的结论，刷新页面观察统计数据变化

### 验证工序跳步阻断
1. 查看工单 **WO-2026-0601-003** 详情
2. 页面顶部显示红色警告，指出缺失「工序3-精密钻孔」的前序签收
3. 尝试对工序4提交交接，系统会阻断并提示缺失工序3

### 验证权限控制
1. 切换到操作员角色（如 OP001 张明）
2. 只能看到「提交交接」和「提交返修」按钮
3. 切换到质检员角色（如 QI001 陈检）
4. 只能看到「质检处理」按钮

## 📊 数据库模型

### 核心表结构
- **User**: 用户（操作员/质检员）
- **ProcessTemplate**: 工艺流程模板
- **ProcessStep**: 工序步骤（属于模板）
- **WorkOrder**: 生产工单
- **WorkOrderProcess**: 工单工序实例
- **HandoverRecord**: 交接记录
- **QualityInspection**: 质检记录
- **ReworkRecord**: 返修记录

### 枚举类型
```prisma
enum UserRole         { OPERATOR, QUALITY_INSPECTOR }
enum ProcessStatus    { PENDING, IN_PROGRESS, HANDED_OVER, REWORKING, QUALITY_CHECK, PASSED, FAILED, ARCHIVED }
enum QualityDecision  { PASS, REJECT, ARCHIVE }
enum ReworkConclusion { REPAIRED, SCRAPPED, CONCESSION }
```

## 🛠️ 开发命令

```bash
# 数据库操作
npm run db:migrate    # 执行迁移
npm run db:seed       # 导入种子数据
npm run db:reset      # 重置数据库

# 代码检查
npm run build         # 生产构建
```

## 📝 关键代码参考

### 返修结论动态化实现
- 数据库定义: [schema.prisma](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/server/prisma/schema.prisma#L32-L36)
- 后端存储逻辑: [server.ts](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/server/src/server.ts#L363-L399)
- 前端录入表单: [WorkOrderList.vue](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/client/src/views/WorkOrderList.vue#L554-L589)
- 动态聚合统计: [Analytics.vue](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/client/src/views/Analytics.vue#L234-L294)

### 工序跳步阻断实现
- 交接时校验: [server.ts](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/server/src/server.ts#L200-L251)
- 归档前校验: [server.ts](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/server/src/server.ts#L106-L172)
- 前端提示: [WorkOrderDetail.vue](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-005/client/src/views/WorkOrderDetail.vue#L293-L303)

## 🎯 总结

本系统通过以下设计证明返修结论不是静态写死：

1. **数据存储层**: 返修结论作为 `ReworkRecord` 表的可写字段持久化
2. **业务逻辑层**: 操作员在返修完成时动态选择结论，系统不预设固定值
3. **统计分析层**: 复盘页直接从数据库按结论字段聚合，数据变化实时反映
4. **样本数据层**: 预置多种返修场景，包括相同原因不同结论的案例

用户可以通过实际操作（录入不同返修结论）验证系统的动态性。
