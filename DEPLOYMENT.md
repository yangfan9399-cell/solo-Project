# 公益捐赠物资管理平台 - 部署指南

## 项目概述
公益捐赠物资入库分配与受赠确认平台，采用 Django 5 + HTMX + SQLite 技术栈。

## 环境要求
- Python 3.10+
- Django 5.0.4
- htmx-django 1.17.0

## 安装步骤

### 1. 激活虚拟环境
```bash
cd /Users/yangfan/Desktop/trae-solo-generated-projects/q-119
source venv/bin/activate
```

### 2. 安装依赖
```bash
pip install django==5.0.4 htmx-django==1.17.0
```

### 3. 数据库迁移
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. 创建超级用户
```bash
python manage.py createsuperuser
```

### 5. 运行开发服务器
```bash
python manage.py runserver 0.0.0.0:8000
```

### 6. 访问地址
```
http://localhost:8000
```

## 预置样本数据

平台已预置以下样本数据场景：

| 场景 | 说明 |
|------|------|
| 正常发放 | 分配计划ID 1（已归档） |
| 物资过期 | 批次 B202401003（口罩已过期，禁止分配） |
| 信息缺失 | XX社区居委会（无联系方式） |
| 数量差异 | 分配计划ID 2（发放30袋，实际签收28袋） |

## 功能模块

1. **首页仪表盘** - 统计待入库、库存、过期、待审批、待签收数量

2. **物资批次管理** - 登记入库、查看详情、批次列表

3. **分配计划** - 创建分配、审批、发放流程

4. **受赠确认** - 签收确认，支持数量差异记录

5. **审计复核** - 归档或追查有问题的分配

6. **受赠方管理** - 管理受赠方信息

7. **复盘分析** - 按项目、物资类别、差异原因、发放周期聚合统计

## 业务规则

- 物资过期时禁止分配
- 分配数量不能超过可用库存
- 签收数量与发放数量不一致时标记差异
- 完整的历史节点记录

## 技术栈

- **框架**: Django 5.0.4
- **前端**: HTMX 1.9.10 + Vanilla CSS
- **数据库**: SQLite 3
- **图标**: 无（纯CSS样式）
