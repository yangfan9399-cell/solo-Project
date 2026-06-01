# 农机合作社作业预约与油补核算系统

面向农户、农机手和合作社财务的一站式农机作业管理系统。

## 功能特性

### 核心业务流程
1. **农户作业预约** - 农户提交作业预约申请
2. **地块面积确认** - 确认作业地块信息
3. **农机排班** - 管理员分配农机和农机手
4. **作业签到** - 农机手到达现场签到
5. **作业量验收** - 作业完成后质量验收
6. **油补核算** - 自动计算燃油补贴
7. **费用结算** - 最终费用结算支付

### 系统模块
- 📋 **作业预约** - 预约申请、状态管理
- 🌾 **地块管理** - 农户地块信息维护
- 🚜 **农机管理** - 农机设备档案
- 📅 **排班日历** - 可视化排班视图
- 🛠️ **作业任务** - 农机手签到签退
- ✅ **作业验收** - 作业质量审核
- 💰 **油补核算** - 补贴自动计算
- 💳 **费用结算** - 费用支付管理
- ⚠️ **异常反馈** - 问题上报与处理

## 技术架构

- **后端**: 原生 PHP 7.4+ (轻量 MVC 架构)
- **数据库**: SQLite 3
- **前端**: 原生 PHP 模板 + Alpine.js
- **样式**: 自定义 CSS (无依赖)

## 快速开始

### 环境要求
- PHP 7.4 或更高版本
- SQLite 3 扩展
- PDO 扩展

### 安装步骤

1. **初始化数据库**
```bash
php database/init.php
```

2. **启动内置服务器**
```bash
cd public
php -S localhost:8000
```

3. **访问系统**
打开浏览器访问: http://localhost:8000

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@example.com | admin123 |
| 农户 | farmer1@example.com | farmer123 |
| 农机手 | operator1@example.com | operator123 |
| 财务 | finance@example.com | finance123 |

## 目录结构

```
.
├── app/
│   ├── Models/              # 数据模型
│   └── Http/Controllers/    # 控制器
├── core/                    # 核心框架
│   ├── Database.php         # 数据库封装
│   ├── Model.php            # 基础模型
│   ├── Controller.php       # 基础控制器
│   ├── View.php             # 视图渲染
│   ├── Auth.php             # 认证管理
│   └── helpers.php          # 辅助函数
├── database/
│   ├── init.php             # 数据库初始化
│   ├── seeders/             # 示例数据
│   └── database.sqlite      # SQLite 数据库文件
├── public/                  # Web 入口
│   ├── index.php
│   ├── css/
│   └── js/
├── resources/
│   └── views/               # 视图模板
│       ├── layouts/
│       ├── bookings/
│       ├── fields/
│       └── ...
└── routes/
    └── web.php              # 路由配置
```

## 业务流程说明

### 完整作业流程

```
农户预约 → 确认预约 → 农机排班 → 签到开始作业
    ↓
结算支付 ← 费用核算 ← 油补计算 ← 作业验收 ← 签退完成
```

### 状态流转

**预约状态**:
- `pending` 待确认 → `confirmed` 已确认 → `scheduled` 已排班 → `completed` 已完成
- 可随时转为 `cancelled` 已取消

**作业状态**:
- `scheduled` 已排班 → `in_progress` 作业中 → `pending` 待验收 → `approved` 已通过 / `rejected` 已驳回

**补贴状态**:
- `pending` 待审核 → `approved` 已通过 / `rejected` 已驳回

## 开发说明

### 新增路由
在 `routes/web.php` 中添加:
```php
get('/path', 'ControllerName@method');
post('/path', 'ControllerName@method');
```

### 新增控制器
在 `app/Http/Controllers/` 下创建:
```php
class ExampleController extends Controller {
    public function index() {
        $this->view('example/index', $data);
    }
}
```

### 新增模型
在 `app/Models/` 下创建:
```php
class Example extends Model {
    protected $table = 'examples';
    protected $fillable = ['field1', 'field2'];
}
```

## License

MIT
