-- 校区数据
INSERT OR REPLACE INTO Campus (id, name, address, createdAt, updatedAt) VALUES
('campus-001', '朝阳校区', '北京市朝阳区建国路88号', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('campus-002', '海淀校区', '北京市海淀区中关村大街1号', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 用户数据
INSERT OR REPLACE INTO User (id, name, email, role, campusId, createdAt, updatedAt) VALUES
('user-admin', '系统管理员', 'admin@school.com', 'ADMIN', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-teacher1', '张老师', 'teacher1@school.com', 'TEACHER', 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-teacher2', '李老师', 'teacher2@school.com', 'TEACHER', 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-teacher3', '王老师', 'teacher3@school.com', 'TEACHER', 'campus-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-director1', '刘主管', 'director1@school.com', 'CAMPUS_DIRECTOR', 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user-finance', '陈财务', 'finance@school.com', 'FINANCE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 课程数据
INSERT OR REPLACE INTO Course (id, name, description, duration, price, maxStudents, campusId, createdAt, updatedAt) VALUES
('course-001', '小学数学思维训练', '针对3-6年级学生的数学思维提升课程', 90, 180, 15, 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('course-002', '初中英语强化班', '初中英语语法、阅读、写作综合提升', 120, 240, 20, 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('course-003', '高中物理竞赛班', '高中物理奥赛辅导课程', 150, 360, 12, 'campus-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 教室数据
INSERT OR REPLACE INTO Classroom (id, name, capacity, campusId, createdAt, updatedAt) VALUES
('classroom-001', 'A101教室', 20, 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('classroom-002', 'A102教室', 25, 'campus-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('classroom-003', 'B201教室', 15, 'campus-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 学生数据
INSERT OR REPLACE INTO Student (id, name, phone, email, createdAt, updatedAt) VALUES
('student-001', '学生1', '13800000001', 'student1@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-002', '学生2', '13800000002', 'student2@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-003', '学生3', '13800000003', 'student3@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-004', '学生4', '13800000004', 'student4@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-005', '学生5', '13800000005', 'student5@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-006', '学生6', '13800000006', 'student6@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-007', '学生7', '13800000007', 'student7@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-008', '学生8', '13800000008', 'student8@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-009', '学生9', '13800000009', 'student9@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-010', '学生10', '13800000010', 'student10@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-011', '学生11', '13800000011', 'student11@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-012', '学生12', '13800000012', 'student12@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-013', '学生13', '13800000013', 'student13@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-014', '学生14', '13800000014', 'student14@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-015', '学生15', '13800000015', 'student15@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-016', '学生16', '13800000016', 'student16@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-017', '学生17', '13800000017', 'student17@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-018', '学生18', '13800000018', 'student18@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-019', '学生19', '13800000019', 'student19@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('student-020', '学生20', '13800000020', 'student20@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 课程报名数据
INSERT OR REPLACE INTO CourseEnrollment (id, courseId, studentId, createdAt, updatedAt) VALUES
('enroll-001', 'course-001', 'student-001', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-002', 'course-001', 'student-002', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-003', 'course-001', 'student-003', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-004', 'course-001', 'student-004', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-005', 'course-001', 'student-005', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-006', 'course-001', 'student-006', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-007', 'course-001', 'student-007', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-008', 'course-001', 'student-008', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-009', 'course-001', 'student-009', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-010', 'course-001', 'student-010', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-011', 'course-002', 'student-006', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-012', 'course-002', 'student-007', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-013', 'course-002', 'student-008', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-014', 'course-002', 'student-009', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-015', 'course-002', 'student-010', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-016', 'course-002', 'student-011', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-017', 'course-002', 'student-012', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-018', 'course-002', 'student-013', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-019', 'course-002', 'student-014', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-020', 'course-002', 'student-015', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-021', 'course-003', 'student-011', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-022', 'course-003', 'student-012', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-023', 'course-003', 'student-013', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-024', 'course-003', 'student-014', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-025', 'course-003', 'student-015', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-026', 'course-003', 'student-016', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-027', 'course-003', 'student-017', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('enroll-028', 'course-003', 'student-018', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
