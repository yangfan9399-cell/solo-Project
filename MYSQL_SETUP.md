# MySQL 配置指南

## 当前状态

项目已配置为使用 MySQL，但由于当前环境中存在 ICU 库版本兼容性问题，MySQL 服务暂时无法启动。

## 在您的环境中配置 MySQL

### 步骤 1：确保 MySQL 服务运行

```bash
# 检查 MySQL 服务状态
brew services list | grep mysql

# 如果未运行，启动服务
brew services start mysql

# 或者手动启动
mysqld_safe --user=mysql &
```

### 步骤 2：创建数据库

```bash
mysql -h 127.0.0.1 -u root -e "CREATE DATABASE decoration_system;"
```

### 步骤 3：运行数据库迁移和种子数据

```bash
cd /Users/yangfan/Desktop/trae-solo-generated-projects/q-118
php artisan migrate --seed
```

### 步骤 4：启动开发服务器

```bash
php artisan serve
```

### 步骤 5：访问项目

打开浏览器访问：http://localhost:8000

## 如果遇到 ICU 库版本问题

### 问题描述
MySQL 8.1.0 需要 icu4c 73 版本，但系统安装的是 icu4c 78。

### 解决方案

**方案 1：升级 MySQL 到最新版本**
```bash
brew upgrade mysql
brew services restart mysql
```

**方案 2：安装兼容的 icu4c 版本**
```bash
brew install icu4c@73
brew link icu4c@73 --force
```

**方案 3：使用 SQLite（备选方案）**

如果 MySQL 配置遇到困难，可以切换回 SQLite：

```bash
# 修改 .env 文件
DB_CONNECTION=sqlite
DB_DATABASE=/Users/yangfan/Desktop/trae-solo-generated-projects/q-118/database/database.sqlite

# 运行迁移
php artisan migrate --seed

# 启动服务器
php artisan serve
```

## 预置样本数据

迁移完成后，数据库将包含以下样本数据：

| 商户名称 | 类型 | 楼层 | 状态 | 备注 |
|---------|------|------|------|------|
| 星巴克 | 餐饮 | 1F | 已批准开工 | 正常开工样本 |
| 优衣库 | 零售 | 2F | 待运营经理批准 | 消防材料缺失样本 |
| 万达影城 | 娱乐 | 5F | 待工程部审核 | 噪音时段冲突样本 |
| 华为体验店 | 零售 | 1F | 已退回 | 围挡尺寸不符样本 |
| 海底捞 | 餐饮 | B1 | 待消防安全员复核 | - |
| 周大福 | 零售 | 1F | 已完成 | - |

## 项目功能

1. **仪表盘** (`/`) - 展示申请统计数据和最近申请列表
2. **申请管理** (`/applications`) - 商户提交装修资料，支持新增、查看、删除申请
3. **审批流程** - 工程部审核 → 消防安全员复核 → 运营经理批准
4. **详情页** - 展示商户信息、施工周期、围挡方案、消防材料、限制时段和历史节点
5. **看板统计** (`/kanban`) - 按楼层、商户类型、退回原因和审批时长聚合展示

## 业务规则

- 消防材料缺失时禁止运营经理批准开工
- 审批状态流转：待提交 → 待工程部审核 → 待消防安全员复核 → 待运营经理批准 → 已批准开工
