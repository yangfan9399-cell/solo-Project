# 医院耗材领用核销平台

基于 Nuxt 3 + TypeScript + Prisma + MySQL 的医院耗材领用与科室核销平台。

## 功能特性

- **护士站经办人**: 提交领用申请、填写使用说明
- **库房管理员**: 确认出库、补货管理、批次过期校验
- **科室复核人**: 完成核销或退回操作
- **详情展示**: 耗材批次、库存、申请科室、出库依据、核销意见、历史节点
- **库存一致性**: 列表、详情、复盘的库存数量保持一致

## 预置场景样本

1. **正常核销 (REQ-2024-0001)**: 一次性注射器，已完成全流程
2. **库存不足 (REQ-2024-0002)**: 医用手套，申请10副，库存仅5副
3. **科室权限不符 (REQ-2024-0003)**: 导尿管，外科护士申请内科领用
4. **批次过期 (REQ-2024-0004)**: 无菌纱布，所选批次已过期

## 技术栈

- **框架**: Nuxt 3
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: MySQL
- **样式**: Tailwind CSS

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

修改 `.env` 文件中的数据库连接信息：

```env
DATABASE_URL="mysql://root:password@localhost:3306/hospital_supplies"
```

### 3. 初始化数据库

```bash
# 推送数据库 schema
npx prisma db push

# 生成 Prisma Client
npx prisma generate

# 填充种子数据
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
├── pages/
│   ├── index.vue              # 领用记录列表
│   └── requisition/
│       └── [id].vue           # 领用详情页
├── components/
│   ├── CreateRequisitionModal.vue   # 新建申请模态框
│   ├── OutboundModal.vue            # 出库模态框
│   ├── RestockModal.vue             # 补货模态框
│   ├── VerifyModal.vue              # 核销模态框
│   └── ReturnModal.vue              # 退回模态框
├── server/
│   ├── api/
│   │   ├── requisitions.get.ts      # 获取领用列表
│   │   ├── requisitions.post.ts     # 创建领用申请
│   │   ├── requisitions/
│   │   │   ├── [id].get.ts          # 获取领用详情
│   │   │   ├── [id]/outbound.put.ts # 出库操作
│   │   │   ├── [id]/restock.put.ts  # 补货操作
│   │   │   ├── [id]/verify.put.ts   # 核销操作
│   │   │   └── [id]/return.put.ts   # 退回操作
│   │   ├── supplies.get.ts          # 获取耗材列表
│   │   ├── departments.get.ts       # 获取科室列表
│   │   ├── users.get.ts             # 获取用户列表
│   │   └── inventory/
│   │       └── verify.get.ts        # 库存一致性校验
│   └── utils/
│       └── prisma.ts                # Prisma 客户端
├── prisma/
│   ├── schema.prisma         # 数据模型
│   └── seed.ts               # 种子数据
├── types/
│   └── index.ts              # 类型定义
└── app.vue                   # 应用入口
```

## 数据模型

- **Department**: 科室
- **User**: 用户（护士、库房管理员、科室复核人）
- **Supply**: 耗材
- **SupplyBatch**: 耗材批次（含库存、有效期）
- **Requisition**: 领用记录
- **RequisitionHistory**: 领用历史节点

## 角色权限

### 护士站经办人 (NURSE)
- 创建领用申请
- 查看领用记录

### 库房管理员 (WAREHOUSE_ADMIN)
- 确认出库（校验批次有效期和库存）
- 补货操作
- 查看领用记录

### 科室复核人 (DEPARTMENT_REVIEWER)
- 核销领用（仅限本科室）
- 退回领用（仅限本科室，自动恢复库存）
- 查看领用记录

## 业务规则

1. **批次过期校验**: 过期批次不能出库，提示更换批次或撤回申请
2. **库存校验**: 出库数量不能超过当前库存
3. **科室权限校验**: 申请人/复核人必须与申请科室一致
4. **库存一致性**: 所有操作实时更新库存，确保数据一致
5. **历史追溯**: 所有状态变更记录历史节点
