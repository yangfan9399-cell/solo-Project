# 版权音乐商用授权申请与播放场景核验平台

## 项目简介

这是一个基于 Rails 8 + Hotwire + PostgreSQL 的全流程音乐版权管理系统。平台服务于音乐版权方和使用方，通过标准化流程确保授权合规性，降低版权风险。

## 功能特性

- 授权申请管理
- 场景核验（场景超范围自动阻断）
- 多角色审核流程（商务→版权→法务→财务）
- 结算管理
- 复盘分析

## 技术栈

- **后端**: Ruby on Rails 8.0
- **前端**: Hotwire (Turbo + Stimulus)
- **样式**: Tailwind CSS
- **数据库**: PostgreSQL

## 快速启动

### 使用 Docker（推荐）

```bash
docker-compose up --build
```

### 本地开发

1. 安装依赖
```bash
bundle install
npm install
```

2. 配置数据库
```bash
# 编辑 config/database.yml 配置 PostgreSQL 连接
rails db:create db:migrate db:seed
```

3. 启动服务器
```bash
rails server
```

## 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 商务经办人 | biz@example.com | biz123 |
| 版权管理员 | copyright@example.com | copyright123 |
| 法务专员 | legal@example.com | legal123 |
| 财务专员 | finance@example.com | finance123 |
| 系统管理员 | admin@example.com | admin123 |

## 预置样本数据

平台预置了 4 种典型场景的样本数据：

1. **正常授权** - 某知名广告公司的电视广告授权
2. **场景超范围** - 电商平台直播带货（live_stream 超出曲库授权范围）
3. **授权期限冲突** - 影视制作公司的期限重叠申请
4. **结算比例争议** - 品牌营销公司的分成比例分歧

## 核心流程

1. 商务经办人提交授权申请
2. 版权管理员核验曲库权利
3. 法务专员复核合同条款
4. 财务专员确认结算
5. 场景超范围时自动阻断授权确认

## 许可证

MIT License