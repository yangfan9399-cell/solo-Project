# 跨校区教室借用审批与设备归还核验系统 - 技术架构文档

## 1. 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Remix)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Dashboard │ │  Apply   │ │  Approve  │ │  Stats   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ Loader/Action
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Remix Routes)                  │
│  POST /api/applications, GET /api/classrooms, etc.          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer (app/services)               │
│  ApplicationService, ClassroomService, EquipmentService      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer (app/db)                   │
│  PrismaClient, Model Helpers                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                         │
│  campuses, classrooms, applications, equipment, etc.        │
└─────────────────────────────────────────────────────────────┘
```

## 2. 技术栈详情

- **框架**：Remix v2 + React 18 + TypeScript 5
- **样式**：Tailwind CSS 3 + CSS Variables
- **数据库**：SQLite 3 + Prisma ORM 5
- **数据初始化**：Prisma Seed
- **包管理**：npm

## 3. 路由定义

| 路由 | 用途 | 权限 |
|------|------|------|
| `/` | 首页仪表盘，显示待处理事项统计 | 所有登录用户 |
| `/applications` | 借用申请列表和表单 | 申请人 |
| `/applications/:id` | 申请详情页，包含完整流程节点 | 相关角色 |
| `/admin` | 审批工作台 | 校区管理员 |
| `/admin/approve/:id` | 审批操作页面 | 校区管理员 |
| `/equipment` | 设备管理页面 | 设备管理员 |
| `/equipment/handover/:id` | 设备交接确认 | 设备管理员 |
| `/verify` | 归还核验列表 | 后勤复核员 |
| `/verify/:id` | 归还核验操作 | 后勤复核员 |
| `/stats` | 统计报表页面 | 校区管理员 |
| `/api/classrooms/available` | 查询可用教室API | 系统内部 |
| `/api/applications/:id/status` | 更新申请状态API | 相关角色 |

## 4. API 定义

### 4.1 主要 API 端点

```typescript
// 获取校区列表
GET /api/campuses
Response: Campus[]

// 获取教室列表（可选参数：campusId, type）
GET /api/classrooms?campusId=1&type=多媒体
Response: Classroom[]

// 查询可用教室（用于时间冲突检测）
GET /api/classrooms/available?campusId=1&startTime=2024-01-15T09:00&endTime=2024-01-15T12:00&excludeId=1
Response: Classroom[]

// 创建借用申请
POST /api/applications
Body: { classroomId, startTime, endTime, purpose, equipmentIds }
Response: Application

// 更新申请状态
PATCH /api/applications/:id/status
Body: { status, note }
Response: Application

// 设备交接
POST /api/equipment/handover
Body: { applicationId, equipmentChecks }
Response: Handover

// 归还核验
POST /api/verify
Body: { applicationId, cleaningStatus, cleaningPhoto, abnormalReason }
Response: Verification
```

### 4.2 核心类型定义

```typescript
// 申请状态枚举
type ApplicationStatus = 
  | 'PENDING'        // 待审批
  | 'APPROVED'       // 已审批
  | 'REJECTED'       // 已拒绝
  | 'EQUIPMENT_HANDED' // 设备已交接
  | 'IN_USE'         // 使用中
  | 'RETURN_PENDING' // 待归还
  | 'COMPLETED'      // 已完成
  | 'CANCELLED';     // 已取消

// 清洁状态
type CleaningStatus = 'PASSED' | 'FAILED' | 'PENDING';

// 异常类型
type AbnormalReason = 'EQUIPMENT_LOST' | 'CLEANING_FAILED' | 'DAMAGE' | 'OTHER';

