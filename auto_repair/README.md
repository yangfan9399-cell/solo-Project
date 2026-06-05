# 汽修门店维修报价与质保回访平台

基于 Rails 8 + Hotwire + PostgreSQL 的汽车维修管理系统，围绕车辆维修记录构建完整业务流程。

## 功能特性

### 业务流程
1. **服务顾问**：录入故障、生成报价、设置预算
2. **技师**：登记维修过程、记录操作步骤
3. **店长**：复核费用、审批超预算报价、退回修改
4. **客服**：完成质保回访、记录客户反馈

### 核心功能
- ✅ **报价超预算阻断**：报价超出预算时自动阻断，显示调整或升级审批路径
- ✅ **配件缺货管理**：配件缺货时阻止开始维修，提示等待到货
- ✅ **质保返修流程**：归档后可创建质保返修单，生成新的质保节点
- ✅ **归档只读**：维修单归档后变为只读状态，防止修改
- ✅ **历史节点追踪**：完整记录维修单的所有操作历史

### 预置样本数据
1. **正常维修（已归档）**：完整的维修流程示例
2. **报价超预算**：演示超预算审批流程
3. **配件缺货**：演示配件缺货状态处理
4. **质保返修**：演示质保返修单创建

## 系统要求

- Ruby 3.2.0+
- Rails 8.0.0
- PostgreSQL
- Node.js (用于 JavaScript 打包)

## 快速开始

### 1. 安装 Ruby (如果未安装)

```bash
# 使用 rbenv
rbenv install 3.2.0
rbenv local 3.2.0
```

### 2. 安装依赖

```bash
cd auto_repair
bundle install
```

### 3. 创建并配置数据库

确保 PostgreSQL 已启动，然后修改 `config/database.yml` 中的数据库连接配置。

```bash
# 创建数据库
rails db:create

# 运行迁移
rails db:migrate

# 加载种子数据
rails db:seed
```

### 4. 启动服务器

```bash
bin/dev
# 或者
rails server
```

访问 http://localhost:3000 查看应用。

## 项目结构

### 数据模型

- **User** - 用户（4种角色：服务顾问、技师、店长、客服）
- **Vehicle** - 车辆信息
- **RepairOrder** - 维修单（核心）
- **Fault** - 故障记录
- **QuoteItem** - 报价明细（工时、配件、材料）
- **Part** - 配件状态管理
- **RepairLog** - 维修过程记录
- **FollowUp** - 质保回访记录
- **OrderHistory** - 操作历史节点

### 维修单状态流转

```
草稿 → 已记录故障 → 报价已提交
                          ↓
                    报价超预算 → 调整报价 / 店长审批
                          ↓
                    报价已批准 → 配件待确认
                                              ↓
                                        配件已就绪 → 维修中
                                                          ↓
                                                      维修完成 → 复核中
                                                                          ↓
                                                                  复核通过 → 待回访
                                                                          ↓
                                                                  回访完成 → 已归档 ← 质保返修
```

## 使用说明

### 创建维修单流程
1. 服务顾问录入车辆信息和客户描述
2. 记录故障详情（标题、描述、严重程度、类别）
3. 添加报价项目（工时、配件、材料）
4. 提交报价：
   - 预算内：自动确认
   - 超预算：等待店长审批，可调整报价或申请升级审批
5. 配件就绪后，技师开始维修
6. 技师完成维修，记录维修过程
7. 店长复核费用，可通过或退回
8. 客服完成质保回访
9. 归档维修单（变为只读）

### 质保返修
- 已归档的维修单可以创建质保返修单
- 返修单会关联原维修单，自动复制故障信息
- 返修单有独立的维修流程

## 技术栈

- **Rails 8** - 后端框架
- **Hotwire (Turbo + Stimulus)** - 无刷新交互
- **PostgreSQL** - 数据库
- **Tailwind CSS** - 样式框架
- **Importmaps** - JavaScript 管理

## 代码参考

核心模型：
- [repair_order.rb](app/models/repair_order.rb) - 维修单模型，包含状态流转和业务逻辑
- [repair_order.rb#L54-L65](app/models/repair_order.rb#L54-L65) - 超预算判断逻辑
- [repair_order.rb#L71-L73](app/models/repair_order.rb#L71-L73) - 归档只读逻辑
- [repair_order.rb#L86-L112](app/models/repair_order.rb#L86-L112) - 质保返修单创建

控制器：
- [repair_orders_controller.rb](app/controllers/repair_orders_controller.rb) - 维修单控制器，包含工作流动作

视图：
- [show.html.erb](app/views/repair_orders/show.html.erb) - 维修单详情页，展示所有信息
