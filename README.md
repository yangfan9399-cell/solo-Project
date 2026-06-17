# 考古探方出土层位关系编辑器

一个专业的考古地层学分析工具，支持层位关系管理、Harris 矩阵生成、异常检测、版本追踪和报告导出。

## ✨ 功能特性

- **项目台账**：多项目管理，支持搜索、状态筛选和分页
- **层位管理**：地层、遗迹、扰动等多种层位单元类型
- **层位关系**：在上、在下、打破、填充、同期等关系类型
- **Harris 矩阵**：自动生成地层时序矩阵可视化
- **矛盾检测**：地层循环、深度冲突、孤立层位、厚度不一致等异常检测
- **出土物管理**：按层位关联出土器物，支持编目检索
- **照片关联**：总览照、细节照、剖面图、平面图、器物照等
- **版本历史**：完整的变更追踪和批次管理
- **导出报告**：摘要概览、Markdown 报告、JSON 数据三种格式

## 🛠️ 技术栈

- **框架**: Astro 5 + TypeScript
- **前端交互**: React 18 (Islands 架构)
- **数据存储**: JSON 文件（轻量级，无需数据库服务）
- **样式**: 土褐色系考古主题

## 📦 快速开始

### 安装依赖

```bash
npm install
```

### 初始化样例数据

```bash
npm run init-data
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:4321 查看应用。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
/
├── data/                  # 数据存储目录
│   └── database.json      # JSON 数据库文件
├── public/                # 静态资源
├── scripts/               # 工具脚本
│   ├── init-data.js       # 样例数据初始化
│   ├── ensure-node.js     # 签名问题修复（macOS）
│   └── run-astro.js       # Astro 启动包装器
├── src/
│   ├── components/        # React 组件
│   │   ├── HarrisMatrix.tsx    # Harris 矩阵可视化
│   │   └── UnitEditor.tsx      # 层位单元编辑器
│   ├── layouts/           # 布局组件
│   ├── lib/               # 业务逻辑
│   │   ├── db.ts          # 数据访问层
│   │   ├── projects.ts    # 项目管理
│   │   ├── units.ts       # 层位单元管理
│   │   ├── relations.ts   # 层位关系管理
│   │   ├── artifacts.ts   # 出土物管理
│   │   ├── photos.ts      # 照片管理
│   │   ├── versionHistory.ts  # 版本历史
│   │   ├── harrisMatrix.ts    # Harris 矩阵算法
│   │   ├── anomalies.ts   # 异常检测
│   │   ├── export.ts      # 导出功能
│   │   └── utils.ts       # 工具函数
│   ├── pages/             # 页面路由
│   │   ├── index.astro    # 项目台账首页
│   │   ├── about.astro    # 使用说明
│   │   └── projects/
│   │       ├── [id].astro          # 项目详情页
│   │       └── [id]/
│   │           ├── export.astro    # 导出报告页
│   │           └── history.astro   # 版本历史页
│   ├── styles/            # 全局样式
│   └── types/             # TypeScript 类型定义
└── package.json
```

## 🏛️ 考古专业概念

### 层位单元类型

- **地层 (layer)**：自然或文化形成的堆积层
- **遗迹 (feature)**：灰坑、墓葬、房址、窖穴等人工遗迹
- **扰动 (disturbance)**：盗洞、现代坑、动物洞穴等后期扰动

### 层位关系类型

- **在上 (above)**：层位 A 叠压在层位 B 之上，A 晚于 B
- **在下 (below)**：层位 A 被层位 B 叠压，A 早于 B
- **打破 (cut)**：遗迹 A 打破地层 B，A 晚于 B
- **填充 (fills)**：堆积 A 填充遗迹 B，A 晚于 B
- **同期 (contemporary)**：两层位属于同一时期

### Harris 矩阵

Harris 矩阵是考古地层学中表示层位单元时间先后关系的图形化方法，通过拓扑排序展示地层的堆积序列。

## 🔍 异常检测类型

| 类型 | 严重程度 | 说明 |
|------|----------|------|
| stratigraphic_cycle | error | 地层关系中存在循环，违反叠覆律 |
| depth_conflict | error | 层位深度与关系逻辑冲突 |
| orphan_unit | warning | 孤立层位，未与其他层位建立关系 |
| thickness_mismatch | warning | 厚度计算与深度数据不一致 |
| unconfirmed_relation | info | 未确认的层位关系 |

## 📝 数据说明

项目使用 JSON 文件作为轻量级数据库，所有数据存储在 `data/database.json` 中。包含以下数据集合：

- `projects` - 项目信息
- `units` - 层位单元
- `relations` - 层位关系
- `artifacts` - 出土物
- `photos` - 照片
- `versionHistory` - 版本历史记录

## 📄 许可证

MIT License
