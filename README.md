# 县域疫苗冷链温控偏差处置与追溯系统

一个面向县域疾控中心的疫苗冷链温度监控与追溯管理系统，实现从冷库到接种点的全链条温度监控、偏差处置和疫苗追溯。

## 技术栈

### 前端
- **Qwik City** - 高性能全栈框架
- **TailwindCSS** - 原子化CSS
- **TypeScript** - 类型安全
- **Lucide Qwik** - 图标库

### 后端
- **Rust** - 系统级性能
- **Rocket v0.5** - 类型安全Web框架
- **SQLite** - 嵌入式数据库
- **sqlx** - 异步SQL工具包
- **chrono, uuid** - 时间和唯一标识

## 项目结构

```
├── backend/                    # Rust后端
│   ├── src/
│   │   ├── routes/            # API路由模块 (11个模块)
│   │   │   ├── cold_storages.rs       # 冷库台账
│   │   │   ├── transport_boxes.rs     # 转运箱管理
│   │   │   ├── temperature_deviations.rs # 温控偏差
│   │   │   ├── quarantine_records.rs  # 批次隔离
│   │   │   ├── review_records.rs      # 复核放行
│   │   │   ├── recall_records.rs      # 召回协同
│   │   │   ├── vaccine_batches.rs     # 疫苗批次
│   │   │   ├── vaccination_sites.rs   # 接种点管理
│   │   │   ├── site_inventories.rs    # 接种点库存
│   │   │   ├── dashboard.rs           # 仪表盘统计
│   │   │   └── trace.rs               # 追溯报表
│   │   ├── models.rs          # 数据模型 (14+ 实体)
│   │   ├── db.rs              # 数据库连接
│   │   ├── main.rs            # 服务入口
│   │   └── seed.rs            # 示例数据填充
│   ├── migrations/            # 数据库迁移
│   ├── Cargo.toml
│   ├── Rocket.toml
│   └── .env
├── frontend/                   # Qwik City前端
│   ├── src/
│   │   ├── routes/            # 页面路由 (9个页面)
│   │   │   ├── index.tsx             # 仪表盘
│   │   │   ├── cold-storages/        # 冷库台账
│   │   │   ├── transport-boxes/      # 转运箱管理
│   │   │   ├── deviations/           # 温控偏差看板
│   │   │   ├── quarantine/           # 批次隔离
│   │   │   ├── review/               # 复核放行
│   │   │   ├── recall/               # 召回协同
│   │   │   ├── trace/                # 追溯报表
│   │   │   └── inventory/            # 接种点库存
│   │   ├── components/        # 组件库
│   │   │   ├── layout/              # 布局组件
│   │   │   └── ui/                  # UI组件 (卡片、按钮、表格、模态框等)
│   │   ├── context/           # 状态管理 (角色上下文)
│   │   ├── lib/               # 工具函数 (API封装)
│   │   └── types/             # 类型定义
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 业务角色

| 角色 | 用户名 | 权限范围 |
|------|--------|----------|
| **冷链管理员** | 张冷链 | 冷库/转运箱管理、温控偏差处理、批次隔离登记 |
| **疾控复核员** | 李疾控 | 偏差复核、放行审批、召回管理、追溯查询 |
| **接种点负责人** | 王接种 | 库存确认、召回执行、库存对账 |

## 业务模块

### A模块 - 冷链管理 (冷链管理员)
1. **冷库台账** - 冷库信息管理、温区配置、运行状态
2. **转运箱管理** - 转运箱台账、位置追踪、状态监控
3. **温控偏差看板** - 温度异常监控、风险泳道分组
4. **批次隔离登记** - 异常批次隔离、优先级排序、提交复核

### B模块 - 疾控协同 (疾控复核员/接种点负责人)
1. **复核放行** - 隔离批次审核、放行/召回/销毁决策
2. **召回协同** - 召回进度跟踪、状态流转、接种点协同
3. **追溯报表** - 批次全链条追溯、温度历史查询
4. **接种点库存** - 库存管理、对账功能、差异预警

## 状态流转

### 温控偏差状态
```
已发现(detected) → 处理中(processing) → 已核实(verified) → 已解决(resolved) → 已关闭(closed)
```

### 批次隔离状态
```
已隔离(quarantined) → 待复核(pending_review) → 已放行(released)
                                         ↘ 已召回(recalled)
                                         ↘ 已销毁(destroyed)