// 教室类型
type ClassroomType = '普通' | '多媒体' | '实验室';
```

## 5. 数据库架构

### 5.1 ER 图

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Campus     │ 1   N │    Classroom     │ 1   N │  Equipment   │
├──────────────┤────── ├──────────────────┤────── ├──────────────┤
│ id           │       │ id               │       │ id           │
│ name         │       │ name             │       │ name         │
│ location     │       │ campusId (FK)    │       │ classroomId  │
└──────────────┘       │ type             │       │ status       │
                       │ capacity         │       │ quantity     │
                       └──────────────────┘       └──────────────┘
                              │ 1
                              │ N
                       ┌──────────────────┐
                       │ BorrowApplication │
                       ├──────────────────┤
                       │ id                │
                       │ classroomId (FK) │
                       │ applicantName     │
                       │ startTime         │
                       │ endTime           │
                       │ purpose           │
                       │ status            │
                       │ createdAt         │
                       └──────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐
     │EquipmentHandOver│ │ReturnVerification│ │ApplicationHistory│
     ├────────────────┤ ├────────────────┤ ├─────────────────┤
     │ id             │ │ id             │ │ id              │
     │ applicationId  │ │ applicationId  │ │ applicationId   │
     │ equipmentId    │ │ cleaningStatus │ │ action          │
     │ quantity       │ │ cleaningPhoto  │ │ actor           │
     │ handoverTime   │ │ abnormalReason│ │ timestamp       │
     │ handlerId      │ │ verifiedAt     │ │ note            │
     └────────────────┘ └────────────────┘ └─────────────────┘
```

### 5.2 Prisma Schema

```prisma
model Campus {
  id        Int         @id @default(autoincrement())
  name      String
  location  String
  classrooms Classroom[]
}

model Classroom {
  id        Int         @id @default(autoincrement())
  name      String
  campusId  Int
  campus    Campus      @relation(fields: [campusId], references: [id])
  type      String      // 普通 | 多媒体 | 实验室
  capacity  Int
  equipment Equipment[]
  applications BorrowApplication[]
}

model Equipment {
  id          Int     @id @default(autoincrement())
  name        String
  classroomId Int
  classroom   Classroom @relation(fields: [classroomId], references: [id])
  status      String  @default("AVAILABLE") // AVAILABLE | IN_USE | MAINTENANCE
  quantity    Int     @default(1)
}

model BorrowApplication {
  id            Int      @id @default(autoincrement())
  classroomId   Int
  classroom     Classroom @relation(fields: [classroomId], references: [id])
  applicantName String
  startTime     DateTime
  endTime       DateTime
  purpose       String
  status        String   @default("PENDING")
  createdAt     DateTime @default(now())
  handovers     EquipmentHandover[]
  verification  ReturnVerification?
  history       ApplicationHistory[]
}

model EquipmentHandover {
  id            Int      @id @default(autoincrement())
  applicationId Int
  application   BorrowApplication @relation(fields: [applicationId], references: [id])
  equipmentName String
  quantity      Int
  handoverTime  DateTime
  handlerName   String
}

model ReturnVerification {
  id              Int      @id @default(autoincrement())
  applicationId  Int      @unique
  application     BorrowApplication @relation(fields: [applicationId], references: [id])
  cleaningStatus  String   @default("PENDING")
  cleaningPhoto   String?
  abnormalReason  String?
  verifierName    String
  verifiedAt      DateTime
}

model ApplicationHistory {
  id            Int      @id @default(autoincrement())
  applicationId Int
  application   BorrowApplication @relation(fields: [applicationId], references: [id])
  action        String
  actor         String
  timestamp     DateTime @default(now())
  note          String?
}
```

## 6. 目录结构

```
app/
├── components/
│   ├── ui/                    # 通用UI组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   └── Timeline.tsx
│   ├── ApplicationForm.tsx
│   ├── ApplicationCard.tsx
│   ├── ClassroomSelector.tsx
│   ├── EquipmentChecklist.tsx
│   ├── CleaningCheck.tsx
│   └── ConflictAlert.tsx
├── routes/
│   ├── _index.tsx             # 首页仪表盘
│   ├── applications.tsx       # 申请列表和表单
│   ├── applications.$id.tsx   # 申请详情
│   ├── admin.tsx              # 审批工作台
│   ├── admin.approve.$id.tsx  # 审批操作
│   ├── equipment.tsx          # 设备管理
│   ├── equipment.handover.$id.tsx  # 设备交接
│   ├── verify.tsx             # 归还核验列表
│   ├── verify.$id.tsx        # 归还核验操作
│   └── stats.tsx              # 统计报表
├── services/
│   ├── application.server.ts
│   ├── classroom.server.ts
│   ├── equipment.server.ts
│   └── statistics.server.ts
├── db/
│   ├── db.server.ts           # Prisma 客户端
│   └── seed.ts               # 预置数据
├── styles/
│   └── tailwind.css
├── types/
│   └── index.ts              # 类型定义
├── utils/
│   └── helpers.ts
├── root.tsx
└── entry.server.tsx

prisma/
├── schema.prisma
└── migrations/
```

