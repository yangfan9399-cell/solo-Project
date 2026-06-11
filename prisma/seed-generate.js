process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = "binary";
process.env.PRISMA_QUERY_ENGINE_TYPE = "binary";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { addDays, setHours, setMinutes, startOfDay, formatISO } = require("date-fns");
const { execFileSync } = require("child_process");
const fs = require("fs");

function formatDate(date) {
  return formatISO(date).replace("T", " ").replace(/\.\d+Z$/, "");
}

function escapeSql(str) {
  if (str === null || str === undefined) return "NULL";
  if (typeof str === "number") return str.toString();
  return `'${str.replace(/'/g, "''")}'`;
}

const now = new Date();
const baseDate = startOfDay(addDays(now, -7));

let sql = "BEGIN TRANSACTION;\n";

const normalStart = setMinutes(setHours(baseDate, 9), 0);
const normalEnd = setMinutes(setHours(baseDate, 10), 30);

sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-normal")}, ${escapeSql("course-001")}, ${escapeSql("user-teacher1")}, ${escapeSql("classroom-001")}, ${escapeSql("campus-001")}, ${escapeSql(formatDate(normalStart))}, ${escapeSql(formatDate(normalEnd))}, ${escapeSql("SETTLED")}, ${escapeSql("NONE")}, NULL, 1.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

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
  sql += `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES (${escapeSql(`history-normal-${idx}`)}, ${escapeSql(scheduleId)}, ${escapeSql(status)}, ${escapeSql(operatorId)}, ${escapeSql(note)}, ${escapeSql(formatDate(nodeDate))});\n`;
});

