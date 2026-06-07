-- 初始化系统用户
INSERT INTO sys_user (username, real_name, role, created_at) VALUES
('handler', '张经理', 'HANDLER', NOW()),
('reviewer', '李核赔', 'REVIEWER', NOW()),
('customer', '王客户', 'CUSTOMER', NOW());

-- 初始化材料类型
INSERT INTO material_type (type_code, type_name, insurance_type, required, sort_order) VALUES
('ID_CARD', '身份证', NULL, true, 1),
('POLICY_CERT', '保单凭证', NULL, true, 2),
('ACCIDENT_PROOF', '事故证明', NULL, true, 3),
('MEDICAL_RECORD', '病历资料', '健康险', true, 4),
('MEDICAL_INVOICE', '医疗费用发票', '健康险', true, 5),
('DISCHARGE_SUMMARY', '出院小结', '健康险', false, 6),
('PROPERTY_LIST', '财产损失清单', '财产险', true, 4),
('PROPERTY_INVOICE', '财产购置凭证', '财产险', false, 5),
('POLICE_REPORT', '警方报案证明', '车险', true, 4),
('DRIVING_LICENSE', '驾驶证', '车险', true, 5),
('VEHICLE_LICENSE', '行驶证', '车险', true, 6),
('MAINTENANCE_INVOICE', '维修发票', '车险', false, 7);

-- 初始化保单数据
INSERT INTO policy (policy_no, insurance_type, product_name, policyholder, insured_person, id_card, start_date, end_date, sum_insured, premium, status, coverage_details) VALUES
('HL20250100001', '健康险', '安心百万医疗险', '张明', '张明', '110101199001011234', '2025-01-01', '2026-01-01', 1000000.00, 299.00, 'EFFECTIVE', '一般医疗保险金300万，重疾医疗保险金600万，包含住院医疗、特殊门诊、门诊手术等'),
('HL20250200002', '健康险', '重疾保障计划', '李华', '李华', '310101198506152345', '2025-02-01', '2026-02-01', 500000.00, 1580.00, 'EFFECTIVE', '50种轻症+100种重疾保障，轻症赔付20%保额，重疾赔付100%保额'),
('PR20250300003', '财产险', '家庭财产综合险', '王强', '王强', '440101199203203456', '2025-03-01', '2026-03-01', 200000.00, 365.00, 'EFFECTIVE', '房屋及附属设施10万，室内财产5万，盗抢3万，水暖管爆裂2万'),
('CL20250400004', '车险', '机动车综合商业险', '赵刚', '赵刚', '510101198810104567', '2025-04-01', '2026-04-01', 300000.00, 2800.00, 'EFFECTIVE', '机动车损失险15万，第三者责任险100万，车上人员责任险5万/座*5座');

-- 案件1：正常赔付（健康险 - 已赔付）
INSERT INTO claim_case (case_no, policy_id, reporter_name, reporter_phone, accident_date, accident_type, accident_description, claim_amount, status, is_duplicate, frozen, handler_id, reviewer_id, register_time)
VALUES ('CL202510150001', 1, '张明', '13800138001', '2025-10-10', '疾病医疗', '因急性阑尾炎住院手术治疗', 35000.00, 'APPROVED', false, false, 1, 2, '2025-10-15 09:30:00');

INSERT INTO accident_info (claim_case_id, accident_location, injury_description, diagnosis_result, hospital_name, treatment_cost)
VALUES (1, '北京市海淀区', '腹痛3天，加重伴发热1天', '急性化脓性阑尾炎', '北京协和医院', 35000.00);

INSERT INTO claim_material (claim_case_id, material_type_id, material_name, file_path, file_name, status, uploaded_by, upload_time)
VALUES (1, 1, '身份证扫描件', '/files/1/id_card.jpg', '身份证扫描件.jpg', 'APPROVED', 3, '2025-10-15 09:35:00'),
       (1, 2, '保单凭证', '/files/1/policy.pdf', '保单凭证.pdf', 'APPROVED', 3, '2025-10-15 09:36:00'),
       (1, 4, '住院病历', '/files/1/medical_record.pdf', '住院病历.pdf', 'APPROVED', 3, '2025-10-15 09:37:00'),
       (1, 5, '医疗费用发票', '/files/1/invoice.pdf', '医疗费用发票.pdf', 'APPROVED', 3, '2025-10-15 09:38:00'),
       (1, 6, '出院小结', '/files/1/discharge.pdf', '出院小结.pdf', 'APPROVED', 3, '2025-10-15 09:39:00');

