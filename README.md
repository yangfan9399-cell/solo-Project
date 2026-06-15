# 🧫 微生物培养皿领地游戏

一款基于 Rails 8 的全栈小游戏，玩家调控培养皿里的营养、温度、水分和抑菌圈，让目标菌落扩张到指定区域。

## ✨ 核心特性

- 🎮 **实时菌落模拟**：基于温度/水分/pH/抑菌因子的动态生长算法
- 🦠 **污染菌竞争**：随机触发的污染事件会争夺营养并侵占领地
- 🔥 **过热停止生长**：温度超过阈值后生长系数归零
- 📊 **实验记录系统**：四表结构（主记录/明细记录/历史记录/结果记录）
- 🔄 **回滚与重算**：支持回滚到指定回合并重新模拟
- 📈 **菌落图谱**：覆盖率与因子系数的 SVG 折线图
- 📊 **批次对比**：6 维雷达图 + 差异归因分析
- 🧬 **菌株图鉴**：4 种目标菌株 + 3 种污染菌

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Rails 8.1.3 |
| 数据库 | SQLite 3（文件存储在 `storage/`） |
| 前端 | Tailwind CSS CDN + 原生 SVG |
| Web 服务器 | Puma 8 |
| 依赖管理 | Bundler（项目本地 `vendor/bundle`） |

> 无需全局安装 Rails，所有依赖通过项目内 Bundler 管理。

## 🚀 快速开始

### 前置要求

- Ruby 4.0+（通过 Homebrew 或 rbenv 安装）
- SQLite 3

### 一键初始化

```bash
cd /path/to/project
./bin/setup --seed
```

这会自动完成：
1. 📦 安装所有 Ruby 依赖到 `vendor/bundle/`
2. 🗄️  创建并迁移 SQLite 数据库
3. 🌱 加载 3 个验收场景的种子数据
4. 🧹 清理旧日志和临时文件

### 启动开发服务器

```bash
./bin/dev
# 或指定端口
./bin/dev -p 3000
```

然后浏览器访问：**http://localhost:3000**

### 重置数据库

```bash
./bin/rails db:reset
```

## 📁 项目数据结构

### 四张核心表

| 表名 | 类型 | 说明 |
|------|------|------|
| `game_sessions` | **主记录** | 保存玩家调控的营养、温度、pH 等参数 |
| `operation_details` | **明细记录** | 保存每次操作的类型、前后值（水分/抑菌圈等） |
| `growth_histories` | **历史记录** | 保存每回合的覆盖率、因子系数、过热标记 |
| `contamination_results` | **结果记录** | 保存污染事件的前后状态、严重程度、营养掠夺 |

### 关联关系

```
GameSession (1)
    ├── OperationDetail (N)  # 操作明细
    ├── GrowthHistory (N)    # 生长历史
    └── ContaminationResult (N)  # 污染结果
```

## 🧪 三个验收种子样本

### 1. 过热停止生长正常完成（SEED-OVERHEAT）
- **场景**：R4 误操作升温 +5°C → R5-7 过热停滞 → R7 紧急降温 -8°C 恢复
- **结果**：成功完成，得分约 86.83
- **验证点**：过热前后生长曲线的明显差异

### 2. 增长模拟触发异常（SEED-ABNORMAL）
- **场景**：连续 3 次污染事件（medium / high / critical）
- **结果**：失败，得分约 39.31
- **验证点**：污染前后培养皿状态对比 + 污染差异页

### 3. 实验记录回滚重算（SEED-ROLLBACK）
- **场景**：R9-10 错误过热 → 回滚至 R8 → 重算 R11-14 → 最终成功
- **结果**：成功，得分约 89.4
- **验证点**：回滚操作记录 + 重算后的分数变化

## 📋 常用命令

所有命令都通过项目内的 `bin/` 脚本执行，不依赖全局安装：

```bash
# 服务器
./bin/dev              # 启动开发服务器
./bin/dev -p 3001      # 指定端口

# 数据库
./bin/rails db:prepare   # 创建/迁移数据库
./bin/rails db:seed      # 加载种子数据
./bin/rails db:reset     # 重置数据库（删除+重建+播种）
./bin/rails db:migrate   # 运行迁移

# 控制台
./bin/rails console      # Rails 控制台
./bin/rails c            # 同上，简写

# 其他
./bin/rails routes       # 查看所有路由
./bin/rails runner script.rb  # 运行 Ruby 脚本
```

## 🎯 游戏玩法

1. **选择菌株**：大肠杆菌 / 酿酒酵母 / 枯草芽孢杆菌 / 铜绿假单胞菌
2. **调控参数**：
   - 🌡️ 温度：影响生长速率，过热会停止生长
   - 💧 水分：影响扩散速度
   - 🧪 营养：决定生长基础
   - 💊 抑菌圈：放置抑制污染菌
3. **模拟生长**：点击「下一回合」让菌落扩散
4. **应对污染**：随机出现的污染菌需要用抑菌圈控制
5. **达成目标**：让目标菌落覆盖指定区域百分比

## 📊 分析视图

| 页面 | 路径 | 说明 |
|------|------|------|
| 菌落图谱 | `/game_sessions/:id/colony_map` | 覆盖率曲线 + 因子系数 + 每轮快照 |
| 污染差异 | `/game_sessions/:id/contamination_diff` | 污染前后培养皿对照 + 指标对比 |
| 批次对比 | `/game_sessions/batch_comparison_list` | 按批次分组的实验对比 |
| 批次对比详情 | `/game_sessions/:id/batch_comparison` | 6 维雷达图 + 差异归因分析 |
| 实验时间线 | `/experiments` | 三大验收样本分类 + 垂直时间轴 |
| 菌株图鉴 | `/strains` | 目标菌株 & 污染菌株详细资料 |

## 🏗️ 核心算法

### 温度系数计算

```ruby
def calculate_temperature_factor
  optimal = strain[:optimal_temp]
  range = strain[:temp_range]
  temp = @session.temperature

  # 超出范围直接归零
  return 0.0 if temp < range[0] || temp > range[1]

  # 最适温度附近为 1.0，向两侧递减
  distance = (temp - optimal).abs
  half_range = (range[1] - range[0]) / 2.0
  [1.0 - distance / half_range, 0.0].max
end
```

### 后端重算分数

结算时由后端按局次明细重新计算，4 个维度加权：

| 维度 | 权重 | 说明 |
|------|------|------|
| 覆盖率 | 40% | 最终全皿覆盖率 |
| 目标区 | 30% | 目标区域内覆盖率 |
| 效率 | 20% | 回合数利用率 |
| 清洁度 | 10% | 污染控制情况 |

## 📂 目录结构

```
.
├── app/
│   ├── models/          # 数据模型（4个核心表）
│   ├── controllers/     # 控制器
│   ├── services/        # 游戏引擎服务
│   ├── views/           # ERB 视图
│   └── helpers/         # 视图辅助方法
├── bin/                 # 项目内可执行脚本
├── config/              # 配置文件
├── db/
│   ├── migrate/         # 数据库迁移
│   └── seeds.rb         # 种子数据
├── storage/             # SQLite 数据库文件
├── vendor/bundle/       # 项目本地 gems（自动生成）
└── .bundle/config       # Bundler 本地配置
```

## 🔒 安全说明

- 所有依赖安装在 `vendor/bundle/`，不污染系统环境
- SQLite 文件存储在 `storage/`，完全本地
- 无需 npm/node/构建工具，Tailwind 通过 CDN 加载

## 📝 License

MIT
