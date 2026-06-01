# 物业维修报修派工与质保回访系统

基于 React + Vite + TanStack Query + Fastify + SQLite 构建的轻量级全栈物业维修管理系统。

## 功能特性

### 核心业务流程
- **业主报修**：客服录入报修信息，包括故障分类、优先级、业主信息等
- **派工管理**：班组长根据故障类型和人员负载分派维修人员
- **维修接单**：维修人员接收工单并开始处理
- **材料消耗**：维修完成时记录使用的材料和实际工时
- **完工验收**：维修完成后进行验收确认
- **质保回访**：完工后对业主进行电话回访，记录满意度
- **超时升级**：针对紧急或超时工单进行异常升级处理

### 用户角色
- **业主客服**：录入报修单、进行质保回访、查看工单列表
- **维修班组长**：派工管理、看板视图、人员工作量监控
- **物业经理**：全局数据统计、异常工单处理、质量管理

### 页面功能
1. **工作台**：数据统计概览、最近工单列表、人员工作量
2. **报修单管理**：工单列表、筛选搜索、新建报修、详情查看
3. **派工看板**：按状态分组的看板视图、人员筛选、拖拽派工
4. **质保回访**：待回访工单、回访记录、满意度统计

## 技术栈

### 后端
- **Fastify** - 高性能 Node.js Web 框架
- **better-sqlite3** - 原生 SQLite 数据库驱动
- **dayjs** - 日期时间处理库

### 前端
- **React 18** - 用户界面库
- **Vite** - 构建工具
- **TanStack Query (React Query)** - 数据同步和状态管理
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **dayjs** - 日期时间处理

## 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 初始化数据库
```bash
cd backend
npm run seed
```

这将创建 SQLite 数据库并插入示例数据：
- 6 个系统用户（客服、班组长、经理、3名维修人员）
- 6 个故障分类
- 8 种维修材料
- 6 个示例报修单（包含各种状态）
- 回访记录和升级记录

### 启动开发服务

#### 方式一：同时启动前后端
```bash
npm run dev
```

#### 方式二：分别启动
```bash
# 启动后端服务 (端口 3001)
cd backend && npm run dev

# 启动前端服务 (端口 3000)
cd frontend && npm run dev
```

### 访问应用
- 前端地址：http://localhost:3000
- 后端 API：http://localhost:3001

## 数据库设计

### 核心数据表

| 表名 | 说明 |
|------|------|
| users | 系统用户（客服、维修人员、管理人员） |
| categories | 故障分类 |
| tickets | 报修单（核心业务表） |
| ticket_logs | 工单状态流转日志 |
| materials | 维修材料 |
| ticket_materials | 工单材料消耗记录 |
| follow_ups | 质保回访记录 |
| escalation_records | 异常升级记录 |

### 工单状态流转
```
待派工 (pending)
    ↓
已派工 (assigned) → 可接单
    ↓
维修中 (in_progress) → 记录材料消耗
    ↓
已完成 (completed) → 质保回访
    ↓
已关闭 (closed)
```

### 优先级
- **紧急 (urgent)** - 红色，最高优先级，需立即处理
- **高 (high)** - 橙色，24小时内处理
- **普通 (normal)** - 蓝色，48小时内处理
- **低 (low)** - 绿色，72小时内处理

## API 接口

### 工单相关
- `GET /api/tickets` - 获取工单列表（支持筛选）
- `GET /api/tickets/:id` - 获取工单详情
- `POST /api/tickets` - 创建新工单
- `PUT /api/tickets/:id/assign` - 分派维修人员
- `PUT /api/tickets/:id/accept` - 维修人员接单
- `PUT /api/tickets/:id/complete` - 完成维修
- `PUT /api/tickets/:id/close` - 关闭工单
- `PUT /api/tickets/:id/escalate` - 异常升级
- `POST /api/tickets/:id/followup` - 添加回访记录

### 基础数据
- `GET /api/users` - 获取所有用户
- `GET /api/users/technicians` - 获取维修人员列表
- `GET /api/categories` - 获取故障分类
- `GET /api/materials` - 获取材料列表
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/followups/pending` - 获取待回访列表

## 项目结构

```
.
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── db.js           # 数据库配置和初始化
│   │   ├── index.js        # Fastify 服务入口
│   │   └── seed.js         # 示例数据种子
│   ├── data/               # SQLite 数据库文件
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── api/            # API 接口封装
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── App.jsx         # 应用入口组件
│   │   ├── main.jsx        # 渲染入口
│   │   └── index.css       # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── package.json            # 根目录配置
```

## 功能演示流程

1. **创建报修单**
   - 登录为"张客服"角色
   - 点击"新建报修"按钮
   - 填写报修信息并提交

2. **派工处理**
   - 切换到"李班长"角色
   - 在派工看板查看待派工工单
   - 拖拽工单到"已派工"列或进入详情页派工

3. **维修处理**
   - 工单状态变为"已派工"后可接单
   - 接单后状态变为"维修中"
   - 完成维修时记录材料消耗和实际工时

4. **质保回访**
   - 切换到客服角色
   - 进入"质保回访"页面
   - 对已完工单进行满意度回访

5. **异常处理**
   - 任何状态下都可进行异常升级
   - 升级后工单显示红色警告横幅

## 特色功能

### 状态管理
- 使用 TanStack Query 管理服务端状态
- 自动缓存和数据同步
- 乐观更新和错误重试

### 用户体验
- 响应式设计，支持移动端
- 加载状态、空状态、错误状态完整处理
- 时间线展示工单操作历史
- 星级评分组件

### 数据可视化
- 统计卡片展示关键指标
- 看板视图直观展示工单分布
- 人员工作量统计

## 开发说明

### 后端开发
```bash
cd backend
npm run dev    # 启动开发服务（自动重载）
npm start      # 生产模式启动
npm run seed   # 重置数据库并插入示例数据
```

### 前端开发
```bash
cd frontend
npm run dev     # 启动开发服务
npm run build   # 构建生产版本
npm run preview # 预览生产构建
```

## 注意事项

1. **数据持久化**：所有数据存储在 `backend/data/main.db` 文件中，删除该文件将丢失所有数据
2. **用户模拟**：系统通过顶部下拉框切换角色模拟不同用户，实际生产环境应接入真实认证系统
3. **文件权限**：确保 `backend/data` 目录有读写权限
4. **端口占用**：默认使用 3000（前端）和 3001（后端）端口，如需修改请在配置文件中调整

## License

MIT