INSERT INTO claim_review (claim_case_id, reviewer_id, review_result, liability_judgment, approved_amount, review_remark, review_time)
VALUES (1, 2, 'APPROVED', '经审核，本次出险属于保险责任范围，被保险人因急性阑尾炎住院治疗，符合健康险理赔条件。材料齐全，事实清楚，同意赔付。', 28000.00, '扣除免赔额1万后按80%比例赔付', '2025-10-17 14:20:00');

INSERT INTO claim_history (claim_case_id, operation_type, operator_id, operator_name, remark, operation_time)
VALUES (1, 'REGISTER', 1, '张经理', '案件登记完成，案件号：CL202510150001', '2025-10-15 09:30:00'),
       (1, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：身份证扫描件', '2025-10-15 09:35:00'),
       (1, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：保单凭证', '2025-10-15 09:36:00'),
       (1, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：住院病历', '2025-10-15 09:37:00'),
       (1, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：医疗费用发票', '2025-10-15 09:38:00'),
       (1, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：出院小结', '2025-10-15 09:39:00'),
       (1, 'SUBMIT_REVIEW', 1, '张经理', '提交核赔', '2025-10-16 10:00:00'),
       (1, 'APPROVE', 2, '李核赔', '核赔通过，赔付金额：28000.00元', '2025-10-17 14:20:00');

-- 案件2：材料缺失（健康险 - 待补正）
INSERT INTO claim_case (case_no, policy_id, reporter_name, reporter_phone, accident_date, accident_type, accident_description, claim_amount, status, is_duplicate, frozen, handler_id, reviewer_id, register_time)
VALUES ('CL202511200002', 2, '李华', '13800138002', '2025-11-15', '疾病医疗', '体检发现甲状腺结节，进一步检查确诊为甲状腺乳头状癌', 150000.00, 'MATERIAL_MISSING', false, false, 1, 2, '2025-11-20 14:00:00');

INSERT INTO accident_info (claim_case_id, diagnosis_result, hospital_name, treatment_cost)
VALUES (2, '甲状腺乳头状癌', '上海肿瘤医院', 85000.00);

INSERT INTO claim_material (claim_case_id, material_type_id, material_name, file_path, file_name, status, review_remark, uploaded_by, upload_time, is_supplement)
VALUES (2, 1, '身份证扫描件', '/files/2/id_card.jpg', '身份证扫描件.jpg', 'APPROVED', '材料有效', 3, '2025-11-20 14:05:00', false),
       (2, 2, '保单凭证', '/files/2/policy.pdf', '保单凭证.pdf', 'APPROVED', '材料有效', 3, '2025-11-20 14:06:00', false),
       (2, 4, '病理报告', '/files/2/pathology.pdf', '病理报告.pdf', 'SUBMITTED', NULL, 3, '2025-11-20 14:07:00', false),
       (2, 5, '医疗费用发票', NULL, NULL, 'MISSING', NULL, 2, '2025-11-22 10:30:00', true),
       (2, 6, '出院小结', NULL, NULL, 'MISSING', NULL, 2, '2025-11-22 10:30:00', true);

INSERT INTO claim_history (claim_case_id, operation_type, operator_id, operator_name, remark, operation_time)
VALUES (2, 'REGISTER', 1, '张经理', '案件登记完成，案件号：CL202511200002', '2025-11-20 14:00:00'),
       (2, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：身份证扫描件', '2025-11-20 14:05:00'),
       (2, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：保单凭证', '2025-11-20 14:06:00'),
       (2, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：病理报告', '2025-11-20 14:07:00'),
       (2, 'SUBMIT_REVIEW', 1, '张经理', '提交核赔', '2025-11-21 09:00:00'),
       (2, 'MATERIAL_REQUEST', 2, '李核赔', '材料补正通知，缺失材料：医疗费用发票、出院小结；备注：请提供完整的住院费用明细及医保结算单', '2025-11-22 10:30:00');

-- 案件3：保单责任不符（财产险 - 已拒赔）
INSERT INTO claim_case (case_no, policy_id, reporter_name, reporter_phone, accident_date, accident_type, accident_description, claim_amount, status, is_duplicate, frozen, handler_id, reviewer_id, register_time)
VALUES ('CL202512050003', 3, '王强', '13800138003', '2025-12-01', '财产损失', '家中被盗，丢失笔记本电脑、手机等财物', 25000.00, 'REJECTED', false, false, 1, 2, '2025-12-05 11:00:00');

INSERT INTO accident_info (claim_case_id, accident_location, property_loss)
VALUES (3, '广州市天河区某小区', 25000.00);

INSERT INTO claim_material (claim_case_id, material_type_id, material_name, file_path, file_name, status, uploaded_by, upload_time)
VALUES (3, 1, '身份证扫描件', '/files/3/id_card.jpg', '身份证扫描件.jpg', 'APPROVED', 3, '2025-12-05 11:10:00'),
       (3, 2, '保单凭证', '/files/3/policy.pdf', '保单凭证.pdf', 'APPROVED', 3, '2025-12-05 11:11:00'),
       (3, 3, '警方报案回执', '/files/3/police_report.jpg', '警方报案回执.jpg', 'APPROVED', 3, '2025-12-05 11:12:00'),
       (3, 7, '财产损失清单', '/files/3/property_list.xlsx', '财产损失清单.xlsx', 'APPROVED', 3, '2025-12-05 11:13:00');

INSERT INTO claim_review (claim_case_id, reviewer_id, review_result, liability_judgment, reject_reason, review_remark, review_time)
VALUES (3, 2, 'REJECTED', '经审核，保单约定盗抢险保额为3万元，且需提供警方立案证明。本次索赔金额25000元，但仅提供了报案回执，未提供警方立案证明。另外，经核实，被保险人房屋为出租屋，未履行如实告知义务，保单特别约定仅承保自有房屋。', '保单责任不符', '非自有房屋，且缺少立案证明，不符合理赔条件', '2025-12-08 15:45:00');

INSERT INTO claim_history (claim_case_id, operation_type, operator_id, operator_name, remark, operation_time)
VALUES (3, 'REGISTER', 1, '张经理', '案件登记完成，案件号：CL202512050003', '2025-12-05 11:00:00'),
       (3, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：身份证扫描件', '2025-12-05 11:10:00'),
       (3, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：保单凭证', '2025-12-05 11:11:00'),
       (3, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：警方报案回执', '2025-12-05 11:12:00'),
       (3, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：财产损失清单', '2025-12-05 11:13:00'),
       (3, 'SUBMIT_REVIEW', 1, '张经理', '提交核赔', '2025-12-06 10:00:00'),
       (3, 'REJECT', 2, '李核赔', '拒赔，原因：保单责任不符', '2025-12-08 15:45:00');

-- 案件4：重复报案（车险 - 已冻结 - 案件A）
INSERT INTO claim_case (case_no, policy_id, reporter_name, reporter_phone, accident_date, accident_type, accident_description, claim_amount, status, is_duplicate, frozen, freeze_reason, handler_id, register_time)
VALUES ('CL202512100004', 4, '赵刚', '13800138004', '2025-12-08', '车险事故', '在路口与一辆电动车发生碰撞，造成车辆损失和人伤', 85000.00, 'REGISTERED', true, true, '存在关联报案，需人工核实', 1, '2025-12-10 08:30:00');

INSERT INTO accident_info (claim_case_id, accident_location, injury_description, hospital_name, property_loss, treatment_cost)
VALUES (4, '成都市武侯区', '电动车驾驶员腿部擦伤', '成都市第一人民医院', 35000.00, 5000.00);

INSERT INTO claim_material (claim_case_id, material_type_id, material_name, file_path, file_name, status, uploaded_by, upload_time)
VALUES (4, 1, '身份证扫描件', '/files/4/id_card.jpg', '身份证扫描件.jpg', 'SUBMITTED', 3, '2025-12-10 08:35:00'),
       (4, 2, '保单凭证', '/files/4/policy.pdf', '保单凭证.pdf', 'SUBMITTED', 3, '2025-12-10 08:36:00'),
       (4, 9, '警方事故认定书', '/files/4/police_report.pdf', '事故认定书.pdf', 'SUBMITTED', 3, '2025-12-10 08:37:00');

-- 案件5：重复报案（车险 - 已冻结 - 案件B，与案件4重复）
INSERT INTO claim_case (case_no, policy_id, reporter_name, reporter_phone, accident_date, accident_type, accident_description, claim_amount, status, is_duplicate, frozen, freeze_reason, handler_id, register_time)
VALUES ('CL202512100005', 4, '赵刚', '13800138004', '2025-12-08', '车险事故', '车辆与电动车相撞事故索赔', 90000.00, 'REGISTERED', true, true, '存在关联报案，需人工核实', 1, '2025-12-10 09:15:00');

INSERT INTO accident_info (claim_case_id, accident_location, injury_description, property_loss)
VALUES (5, '成都市武侯区', '对方人伤', 40000.00);

INSERT INTO claim_material (claim_case_id, material_type_id, material_name, file_path, file_name, status, uploaded_by, upload_time)
VALUES (5, 1, '身份证扫描件', '/files/5/id_card.jpg', '身份证扫描件.jpg', 'SUBMITTED', 3, '2025-12-10 09:20:00'),
       (5, 10, '驾驶证', '/files/5/driving_license.jpg', '驾驶证.jpg', 'SUBMITTED', 3, '2025-12-10 09:21:00');

-- 关联案件关系
INSERT INTO related_claim (main_case_id, related_case_id, relation_type, created_at)
VALUES (4, 5, 'DUPLICATE', NOW()),
       (5, 4, 'DUPLICATE', NOW());

-- 案件4、5的冻结历史
INSERT INTO claim_history (claim_case_id, operation_type, operator_id, operator_name, remark, operation_time)
VALUES (4, 'REGISTER', 1, '张经理', '案件登记完成，案件号：CL202512100004', '2025-12-10 08:30:00'),
       (4, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：身份证扫描件', '2025-12-10 08:35:00'),
       (4, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：保单凭证', '2025-12-10 08:36:00'),
       (4, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：警方事故认定书', '2025-12-10 08:37:00'),
       (4, 'FREEZE', NULL, '系统', '检测到重复报案，案件已冻结，关联案件数：1', '2025-12-10 09:15:00'),
       (5, 'REGISTER', 1, '张经理', '案件登记完成，案件号：CL202512100005', '2025-12-10 09:15:00'),
       (5, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：身份证扫描件', '2025-12-10 09:20:00'),
       (5, 'MATERIAL_UPLOAD', 3, '王客户', '上传材料：驾驶证', '2025-12-10 09:21:00'),
       (5, 'FREEZE', NULL, '系统', '检测到重复报案，案件已冻结，关联案件数：1', '2025-12-10 09:15:00');

-- 更新序列，确保后续插入不会出现主键冲突
SELECT setval('sys_user_id_seq', (SELECT MAX(id) FROM sys_user));
SELECT setval('material_type_id_seq', (SELECT MAX(id) FROM material_type));
SELECT setval('policy_id_seq', (SELECT MAX(id) FROM policy));
SELECT setval('claim_case_id_seq', (SELECT MAX(id) FROM claim_case));
SELECT setval('accident_info_id_seq', (SELECT MAX(id) FROM accident_info));
SELECT setval('claim_material_id_seq', (SELECT MAX(id) FROM claim_material));
SELECT setval('claim_review_id_seq', (SELECT MAX(id) FROM claim_review));
SELECT setval('claim_history_id_seq', (SELECT MAX(id) FROM claim_history));
SELECT setval('related_claim_id_seq', (SELECT MAX(id) FROM related_claim));