```

### 召回状态
```
已通知(notified) → 进行中(in_progress) → 已完成(completed)
                              ↘ 已取消(cancelled)
```

## 初始化

### 环境要求
- Rust 1.70+
- Node.js 18+
- sqlx-cli (用于数据库迁移)

### 后端初始化

```bash
cd backend

# 1. 安装Rust依赖
cargo build

# 2. 安装sqlx-cli
cargo install sqlx-cli

# 3. 创建数据库并执行迁移
sqlx database create
sqlx migrate run

# 4. 导入示例数据 (覆盖风险场景)
cargo run --bin seed

# 5. 启动后端服务 (端口: 8000)
cargo run
```

### 前端初始化

```bash
cd frontend

# 1. 安装依赖
npm install

# 2. 开发模式启动 (端口: 5173, 代理API到8000)
npm run dev

# 3. 生产构建
npm run build
```

### 快速启动

```bash
# 后端 (终端1)
cd backend && cargo run

# 前端 (终端2)
cd frontend && npm run dev
```

## API接口

### 核心接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘统计数据 |
| GET | `/api/cold-storages` | 冷库列表 |
| POST | `/api/cold-storages` | 新增冷库 |
| GET | `/api/transport-boxes` | 转运箱列表 |
| GET | `/api/temperature-deviations` | 温控偏差列表 |
| GET | `/api/temperature-deviations/risk-lanes` | 风险泳道分组 |
| PUT | `/api/temperature-deviations/:id/status` | 更新偏差状态 |
| GET | `/api/quarantine-records` | 隔离记录列表 |
| POST | `/api/quarantine-records` | 新增隔离记录 |
| PUT | `/api/quarantine-records/:id/priority` | 更新优先级 |
| PUT | `/api/quarantine-records/:id/submit-review` | 提交复核 |
| GET | `/api/review-records` | 复核记录列表 |
| POST | `/api/review-records` | 创建复核记录 (事务) |
| GET | `/api/recall-records` | 召回记录列表 |
| PUT | `/api/recall-records/:id/status` | 更新召回状态 |
| GET | `/api/site-inventories` | 接种点库存列表 |
| PUT | `/api/site-inventories/:id/reconcile` | 库存对账 |
| GET | `/api/trace-reports` | 追溯报表列表 |
| GET | `/api/trace-report/:batch_id` | 单批次追溯详情 |

## 风险场景覆盖 (Seed数据)

1. **严重超温未隔离** - 1号冷库严重超温(>25°C)持续180分钟
2. **转运超温异常** - 转运箱运输途中超温(18°C)持续90分钟
3. **复核超时预警** - 隔离批次等待复核超过24小时
4. **召回通知缺失** - 部分接种点未收到召回通知
5. **库存不一致** - 城关镇接种点库存账面与实际不符
6. **低温异常波动** - 冷库温度波动异常(<0°C)
7. **高风险待处理** - 多个高风险偏差等待处理

## 前端特色功能

### 1. 温控偏差看板 - 风险泳道视图
- 按温区和偏差时长自动分组
- 4个风险泳道：严重超温、中度超温、轻度超温、低温异常
- 卡片式展示，支持列表/泳道切换

### 2. 批次隔离优先级管理
- 可视化优先级排序
- 上下箭头快速调整
- 支持拖拽扩展
- 一键提交复核

### 3. 召回状态流转
- 线性进度条可视化
- 状态机控制流转
- 接种点协同标记

### 4. 角色视图差异化
- 侧边栏菜单按角色动态过滤
- 顶部显示当前角色和用户名
- 一键切换角色演示不同视图

## 响应式适配

- **桌面端** (≥1024px) - 完整侧边栏 + 多列布局
- **平板端** (768px-1024px) - 简化侧边栏 + 双列布局
- **移动端** (<768px) - 顶部导航 + 单列滚动

## 交互状态

- **Loading** - 骨架屏/加载动画
- **Empty** - 空状态提示 + 操作引导
- **Error** - 错误信息展示 + 重试按钮
- **表单校验** - 必填项、格式校验
- **操作反馈** - 成功/失败Toast提示

## 项目验证清单

### ✅ 已完成项

#### 后端 (Rust + Rocket + SQLite)
- [x] 完整数据库Schema (14张表 + 索引)
- [x] 11个API路由模块
- [x] 数据模型定义 (14+ 实体)
- [x] 温控偏差风险泳道分组API
- [x] 复核事务处理 (同时更新隔离记录和批次状态)
- [x] 库存对账功能
- [x] 批次全链条追溯API
- [x] Seed示例数据 (覆盖7种风险场景)
- [x] CORS跨域配置
- [x] 统一API响应格式

#### 前端 (Qwik City + TailwindCSS)
- [x] 9个业务页面
- [x] 通用UI组件库 (卡片、按钮、表格、模态框、状态标签)
- [x] 角色权限控制 (3种角色视图)
- [x] 温控偏差看板 (列表/风险泳道双视图)
- [x] 批次隔离优先级调整
- [x] 召回进度可视化
- [x] 追溯报表详情弹窗
- [x] 库存对账功能
- [x] Loading/Empty/Error状态组件
- [x] 响应式布局适配
- [x] 侧边栏动态菜单

#### 文档
- [x] 详细README说明
- [x] 项目结构说明
- [x] 启动/迁移/seed命令
- [x] 业务角色说明
- [x] 状态流转说明

### ⚠️ 简化项

1. **认证系统** - 使用角色切换模拟，未实现真实登录/JWT
2. **实时推送** - 未实现WebSocket实时温度推送，使用轮询/刷新
3. **文件上传** - 未实现凭证/报告文件上传
4. **导出功能** - 未实现报表PDF/Excel导出
5. **拖拽排序** - 使用按钮调整优先级，未实现完整拖拽
6. **审计日志** - 数据库表已设计，前端未展示页面

### ❌ 未完成项

1. **高级搜索** - 多条件组合筛选、日期范围选择
2. **数据可视化** - ECharts温度曲线图、统计图表
3. **消息通知** - 站内消息、短信通知集成
4. **批量操作** - 批量隔离、批量复核
5. **打印功能** - 召回通知书、复核意见书打印
6. **移动端App** - PWA或原生App

### 🔒 限制说明

1. **SQLite并发** - SQLite适合小型部署，高并发建议PostgreSQL
2. **Rust编译** - 首次编译耗时较长，约3-5分钟
3. **内存占用** - 后端约20-30MB，前端开发模式约200MB
4. **浏览器兼容** - 仅支持现代浏览器 (Chrome/Edge/Firefox/Safari)
5. **时区处理** - 所有时间使用UTC，显示未做时区转换

### 🧪 真实验证内容

1. **数据库迁移** - `sqlx migrate run` 可正常执行
2. **Seed数据导入** - `cargo run --bin seed` 可正常填充
3. **后端编译** - `cargo build` 无编译错误
4. **API响应** - 所有GET接口返回正确JSON格式
5. **前端构建** - `npm run build` 可正常构建
6. **页面路由** - 所有页面可正常访问
7. **角色切换** - 侧边栏菜单正确过滤
8. **API代理** - Vite代理配置正确
9. **响应式布局** - 不同屏幕尺寸适配正常
10. **状态组件** - Loading/Empty/Error展示正常

## 访问地址

启动后访问：
- 前端: http://localhost:5173
- 后端API: http://localhost:8000

## 开发建议

1. **低内存配置** - 后端默认5个数据库连接，可在db.rs调整
2. **热重载** - 前端支持HRM，后端需安装cargo-watch
3. **数据库查看** - 使用DB Browser for SQLite查看vaccine.db
4. **API调试** - 使用Thunder Client或Postman测试接口

## License

MIT
