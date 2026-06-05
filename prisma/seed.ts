import { PrismaClient, UserRole, HazardStatus, HazardLevel, PhotoType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

  const inspector = await prisma.user.upsert({
    where: { username: 'inspector' },
    update: {},
    create: {
      username: 'inspector',
      password: hashPassword('123456'),
      name: '张巡检',
      role: UserRole.INSPECTOR,
      department: '安全巡检组',
    },
  });

  const propertyManager = await prisma.user.upsert({
    where: { username: 'property' },
    update: {},
    create: {
      username: 'property',
      password: hashPassword('123456'),
      name: '李物业',
      role: UserRole.PROPERTY_MANAGER,
      department: '物业管理处',
    },
  });

  const fireVerifier = await prisma.user.upsert({
    where: { username: 'fire' },
    update: {},
    create: {
      username: 'fire',
      password: hashPassword('123456'),
      name: '王消防',
      role: UserRole.FIRE_VERIFIER,
      department: '消防验收科',
    },
  });

  console.log('Users created:', { inspector, propertyManager, fireVerifier });

  const hazard1 = await prisma.hazard.create({
    data: {
      title: '消防通道堵塞',
      description: 'A栋西侧消防通道被电动车和杂物堵塞，影响应急疏散',
      location: 'A栋西侧消防通道',
      level: HazardLevel.HIGH,
      source: '日常巡检',
      reporterId: inspector.id,
      photos: {
        create: {
          type: PhotoType.BEFORE,
          url: 'https://picsum.photos/seed/fire1/800/600',
          uploadedById: inspector.id,
          description: '堵塞的消防通道现场照片',
        },
      },
      statusTransitions: {
        create: {
          fromStatus: null,
          toStatus: HazardStatus.REPORTED,
          remark: '巡检发现隐患并登记',
          createdById: inspector.id,
        },
      },
    },
  });

  await prisma.hazard.update({
    where: { id: hazard1.id },
    data: {
      status: HazardStatus.ASSIGNED,
      assigneeId: propertyManager.id,
      rectification: {
        create: {
          measure: '清理通道杂物，划定禁止停放区域',
          materials: '警示胶带、指示牌',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.REPORTED,
          toStatus: HazardStatus.ASSIGNED,
          remark: '派发至物业整改',
          createdById: fireVerifier.id,
        },
      },
    },
  });

  await prisma.hazard.update({
    where: { id: hazard1.id },
    data: {
      status: HazardStatus.IN_PROGRESS,
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.ASSIGNED,
          toStatus: HazardStatus.IN_PROGRESS,
          remark: '开始整改',
          createdById: propertyManager.id,
        },
      },
    },
  });

  const hazard1Updated = await prisma.hazard.update({
    where: { id: hazard1.id },
    data: {
      status: HazardStatus.SUBMITTED,
      photos: {
        create: [
          {
            type: PhotoType.AFTER,
            url: 'https://picsum.photos/seed/fire1-after/800/600',
            uploadedById: propertyManager.id,
            description: '整改后畅通的消防通道',
          },
        ],
      },
      rectification: {
        update: {
          submittedAt: new Date(),
        },
      },
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.IN_PROGRESS,
          toStatus: HazardStatus.SUBMITTED,
          remark: '整改完成，申请验收',
          createdById: propertyManager.id,
        },
      },
    },
    include: { photos: true, rectification: true },
  });

  await prisma.hazard.update({
    where: { id: hazard1.id },
    data: {
      status: HazardStatus.PASSED,
      rectification: {
        update: {
          verifiedAt: new Date(),
        },
      },
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.SUBMITTED,
          toStatus: HazardStatus.PASSED,
          remark: '整改合格，通过验收',
          createdById: fireVerifier.id,
        },
      },
    },
  });

  console.log('Sample 1 - Normal rectification:', hazard1Updated.title);

  const hazard2 = await prisma.hazard.create({
    data: {
      title: '灭火器过期',
      description: 'B栋3楼走廊3具干粉灭火器已过期2个月',
      location: 'B栋3楼走廊',
      level: HazardLevel.MEDIUM,
      source: '月度检查',
      reporterId: inspector.id,
      photos: {
        create: {
          type: PhotoType.BEFORE,
          url: 'https://picsum.photos/seed/fire2/800/600',
          uploadedById: inspector.id,
          description: '过期灭火器照片',
        },
      },
      statusTransitions: {
        create: {
          fromStatus: null,
          toStatus: HazardStatus.REPORTED,
          remark: '巡检登记',
          createdById: inspector.id,
        },
      },
    },
  });

  await prisma.hazard.update({
    where: { id: hazard2.id },
    data: {
      status: HazardStatus.ASSIGNED,
      assigneeId: propertyManager.id,
      rectification: {
        create: {
          measure: '更换过期灭火器',
          materials: '全新干粉灭火器 x 3',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      },
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.REPORTED,
          toStatus: HazardStatus.ASSIGNED,
          remark: '派发整改',
          createdById: fireVerifier.id,
        },
      },
    },
  });

  await prisma.hazard.update({
    where: { id: hazard2.id },
    data: {
      status: HazardStatus.IN_PROGRESS,
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.ASSIGNED,
          toStatus: HazardStatus.IN_PROGRESS,
          remark: '整改中',
          createdById: propertyManager.id,
        },
      },
    },
  });

  await prisma.hazard.update({
    where: { id: hazard2.id },
    data: {
      status: HazardStatus.SUBMITTED,
      rectification: {
        update: {
          submittedAt: new Date(),
        },
      },
      statusTransitions: {
        create: {
          fromStatus: HazardStatus.IN_PROGRESS,
          toStatus: HazardStatus.SUBMITTED,
          remark: '申请验收',
          createdById: propertyManager.id,
        },
      },
    },
  });

  console.log('Sample 2 - Missing photos:', hazard2.title);

  const hazard3 = await prisma.hazard.create({
    data: {
      title: '消防喷淋系统故障',
      description: 'C栋地下车库消防喷淋系统管道漏水',
      location: 'C栋地下车库B1层',
      level: HazardLevel.CRITICAL,
      source: '消防专项检查',
      reporterId: inspector.id,
      assigneeId: propertyManager.id,
      photos: {
        create: {
          type: PhotoType.BEFORE,
          url: 'https://picsum.photos/seed/fire3/800/600',
          uploadedById: inspector.id,
          description: '漏水的喷淋管道',
        },
      },
      status: HazardStatus.ASSIGNED,
      rectification: {
        create: {
          measure: '维修更换喷淋管道',
          materials: '镀锌钢管、密封件',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      statusTransitions: {
        create: [
          {
            fromStatus: null,
            toStatus: HazardStatus.REPORTED,
            remark: '登记隐患',
            createdById: inspector.id,
          },
          {
            fromStatus: HazardStatus.REPORTED,
            toStatus: HazardStatus.ASSIGNED,
            remark: '派发至物业',
            createdById: fireVerifier.id,
          },
        ],
      },
    },
  });

  console.log('Sample 3 - Assigned, responsibility mismatch case:', hazard3.title);

  const hazard4 = await prisma.hazard.create({
    data: {
      title: '应急照明不亮',
      description: 'D栋疏散通道应急照明灯不亮共5处',
      location: 'D栋疏散通道',
      level: HazardLevel.MEDIUM,
      source: '日常巡检',
      reporterId: inspector.id,
      assigneeId: propertyManager.id,
      photos: {
        create: {
          type: PhotoType.BEFORE,
          url: 'https://picsum.photos/seed/fire4/800/600',
          uploadedById: inspector.id,
          description: '不亮的应急照明灯',
        },
      },
      status: HazardStatus.REJECTED,
      rectification: {
        create: {
          measure: '更换应急照明灯',
          materials: 'LED应急灯',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
      statusTransitions: {
        create: [
          {
            fromStatus: null,
            toStatus: HazardStatus.REPORTED,
            remark: '登记',
            createdById: inspector.id,
          },
          {
            fromStatus: HazardStatus.REPORTED,
            toStatus: HazardStatus.ASSIGNED,
            remark: '派发',
            createdById: fireVerifier.id,
          },
          {
            fromStatus: HazardStatus.ASSIGNED,
            toStatus: HazardStatus.IN_PROGRESS,
            remark: '整改中',
            createdById: propertyManager.id,
          },
          {
            fromStatus: HazardStatus.IN_PROGRESS,
            toStatus: HazardStatus.SUBMITTED,
            remark: '申请验收',
            createdById: propertyManager.id,
          },
          {
            fromStatus: HazardStatus.SUBMITTED,
            toStatus: HazardStatus.REJECTED,
            remark: '整改不彻底，仍有2处不亮，需重新整改',
            createdById: fireVerifier.id,
          },
        ],
      },
    },
  });

  console.log('Sample 4 - Rejected review:', hazard4.title);

  const hazard5 = await prisma.hazard.create({
    data: {
      title: '安全出口指示牌损坏',
      description: 'E栋1楼安全出口指示牌外壳破损',
      location: 'E栋1楼大厅',
      level: HazardLevel.LOW,
      source: '日常巡检',
      reporterId: inspector.id,
      assigneeId: propertyManager.id,
      status: HazardStatus.ARCHIVED,
      photos: {
        create: [
          {
            type: PhotoType.BEFORE,
            url: 'https://picsum.photos/seed/archive1-before/800/600',
            uploadedById: inspector.id,
            description: '整改前',
          },
          {
            type: PhotoType.AFTER,
            url: 'https://picsum.photos/seed/archive1-after/800/600',
            uploadedById: propertyManager.id,
            description: '整改后',
          },
        ],
      },
      rectification: {
        create: {
          measure: '更换新指示牌',
          materials: '安全出口指示牌',
          deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          verifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      statusTransitions: {
        create: [
          {
            fromStatus: null,
            toStatus: HazardStatus.REPORTED,
            remark: '登记',
            createdById: inspector.id,
          },
          {
            fromStatus: HazardStatus.REPORTED,
            toStatus: HazardStatus.ASSIGNED,
            remark: '派发',
            createdById: fireVerifier.id,
          },
          {
            fromStatus: HazardStatus.ASSIGNED,
            toStatus: HazardStatus.IN_PROGRESS,
            remark: '整改',
            createdById: propertyManager.id,
          },
          {
            fromStatus: HazardStatus.IN_PROGRESS,
            toStatus: HazardStatus.SUBMITTED,
            remark: '申请验收',
            createdById: propertyManager.id,
          },
          {
            fromStatus: HazardStatus.SUBMITTED,
            toStatus: HazardStatus.PASSED,
            remark: '通过',
            createdById: fireVerifier.id,
          },
          {
            fromStatus: HazardStatus.PASSED,
            toStatus: HazardStatus.ARCHIVED,
            remark: '已归档',
            createdById: fireVerifier.id,
          },
        ],
      },
    },
  });

  console.log('Sample 5 - Archived:', hazard5.title);

  console.log('Seeding completed!');
  console.log('\nLogin accounts:');
  console.log('Inspector: inspector / 123456');
  console.log('Property Manager: property / 123456');
  console.log('Fire Verifier: fire / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
