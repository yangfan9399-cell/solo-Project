import { PrismaClient, BookingStatus, ConflictType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.department.deleteMany();
  await prisma.meetingRoom.deleteMany();
  await prisma.booking.deleteMany();

  const departments = await Promise.all([
    prisma.department.create({ data: { name: '技术研发部' } }),
    prisma.department.create({ data: { name: '市场营销部' } }),
    prisma.department.create({ data: { name: '人力资源部' } }),
    prisma.department.create({ data: { name: '财务部' } }),
    prisma.department.create({ data: { name: '产品运营部' } }),
  ]);

  const room1 = await prisma.meetingRoom.create({
    data: {
      name: '创新厅',
      floor: 3,
      capacity: 20,
      hourlyRate: 200,
      equipments: {
        create: [
          { name: '投影仪' },
          { name: '白板' },
          { name: '视频会议系统' },
        ],
      },
    },
  });

  const room2 = await prisma.meetingRoom.create({
    data: {
      name: '协作室',
      floor: 5,
      capacity: 10,
      hourlyRate: 150,
      equipments: {
        create: [
          { name: '投影仪' },
          { name: '白板' },
        ],
      },
    },
  });

  const room3 = await prisma.meetingRoom.create({
    data: {
      name: '董事会议室',
      floor: 10,
      capacity: 30,
      hourlyRate: 500,
      equipments: {
        create: [
          { name: '投影仪' },
          { name: '视频会议系统' },
          { name: '音响系统' },
          { name: '电子白板' },
        ],
      },
    },
  });

  const room4 = await prisma.meetingRoom.create({
    data: {
      name: '头脑风暴室',
      floor: 5,
      capacity: 8,
      hourlyRate: 100,
      equipments: {
        create: [{ name: '白板' }],
      },
    },
  });

  console.log('种子数据创建完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
