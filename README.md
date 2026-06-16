# 🚂 火车餐车备餐节奏游戏

一个基于 Django 5 的全栈节奏游戏，扮演列车厨师，在站点间的短暂时间里为乘客们准备美味佳肴！

## 🎮 游戏特色

### 核心玩法
- **站点间隔机制**：火车在不同站点间行驶，每个站点有特定的停靠时间，必须在发车前处理完订单
- **备料加热系统**：不同食材需要不同的备料和加热时间，合理安排备料台使用
- **装盘配送流程**：完成烹饪后需要装盘并配送至对应车厢
- **车厢距离系统**：不同车厢距离厨房远近不同，配送时间也不同
- **订单优先级**：普通、紧急、VIP三种优先级，影响分数和小费
- **日终账单**：每局结束后由后端独立核算分数和收支

### 技术特色
- 🔐 **玩家账号系统**：注册/登录，本地玩家档案
- 📊 **游戏记录**：完整的局次记录和历史查询
- ⏪ **操作历史**：可恢复的操作历史记录
- 🏆 **后端重算**：所有分数由后端重新计算，确保公平
- 💾 **本地持久化**：SQLite 数据库，数据随项目保存

## 🚀 快速开始

### 方式一：一键启动（推荐）

```bash
./start.sh
```

### 方式二：手动启动

1. **创建虚拟环境并安装依赖**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **初始化数据库**
```bash
python manage.py makemigrations game
python manage.py migrate
```

3. **初始化游戏数据**
```bash
python manage.py init_game_data
```

4. **创建管理员账号**
```bash
python manage.py createsuperuser
```

5. **启动开发服务器**
```bash
python manage.py runserver 0.0.0.0:8000
```

## 🎯 访问地址

- 游戏主页: http://127.0.0.1:8000
- 管理后台: http://127.0.0.1:8000/admin

## 👤 测试账号

| 账号类型 | 用户名 | 密码 |
|---------|--------|------|
| 普通玩家 | demo | demo123456 |
| 管理员 | admin | admin123456 |

## 🎮 游戏玩法

### 基本流程
1. 登录游戏后选择线路（关卡）
2. 火车到达站点后会生成乘客订单
3. 点击「开始备料」处理待处理订单
4. 备料完成后订单进入「待配送」状态
5. 点击「开始配送」将订单送往对应车厢
6. 在时间限制内完成尽可能多的订单获取高分

### 订单优先级
- ⚪ **普通订单**：基础分数和小费
- 🟡 **紧急订单**：时间限制更短，分数×1.5，小费×1.8
- 🟣 **VIP订单**：高价值客户，分数×2.0，小费×2.5

### 车厢类型
- 🚃 **硬座车厢**：基础小费
- 🚃 **软座车厢**：小费×1.3
- 🛏️ **卧铺车厢**：小费×1.5
- 👑 **VIP包厢**：小费×2.0

### 评分标准
- ⭐ 1星：分数 < 目标分的80% 或 完成率 < 50%
- ⭐⭐ 2星：分数 ≥ 目标分的80% 且 完成率 ≥ 50%
- ⭐⭐⭐ 3星：分数 ≥ 目标分 且 完成率 ≥ 70%
- ⭐⭐⭐⭐ 4星：分数 ≥ 目标分的120% 且 完成率 ≥ 80%
- ⭐⭐⭐⭐⭐ 5星：分数 ≥ 目标分的150% 且 完成率 ≥ 90%

## 🏗️ 项目结构

```
q-321/
├── train_dining/          # Django 项目配置
│   ├── __init__.py
│   ├── settings.py       # 项目配置
│   ├── urls.py           # 主路由
│   └── wsgi.py           # WSGI 入口
├── game/                  # 游戏应用
│   ├── migrations/       # 数据库迁移
│   ├── management/       # 管理命令
│   │   └── commands/
│   │       └── init_game_data.py  # 初始化游戏数据
│   ├── static/           # 静态文件
│   │   ├── css/game.css
│   │   └── js/game.js
│   ├── templates/        # 模板文件
│   │   └── game/index.html
│   ├── __init__.py
│   ├── admin.py          # 后台管理
│   ├── apps.py           # 应用配置
│   ├── models.py         # 数据模型
│   ├── views.py          # API 视图
│   ├── urls.py           # API 路由
│   ├── game_logic.py     # 游戏核心逻辑
│   └── settlement.py     # 结算系统（后端重算）
├── static/               # 全局静态文件
├── templates/            # 全局模板
├── requirements.txt      # 项目依赖
├── manage.py            # Django 管理脚本
├── start.sh             # 一键启动脚本
└── README.md            # 本文件
```

## 🔧 核心模块说明

### [game_logic.py](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-321/game/game_logic.py)
游戏核心引擎，包含：
- `GameEngine` 类：游戏主循环
- 站点事件处理（到达/离开）
- 备料/烹饪任务管理
- 配送任务管理
- 订单超时检查
- 操作历史记录与重放

### [settlement.py](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-321/game/settlement.py)
结算系统，**后端独立重新计算分数**：
- `SettlementCalculator` 类：结算计算器
- 从操作历史重新核算所有数据
- 效率/速度/质量三维评分
- 星级评价系统
- 防作弊分数验证

