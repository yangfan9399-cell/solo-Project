# 快递驿站滞留件预警与投诉处理系统

面向驿站店员、片区主管和客服专员的快递驿站管理平台，覆盖包裹入站到退回出站全流程。

## 技术方案

- **后端**: Django 4.2+ / Python 3.10+
- **数据库**: SQLite (零配置开箱即用)
- **前端**: HTMX + 原生 CSS (无编译工具链，服务端渲染)
- **交互**: HTMX 局部刷新，无需 SPA 框架

## 快速启动

```bash
# 1. 创建虚拟环境并安装依赖
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. 执行数据库迁移
python manage.py migrate

# 3. 加载示例数据
python manage.py load_sample_data

# 4. 启动开发服务器
python manage.py runserver

# 5. 打开浏览器访问
# http://127.0.0.1:8000/
```

## 登录账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | Django 后台超级管理员 |
| 店员 | staff1~staff3 | staff123 | 驿站日常操作 |
| 片区主管 | staff4~staff5 | staff123 | 监督管理 |
| 客服专员 | staff6~staff7 | staff123 | 投诉处理 |

## 功能模块

### 📊 滞留风险看板
- 总包裹数、待取件、滞留件、异常件统计
- 预警等级分布 (预警3天 / 严重5天 / 紧急7天+)
- 各驿站滞留情况对比
- 今日动态 (提醒数、退回数、异常数)
- 最新预警、异常、投诉快速入口

### 📋 包裹管理
- **包裹入站**: 录入单号、收寄件人、货架编码、快递公司
- **包裹列表**: 按状态/驿站/关键词筛选
- **包裹详情**: 完整流转时间线 + 关联提醒/预警/异常/投诉/退回
- **状态流转**: 已入站 → 待取件 → 已取件 / 滞留 / 异常 → 已退回

### 🔔 取件提醒
- 支持短信、电话、APP通知三种提醒方式
- 记录发送状态 (已发送/已送达/发送失败)
- 记录客户回应 (无回应/确认取件/延迟取件/拒收)
- HTMX 行内提交回应

### ⚠️ 滞留预警
- 自动检测滞留包裹 (3天预警/5天严重/7天紧急)
- 按等级/处理状态筛选
- 行内快速处理 (HTMX)
- 预警处理记录追踪

### ❗ 异常件登记
- 异常类型: 破损、丢失、错分驿站、超期、错件、其他
- 处理状态流转: 待处理 → 处理中 → 已解决
- 异常件详情页 + 处理表单

### 💬 客户投诉
- 投诉创建 (支持从包裹详情页快速创建)
- 投诉类型: 取件延迟、包裹破损、丢失、服务态度差、错件、其他
- 状态流转: 待受理 → 已受理 → 处理中 → 已解决 → 已关闭
- 满意度评分 (1-5分)

### ⚖️ 责任处理
- 关联投诉的责任人指定
- 责任类型: 全责/部分责任/无责任
- 处罚类型: 警告/罚款/培训/降级/无处罚
- 状态流转: 待确认 → 已确认 → 已执行 / 已申诉
- 申诉功能

### ↩️ 退回出站
- 退回原因: 滞留超期、客户要求、错分驿站、破损、拒收、其他
- 记录退回承运商和退回单号
- 自动更新包裹状态为「已退回」

## 数据模型

```
Station (驿站)
  └── Staff (员工) ── OneToOne → User
  └── Package (包裹)
        ├── PickupReminder (取件提醒)
        ├── RetentionAlert (滞留预警)
        ├── AbnormalPackage (异常件)
        ├── Complaint (投诉) ──┐
        │                     ├── Responsibility (责任处理)
        └── ReturnRecord (退回记录)
```

## 页面状态

所有列表页均已实现:
- **空状态**: 无数据时显示图标+提示+操作引导
- **加载状态**: CSS spinner 动画 (配合 HTMX indicator)
- **错误状态**: 表单验证错误提示 + 操作异常提示
- **筛选状态**: 多维度筛选 + 重置功能

## 项目结构

```
├── manage.py                  # Django 入口
├── requirements.txt           # Python 依赖
├── station/                   # Django 项目配置
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── depot/                     # 核心业务应用
│   ├── models.py              # 数据模型 (9个模型)
│   ├── views.py               # 视图函数 (20+视图)
│   ├── urls.py                # URL 路由
│   ├── forms.py               # 表单 (10个表单)
│   ├── admin.py               # Django Admin 注册
│   ├── services.py            # 业务逻辑 (预警检测+看板统计)
│   └── management/commands/
│       └── load_sample_data.py # 示例数据加载命令
├── templates/depot/           # 页面模板
│   ├── base.html              # 基础布局 (侧边栏+导航)
│   ├── login.html             # 登录页
│   ├── dashboard.html         # 滞留风险看板
│   ├── package_*.html         # 包裹相关页面
│   ├── reminder_*.html        # 提醒相关页面
│   ├── retention_list.html    # 滞留预警列表
│   ├── abnormal_*.html        # 异常件页面
│   ├── complaint_*.html       # 投诉页面
│   ├── responsibility_*.html  # 责任处理页面
│   ├── return_*.html          # 退回页面
│   └── partials/              # HTMX 局部模板
└── static/css/
    └── style.css              # 全局样式
```