for (let i = 0; i < 10; i++) {
  const studentId = `student-${String(i + 1).padStart(3, "0")}`;
  const checkIn = setMinutes(setHours(baseDate, 8), 55);
  const checkOut = setMinutes(setHours(baseDate, 10), 35);
  sql += `INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES (${escapeSql(`attendance-normal-${i}`)}, ${escapeSql("schedule-normal")}, ${escapeSql(studentId)}, ${escapeSql("PRESENT")}, ${escapeSql(formatDate(checkIn))}, ${escapeSql(formatDate(checkOut))}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;
}

const reviewedAt = addDays(baseDate, 2);
const paidAt = addDays(baseDate, 3);
sql += `INSERT OR REPLACE INTO Settlement (id, scheduleId, teacherId, totalHours, hourlyRate, totalAmount, deductions, netAmount, status, reviewerId, reviewedAt, paidAt, note, createdAt, updatedAt) 
VALUES (${escapeSql("settlement-normal")}, ${escapeSql("schedule-normal")}, ${escapeSql("user-teacher1")}, 1.5, 200, 300, 0, 300, ${escapeSql("PAID")}, ${escapeSql("user-finance")}, ${escapeSql(formatDate(reviewedAt))}, ${escapeSql(formatDate(paidAt))}, ${escapeSql("正常结算")}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

const teacherConflictDate = addDays(baseDate, 1);
const teacherConflictStart = setMinutes(setHours(teacherConflictDate, 9), 0);
const teacherConflictEnd = setMinutes(setHours(teacherConflictDate, 11), 0);

sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-teacher-conflict")}, ${escapeSql("course-002")}, ${escapeSql("user-teacher1")}, ${escapeSql("classroom-002")}, ${escapeSql("campus-001")}, ${escapeSql(formatDate(teacherConflictStart))}, ${escapeSql(formatDate(teacherConflictEnd))}, ${escapeSql("DRAFT")}, ${escapeSql("TEACHER_CONFLICT")}, ${escapeSql("教师张老师在此时段已有课程安排（小学数学思维训练）")}, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

sql += `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES (${escapeSql("history-tc-1")}, ${escapeSql("schedule-teacher-conflict")}, ${escapeSql("DRAFT")}, ${escapeSql("user-admin")}, ${escapeSql("教务创建排课")}, CURRENT_TIMESTAMP);\n`;

const conflictingTeacherStart = setMinutes(setHours(teacherConflictDate, 8), 30);
const conflictingTeacherEnd = setMinutes(setHours(teacherConflictDate, 10), 0);
sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-conflicting-teacher")}, ${escapeSql("course-001")}, ${escapeSql("user-teacher1")}, ${escapeSql("classroom-001")}, ${escapeSql("campus-001")}, ${escapeSql(formatDate(conflictingTeacherStart))}, ${escapeSql(formatDate(conflictingTeacherEnd))}, ${escapeSql("TEACHER_CONFIRMED")}, ${escapeSql("NONE")}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

const classroomConflictDate = addDays(baseDate, 2);
const classroomConflictStart = setMinutes(setHours(classroomConflictDate, 14), 0);
const classroomConflictEnd = setMinutes(setHours(classroomConflictDate, 16), 30);

sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-classroom-conflict")}, ${escapeSql("course-003")}, ${escapeSql("user-teacher3")}, ${escapeSql("classroom-001")}, ${escapeSql("campus-001")}, ${escapeSql(formatDate(classroomConflictStart))}, ${escapeSql(formatDate(classroomConflictEnd))}, ${escapeSql("DRAFT")}, ${escapeSql("CLASSROOM_CONFLICT")}, ${escapeSql("A101教室在此时段已被占用（初中英语强化班）")}, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

sql += `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES (${escapeSql("history-cc-1")}, ${escapeSql("schedule-classroom-conflict")}, ${escapeSql("DRAFT")}, ${escapeSql("user-admin")}, ${escapeSql("教务创建排课")}, CURRENT_TIMESTAMP);\n`;

const conflictingClassroomStart = setMinutes(setHours(classroomConflictDate, 13), 30);
const conflictingClassroomEnd = setMinutes(setHours(classroomConflictDate, 15), 30);
sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-conflicting-classroom")}, ${escapeSql("course-002")}, ${escapeSql("user-teacher2")}, ${escapeSql("classroom-001")}, ${escapeSql("campus-001")}, ${escapeSql(formatDate(conflictingClassroomStart))}, ${escapeSql(formatDate(conflictingClassroomEnd))}, ${escapeSql("APPROVED")}, ${escapeSql("NONE")}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

const leaveDate = addDays(baseDate, 3);
const leaveStart = setMinutes(setHours(leaveDate, 9), 0);
const leaveEnd = setMinutes(setHours(leaveDate, 11), 0);

sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-student-leave")}, ${escapeSql("course-002")}, ${escapeSql("user-teacher2")}, ${escapeSql("classroom-002")}, ${escapeSql("campus-001")}, ${escapeSql(formatDate(leaveStart))}, ${escapeSql(formatDate(leaveEnd))}, ${escapeSql("COMPLETED")}, ${escapeSql("NONE")}, NULL, 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

const leaveHistory = [
  ["schedule-student-leave", "DRAFT", "user-admin", "教务创建排课"],
  ["schedule-student-leave", "SUBMITTED", "user-admin", "教务提交审核"],
  ["schedule-student-leave", "APPROVED", "user-director1", "校区主管审核通过"],
  ["schedule-student-leave", "TEACHER_CONFIRMED", "user-teacher2", "教师确认授课"],
  ["schedule-student-leave", "COMPLETED", "user-teacher2", "课程完成，含学生请假"],
];

leaveHistory.forEach(([scheduleId, status, operatorId, note], idx) => {
  const nodeDate = addDays(leaveDate, idx * 0.3);
  sql += `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES (${escapeSql(`history-leave-${idx}`)}, ${escapeSql(scheduleId)}, ${escapeSql(status)}, ${escapeSql(operatorId)}, ${escapeSql(note)}, ${escapeSql(formatDate(nodeDate))});\n`;
});

for (let i = 5; i < 15; i++) {
  const studentId = `student-${String(i + 1).padStart(3, "0")}`;
  const isLeave = i === 7 || i === 10;
  const checkIn = isLeave ? null : formatDate(setMinutes(setHours(leaveDate, 8), 50));
  const checkOut = isLeave ? null : formatDate(setMinutes(setHours(leaveDate, 11), 5));
  const leaveReason = isLeave ? "身体不适，请假一天" : null;
  sql += `INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES (${escapeSql(`attendance-leave-${i}`)}, ${escapeSql("schedule-student-leave")}, ${escapeSql(studentId)}, ${escapeSql(isLeave ? "LEAVE" : "PRESENT")}, ${escapeSql(checkIn)}, ${escapeSql(checkOut)}, ${escapeSql(leaveReason)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;
}

const pendingDate = addDays(baseDate, 5);
const pendingStart = setMinutes(setHours(pendingDate, 14), 0);
const pendingEnd = setMinutes(setHours(pendingDate, 16), 30);

sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-pending-approval")}, ${escapeSql("course-003")}, ${escapeSql("user-teacher3")}, ${escapeSql("classroom-003")}, ${escapeSql("campus-002")}, ${escapeSql(formatDate(pendingStart))}, ${escapeSql(formatDate(pendingEnd))}, ${escapeSql("SUBMITTED")}, ${escapeSql("NONE")}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

const pendingHistory = [
  ["schedule-pending-approval", "DRAFT", "user-admin", "教务创建排课"],
  ["schedule-pending-approval", "SUBMITTED", "user-admin", "教务提交审核，等待校区主管审批"],
];

pendingHistory.forEach(([scheduleId, status, operatorId, note], idx) => {
  const nodeDate = addDays(pendingDate, idx - 0.5);
  sql += `INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES (${escapeSql(`history-pending-${idx}`)}, ${escapeSql(scheduleId)}, ${escapeSql(status)}, ${escapeSql(operatorId)}, ${escapeSql(note)}, ${escapeSql(formatDate(nodeDate))});\n`;
});

const inProgressDate = addDays(baseDate, 1);
const inProgressStart = setMinutes(setHours(inProgressDate, 10), 0);
const inProgressEnd = setMinutes(setHours(inProgressDate, 12), 30);

sql += `INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES (${escapeSql("schedule-in-progress")}, ${escapeSql("course-003")}, ${escapeSql("user-teacher3")}, ${escapeSql("classroom-003")}, ${escapeSql("campus-002")}, ${escapeSql(formatDate(inProgressStart))}, ${escapeSql(formatDate(inProgressEnd))}, ${escapeSql("IN_PROGRESS")}, ${escapeSql("NONE")}, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);\n`;

sql += "COMMIT;\n";

fs.writeFileSync("prisma/seed-complete.sql", sql);

try {
  execFileSync("sqlite3", ["prisma/dev.db", ".read prisma/seed-complete.sql"], {
    stdio: "inherit",
  });
  console.log("样本数据导入成功！");
} catch (error) {
  console.error("导入失败:", error.message);
  process.exit(1);
}
