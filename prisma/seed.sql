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

-- Sample Application 1: Normal Return (Completed)
INSERT INTO BorrowApplication (id, classroomId, applicantName, startTime, endTime, purpose, status, createdAt)
VALUES ('APP001', 1, '张三', '2024-01-15 09:00:00', '2024-01-15 12:00:00', '期末考试监考培训会议', 'COMPLETED', '2024-01-10 10:00:00');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP001', 'APPLICATION_SUBMITTED', '张三', '2024-01-10 10:00:00', '提交借用申请');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP001', 'APPLICATION_APPROVED', '校区管理员-李主任', '2024-01-10 14:00:00', '审批通过');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP001', 'EQUIPMENT_HANDED_OVER', '设备管理员-王师傅', '2024-01-15 08:30:00', '设备交接完成');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP001', 'IN_USE', '系统', '2024-01-15 09:00:00', '使用中');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP001', 'RETURN_PENDING', '系统', '2024-01-15 12:00:00', '待归还');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP001', 'COMPLETED', '后勤-赵复核', '2024-01-15 12:30:00', '归还核验完成，清洁合格');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP001', '投影仪', 1, '2024-01-15 08:30:00', '王师傅');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP001', '音响系统', 1, '2024-01-15 08:30:00', '王师傅');

INSERT INTO ReturnVerification (applicationId, cleaningStatus, cleaningPhoto, abnormalReason, verifierName, verifiedAt)
VALUES ('APP001', 'PASSED', '/uploads/cleaning_a101_0115.jpg', NULL, '后勤-赵复核', '2024-01-15 12:30:00');

-- Sample Application 2: Equipment Lost (Completed with abnormal)
INSERT INTO BorrowApplication (id, classroomId, applicantName, startTime, endTime, purpose, status, createdAt)
VALUES ('APP002', 4, '李四', '2024-01-16 14:00:00', '2024-01-16 17:00:00', '学术报告会议', 'COMPLETED', '2024-01-14 11:00:00');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP002', 'APPLICATION_SUBMITTED', '李四', '2024-01-14 11:00:00', '提交借用申请');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP002', 'APPLICATION_APPROVED', '校区管理员-张主任', '2024-01-14 15:00:00', '审批通过');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP002', 'EQUIPMENT_HANDED_OVER', '设备管理员-王师傅', '2024-01-16 13:30:00', '设备交接完成');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP002', 'IN_USE', '系统', '2024-01-16 14:00:00', '使用中');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP002', 'RETURN_PENDING', '系统', '2024-01-16 17:00:00', '待归还');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP002', 'COMPLETED', '后勤-孙复核', '2024-01-16 17:45:00', '归还核验完成，发现设备遗失');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP002', '投影仪', 1, '2024-01-16 13:30:00', '王师傅');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP002', '电子白板', 1, '2024-01-16 13:30:00', '王师傅');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP002', '台式电脑', 5, '2024-01-16 13:30:00', '王师傅');

INSERT INTO ReturnVerification (applicationId, cleaningStatus, cleaningPhoto, abnormalReason, verifierName, verifiedAt)
VALUES ('APP002', 'PASSED', '/uploads/cleaning_b205_0116.jpg', 'EQUIPMENT_LOST', '后勤-孙复核', '2024-01-16 17:45:00');

-- Sample Application 3: Time Conflict (Cancelled)
INSERT INTO BorrowApplication (id, classroomId, applicantName, startTime, endTime, purpose, status, createdAt)
VALUES ('APP003', 7, '王五', '2024-01-17 09:00:00', '2024-01-17 11:00:00', '实验课程教学', 'CANCELLED', '2024-01-16 09:00:00');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP003', 'APPLICATION_SUBMITTED', '王五', '2024-01-16 09:00:00', '提交借用申请');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP003', 'APPLICATION_REJECTED', '系统', '2024-01-16 09:05:00', '时间冲突，实验楼301在此时段已被借用');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP003', 'CANCELLED', '系统', '2024-01-16 09:05:00', '申请已取消');

-- Sample Application 4: Cleaning Failed (Completed with abnormal)
INSERT INTO BorrowApplication (id, classroomId, applicantName, startTime, endTime, purpose, status, createdAt)
VALUES ('APP004', 6, '赵六', '2024-01-18 13:00:00', '2024-01-18 15:00:00', '学生会会议', 'COMPLETED', '2024-01-17 10:00:00');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP004', 'APPLICATION_SUBMITTED', '赵六', '2024-01-17 10:00:00', '提交借用申请');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP004', 'APPLICATION_APPROVED', '校区管理员-陈主任', '2024-01-17 11:30:00', '审批通过');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP004', 'EQUIPMENT_HANDED_OVER', '设备管理员-周师傅', '2024-01-18 12:30:00', '设备交接完成');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP004', 'IN_USE', '系统', '2024-01-18 13:00:00', '使用中');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP004', 'RETURN_PENDING', '系统', '2024-01-18 15:00:00', '待归还');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP004', 'COMPLETED', '后勤-吴复核', '2024-01-18 15:40:00', '归还核验完成，清洁不合格');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP004', '投影仪', 1, '2024-01-18 12:30:00', '周师傅');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP004', '音响系统', 1, '2024-01-18 12:30:00', '周师傅');

INSERT INTO ReturnVerification (applicationId, cleaningStatus, cleaningPhoto, abnormalReason, verifierName, verifiedAt)
VALUES ('APP004', 'FAILED', '/uploads/cleaning_c102_0118.jpg', 'CLEANING_FAILED', '后勤-吴复核', '2024-01-18 15:40:00');

-- Sample Application 5: In Use (Multi-campus)
INSERT INTO BorrowApplication (id, classroomId, applicantName, startTime, endTime, purpose, status, createdAt)
VALUES ('APP005', 2, '钱七', '2024-01-19 10:00:00', '2024-01-19 12:00:00', '跨校区教研交流活动', 'IN_USE', '2024-01-18 14:00:00');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP005', 'APPLICATION_SUBMITTED', '钱七', '2024-01-18 14:00:00', '提交借用申请');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP005', 'APPLICATION_APPROVED', '校区管理员-李主任', '2024-01-18 16:00:00', '审批通过');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP005', 'EQUIPMENT_HANDED_OVER', '设备管理员-王师傅', '2024-01-19 09:30:00', '设备交接完成');

INSERT INTO ApplicationHistory (applicationId, action, actor, timestamp, note)
VALUES ('APP005', 'IN_USE', '系统', '2024-01-19 10:00:00', '使用中');

INSERT INTO EquipmentHandover (applicationId, equipmentName, quantity, handoverTime, handlerName)
VALUES ('APP005', '电子白板', 1, '2024-01-19 09:30:00', '王师傅');
