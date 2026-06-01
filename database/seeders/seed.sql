INSERT OR IGNORE INTO users (id, name, email, password, role, phone, address) VALUES
(1, '系统管理员', 'admin@example.com', 'admin123', 'admin', '13800000000', '合作社总部'),
(2, '张三（农户）', 'farmer1@example.com', 'farmer123', 'farmer', '13800000001', '东村村东头1号'),
(3, '李四（农户）', 'farmer2@example.com', 'farmer123', 'farmer', '13800000002', '西村村西头2号'),
(4, '王师傅（农机手）', 'operator1@example.com', 'operator123', 'operator', '13800000003', '农机站宿舍1号'),
(5, '刘师傅（农机手）', 'operator2@example.com', 'operator123', 'operator', '13800000004', '农机站宿舍2号'),
(6, '赵会计（财务）', 'finance@example.com', 'finance123', 'finance', '13800000005', '财务室1号');

INSERT OR IGNORE INTO fields (id, farmer_id, name, location, area, crop_type, soil_type, status, notes) VALUES
(1, 2, '东大田', '东村东边', 50.5, '小麦', '壤土', 'active', '灌溉条件良好'),
(2, 2, '北坡地', '东村北边', 30.0, '玉米', '沙壤土', 'active', '坡度较大'),
(3, 3, '西洼田', '西村西边', 45.0, '水稻', '黏土', 'active', '水田'),
(4, 3, '南滩地', '南村南边', 60.0, '棉花', '沙壤土', 'active', '靠近河道');

INSERT OR IGNORE INTO machines (id, name, type, model, plate_number, operator_id, fuel_consumption, status, notes) VALUES
(1, '东方红拖拉机1号', '拖拉机', '东方红LX804', '农01-001', 4, 8.5, 'available', '车况良好'),
(2, '东方红拖拉机2号', '拖拉机', '东方红LX904', '农01-002', 5, 9.2, 'available', '新购入'),
(3, '收割机1号', '收割机', '久保田PRO100', '农01-003', 4, 12.0, 'available', '收割专用'),
(4, '播种机1号', '播种机', '约翰迪尔', '农01-004', NULL, 5.0, 'available', '免耕播种');

INSERT OR IGNORE INTO bookings (id, booking_no, farmer_id, field_id, operation_type, requested_date, area, status, priority, notes) VALUES
(1, 'BK20240601001', 2, 1, 'plowing', '2024-06-10', 50.5, 'confirmed', 'high', '需要深耕'),
(2, 'BK20240601002', 2, 2, 'planting', '2024-06-15', 30.0, 'pending', 'normal', '播种玉米'),
(3, 'BK20240601003', 3, 3, 'harvesting', '2024-06-20', 45.0, 'scheduled', 'normal', '水稻收割'),
(4, 'BK20240601004', 3, 4, 'plowing', '2024-06-25', 60.0, 'completed', 'low', '棉田翻耕');

INSERT OR IGNORE INTO schedules (id, booking_id, machine_id, operator_id, scheduled_date, start_time, end_time, status, notes) VALUES
(1, 1, 1, 4, '2024-06-10', '08:00', '12:00', 'completed', '上午作业'),
(2, 3, 3, 5, '2024-06-20', '07:00', '17:00', 'scheduled', '全天作业'),
(3, 4, 2, 4, '2024-06-25', '09:00', '15:00', 'completed', '下午作业');

INSERT OR IGNORE INTO job_records (id, schedule_id, checkin_time, checkout_time, actual_area, fuel_used, quality_rating, status, inspector_id, inspection_notes, inspected_at) VALUES
(1, 1, '2024-06-10 08:05:00', '2024-06-10 11:50:00', 50.5, 42.0, 5, 'approved', 1, '作业质量优秀', '2024-06-10 14:00:00'),
(2, 3, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, NULL),
(3, 3, '2024-06-25 09:10:00', '2024-06-25 14:55:00', 60.0, 55.0, 4, 'pending', NULL, NULL, NULL);

INSERT OR IGNORE INTO subsidies (id, subsidy_no, job_record_id, operation_type, area, fuel_subsidy_rate, fuel_subsidy_amount, operation_subsidy_rate, operation_subsidy_amount, total_subsidy, status, approved_by, approved_at, notes) VALUES
(1, 'SUB202406001', 1, 'plowing', 50.5, 10.0, 420.00, 20.0, 1010.00, 1430.00, 'approved', 1, '2024-06-11 10:00:00', '油补已核算'),
(2, 'SUB202406002', 3, 'plowing', 60.0, 10.0, 550.00, 20.0, 1200.00, 1750.00, 'pending', NULL, NULL, '待审核');

INSERT OR IGNORE INTO settlements (id, settlement_no, farmer_id, subsidy_id, operation_fee, fuel_cost, subsidy_amount, total_amount, status, paid_at, payment_method, transaction_no, notes) VALUES
(1, 'SET202406001', 2, 1, 1515.00, 336.00, 1430.00, 421.00, 'paid', '2024-06-12 09:00:00', 'bank_transfer', 'TXN20240612001', '已转账支付'),
(2, 'SET202406002', 3, 2, 1800.00, 440.00, 1750.00, 490.00, 'unpaid', NULL, NULL, NULL, '待支付');

INSERT OR IGNORE INTO exceptions (id, exception_no, schedule_id, job_record_id, reporter_id, type, title, description, status, handler_id, resolution, resolved_at) VALUES
(1, 'EXC202406001', 1, 1, 4, 'machine_failure', '拖拉机故障', '作业中途拖拉机出现异响，临时停车检查', 'resolved', 1, '已更换皮带，问题解决', '2024-06-10 10:30:00'),
(2, 'EXC202406002', NULL, NULL, 2, 'weather', '下雨延误', '预约当天下雨，无法作业', 'open', NULL, NULL, NULL);
