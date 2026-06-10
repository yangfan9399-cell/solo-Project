import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db",
    },
  },
});

async function main() {
  console.log("Starting database seed...");

  // Create a temporary seed script with raw SQL
  const seedSQL = `
-- Clear existing data
DELETE FROM ApplicationHistory;
DELETE FROM ReturnVerification;
DELETE FROM EquipmentHandover;
DELETE FROM BorrowApplication;
DELETE FROM Equipment;
DELETE FROM Classroom;
DELETE FROM Campus;

-- Create Campuses
INSERT INTO Campus (name, location) VALUES ('东校区', '东门内200米');
INSERT INTO Campus (name, location) VALUES ('西校区', '西门主楼');
INSERT INTO Campus (name, location) VALUES ('南校区', '南门图书馆旁');

-- Create Classrooms
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('教学楼A101', 1, '多媒体', 60);
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('教学楼A203', 1, '普通', 40);
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('实验室A301', 1, '实验室', 30);
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('教学楼B205', 2, '多媒体', 50);
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('教学楼B301', 2, '普通', 45);
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('教学楼C102', 3, '多媒体', 55);
INSERT INTO Classroom (name, campusId, type, capacity) VALUES ('实验楼301', 3, '实验室', 25);

-- Create Equipment
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('投影仪', 1, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('音响系统', 1, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('电子白板', 1, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('电子白板', 2, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('实验设备', 3, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('台式电脑', 3, 'AVAILABLE', 10);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('投影仪', 4, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('电子白板', 4, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('台式电脑', 4, 'AVAILABLE', 5);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('电子白板', 5, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('投影仪', 6, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('音响系统', 6, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('实验设备', 7, 'AVAILABLE', 1);
INSERT INTO Equipment (name, classroomId, status, quantity) VALUES ('台式电脑', 7, 'AVAILABLE', 8);

SELECT 'Seed completed successfully!' as result;
`;

  try {
    await execAsync(`echo "${seedSQL.replace(/"/g, '\\"').replace(/\n/g, '"\necho "')}" | sqlite3 prisma/dev.db`);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
