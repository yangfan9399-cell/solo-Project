# 制造车间返工单流转与质检复判系统

一个基于 FastAPI + SQLite + Jinja2 + HTMX 的轻量级制造车间质量管理系统，面向产线班长、质检员和工艺工程师。

## 功能特性

### 核心业务流程
- **不良品登记**: 产线班长登记不良品信息，选择缺陷类型和描述
- **缺陷分类**: 支持表面、尺寸、装配、材料、功能等多种缺陷类别
- **返工工序派发**: 指派返工人员，关联工艺指导文档
- **工艺指导**: 工艺工程师维护各类缺陷的返工指导规范
- **复检判定**: 质检员对返工完成的产品进行复检，判定合格/继续返工
- **报废审批**: 无法修复的产品走报废审批流程
- **质量统计**: 多维度质量数据统计和可视化

### 页面功能
- 📊 **数据概览**: 关键指标看板，缺陷类型分布，月度趋势
- 📋 **返工单管理**: 列表、详情、新建、编辑，支持状态筛选
- 📌 **返工看板**: 可视化看板，按状态展示返工单
- 📖 **工艺指导**: 工艺文档管理，按缺陷类型分类
- ⚠️ **异常反馈**: 问题反馈和跟踪
- 📈 **质量统计**: 详细的质量数据分析

## 技术栈

- **后端框架**: FastAPI 0.109
- **数据库**: SQLite + SQLAlchemy 2.0
- **模板引擎**: Jinja2
- **前端交互**: HTMX (无构建工具)
- **样式**: 原生 CSS (无框架依赖)

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 初始化数据库和示例数据

```bash
python -m scripts.init_db
```

### 3. 启动服务

```bash
uvicorn app.main:app --reload
```

### 4. 访问系统

打开浏览器访问: http://localhost:8000

## 项目结构

```
.
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── database.py          # 数据库配置
│   ├── models.py            # SQLAlchemy 数据模型
│   ├── schemas.py           # Pydantic 数据结构
│   ├── crud.py              # 数据库操作
│   ├── constants.py         # 常量定义
│   ├── templates/           # Jinja2 模板
│   │   ├── base.html        # 基础布局
│   │   ├── dashboard.html   # 数据概览
│   │   ├── kanban.html      # 返工看板
│   │   ├── statistics.html  # 质量统计
│   │   ├── 404.html         # 404页面
│   │   ├── reworks/         # 返工单相关页面
│   │   ├── process_guides/  # 工艺指导相关页面
│   │   └── exceptions/      # 异常反馈相关页面
│   └── static/
│       └── css/style.css    # 样式文件
├── scripts/
│   └── init_db.py           # 初始化脚本
├── requirements.txt         # Python 依赖
└── README.md
```

## 数据模型

### 用户 (User)
- 产线班长 (line_leader)
- 质检员 (quality_inspector)
- 工艺工程师 (process_engineer)

### 返工单 (ReworkOrder)
- 基本信息: 单号、产品、批次、数量
- 缺陷信息: 类型、描述
- 状态流转: pending → assigned → in_progress → reinspection → approved/scrap
- 关联: 创建人、负责人、工艺指导、工序步骤、质检记录

### 工艺指导 (ProcessGuide)
- 按缺陷类型分类的返工指导文档
- 支持富文本内容

### 质检记录 (Inspection)
- 复检结果、合格数量、不合格数量
- 质检员信息和备注

### 异常反馈 (ExceptionFeedback)
- 问题上报、优先级、状态跟踪
- 可关联具体返工单

## 状态流转说明

```
待处理 (pending)
    ↓ 派工
已派工 (assigned)
    ↓ 开始返工
返工中 (in_progress)
    ↓ 提交复检  /  ↓ 申请报废
待复检 (reinspection)      待报废审批 (scrap)
    ↓ 复检通过  /  ↓ 需继续返工    ↓ 批准报废
已完成 (approved) / 返工中 (in_progress)  已报废 (scrap_approved)
```

## API 接口

### 页面路由
- `GET /` - 数据概览
- `GET /reworks` - 返工单列表
- `GET /reworks/new` - 新建返工单表单
- `POST /reworks` - 创建返工单
- `GET /reworks/{id}` - 返工单详情
- `GET /kanban` - 返工看板
- `GET /process-guides` - 工艺指导列表
- `GET /exceptions` - 异常反馈列表
- `GET /statistics` - 质量统计

### JSON API
- `GET /api/stats` - 获取统计数据
- `GET /api/reworks` - 获取返工单列表
- `GET /api/reworks/{id}` - 获取返工单详情

## 开发说明

### 添加新的页面
1. 在 `app/templates/` 创建模板文件
2. 在 `app/main.py` 添加路由
3. 使用 `templates.TemplateResponse` 渲染

### 添加新的数据模型
1. 在 `app/models.py` 定义模型
2. 在 `app/schemas.py` 定义 Pydantic schema
3. 在 `app/crud.py` 实现 CRUD 操作

## 演示数据

初始化脚本会创建以下演示用户：
- 产线班长: 张班长 (demo_leader)
- 质检员: 李质检员 (demo_quality)
- 工艺工程师: 王工程师 (demo_engineer)

以及 15 个示例返工单、4 份工艺指导、2 条异常反馈。

## 许可证

MIT