## 7. 预置样本数据

### 7.1 样本数据清单

| 样本ID | 场景 | 教室 | 申请人 | 时间 | 状态 | 异常 |
|--------|------|------|--------|------|------|------|
| APP001 | 正常归还 | 教学楼A101 | 张三 | 2024-01-15 09:00-12:00 | COMPLETED | 无 |
| APP002 | 设备遗失 | 教学楼B205 | 李四 | 2024-01-16 14:00-17:00 | COMPLETED | 设备遗失：投影仪1台 |
| APP003 | 时间冲突 | 实验楼301 | 王五 | 2024-01-17 09:00-11:00 | CANCELLED | 时间冲突，已取消 |
| APP004 | 清洁不合格 | 教学楼C102 | 赵六 | 2024-01-18 13:00-15:00 | COMPLETED | 清洁不合格 |
| APP005 | 多校区借用 | 教学楼A203 | 钱七 | 2024-01-19 10:00-12:00 | IN_USE | 无 |

### 7.2 教室预置数据

| 校区 | 教室 | 类型 | 容量 | 设备 |
|------|------|------|------|------|
| 东校区 | A101 | 多媒体 | 60 | 投影仪、音响、白板 |
| 东校区 | A203 | 普通 | 40 | 白板 |
| 东校区 | A301 | 实验室 | 30 | 实验设备、电脑10台 |
| 西校区 | B205 | 多媒体 | 50 | 投影仪、白板、电脑5台 |
| 西校区 | B301 | 普通 | 45 | 白板 |
| 南校区 | C102 | 多媒体 | 55 | 投影仪、音响 |
| 南校区 | 实验楼301 | 实验室 | 25 | 实验设备、电脑8台 |

## 8. 核心业务逻辑

### 8.1 时间冲突检测

```typescript
// 检查教室在某时间段是否可用
async function checkTimeConflict(
  classroomId: number,
  startTime: Date,
  endTime: Date,
  excludeApplicationId?: number
): Promise<boolean> {
  const conflict = await prisma.borrowApplication.findFirst({
    where: {
      classroomId,
      id: excludeApplicationId ? { not: excludeApplicationId } : undefined,
      status: { notIn: ['REJECTED', 'CANCELLED', 'COMPLETED'] },
      OR: [
        { startTime: { lt: endTime }, endTime: { gt: startTime } }
      ]
    }
  });
  return !!conflict;
}
```

### 8.2 可选替代教室查询

```typescript
// 查询可用替代教室
async function findAlternativeClassrooms(
  campusId: number,
  startTime: Date,
  endTime: Date,
  originalClassroomId: number,
  classroomType?: string
): Promise<Classroom[]> {
  // 获取同校区同类型教室
  const classrooms = await prisma.classroom.findMany({
    where: {
      campusId,
      id: { not: originalClassroomId },
      type: classroomType || undefined
    }
  });

  // 过滤出可用的教室
  const available = [];
  for (const room of classrooms) {
    const conflict = await checkTimeConflict(room.id, startTime, endTime);
    if (!conflict) {
      available.push(room);
    }
  }
  return available;
}
```

### 8.3 统计聚合查询

```typescript
// 按校区统计使用率
async function getUsageByCampus(startDate: Date, endDate: Date) {
  return prisma.borrowApplication.groupBy({
    by: ['classroomId'],
    _count: { id: true },
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate, lte: endDate }
    }
  });
}

// 按异常原因统计
async function getAbnormalStats() {
  return prisma.returnVerification.groupBy({
    by: ['abnormalReason'],
    _count: { id: true },
    where: {
      abnormalReason: { not: null }
    }
  });
}
```
