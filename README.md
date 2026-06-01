# 酒店会务会议室预订与服务工单系统

面向会务销售、宴会服务主管和客户经理的会务全流程管理系统，将会议室预订、布场需求、茶歇设备、服务人员排班、现场问题反馈、费用确认和会后复盘串联为完整闭环。

## 技术栈

- **后端**: Flask 3.x + Flask-SQLAlchemy
- **数据库**: SQLite 3 (单文件数据库)
- **模板**: Jinja2
- **交互**: HTMX (局部刷新) + Alpine.js (轻量交互)
- **样式**: 自定义 CSS (CSS 变量 + BEM 命名)
- **无编译型工具链**, 纯 Python 运行

## 快速启动

```bash
# 1. 创建虚拟环境并安装依赖
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. 启动应用 (首次启动自动创建数据库和示例数据)
python run.py

# 3. 访问 http://127.0.0.1:5000
```

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 工作台 | `/` | 统计概览、近期会议、今日安排、异常提醒、本周日历 |
| 会议室 | `/rooms/` | 会议室列表、详情、周日程日历视图 |
| 预订管理 | `/bookings/` | 预订 CRUD、状态流转(草稿→已确认→进行中→已完成) |
| 布场需求 | `/setups/` | 布场工单、布局方案、确认流程 |
| 茶歇设备 | `/caterings/` | 茶歇套餐、设备需求、确认流程 |
| 人员排班 | `/staffs/` | 人员列表、排班日历、新增排班 |
| 问题反馈 | `/issues/` | 现场异常提交、优先级标记、状态跟踪 |
| 费用确认 | `/costs/` | 费用明细、审批/退回、调整 |
| 会后复盘 | `/reviews/` | 评分、问题总结、改进建议 |

## 用户角色

| 角色 | 核心权限 |
|------|----------|
| 会务销售 | 创建/编辑预订、发起布场与茶歇需求、查看费用与复盘 |
| 宴会服务主管 | 确认布场方案、排班服务人员、处理现场问题、填写复盘 |
| 客户经理 | 确认费用、查看会议状态与进度、审批异常变更 |

## 项目结构

```
├── app/
│   ├── __init__.py          # Flask 应用工厂
│   ├── models.py            # SQLAlchemy 数据模型 (9 张表)
│   ├── seed.py              # 示例数据种子
│   ├── blueprints/          # 路由蓝图
│   │   ├── dashboard.py     # 工作台
│   │   ├── rooms.py         # 会议室
│   │   ├── bookings.py      # 预订管理
│   │   ├── setups.py        # 布场需求
│   │   ├── caterings.py     # 茶歇设备
│   │   ├── staffs.py        # 人员排班
│   │   ├── issues.py        # 问题反馈
│   │   ├── costs.py         # 费用确认
│   │   └── reviews.py       # 会后复盘
│   └── services/            # 业务逻辑层 (预留)
├── templates/               # Jinja2 模板
│   ├── base.html            # 基础布局 (侧边栏+顶栏)
│   ├── partials/            # 可复用组件
│   │   ├── _status_badge.html
│   │   ├── _priority_badge.html
│   │   ├── _empty_state.html
│   │   ├── _loading.html
│   │   ├── _error.html
│   │   ├── _pagination.html
│   │   ├── _cost_summary.html
│   │   └── _timeline.html
│   ├── dashboard/           # 工作台模板
│   ├── rooms/               # 会议室模板
│   ├── bookings/            # 预订模板
│   ├── setups/              # 布场模板
│   ├── caterings/           # 茶歇模板
│   ├── staffs/              # 排班模板
│   ├── issues/              # 问题反馈模板
│   ├── costs/               # 费用模板
│   └── reviews/             # 复盘模板
├── static/
│   ├── css/style.css        # 完整样式系统
│   └── js/app.js            # HTMX 配置与交互
├── instance/                # SQLite 数据库文件 (自动创建)
├── config.py                # 配置文件
├── run.py                   # 启动入口
└── requirements.txt         # Python 依赖
```

## 数据模型

9 张核心数据表: `room`, `staff`, `booking`, `setup_request`, `catering_request`, `staff_assignment`, `issue_report`, `cost_item`, `review`

预订为核心实体，关联布场需求、茶歇设备、人员排班、问题反馈、费用明细和复盘记录。所有外键关系和索引详见 `app/models.py`。

## 示例数据

首次启动自动加载示例数据，包括:
- 6 间会议室 (翡翠厅/琥珀厅/珊瑚厅/珍珠厅/玛瑙厅/水晶厅)
- 8 名服务人员
- 8 条预订记录 (覆盖各种状态)
- 布场、茶歇、排班、问题、费用、复盘等关联数据

## 核心流程

```
预订创建 → 布场需求 → 茶歇设备 → 人员排班 → 会议进行 → 问题反馈 → 费用确认 → 会后复盘
```

状态流转:
- 预订: 草稿 → 已确认 → 进行中 → 已完成 (任何状态可取消)
- 布场: 待确认 → 已确认 → 布置中 → 已完成
- 问题: 待处理 → 处理中 → 已解决/已关闭
- 费用: 待审批 → 已审批/已退回
