# 影院遗失物登记与认领核验系统

面向影院值班经理、影厅保洁员和客服前台的遗失物管理系统。

## 功能特性

### 核心业务流程
- **拾物登记**: 保洁员登记拾获物品，关联影厅和场次
- **物品保管**: 物品存入保管柜，自动分配位置
- **失主申领**: 客服前台登记失主信息，创建申领记录
- **身份核验**: 值班经理核验失主身份，审核申领
- **领取签收**: 确认物品领取，签名记录
- **超期处置**: 超过30天无人认领的物品进行处置

### 主要页面
- 📊 **控制台**: 数据概览和快捷入口
- 📦 **物品管理**: 物品列表、搜索、筛选、详情
- ✏️ **拾物登记**: 新物品登记表单
- 📋 **申领管理**: 申领审核和处理
- 🗄️ **保管柜看板**: 可视化保管柜状态
- ⏰ **超期处理**: 超期物品提醒和处置

### 数据模型
- **用户**: 值班经理、保洁员、客服前台三种角色
- **影厅**: 影院放映厅信息
- **场次**: 电影放映场次
- **保管柜**: 3个区域共30个保管柜
- **物品**: 遗失物品详细信息和状态
- **失主**: 申领人身份信息
- **申领**: 申领记录和审核流程
- **操作日志**: 完整的操作审计记录

## 技术栈

- **前端**: SvelteKit + TypeScript + Tailwind CSS
- **后端**: SvelteKit Server Actions
- **数据库**: SQLite (better-sqlite3)
- **部署**: Vite 构建，适配 Node.js 环境

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── lib/
│   ├── types.ts              # 类型定义
│   ├── app.css               # 全局样式
│   └── server/
│       ├── db.ts             # 数据库初始化和连接
│       └── services.ts       # 业务逻辑服务层
├── routes/
│   ├── +layout.svelte        # 主布局
│   ├── +page.svelte          # 控制台首页
│   ├── +page.server.ts       # 首页数据加载
│   ├── items/
│   │   ├── +page.svelte      # 物品列表
│   │   ├── +page.server.ts   # 物品列表服务端
│   │   ├── new/              # 新建物品
│   │   └── [id]/             # 物品详情
│   ├── claims/
│   │   ├── +page.svelte      # 申领列表
│   │   ├── +page.server.ts   # 申领列表服务端
│   │   └── [id]/             # 申领详情
│   ├── lockers/              # 保管柜看板
│   └── overdue/              # 超期处理
└── hooks.server.ts           # 服务端钩子（数据库初始化）
```

## 数据库说明

### 数据存储位置
- 数据库文件: `data/cinema_lost_found.db`
- 首次启动自动初始化数据库和示例数据

### 示例用户
| 用户名 | 姓名 | 角色 |
|--------|------|------|
| manager | 张经理 | 值班经理 |
| cleaner1 | 李阿姨 | 保洁员 |
| cleaner2 | 王阿姨 | 保洁员 |
| reception1 | 刘前台 | 客服前台 |

### 物品状态流转
```
已拾获 (found) → 保管中 (storing) → 待领取 (claimed) → 已归还 (returned)
                          ↓
                     已处置 (disposed) / 异常 (exception)
```

### 申领状态流转
```
待审核 (pending) → 核验中 (verifying) → 已通过 (approved) → 已完成 (completed)
                          ↓
                    已拒绝 (rejected) / 已取消 (cancelled)
```

## 开发说明

### 添加新页面
1. 在 `src/routes/` 下创建对应目录
2. 创建 `+page.svelte` 作为页面组件
3. 需要服务端数据时创建 `+page.server.ts`

### 添加数据库操作
1. 在 `src/lib/server/services.ts` 中添加函数
2. 使用 `db.prepare()` 执行 SQL 语句
3. 重要操作记录到 `activity_logs` 表

## 常见问题

### Q: 如何重置数据库？
A: 删除 `data/` 目录，重启开发服务器即可重新初始化。

### Q: 如何添加新的物品分类？
A: 修改 `src/lib/types.ts` 中的 `ItemCategory` 类型和 `CATEGORY_LABELS` 映射。

### Q: 保管柜数量可以调整吗？
A: 可以，修改 `src/lib/server/db.ts` 中初始化保管柜的循环次数。

## License

MIT
