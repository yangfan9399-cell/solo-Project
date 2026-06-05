# 工厂危废转运申请与联单核验平台

基于 Laravel 11 + Inertia + React + MySQL 的危废转运全流程管理系统。

## 功能特性

### 核心业务流程
1. **危废暂存登记** - 仓库经办人负责危废暂存和重量登记
2. **转运申请** - 提交转运申请，自动检测重量超限
3. **联单确认** - 环保专员确认危废转运联单
4. **环保复核** - 复核人决定放行、退回或归档

### 预置样本数据
- ✅ 正常转运流程
- ⚠️ 重量超限提醒
- ❌ 联单缺失处理
- 🚫 承运单位资质过期（禁止放行）

### 复盘统计功能
- 按危废类别统计重量
- 按承运商统计单数
- 按异常原因统计（重量超限、联单缺失、资质过期）
- 按处理耗时聚合分析

## 系统要求

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 5.7+
- npm / yarn

## 安装步骤

### 1. 安装依赖

```bash
# 安装 PHP 依赖
composer install

# 安装 Node.js 依赖
npm install
```

### 2. 配置环境

复制 `.env.example` 为 `.env` 并配置数据库连接：

```bash
cp .env.example .env
```

修改 `.env` 文件中的数据库配置：

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=waste_management
DB_USERNAME=root
DB_PASSWORD=
```

### 3. 生成应用密钥

```bash
php artisan key:generate
```

### 4. 创建数据库

```bash
# 创建数据库
mysql -u root -e "CREATE DATABASE waste_management;"

# 运行迁移
php artisan migrate

# 填充样本数据
php artisan db:seed
```

### 5. 编译前端资源

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
```

### 6. 启动开发服务器

```bash
php artisan serve
```

访问 `http://localhost:8000` 即可使用系统。

## 测试账号

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 仓库经办人 | warehouse@example.com | password123 | 暂存登记、转运申请 |
| 环保专员 | environmental@example.com | password123 | 联单确认 |
| 复核人 | reviewer@example.com | password123 | 复核放行/退回/归档 |

## 项目结构

### 数据库表结构
- `users` - 用户表（含角色字段）
- `carriers` - 承运单位表
- `waste_categories` - 危废类别表
- `storage_locations` - 暂存位置表
- `waste_batches` - 危废批次表
- `transfer_requests` - 转运申请表
- `manifest_forms` - 联单表
- `reviews` - 复核记录表
- `process_histories` - 流程历史表

### 主要模型
- `User` - 用户模型（含角色判断方法）
- `WasteBatch` - 危废批次模型
- `TransferRequest` - 转运申请模型
- `Carrier` - 承运商模型（资质过期判断）
- `ManifestForm` - 联单模型
- `Review` - 复核模型
- `ProcessHistory` - 流程历史模型

### 主要控制器
- `DashboardController` - 仪表盘与复盘统计
- `WasteBatchController` - 危废批次管理
- `TransferRequestController` - 转运申请管理
- `ManifestFormController` - 联单管理
- `ReviewController` - 复核管理
- `LoginController` - 认证管理

### 前端页面
- `Welcome.jsx` - 首页
- `Auth/Login.jsx` - 登录页
- `Dashboard/Index.jsx` - 仪表盘（含复盘统计）
- `WasteBatches/Index.jsx` - 危废批次列表
- `WasteBatches/Create.jsx` - 暂存登记表单
- `WasteBatches/Show.jsx` - 批次详情
- `TransferRequests/Index.jsx` - 转运申请列表
- `TransferRequests/Create.jsx` - 转运申请表单
- `TransferRequests/Show.jsx` - 申请详情（含联单、复核、历史）
- `Layouts/AuthenticatedLayout.jsx` - 认证布局

## 核心业务规则

1. **重量超限检测**：申请时自动对比危废类别最大重量限制，超限则标记提醒
2. **资质过期拦截**：承运商资质过期时，禁止选择且复核时无法放行
3. **联单缺失提醒**：未上传联单的申请会有异常标记
4. **流程状态流转**：暂存 → 申请 → 联单确认 → 复核（放行/退回/归档）

## 技术栈

- **后端**: Laravel 11
- **前端**: React 18 + Inertia.js
- **样式**: Tailwind CSS
- **构建**: Vite
- **数据库**: MySQL

## 开发说明

### 添加新的页面
1. 在 `resources/js/Pages/` 创建 React 组件
2. 在 `routes/web.php` 添加路由
3. 在对应控制器中使用 `Inertia::render()` 渲染

### 添加新的业务逻辑
1. 创建/更新模型
2. 创建/更新迁移文件
3. 创建/更新控制器
4. 添加路由
5. 创建/更新前端页面

## License

MIT
