# 物业访客车位登记与放行核验平台

基于 React Router 7 Framework + TypeScript + Prisma + PostgreSQL 的全栈应用。

## 功能特性

### 核心流程
1. **预约登记** - 访客车辆信息录入，分配访客车位
2. **门岗放行** - 入场核验，处理车牌不一致等异常
3. **物业复核** - 离场确认、车位释放、异常追踪
4. **详情查询** - 完整信息展示与变更历史追溯

### 预置样本数据
- ✅ **预约正常** - 标准访问流程
- 🔢 **车牌不一致** - 实际车牌与预约不符场景
- 🅿️ **车位被占用** - 预约车位被占用需协调更换
- ⏰ **超时未离场** - 超时未确认离场需追踪

### 关键特性
- 归档后只读，重新处理必须留下新节点
- 车牌/车位变更时，列表摘要、详情结论和复盘数字同步变化
- 完整的变更历史记录，可追溯每次修改
- 多视角权限分离：门岗只能处理入场，物业负责复核离场

## 快速开始

### 1. 环境准备
```bash
# 确保 PostgreSQL 已启动
# 创建数据库
createdb parking_visitor
```

### 2. 安装依赖
```bash
npm install
```

### 3. 初始化数据库
```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 Schema
npm run db:push

# 导入种子数据
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173

## 项目结构

```
app/
├── routes/
│   ├── _index.tsx        # 首页 - 数据统计概览
│   ├── visits.tsx        # 访问记录列表
│   ├── visits.new.tsx    # 预约登记
│   ├── visits.$id.tsx    # 访问详情页
│   ├── gate.tsx          # 门岗放行台
│   └── property.tsx      # 物业复核台
├── lib/
│   └── db.server.ts      # Prisma 数据库连接
├── root.tsx              # 根布局
└── tailwind.css          # 样式文件

prisma/
├── schema.prisma         # 数据库 Schema
└── seed.ts               # 种子数据
```

## 数据模型

### ParkingSpot (车位)
- spotNumber: 车位编号 (唯一)
- floor: 楼层
- zone: 区域
- isAvailable: 是否可用

### Visit (访问记录)
- visitorName/Phone: 访客信息
- licensePlate: 当前车牌
- originalPlate: 原始预约车牌
- parkingSpotId: 当前车位
- originalSpotId: 原始预约车位
- status: 状态 (PENDING/CHECKED_IN/CHECKED_OUT/ARCHIVED)
- anomalyType: 异常类型
- isArchived: 是否已归档

### ChangeLog (变更记录)
- fieldName: 变更字段
- oldValue/newValue: 新旧值
- changedBy: 操作人
- note: 变更备注

### ReleaseEvidence (放行证据)
- type: 证据类型
- imageUrl: 图片地址
- capturedBy: 采集人

## 主要页面说明

### 首页 (`/`)
- 总览数据统计
- 异常类型分布
- 最近访问记录
- 快速操作入口

### 门岗放行台 (`/gate`)
- 待入场车辆列表
- 车牌核验与异常标记
- 确认放行操作
- 今日已入场记录

### 物业复核台 (`/property`)
- 在场车辆列表
- 确认离场并释放车位
- 更换车位（处理车位被占用）
- 标记超时未离场
- 异常处理统计

### 访问详情 (`/visits/:id`)
- 完整访客/车辆/车位信息
- 异常记录展示
- 放行证据查看
- 变更历史时间线
- 重新处理（修改车牌/车位）
- 归档操作

### 访问列表 (`/visits`)
- 所有访问记录表格
- 实时统计摘要
- 快速筛选查看
- 新增预约入口

## 技术栈

- **框架**: React Router 7 Framework (Remix)
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **样式**: Tailwind CSS
- **验证**: Zod

## 使用说明

### 正常流程
1. 在 `/visits/new` 新建预约
2. 门岗在 `/gate` 确认放行
3. 物业在 `/property` 确认离场

### 异常处理
- **车牌不一致**: 门岗核验时勾选异常，输入实际车牌
- **车位被占用**: 物业更换车位，记录异常
- **超时未离场**: 物业标记超时，发起追踪

### 重新处理
在详情页展开"重新处理"，可修改车牌或车位，系统会自动记录变更历史。
