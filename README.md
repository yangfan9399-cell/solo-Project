# 体育场馆伤情事件上报与保险协同系统

## 项目简介

本系统是一个面向体育场馆值班员、医务点人员和保险联络员的全栈应用，实现了从伤情事件上报、现场处置、证据收集、保险报案到复盘整改和赔付跟进的完整业务流程。

## 技术栈

- **后端框架**: Flask 3.0
- **数据库**: SQLite + SQLAlchemy ORM
- **模板引擎**: Jinja2
- **前端交互**: HTMX
- **样式框架**: Tailwind CSS

## 功能特性

### 1. 入场活动管理
- 活动信息录入（名称、场馆、时间、人数等）
- 活动状态跟踪
- 活动列表展示

### 2. 伤情事件上报
- 值班员快速上报伤情信息
- 支持伤者信息、伤情类型、严重程度等字段
- 自动生成事件编号和风险等级

### 3. 现场处置记录
- 医务人员记录处置措施
- 生命体征、用药情况登记
- 转院处理跟踪

### 4. 证据材料管理
- 现场照片、视频记录
- 医疗报告、费用单据
- 材料分类归档

### 5. 保险报案协同
- 保险联络员在线报案
- 保单信息、索赔金额管理
- 报案状态跟踪

### 6. 复盘整改跟踪
- 事件根本原因分析
- 改进措施制定
- 责任人、期限管理

### 7. 赔付进度跟进
- 赔付记录登记
- 赔付状态跟踪
- 金额、支付方式记录

### 8. 异常反馈机制
- 流程问题反馈
- 设备问题上报
- 意见建议收集

### 9. 风险看板
- 事件统计概览
- 待处理事件提醒
- 高风险事件预警

## 项目结构

```
trae-solo-coder-5/
├── app.py                  # Flask 应用主入口
├── config.py               # 配置文件
├── models.py               # 数据库模型
├── seed_data.py            # 示例数据生成器
├── requirements.txt        # Python 依赖
├── templates/              # Jinja2 模板
│   ├── base.html           # 基础布局模板
│   ├── dashboard.html      # 首页看板
│   ├── event_list.html     # 事件列表页
│   ├── event_detail.html   # 事件详情页
│   ├── event_form.html     # 事件表单页
│   ├── activity_list.html  # 活动列表页
│   ├── activity_form.html  # 活动表单页
│   └── partials/           # HTMX 组件
│       ├── event_list.html
│       ├── loading.html
│       └── error.html
├── uploads/                # 文件上传目录
└── README.md               # 项目说明
```

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 初始化数据库并加载示例数据

```bash
python seed_data.py
```

### 4. 启动应用

```bash
python app.py
```

### 5. 访问系统

打开浏览器访问: http://localhost:5000

## 数据模型

### VenueActivity (入场活动)
- 活动名称、场馆地点、活动类型
- 开始时间、结束时间、参与人数
- 主办方、联系电话、备注

### InjuryEvent (伤情事件)
- 事件编号、所属活动
- 上报人信息、伤者信息
- 受伤时间、地点、类型、部位
- 严重程度、风险等级、状态

### OnSiteTreatment (现场处置)
- 处置人员、处置时间
- 处置措施、生命体征、用药情况
- 是否转院、转院医院、后续安排

### Evidence (证据材料)
- 证据类型、文件名、描述
- 上传人、上传时间

### InsuranceReport (保险报案)
- 报案编号、报案人
- 保险公司、保单号
- 索赔人、预估金额、状态

### ReviewRectification (复盘整改)
- 复盘人、复盘时间
- 根本原因、改进措施
- 责任人、完成期限、完成状态

### CompensationPayment (赔付记录)
- 赔付编号、赔付时间
- 赔付金额、支付方式
- 收款人、状态

### ExceptionFeedback (异常反馈)
- 反馈类型、内容
- 反馈人、处理状态

## 状态流转

事件状态:
```
待处理 → 现场处置中 → 已报案 → 跟进中 → 已结案 → 已归档
```

严重程度:
- 轻微 (低风险)
- 一般 (中风险)
- 严重 (高风险)
- 危重 (高风险)

## 用户角色

1. **场馆值班员**
   - 活动管理
   - 伤情事件上报
   - 查看事件进度

2. **医务点人员**
   - 现场处置记录
   - 医疗证据上传
   - 事件状态更新

3. **保险联络员**
   - 保险报案登记
   - 赔付进度跟踪
   - 异常反馈处理

## API 接口

### 统计数据
```
GET /api/stats
```
返回事件统计数据，按状态、严重程度、风险等级分类。

## 开发说明

### 新增路由
在 `app.py` 中使用 `@app.route()` 装饰器添加新路由。

### 新增模型
在 `models.py` 中定义新的 SQLAlchemy 模型类。

### 新增模板
在 `templates/` 目录下创建 Jinja2 模板文件，继承 `base.html`。

### 使用 HTMX
模板中可直接使用 `hx-*` 属性实现无刷新交互：
- `hx-get` / `hx-post` - 异步请求
- `hx-target` - 更新目标元素
- `hx-trigger` - 触发条件
- `hx-indicator` - 加载指示器

## 注意事项

1. 生产环境请修改 `SECRET_KEY`
2. 建议启用数据库备份
3. 文件上传目录需要写入权限
4. 生产环境建议关闭 `debug=True`

## License

MIT License