### [models.py](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-321/game/models.py)
数据模型：
- `Player`：玩家档案
- `Level`：关卡配置
- `Station`：站点配置
- `Carriage`：车厢配置
- `Ingredient`：食材数据
- `Recipe`：菜品配方
- `GameSession`：游戏局次
- `Order`：实时订单
- `Preparation`：备料任务
- `Delivery`：配送任务
- `ActionHistory`：操作历史（可恢复）
- `Settlement`：结算记录

### [views.py](file:///Users/yangfan/Desktop/trae-solo-generated-projects/q-321/game/views.py)
API 接口：
- 玩家认证（注册/登录/登出）
- 关卡管理
- 游戏控制（开始/暂停/恢复/放弃）
- 备料/配送操作
- 操作历史与恢复
- 结算与分数验证

## 📊 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register/` | 玩家注册 |
| POST | `/api/auth/login/` | 玩家登录 |
| POST | `/api/auth/logout/` | 玩家登出 |
| GET | `/api/auth/current/` | 获取当前玩家 |
| GET | `/api/levels/` | 获取关卡列表 |
| POST | `/api/game/start/` | 开始新游戏 |
| GET | `/api/game/<id>/state/` | 获取游戏状态 |
| POST | `/api/game/<id>/tick/` | 游戏时间推进 |
| POST | `/api/game/<id>/prep/` | 开始备料 |
| POST | `/api/game/<id>/deliver/` | 开始配送 |
| POST | `/api/game/<id>/pause/` | 暂停游戏 |
| POST | `/api/game/<id>/resume/` | 恢复游戏 |
| POST | `/api/game/<id>/restore/` | 从历史恢复 |
| POST | `/api/game/<id>/abandon/` | 放弃游戏 |
| GET | `/api/game/<id>/settlement/` | 获取结算报告 |
| POST | `/api/game/<id>/verify/` | 分数验证（防作弊） |
| GET | `/api/player/history/` | 游戏历史 |
| GET | `/api/player/stats/` | 玩家统计 |

## 🎯 核心机制详解

### 1. 站点间隔机制
每个关卡包含多个站点，火车按时间顺序到达和离开站点。只有在站点停靠时才会生成新订单，必须在发车前处理完所有订单。

### 2. 备料加热机制
- 每个食材有独立的备料时间和加热时间
- 多个备料台并行工作，需要合理分配任务
- 烹饪时间由配方决定，完成后自动装盘待配送

### 3. 装盘配送机制
- 订单备料完成后进入「待配送」状态
- 服务员数量有限，需要合理安排配送顺序
- 车厢距离决定配送时间，距离越远耗时越长
- 配送完成后服务员需要返程才能接新单

### 4. 订单优先级机制
- 优先级影响分数倍率、小费倍率和超时惩罚
- VIP 订单即使超时也会有更高的保底收入
- 紧急订单时间限制更短，但奖励更丰厚

### 5. 后端分数重算机制
**所有分数在结算时由后端独立重新计算**，确保数据真实有效：
- 遍历所有操作历史重新统计收入和支出
- 重新计算食材成本和罚款
- 基于完成速度、效率、质量重新计算最终得分
- 防止前端篡改分数

## 🛠️ 技术栈

- **后端**：Django 5.0 + Python 3.10+
- **数据库**：SQLite 3（本地持久化）
- **前端**：原生 JavaScript + HTML5 + CSS3
- **认证**：Django 内置认证系统 + Session
- **CORS**：django-cors-headers

## 📝 开发说明

### 初始化数据
运行 `python manage.py init_game_data` 会创建：
- 20种食材（蔬菜、肉类、主食、汤品、饮品、甜点）
- 12种菜品配方
- 5个关卡（从简单到专家）
  - 第1关：京津城际快线（简单）
  - 第2关：京沪高铁（普通）
  - 第3关：京广高铁（普通）
  - 第4关：沪昆高铁（困难）
  - 第5关：京哈高铁（专家）
- 每个关卡包含多个站点、车厢和订单模板
- 测试玩家账号 demo/demo123456

### 管理后台
访问 `/admin` 可以：
- 管理玩家账号
- 编辑关卡配置
- 查看游戏记录
- 调整食材和配方
- 查看操作历史和结算记录

## 🎮 游戏截图

游戏包含以下界面：
1. **登录/注册界面**：玩家认证
2. **关卡选择界面**：选择线路，查看玩家统计
3. **游戏主界面**：
   - 左侧：站点信息、车厢分布、工作人员、备料台状态
   - 右侧：四列订单状态（待处理/备料中/待配送/配送中）
   - 顶部：当前站点、剩余时间、分数、目标等信息
4. **结算界面**：日终账单，包含收支明细、订单统计、评分详情
5. **历史记录界面**：查看历史游戏记录
6. **统计数据界面**：查看玩家综合统计

## ⚠️ 注意事项

1. 游戏数据存储在项目根目录的 `db.sqlite3` 文件中
2. 删除 `db.sqlite3` 会重置所有游戏进度
3. 建议使用 Python 3.10 或更高版本
4. 首次启动会自动创建虚拟环境和安装依赖

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

享受游戏吧！🚂🍳
