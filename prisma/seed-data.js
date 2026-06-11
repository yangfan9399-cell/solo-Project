process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = "binary";
process.env.PRISMA_QUERY_ENGINE_TYPE = "binary";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { addDays, setHours, setMinutes, startOfDay, formatISO } = require("date-fns");

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./prisma/dev.db");

function formatDate(date) {
  return formatISO(date).replace("T", " ").replace(/\.\d+Z$/, "");
}

const now = new Date();
const baseDate = startOfDay(addDays(now, -7));

db.serialize(() => {
  db.run("BEGIN TRANSACTION");

  const normalStart = setMinutes(setHours(baseDate, 9), 0);
  const normalEnd = setMinutes(setHours(baseDate, 10), 30);

  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-normal",
      "course-001",
      "user-teacher1",
      "classroom-001",
      "campus-001",
      formatDate(normalStart),
      formatDate(normalEnd),
      "SETTLED",
      "NONE",
      null,
      1.5,
    ]
  );

  const historyNodes = [
    ["schedule-normal", "DRAFT", "user-admin", "教务创建排课"],
    ["schedule-normal", "SUBMITTED", "user-admin", "教务提交审核"],
    ["schedule-normal", "APPROVED", "user-director1", "校区主管审核通过，资源确认"],
    ["schedule-normal", "TEACHER_CONFIRMED", "user-teacher1", "教师确认授课"],
    ["schedule-normal", "COMPLETED", "user-teacher1", "课程正常完成"],
    ["schedule-normal", "SETTLED", "user-finance", "财务结算完成"],
  ];

  historyNodes.forEach(([scheduleId, status, operatorId, note], idx) => {
    const nodeDate = addDays(baseDate, idx * 0.5);
    db.run(
      `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`history-normal-${idx}`, scheduleId, status, operatorId, note, formatDate(nodeDate)]
    );
  });

  for (let i = 0; i < 10; i++) {
    const studentId = `student-${String(i + 1).padStart(3, "0")}`;
    const checkIn = setMinutes(setHours(baseDate, 8), 55);
    const checkOut = setMinutes(setHours(baseDate, 10), 35);
    db.run(
      `INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        `attendance-normal-${i}`,
        "schedule-normal",
        studentId,
        "PRESENT",
        formatDate(checkIn),
        formatDate(checkOut),
      ]
    );
  }

  const reviewedAt = addDays(baseDate, 2);
  const paidAt = addDays(baseDate, 3);
  db.run(
    `INSERT OR REPLACE INTO Settlement (id, scheduleId, teacherId, totalHours, hourlyRate, totalAmount, deductions, netAmount, status, reviewerId, reviewedAt, paidAt, note, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "settlement-normal",
      "schedule-normal",
      "user-teacher1",
      1.5,
      200,
      300,
      0,
      300,
      "PAID",
      "user-finance",
      formatDate(reviewedAt),
      formatDate(paidAt),
      "正常结算",
    ]
  );

  const teacherConflictDate = addDays(baseDate, 1);
  const teacherConflictStart = setMinutes(setHours(teacherConflictDate, 9), 0);
  const teacherConflictEnd = setMinutes(setHours(teacherConflictDate, 11), 0);

  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-teacher-conflict",
      "course-002",
      "user-teacher1",
      "classroom-002",
      "campus-001",
      formatDate(teacherConflictStart),
      formatDate(teacherConflictEnd),
      "DRAFT",
      "TEACHER_CONFLICT",
      "教师张老师在此时段已有课程安排（小学数学思维训练）",
      null,
    ]
  );

  db.run(
    `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    ["history-tc-1", "schedule-teacher-conflict", "DRAFT", "user-admin", "教务创建排课"]
  );

  const conflictingTeacherStart = setMinutes(setHours(teacherConflictDate, 8), 30);
  const conflictingTeacherEnd = setMinutes(setHours(teacherConflictDate, 10), 0);
  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-conflicting-teacher",
      "course-001",
      "user-teacher1",
      "classroom-001",
      "campus-001",
      formatDate(conflictingTeacherStart),
      formatDate(conflictingTeacherEnd),
      "TEACHER_CONFIRMED",
      "NONE",
      null,
      null,
    ]
  );

  const classroomConflictDate = addDays(baseDate, 2);
  const classroomConflictStart = setMinutes(setHours(classroomConflictDate, 14), 0);
  const classroomConflictEnd = setMinutes(setHours(classroomConflictDate, 16), 30);

  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-classroom-conflict",
      "course-003",
      "user-teacher3",
      "classroom-001",
      "campus-001",
      formatDate(classroomConflictStart),
      formatDate(classroomConflictEnd),
      "DRAFT",
      "CLASSROOM_CONFLICT",
      "A101教室在此时段已被占用（初中英语强化班）",
      null,
    ]
  );

  db.run(
    `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    ["history-cc-1", "schedule-classroom-conflict", "DRAFT", "user-admin", "教务创建排课"]
  );

  const conflictingClassroomStart = setMinutes(setHours(classroomConflictDate, 13), 30);
  const conflictingClassroomEnd = setMinutes(setHours(classroomConflictDate, 15), 30);
  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-conflicting-classroom",
      "course-002",
      "user-teacher2",
      "classroom-001",
      "campus-001",
      formatDate(conflictingClassroomStart),
      formatDate(conflictingClassroomEnd),
      "APPROVED",
      "NONE",
      null,
      null,
    ]
  );

  const leaveDate = addDays(baseDate, 3);
  const leaveStart = setMinutes(setHours(leaveDate, 9), 0);
  const leaveEnd = setMinutes(setHours(leaveDate, 11), 0);

  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-student-leave",
      "course-002",
      "user-teacher2",
      "classroom-002",
      "campus-001",
      formatDate(leaveStart),
      formatDate(leaveEnd),
      "COMPLETED",
      "NONE",
      null,
      2.0,
    ]
  );

  const leaveHistory = [
    ["schedule-student-leave", "DRAFT", "user-admin", "教务创建排课"],
    ["schedule-student-leave", "SUBMITTED", "user-admin", "教务提交审核"],
    ["schedule-student-leave", "APPROVED", "user-director1", "校区主管审核通过"],
    ["schedule-student-leave", "TEACHER_CONFIRMED", "user-teacher2", "教师确认授课"],
    ["schedule-student-leave", "COMPLETED", "user-teacher2", "课程完成，含学生请假"],
  ];

  leaveHistory.forEach(([scheduleId, status, operatorId, note], idx) => {
    const nodeDate = addDays(leaveDate, idx * 0.3);
    db.run(
      `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`history-leave-${idx}`, scheduleId, status, operatorId, note, formatDate(nodeDate)]
    );
  });

  for (let i = 5; i < 15; i++) {
    const studentId = `student-${String(i + 1).padStart(3, "0")}`;
    const isLeave = i === 7 || i === 10;
    const checkIn = isLeave ? null : formatDate(setMinutes(setHours(leaveDate, 8), 50));
    const checkOut = isLeave ? null : formatDate(setMinutes(setHours(leaveDate, 11), 5));
    const leaveReason = isLeave ? "身体不适，请假一天" : null;
    db.run(
      `INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        `attendance-leave-${i}`,
        "schedule-student-leave",
        studentId,
        isLeave ? "LEAVE" : "PRESENT",
        checkIn,
        checkOut,
        leaveReason,
      ]
    );
  }

  const pendingDate = addDays(baseDate, 5);
  const pendingStart = setMinutes(setHours(pendingDate, 14), 0);
  const pendingEnd = setMinutes(setHours(pendingDate, 16), 30);

  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-pending-approval",
      "course-003",
      "user-teacher3",
      "classroom-003",
      "campus-002",
      formatDate(pendingStart),
      formatDate(pendingEnd),
      "SUBMITTED",
      "NONE",
      null,
      null,
    ]
  );

  const pendingHistory = [
    ["schedule-pending-approval", "DRAFT", "user-admin", "教务创建排课"],
    ["schedule-pending-approval", "SUBMITTED", "user-admin", "教务提交审核，等待校区主管审批"],
  ];

  pendingHistory.forEach(([scheduleId, status, operatorId, note], idx) => {
    const nodeDate = addDays(pendingDate, idx - 0.5);
    db.run(
      `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`history-pending-${idx}`, scheduleId, status, operatorId, note, formatDate(nodeDate)]
    );
  });

  const inProgressDate = addDays(baseDate, 1);
  const inProgressStart = setMinutes(setHours(inProgressDate, 10), 0);
  const inProgressEnd = setMinutes(setHours(inProgressDate, 12), 30);

  db.run(
    `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      "schedule-in-progress",
      "course-003",
      "user-teacher3",
      "classroom-003",
      "campus-002",
      formatDate(inProgressStart),
      formatDate(inProgressEnd),
      "IN_PROGRESS",
      "NONE",
      null,
      null,
    ]
  );

  db.run("COMMIT", (err) => {
    if (err) {
      console.error("Error:", err);
      db.run("ROLLBACK");
    } else {
      console.log("样本数据导入成功！");
    }
    db.close();
  });
});
