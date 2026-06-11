BEGIN TRANSACTION;
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-normal', 'course-001', 'user-teacher1', 'classroom-001', 'campus-001', '2026-06-04 09:00:00+08:00', '2026-06-04 10:30:00+08:00', 'SETTLED', 'NONE', NULL, 1.5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-normal-0', 'schedule-normal', 'DRAFT', 'user-admin', '教务创建排课', '2026-06-04 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-normal-1', 'schedule-normal', 'SUBMITTED', 'user-admin', '教务提交审核', '2026-06-04 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-normal-2', 'schedule-normal', 'APPROVED', 'user-director1', '校区主管审核通过，资源确认', '2026-06-05 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-normal-3', 'schedule-normal', 'TEACHER_CONFIRMED', 'user-teacher1', '教师确认授课', '2026-06-05 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-normal-4', 'schedule-normal', 'COMPLETED', 'user-teacher1', '课程正常完成', '2026-06-06 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-normal-5', 'schedule-normal', 'SETTLED', 'user-finance', '财务结算完成', '2026-06-06 00:00:00+08:00');
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-0', 'schedule-normal', 'student-001', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-1', 'schedule-normal', 'student-002', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-2', 'schedule-normal', 'student-003', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-3', 'schedule-normal', 'student-004', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-4', 'schedule-normal', 'student-005', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-5', 'schedule-normal', 'student-006', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-6', 'schedule-normal', 'student-007', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-7', 'schedule-normal', 'student-008', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-8', 'schedule-normal', 'student-009', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, createdAt, updatedAt) 
VALUES ('attendance-normal-9', 'schedule-normal', 'student-010', 'PRESENT', '2026-06-04 08:55:00+08:00', '2026-06-04 10:35:00+08:00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Settlement (id, scheduleId, teacherId, totalHours, hourlyRate, totalAmount, deductions, netAmount, status, reviewerId, reviewedAt, paidAt, note, createdAt, updatedAt) 
VALUES ('settlement-normal', 'schedule-normal', 'user-teacher1', 1.5, 200, 300, 0, 300, 'PAID', 'user-finance', '2026-06-06 00:00:00+08:00', '2026-06-07 00:00:00+08:00', '正常结算', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-teacher-conflict', 'course-002', 'user-teacher1', 'classroom-002', 'campus-001', '2026-06-05 09:00:00+08:00', '2026-06-05 11:00:00+08:00', 'DRAFT', 'TEACHER_CONFLICT', '教师张老师在此时段已有课程安排（小学数学思维训练）', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-tc-1', 'schedule-teacher-conflict', 'DRAFT', 'user-admin', '教务创建排课', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-conflicting-teacher', 'course-001', 'user-teacher1', 'classroom-001', 'campus-001', '2026-06-05 08:30:00+08:00', '2026-06-05 10:00:00+08:00', 'TEACHER_CONFIRMED', 'NONE', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-classroom-conflict', 'course-003', 'user-teacher3', 'classroom-001', 'campus-001', '2026-06-06 14:00:00+08:00', '2026-06-06 16:30:00+08:00', 'DRAFT', 'CLASSROOM_CONFLICT', 'A101教室在此时段已被占用（初中英语强化班）', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-cc-1', 'schedule-classroom-conflict', 'DRAFT', 'user-admin', '教务创建排课', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-conflicting-classroom', 'course-002', 'user-teacher2', 'classroom-001', 'campus-001', '2026-06-06 13:30:00+08:00', '2026-06-06 15:30:00+08:00', 'APPROVED', 'NONE', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-student-leave', 'course-002', 'user-teacher2', 'classroom-002', 'campus-001', '2026-06-07 09:00:00+08:00', '2026-06-07 11:00:00+08:00', 'COMPLETED', 'NONE', NULL, 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-leave-0', 'schedule-student-leave', 'DRAFT', 'user-admin', '教务创建排课', '2026-06-07 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-leave-1', 'schedule-student-leave', 'SUBMITTED', 'user-admin', '教务提交审核', '2026-06-07 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-leave-2', 'schedule-student-leave', 'APPROVED', 'user-director1', '校区主管审核通过', '2026-06-07 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-leave-3', 'schedule-student-leave', 'TEACHER_CONFIRMED', 'user-teacher2', '教师确认授课', '2026-06-07 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-leave-4', 'schedule-student-leave', 'COMPLETED', 'user-teacher2', '课程完成，含学生请假', '2026-06-08 00:00:00+08:00');
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-5', 'schedule-student-leave', 'student-006', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-6', 'schedule-student-leave', 'student-007', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-7', 'schedule-student-leave', 'student-008', 'LEAVE', NULL, NULL, '身体不适，请假一天', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-8', 'schedule-student-leave', 'student-009', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-9', 'schedule-student-leave', 'student-010', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-10', 'schedule-student-leave', 'student-011', 'LEAVE', NULL, NULL, '身体不适，请假一天', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-11', 'schedule-student-leave', 'student-012', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-12', 'schedule-student-leave', 'student-013', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-13', 'schedule-student-leave', 'student-014', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Attendance (id, scheduleId, studentId, status, checkInTime, checkOutTime, leaveReason, createdAt, updatedAt) 
VALUES ('attendance-leave-14', 'schedule-student-leave', 'student-015', 'PRESENT', '2026-06-07 08:50:00+08:00', '2026-06-07 11:05:00+08:00', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-pending-approval', 'course-003', 'user-teacher3', 'classroom-003', 'campus-002', '2026-06-09 14:00:00+08:00', '2026-06-09 16:30:00+08:00', 'SUBMITTED', 'NONE', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-pending-0', 'schedule-pending-approval', 'DRAFT', 'user-admin', '教务创建排课', '2026-06-08 00:00:00+08:00');
INSERT INTO HistoryNode (id, scheduleId, status, operatorId, note, createdAt) 
VALUES ('history-pending-1', 'schedule-pending-approval', 'SUBMITTED', 'user-admin', '教务提交审核，等待校区主管审批', '2026-06-09 00:00:00+08:00');
INSERT OR REPLACE INTO Schedule (id, courseId, teacherId, classroomId, campusId, startTime, endTime, status, conflictType, conflictNote, actualHours, createdAt, updatedAt) 
VALUES ('schedule-in-progress', 'course-003', 'user-teacher3', 'classroom-003', 'campus-002', '2026-06-05 10:00:00+08:00', '2026-06-05 12:30:00+08:00', 'IN_PROGRESS', 'NONE', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
COMMIT;
